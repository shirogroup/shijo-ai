-- ============================================
-- SHIJO.AI Database Schema
-- PostgreSQL (Neon) - Complete Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PHASE 0: FOUNDATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- ============================================

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_consumed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_credits_user ON credits(user_id);

-- ============================================

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  credits_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_feature ON usage_logs(user_id, feature);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at);

-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase1_enabled BOOLEAN DEFAULT TRUE,
  phase2_enabled BOOLEAN DEFAULT FALSE,
  phase3_enabled BOOLEAN DEFAULT FALSE,
  phase4_enabled BOOLEAN DEFAULT FALSE,
  phase5_enabled BOOLEAN DEFAULT FALSE,
  phase6_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_feature_flags_user ON feature_flags(user_id);

-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  daily_limit INTEGER NOT NULL,
  daily_used INTEGER DEFAULT 0,
  reset_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 day'),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature)
);

CREATE INDEX idx_rate_limits_user_feature ON rate_limits(user_id, feature);

-- ============================================
-- PHASE 1: KEYWORD RESEARCH
-- ============================================

CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  country VARCHAR(10) DEFAULT 'us',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keywords_user ON keywords(user_id);
CREATE INDEX idx_keywords_created ON keywords(created_at);

-- ============================================

CREATE TABLE IF NOT EXISTS keyword_expansions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  expansion VARCHAR(500) NOT NULL,
  method VARCHAR(50) DEFAULT 'claude',
  relevance_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keyword_expansions_keyword ON keyword_expansions(keyword_id);

-- ============================================

CREATE TABLE IF NOT EXISTS keyword_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  intent VARCHAR(50) NOT NULL,
  confidence DECIMAL(3, 2),
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keyword_intents_keyword ON keyword_intents(keyword_id);

-- ============================================

CREATE TABLE IF NOT EXISTS keyword_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keyword_cluster_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id UUID REFERENCES keyword_clusters(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cluster_members_cluster ON keyword_cluster_members(cluster_id);
CREATE INDEX idx_cluster_members_keyword ON keyword_cluster_members(keyword_id);

-- ============================================

CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  explanation TEXT,
  factors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keyword_opportunities_keyword ON keyword_opportunities(keyword_id);
CREATE INDEX idx_keyword_opportunities_score ON keyword_opportunities(score);

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default free plan limits
INSERT INTO rate_limits (user_id, feature, daily_limit, daily_used)
SELECT id, 'keyword_expansion', 3, 0 FROM users
ON CONFLICT DO NOTHING;

-- Grant default feature flags to all users
INSERT INTO feature_flags (user_id, phase1_enabled)
SELECT id, TRUE FROM users
ON CONFLICT DO NOTHING;

-- Grant default free subscription to all users
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'free', 'active' FROM users
ON CONFLICT DO NOTHING;

-- Initialize credits for all users
INSERT INTO credits (user_id, balance)
SELECT id, 0 FROM users
ON CONFLICT DO NOTHING;
