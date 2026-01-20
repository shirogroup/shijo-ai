CREATE TABLE "aeo_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text,
	"content_brief_id" uuid,
	"score" integer,
	"directness_score" integer,
	"entity_coverage_score" integer,
	"structure_score" integer,
	"gaps" jsonb,
	"suggestions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"model" varchar(50),
	"response" text,
	"sources" jsonb,
	"brand_mentioned" boolean DEFAULT false,
	"competitor_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_visibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"brand_name" varchar(255),
	"model" varchar(50),
	"mentioned" boolean DEFAULT false,
	"position" integer,
	"sentiment" varchar(20),
	"context" text,
	"frequency" integer DEFAULT 0,
	"improvement_suggestions" jsonb,
	"scanned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "burst_allowances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"tenure_days" integer DEFAULT 0,
	"payment_health" boolean DEFAULT true,
	"avg_usage_percent" integer DEFAULT 0,
	"burst_eligible" boolean DEFAULT false,
	"last_burst_granted" timestamp,
	"burst_used_this_month" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cluster_id" uuid,
	"title" varchar(500),
	"outline" jsonb,
	"target_keywords" jsonb,
	"entities" jsonb,
	"questions" jsonb,
	"word_count_target" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" varchar(50) NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_daily_limits" UNIQUE("user_id","feature","date")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"free_enabled" boolean DEFAULT false,
	"pro_enabled" boolean DEFAULT false,
	"enterprise_enabled" boolean DEFAULT false,
	"requires_credits" boolean DEFAULT false,
	"credit_cost" integer DEFAULT 0,
	"phase" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "keyword_cluster_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_expansions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"expansion" varchar(500) NOT NULL,
	"method" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"intent" varchar(50) NOT NULL,
	"confidence" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword" varchar(500) NOT NULL,
	"language" varchar(10) DEFAULT 'en',
	"country" varchar(10) DEFAULT 'us',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword_id" uuid,
	"title" varchar(255),
	"description" text,
	"variations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" varchar(255),
	"meta_description" text,
	"headings" jsonb,
	"word_count" integer,
	"issues" jsonb,
	"recommendations" jsonb,
	"score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"position" integer,
	"url" text,
	"search_engine" varchar(50) DEFAULT 'google',
	"location" varchar(100),
	"device" varchar(20) DEFAULT 'desktop',
	"date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_rank_history" UNIQUE("keyword_id","search_engine","location","device","date")
);
--> statement-breakpoint
CREATE TABLE "rank_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"position" integer,
	"url" text,
	"search_engine" varchar(50) DEFAULT 'google',
	"location" varchar(100),
	"device" varchar(20) DEFAULT 'desktop',
	"serp_features" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"request_count" integer DEFAULT 0,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_volume" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"volume" integer,
	"cpc" numeric(10, 2),
	"competition" numeric(3, 2),
	"trend" jsonb,
	"data_source" varchar(50),
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_forecasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword_id" uuid,
	"growth_probability" numeric(5, 2),
	"confidence_score" numeric(5, 2),
	"forecast_horizon" varchar(20),
	"predicted_volume" integer,
	"predicted_difficulty" numeric(5, 2),
	"explanation" text,
	"factors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goals" jsonb,
	"current_state_analysis" jsonb,
	"recommended_actions" jsonb,
	"priority_keywords" jsonb,
	"content_gaps" jsonb,
	"quick_wins" jsonb,
	"long_term_strategy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"strategy_id" uuid,
	"title" varchar(500) NOT NULL,
	"description" text,
	"task_type" varchar(50),
	"priority" varchar(20),
	"status" varchar(20) DEFAULT 'pending',
	"assigned_to" uuid,
	"due_date" date,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"url" text NOT NULL,
	"domain" varchar(255),
	"title" text,
	"description" text,
	"featured_snippet" boolean DEFAULT false,
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serp_volatility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"volatility_score" numeric(5, 2),
	"trend" varchar(20),
	"momentum_score" numeric(5, 2),
	"forecast" jsonb,
	"measured_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"credits_used" integer DEFAULT 0,
	"api_cost_usd" numeric(10, 4) DEFAULT '0',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quotas" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"plan_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"billing_cycle_start" date DEFAULT now() NOT NULL,
	"billing_cycle_end" date NOT NULL,
	"seed_keywords_used" integer DEFAULT 0,
	"seed_keywords_quota" integer DEFAULT 10000,
	"expansions_used" integer DEFAULT 0,
	"expansions_quota" integer DEFAULT 0,
	"clustering_used" integer DEFAULT 0,
	"clustering_quota" integer DEFAULT 0,
	"briefs_used" integer DEFAULT 0,
	"briefs_quota" integer DEFAULT 0,
	"audits_used" integer DEFAULT 0,
	"audits_quota" integer DEFAULT 0,
	"meta_gen_used" integer DEFAULT 0,
	"meta_gen_quota" integer DEFAULT 1000,
	"aeo_used" integer DEFAULT 0,
	"aeo_quota" integer DEFAULT 0,
	"search_volume_used" integer DEFAULT 0,
	"search_volume_quota" integer DEFAULT 0,
	"serp_snapshots_used" integer DEFAULT 0,
	"serp_snapshots_quota" integer DEFAULT 0,
	"ai_visibility_scans_used" integer DEFAULT 0,
	"ai_visibility_scans_quota" integer DEFAULT 0,
	"ai_simulator_used" integer DEFAULT 0,
	"ai_simulator_quota" integer DEFAULT 0,
	"predictive_seo_used" integer DEFAULT 0,
	"predictive_seo_quota" integer DEFAULT 0,
	"credits_balance" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"name" varchar(255),
	"stripe_customer_id" varchar(255),
	"plan_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"subscription_id" varchar(255),
	"subscription_status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "aeo_scores" ADD CONSTRAINT "aeo_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aeo_scores" ADD CONSTRAINT "aeo_scores_content_brief_id_content_briefs_id_fk" FOREIGN KEY ("content_brief_id") REFERENCES "public"."content_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_simulations" ADD CONSTRAINT "ai_simulations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_visibility" ADD CONSTRAINT "ai_visibility_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burst_allowances" ADD CONSTRAINT "burst_allowances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_limits" ADD CONSTRAINT "daily_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_cluster_members" ADD CONSTRAINT "keyword_cluster_members_cluster_id_keyword_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."keyword_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_cluster_members" ADD CONSTRAINT "keyword_cluster_members_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_clusters" ADD CONSTRAINT "keyword_clusters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_expansions" ADD CONSTRAINT "keyword_expansions_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_intents" ADD CONSTRAINT "keyword_intents_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_opportunities" ADD CONSTRAINT "keyword_opportunities_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_suggestions" ADD CONSTRAINT "meta_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_suggestions" ADD CONSTRAINT "meta_suggestions_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_audits" ADD CONSTRAINT "page_audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_history" ADD CONSTRAINT "rank_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_history" ADD CONSTRAINT "rank_history_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_volume" ADD CONSTRAINT "search_volume_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_forecasts" ADD CONSTRAINT "seo_forecasts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_forecasts" ADD CONSTRAINT "seo_forecasts_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_strategies" ADD CONSTRAINT "seo_strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_tasks" ADD CONSTRAINT "seo_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_tasks" ADD CONSTRAINT "seo_tasks_strategy_id_seo_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."seo_strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_tasks" ADD CONSTRAINT "seo_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_results" ADD CONSTRAINT "serp_results_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serp_volatility" ADD CONSTRAINT "serp_volatility_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quotas" ADD CONSTRAINT "user_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aeo_scores_user" ON "aeo_scores" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_simulations_user" ON "ai_simulations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_visibility_user" ON "ai_visibility" USING btree ("user_id","scanned_at");--> statement-breakpoint
