'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wand2,
  Eye,
  Settings,
  CreditCard,
  LogOut,
  User,
  Crown,
  Sparkles,
} from 'lucide-react';
import { PLAN_DISPLAY_NAME } from '@/lib/stripe/plan-names';
import { startCheckout, type CheckoutPlanKey } from '@/lib/checkout-intent';

// Only tabs backed by a real, working page appear here. Keywords, Content and
// Analytics are still placeholders ("coming soon" screens with no data behind
// them) and were indistinguishable in this list from the tabs that work, so a
// paying user could not tell which was which until they clicked. Their routes
// still resolve if visited directly — they are hidden from navigation, not
// deleted. Restore an entry here the moment its page does something.
//
// 'AI Visibility' points straight at /geo, the live checker, rather than at
// /dashboard/ai-visibility, which was a "coming soon" waitlist screen for a
// feature that has been shipped and is being sold. Same reasoning as
// app/dashboard/tools/geo-visibility-checker: /geo is the one canonical URL.
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Tools', href: '/dashboard/tools', icon: Wand2 },
  { name: 'AI Visibility', href: '/geo', icon: Eye },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Upgrade CTAs used to be plain links to /dashboard/billing, which meant two
  // clicks and a page load before anyone reached a payment screen. They now go
  // straight to Stripe. The server decides which Stripe screen: a first-time
  // buyer gets Checkout, an existing subscriber gets a plan-change confirm
  // screen — see the ALREADY SUBSCRIBED branch in
  // app/api/stripe/create-checkout/route.ts. On any failure we fall back to
  // the old billing-page route so nobody is ever stranded on a dead button.
  const [upgrading, setUpgrading] = useState<CheckoutPlanKey | null>(null);

  const goToPayment = async (planKey: CheckoutPlanKey) => {
    setUpgrading(planKey);
    const result = await startCheckout(planKey);
    if (result.ok) return; // browser is navigating to Stripe
    if (result.unauthenticated) {
      window.location.href = `/register?plan=${planKey}`;
      return;
    }
    window.location.href = `/dashboard/billing?plan=${planKey}`;
  };

  if (loading) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950">
        <div className="p-6">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
        </div>
      </div>
    );
  }

  const userPlan = user?.planTier || 'free';
  // Was a hand-rolled ternary chain that got this wrong in two ways at once:
  // it rendered internal 'pro' as "Pro Plan" (the customer-facing name for
  // internal 'growth', i.e. the $199 tier) and had **no case for 'growth' at
  // all**, so a paying $199 customer fell through the else and was told they
  // were on the "Free Plan". Caught live 2026-08-23: a freshly-upgraded $29
  // Standard account showed "Standard plan — 12 tools" in the header and
  // "Pro Plan" in the sidebar on the same screen. Always route plan tiers
  // through PLAN_DISPLAY_NAME — the internal keys do not match the names
  // customers see, and duplicating that mapping is how they drift.
  const planDisplay = `${PLAN_DISPLAY_NAME[userPlan] ?? 'Free'} Plan`;
  const planColor = userPlan === 'free' ? 'text-gray-400' :
                    userPlan === 'pro' ? 'text-blue-400' :
                    userPlan === 'growth' ? 'text-indigo-400' :
                    userPlan === 'enterprise' ? 'text-purple-400' : 'text-gray-400';

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950">
      {/* Logo — matches landing page header */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="hsl(356, 100%, 43%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="hsl(356, 100%, 43%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="hsl(356, 100%, 43%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xl font-bold text-[hsl(356,100%,43%)]">SHIJO.AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Upgrade CTA for free users */}
        {userPlan === 'free' && (
          <div className="mt-6 mx-1">
            <button
              type="button"
              onClick={() => goToPayment('pro')}
              disabled={upgrading === 'pro'}
              className="block w-full text-left bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-lg p-4 hover:border-blue-600/50 transition-all disabled:opacity-60"
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  {upgrading === 'pro' ? 'Opening checkout…' : 'Upgrade to Standard'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Less than $1 a day for 200 AI generations a month
              </p>
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 mx-1 pt-4 border-t border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-3 px-2">Quick Links</p>
          <Link
            href="/dashboard/tools"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded transition-colors"
          >
            <Wand2 className="w-3 h-3" />
            All 12 Tools Overview
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded transition-colors"
          >
            <CreditCard className="w-3 h-3" />
            Pricing &amp; Plans
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(356,100%,43%)] to-[hsl(356,100%,33%)]">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || 'User'} className="h-10 w-10 rounded-full" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || user?.email || 'User'}
            </p>
            <p className={`text-xs ${planColor}`}>
              {planDisplay}
            </p>
          </div>
        </div>
        {/* Upgrade control for STANDARD users. Added 2026-08-31.
            Free users already had the "Upgrade to Standard" card in the nav
            above — but that card only renders for userPlan === 'free', so a
            paying Standard customer had no upgrade path in the chrome at all,
            and no plan mentioned Plus anywhere. This covers that gap without
            duplicating the free card. Hidden for plus/growth/enterprise, who
            have nothing above them to buy. */}
        {userPlan === 'pro' && (
          <Button
            size="sm"
            onClick={() => goToPayment('plus')}
            disabled={upgrading === 'plus'}
            className="mt-3 w-full justify-start bg-primary hover:bg-primary/90 text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {upgrading === 'plus' ? 'Opening Stripe…' : 'Upgrade to Plus — $79/mo'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-400 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
