'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const roadmapPhases = [
  {
    phase: 'Phase 1',
    title: 'Keyword Research',
    status: 'live',
    features: 5,
    description: 'AI-powered keyword tools',
    margin: '80-95%',
  },
  {
    phase: 'Phase 2',
    title: 'Content & On-Page',
    status: 'development',
    features: 4,
    description: 'SEO audits & content briefs',
    margin: '80-95%',
  },
  {
    phase: 'Phase 3',
    title: 'SERP & Competitive',
    status: 'planned',
    features: 3,
    description: 'Search volume & volatility',
    margin: '40-75%',
  },
  {
    phase: 'Phase 4',
    title: 'AI Search Visibility',
    status: 'planned',
    features: 3,
    description: 'ChatGPT, Claude, Perplexity tracking',
    margin: '60-75%',
    highlight: true,
  },
  {
    phase: 'Phase 5',
    title: 'Strategy & Workflow',
    status: 'planned',
    features: 2,
    description: 'AI advisor & task management',
    margin: '90%+',
  },
  {
    phase: 'Phase 6',
    title: 'Rank Tracking',
    status: 'planned',
    features: 2,
    description: 'Ongoing monitoring',
    margin: '40-70%',
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Roadmap
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="text-primary">2025 & Beyond</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            19 features across 6 phases. Phase 1 live now, Phase 4 is the game-changer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roadmapPhases.map((phase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`p-6 h-full ${
                  phase.highlight
                    ? 'border-2 border-primary bg-primary/5'
                    : phase.status === 'live'
                    ? 'border-l-4 border-l-green-500'
                    : 'border-l-4 border-l-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{phase.phase}</p>
                    <h3 className="text-xl font-bold">{phase.title}</h3>
                  </div>
                  {phase.status === 'live' && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      LIVE
                    </Badge>
                  )}
                  {phase.status === 'development' && (
                    <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                      IN DEV
                    </Badge>
                  )}
                  {phase.status === 'planned' && (
                    <Badge variant="outline">PLANNED</Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{phase.features} features</span>
                  <span className="font-medium text-green-600">{phase.margin} margin</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold">
                SHIJO<span className="text-primary">.ai</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              AI-powered SEO automation for the modern marketer.
            </p>
            <p className="text-xs text-gray-500">
              © 2025 SHIRO Technologies LLC
              <br />
              All rights reserved. Est. 2001
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-gray-400 hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#roadmap" className="text-gray-400 hover:text-primary transition-colors">
                  Roadmap
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>5080 Spectrum Drive</li>
              <li>Suite 575E</li>
              <li>Addison, TX 75001</li>
              <li className="pt-2">
                <a href="mailto:info@shijo.ai" className="hover:text-primary transition-colors">
                  info@shijo.ai
                </a>
              </li>
              <li>
                <a href="tel:8009718013" className="hover:text-primary transition-colors">
                  (800) 971-8013
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>Built with Next.js, Claude AI & Neon</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
