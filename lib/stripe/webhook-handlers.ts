import Stripe from 'stripe';
import { db } from '../../db';
import { users, credits, subscriptions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICE_IDS } from './products';
import { getStripeClient } from '../stripe';

const stripe = getStripeClient();

/**
 * Billing period for a subscription, tolerant of Stripe API version changes.
 *
 * 🔴 ROOT CAUSE OF A 100% WEBHOOK FAILURE RATE (found 2026-09-01).
 * This endpoint is registered with API version 2025-12-15.clover, where
 * `current_period_start` / `current_period_end` live on the SUBSCRIPTION ITEM,
 * not on the Subscription object. The old code read them off the subscription:
 *
 *     new Date(subscription.current_period_start * 1000)   // undefined * 1000
 *
 * which is NaN -> Invalid Date -> the Postgres write throws -> the route
 * returns 500. Every customer.subscription.created and .updated delivery had
 * failed since 2026-08-23, which is why users.subscription_id,
 * subscription_status and planTier were never written for paying customers —
 * and why the checkout route's "already subscribed" guard, which read those
 * columns, was inert.
 *
 * Reads the item first, falls back to the legacy subscription-level fields, and
 * returns null rather than an Invalid Date if neither is present (both columns
 * are nullable). A missing period must never again take the whole handler down.
 */
function subscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
} {
  const item = subscription.items?.data?.[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const legacy = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;

  return {
    currentPeriodStart: typeof start === 'number' ? new Date(start * 1000) : null,
    currentPeriodEnd: typeof end === 'number' ? new Date(end * 1000) : null,
  };
}

type PlanTier = 'pro' | 'plus' | 'growth' | 'enterprise';

/**
 * Map a Stripe price id to our internal plan tier.
 *
 * Must recognize every purchasable price ID — see lib/stripe/products.ts for
 * the naming convention (internal 'pro' = displayed "Standard", internal
 * 'growth' = displayed "Pro"). Defaults to 'pro' (Standard) if nothing
 * matches.
 *
 * Extracted 2026-09-01 so that BOTH subscription.created and
 * subscription.updated derive the tier the same way. It previously lived
 * inline in handleSubscriptionCreated only, which is why an upgrade made
 * through the Stripe Billing Portal took the customer's money and left
 * planTier untouched — see handleSubscriptionUpdated.
 */
function planTierForPrice(priceId: string | undefined): PlanTier {
  if (
    priceId === STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY ||
    priceId === STRIPE_PRICE_IDS.ENTERPRISE_ANNUAL
  ) {
    return 'enterprise';
  }
  if (priceId === STRIPE_PRICE_IDS.GROWTH_MONTHLY) {
    return 'growth';
  }
  // 'plus' added 2026-08-31. The id is env-driven, so guard on truthiness —
  // otherwise an unset PLUS_MONTHLY ('') would match a subscription whose
  // priceId is also somehow empty and silently downgrade a real customer.
  if (STRIPE_PRICE_IDS.PLUS_MONTHLY && priceId === STRIPE_PRICE_IDS.PLUS_MONTHLY) {
    return 'plus';
  }
  return 'pro';
}

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
  const planTier = planTierForPrice(priceId);
  
  await db
    .update(users)
    .set({
      planTier,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  
  // Upsert, not insert. Stripe retries a failed delivery, and
  // stripe_subscription_id is UNIQUE — a plain insert throws on the retry and
  // returns another 500, so a single transient failure would poison every
  // later attempt for that subscription.
  const period = subscriptionPeriod(subscription);
  await db
    .insert(subscriptions)
    .values({
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId!,
      status: subscription.status,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        stripePriceId: priceId!,
        status: subscription.status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
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
  
  // ⚠️ A PLAN CHANGE ARRIVES HERE, NOT IN handleSubscriptionCreated.
  // Switching plans through the Stripe Billing Portal updates the existing
  // subscription, so Stripe fires customer.subscription.updated. Until
  // 2026-09-01 this handler wrote only status and the period dates, so an
  // upgrade charged the customer (e.g. $36.63 proration, then $79/mo) and
  // left users.planTier on the OLD tier — money taken, plan not delivered,
  // and the old tier's limits still enforced by lib/tools/usage.ts.
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = planTierForPrice(priceId);

  const period = subscriptionPeriod(subscription);
  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      stripePriceId: priceId!,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  await db
    .update(users)
    .set({
      planTier,
      // Backfills the mirror for customers whose row predates this handler,
      // or whose 'created' webhook never landed — the empty-column state that
      // made the checkout guard inert (see the create-checkout route).
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(
    `Subscription updated for user ${user.id}, plan: ${planTier}, status: ${subscription.status}`
  );
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
