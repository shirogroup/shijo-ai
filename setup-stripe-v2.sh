#!/bin/bash

###############################################################################
# SHIJO.AI STRIPE PRODUCTS & PRICES SETUP
# Windows-compatible version
###############################################################################

set -e  # Exit on error

echo "🚀 SHIJO.AI Stripe Setup"
echo "================================"
echo ""

# Check if Stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI not found"
    exit 1
fi

echo "✅ Stripe CLI ready"
echo ""

###############################################################################
# CREATE PRODUCTS & PRICES
###############################################################################

echo "📦 Creating Products..."
echo ""

# PRO PLAN
echo "1️⃣  Creating Pro Plan (\$39/month)..."
stripe products create \
  --name="SHIJO.ai Pro" \
  --description="Professional SEO toolkit with 100 expansions/month and 50 rank tracking keywords" \
  --metadata[plan_tier]="pro" \
  --metadata[expansions]="100" \
  --metadata[briefs]="300" > pro_product.json

stripe prices create \
  --product="$(cat pro_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)" \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=month > pro_price.json

echo "   ✅ Pro Plan Created"
echo ""

# ENTERPRISE PLAN
echo "2️⃣  Creating Enterprise Plan (\$129/month)..."
stripe products create \
  --name="SHIJO.ai Enterprise" \
  --description="Enterprise SEO platform with AI visibility tracking and 200 rank tracking keywords" \
  --metadata[plan_tier]="enterprise" \
  --metadata[expansions]="5000" \
  --metadata[briefs]="2000" > enterprise_product.json

stripe prices create \
  --product="$(cat enterprise_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)" \
  --unit-amount=12900 \
  --currency=usd \
  --recurring[interval]=month > enterprise_price.json

echo "   ✅ Enterprise Plan Created"
echo ""

# CREDIT PACK - 10 CREDITS
echo "3️⃣  Creating 10 Credits Pack (\$1.00)..."
stripe products create \
  --name="10 Credits" \
  --description="One-time purchase: 10 credits for on-demand features" \
  --metadata[credit_amount]="10" > credits_10_product.json

stripe prices create \
  --product="$(cat credits_10_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)" \
  --unit-amount=100 \
  --currency=usd > credits_10_price.json

echo "   ✅ 10 Credits Created"
echo ""

# CREDIT PACK - 50 CREDITS
echo "4️⃣  Creating 50 Credits Pack (\$4.75 - 5% bonus)..."
stripe products create \
  --name="50 Credits (5% Bonus)" \
  --description="One-time purchase: 50 credits with 5% bonus" \
  --metadata[credit_amount]="50" > credits_50_product.json

stripe prices create \
  --product="$(cat credits_50_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)" \
  --unit-amount=475 \
  --currency=usd > credits_50_price.json

echo "   ✅ 50 Credits Created"
echo ""

# CREDIT PACK - 100 CREDITS
echo "5️⃣  Creating 100 Credits Pack (\$9.00 - 10% bonus)..."
stripe products create \
  --name="100 Credits (10% Bonus)" \
  --description="One-time purchase: 100 credits with 10% bonus" \
  --metadata[credit_amount]="100" > credits_100_product.json

stripe prices create \
  --product="$(cat credits_100_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)" \
  --unit-amount=900 \
  --currency=usd > credits_100_price.json

echo "   ✅ 100 Credits Created"
echo ""

###############################################################################
# EXTRACT IDS AND CREATE CONFIG
###############################################################################

echo "💾 Extracting IDs..."
echo ""

# Extract Product IDs
PRO_PRODUCT=$(cat pro_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)
ENTERPRISE_PRODUCT=$(cat enterprise_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)
CREDITS_10_PRODUCT=$(cat credits_10_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)
CREDITS_50_PRODUCT=$(cat credits_50_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)
CREDITS_100_PRODUCT=$(cat credits_100_product.json | grep -o 'prod_[a-zA-Z0-9]*' | head -1)

# Extract Price IDs
PRO_PRICE=$(cat pro_price.json | grep -o 'price_[a-zA-Z0-9]*' | head -1)
ENTERPRISE_PRICE=$(cat enterprise_price.json | grep -o 'price_[a-zA-Z0-9]*' | head -1)
CREDITS_10_PRICE=$(cat credits_10_price.json | grep -o 'price_[a-zA-Z0-9]*' | head -1)
CREDITS_50_PRICE=$(cat credits_50_price.json | grep -o 'price_[a-zA-Z0-9]*' | head -1)
CREDITS_100_PRICE=$(cat credits_100_price.json | grep -o 'price_[a-zA-Z0-9]*' | head -1)

###############################################################################
# CREATE WEBHOOK (Optional)
###############################################################################

