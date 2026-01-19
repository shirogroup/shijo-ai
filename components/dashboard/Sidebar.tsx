'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/landing/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Keywords', href: '/dashboard/keywords', icon: Search },
  { name: 'Content Briefs', href: '/dashboard/briefs', icon: FileText, badge: 'Soon' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, badge: 'Soon' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'bg-black text-white flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">
              SHIJO<span className="text-primary">.ai</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-700 text-gray-400"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Unlock unlimited expansions and advanced features
            </p>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">U</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User Name</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          )}
          <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
