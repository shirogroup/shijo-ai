'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    /*
       `dark` — FIXES A LIVE BUG, do not remove without reading this.

       app/globals.css defines the dark palette under a `.dark` class
       (--background: 0 0% 4%), and the entire dashboard is built for it: the
       sidebar and top bar hardcode bg-gray-950, the cards bg-gray-900, and
       every page uses text-white headings. But nothing ever APPLIED `.dark` —
       <html> carries no class, so --background stayed 0 0% 100% and the shell
       painted white while the components painted dark.

       The visible symptom, confirmed on production 2026-09-03: every
       text-white heading sitting on the page background rather than inside a
       card rendered white on white. "Welcome back, <name>" on /dashboard and
       "Quick Access" were invisible to every signed-in user. Headings inside
       cards looked fine, which is why it survived this long.

       Scoped here rather than on <html> deliberately: the marketing site is
       correctly light and must stay light, and app/layout.tsx is frozen. The
       custom properties inherit, so this one class gives the whole dashboard
       subtree the dark tokens it was written against.

       print: overrides only. On screen the layout below is unchanged.

       h-screen + overflow-hidden + overflow-y-auto means the browser has one
       scrolling viewport, so printing captured only the first screenful and
       silently truncated everything below it. Any dashboard page with a print
       action needs these three undone; doing it here fixes it once for all of
       them rather than per page.
    */
    <div className="dark flex h-screen bg-background print:block print:h-auto">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
