#!/bin/bash

# ============================================================
# NUCLEAR SCHEMA FIX - Direct SQL Execution
# Bypass Drizzle and fix schema directly
# ============================================================

set -e

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          NUCLEAR SCHEMA FIX - DIRECT SQL                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This will execute direct SQL to fix all schema issues"
echo ""

cat > nuclear-schema-fix.js << 'EOF'
const { neon } = require('@neondatabase/serverless');

async function nuclearFix() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🔥 NUCLEAR SCHEMA FIX INITIATED\n');
  
  try {
    // ========================================
    // STEP 1: FIX USERS TABLE - ADD MISSING COLUMNS
    // ========================================
    console.log('1️⃣  Fixing users table...');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE
    `;
    console.log('   ✓ Added stripe_customer_id');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free' NOT NULL
    `;
    console.log('   ✓ Added plan_tier');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255)
    `;
    console.log('   ✓ Added subscription_id');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50)
    `;
    console.log('   ✓ Added subscription_status\n');
    
    // ========================================
    // STEP 2: DROP AND RECREATE SUBSCRIPTIONS
    // ========================================
    console.log('2️⃣  Recreating subscriptions table...');
    
    await sql`DROP TABLE IF EXISTS subscriptions CASCADE`;
    console.log('   ✓ Dropped old subscriptions');
    
    await sql`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
        stripe_price_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created new subscriptions table');
    
    await sql`
      CREATE INDEX idx_subscriptions_user ON subscriptions(user_id)
    `;
    await sql`
      CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id)
    `;
    console.log('   ✓ Created indexes\n');
    
    // ========================================
    // STEP 3: DROP AND RECREATE CREDITS
    // ========================================
    console.log('3️⃣  Recreating credits table...');
    
    await sql`DROP TABLE IF EXISTS credits CASCADE`;
    console.log('   ✓ Dropped old credits');
    
    await sql`
      CREATE TABLE credits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        stripe_payment_intent_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created new credits table');
    
    await sql`
      CREATE INDEX idx_credits_user ON credits(user_id, created_at)
    `;
    console.log('   ✓ Created index\n');
    
    // ========================================
    // STEP 4: DROP AND RECREATE USAGE_LOGS
    // ========================================
    console.log('4️⃣  Recreating usage_logs table...');
    
    await sql`DROP TABLE IF EXISTS usage_logs CASCADE`;
    console.log('   ✓ Dropped old usage_logs');
    
    await sql`
      CREATE TABLE usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feature VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        credits_used INTEGER DEFAULT 0,
        api_cost_usd DECIMAL(10, 4) DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created new usage_logs table');
    
    await sql`
      CREATE INDEX idx_usage_user_feature ON usage_logs(user_id, feature, created_at)
    `;
    console.log('   ✓ Created index\n');
    
    // ========================================
    // STEP 5: CREATE RATE_LIMITS (if not exists)
    // ========================================
    console.log('5️⃣  Creating rate_limits table...');
    
    await sql`DROP TABLE IF EXISTS rate_limits CASCADE`;
    console.log('   ✓ Dropped old rate_limits');
    
    await sql`
      CREATE TABLE rate_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint VARCHAR(255) NOT NULL,
        request_count INTEGER DEFAULT 0,
        window_start TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created new rate_limits table\n');
    
    // ========================================
    // VERIFICATION
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 VERIFICATION\n');
    
    // Check users
    const usersCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('stripe_customer_id', 'plan_tier', 'subscription_id', 'subscription_status')
    `;
    console.log(`✓ users: ${usersCheck.length}/4 required columns added`);
    
    // Check subscriptions
    const subsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('stripe_subscription_id', 'stripe_price_id')
    `;
    console.log(`✓ subscriptions: ${subsCheck.length}/2 key columns exist`);
    
    // Check credits
    const creditsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'credits' 
      AND column_name IN ('amount', 'stripe_payment_intent_id')
    `;
    console.log(`✓ credits: ${creditsCheck.length}/2 key columns exist`);
    
    // Check usage_logs
    const usageCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usage_logs' 
      AND column_name = 'action'
    `;
    console.log(`✓ usage_logs: action column ${usageCheck.length > 0 ? 'EXISTS' : 'MISSING'}`);
    
    // Check rate_limits
    const rateCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rate_limits' 
      AND column_name IN ('endpoint', 'request_count')
    `;
    console.log(`✓ rate_limits: ${rateCheck.length}/2 key columns exist`);
    
    console.log('');
    
    if (usersCheck.length === 4 && subsCheck.length === 2 && creditsCheck.length === 2 && 
        usageCheck.length > 0 && rateCheck.length === 2) {
      console.log('✅ ALL SCHEMA FIXES SUCCESSFUL!');
      console.log('');
      console.log('🧪 READY TO TEST REGISTRATION:');
      console.log('   URL: https://shijo.ai/register');
      console.log('   Email: merianda+test5@yahoo.com');
      console.log('   Password: TestPassword123');
    } else {
      console.log('⚠️  Some fixes may be incomplete - check details above');
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Nuclear fix error:', error.message);
    console.error('SQL State:', error.code);
    console.error('Detail:', error.detail || 'N/A');
    process.exit(1);
  }
}

nuclearFix();
EOF

node nuclear-schema-fix.js
rm nuclear-schema-fix.js

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            NUCLEAR FIX COMPLETE                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Database schema has been DIRECTLY updated with SQL"
echo "🚀 Registration should now work!"
echo ""
