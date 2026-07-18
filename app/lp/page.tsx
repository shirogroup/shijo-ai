import { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Renamed to /ai-marketing-tools on 2026-07-18 — a real, searched phrase
// instead of an internal-sounding slug, per user request. The actual 301
// is handled by next.config.ts's redirects() (fires before this file is
// ever rendered); this component-level redirect() and noindex are just a
// safety net in case that config path is ever bypassed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LegacyLandingPageRedirect() {
  redirect('/ai-marketing-tools');
}
