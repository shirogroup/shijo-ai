'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, Clock, Sparkles } from 'lucide-react';

const featureCategories = [
  {
    category: 'Keyword Intelligence',
    status: 'available',
    description: 'AI-powered keyword research and analysis',
    features: [
      'Unlimited seed keywords',
      'Long-tail keyword expansion',
      'Search intent classification',
      'Topic clustering',
      'Opportunity scoring',
    ],
  },
  {
    category: 'Content Optimization',
    status: 'coming-soon',
    description: 'SEO-optimized content creation tools',
    features: [
      'AI content briefs',
      'Meta tag generation',
      'On-page SEO audits',
      'AEO scoring',
      'Content gap analysis',
    ],
  },
  {
    category: 'Competitive Intelligence',
    status: 'coming-soon',
    description: 'Track and analyze your competition',
    features: [
      'SERP competitor analysis',
      'Search volume data',
      'Ranking volatility tracking',
      'Backlink analysis',
      'Content performance metrics',
    ],
  },
  {
    category: 'AI Search Visibility',
    status: 'launching-q2',
    description: 'Monitor your presence in AI search',
    highlight: true,
    features: [
      'ChatGPT mention tracking',
      'Claude visibility monitoring',
      'Perplexity AI tracking',
      'Gemini search analysis',
      'LLM optimization tips',
    ],
  },
  {
    category: 'Rank Tracking',
    status: 'coming-soon',
    description: 'Monitor your search rankings',
    features: [
      'Daily rank updates',
      'Multi-location tracking',
      'Mobile vs desktop rankings',
      'SERP feature tracking',
      'Historical trend data',
    ],
  },
  {
    category: 'Strategy & Workflow',
    status: 'coming-soon',
    description: 'Automate your SEO workflow',
    features: [
      'AI strategy recommendations',
      'Automated task management',
      'Team collaboration tools',
      'Custom reporting',
      'API integrations',
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Platform Roadmap
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for the <span className="text-primary">Future of SEO</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From traditional search to AI-powered discovery. We&apos;re building the complete toolkit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {featureCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`p-6 h-full ${
                  category.highlight
                    ? 'border-2 border-primary bg-primary/5'
                    : category.status === 'available'
                    ? 'border-l-4 border-l-green-500'
                    : 'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{category.category}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  {category.status === 'available' && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20 flex-shrink-0">
                      <Check className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                  {category.status === 'coming-soon' && (
                    <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 flex-shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      SOON
                    </Badge>
                  )}
                  {category.status === 'launching-q2' && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Q2 2025
                    </Badge>
                  )}
                </div>

                <ul className="space-y-2 mt-6">
                  {category.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Timeline indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-muted/50 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Available Now</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">Q1 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-medium">Q2 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm font-medium">2025+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
