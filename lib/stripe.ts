import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: '2025-02-24.acacia' as const,
};

// Verify environment variables
export function verifyStripeConfig() {
  const missing = [];
  
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
  
  if (missing.length > 0) {
    throw new Error(`Missing Stripe environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}
