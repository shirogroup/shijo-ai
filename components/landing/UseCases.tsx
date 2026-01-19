'use client';
import { motion } from 'framer-motion';
import { Building2, Users, Globe, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const useCases = [
  { icon: Building2, title: 'Enterprise Marketing Teams', description: 'Scale SEO operations across multiple brands and regions. Centralized reporting and team collaboration.', metrics: '200+ tracked keywords', highlight: 'Most Popular' },
  { icon: Users, title: 'Digital Marketing Agencies', description: 'Manage client SEO campaigns efficiently. White-label reports and automated workflows.', metrics: 'Unlimited clients', highlight: 'Agency Ready' },
  { icon: Globe, title: 'SaaS & Tech Companies', description: 'Track product visibility in AI search engines. Monitor brand mentions in ChatGPT and Claude.', metrics: 'AI visibility tracking', highlight: 'AI-First' },
  { icon: TrendingUp, title: 'E-commerce Brands', description: 'Optimize product pages for search and AI discovery. Track competitor keyword strategies.', metrics: 'Product SEO focus', highlight: 'Conversion Optimized' },
];

export function UseCases() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for <span className="text-primary">Modern Enterprises</span></h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Trusted by marketing teams, agencies, and brands worldwide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
                <Card className="p-8 h-full hover:shadow-xl transition-shadow border-2 hover:border-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">{useCase.highlight}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-4">{useCase.description}</p>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-primary">{useCase.metrics}</p>
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
