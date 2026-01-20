'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Search, User } from 'lucide-react';

export function TopBar() {
  const { user, loading } = useAuth();

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords, content..."
            className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5 text-gray-400" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Info */}
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || 'User'} className="h-6 w-6 rounded-full" />
              ) : (
                <User className="h-3 w-3 text-white" />
              )}
            </div>
            <span className="text-sm text-gray-300">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
