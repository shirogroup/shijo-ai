import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, date, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================================
// FOUNDATION TABLES
// ========================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  name: varchar('name', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  planTier: varchar('plan_tier', { length: 20 }).default('free').notNull(),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  // Soft email verification (2026-07-19) — a trust signal only, never gates
  // login or tool access. emailVerificationToken is single-use and cleared
  // on success; emailVerifiedIp captures the IP at confirmation time
  // (separate from termsAcceptances.ipAddress, which is captured at signup)
  // specifically so a mismatch between signup IP and confirm IP is visible
  // for fraud review.
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationSentAt: timestamp('email_verification_sent_at'),
  emailVerifiedAt: timestamp('email_verified_at'),
  emailVerifiedIp: varchar('email_verified_ip', { length: 64 }),
  // Signup origin, captured at registration and stored ON THE USER ROW
  // (added 2026-08-22). This duplicates termsAcceptances.ipAddress on
  // purpose: during the abuse cleanup, deleting users cascaded away the
  // acceptance rows and with them every attacker IP, leaving the incident
  // un-investigable (KB §44.5). Keeping a copy here means abuse triage
  // survives as long as the account does, and the admin signups review
  // (app/admin/signups) has something to cluster on.
  signupIp: varchar('signup_ip', { length: 64 }),
  signupUserAgent: text('signup_user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  stripeIdx: index('idx_users_stripe').on(table.stripeCustomerId),
  emailVerificationTokenIdx: index('idx_users_email_verification_token').on(table.emailVerificationToken),
  signupIpIdx: index('idx_users_signup_ip').on(table.signupIp),
  createdAtIdx: index('idx_users_created_at').on(table.createdAt),
}));

// Audit log of Terms of Service / Privacy Policy acceptances.
// Kept as a standalone append-only table (rather than columns on `users`)
// so re-acceptance after a document update creates a new row instead of
// overwriting the prior record — the admin panel at /admin/terms reads
// from this table.
export const termsAcceptances = pgTable('terms_acceptances', {
  id: uuid('id').primaryKey().defaultRandom(),
  // NULLABLE with ON DELETE SET NULL, changed 2026-08-22. It was previously
  // NOT NULL + ON DELETE CASCADE, which meant deleting a user destroyed
  // their Terms-acceptance record — and the person most likely to dispute
  // having agreed is a FORMER user. It also destroyed the signup IP and
  // user agent: purging 373,147 abuse accounts erased the entire attacker
  // trail in one statement (KB §41.3, §44.5). The row now survives with
  // email, versions, IP, user agent and timestamp intact.
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  termsVersion: varchar('terms_version', { length: 20 }).notNull(),
  privacyVersion: varchar('privacy_version', { length: 20 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  acceptedAt: timestamp('accepted_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_terms_acceptances_user').on(table.userId),
}));

// Contact-page / support-ticket submissions. userId is nullable and
// onDelete: 'set null' (not cascade) — a ticket is a support record, not
// user-owned data in the GDPR-export sense, so it should survive account
// deletion for the team's own record-keeping rather than vanish with the
// account it was filed from.
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  reason: varchar('reason', { length: 30 }).default('general').notNull(), // general | billing | technical | feature_request | partnership | other
  status: varchar('status', { length: 20 }).default('open').notNull(), // open | in_progress | resolved
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  statusIdx: index('idx_support_tickets_status').on(table.status, table.createdAt),
  userIdx: index('idx_support_tickets_user').on(table.userId),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_subscriptions_user').on(table.userId),
  stripeIdx: index('idx_subscriptions_stripe').on(table.stripeSubscriptionId),
}));

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_credits_user').on(table.userId, table.createdAt),
}));

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: varchar('feature', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  creditsUsed: integer('credits_used').default(0),
  apiCostUsd: decimal('api_cost_usd', { precision: 10, scale: 4 }).default('0'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userFeatureIdx: index('idx_usage_user_feature').on(table.userId, table.feature, table.createdAt),
}));

