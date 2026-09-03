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
       print: overrides only. On screen this is unchanged.

       h-screen + overflow-hidden + overflow-y-auto means the browser has one
       scrolling viewport, so printing captured only the first screenful and
       silently truncated everything below it. Any dashboard page with a print
       action needs these three undone; doing it here fixes it once for all of
       them rather than per page.
    */
    <div className="flex h-screen bg-background print:block print:h-auto">
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