echo "🔗 Webhook Setup..."
echo ""
read -p "Enter your production URL (or press Enter to skip): " PROD_URL

WEBHOOK_SECRET=""

if [ -n "$PROD_URL" ]; then
    echo "Creating webhook endpoint..."
    stripe webhook_endpoints create \
      --url="$PROD_URL/api/webhooks/stripe" \
      --enabled-event checkout.session.completed \
      --enabled-event customer.subscription.created \
      --enabled-event customer.subscription.updated \
      --enabled-event customer.subscription.deleted \
      --enabled-event invoice.payment_succeeded \
      --enabled-event invoice.payment_failed > webhook.json
    
    WEBHOOK_ID=$(cat webhook.json | grep -o 'we_[a-zA-Z0-9]*' | head -1)
    WEBHOOK_SECRET=$(cat webhook.json | grep -o 'whsec_[a-zA-Z0-9]*' | head -1)
    
    echo "   ✅ Webhook Created: $WEBHOOK_ID"
    echo ""
else
    echo "   ⏭️  Webhook creation skipped"
    echo ""
fi

###############################################################################
# SAVE CONFIGURATION
###############################################################################

echo "💾 Saving Configuration..."
echo ""

cat > stripe-config.env << EOF
# SHIJO.AI STRIPE CONFIGURATION
# Generated: $(date)
# ================================

# PRODUCT IDs
PRO_PRODUCT_ID=$PRO_PRODUCT
ENTERPRISE_PRODUCT_ID=$ENTERPRISE_PRODUCT
CREDITS_10_PRODUCT_ID=$CREDITS_10_PRODUCT
CREDITS_50_PRODUCT_ID=$CREDITS_50_PRODUCT
CREDITS_100_PRODUCT_ID=$CREDITS_100_PRODUCT

# PRICE IDs (use these in your code)
PRO_PRICE_ID=$PRO_PRICE
ENTERPRISE_PRICE_ID=$ENTERPRISE_PRICE
CREDITS_10_PRICE_ID=$CREDITS_10_PRICE
CREDITS_50_PRICE_ID=$CREDITS_50_PRICE
CREDITS_100_PRICE_ID=$CREDITS_100_PRICE

# WEBHOOK
STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET
EOF

# Also save as regular text for easy reading
cat > stripe-config.txt << EOF
SHIJO.AI STRIPE CONFIGURATION
Generated: $(date)
================================

PRODUCTS:
  Pro Plan:        $PRO_PRODUCT
  Enterprise Plan: $ENTERPRISE_PRODUCT
  10 Credits:      $CREDITS_10_PRODUCT
  50 Credits:      $CREDITS_50_PRODUCT
  100 Credits:     $CREDITS_100_PRODUCT

PRICES:
  Pro:        $PRO_PRICE (\$39/month)
  Enterprise: $ENTERPRISE_PRICE (\$129/month)
  10 Credits: $CREDITS_10_PRICE (\$1.00)
  50 Credits: $CREDITS_50_PRICE (\$4.75)
  100 Credits: $CREDITS_100_PRICE (\$9.00)

WEBHOOK SECRET:
  $WEBHOOK_SECRET

================================
NEXT STEPS:
1. Add to .env.local:
   STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

2. Add to Vercel environment variables

3. View products in dashboard:
   https://dashboard.stripe.com/test/products
================================
EOF

# Clean up JSON files
rm -f *.json

echo "✅ Configuration saved to:"
echo "   - stripe-config.env (for environment variables)"
echo "   - stripe-config.txt (for reference)"
echo ""

###############################################################################
# SUMMARY
###############################################################################

echo "================================"
echo "🎉 SETUP COMPLETE!"
echo "================================"
echo ""
echo "📋 PRODUCTS CREATED:"
echo "   ✅ Pro Plan: \$39/month (ID: $PRO_PRICE)"
echo "   ✅ Enterprise Plan: \$129/month (ID: $ENTERPRISE_PRICE)"
echo "   ✅ 10 Credits: \$1.00 (ID: $CREDITS_10_PRICE)"
echo "   ✅ 50 Credits: \$4.75 (ID: $CREDITS_50_PRICE)"
echo "   ✅ 100 Credits: \$9.00 (ID: $CREDITS_100_PRICE)"
echo ""
echo "🔗 VIEW IN DASHBOARD:"
echo "   https://dashboard.stripe.com/test/products"
echo ""
echo "📄 CONFIGURATION FILES:"
echo "   stripe-config.env"
echo "   stripe-config.txt"
echo ""

if [ -n "$WEBHOOK_SECRET" ]; then
    echo "⚠️  IMPORTANT - Add webhook secret to .env.local:"
    echo "   echo 'STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET' >> .env.local"
    echo ""
fi

echo "================================"
echo "✅ Ready for integration!"
echo "================================"
