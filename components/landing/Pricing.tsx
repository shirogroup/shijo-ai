'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Growth Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground">Start free, upgrade when ready</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-muted-foreground mb-6">Try 5 tools, no card required</p>
            <p className="text-4xl font-bold mb-6">
              $0<span className="text-base font-normal text-muted-foreground">/forever</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 5 AI tools (Haiku-powered)</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 3 generations per day</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> No credit card needed</li>
            </ul>
            <Link href="/register">
              <Button className="w-full" variant="outline">Get Started</Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="p-8 border-2 border-primary relative">
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-primary text-white inline-block mb-4">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-6">All 24 tools, advanced AI</p>
            <p className="text-4xl font-bold mb-2">
              $29<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              or $278/year <span className="text-primary font-medium">(save 20%)</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> All 24 AI tools</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Sonnet AI for complex tasks</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 200 generations/month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Priority support</li>
            </ul>
            <Link href="/register">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">Start Pro Trial</Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-6">For agencies and teams</p>
            <p className="text-4xl font-bold mb-2">
              $99<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              or $950/year <span className="text-primary font-medium">(save 20%)</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Unlimited generations</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Team collaboration</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Dedicated account manager</li>
            </ul>
            <Link href="/register">
              <Button className="w-full" variant="outline">Start Enterprise Trial</Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
