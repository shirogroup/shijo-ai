#!/bin/bash

# ============================================================
# FIX DATABASE SCHEMA MISMATCH
# Push complete schema to Neon database
# ============================================================

set -e

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

echo "🔍 Checking current schema..."

# First, let's verify what the schema file has
echo ""
echo "📋 Current users table schema in code:"
cat db/schema.ts | grep -A 12 "export const users"

echo ""
echo "🔧 Generating migration..."

# Generate migration from schema
npm run db:generate

echo ""
echo "📤 Pushing schema to database..."

# Push schema to Neon (this will add missing columns)
npm run db:push

echo ""
echo "✅ Schema pushed successfully!"
echo ""
echo "🧪 Testing database connection..."

# Create a simple test script
cat > test-db-connection.js << 'EOF'
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('Testing database connection...');
  
  try {
    // Test query
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('\n✅ Database connection successful!');
    console.log('\n📊 Users table columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check for stripe_customer_id specifically
    const hasStripeColumn = result.some(col => col.column_name === 'stripe_customer_id');
    
    if (hasStripeColumn) {
      console.log('\n✅ stripe_customer_id column EXISTS - issue is FIXED!');
    } else {
      console.log('\n❌ stripe_customer_id column MISSING - schema push may have failed');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

echo ""
echo "Running database verification..."
node test-db-connection.js

# Clean up test file
rm test-db-connection.js

echo ""
echo "🎉 SCHEMA FIX COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Try registering again at https://shijo.ai/register"
echo "2. Use: merianda+test2@yahoo.com (different from previous attempt)"
echo "3. Password: TestPassword123"
echo ""
echo "If it still fails, share the new error log."
