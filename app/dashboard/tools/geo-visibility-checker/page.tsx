import { redirect } from 'next/navigation';

/**
 * /dashboard/tools/geo-visibility-checker → /geo
 *
 * Why this file exists at all: a logged-in user who hears about the GEO
 * checker will reasonably look for it where the other tools live. This is a
 * STATIC route segment, which Next.js matches ahead of the sibling dynamic
 * [toolId] segment — so adding it does NOT touch, wrap, or alter the shared
 * tool renderer that all 12 existing tools depend on.
 *
 * Why it redirects rather than rendering the checker inline:
 *   - The checker is deliberately public and ad-safe. /geo is the single
 *     canonical URL for it, which keeps the SEO signal (and the sitemap
 *     entry) on one path instead of splitting it across two.
 *   - Everything under /dashboard is auth-gated by middleware.ts. Rendering
 *     the checker here would make it look like a gated feature.
 *
 * Note: this is NOT a 13th entry in lib/tools/registry.ts. TOOLS stays at
 * exactly 12 so every "12 tools" claim in public copy, metadata, JSON-LD
 * and the welcome email remains true.
 */
export default function GeoToolRedirect() {
  redirect('/geo');
}
