'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, Users } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      text: 'Enterprise Security',
      subtext: 'SOC 2 Compliant',
    },
    {
      icon: Zap,
      text: '99.9% Uptime',
      subtext: 'Always Available',
    },
    {
      icon: TrendingUp,
      text: '10M+ Keywords',
      subtext: 'Analyzed Daily',
    },
    {
      icon: Users,
      text: '500+ Enterprises',
      subtext: 'Trust Our Platform',
    },
  ];

  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-sm">{badge.text}</p>
                <p className="text-xs text-muted-foreground">{badge.subtext}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