export const userQuotas = pgTable('user_quotas', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  planTier: varchar('plan_tier', { length: 20 }).default('free').notNull(),
  billingCycleStart: date('billing_cycle_start').defaultNow().notNull(),
  billingCycleEnd: date('billing_cycle_end').notNull(),
  
  seedKeywordsUsed: integer('seed_keywords_used').default(0),
  seedKeywordsQuota: integer('seed_keywords_quota').default(10000),
  
  expansionsUsed: integer('expansions_used').default(0),
  expansionsQuota: integer('expansions_quota').default(0),
  
  clusteringUsed: integer('clustering_used').default(0),
  clusteringQuota: integer('clustering_quota').default(0),
  
  briefsUsed: integer('briefs_used').default(0),
  briefsQuota: integer('briefs_quota').default(0),
  
  auditsUsed: integer('audits_used').default(0),
  auditsQuota: integer('audits_quota').default(0),
  
  metaGenUsed: integer('meta_gen_used').default(0),
  metaGenQuota: integer('meta_gen_quota').default(1000),
  
  aeoUsed: integer('aeo_used').default(0),
  aeoQuota: integer('aeo_quota').default(0),
  
  searchVolumeUsed: integer('search_volume_used').default(0),
  searchVolumeQuota: integer('search_volume_quota').default(0),
  
  serpSnapshotsUsed: integer('serp_snapshots_used').default(0),
  serpSnapshotsQuota: integer('serp_snapshots_quota').default(0),
  
  aiVisibilityScansUsed: integer('ai_visibility_scans_used').default(0),
  aiVisibilityScansQuota: integer('ai_visibility_scans_quota').default(0),
  
  aiSimulatorUsed: integer('ai_simulator_used').default(0),
  aiSimulatorQuota: integer('ai_simulator_quota').default(0),
  
  predictiveSeoUsed: integer('predictive_seo_used').default(0),
  predictiveSeoQuota: integer('predictive_seo_quota').default(0),
  
  creditsBalance: integer('credits_balance').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  planIdx: index('idx_user_quotas_plan').on(table.planTier),
  cycleIdx: index('idx_user_quotas_cycle').on(table.billingCycleEnd),
}));

export const dailyLimits = pgTable('daily_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feature: varchar('feature', { length: 50 }).notNull(),
  date: date('date').defaultNow().notNull(),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userFeatureDateIdx: unique('uniq_daily_limits').on(table.userId, table.feature, table.date),
  lookupIdx: index('idx_daily_limits_lookup').on(table.userId, table.feature, table.date),
}));

export const burstAllowances = pgTable('burst_allowances', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  tenureDays: integer('tenure_days').default(0),
  paymentHealth: boolean('payment_health').default(true),
  avgUsagePercent: integer('avg_usage_percent').default(0),
  burstEligible: boolean('burst_eligible').default(false),
  lastBurstGranted: timestamp('last_burst_granted'),
  burstUsedThisMonth: integer('burst_used_this_month').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  eligibleIdx: index('idx_burst_eligible').on(table.burstEligible),
}));

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  featureKey: varchar('feature_key', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  freeEnabled: boolean('free_enabled').default(false),
  proEnabled: boolean('pro_enabled').default(false),
  enterpriseEnabled: boolean('enterprise_enabled').default(false),
  requiresCredits: boolean('requires_credits').default(false),
  creditCost: integer('credit_cost').default(0),
  phase: integer('phase'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('idx_feature_flags_key').on(table.featureKey),
}));

// ========================================
// PHASE 1 - KEYWORD RESEARCH
// ========================================

export const keywords = pgTable('keywords', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyword: varchar('keyword', { length: 500 }).notNull(),
  language: varchar('language', { length: 10 }).default('en'),
  country: varchar('country', { length: 10 }).default('us'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_keywords_user').on(table.userId, table.createdAt),
  keywordIdx: index('idx_keywords_keyword').on(table.keyword),
}));

export const keywordExpansions = pgTable('keyword_expansions', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  expansion: varchar('expansion', { length: 500 }).notNull(),
  method: varchar('method', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_keyword_expansions_keyword').on(table.keywordId),
}));

export const keywordIntents = pgTable('keyword_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  intent: varchar('intent', { length: 50 }).notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_keyword_intents_keyword').on(table.keywordId),
}));

export const keywordClusters = pgTable('keyword_clusters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_keyword_clusters_user').on(table.userId),
}));

export const keywordClusterMembers = pgTable('keyword_cluster_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  clusterId: uuid('cluster_id').notNull().references(() => keywordClusters.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  clusterIdx: index('idx_cluster_members_cluster').on(table.clusterId),
  keywordIdx: index('idx_cluster_members_keyword').on(table.keywordId),
}));

export const keywordOpportunities = pgTable('keyword_opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_keyword_opportunities_keyword').on(table.keywordId),
}));

// ========================================
// PHASE 2 - CONTENT & ON-PAGE SEO
// ========================================

export const pageAudits = pgTable('page_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: varchar('title', { length: 255 }),
  metaDescription: text('meta_description'),
  headings: jsonb('headings'),
  wordCount: integer('word_count'),
  issues: jsonb('issues'),
  recommendations: jsonb('recommendations'),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_page_audits_user').on(table.userId, table.createdAt),
}));

