import { db } from '@/db';
import { userQuotas, dailyLimits, burstAllowances, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Feature limits by plan tier
const PLAN_QUOTAS = {
  free: {
    seedKeywords: 10000,
    expansions: 0, // 3/day handled separately
    clustering: 0, // 1/day handled separately
    briefs: 0,
    audits: 0, // 1/day handled separately
    metaGen: 1000,
    aeo: 0,
    searchVolume: 0,
    serpSnapshots: 0,
    aiVisibility: 0,
    aiSimulator: 0,
    predictiveSeo: 0,
  },
  pro: {
    seedKeywords: 10000,
    expansions: 100,
    clustering: 50,
    briefs: 300,
    audits: 50,
    metaGen: 1000,
    aeo: 100,
    searchVolume: 500,
    serpSnapshots: 100,
    aiVisibility: 0,
    aiSimulator: 0,
    predictiveSeo: 0,
  },
  enterprise: {
    seedKeywords: 10000,
    expansions: 5000,
    clustering: 500,
    briefs: 2000,
    audits: 500,
    metaGen: 10000,
    aeo: 1000,
    searchVolume: 5000,
    serpSnapshots: 1000,
    aiVisibility: 2,
    aiSimulator: 100,
    predictiveSeo: 200,
  },
} as const;

const DAILY_LIMITS = {
  free: {
    expansions: 3,
    clustering: 1,
    audits: 1,
  },
} as const;

const BURST_ALLOWANCES = {
  pro: {
    expansions: 25,
    briefs: 50,
    audits: 10,
    searchVolume: 100,
    serpSnapshots: 20,
  },
  enterprise: {
    expansions: 500,
    briefs: 400,
    audits: 100,
    searchVolume: 1000,
    serpSnapshots: 200,
    aiSimulator: 20,
    predictiveSeo: 40,
  },
} as const;

const CREDIT_COSTS = {
  expansion: 3,
  clustering: 5,
  serpSnapshot: 10,
  searchVolume: 5,
  pageAudit: 50,
  rankSnapshot: 50,
} as const;

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remainingQuota?: number;
  upgradePrompt?: string;
  burstUsed?: boolean;
}

export async function checkFeatureQuota(
  userId: string,
  feature: string,
  creditCost?: number
): Promise<QuotaCheckResult> {
  
  // Get user and quota info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    return {
      allowed: false,
      reason: 'User not found',
    };
  }

  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, userId))
    .limit(1);
  
  if (!quota) {
    return {
      allowed: false,
      reason: 'User quota not found',
      upgradePrompt: 'Please contact support',
    };
  }
  
  // Use planTier from users table with null check and default
  const planTier = (user.planTier || 'free') as 'free' | 'pro' | 'enterprise';
  
  // FREE TIER - Check daily limits
  if (planTier === 'free') {
    const dailyLimit = DAILY_LIMITS.free[feature as keyof typeof DAILY_LIMITS.free];
    
    if (dailyLimit !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      
      const [dailyUsage] = await db
        .select()
        .from(dailyLimits)
        .where(
          and(
            eq(dailyLimits.userId, userId),
            eq(dailyLimits.feature, feature),
            eq(dailyLimits.date, today)
          )
        )
        .limit(1);
      
      const currentUsage = dailyUsage?.usageCount ?? 0;
      
      if (currentUsage >= dailyLimit) {
        return {
          allowed: false,
          reason: 'Daily limit reached',
          upgradePrompt: `Upgrade to Pro for ${PLAN_QUOTAS.pro[feature as keyof typeof PLAN_QUOTAS.pro] || 'unlimited'} ${feature}s per month`,
        };
      }
      
      return {
        allowed: true,
        remainingQuota: dailyLimit - currentUsage,
      };
    }
  }
  
  // MONTHLY QUOTA CHECKS (Pro & Enterprise)
  if (planTier !== 'free') {
    // Map feature name to quota field names
    const quotaFieldMap: Record<string, { used: keyof typeof quota; quota: keyof typeof quota }> = {
      expansions: { used: 'expansionsUsed', quota: 'expansionsQuota' },
      clustering: { used: 'clusteringUsed', quota: 'clusteringQuota' },
      briefs: { used: 'briefsUsed', quota: 'briefsQuota' },
      audits: { used: 'auditsUsed', quota: 'auditsQuota' },
      metaGen: { used: 'metaGenUsed', quota: 'metaGenQuota' },
      aeo: { used: 'aeoUsed', quota: 'aeoQuota' },
      searchVolume: { used: 'searchVolumeUsed', quota: 'searchVolumeQuota' },
      serpSnapshots: { used: 'serpSnapshotsUsed', quota: 'serpSnapshotsQuota' },
      aiVisibility: { used: 'aiVisibilityScansUsed', quota: 'aiVisibilityScansQuota' },
      aiSimulator: { used: 'aiSimulatorUsed', quota: 'aiSimulatorQuota' },
      predictiveSeo: { used: 'predictiveSeoUsed', quota: 'predictiveSeoQuota' },
    };
    
    const fields = quotaFieldMap[feature];
    
    if (fields) {
      // Handle nullable fields with defaults
      const quotaUsed = (quota[fields.used] as number | null) ?? 0;
      const quotaLimit = (quota[fields.quota] as number | null) ?? 0;
      
      if (quotaLimit > 0) {
        // Check if base quota exceeded
        if (quotaUsed >= quotaLimit) {
          // Check burst eligibility
          const [burst] = await db
            .select()
            .from(burstAllowances)
            .where(eq(burstAllowances.userId, userId))
            .limit(1);
          
          if (burst && (burst.burstEligible ?? false)) {
            const burstLimit = BURST_ALLOWANCES[planTier as 'pro' | 'enterprise']?.[feature as keyof typeof BURST_ALLOWANCES.pro] || 0;
            const totalLimit = quotaLimit + burstLimit;
            
            if (quotaUsed < totalLimit) {
              return {
                allowed: true,
                remainingQuota: totalLimit - quotaUsed,
                upgradePrompt: `You're using bonus capacity. Upgrade to ${planTier === 'pro' ? 'Enterprise' : 'custom plan'} for higher limits.`,
                burstUsed: true,
              };
            }
          }
          
          // Hard limit reached
          return {
            allowed: false,
            reason: 'Monthly quota exceeded',
            upgradePrompt: planTier === 'pro' 
              ? 'Upgrade to Enterprise for 50× more capacity'
              : 'Contact sales for custom enterprise pricing',
          };
        }
        
        // Soft warning at 80%
        if (quotaUsed >= quotaLimit * 0.8) {
          return {
            allowed: true,
            remainingQuota: quotaLimit - quotaUsed,
            upgradePrompt: `You've used ${Math.round((quotaUsed / quotaLimit) * 100)}% of your ${feature} quota. Consider upgrading.`,
          };
        }
        
        return {
          allowed: true,
          remainingQuota: quotaLimit - quotaUsed,
        };
      }
    }
  }
  
  // CREDIT-BASED FEATURES - Handle nullable creditsBalance
  if (creditCost && creditCost > 0) {
    const currentCredits = quota.creditsBalance ?? 0;
    
    if (currentCredits < creditCost) {
      return {
        allowed: false,
        reason: 'Insufficient credits',
        upgradePrompt: `This feature costs ${creditCost} credits. Purchase credits to continue.`,
      };
    }
  }
  
  return { allowed: true };
}

export async function deductUsage(
  userId: string,
  feature: string,
  creditCost: number = 0
): Promise<void> {
  const [user] = await db
    .select({ planTier: users.planTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const planTier = user.planTier || 'free';
  
  if (planTier === 'free') {
    // Update daily limit
    const today = new Date().toISOString().split('T')[0];
    
    // Use the correct approach for INSERT ... ON CONFLICT
    const existing = await db
      .select()
      .from(dailyLimits)
      .where(
        and(
          eq(dailyLimits.userId, userId),
          eq(dailyLimits.feature, feature),
          eq(dailyLimits.date, today)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(dailyLimits)
        .set({
          usageCount: sql`${dailyLimits.usageCount} + 1`,
        })
        .where(
          and(
            eq(dailyLimits.userId, userId),
            eq(dailyLimits.feature, feature),
            eq(dailyLimits.date, today)
          )
        );
    } else {
      await db.insert(dailyLimits).values({
        userId,
        feature,
        date: today,
        usageCount: 1,
      });
    }
  } else {
    // Update monthly quota
    const quotaFieldMap: Record<string, string> = {
      expansions: 'expansionsUsed',
      clustering: 'clusteringUsed',
      briefs: 'briefsUsed',
      audits: 'auditsUsed',
      metaGen: 'metaGenUsed',
      aeo: 'aeoUsed',
      searchVolume: 'searchVolumeUsed',
      serpSnapshots: 'serpSnapshotsUsed',
      aiVisibility: 'aiVisibilityScansUsed',
      aiSimulator: 'aiSimulatorUsed',
      predictiveSeo: 'predictiveSeoUsed',
    };
    
    const usedField = quotaFieldMap[feature];
    
    if (usedField) {
      const fieldKey = usedField as keyof typeof userQuotas;
      
      await db
        .update(userQuotas)
        .set({
          [usedField]: sql`COALESCE(${userQuotas[fieldKey]}, 0) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userQuotas.userId, userId));
    }
  }
  
  // Deduct credits if applicable - Handle nullable creditsBalance
  if (creditCost > 0) {
    await db
      .update(userQuotas)
      .set({
        creditsBalance: sql`COALESCE(${userQuotas.creditsBalance}, 0) - ${creditCost}`,
        updatedAt: new Date(),
      })
      .where(eq(userQuotas.userId, userId));
  }
}

export async function calculateBurstEligibility(userId: string): Promise<boolean> {
  const [burst] = await db
    .select()
    .from(burstAllowances)
    .where(eq(burstAllowances.userId, userId))
    .limit(1);
  
  if (!burst) return false;
  
  return (
    (burst.tenureDays ?? 0) >= 90 &&
    (burst.paymentHealth ?? false) === true &&
    (burst.avgUsagePercent ?? 100) < 80
  );
}

export { PLAN_QUOTAS, DAILY_LIMITS, BURST_ALLOWANCES, CREDIT_COSTS };
