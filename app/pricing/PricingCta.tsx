'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { startCheckout, type CheckoutPlanKey } from '@/lib/checkout-intent';

/**
 * Pricing page call-to-action.
 *
 * BEFORE THIS EXISTED the paid CTAs were plain <Link href="/dashboard/billing">.
 * A logged-out visitor clicking "Choose Plus" was bounced to /login, then
 * (because RegisterForm hard-coded its redirect) dropped on /dashboard with no
 * paywall, no Plus card and no memory of what they had clicked. Stripe was
 * never called at any point.
 *
 * Now:
 *   signed in  -> POST create-checkout, go straight to Stripe
 *   signed out -> /register?plan=<key>, and RegisterForm resumes the checkout
 *
 * The free plan does NOT use this component — it stays an ordinary link to
 * /register with no plan param, so "Start free" can never open Stripe.
 */
export function PricingCta({
  planKey,
  label,
  highlight,
}: {
  planKey: CheckoutPlanKey;
  label: string;
  highlight?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setBusy(true);
    setError('');

    const result = await startCheckout(planKey);

    if (result.ok) return; // browser is navigating to Stripe

    if (result.unauthenticated) {
      // Carry the intent through signup as an opaque, allowlisted token.
      // Not a URL — see the note in lib/checkout-intent.ts about why this is
      // deliberately not expressed through ?redirect=.
      window.location.href = `/register?plan=${planKey}`;
      return;
    }

    setError(result.error || 'Could not start checkout.');
    setBusy(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          highlight ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
        }`}
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy ? 'Starting checkout…' : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}{' '}
          <Link href="/dashboard/billing" className="underline">
            Open billing
          </Link>
        </p>
      )}
    </div>
  );
}
