#!/bin/bash

###############################################################################
# SHIJO.AI STRIPE PRODUCTS & PRICES SETUP
# Automated creation of subscription plans and credit packs
###############################################################################

set -e  # Exit on error

echo "🚀 SHIJO.AI Stripe Setup"
echo "================================"
echo ""

# Check if Stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI not found"
    echo "Please install Stripe CLI first"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "❌ Error: Not logged in to Stripe"
    echo "Please run: stripe login"
    exit 1
fi

echo "✅ Stripe CLI ready"
echo ""

###############################################################################
# CREATE PRODUCTS
###############################################################################

echo "📦 Creating Products..."
echo ""

# PRO PLAN
echo "1️⃣  Creating Pro Plan ($39/month)..."
PRO_PRODUCT=$(stripe products create \
  --name="SHIJO.ai Pro" \
  --description="Professional SEO toolkit with 100 expansions/month and 50 rank tracking keywords" \
  --metadata[plan_tier]="pro" \
  --metadata[expansions]="100" \
  --metadata[briefs]="300" \
  --metadata[audits]="50" \
  --metadata[rank_keywords]="50" \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'prod_[^"]*')

PRO_PRICE=$(stripe prices create \
  --product="$PRO_PRODUCT" \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'price_[^"]*')

echo "   ✅ Pro Product ID: $PRO_PRODUCT"
echo "   ✅ Pro Price ID: $PRO_PRICE"
echo ""

# ENTERPRISE PLAN
echo "2️⃣  Creating Enterprise Plan ($129/month)..."
ENTERPRISE_PRODUCT=$(stripe products create \
  --name="SHIJO.ai Enterprise" \
  --description="Enterprise SEO platform with AI visibility tracking and 200 rank tracking keywords" \
  --metadata[plan_tier]="enterprise" \
  --metadata[expansions]="5000" \
  --metadata[briefs]="2000" \
  --metadata[audits]="500" \
  --metadata[rank_keywords]="200" \
  --metadata[ai_visibility]="2" \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'prod_[^"]*')

ENTERPRISE_PRICE=$(stripe prices create \
  --product="$ENTERPRISE_PRODUCT" \
  --unit-amount=12900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'price_[^"]*')

echo "   ✅ Enterprise Product ID: $ENTERPRISE_PRODUCT"
echo "   ✅ Enterprise Price ID: $ENTERPRISE_PRICE"
echo ""

# CREDIT PACK - 10 CREDITS
echo "3️⃣  Creating 10 Credits Pack ($1.00)..."
CREDITS_10_PRODUCT=$(stripe products create \
  --name="10 Credits" \
  --description="One-time purchase: 10 credits for on-demand features" \
  --metadata[credit_amount]="10" \
  --metadata[credit_value]="0.10" \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'prod_[^"]*')

CREDITS_10_PRICE=$(stripe prices create \
  --product="$CREDITS_10_PRODUCT" \
  --unit-amount=100 \
  --currency=usd \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'price_[^"]*')

echo "   ✅ 10 Credits Product ID: $CREDITS_10_PRODUCT"
echo "   ✅ 10 Credits Price ID: $CREDITS_10_PRICE"
echo ""

# CREDIT PACK - 50 CREDITS (5% BONUS)
echo "4️⃣  Creating 50 Credits Pack ($4.75 - 5% bonus)..."
CREDITS_50_PRODUCT=$(stripe products create \
  --name="50 Credits (5% Bonus)" \
  --description="One-time purchase: 50 credits with 5% bonus" \
  --metadata[credit_amount]="50" \
  --metadata[credit_value]="0.095" \
  --metadata[bonus_percent]="5" \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'prod_[^"]*')

CREDITS_50_PRICE=$(stripe prices create \
  --product="$CREDITS_50_PRODUCT" \
  --unit-amount=475 \
  --currency=usd \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'price_[^"]*')

echo "   ✅ 50 Credits Product ID: $CREDITS_50_PRODUCT"
echo "   ✅ 50 Credits Price ID: $CREDITS_50_PRICE"
echo ""

# CREDIT PACK - 100 CREDITS (10% BONUS)
echo "5️⃣  Creating 100 Credits Pack ($9.00 - 10% bonus)..."
CREDITS_100_PRODUCT=$(stripe products create \
  --name="100 Credits (10% Bonus)" \
  --description="One-time purchase: 100 credits with 10% bonus" \
  --metadata[credit_amount]="100" \
  --metadata[credit_value]="0.09" \
  --metadata[bonus_percent]="10" \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'prod_[^"]*')

