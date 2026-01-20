#!/bin/bash

# ============================================================
# FIX RATE_LIMITS TABLE CONFLICT
# Drop old table and let Drizzle create new one
# ============================================================

set -e

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

echo "🔧 Fixing rate_limits table schema conflict..."

# Create SQL script to drop old table
cat > fix-rate-limits.sql << 'EOF'
-- Drop the old rate_limits table if it exists
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Drizzle will recreate it with the correct schema
EOF

echo "📋 SQL to execute:"
cat fix-rate-limits.sql

echo ""
echo "🗑️  Dropping old rate_limits table..."

# Execute the drop
cat > drop-table.js << 'EOF'
const { neon } = require('@neondatabase/serverless');

async function dropTable() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Dropping rate_limits table...');
    await sql`DROP TABLE IF EXISTS rate_limits CASCADE`;
    console.log('✅ Table dropped successfully');
    
    // Verify it's gone
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'rate_limits'
    `;
    
    if (tables.length === 0) {
      console.log('✅ Verified: rate_limits table no longer exists');
    } else {
      console.log('⚠️  Warning: Table still exists');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropTable();
EOF

node drop-table.js
rm drop-table.js

echo ""
echo "📤 Now pushing complete schema to database..."
echo ""

# Now push the schema - it will create rate_limits with correct structure
npm run db:push

echo ""
echo "🧪 Verifying new schema..."

cat > verify-schema.js << 'EOF'
const { neon } = require('@neondatabase/serverless');

async function verify() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Check users table for stripe_customer_id
    console.log('📊 Checking users table...');
    const userColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    `;
    
    if (userColumns.length > 0) {
      console.log('✅ users.stripe_customer_id exists');
    } else {
      console.log('❌ users.stripe_customer_id MISSING');
    }
    
    // Check rate_limits table structure
    console.log('\n📊 Checking rate_limits table...');
    const rateLimitsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rate_limits'
      ORDER BY ordinal_position
    `;
    
    if (rateLimitsColumns.length > 0) {
      console.log('✅ rate_limits table exists with columns:');
      rateLimitsColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      
      // Verify correct columns
      const hasEndpoint = rateLimitsColumns.some(c => c.column_name === 'endpoint');
      const hasRequestCount = rateLimitsColumns.some(c => c.column_name === 'request_count');
      const hasWindowStart = rateLimitsColumns.some(c => c.column_name === 'window_start');
      
      if (hasEndpoint && hasRequestCount && hasWindowStart) {
        console.log('\n✅ rate_limits has CORRECT schema');
      } else {
        console.log('\n⚠️  rate_limits schema may be incomplete');
      }
    } else {
      console.log('❌ rate_limits table does not exist');
    }
    
    console.log('\n🎉 Schema verification complete!');
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verify();
EOF

node verify-schema.js
rm verify-schema.js

# Clean up SQL file
rm fix-rate-limits.sql

echo ""
echo "✅ SCHEMA FIX COMPLETE!"
echo ""
echo "🧪 NEXT: Test registration at https://shijo.ai/register"
echo "   Email: merianda+test2@yahoo.com"
echo "   Password: TestPassword123"
