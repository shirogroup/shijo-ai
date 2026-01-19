'use client';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your <span className="text-primary">Growth Plan</span></h2>
          <p className="text-xl text-muted-foreground">Start free, upgrade when ready</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-muted-foreground mb-6">Perfect for trying out</p>
            <p className="text-4xl font-bold mb-6">$0<span className="text-base font-normal text-muted-foreground">/forever</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Unlimited seed keywords</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 3 expansions/day</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Basic features</li>
            </ul>
            <Button className="w-full" variant="outline">Start Free</Button>
          </Card>
          <Card className="p-8 border-2 border-primary">
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-primary text-white inline-block mb-4">Most Popular</div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-muted-foreground mb-6">For serious SEO pros</p>
            <p className="text-4xl font-bold mb-6">$39<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Everything in Free</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 100 expansions/month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 50 tracked keywords</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Priority support</li>
            </ul>
            <Button className="w-full bg-primary">Start Pro Trial</Button>
          </Card>
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-6">For agencies and teams</p>
            <p className="text-4xl font-bold mb-6">$99<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Unlimited expansions</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> 200+ keywords</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> AI visibility tracking</li>
            </ul>
            <Button className="w-full" variant="outline">Contact Sales</Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
