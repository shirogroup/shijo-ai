/**
 * AI Tools Usage Tracking
 *
 * Handles plan-based access control and usage metering for the 24 AI tools.
 *
 * Free:       5 tools, 3 gens/day, Haiku only
 * Pro:        24 tools, 200 gens/month, Sonnet for complex tools
 * Enterprise: 24 tools, unlimited, Sonnet for complex tools
 */

import { db } from '@/db';
import { users, usageLogs, dailyLimits } from '@/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getToolById, getFreeTools } from '@/lib/tools/registry';
import type { PlanAccess, ModelTier } from '@/lib/tools/registry';

// ─── Plan limits ──────────────────────────────────────────────────────
export const TOOL_LIMITS = {
  free: {
    dailyGenerations: 3,
    monthlyGenerations: 0,    // not used; free uses daily
    forcedModel: 'haiku' as ModelTier,
  },
  pro: {
    dailyGenerations: 0,      // not used; pro uses monthly
    monthlyGenerations: 200,
    forcedModel: null,         // uses tool's configured model
  },
  enterprise: {
    dailyGenerations: 0,
    monthlyGenerations: -1,   // -1 = unlimited
    forcedModel: null,
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────
export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  period?: 'day' | 'month';
  upgradePrompt?: string;
  effectiveModel?: ModelTier;
}

export interface UsageStats {
  plan: string;
  period: 'day' | 'month';
  used: number;
  limit: number;       // -1 = unlimited
  remaining: number;   // -1 = unlimited
  resetLabel: string;  // e.g. "Resets at midnight" or "Resets Apr 1"
}

// ─── Free tool IDs (cached) ──────────────────────────────────────────
const FREE_TOOL_IDS = new Set(getFreeTools().map((t) => t.id));

// ─── Check whether the user can use a tool ───────────────────────────
export async function checkToolAccess(
  userId: string,
  toolId: string
): Promise<UsageCheckResult> {
  // 1. Validate tool
  const tool = getToolById(toolId);
  if (!tool) {
    return { allowed: false, reason: 'Unknown tool' };
  }

  // 2. Get user plan
  const [user] = await db
    .select({ planTier: users.planTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const plan = (user.planTier || 'free') as PlanAccess;

  // 3. Plan-level tool access check
  if (plan === 'free' && tool.minPlan !== 'free') {
    return {
      allowed: false,
      reason: 'This tool requires a paid plan',
      upgradePrompt: `Upgrade to ${tool.minPlan === 'pro' ? 'Pro ($29/mo)' : 'Enterprise ($99/mo)'} to unlock ${tool.name}`,
    };
  }
  if (plan === 'pro' && tool.minPlan === 'enterprise') {
    return {
      allowed: false,
      reason: 'This tool requires an Enterprise plan',
      upgradePrompt: `Upgrade to Enterprise ($99/mo) to unlock ${tool.name}`,
    };
  }

  // 4. Usage limits
  const limits = TOOL_LIMITS[plan];

  if (plan === 'free') {
    // Daily limit check
    const today = new Date().toISOString().split('T')[0];
    const [row] = await db
      .select()
      .from(dailyLimits)
      .where(
        and(
          eq(dailyLimits.userId, userId),
          eq(dailyLimits.feature, 'ai-tools'),
          eq(dailyLimits.date, today)
        )
      )
      .limit(1);

    const used = row?.usageCount ?? 0;
    const limit = limits.dailyGenerations;

    if (used >= limit) {
      return {
        allowed: false,
        reason: 'Daily limit reached',
        remaining: 0,
        limit,
        period: 'day',
        upgradePrompt: 'Upgrade to Pro ($29/mo) for 200 generations/month across all 24 tools',
      };
    }

    return {
      allowed: true,
      remaining: limit - used,
      limit,
      period: 'day',
      effectiveModel: 'haiku',
    };
  }

  if (plan === 'pro') {
    // Monthly limit check
    const monthStart = getMonthStart();
    const [row] = await db
      .select({ total: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          eq(usageLogs.feature, 'ai-tools'),
          sql`${usageLogs.createdAt} >= ${monthStart}`
        )
      );

    const used = row?.total ?? 0;
    const limit = limits.monthlyGenerations;

    if (used >= limit) {
      return {
        allowed: false,
        reason: 'Monthly limit reached',
        remaining: 0,
        limit,
        period: 'month',
        upgradePrompt: 'Upgrade to Enterprise ($99/mo) for unlimited generations',
      };
    }

    return {
      allowed: true,
      remaining: limit - used,
      limit,
      period: 'month',
      effectiveModel: tool.modelTier,
    };
  }

  // Enterprise — unlimited
  return {
    allowed: true,
    remaining: -1,
    limit: -1,
    period: 'month',
    effectiveModel: tool.modelTier,
  };
}

// ─── Record a generation ─────────────────────────────────────────────
export async function recordToolUsage(
  userId: string,
  toolId: string,
  model: string,
  tokensUsed: number
): Promise<void> {
  const [user] = await db
    .select({ planTier: users.planTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = user?.planTier || 'free';

  // Log to usageLogs (all plans)
  await db.insert(usageLogs).values({
    userId,
    feature: 'ai-tools',
    action: toolId,
    creditsUsed: 0,
    metadata: { model, tokensUsed },
  });

  // Increment daily counter (free plan)
  if (plan === 'free') {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db
      .select()
      .from(dailyLimits)
      .where(
        and(
          eq(dailyLimits.userId, userId),
          eq(dailyLimits.feature, 'ai-tools'),
          eq(dailyLimits.date, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(dailyLimits)
        .set({ usageCount: sql`${dailyLimits.usageCount} + 1` })
        .where(
          and(
            eq(dailyLimits.userId, userId),
            eq(dailyLimits.feature, 'ai-tools'),
            eq(dailyLimits.date, today)
          )
        );
    } else {
      await db.insert(dailyLimits).values({
        userId,
        feature: 'ai-tools',
        date: today,
        usageCount: 1,
      });
    }
  }
}

// ─── Get usage stats for dashboard display ───────────────────────────
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const [user] = await db
    .select({ planTier: users.planTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.planTier || 'free') as PlanAccess;
  const limits = TOOL_LIMITS[plan];

  if (plan === 'free') {
    const today = new Date().toISOString().split('T')[0];
    const [row] = await db
      .select()
      .from(dailyLimits)
      .where(
        and(
          eq(dailyLimits.userId, userId),
          eq(dailyLimits.feature, 'ai-tools'),
          eq(dailyLimits.date, today)
        )
      )
      .limit(1);

    const used = row?.usageCount ?? 0;
    return {
      plan,
      period: 'day',
      used,
      limit: limits.dailyGenerations,
      remaining: limits.dailyGenerations - used,
      resetLabel: 'Resets at midnight',
    };
  }

  if (plan === 'pro') {
    const monthStart = getMonthStart();
    const [row] = await db
      .select({ total: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          eq(usageLogs.feature, 'ai-tools'),
          sql`${usageLogs.createdAt} >= ${monthStart}`
        )
      );

    const used = row?.total ?? 0;
    return {
      plan,
      period: 'month',
      used,
      limit: limits.monthlyGenerations,
      remaining: limits.monthlyGenerations - used,
      resetLabel: `Resets ${getNextMonthLabel()}`,
    };
  }

  // Enterprise
  return {
    plan,
    period: 'month',
    used: 0,
    limit: -1,
    remaining: -1,
    resetLabel: 'Unlimited',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────
function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getNextMonthLabel(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
