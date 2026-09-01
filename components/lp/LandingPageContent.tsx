'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Check, Zap, Shield, CreditCard, X,
  Search, Megaphone, Mail, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startCheckout, type CheckoutPlanKey } from '@/lib/checkout-intent';
import { LogoMark } from '@/components/Logo';

const toolCategories = [
  { icon: Search, label: 'AI Keyword Research Tool', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Keyword research, SEO content briefs, meta tags, FAQ sections, and AI Overview optimization for ChatGPT and Google AI search.' },
  { icon: Megaphone, label: 'AI Ad Copy Generator', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Google, Meta, and LinkedIn ad copy, headline A/B testing, audience personas, and landing page copy.' },
  { icon: Mail, label: 'AI Email Sequence Generator', color: 'text-green-600', bg: 'bg-green-50', desc: 'Multi-step email sequences and newsletter drafts for any funnel stage.' },
  { icon: Pencil, label: 'Social Media Caption Generator', color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Scroll-stopping captions with hooks and CTAs for any platform.' },
];

const plans = [
  // planKey (added 2026-09-01) turns a paid card's button into a real checkout
  // CTA instead of a bare /register link. Paid traffic lands here, and before
  // this a visitor who picked Pro was dropped on /register with no record of
  // the plan — signed in, /register just bounced them to /dashboard. Prices,
  // copy and layout are untouched; only where the button sends you changed.
  // Free and Enterprise keep plain hrefs: Free must never reach Stripe.
  { name: 'Free', price: '$0', period: 'forever', features: ['2 AI tools', '3 generations per day', 'No credit card needed'], cta: 'Start Free', highlight: false, href: '/register' },
  { name: 'Standard', price: '$29', period: '/month', features: ['All 12 AI tools', 'Advanced AI for complex tasks', '200 generations/month'], cta: 'Get Started with Standard', highlight: false, href: '/register', planKey: 'pro' as CheckoutPlanKey },
  { name: 'Pro', price: '$199', period: '/month', features: ['All 12 AI tools', 'Advanced AI for complex tasks', '1,500 generations/month'], cta: 'Get Started with Pro', highlight: true, href: '/register', planKey: 'growth' as CheckoutPlanKey },
  { name: 'Enterprise', price: 'Coming Soon', period: '', features: ['Everything in Pro', 'Custom volume & pricing', 'Team collaboration (coming soon)'], cta: 'Contact Us', highlight: false, href: '/contact' },
];

const faqs = [
  { q: 'What is SHIJO.AI?', a: 'SHIJO.AI is an all-in-one AI marketing platform for digital marketers, agencies, and small businesses — 12 tools covering keyword research, AI ad copy, email sequences, and social media captions.' },
  { q: 'Do you check AI visibility?', a: 'Yes — SHIJO.AI includes an AI visibility checker that shows whether answer engines name your business when people ask for a recommendation.' },
  { q: 'Is there a free trial?', a: 'No trial needed — the Free plan is free forever with 2 tools and 3 generations a day, no credit card required. Upgrade whenever you’re ready.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your dashboard; you keep access through the end of your current billing period.' },
  { q: 'Is my payment secure?', a: 'All payments are processed by Stripe. We never see or store your card details.' },
];

export function LandingPageContent() {
  const [showMobileBar, setShowMobileBar] = useState(true);

  // Paid-plan buttons go straight to a Stripe payment screen. Logged out (the
  // usual case for ad traffic) startCheckout returns unauthenticated and we
  // send them to /register?plan=<key>, where RegisterForm resumes the checkout
  // the moment the account is created — so the plan they clicked survives
  // signup instead of being thrown away at /register.
  const [buying, setBuying] = useState<CheckoutPlanKey | null>(null);

  const goToPayment = async (planKey: CheckoutPlanKey) => {
    setBuying(planKey);
    const result = await startCheckout(planKey);
    if (result.ok) return; // navigating to Stripe
    if (result.unauthenticated) {
      window.location.href = `/register?plan=${planKey}`;
      return;
    }
    window.location.href = `/pricing`;
  };

  return (
    <main className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Slim promo strip — honest, verifiable claim only (no fabricated
          ratings/customer counts), reinforces the ad's promise the instant
          the page loads, before the visitor even scrolls to the header. */}
      <div className="bg-primary text-white text-center text-xs sm:text-sm font-medium py-1.5 px-4">
        🎉 2 AI tools free forever — no credit card required
      </div>

      {/* Minimal header — logo + sign in + a real Sign Up CTA, no nav links
          to click away on. Sticky so the CTA stays reachable while
          scrolling, matching the pattern used by Jasper/other AI-tool ad
          landing pages. */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark className="w-7 h-7" />
            <span className="text-xl font-bold text-primary">SHIJO.AI</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">12 AI-Powered Marketing Tools</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              SEO, Ads, Email &amp; Social Copy<br />
              <span className="text-primary">Generated in Seconds</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              One AI marketing platform — keyword research, ad copy, email sequences,
              and social captions, without switching tools or hiring more writers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-10 h-14">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /><span>2 tools free forever</span></div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /><span>No credit card required</span></div>
              <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-primary" /><span>Cancel anytime</span></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tool categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            12 Tools Across <span className="text-primary">4 Categories</span>
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10 text-sm">
            An all-in-one AI marketing platform built for digital marketers, agencies, and small
            business teams who need SEO, ad, email, and social content without adding headcount.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {toolCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.label} className="bg-white rounded-xl border p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.bg} mb-3`}>
                    <Icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <h3 className="font-bold mb-1">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            {[
              { step: '1', title: 'Pick a tool', desc: 'Choose from 12 tools built for SEO, ads, email, and social.' },
              { step: '2', title: 'Describe what you need', desc: 'Tell it your brand, product, and goal in plain language.' },
              { step: '3', title: 'Get AI-generated copy', desc: 'Review, edit, and use it — ready in seconds, not hours.' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing snapshot */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-10">Start free, upgrade when ready</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl p-6 border ${plan.highlight ? 'border-2 border-primary' : ''}`}
              >
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  {plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {'planKey' in plan && plan.planKey ? (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                    disabled={buying === plan.planKey}
                    onClick={() => goToPayment(plan.planKey as CheckoutPlanKey)}
                  >
                    {buying === plan.planKey ? 'Opening checkout…' : plan.cta}
                  </Button>
                ) : (
                  <Link href={plan.href}>
                    <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Common Questions</h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Stop Writing from Scratch?</h2>
          <p className="text-lg text-muted-foreground mb-8">2 tools free forever. No credit card needed.</p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-10 h-14">
              Start Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Minimal footer — legal links required for compliance, nothing that pulls traffic away from converting */}
      <footer className="border-t border-gray-800 bg-black py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-gray-500">&copy; {new Date().getFullYear()} SHIJO.ai — SHIRO Technologies LLC</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors">Privacy</Link>
            <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Sticky bottom CTA bar — mobile only. Long-scroll ad landing pages
          convert better with the CTA always in thumb reach; dismissible so
          it doesn't feel forced on anyone who's already decided not to. */}
      {showMobileBar && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-xs text-gray-300">2 tools free forever, no card needed</span>
          <Link href="/register" className="flex-shrink-0">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
              Start Free
            </Button>
          </Link>
          <button
            onClick={() => setShowMobileBar(false)}
            aria-label="Dismiss"
            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
}
