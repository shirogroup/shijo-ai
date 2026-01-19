'use client';

import { motion } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Brain,
  Network,
  Target,
  FileText,
  Sparkles,
  Eye,
  BarChart3,
  Activity,
  Users,
  Lightbulb,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ALIGNED WITH ROADMAP - Phase 1 Features
const features = [
  {
    icon: Search,
    title: 'Seed Keyword Input',
    description: 'Add and manage unlimited seed keywords for your SEO research',
    status: 'live', // Phase 1 - Feature #1
    badge: 'UNLIMITED',
    roadmapName: 'Seed Keyword Input',
    phase: 'Phase 1',
  },
  {
    icon: TrendingUp,
    title: 'Long-tail Keyword Expansion',
    description: 'AI-powered expansion generates hundreds of keyword variations automatically',
    status: 'live', // Phase 1 - Feature #2
    badge: '3/DAY FREE',
    roadmapName: 'Long-Tail Keyword Expansion',
    phase: 'Phase 1',
  },
  {
    icon: Brain,
    title: 'Keyword Intent Classification',
    description: 'Automatically classify keywords as informational, commercial, or navigational',
    status: 'live', // Phase 1 - Feature #3
    badge: 'UNLIMITED',
    roadmapName: 'Keyword Intent Classification',
    phase: 'Phase 1',
  },
  {
    icon: Network,
    title: 'Keyword Clustering',
    description: 'Smart AI clustering groups related keywords into content topic clusters',
    status: 'live', // Phase 1 - Feature #4
    badge: '1/DAY FREE',
    roadmapName: 'Keyword Clustering',
    phase: 'Phase 1',
  },
  {
    icon: Target,
    title: 'Keyword Opportunity Scoring',
    description: 'AI analyzes ranking potential and provides opportunity scores',
    status: 'live', // Phase 1 - Feature #5
    badge: 'LIVE',
    roadmapName: 'Keyword Opportunity Scoring',
    phase: 'Phase 1',
  },
  {
    icon: FileText,
    title: 'Content Brief Generator',
    description: 'Generate SEO-optimized content outlines and briefs in seconds',
    status: 'soon', // Phase 2 - Feature #7
    badge: 'COMING SOON',
    roadmapName: 'Content Brief Generator',
    phase: 'Phase 2',
  },
  {
    icon: Sparkles,
    title: 'AEO Score',
    description: 'Optimize content for Answer Engines like ChatGPT and Perplexity',
    status: 'soon', // Phase 2 - Feature #9
    badge: 'COMING SOON',
    roadmapName: 'AEO Score (Answer Engine Optimization)',
    phase: 'Phase 2',
  },
  {
    icon: Eye,
    title: 'AI Visibility / LLM Tracking',
    description: 'Monitor your brand mentions in ChatGPT, Claude & Perplexity',
    status: 'highlighted', // Phase 4 - Feature #13 (KEY DIFFERENTIATOR)
    badge: 'Q2 2025',
    roadmapName: 'AI Visibility / LLM Answer Tracking',
    phase: 'Phase 4',
  },
  {
    icon: BarChart3,
    title: 'SERP Competitor Snapshot',
    description: 'Track competitor rankings and search visibility trends in real-time',
    status: 'soon', // Phase 3 - Feature #11
    badge: 'COMING SOON',
    roadmapName: 'SERP Competitor Snapshot',
    phase: 'Phase 3',
  },
  {
    icon: Activity,
    title: 'Keyword Rank Tracking',
    description: 'Monitor keyword positions across search engines with daily updates',
    status: 'soon', // Phase 6 - Feature #18
    badge: 'COMING SOON',
    roadmapName: 'Keyword Rank Tracking',
    phase: 'Phase 6',
  },
  {
    icon: Lightbulb,
    title: 'SEO Strategy Advisor',
    description: 'Get AI-powered recommendations for your content strategy',
    status: 'soon', // Phase 5 - Feature #16
    badge: 'COMING SOON',
    roadmapName: 'SEO Strategy Advisor (AI)',
    phase: 'Phase 5',
  },
  {
    icon: Users,
    title: 'SEO Workflow / Task Manager',
    description: 'Share projects, assign tasks, and collaborate with your team',
    status: 'soon', // Phase 5 - Feature #17
    badge: 'COMING SOON',
    roadmapName: 'SEO Workflow / Task Manager',
    phase: 'Phase 5',
  },
];

export function Features() {
  // Count live vs coming soon
  const liveCount = features.filter(f => f.status === 'live').length;
  const comingSoonCount = features.filter(f => f.status !== 'live').length;

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="text-primary">SEO Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to dominate search rankings and AI search visibility.
            Phase 1 features are live now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLive = feature.status === 'live';
            const isHighlighted = feature.status === 'highlighted';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`p-6 h-full hover:shadow-lg transition-all ${
                    isHighlighted
                      ? 'border-2 border-primary shadow-primary/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isLive
                          ? 'bg-green-100'
                          : isHighlighted
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isLive
                            ? 'text-green-600'
                            : isHighlighted
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <Badge
                      variant={isLive ? 'default' : 'outline'}
                      className={
                        isLive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : isHighlighted
                          ? 'border-primary text-primary'
                          : ''
                      }
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {feature.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Roadmap: {feature.phase}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {liveCount} Phase 1 features live
            </span>
            <span className="mx-3">•</span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              {comingSoonCount} features in development
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Based on official roadmap - Phase 1 (Keywords) complete
          </p>
        </div>
      </div>
    </section>
  );
}
