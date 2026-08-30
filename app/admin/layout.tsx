import Link from 'next/link';

/**
 * Admin shell.
 *
 * Added 2026-08-23. There was no layout under /admin at all, so every admin
 * page rendered as a bare document with no navigation — you could reach one
 * only by typing its URL, and there was no way to get from one to another.
 */
const pages = [
  { href: '/admin/usage', label: 'API spend' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/signups', label: 'Signups' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/terms', label: 'Terms' },
  // Added 2026-08-30 — vendor health, budget and scan history for the public
  // /geo checker. Read-mostly; the one write action (an admin test scan) is
  // capped separately from the public per-IP limit.
  { href: '/admin/geo-health', label: 'GEO / QA' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-1 px-6 py-3 overflow-x-auto">
          <Link href="/dashboard" className="text-sm font-semibold text-white mr-4 whitespace-nowrap">
            SHIJO.AI <span className="text-gray-500 font-normal">admin</span>
          </Link>
          {pages.map((p) => (
            <Link key={p.href} href={p.href}
              className="text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              {p.label}
            </Link>
          ))}
          <Link href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1.5 ml-auto whitespace-nowrap">
            ← Back to app
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
