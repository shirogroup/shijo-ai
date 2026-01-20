#!/bin/bash

# ============================================================
# SHIJO.AI VERIFIED FIX - Based on Actual Schema Inspection
# All field names confirmed from db/schema.ts
# ============================================================

set -e

echo "🔧 Starting VERIFIED fix based on actual schema..."

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

# ============================================================
# STEP 1: FIX TSCONFIG.JSON
# ============================================================

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/db": ["./db/index.ts"],
      "@/db/schema": ["./db/schema.ts"],
      "@/lib/*": ["./lib/*"]
    },
    "target": "ES2017"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo "✅ tsconfig.json updated"

# ============================================================
# STEP 2: FIX WEBHOOK HANDLERS
# Using camelCase TypeScript keys as defined in schema
# ============================================================

cat > lib/stripe/webhook-handlers.ts << 'EOF'
import Stripe from 'stripe';
import { db } from '../../db';
import { users, userQuotas, credits, subscriptions } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { PLAN_FEATURES } from './products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }
  
  const priceId = subscription.items.data[0]?.price.id;
  let planTier: 'pro' | 'enterprise' = 'pro';
  
  if (priceId === 'price_1SrTjfHF4DsT3nucTM6xX6eu') {
    planTier = 'enterprise';
  }
  
  await db
    .update(users)
    .set({
      planTier,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId!,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
  
  const planFeatures = PLAN_FEATURES[planTier].features;
  const billingCycleEnd = new Date(subscription.current_period_end * 1000);
  
  await db.insert(userQuotas).values({
    userId: user.id,
    planTier,
    billingCycleStart: new Date(),
    billingCycleEnd,
    seedKeywordsQuota: planFeatures.seedKeywords,
    expansionsQuota: planFeatures.expansions,
    clusteringQuota: planFeatures.clustering,
    briefsQuota: planFeatures.briefs,
    auditsQuota: planFeatures.audits,
    metaGenQuota: planFeatures.metaGen,
    aeoQuota: planFeatures.aeo,
    searchVolumeQuota: planFeatures.searchVolume,
    serpSnapshotsQuota: planFeatures.serpSnapshots,
    aiVisibilityScansQuota: planFeatures.aiVisibility,
    aiSimulatorQuota: planFeatures.aiSimulator,
    predictiveSeoQuota: planFeatures.predictiveSeo,
  }).onConflictDoUpdate({
    target: [userQuotas.userId],
    set: {
      planTier,
      billingCycleEnd,
      seedKeywordsQuota: planFeatures.seedKeywords,
      expansionsQuota: planFeatures.expansions,
      clusteringQuota: planFeatures.clustering,
      briefsQuota: planFeatures.briefs,
      auditsQuota: planFeatures.audits,
      metaGenQuota: planFeatures.metaGen,
      aeoQuota: planFeatures.aeo,
      searchVolumeQuota: planFeatures.searchVolume,
      serpSnapshotsQuota: planFeatures.serpSnapshots,
      aiVisibilityScansQuota: planFeatures.aiVisibility,
      aiSimulatorQuota: planFeatures.aiSimulator,
      predictiveSeoQuota: planFeatures.predictiveSeo,
      updatedAt: new Date(),
    },
  });
  
  console.log(`Subscription created for user ${user.id}, plan: ${planTier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  
  if (!user) return;
  
  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  
  await db
    .update(users)
    .set({
      subscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  
  if (!user) return;
  
  await db
    .update(users)
    .set({
      planTier: 'free',
      subscriptionStatus: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  
  await db
    .update(userQuotas)
    .set({
      planTier: 'free',
      expansionsQuota: 0,
      clusteringQuota: 0,
      briefsQuota: 0,
      auditsQuota: 0,
      aeoQuota: 0,
      searchVolumeQuota: 0,
      serpSnapshotsQuota: 0,
      aiVisibilityScansQuota: 0,
      aiSimulatorQuota: 0,
      predictiveSeoQuota: 0,
      updatedAt: new Date(),
    })
    .where(eq(userQuotas.userId, user.id));
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  
  if (!user) return;
  
  await db
    .update(userQuotas)
    .set({
      seedKeywordsUsed: 0,
      expansionsUsed: 0,
      clusteringUsed: 0,
      briefsUsed: 0,
      auditsUsed: 0,
      metaGenUsed: 0,
      aeoUsed: 0,
      searchVolumeUsed: 0,
      serpSnapshotsUsed: 0,
      aiVisibilityScansUsed: 0,
      aiSimulatorUsed: 0,
      predictiveSeoUsed: 0,
      updatedAt: new Date(),
    })
    .where(eq(userQuotas.userId, user.id));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for customer: ${invoice.customer}`);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  
  if (!user) return;
  
  if (session.mode === 'payment') {
    const amountTotal = session.amount_total || 0;
    
    let creditsToAdd = 0;
    if (amountTotal === 100) creditsToAdd = 10;
    else if (amountTotal === 475) creditsToAdd = 50;
    else if (amountTotal === 900) creditsToAdd = 100;
    
    if (creditsToAdd > 0) {
      await db
        .update(userQuotas)
        .set({
          creditsBalance: sql`COALESCE(${userQuotas.creditsBalance}, 0) + ${creditsToAdd}`,
          updatedAt: new Date(),
        })
        .where(eq(userQuotas.userId, user.id));
      
      await db.insert(credits).values({
        userId: user.id,
        amount: creditsToAdd,
        stripePaymentIntentId: session.payment_intent as string,
      });
      
      console.log(`Added ${creditsToAdd} credits to user ${user.id}`);
    }
  }
}

export async function handleStripeWebhook(event: Stripe.Event) {
  console.log(`Received Stripe webhook: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    throw error;
  }
}
EOF

echo "✅ webhook-handlers.ts updated"

# ============================================================
# STEP 3: FIX EXPAND ROUTE
# ============================================================

mkdir -p app/api/keywords/\[id\]/expand
cat > app/api/keywords/\[id\]/expand/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { keywords, keywordExpansions, userQuotas } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { userId } = await req.json();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID format' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    const [quota] = await db
      .select()
      .from(userQuotas)
      .where(eq(userQuotas.userId, userId))
      .limit(1);
    
    if (!quota) {
      return NextResponse.json(
        { error: 'User quota not found' },
        { status: 404 }
      );
    }
    
    // Fields have defaults, but check anyway
    const expansionsUsed = quota.expansionsUsed ?? 0;
    const expansionsQuota = quota.expansionsQuota ?? 0;
    
    if (expansionsUsed >= expansionsQuota) {
      return NextResponse.json(
        { error: 'Expansion quota exceeded', quotaExceeded: true },
        { status: 429 }
      );
    }
    
    const [keyword] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, id))
      .limit(1);
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Generate 20 long-tail keyword variations for: "${keyword.keyword}". Return ONLY a JSON array of strings: ["keyword1", "keyword2", ...]`
        }
      ],
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const expansions = JSON.parse(responseText);
    
    const insertPromises = expansions.map((expansion: string) =>
      db.insert(keywordExpansions).values({
        keywordId: keyword.id,
        expansion,
        method: 'ai',
      })
    );
    
    await Promise.all(insertPromises);
    
    await db
      .update(userQuotas)
      .set({
        expansionsUsed: expansionsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(userQuotas.userId, userId));
    
    return NextResponse.json({
      expansions,
      quotaRemaining: expansionsQuota - expansionsUsed - 1,
    });
    
  } catch (error) {
    console.error('Expansion error:', error);
    return NextResponse.json(
      { error: 'Failed to expand keyword' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ expand route updated"

# ============================================================
# STEP 4: FIX CLASSIFY ROUTE
# ============================================================

mkdir -p app/api/keywords/\[id\]/classify
cat > app/api/keywords/\[id\]/classify/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { keywords, keywordIntents } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID format' },
        { status: 400 }
      );
    }
    
    const [keyword] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, id))
      .limit(1);
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent for this keyword: "${keyword.keyword}". Return ONLY a JSON object with: {"intent": "informational|navigational|commercial|transactional", "confidence": 0.0-1.0}`
        }
      ],
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = JSON.parse(responseText);
    
    await db.insert(keywordIntents).values({
      keywordId: keyword.id,
      intent: result.intent,
      confidence: result.confidence.toString(),
    });
    
    return NextResponse.json({
      intent: result.intent,
      confidence: result.confidence,
    });
    
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify keyword' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ classify route updated"

# ============================================================
# STEP 5: FIX BILLING ROUTES
# ============================================================

cat > app/api/billing/checkout/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, mode = 'subscription' } = await req.json();
    
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId' },
        { status: 400 }
      );
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
    
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
EOF

cat > app/api/billing/portal/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User not found or no Stripe customer' },
        { status: 404 }
      );
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/dashboard`,
    });
    
    return NextResponse.json({
      url: session.url,
    });
    
  } catch (error) {
    console.error('Portal session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
EOF

cat > app/api/webhooks/stripe/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhook } from '../../../../lib/stripe/webhook-handlers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    await handleStripeWebhook(event);
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ billing routes updated"

# ============================================================
# STEP 6: BUILD
# ============================================================

echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ BUILD SUCCESSFUL!"
  echo "📤 Committing to Git..."
  git add .
  git commit -m "fix: correct all field names based on verified schema inspection"
  git push origin main
  echo "🎉 COMPLETE! All fixes applied and pushed to GitHub!"
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi
