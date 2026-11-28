import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  GEO_CHECK_URL,
  LOG_PATH,
  MAIN_SITE_URL,
  MODULE_PATH,
} from "@/lib/learn/links";

/**
 * Training chrome for /learn.
 *
 * Deliberately not the product Header/Footer. On learn.shijo.ai every
 * non-training path is rewritten to this lesson, so product nav (pricing,
 * blog, contact) would loop back here. The shared footer also names the
 * legal entity; this course surface says SHIJO.AI.
 */
export function LearnChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50 print:hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Logo
            href={MODULE_PATH}
            iconClassName="w-8 h-8"
            textClassName="text-xl font-bold text-white"
          />
          <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
            <Link
              href={LOG_PATH}
              className="text-white hover:text-shiro-red transition-colors"
            >
              <span className="sm:hidden">Log</span>
              <span className="hidden sm:inline">Visibility Log</span>
            </Link>
            <a
              href={GEO_CHECK_URL}
              className="text-white hover:text-shiro-red transition-colors"
            >
              Free check
            </a>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="bg-shiro-black text-white print:hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <p className="text-gray-400">SHIJO.AI · Free Module 1</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href={MODULE_PATH} className="text-gray-400 hover:text-white transition-colors">
              Module 1
            </Link>
            <Link href={LOG_PATH} className="text-gray-400 hover:text-white transition-colors">
              Visibility Log
            </Link>
            <a href={MAIN_SITE_URL} className="text-gray-400 hover:text-white transition-colors">
              shijo.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
