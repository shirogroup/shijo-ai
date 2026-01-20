#!/bin/bash

###############################################################################
# SHIJO.AI STRIPE PRODUCTS & PRICES SETUP
# Version 3 - Extensive Logging & Error Handling
###############################################################################

# Create log file
LOG_FILE="stripe-setup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🚀 SHIJO.AI Stripe Setup"
echo "================================"
echo "Log file: $LOG_FILE"
echo "Time: $(date)"
echo ""

# Function to log errors
log_error() {
    echo "❌ ERROR: $1"
    echo "Check $LOG_FILE for details"
    exit 1
}

# Function to log success
log_success() {
    echo "✅ $1"
}

# Function to extract ID from JSON (simple approach)
extract_id() {
    local pattern=$1
    local file=$2
    grep -o "${pattern}_[a-zA-Z0-9]*" "$file" 2>/dev/null | head -1
}

# Check if Stripe CLI is available
echo "Checking Stripe CLI..."
if ! command -v stripe &> /dev/null; then
    log_error "Stripe CLI not found"
fi
log_success "Stripe CLI found"

# Check if logged in
echo "Checking Stripe login..."
if ! stripe config --list &> /dev/null; then
    log_error "Not logged in to Stripe. Run: stripe login"
fi
log_success "Stripe CLI authenticated"
echo ""

###############################################################################
# CREATE PRO PLAN
###############################################################################

echo "📦 Creating Products..."
echo ""
echo "1️⃣  Creating Pro Plan (\$39/month)..."

# Create Pro Product
echo "   → Creating product..."
stripe products create \
  --name="SHIJO.ai Pro" \
  --description="Professional SEO toolkit with 100 expansions/month and 50 rank tracking keywords" \
  --metadata[plan_tier]="pro" \
  --metadata[expansions]="100" \
  --metadata[briefs]="300" \
  2>&1 | tee pro_product.json

if [ $? -ne 0 ]; then
    log_error "Failed to create Pro product"
fi

# Extract Product ID
PRO_PRODUCT=$(extract_id "prod" "pro_product.json")
if [ -z "$PRO_PRODUCT" ]; then
    log_error "Could not extract Pro product ID"
fi
echo "   → Product ID: $PRO_PRODUCT"

# Create Pro Price
echo "   → Creating price..."
stripe prices create \
  --product="$PRO_PRODUCT" \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=month \
  2>&1 | tee pro_price.json

if [ $? -ne 0 ]; then
    log_error "Failed to create Pro price"
fi

# Extract Price ID
PRO_PRICE=$(extract_id "price" "pro_price.json")
if [ -z "$PRO_PRICE" ]; then
    log_error "Could not extract Pro price ID"
fi
echo "   → Price ID: $PRO_PRICE"

log_success "Pro Plan Created"
echo ""

###############################################################################
# CREATE ENTERPRISE PLAN
###############################################################################

echo "2️⃣  Creating Enterprise Plan (\$129/month)..."

# Create Enterprise Product
echo "   → Creating product..."
stripe products create \
  --name="SHIJO.ai Enterprise" \
  --description="Enterprise SEO platform with AI visibility tracking and 200 rank tracking keywords" \
  --metadata[plan_tier]="enterprise" \
  --metadata[expansions]="5000" \
  --metadata[briefs]="2000" \
  2>&1 | tee enterprise_product.json

if [ $? -ne 0 ]; then
    log_error "Failed to create Enterprise product"
fi

ENTERPRISE_PRODUCT=$(extract_id "prod" "enterprise_product.json")
if [ -z "$ENTERPRISE_PRODUCT" ]; then
    log_error "Could not extract Enterprise product ID"
fi
echo "   → Product ID: $ENTERPRISE_PRODUCT"

# Create Enterprise Price
echo "   → Creating price..."
stripe prices create \
  --product="$ENTERPRISE_PRODUCT" \
  --unit-amount=12900 \
  --currency=usd \
  --recurring[interval]=month \
  2>&1 | tee enterprise_price.json

if [ $? -ne 0 ]; then
    log_error "Failed to create Enterprise price"
fi

ENTERPRISE_PRICE=$(extract_id "price" "enterprise_price.json")
if [ -z "$ENTERPRISE_PRICE" ]; then
    log_error "Could not extract Enterprise price ID"
