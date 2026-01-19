'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackCTAClick } from '@/lib/analytics';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              AI-Powered SEO Automation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Keyword Research Meets{' '}
            <span className="text-primary">AI Search Visibility</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            Track your visibility in ChatGPT, Claude & Perplexity. AI-powered keyword
            research, content optimization, and SERP analysis in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 h-14"
              onClick={() => trackCTAClick('trial')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 h-14 border-2"
              onClick={() => trackCTAClick('demo')}
            >
              Watch Demo (Coming Soon)
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-black/10">
              <Search className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">AI Keyword Research</p>
                <p className="text-xs text-muted-foreground">90%+ margins, 1-2 day builds</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-black/10">
              <TrendingUp className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">SERP Analysis</p>
                <p className="text-xs text-muted-foreground">Track competitor positions</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-black/10">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">AI Search Visibility</p>
                <p className="text-xs text-muted-foreground">Monitor LLM mentions</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
