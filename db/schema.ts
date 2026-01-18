// db/schema.ts
import { pgTable, uuid, varchar, timestamp, integer, boolean, decimal, jsonb, text } from 'drizzle-orm/pg-core';

// ============================================
// PHASE 0: FOUNDATION
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false),
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthId: varchar('oauth_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: integer('balance').default(0),
  totalPurchased: integer('total_purchased').default(0),
  totalConsumed: integer('total_consumed').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  feature: varchar('feature', { length: 100 }).notNull(),
  creditsUsed: integer('credits_used').default(0),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  phase1Enabled: boolean('phase1_enabled').default(true),
  phase2Enabled: boolean('phase2_enabled').default(false),
  phase3Enabled: boolean('phase3_enabled').default(false),
  phase4Enabled: boolean('phase4_enabled').default(false),
  phase5Enabled: boolean('phase5_enabled').default(false),
  phase6Enabled: boolean('phase6_enabled').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  feature: varchar('feature', { length: 100 }).notNull(),
  dailyLimit: integer('daily_limit').notNull(),
  dailyUsed: integer('daily_used').default(0),
  resetAt: timestamp('reset_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// PHASE 1: KEYWORD RESEARCH
// ============================================

export const keywords = pgTable('keywords', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  keyword: varchar('keyword', { length: 500 }).notNull(),
  language: varchar('language', { length: 10 }).default('en'),
  country: varchar('country', { length: 10 }).default('us'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const keywordExpansions = pgTable('keyword_expansions', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  expansion: varchar('expansion', { length: 500 }).notNull(),
  method: varchar('method', { length: 50 }).default('claude'),
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const keywordIntents = pgTable('keyword_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  intent: varchar('intent', { length: 50 }).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  reasoning: text('reasoning'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const keywordClusters = pgTable('keyword_clusters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  clusterName: varchar('cluster_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const keywordClusterMembers = pgTable('keyword_cluster_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  clusterId: uuid('cluster_id').references(() => keywordClusters.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const keywordOpportunities = pgTable('keyword_opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  explanation: text('explanation'),
  factors: jsonb('factors'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Credit = typeof credits.$inferSelect;
export type Keyword = typeof keywords.$inferSelect;
export type KeywordExpansion = typeof keywordExpansions.$inferSelect;
export type KeywordIntent = typeof keywordIntents.$inferSelect;
