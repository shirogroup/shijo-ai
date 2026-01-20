#!/bin/bash

###############################################################################
# SHIJO.AI STRIPE SETUP - COMPATIBLE WITH STRIPE CLI v1.29.0
# No metadata flags (not supported in older versions)
###############################################################################

LOG_FILE="stripe-setup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 SHIJO.AI Stripe Setup (CLI v1.29.0 Compatible)"
echo "=================================================="
echo "Time: $(date)"
echo ""

log_error() {
    echo "❌ ERROR: $1"
    exit 1
}

log_success() {
    echo "✅ $1"
}

extract_id() {
    local pattern=$1
    local file=$2
    grep -o "${pattern}_[a-zA-Z0-9]*" "$file" 2>/dev/null | head -1
}

echo "Checking Stripe CLI..."
if ! command -v stripe &> /dev/null; then
    log_error "Stripe CLI not found"
fi
log_success "Stripe CLI found (version: $(stripe --version))"

echo "Checking Stripe login..."
if ! stripe config --list &> /dev/null; then
    log_error "Not logged in. Run: stripe login"
fi
log_success "Stripe CLI authenticated"
echo ""

###############################################################################
# CREATE PRODUCTS - NO METADATA (v1.29.0 compatible)
###############################################################################

echo "📦 Creating Products..."
echo ""

# PRO PLAN
echo "1️⃣  Creating Pro Plan (\$39/month)..."
stripe products create \
  --name "SHIJO.ai Pro" \
  --description "Professional SEO toolkit with 100 expansions/month and 50 rank tracking keywords" \
  > pro_product.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error output:"
    cat pro_product.json
    log_error "Failed to create Pro product"
fi

PRO_PRODUCT=$(extract_id "prod" "pro_product.json")
if [ -z "$PRO_PRODUCT" ]; then
    echo "File content:"
    cat pro_product.json
    log_error "Could not extract Pro product ID"
fi
echo "   Product ID: $PRO_PRODUCT"

stripe prices create \
  --product "$PRO_PRODUCT" \
  --unit-amount 3900 \
  --currency usd \
  --recurring interval=month \
  > pro_price.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error output:"
    cat pro_price.json
    log_error "Failed to create Pro price"
fi

PRO_PRICE=$(extract_id "price" "pro_price.json")
if [ -z "$PRO_PRICE" ]; then
    echo "File content:"
    cat pro_price.json
    log_error "Could not extract Pro price ID"
fi
echo "   Price ID: $PRO_PRICE"
log_success "Pro Plan Created"
echo ""

# ENTERPRISE PLAN
echo "2️⃣  Creating Enterprise Plan (\$129/month)..."
stripe products create \
  --name "SHIJO.ai Enterprise" \
  --description "Enterprise SEO platform with AI visibility tracking and 200 rank tracking keywords" \
  > enterprise_product.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create Enterprise product"
fi

ENTERPRISE_PRODUCT=$(extract_id "prod" "enterprise_product.json")
if [ -z "$ENTERPRISE_PRODUCT" ]; then
    log_error "Could not extract Enterprise product ID"
fi
echo "   Product ID: $ENTERPRISE_PRODUCT"

stripe prices create \
  --product "$ENTERPRISE_PRODUCT" \
  --unit-amount 12900 \
  --currency usd \
  --recurring interval=month \
  > enterprise_price.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create Enterprise price"
fi

ENTERPRISE_PRICE=$(extract_id "price" "enterprise_price.json")
if [ -z "$ENTERPRISE_PRICE" ]; then
    log_error "Could not extract Enterprise price ID"
fi
echo "   Price ID: $ENTERPRISE_PRICE"
log_success "Enterprise Plan Created"
echo ""

# 10 CREDITS
echo "3️⃣  Creating 10 Credits Pack (\$1.00)..."
stripe products create \
  --name "10 Credits" \
  --description "One-time purchase: 10 credits for on-demand features" \
  > credits_10_product.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 10 Credits product"
fi

CREDITS_10_PRODUCT=$(extract_id "prod" "credits_10_product.json")
if [ -z "$CREDITS_10_PRODUCT" ]; then
    log_error "Could not extract 10 Credits product ID"
fi
echo "   Product ID: $CREDITS_10_PRODUCT"

stripe prices create \
  --product "$CREDITS_10_PRODUCT" \
  --unit-amount 100 \
  --currency usd \
  > credits_10_price.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 10 Credits price"
fi

CREDITS_10_PRICE=$(extract_id "price" "credits_10_price.json")
if [ -z "$CREDITS_10_PRICE" ]; then
    log_error "Could not extract 10 Credits price ID"
fi
echo "   Price ID: $CREDITS_10_PRICE"
log_success "10 Credits Created"
echo ""

# 50 CREDITS
echo "4️⃣  Creating 50 Credits Pack (\$4.75)..."
stripe products create \
  --name "50 Credits (5% Bonus)" \
  --description "One-time purchase: 50 credits with 5% bonus" \
  > credits_50_product.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 50 Credits product"
fi

