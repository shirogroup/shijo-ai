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
  
  // subscriptions table uses timestamp() - Date objects OK
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
  
  // userQuotas uses date() - need string format 'YYYY-MM-DD'
  const billingCycleEndDate = new Date(subscription.current_period_end * 1000);
  
  await db.insert(userQuotas).values({
    userId: user.id,
    planTier,
    billingCycleStart: new Date().toISOString().split('T')[0],
    billingCycleEnd: billingCycleEndDate.toISOString().split('T')[0],
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
      billingCycleEnd: billingCycleEndDate.toISOString().split('T')[0],
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
