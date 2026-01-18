// lib/usage.ts
import { db } from '@/db/client';
import { usageLogs, subscriptions, credits, rateLimits } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

// Feature limits
const FREEMIUM_LIMITS: Record<string, { daily?: number; monthly?: number }> = {
  keyword_expansion: { daily: 3 },
  content_brief: { daily: 1 },
  keyword_clustering: { daily: 1 },
  page_audit: { daily: 1 },
  intent_classification: { daily: 100 }, // Rate limited, not hard capped
};

const PRO_LIMITS: Record<string, { monthly: number | 'unlimited' }> = {
  keyword_expansion: { monthly: 100 },
  content_brief: { monthly: 'unlimited' },
  keyword_clustering: { monthly: 50 },
  page_audit: { monthly: 50 },
};

interface AccessCheckResult {
  allowed: boolean;
  message?: string;
  upgrade?: boolean;
  deductCredits?: boolean;
}

export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<AccessCheckResult> {
  // Get user subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!subscription) {
    return {
      allowed: false,
      message: 'No subscription found',
      upgrade: true,
    };
  }

  // Free tier
  if (subscription.plan === 'free') {
    const limit = FREEMIUM_LIMITS[feature];
    
    if (!limit) {
      return { allowed: false, message: 'Feature not available on free plan', upgrade: true };
    }

    // Check daily limit
    if (limit.daily) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [result] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, userId),
            eq(usageLogs.feature, feature),
            gte(usageLogs.createdAt, today)
          )
        );

      const count = result?.count || 0;

      if (count >= limit.daily) {
        return {
          allowed: false,
          message: `Daily limit reached (${limit.daily}/${limit.daily}). Upgrade to Pro for more.`,
          upgrade: true,
        };
      }
    }

    return { allowed: true, deductCredits: false };
  }

  // Pro tier
  if (subscription.plan === 'pro') {
    const limit = PRO_LIMITS[feature];

    if (!limit || limit.monthly === 'unlimited') {
      return { allowed: true, deductCredits: false };
    }

    // Check monthly limit
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          eq(usageLogs.feature, feature),
          gte(usageLogs.createdAt, monthStart)
        )
      );

    const count = result?.count || 0;

    if (count >= limit.monthly) {
      return {
        allowed: false,
        message: `Monthly limit reached (${limit.monthly}/${limit.monthly}).`,
        upgrade: false,
      };
    }

    return { allowed: true, deductCredits: false };
  }

  // Enterprise tier - unlimited
  if (subscription.plan === 'enterprise') {
    return { allowed: true, deductCredits: false };
  }

  return { allowed: false, message: 'Invalid subscription plan', upgrade: true };
}

export async function logUsage(
  userId: string,
  feature: string,
  metadata?: any
): Promise<void> {
  await db.insert(usageLogs).values({
    userId,
    feature,
    creditsUsed: 0,
    costUsd: '0',
    metadata: metadata || {},
  });
}

export async function deductCredits(
  userId: string,
  amount: number
): Promise<void> {
  await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} - ${amount}`,
      totalConsumed: sql`${credits.totalConsumed} + ${amount}`,
    })
    .where(eq(credits.userId, userId));
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<void> {
  await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} + ${amount}`,
      totalPurchased: sql`${credits.totalPurchased} + ${amount}`,
    })
    .where(eq(credits.userId, userId));
}

export async function getUserCredits(userId: string): Promise<number> {
  const userCredits = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });

  return userCredits?.balance || 0;
}