fi
echo "   → Price ID: $ENTERPRISE_PRICE"

log_success "Enterprise Plan Created"
echo ""

###############################################################################
# CREATE CREDIT PACKS
###############################################################################

echo "3️⃣  Creating 10 Credits Pack (\$1.00)..."

echo "   → Creating product..."
stripe products create \
  --name="10 Credits" \
  --description="One-time purchase: 10 credits for on-demand features" \
  --metadata[credit_amount]="10" \
  2>&1 | tee credits_10_product.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 10 Credits product"
fi

CREDITS_10_PRODUCT=$(extract_id "prod" "credits_10_product.json")
if [ -z "$CREDITS_10_PRODUCT" ]; then
    log_error "Could not extract 10 Credits product ID"
fi
echo "   → Product ID: $CREDITS_10_PRODUCT"

echo "   → Creating price..."
stripe prices create \
  --product="$CREDITS_10_PRODUCT" \
  --unit-amount=100 \
  --currency=usd \
  2>&1 | tee credits_10_price.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 10 Credits price"
fi

CREDITS_10_PRICE=$(extract_id "price" "credits_10_price.json")
if [ -z "$CREDITS_10_PRICE" ]; then
    log_error "Could not extract 10 Credits price ID"
fi
echo "   → Price ID: $CREDITS_10_PRICE"

log_success "10 Credits Created"
echo ""

###############################################################################

echo "4️⃣  Creating 50 Credits Pack (\$4.75 - 5% bonus)..."

echo "   → Creating product..."
stripe products create \
  --name="50 Credits (5% Bonus)" \
  --description="One-time purchase: 50 credits with 5% bonus" \
  --metadata[credit_amount]="50" \
  2>&1 | tee credits_50_product.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 50 Credits product"
fi

CREDITS_50_PRODUCT=$(extract_id "prod" "credits_50_product.json")
if [ -z "$CREDITS_50_PRODUCT" ]; then
    log_error "Could not extract 50 Credits product ID"
fi
echo "   → Product ID: $CREDITS_50_PRODUCT"

echo "   → Creating price..."
stripe prices create \
  --product="$CREDITS_50_PRODUCT" \
  --unit-amount=475 \
  --currency=usd \
  2>&1 | tee credits_50_price.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 50 Credits price"
fi

CREDITS_50_PRICE=$(extract_id "price" "credits_50_price.json")
if [ -z "$CREDITS_50_PRICE" ]; then
    log_error "Could not extract 50 Credits price ID"
fi
echo "   → Price ID: $CREDITS_50_PRICE"

log_success "50 Credits Created"
echo ""

###############################################################################

echo "5️⃣  Creating 100 Credits Pack (\$9.00 - 10% bonus)..."

echo "   → Creating product..."
stripe products create \
  --name="100 Credits (10% Bonus)" \
  --description="One-time purchase: 100 credits with 10% bonus" \
  --metadata[credit_amount]="100" \
  2>&1 | tee credits_100_product.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 100 Credits product"
fi

CREDITS_100_PRODUCT=$(extract_id "prod" "credits_100_product.json")
if [ -z "$CREDITS_100_PRODUCT" ]; then
    log_error "Could not extract 100 Credits product ID"
fi
echo "   → Product ID: $CREDITS_100_PRODUCT"

echo "   → Creating price..."
stripe prices create \
  --product="$CREDITS_100_PRODUCT" \
  --unit-amount=900 \
  --currency=usd \
  2>&1 | tee credits_100_price.json

if [ $? -ne 0 ]; then
    log_error "Failed to create 100 Credits price"
fi

CREDITS_100_PRICE=$(extract_id "price" "credits_100_price.json")
if [ -z "$CREDITS_100_PRICE" ]; then
    log_error "Could not extract 100 Credits price ID"
fi
echo "   → Price ID: $CREDITS_100_PRICE"

log_success "100 Credits Created"
echo ""

###############################################################################
# CREATE WEBHOOK (Optional)
###############################################################################

echo "🔗 Webhook Setup..."
echo ""

WEBHOOK_SECRET=""

echo "Enter your production URL (e.g., https://shijo.ai)"
echo "Or press Enter to skip webhook creation:"
read -r PROD_URL

