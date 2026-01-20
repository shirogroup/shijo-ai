#!/bin/bash

###############################################################################
# SHIJO.AI STRIPE SETUP - FINAL VERSION
# Based on actual Stripe CLI v1.29.0 syntax from --help
###############################################################################

LOG_FILE="stripe-setup-final.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 SHIJO.AI Stripe Setup - Final Version"
echo "========================================"
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
stripe --version
log_success "Stripe CLI ready"
echo ""

###############################################################################
# CHECK EXISTING PRODUCTS
###############################################################################

echo "📦 Checking existing products..."
stripe products list --limit 10 > all_products.json 2>&1

# Check if Pro product exists
PRO_PRODUCT=$(grep -o 'prod_[a-zA-Z0-9]*' all_products.json | head -1)

if [ -n "$PRO_PRODUCT" ]; then
    echo "⚠️  Found existing Pro product: $PRO_PRODUCT"
    echo "   Using existing product instead of creating new one"
    echo ""
else
    echo "Creating Pro product..."
    
    stripe products create \
      --name "SHIJO.ai Pro" \
      --description "Professional SEO toolkit with 100 expansions/month and 50 rank tracking keywords" \
      > pro_product.json 2>&1
    
    if [ $? -ne 0 ]; then
        echo "Error creating product:"
        cat pro_product.json
        log_error "Failed to create Pro product"
    fi
    
    PRO_PRODUCT=$(extract_id "prod" "pro_product.json")
    echo "   Created: $PRO_PRODUCT"
    echo ""
fi

###############################################################################
# CREATE PRICES FOR ALL PRODUCTS
###############################################################################

echo "💰 Creating Prices..."
echo ""

# PRO PRICE - $39/month
echo "1️⃣  Creating Pro Price (\$39/month)..."
stripe prices create \
  --product "$PRO_PRODUCT" \
  --unit-amount 3900 \
  --currency usd \
  --recurring.interval month \
  > pro_price.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error output:"
    cat pro_price.json
    log_error "Failed to create Pro price"
fi

PRO_PRICE=$(extract_id "price" "pro_price.json")
echo "   Price ID: $PRO_PRICE"
log_success "Pro Price Created (\$39/month)"
echo ""

# ENTERPRISE PRODUCT
echo "2️⃣  Creating Enterprise Product..."
stripe products create \
  --name "SHIJO.ai Enterprise" \
  --description "Enterprise SEO platform with AI visibility tracking and 200 rank tracking keywords" \
  > enterprise_product.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error:"
    cat enterprise_product.json
    log_error "Failed to create Enterprise product"
fi

ENTERPRISE_PRODUCT=$(extract_id "prod" "enterprise_product.json")
echo "   Product ID: $ENTERPRISE_PRODUCT"

# ENTERPRISE PRICE - $129/month
echo "   Creating Enterprise Price (\$129/month)..."
stripe prices create \
  --product "$ENTERPRISE_PRODUCT" \
  --unit-amount 12900 \
  --currency usd \
  --recurring.interval month \
  > enterprise_price.json 2>&1

if [ $? -ne 0 ]; then
    echo "Error:"
    cat enterprise_price.json
    log_error "Failed to create Enterprise price"
fi

ENTERPRISE_PRICE=$(extract_id "price" "enterprise_price.json")
echo "   Price ID: $ENTERPRISE_PRICE"
log_success "Enterprise Created (\$129/month)"
echo ""

# 10 CREDITS
echo "3️⃣  Creating 10 Credits..."
stripe products create \
  --name "10 Credits" \
  --description "One-time purchase: 10 credits for on-demand features" \
  > credits_10_product.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_10_product.json
    log_error "Failed to create 10 Credits product"
fi

CREDITS_10_PRODUCT=$(extract_id "prod" "credits_10_product.json")
echo "   Product ID: $CREDITS_10_PRODUCT"

stripe prices create \
  --product "$CREDITS_10_PRODUCT" \
  --unit-amount 100 \
  --currency usd \
  > credits_10_price.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_10_price.json
    log_error "Failed to create 10 Credits price"
fi

CREDITS_10_PRICE=$(extract_id "price" "credits_10_price.json")
echo "   Price ID: $CREDITS_10_PRICE"
log_success "10 Credits Created (\$1.00)"
echo ""

# 50 CREDITS
echo "4️⃣  Creating 50 Credits (5% Bonus)..."
stripe products create \
  --name "50 Credits (5% Bonus)" \
  --description "One-time purchase: 50 credits with 5% bonus" \
  > credits_50_product.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_50_product.json
    log_error "Failed to create 50 Credits product"
fi

CREDITS_50_PRODUCT=$(extract_id "prod" "credits_50_product.json")
echo "   Product ID: $CREDITS_50_PRODUCT"

stripe prices create \
  --product "$CREDITS_50_PRODUCT" \
  --unit-amount 475 \
  --currency usd \
  > credits_50_price.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_50_price.json
    log_error "Failed to create 50 Credits price"
fi

CREDITS_50_PRICE=$(extract_id "price" "credits_50_price.json")
echo "   Price ID: $CREDITS_50_PRICE"
log_success "50 Credits Created (\$4.75)"
echo ""

