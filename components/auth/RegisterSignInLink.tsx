'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parsePlanIntent } from '@/lib/checkout-intent';

/**
 * The "Already have an account? Sign in" link on /register.
 *
 * WHY THIS IS A COMPONENT AND NOT A PLAIN <Link href="/login">
 * A logged-out visitor who clicks "Choose Plus" on /pricing is sent to
 * /register?plan=plus. If they already have an account they use this link — and
 * before this component existed it was a bare href="/login", which dropped the
 * ?plan= param. They signed in and landed on /dashboard with no Stripe, no
 * paywall and no memory of the plan they had chosen: exactly the funnel bug
 * 7dad555 was written to eliminate, surviving on the returning-customer path.
 *
 * LoginForm already resumes the checkout when it sees ?plan= (and its own
 * "Sign up" link already forwards the intent the other way), so carrying the
 * param across is the whole fix.
 *
 * WHY THE SUSPENSE BOUNDARY LIVES HERE
 * useSearchParams() opts a component out of static prerendering and `next build`
 * hard-fails without a boundary — that is what broke the build on 7dad555. The
 * boundary is inside this file so app/register/page.tsx stays a static server
 * component and does not have to take `searchParams` as a prop, which would make
 * the whole route dynamic.
 *
 * The fallback is the plain /login link, so the link is never missing or dead
 * during hydration — it just briefly lacks the plan param.
 */

const LINK_CLASS =
  'text-[#CC0000] font-semibold hover:text-[#990000] transition-colors';

function SignInLinkInner() {
  const searchParams = useSearchParams();
  const plan = parsePlanIntent(searchParams.get('plan'));

  return (
    <Link href={plan ? `/login?plan=${plan}` : '/login'} className={LINK_CLASS}>
      Sign in
    </Link>
  );
}

export function RegisterSignInLink() {
  return (
    <Suspense
      fallback={
        <Link href="/login" className={LINK_CLASS}>
          Sign in
        </Link>
      }
    >
      <SignInLinkInner />
    </Suspense>
  );
}
