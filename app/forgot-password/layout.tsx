import type { Metadata } from 'next';

// The page itself is a client component and therefore cannot export
// metadata, so it lives here instead. Added 2026-08-22: without it this
// route inherited the root layout's title, leaving several public URLs
// sharing one <title>. Transactional page with no search value, so it is
// explicitly noindex.
export const metadata: Metadata = {
  title: 'Reset your password | SHIJO.AI',
  description: 'Request a password reset link for your SHIJO.AI account.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