export const contentBriefs = pgTable('content_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clusterId: uuid('cluster_id').references(() => keywordClusters.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }),
  outline: jsonb('outline'),
  targetKeywords: jsonb('target_keywords'),
  entities: jsonb('entities'),
  questions: jsonb('questions'),
  wordCountTarget: integer('word_count_target'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_content_briefs_user').on(table.userId, table.createdAt),
  clusterIdx: index('idx_content_briefs_cluster').on(table.clusterId),
}));

export const metaSuggestions = pgTable('meta_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  variations: jsonb('variations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_meta_suggestions_user').on(table.userId, table.createdAt),
  keywordIdx: index('idx_meta_suggestions_keyword').on(table.keywordId),
}));

export const aeoScores = pgTable('aeo_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url'),
  contentBriefId: uuid('content_brief_id').references(() => contentBriefs.id, { onDelete: 'cascade' }),
  score: integer('score'),
  directnessScore: integer('directness_score'),
  entityCoverageScore: integer('entity_coverage_score'),
  structureScore: integer('structure_score'),
  gaps: jsonb('gaps'),
  suggestions: jsonb('suggestions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_aeo_scores_user').on(table.userId, table.createdAt),
}));

// ========================================
// PHASE 3 - SERP & COMPETITIVE INSIGHTS
// ========================================

export const searchVolume = pgTable('search_volume', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  volume: integer('volume'),
  cpc: decimal('cpc', { precision: 10, scale: 2 }),
  competition: decimal('competition', { precision: 3, scale: 2 }),
  trend: jsonb('trend'),
  dataSource: varchar('data_source', { length: 50 }),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_search_volume_keyword').on(table.keywordId),
  volumeIdx: index('idx_search_volume_volume').on(table.volume),
}));

export const serpResults = pgTable('serp_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  url: text('url').notNull(),
  domain: varchar('domain', { length: 255 }),
  title: text('title'),
  description: text('description'),
  featuredSnippet: boolean('featured_snippet').default(false),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_serp_results_keyword').on(table.keywordId, table.position),
  domainIdx: index('idx_serp_results_domain').on(table.domain),
}));

export const serpVolatility = pgTable('serp_volatility', {
  id: uuid('id').primaryKey().defaultRandom(),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  volatilityScore: decimal('volatility_score', { precision: 5, scale: 2 }),
  trend: varchar('trend', { length: 20 }),
  momentumScore: decimal('momentum_score', { precision: 5, scale: 2 }),
  forecast: jsonb('forecast'),
  measuredAt: timestamp('measured_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_serp_volatility_keyword').on(table.keywordId, table.measuredAt),
}));

// ========================================
// PHASE 4 - AI SEARCH & ANSWER VISIBILITY
// ========================================

export const aiVisibility = pgTable('ai_visibility', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  brandName: varchar('brand_name', { length: 255 }),
  model: varchar('model', { length: 50 }),
  mentioned: boolean('mentioned').default(false),
  position: integer('position'),
  sentiment: varchar('sentiment', { length: 20 }),
  context: text('context'),
  frequency: integer('frequency').default(0),
  improvementSuggestions: jsonb('improvement_suggestions'),
  scannedAt: timestamp('scanned_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_ai_visibility_user').on(table.userId, table.scannedAt),
  brandIdx: index('idx_ai_visibility_brand').on(table.brandName, table.model),
}));

export const aiSimulations = pgTable('ai_simulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  model: varchar('model', { length: 50 }),
  response: text('response'),
  sources: jsonb('sources'),
  brandMentioned: boolean('brand_mentioned').default(false),
  competitorAnalysis: jsonb('competitor_analysis'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_ai_simulations_user').on(table.userId, table.createdAt),
}));

export const seoForecasts = pgTable('seo_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').references(() => keywords.id, { onDelete: 'cascade' }),
  growthProbability: decimal('growth_probability', { precision: 5, scale: 2 }),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  forecastHorizon: varchar('forecast_horizon', { length: 20 }),
  predictedVolume: integer('predicted_volume'),
  predictedDifficulty: decimal('predicted_difficulty', { precision: 5, scale: 2 }),
  explanation: text('explanation'),
  factors: jsonb('factors'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_seo_forecasts_user').on(table.userId, table.createdAt),
  keywordIdx: index('idx_seo_forecasts_keyword').on(table.keywordId),
}));

// ========================================
// PHASE 5 - STRATEGY & WORKFLOW
// ========================================

export const seoStrategies = pgTable('seo_strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  goals: jsonb('goals'),
  currentStateAnalysis: jsonb('current_state_analysis'),
  recommendedActions: jsonb('recommended_actions'),
  priorityKeywords: jsonb('priority_keywords'),
  contentGaps: jsonb('content_gaps'),
  quickWins: jsonb('quick_wins'),
  longTermStrategy: text('long_term_strategy'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_seo_strategies_user').on(table.userId, table.createdAt),
}));

