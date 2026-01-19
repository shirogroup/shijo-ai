'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Dominate<br /><span className="text-primary">AI Search & SEO?</span></h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Join 500+ enterprises using SHIJO.ai to track AI search visibility and automate SEO workflows.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14">Start Free Trial<ArrowRight className="ml-2 w-5 h-5" /></Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2">Schedule Demo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 justify-center"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm">No credit card required</span></div>
            <div className="flex items-center gap-2 justify-center"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm">14-day free trial</span></div>
            <div className="flex items-center gap-2 justify-center"><Check className="w-5 h-5 text-primary flex-shrink-0" /><span className="text-sm">Cancel anytime</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