CREATE INDEX "idx_ai_visibility_brand" ON "ai_visibility" USING btree ("brand_name","model");--> statement-breakpoint
CREATE INDEX "idx_burst_eligible" ON "burst_allowances" USING btree ("burst_eligible");--> statement-breakpoint
CREATE INDEX "idx_content_briefs_user" ON "content_briefs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_briefs_cluster" ON "content_briefs" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "idx_credits_user" ON "credits" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_daily_limits_lookup" ON "daily_limits" USING btree ("user_id","feature","date");--> statement-breakpoint
CREATE INDEX "idx_feature_flags_key" ON "feature_flags" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "idx_cluster_members_cluster" ON "keyword_cluster_members" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "idx_cluster_members_keyword" ON "keyword_cluster_members" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_clusters_user" ON "keyword_clusters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_expansions_keyword" ON "keyword_expansions" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_intents_keyword" ON "keyword_intents" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_keyword_opportunities_keyword" ON "keyword_opportunities" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_keywords_user" ON "keywords" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_keywords_keyword" ON "keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "idx_meta_suggestions_user" ON "meta_suggestions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_meta_suggestions_keyword" ON "meta_suggestions" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_page_audits_user" ON "page_audits" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_rank_history_keyword" ON "rank_history" USING btree ("keyword_id","date");--> statement-breakpoint
CREATE INDEX "idx_rank_history_user" ON "rank_history" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_rank_snapshots_user" ON "rank_snapshots" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_rank_snapshots_keyword" ON "rank_snapshots" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_search_volume_keyword" ON "search_volume" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_search_volume_volume" ON "search_volume" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "idx_seo_forecasts_user" ON "seo_forecasts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_seo_forecasts_keyword" ON "seo_forecasts" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_seo_strategies_user" ON "seo_strategies" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_seo_tasks_user" ON "seo_tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_seo_tasks_assigned" ON "seo_tasks" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "idx_seo_tasks_strategy" ON "seo_tasks" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "idx_serp_results_keyword" ON "serp_results" USING btree ("keyword_id","position");--> statement-breakpoint
CREATE INDEX "idx_serp_results_domain" ON "serp_results" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_serp_volatility_keyword" ON "serp_volatility" USING btree ("keyword_id","measured_at");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_usage_user_feature" ON "usage_logs" USING btree ("user_id","feature","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_quotas_plan" ON "user_quotas" USING btree ("plan_tier");--> statement-breakpoint
CREATE INDEX "idx_user_quotas_cycle" ON "user_quotas" USING btree ("billing_cycle_end");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_stripe" ON "users" USING btree ("stripe_customer_id");