export const seoTasks = pgTable('seo_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  strategyId: uuid('strategy_id').references(() => seoStrategies.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  taskType: varchar('task_type', { length: 50 }),
  priority: varchar('priority', { length: 20 }),
  status: varchar('status', { length: 20 }).default('pending'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_seo_tasks_user').on(table.userId, table.status),
  assignedIdx: index('idx_seo_tasks_assigned').on(table.assignedTo, table.status),
  strategyIdx: index('idx_seo_tasks_strategy').on(table.strategyId),
}));

// ========================================
// PHASE 6 - RANK TRACKING & MONITORING
// ========================================

export const rankHistory = pgTable('rank_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  position: integer('position'),
  url: text('url'),
  searchEngine: varchar('search_engine', { length: 50 }).default('google'),
  location: varchar('location', { length: 100 }),
  device: varchar('device', { length: 20 }).default('desktop'),
  date: date('date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index('idx_rank_history_keyword').on(table.keywordId, table.date),
  userIdx: index('idx_rank_history_user').on(table.userId, table.date),
  uniqueRank: unique('uniq_rank_history').on(table.keywordId, table.searchEngine, table.location, table.device, table.date),
}));

export const rankSnapshots = pgTable('rank_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  position: integer('position'),
  url: text('url'),
  searchEngine: varchar('search_engine', { length: 50 }).default('google'),
  location: varchar('location', { length: 100 }),
  device: varchar('device', { length: 20 }).default('desktop'),
  serpFeatures: jsonb('serp_features'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_rank_snapshots_user').on(table.userId, table.createdAt),
  keywordIdx: index('idx_rank_snapshots_keyword').on(table.keywordId),
}));

// Legacy table (keeping for compatibility)
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  requestCount: integer('request_count').default(0),
  windowStart: timestamp('window_start').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin-managed blocklist for abusive signup sources (added 2026-08-22).
//
// Lives in the database, NOT in Vercel's firewall, for a concrete reason:
// the project is on Vercel's Hobby plan, which allows only 3 custom
// firewall rules total (1 already spent on the /api/auth/register rate
// limit — KB §41.1). A blocklist that grows over time cannot live there.
// Checked by app/api/auth/register/route.ts on every signup attempt.
//
// Supports a bare IPv4/IPv6 address or a CIDR prefix (e.g. "20.151.0.0/16"),
// because abuse runs from cloud ranges where single addresses rotate freely.
export const blockedIps = pgTable('blocked_ips', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipAddress: varchar('ip_address', { length: 64 }).notNull().unique(),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastHitAt: timestamp('last_hit_at'),
  hitCount: integer('hit_count').default(0).notNull(),
}, (table) => ({
  ipIdx: index('idx_blocked_ips_ip').on(table.ipAddress),
}));

// Abuse throttle for UNAUTHENTICATED public endpoints (added 2026-08-22).
//
// Deliberately separate from `rate_limits` above: that table's `user_id` is
// NOT NULL and foreign-keyed to `users`, so it can only throttle someone who
// has already registered. That is exactly the gap that let the spam-relay
// incident run for ~19 hours against /api/auth/register (KB §37/§38).
// Keyed by an opaque namespaced string (`register:ip:…`, `register:email:…`)
// so the same table can cover any public endpoint. See lib/rate-limit.ts.
export const signupThrottle = pgTable('signup_throttle', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull(),
  count: integer('count').default(0).notNull(),
  windowStart: timestamp('window_start').defaultNow().notNull(),
}, (table) => ({
  keyWindowIdx: index('idx_signup_throttle_key_window').on(table.key, table.windowStart),
}));

// ========================================
// PASSWORD RESET TOKENS
// ========================================

export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    used: boolean('used').default(false),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    tokenIdx: index('idx_password_resets_token').on(table.token),
    userIdIdx: index('idx_password_resets_user_id').on(table.userId),
  })
);

// ========================================
// RELATIONS
// ========================================

export const usersRelations = relations(users, ({ many, one }) => ({
  keywords: many(keywords),
  subscriptions: many(subscriptions),
  credits: many(credits),
  usageLogs: many(usageLogs),
  quota: one(userQuotas, {
    fields: [users.id],
    references: [userQuotas.userId],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  user: one(users, {
    fields: [keywords.userId],
    references: [users.id],
  }),
  expansions: many(keywordExpansions),
  intents: many(keywordIntents),
  opportunities: many(keywordOpportunities),
  searchVolume: many(searchVolume),
  serpResults: many(serpResults),
}));
