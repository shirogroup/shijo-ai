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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  stripeIdx: index('idx_users_stripe').on(table.stripeCustomerId),
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
