'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Search,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  User,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Keywords', href: '/dashboard/keywords', icon: Search },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, quota, loading, logout } = useAuth();

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

  // Get plan display name
  const planDisplay = user?.planTier === 'free' ? 'Free Plan' : 
                       user?.planTier === 'pro' ? 'Pro Plan' : 
                       user?.planTier === 'enterprise' ? 'Enterprise' : 'Free Plan';

  // Get plan color
  const planColor = user?.planTier === 'free' ? 'text-gray-400' :
                    user?.planTier === 'pro' ? 'text-blue-400' :
                    user?.planTier === 'enterprise' ? 'text-purple-400' : 'text-gray-400';

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          SHIJO.AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
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
            {quota && (
              <p className="text-xs text-gray-500 mt-1">
                {quota.creditsBalance} credits
              </p>
            )}
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
