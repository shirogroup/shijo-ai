'use client';

import { Search, Bell, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TopBar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Help */}
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-primary text-white text-xs">
            3
          </Badge>
        </div>

        {/* Credits Badge */}
        <div className="px-3 py-1.5 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            <span className="text-primary">3</span> / 3 expansions left
          </span>
        </div>
      </div>
    </header>
  );
}
