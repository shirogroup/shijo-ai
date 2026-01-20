#!/bin/bash

###############################################################################
# STRIPE DIAGNOSTIC - Query existing data and test syntax
###############################################################################

echo "🔍 STRIPE DIAGNOSTIC SCRIPT"
echo "================================"
echo ""

# Test 1: List existing products
echo "TEST 1: Listing existing products..."
stripe products list --limit 5 > existing_products.txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Products list retrieved"
    echo "Found products:"
    cat existing_products.txt | grep -E '(id|name)' | head -10
else
    echo "❌ Failed to list products"
    cat existing_products.txt
fi
echo ""

# Test 2: List existing prices
echo "TEST 2: Listing existing prices..."
stripe prices list --limit 5 > existing_prices.txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Prices list retrieved"
    echo "Found prices:"
    cat existing_prices.txt | grep -E '(id|product|unit_amount)' | head -10
else
    echo "❌ Failed to list prices"
    cat existing_prices.txt
fi
echo ""

# Test 3: Check help for products create
echo "TEST 3: Getting help for 'products create'..."
stripe products create --help > products_help.txt 2>&1
echo "✅ Help saved to products_help.txt"
echo ""

# Test 4: Check help for prices create
echo "TEST 4: Getting help for 'prices create'..."
stripe prices create --help > prices_help.txt 2>&1
echo "✅ Help saved to prices_help.txt"
echo ""

# Test 5: Try creating a simple test product
echo "TEST 5: Creating test product (simple syntax)..."
stripe products create \
  -n "Test Product" \
  -d "Testing syntax" \
  > test_product.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Test product created"
    TEST_PROD_ID=$(grep -o 'prod_[a-zA-Z0-9]*' test_product.txt | head -1)
    echo "Product ID: $TEST_PROD_ID"
    
    # Test 6: Try creating a test price (try different syntax)
    echo ""
    echo "TEST 6: Creating test price - Syntax A (space-separated)..."
    stripe prices create \
      -p "$TEST_PROD_ID" \
      -u 100 \
      -c usd \
      > test_price_a.txt 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Syntax A works!"
        cat test_price_a.txt | grep -E '(id|amount)'
    else
        echo "❌ Syntax A failed"
        cat test_price_a.txt
    fi
    
    echo ""
    echo "TEST 7: Creating test price - Syntax B (recurring separate)..."
    stripe prices create \
      --product "$TEST_PROD_ID" \
      --unit_amount 200 \
      --currency usd \
      --recurring_interval month \
      > test_price_b.txt 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Syntax B works!"
        cat test_price_b.txt | grep -E '(id|amount)'
    else
        echo "❌ Syntax B failed"
        cat test_price_b.txt
    fi
    
    echo ""
    echo "TEST 8: Creating test price - Syntax C (short flags)..."
    stripe prices create \
      -p "$TEST_PROD_ID" \
      -u 300 \
      -c usd \
      -r interval=month \
      > test_price_c.txt 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Syntax C works!"
        cat test_price_c.txt | grep -E '(id|amount)'
    else
        echo "❌ Syntax C failed"
        cat test_price_c.txt
    fi
    
else
    echo "❌ Test product creation failed"
    cat test_product.txt
fi

echo ""
echo "================================"
echo "DIAGNOSTIC COMPLETE"
echo "================================"
echo ""
echo "Files created:"
echo "  - existing_products.txt (current products in Stripe)"
echo "  - existing_prices.txt (current prices in Stripe)"
echo "  - products_help.txt (syntax reference for products)"
echo "  - prices_help.txt (syntax reference for prices)"
echo "  - test_product.txt (test product creation)"
echo "  - test_price_*.txt (test price creation attempts)"
echo ""
echo "Please share these files so we can determine correct syntax!"
