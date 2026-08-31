import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, MapPin, Sparkles, Tag, Rocket, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: '/contact' },
  title: 'Contact | SHIJO.AI',
  description: 'Get in touch with the SHIJO.AI team for questions about our AI marketing tools, billing, technical support, or partnership enquiries.',
  keywords: ['contact shijo.ai', 'ai marketing tools support', 'ai marketing platform contact'],
};

const promoCards = [
  {
    icon: Sparkles,
    eyebrow: 'AI MARKETING TOOLS',
    title: '12 Tools, One Platform',
    bullets: ['SEO & keyword research', 'Ad copy & landing pages', 'Email & social captions'],
    cta: 'Explore the tools',
    href: '/ai-marketing-tools',
    gradient: 'from-fuchsia-600 to-purple-700',
    glow: 'bg-fuchsia-500',
  },
  {
    icon: Tag,
    eyebrow: 'PRICING',
    title: 'Start Free, Upgrade Anytime',
    // Plus added 2026-08-31. The $29 and $199 figures either side are
    // unchanged — this sidebar is ad-adjacent and those numbers are load-bearing.
    bullets: ['2 tools free forever', 'Standard: $29/mo, all 12 tools', 'Plus: $79/mo, 30 AI visibility scans', 'Pro: $199/mo, 1,500 gens/month'],
    cta: 'See pricing',
    // Now points at the real /pricing page rather than the homepage anchor,
    // which is what this link always meant.
    href: '/pricing',
    gradient: 'from-blue-600 to-cyan-600',
    glow: 'bg-blue-500',
  },
  {
    icon: Rocket,
    eyebrow: 'GET STARTED',
    title: 'Try SHIJO.AI Free',
    bullets: ['No credit card required', 'Live in under a minute', 'Cancel anytime'],
    cta: 'Start free',
    href: '/register',
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'bg-emerald-500',
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Questions about a tool, your billing, or anything else — send us a message and we&apos;ll
              get back to you by email.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left promo card */}
            <PromoCard card={promoCards[0]} />

            {/* Form */}
            <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-7">
              <ContactForm />

              <div className="mt-6 pt-5 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1 text-sm">
                    <Mail className="w-4 h-4" /> Email
                  </div>
                  <a href="mailto:info@shijo.ai" className="text-sm text-shiro-red hover:underline">
                    info@shijo.ai
                  </a>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1 text-sm">
                    <MapPin className="w-4 h-4" /> Address
                  </div>
                  <p className="text-sm text-gray-600">
                    SHIRO Technologies LLC<br />
                    5080 Spectrum Drive, Suite 575E<br />
                    Addison, TX 75001
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                For billing changes or cancellations, you can also manage your subscription directly from{' '}
                <a href="/dashboard/billing" className="text-shiro-red hover:underline">Dashboard &rarr; Billing</a>.
              </p>
            </div>

            {/* Right promo cards */}
            <div className="space-y-6">
              <PromoCard card={promoCards[1]} />
              <PromoCard card={promoCards[2]} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PromoCard({ card }: { card: (typeof promoCards)[number] }) {
  const Icon = card.icon;
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${card.gradient}`}>
      {/* Decorative glow — CSS-only, no image asset needed */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full ${card.glow} opacity-30 blur-2xl`} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide text-white/80">{card.eyebrow}</span>
        </div>
        <h3 className="text-lg font-bold mb-3">{card.title}</h3>
        <ul className="space-y-1.5 mb-5">
          {card.bullets.map((b) => (
            <li key={b} className="text-sm text-white/85 flex items-start gap-2">
              <span className="mt-1">&rsaquo;</span> {b}
            </li>
          ))}
        </ul>
        <Link
          href={card.href}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-white/95 hover:bg-white text-gray-900 rounded-lg px-4 py-2.5 transition-colors"
        >
          {card.cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