CREDITS_100_PRICE=$(stripe prices create \
  --product="$CREDITS_100_PRODUCT" \
  --unit-amount=900 \
  --currency=usd \
  --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'price_[^"]*')

echo "   ✅ 100 Credits Product ID: $CREDITS_100_PRODUCT"
echo "   ✅ 100 Credits Price ID: $CREDITS_100_PRICE"
echo ""

###############################################################################
# CREATE WEBHOOK ENDPOINT (Test Mode)
###############################################################################

echo "🔗 Creating Webhook Endpoint..."
echo ""

# Get deployed URL (you'll need to update this)
read -p "Enter your production URL (e.g., https://shijo.ai): " PROD_URL

if [ -z "$PROD_URL" ]; then
    echo "⚠️  Skipping webhook creation (no URL provided)"
    echo "   You can create it manually later in Stripe Dashboard"
else
    WEBHOOK_ENDPOINT=$(stripe webhook_endpoints create \
      --url="$PROD_URL/api/webhooks/stripe" \
      --enabled-event checkout.session.completed \
      --enabled-event customer.subscription.created \
      --enabled-event customer.subscription.updated \
      --enabled-event customer.subscription.deleted \
      --enabled-event invoice.payment_succeeded \
      --enabled-event invoice.payment_failed \
      --format=json | grep -o '"id": *"[^"]*"' | head -1 | grep -o 'we_[^"]*')
    
    echo "   ✅ Webhook Endpoint ID: $WEBHOOK_ENDPOINT"
    echo ""
    
    # Get webhook secret
    WEBHOOK_SECRET=$(stripe webhook_endpoints retrieve $WEBHOOK_ENDPOINT --format=json | grep -o '"secret": *"[^"]*"' | grep -o 'whsec_[^"]*')
    echo "   🔐 Webhook Secret: $WEBHOOK_SECRET"
    echo ""
fi

###############################################################################
# SAVE CONFIGURATION
###############################################################################

echo "💾 Saving Configuration..."
echo ""

# Create config file
cat > stripe-config.txt << EOF
# SHIJO.AI STRIPE CONFIGURATION
# Generated: $(date)
# ================================

# PRODUCTS
PRO_PRODUCT_ID=$PRO_PRODUCT
ENTERPRISE_PRODUCT_ID=$ENTERPRISE_PRODUCT
CREDITS_10_PRODUCT_ID=$CREDITS_10_PRODUCT
CREDITS_50_PRODUCT_ID=$CREDITS_50_PRODUCT
CREDITS_100_PRODUCT_ID=$CREDITS_100_PRODUCT

# PRICES
PRO_PRICE_ID=$PRO_PRICE
ENTERPRISE_PRICE_ID=$ENTERPRISE_PRICE
CREDITS_10_PRICE_ID=$CREDITS_10_PRICE
CREDITS_50_PRICE_ID=$CREDITS_50_PRICE
CREDITS_100_PRICE_ID=$CREDITS_100_PRICE

# WEBHOOK
WEBHOOK_ENDPOINT_ID=$WEBHOOK_ENDPOINT
STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

# ================================
# NEXT STEPS:
# 1. Add STRIPE_WEBHOOK_SECRET to .env.local
# 2. Add STRIPE_WEBHOOK_SECRET to Vercel environment variables
# 3. Update lib/stripe/products.ts with these IDs (optional)
# ================================
EOF

echo "✅ Configuration saved to: stripe-config.txt"
echo ""

###############################################################################
# SUMMARY
###############################################################################

echo "================================"
echo "🎉 SETUP COMPLETE!"
echo "================================"
echo ""
echo "📋 PRODUCTS CREATED:"
echo "   • Pro Plan: $39/month"
echo "   • Enterprise Plan: $129/month"
echo "   • 10 Credits: $1.00"
echo "   • 50 Credits: $4.75 (5% bonus)"
echo "   • 100 Credits: $9.00 (10% bonus)"
echo ""
echo "🔗 VIEW IN DASHBOARD:"
echo "   https://dashboard.stripe.com/test/products"
echo ""
echo "📄 CONFIGURATION FILE:"
echo "   stripe-config.txt (saved in current directory)"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. Add to .env.local:"
echo "   STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo ""
echo "2. Add to Vercel (Production):"
echo "   Go to: Settings → Environment Variables"
echo "   Add: STRIPE_WEBHOOK_SECRET = $WEBHOOK_SECRET"
echo ""
echo "3. Test the webhook:"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "================================"
echo "✅ Ready to integrate billing!"
echo "================================"
