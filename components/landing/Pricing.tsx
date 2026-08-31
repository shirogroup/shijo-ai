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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {/* Free */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-muted-foreground mb-6">Try 2 tools, no card required</p>
            <p className="text-4xl font-bold mb-6">
              $0<span className="text-base font-normal text-muted-foreground">/forever</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 2 AI tools included</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 3 generations per day</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> No credit card needed</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 1 AI visibility scan/day</li>
            </ul>
            <Link href="/register">
              <Button className="w-full" variant="outline">Get Started</Button>
            </Link>
          </Card>

          {/* Standard */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Standard</h3>
            <p className="text-muted-foreground mb-6">All 12 tools, advanced AI</p>
            <p className="text-4xl font-bold mb-2">
              $29<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              or $278/year <span className="text-primary font-medium">(save 20%)</span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> All 12 AI tools</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Advanced AI for complex tasks</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 200 generations/month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 4 AI visibility scans/month</li>
            </ul>
            <Link href="/register">
              <Button className="w-full" variant="outline">Get Started with Standard</Button>
            </Link>
          </Card>

          {/* Plus — added 2026-08-31. Sits between Standard and Pro; the $29
              and $199 figures either side are unchanged. */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Plus</h3>
            <p className="text-muted-foreground mb-6">For tracking AI visibility</p>
            <p className="text-4xl font-bold mb-2">
              $79<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">&nbsp;</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> All 12 AI tools</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 200 generations/month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 30 AI visibility scans/month</li>
            </ul>
            <Link href="/register">
              <Button className="w-full" variant="outline">Get Started with Plus</Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="p-8 border-2 border-primary relative">
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-primary text-white inline-block mb-4">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-6">For heavier, everyday use</p>
            <p className="text-4xl font-bold mb-2">
              $199<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">&nbsp;</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> All 12 AI tools</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Advanced AI for complex tasks</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 1,500 generations/month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 5 brands, CSV + PDF export</li>
            </ul>
            <Link href="/register">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">Get Started with Pro</Button>
            </Link>
          </Card>

          {/* Enterprise — paused, not purchasable */}
          <Card className="p-8 opacity-80">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-6">For agencies and teams</p>
            <p className="text-4xl font-bold mb-6">
              Coming Soon
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-muted-foreground"><Check className="w-5 h-5 text-primary" /> Everything in Pro</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Check className="w-5 h-5 text-primary" /> Custom volume &amp; pricing</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Check className="w-5 h-5 text-primary" /> Team collaboration <span className="text-xs">(coming soon)</span></li>
            </ul>
            <Link href="/contact">
              <Button className="w-full" variant="outline">Contact Us</Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
