'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Wand2,
  Search,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  User,
  Crown,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Tools', href: '/dashboard/tools', icon: Wand2 },
  { name: 'Keywords', href: '/dashboard/keywords', icon: Search },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
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
  const planDisplay = userPlan === 'free' ? 'Free Plan' :
                      userPlan === 'pro' ? 'Pro Plan' :
                      userPlan === 'enterprise' ? 'Enterprise' : 'Free Plan';
  const planColor = userPlan === 'free' ? 'text-gray-400' :
                    userPlan === 'pro' ? 'text-blue-400' :
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
            <Link
              href="/dashboard/billing"
              className="block bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-lg p-4 hover:border-blue-600/50 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-gray-400">
                Unlock all 24 tools &amp; 200 gens/month for $29/mo
              </p>
            </Link>
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
            All 24 Tools Overview
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded transition-colors"
          >
            <CreditCard className="w-3 h-3" />
            Pricing &amp; Plans
          </a>
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
