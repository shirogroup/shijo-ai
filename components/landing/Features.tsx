'use client';

import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Brain,
  Network,
  Target,
  FileText,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Search,
    title: 'Seed Keyword Input',
    description: 'Unlimited keyword entries to start your research',
    status: 'live',
    phase: 'Phase 1',
    margin: '95%',
  },
  {
    icon: TrendingUp,
    title: 'Long-tail Expansion',
    description: 'AI-powered keyword variations with Claude',
    status: 'live',
    phase: 'Phase 1',
    limit: '3/day free, 100/mo Pro',
    margin: '85-92%',
  },
  {
    icon: Brain,
    title: 'Intent Classification',
    description: 'Automatic search intent detection',
    status: 'live',
    phase: 'Phase 1',
    limit: 'Unlimited (rate-limited)',
    margin: '90%',
  },
  {
    icon: Network,
    title: 'Keyword Clustering',
    description: 'Group related keywords by topic',
    status: 'live',
    phase: 'Phase 1',
    limit: '1/day free, 50/mo Pro',
    margin: '85%',
  },
  {
    icon: Target,
    title: 'Opportunity Scoring',
    description: 'AI-powered keyword ranking potential',
    status: 'live',
    phase: 'Phase 1',
    limit: 'Score only free',
    margin: '90%',
  },
  {
    icon: FileText,
    title: 'Content Briefs',
    description: 'Generate SEO-optimized content outlines',
    status: 'coming',
    phase: 'Phase 2',
    margin: '80%',
  },
  {
    icon: BarChart3,
    title: 'AEO Scoring',
    description: 'Answer Engine Optimization for AI search',
    status: 'coming',
    phase: 'Phase 2',
    margin: '85%',
  },
  {
    icon: Sparkles,
    title: 'AI Visibility Tracking',
    description: 'Monitor mentions in ChatGPT, Claude & Perplexity',
    status: 'coming',
    phase: 'Phase 4',
    highlight: true,
    margin: '60-75%',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need for{' '}
            <span className="text-primary">SEO Success</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered tools with 80-95% margins. Built for speed, optimized for profit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    feature.highlight
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border-2 border-transparent hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    {feature.status === 'live' ? (
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                        LIVE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        SOON
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {feature.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{feature.phase}</span>
                      <span className="font-medium text-green-600">{feature.margin} margin</span>
                    </div>
                    {feature.limit && (
                      <p className="text-xs text-muted-foreground">{feature.limit}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
