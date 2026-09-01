import { redirect } from 'next/navigation';

/**
 * /dashboard/ai-visibility → /geo
 *
 * This route used to render a "coming soon" screen with a "Notify me when this
 * launches" waitlist button — for a feature that is built, live and being sold.
 * The public checker at /geo works, `app/api/geo/scan` persists every scan with
 * the signed-in user's id, and `lib/geo/entitlements.ts` enforces a per-plan
 * monthly allowance (Standard 4, Plus 30, Pro 100). A paying customer clicking
 * the tab named after the thing they bought was being told it did not exist.
 *
 * It redirects rather than rendering the checker inline for the same reasons as
 * app/dashboard/tools/geo-visibility-checker: /geo is the single canonical URL
 * for the checker, and duplicating it here would split the SEO signal and make
 * a deliberately public, ad-safe page look auth-gated.
 *
 * The sidebar now links to /geo directly, so this exists for bookmarks and for
 * anyone following an old link. The waitlist API route
 * (app/api/dashboard/ai-visibility-waitlist) is deliberately left in place —
 * it holds real signups and deleting it would destroy them.
 */
export default function AIVisibilityRedirect() {
  redirect('/geo');
}
