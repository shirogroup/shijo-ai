import Stripe from 'stripe';
import { db } from '../../db';
import { users, credits, subscriptions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICE_IDS } from './products';
import { getStripeClient } from '../stripe';

const stripe = getStripeClient();

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
  
  if (priceId === STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY) {
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

  // Note: per-feature quota tracking (userQuotas) was retired — plan
  // access/limits are enforced entirely via lib/tools/usage.ts, keyed off
  // users.planTier (already updated above).

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
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) return;

  // Monthly AI-tools usage resets automatically — lib/tools/usage.ts counts
  // usageLogs rows since the start of the calendar month, no explicit
  // reset needed here.
  console.log(`Invoice payment succeeded for user ${user.id}`);
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
      // Note: credit packs are not currently purchasable (CREDIT_PACKS_ENABLED
      // is false in lib/stripe/products.ts, sandbox price IDs only) — this
      // path records purchase history but no longer maintains a separate
      // userQuotas.creditsBalance counter, since that system was retired.
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