# 100 CREDITS
echo "5️⃣  Creating 100 Credits (10% Bonus)..."
stripe products create \
  --name "100 Credits (10% Bonus)" \
  --description "One-time purchase: 100 credits with 10% bonus" \
  > credits_100_product.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_100_product.json
    log_error "Failed to create 100 Credits product"
fi

CREDITS_100_PRODUCT=$(extract_id "prod" "credits_100_product.json")
echo "   Product ID: $CREDITS_100_PRODUCT"

stripe prices create \
  --product "$CREDITS_100_PRODUCT" \
  --unit-amount 900 \
  --currency usd \
  > credits_100_price.json 2>&1

if [ $? -ne 0 ]; then
    cat credits_100_price.json
    log_error "Failed to create 100 Credits price"
fi

CREDITS_100_PRICE=$(extract_id "price" "credits_100_price.json")
echo "   Price ID: $CREDITS_100_PRICE"
log_success "100 Credits Created (\$9.00)"
echo ""

###############################################################################
# SAVE CONFIGURATION
###############################################################################

echo "💾 Saving Configuration..."

cat > stripe-config.txt << EOF
====================================
SHIJO.AI STRIPE CONFIGURATION
====================================
Generated: $(date)

PRODUCTS:
  Pro:        $PRO_PRODUCT
  Enterprise: $ENTERPRISE_PRODUCT
  10 Credits: $CREDITS_10_PRODUCT
  50 Credits: $CREDITS_50_PRODUCT
  100 Credits: $CREDITS_100_PRODUCT

PRICES (Use these IDs in your code):
  PRO_PRICE_ID="$PRO_PRICE"
  ENTERPRISE_PRICE_ID="$ENTERPRISE_PRICE"
  CREDITS_10_PRICE_ID="$CREDITS_10_PRICE"
  CREDITS_50_PRICE_ID="$CREDITS_50_PRICE"
  CREDITS_100_PRICE_ID="$CREDITS_100_PRICE"

PRICING:
  Pro:        \$39/month recurring
  Enterprise: \$129/month recurring
  10 Credits: \$1.00 one-time
  50 Credits: \$4.75 one-time (5% bonus)
  100 Credits: \$9.00 one-time (10% bonus)

====================================
NEXT STEPS:
====================================

1. View products in Stripe Dashboard:
   https://dashboard.stripe.com/test/products

2. Create webhook endpoint:
   https://dashboard.stripe.com/test/webhooks
   
   Click "Add endpoint"
   Endpoint URL: https://shijo.ai/api/webhooks/stripe
   
   Select these events:
   ✓ checkout.session.completed
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.payment_succeeded
   ✓ invoice.payment_failed
   
   After creating, copy the "Signing secret" (starts with whsec_)

3. Add webhook secret to .env.local:
   echo 'STRIPE_WEBHOOK_SECRET=whsec_xxxxx' >> .env.local

4. Add webhook secret to Vercel:
   Go to: https://vercel.com/shiro-technologies/shijo-ai/settings/environment-variables
   Add: STRIPE_WEBHOOK_SECRET = whsec_xxxxx

====================================
EOF

# Also save as environment file format
cat > stripe-config.env << EOF
# STRIPE PRICE IDs - Add these to your code
NEXT_PUBLIC_PRO_PRICE_ID=$PRO_PRICE
NEXT_PUBLIC_ENTERPRISE_PRICE_ID=$ENTERPRISE_PRICE
NEXT_PUBLIC_CREDITS_10_PRICE_ID=$CREDITS_10_PRICE
NEXT_PUBLIC_CREDITS_50_PRICE_ID=$CREDITS_50_PRICE
NEXT_PUBLIC_CREDITS_100_PRICE_ID=$CREDITS_100_PRICE

# Products (for reference)
PRO_PRODUCT_ID=$PRO_PRODUCT
ENTERPRISE_PRODUCT_ID=$ENTERPRISE_PRODUCT
CREDITS_10_PRODUCT_ID=$CREDITS_10_PRODUCT
CREDITS_50_PRODUCT_ID=$CREDITS_50_PRODUCT
CREDITS_100_PRODUCT_ID=$CREDITS_100_PRODUCT
EOF

log_success "Configuration saved"
echo ""

# Clean up temp files
rm -f *.json

###############################################################################
# SUMMARY
###############################################################################

echo "========================================"
echo "🎉 STRIPE SETUP COMPLETE!"
echo "========================================"
echo ""
echo "✅ All 5 products and prices created"
echo ""
echo "📄 Configuration files:"
echo "   • stripe-config.txt (human readable)"
echo "   • stripe-config.env (environment format)"
echo "   • stripe-setup-final.log (full log)"
echo ""
echo "📋 PRICE IDs (copy these):"
echo "   Pro:        $PRO_PRICE"
echo "   Enterprise: $ENTERPRISE_PRICE"
echo "   10 Credits: $CREDITS_10_PRICE"
echo "   50 Credits: $CREDITS_50_PRICE"
echo "   100 Credits: $CREDITS_100_PRICE"
echo ""
echo "🔗 View in dashboard:"
echo "   https://dashboard.stripe.com/test/products"
echo ""
echo "⚠️  IMPORTANT: Create webhook endpoint manually"
echo "   Follow instructions in stripe-config.txt"
echo ""
echo "========================================"
