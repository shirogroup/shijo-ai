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
  CheckCircle,
  Edit3,
  Database,
  Zap,
  GitBranch,
  LineChart,
  Camera,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'AI Keyword Research',
    description: 'Discover high-potential keywords with Claude-powered semantic analysis',
    status: 'live',
    badge: 'AVAILABLE NOW',
  },
  {
    icon: TrendingUp,
    title: 'Long-tail Expansion',
    description: 'Generate hundreds of keyword variations automatically',
    status: 'live',
    badge: 'AVAILABLE NOW',
  },
  {
    icon: Brain,
    title: 'Intent Classification',
    description: 'Understand search intent: informational, commercial, or navigational',
    status: 'live',
    badge: 'AVAILABLE NOW',
  },
  {
    icon: Network,
    title: 'Smart Clustering',
    description: 'Group related keywords into content topic clusters',
    status: 'live',
    badge: 'AVAILABLE NOW',
  },
  {
    icon: Target,
    title: 'Opportunity Scoring',
    description: 'AI-powered ranking potential analysis for every keyword',
    status: 'live',
    badge: 'AVAILABLE NOW',
  },
  {
    icon: CheckCircle,
    title: 'Page SEO Analyzer',
    description: 'Comprehensive on-page SEO audit with actionable recommendations',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: FileText,
    title: 'Content Briefs',
    description: 'Generate SEO-optimized content outlines in seconds',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Edit3,
    title: 'Meta Tag Generator',
    description: 'AI-powered SEO meta titles and descriptions in seconds',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Sparkles,
    title: 'AEO Optimization',
    description: 'Optimize for Answer Engines like ChatGPT and Perplexity',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Database,
    title: 'Search Volume Data',
    description: 'Get exact monthly search volumes, not ranges',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: BarChart3,
    title: 'SERP Analysis',
    description: 'Track competitor rankings and search visibility trends',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Zap,
    title: 'SERP Stability Tracker',
    description: 'Monitor ranking volatility and predict opportunities',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Eye,
    title: 'AI Visibility Tracking',
    description: 'Monitor your brand mentions in ChatGPT, Claude & Perplexity',
    status: 'highlighted',
    badge: 'COMING SOON',
  },
  {
    icon: GitBranch,
    title: 'AI Answer Preview',
    description: 'See how ChatGPT and Claude answer queries about your brand',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: LineChart,
    title: 'SEO Forecasting',
    description: 'AI predicts which keywords will be easier to rank for',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Lightbulb,
    title: 'SEO Strategy Advisor',
    description: 'Get AI-powered recommendations for your content strategy',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share projects and insights with your team members',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Activity,
    title: 'Rank Tracking',
    description: 'Monitor keyword positions across search engines daily',
    status: 'soon',
    badge: 'COMING SOON',
  },
  {
    icon: Camera,
    title: 'Quick Rank Check',
    description: 'Instant ranking position check for any keyword',
    status: 'soon',
    badge: 'COMING SOON',
  },
];

export function Features() {
  const liveCount = features.filter(f => f.status === 'live').length;
  const comingSoonCount = features.filter(f => f.status !== 'live').length;

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful SEO Tools, <span className="text-primary">AI-Powered Results</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to dominate search rankings and AI search visibility
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
                transition={{ duration: 0.5, delay: index * 0.03 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`p-6 h-full hover:shadow-lg transition-all ${
                    isHighlighted ? 'border-2 border-primary shadow-primary/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isLive ? 'bg-green-100' : isHighlighted ? 'bg-primary/10' : 'bg-muted'
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
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            More features launching every month
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {liveCount} live features • {comingSoonCount} in development
          </p>
        </div>
      </div>
    </section>
  );
}
