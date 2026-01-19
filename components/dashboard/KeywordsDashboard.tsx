'use client';

import { Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { KeywordsTable } from '@/components/dashboard/KeywordsTable';
import { AddKeywordModal } from '@/components/dashboard/AddKeywordModal';

export function KeywordsDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Keywords</h1>
          <p className="text-muted-foreground">
            Manage your keyword research and track opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <AddKeywordModal />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Keywords Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Keywords</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>4 keywords</span>
            <span>•</span>
            <span>Updated 5 min ago</span>
          </div>
        </div>
        <KeywordsTable />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">📊 Bulk Expand</h3>
          <p className="text-sm text-muted-foreground">
            Expand multiple keywords at once (uses 3 credits each)
          </p>
        </div>
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">🎯 Auto-Classify</h3>
          <p className="text-sm text-muted-foreground">
            Classify search intent for all unclassified keywords
          </p>
        </div>
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
          <h3 className="font-semibold mb-2">🔗 Create Cluster</h3>
          <p className="text-sm text-muted-foreground">
            Group related keywords into topic clusters
          </p>
        </div>
      </div>
    </div>
  );
}
