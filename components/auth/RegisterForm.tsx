'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { parsePlanIntent, startCheckout } from '@/lib/checkout-intent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Inner form. Split out from the exported RegisterForm below purely so the
 * Suspense boundary can live in THIS file.
 *
 * useSearchParams() opts a component out of static prerendering, and Next
 * fails the build unless it sits inside a <Suspense>. /login solves this at
 * the page level (app/login/page.tsx wraps <LoginForm/>), but app/register
 * /page.tsx is not ours to change in this pass — so the boundary is here
 * instead. The page's `import { RegisterForm }` and `<RegisterForm />` are
 * untouched.
 */
function RegisterFormInner() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  // Checkout intent carried from /pricing. Validated against a hardcoded
  // allowlist (pro | plus | growth) — it is a plan key, never a URL, so it
  // cannot be turned into an open redirect. See lib/checkout-intent.ts.
  // 'free' is not in the allowlist, so "Start free" can never land here.
  const planIntent = parsePlanIntent(searchParams.get('plan'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!acceptedTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue');
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password, confirmPassword, name, acceptedTerms);

      if (result.success) {
        // Fire a dataLayer event so Google Tag Manager can trigger a
        // "signup complete" conversion tag (e.g. Google Ads conversion
        // tracking). No PII (email/name) is included in the payload.
        if (typeof window !== 'undefined') {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({ event: 'sign_up_complete' });
        }
        // Small delay so GTM tags listening for the event above have a
        // moment to fire their pixel/beacon before the page navigates away.
        setTimeout(async () => {
          // Resume the checkout the visitor started on /pricing. Before this,
          // the redirect was hardcoded to /dashboard, so someone who clicked
          // "Choose Plus" was silently dropped on an empty dashboard with no
          // paywall and no memory of what they had asked for.
          if (planIntent) {
            const result = await startCheckout(planIntent);
            if (result.ok) return; // navigating to Stripe

            // Checkout could not start (price id misconfigured, Stripe down,
            // plan not purchasable on this environment). Do NOT strand them:
            // send them to billing with the intent intact so the
            // complete-your-upgrade banner offers the same action again.
            window.location.href = `/dashboard/billing?canceled=1&plan=${planIntent}`;
            return;
          }
          window.location.href = '/dashboard';
        }, 250);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
          <p className="text-xs text-gray-400">At least 8 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            id="acceptedTerms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={loading}
            required
            className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-shiro-red focus:ring-shiro-red"
          />
          <Label htmlFor="acceptedTerms" className="text-sm font-normal leading-snug text-gray-500">
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-shiro-red hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-shiro-red hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !acceptedTerms}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </>
  );
}

/**
 * Exported entry point. Same name and same props as before, so
 * app/register/page.tsx does not change.
 *
 * The Suspense boundary is required: RegisterFormInner calls
 * useSearchParams(), and /register is statically prerendered, so `next build`
 * hard-fails with "useSearchParams() should be wrapped in a suspense
 * boundary". That is what broke the build on commit 7dad555.
 *
 * The fallback mirrors the real form's vertical rhythm (4 fields + consent
 * line + button) so the card does not jump when the client form hydrates.
 */
export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-md bg-gray-200" />
            </div>
          ))}
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-md bg-gray-200" />
        </div>
      }
    >
      <RegisterFormInner />
    </Suspense>
  );
}