if [ -n "$PROD_URL" ]; then
    echo "Creating webhook endpoint..."
    stripe webhook_endpoints create \
      --url="$PROD_URL/api/webhooks/stripe" \
      --enabled-event checkout.session.completed \
      --enabled-event customer.subscription.created \
      --enabled-event customer.subscription.updated \
      --enabled-event customer.subscription.deleted \
      --enabled-event invoice.payment_succeeded \
      --enabled-event invoice.payment_failed \
      2>&1 | tee webhook.json
    
    if [ $? -eq 0 ]; then
        WEBHOOK_ID=$(extract_id "we" "webhook.json")
        WEBHOOK_SECRET=$(grep -o 'whsec_[a-zA-Z0-9]*' "webhook.json" | head -1)
        echo "   ✅ Webhook Created: $WEBHOOK_ID"
        echo "   🔐 Secret: $WEBHOOK_SECRET"
    else
        echo "   ⚠️  Webhook creation failed (you can create manually)"
    fi
else
    echo "   ⏭️  Webhook creation skipped"
fi
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
  Pro Plan:        $PRO_PRODUCT
  Enterprise Plan: $ENTERPRISE_PRODUCT
  10 Credits:      $CREDITS_10_PRODUCT
  50 Credits:      $CREDITS_50_PRODUCT
  100 Credits:     $CREDITS_100_PRODUCT

PRICES (Use these in your code):
  Pro:             $PRO_PRICE (\$39/month)
  Enterprise:      $ENTERPRISE_PRICE (\$129/month)
  10 Credits:      $CREDITS_10_PRICE (\$1.00)
  50 Credits:      $CREDITS_50_PRICE (\$4.75)
  100 Credits:     $CREDITS_100_PRICE (\$9.00)

WEBHOOK SECRET:
  $WEBHOOK_SECRET

================================
NEXT STEPS:

1. Add to .env.local:
   STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

2. Add to Vercel:
   https://vercel.com/shiro-technologies/shijo-ai/settings/environment-variables
   
3. View products:
   https://dashboard.stripe.com/test/products
================================
EOF

cat > stripe-config.env << EOF
# Environment variables for .env.local
STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

# Product IDs (for reference)
PRO_PRODUCT_ID=$PRO_PRODUCT
ENTERPRISE_PRODUCT_ID=$ENTERPRISE_PRODUCT
CREDITS_10_PRODUCT_ID=$CREDITS_10_PRODUCT
CREDITS_50_PRODUCT_ID=$CREDITS_50_PRODUCT
CREDITS_100_PRODUCT_ID=$CREDITS_100_PRODUCT

# Price IDs (use these in checkout)
PRO_PRICE_ID=$PRO_PRICE
ENTERPRISE_PRICE_ID=$ENTERPRISE_PRICE
CREDITS_10_PRICE_ID=$CREDITS_10_PRICE
CREDITS_50_PRICE_ID=$CREDITS_50_PRICE
CREDITS_100_PRICE_ID=$CREDITS_100_PRICE
EOF

log_success "Configuration saved"
echo ""

# Clean up JSON files
rm -f *.json

###############################################################################
# SUMMARY
###############################################################################

echo "================================"
echo "🎉 SETUP COMPLETE!"
echo "================================"
echo ""
echo "📋 ALL PRODUCTS CREATED:"
echo "   ✅ Pro Plan: \$39/month"
echo "   ✅ Enterprise Plan: \$129/month"
echo "   ✅ 10 Credits: \$1.00"
echo "   ✅ 50 Credits: \$4.75"
echo "   ✅ 100 Credits: \$9.00"
echo ""
echo "📄 FILES CREATED:"
echo "   • stripe-config.txt (complete reference)"
echo "   • stripe-config.env (environment variables)"
echo "   • stripe-setup.log (full execution log)"
echo ""
echo "🔗 VIEW IN STRIPE DASHBOARD:"
echo "   https://dashboard.stripe.com/test/products"
echo ""

if [ -n "$WEBHOOK_SECRET" ]; then
    echo "⚠️  IMPORTANT - Add webhook secret:"
    echo "   echo 'STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET' >> .env.local"
    echo ""
fi

echo "================================"
echo "Log saved to: $LOG_FILE"
echo "================================"
