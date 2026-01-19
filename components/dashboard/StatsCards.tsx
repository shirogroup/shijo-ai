'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Network, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color = 'primary' }: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg bg-${color}/10 flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {change}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
  );
}

export function StatsCards() {
  const stats = [
    {
      title: 'Total Keywords',
      value: 47,
      change: '+12%',
      trend: 'up' as const,
      icon: Search,
      color: 'primary',
    },
    {
      title: 'Keyword Clusters',
      value: 8,
      change: '+3',
      trend: 'up' as const,
      icon: Network,
      color: 'blue-600',
    },
    {
      title: 'Avg Opportunity Score',
      value: '78%',
      change: '+5%',
      trend: 'up' as const,
      icon: Target,
      color: 'green-600',
    },
    {
      title: 'Expansions Available',
      value: '3/3',
      icon: Zap,
      color: 'orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
}