CREDITS_50_PRODUCT=$(extract_id "prod" "credits_50_product.json")
if [ -z "$CREDITS_50_PRODUCT" ]; then
    log_error "Could not extract 50 Credits product ID"
fi
echo "   Product ID: $CREDITS_50_PRODUCT"

stripe prices create \
  --product "$CREDITS_50_PRODUCT" \
  --unit-amount 475 \
  --currency usd \
  > credits_50_price.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 50 Credits price"
fi

CREDITS_50_PRICE=$(extract_id "price" "credits_50_price.json")
if [ -z "$CREDITS_50_PRICE" ]; then
    log_error "Could not extract 50 Credits price ID"
fi
echo "   Price ID: $CREDITS_50_PRICE"
log_success "50 Credits Created"
echo ""

# 100 CREDITS
echo "5️⃣  Creating 100 Credits Pack (\$9.00)..."
stripe products create \
  --name "100 Credits (10% Bonus)" \
  --description "One-time purchase: 100 credits with 10% bonus" \
  > credits_100_product.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 100 Credits product"
fi

CREDITS_100_PRODUCT=$(extract_id "prod" "credits_100_product.json")
if [ -z "$CREDITS_100_PRODUCT" ]; then
    log_error "Could not extract 100 Credits product ID"
fi
echo "   Product ID: $CREDITS_100_PRODUCT"

stripe prices create \
  --product "$CREDITS_100_PRODUCT" \
  --unit-amount 900 \
  --currency usd \
  > credits_100_price.json 2>&1

if [ $? -ne 0 ]; then
    log_error "Failed to create 100 Credits price"
fi

CREDITS_100_PRICE=$(extract_id "price" "credits_100_price.json")
if [ -z "$CREDITS_100_PRICE" ]; then
    log_error "Could not extract 100 Credits price ID"
fi
echo "   Price ID: $CREDITS_100_PRICE"
log_success "100 Credits Created"
echo ""

###############################################################################
# SAVE CONFIGURATION
###############################################################################

echo "💾 Saving Configuration..."

cat > stripe-config.txt << EOF
SHIJO.AI STRIPE CONFIGURATION
Generated: $(date)
================================

PRODUCTS:
  Pro:        $PRO_PRODUCT
  Enterprise: $ENTERPRISE_PRODUCT
  10 Credits: $CREDITS_10_PRODUCT
  50 Credits: $CREDITS_50_PRODUCT
  100 Credits: $CREDITS_100_PRODUCT

PRICES (Use in code):
  PRO_PRICE_ID="$PRO_PRICE"
  ENTERPRISE_PRICE_ID="$ENTERPRISE_PRICE"
  CREDITS_10_PRICE_ID="$CREDITS_10_PRICE"
  CREDITS_50_PRICE_ID="$CREDITS_50_PRICE"
  CREDITS_100_PRICE_ID="$CREDITS_100_PRICE"

================================
PRICING:
  Pro:        \$39/month
  Enterprise: \$129/month
  10 Credits: \$1.00
  50 Credits: \$4.75
  100 Credits: \$9.00

================================
NEXT STEPS:

1. View products:
   https://dashboard.stripe.com/test/products

2. Create webhook manually:
   https://dashboard.stripe.com/test/webhooks
   URL: https://shijo.ai/api/webhooks/stripe
   Events: checkout.session.completed,
           customer.subscription.created,
           customer.subscription.updated,
           customer.subscription.deleted,
           invoice.payment_succeeded,
           invoice.payment_failed

3. Add webhook secret to .env.local:
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx

4. Add webhook secret to Vercel environment variables
================================
EOF

log_success "Configuration saved to stripe-config.txt"
echo ""

# Clean up JSON files
rm -f *.json

###############################################################################
# SUMMARY
###############################################################################

echo "=================================================="
echo "🎉 SETUP COMPLETE!"
echo "=================================================="
echo ""
echo "✅ All 5 products created successfully"
echo ""
echo "📄 Configuration: stripe-config.txt"
echo "📄 Full log: stripe-setup.log"
echo ""
echo "📋 PRODUCT IDs:"
echo "   Pro:        $PRO_PRODUCT ($PRO_PRICE)"
echo "   Enterprise: $ENTERPRISE_PRODUCT ($ENTERPRISE_PRICE)"
echo "   10 Credits: $CREDITS_10_PRODUCT ($CREDITS_10_PRICE)"
echo "   50 Credits: $CREDITS_50_PRODUCT ($CREDITS_50_PRICE)"
echo "   100 Credits: $CREDITS_100_PRODUCT ($CREDITS_100_PRICE)"
echo ""
echo "🔗 View: https://dashboard.stripe.com/test/products"
echo ""
echo "⚠️  CREATE WEBHOOK MANUALLY:"
echo "   1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "   2. Click 'Add endpoint'"
echo "   3. URL: https://shijo.ai/api/webhooks/stripe"
echo "   4. Select events (see stripe-config.txt)"
echo "   5. Copy webhook secret (whsec_xxxxx)"
echo "   6. Add to .env.local and Vercel"
echo ""
echo "=================================================="
