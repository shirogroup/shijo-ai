import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 SHIJO.ai &mdash; All rights reserved</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/ai-usage" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Usage</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
