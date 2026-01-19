'use client';

import { useState } from 'react';
import { MoreVertical, TrendingUp, Brain, Network, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Keyword {
  id: string;
  keyword: string;
  intent?: string;
  score?: number;
  expanded: boolean;
  clustered: boolean;
  createdAt: string;
}

const mockKeywords: Keyword[] = [
  {
    id: '1',
    keyword: 'seo automation tools',
    intent: 'Commercial',
    score: 85,
    expanded: true,
    clustered: true,
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    keyword: 'keyword research ai',
    intent: 'Informational',
    score: 72,
    expanded: true,
    clustered: false,
    createdAt: '5 hours ago',
  },
  {
    id: '3',
    keyword: 'ai search visibility',
    intent: 'Commercial',
    score: 91,
    expanded: false,
    clustered: false,
    createdAt: '1 day ago',
  },
  {
    id: '4',
    keyword: 'content optimization software',
    intent: 'Commercial',
    score: 68,
    expanded: true,
    clustered: true,
    createdAt: '2 days ago',
  },
];

export function KeywordsTable() {
  const [keywords] = useState<Keyword[]>(mockKeywords);

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'Commercial':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Informational':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Navigational':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-sm">Keyword</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Intent</th>
            <th className="text-center py-3 px-4 font-medium text-sm">Score</th>
            <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Added</th>
            <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keywords.map((keyword) => (
            <tr key={keyword.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-4 px-4">
                <span className="font-medium">{keyword.keyword}</span>
              </td>
              <td className="py-4 px-4">
                {keyword.intent ? (
                  <Badge className={`${getIntentColor(keyword.intent)} border`}>
                    {keyword.intent}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">Not classified</span>
                )}
              </td>
              <td className="py-4 px-4 text-center">
                {keyword.score ? (
                  <span className={`font-semibold ${getScoreColor(keyword.score)}`}>
                    {keyword.score}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-center gap-2">
                  {keyword.expanded ? (
                    <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  {keyword.clustered ? (
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Network className="w-4 h-4 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                      <Network className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-muted-foreground">
                {keyword.createdAt}
              </td>
              <td className="py-4 px-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Expand Keyword
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Brain className="w-4 h-4 mr-2" />
                      Classify Intent
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Network className="w-4 h-4 mr-2" />
                      Add to Cluster
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Target className="w-4 h-4 mr-2" />
                      Score Opportunity
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
