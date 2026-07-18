import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, MapPin, Sparkles, Tag, Rocket, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | SHIJO.AI',
  description: 'Get in touch with the SHIJO.AI team — questions, support, or feedback.',
};

const promoCards = [
  {
    icon: Sparkles,
    eyebrow: 'AI MARKETING TOOLS',
    title: '12 Tools, One Platform',
    bullets: ['SEO & keyword research', 'Ad copy & landing pages', 'Email & social captions'],
    cta: 'Explore the tools',
    href: '/lp',
  },
  {
    icon: Tag,
    eyebrow: 'PRICING',
    title: 'Start Free, Upgrade Anytime',
    bullets: ['2 tools free forever', 'Pro: $29/mo, all 12 tools', 'Enterprise: $99/mo, unlimited'],
    cta: 'See pricing',
    href: '/#pricing',
  },
  {
    icon: Rocket,
    eyebrow: 'GET STARTED',
    title: 'Try SHIJO.AI Free',
    bullets: ['No credit card required', 'Live in under a minute', 'Cancel anytime'],
    cta: 'Start free',
    href: '/register',
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Questions about a tool, your billing, or anything else — send us a message and we&apos;ll
              get back to you by email.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left promo card */}
            <PromoCard card={promoCards[0]} />

            {/* Form */}
            <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
              <ContactForm />

              <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1 text-sm">
                    <Mail className="w-4 h-4" /> Email
                  </div>
                  <a href="mailto:legal@shijo.ai" className="text-sm text-shiro-red hover:underline">
                    legal@shijo.ai
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
              <p className="text-xs text-gray-400 mt-4">
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
    <div className="bg-shiro-black text-white rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-shiro-red" />
        <span className="text-xs font-bold tracking-wide text-shiro-red">{card.eyebrow}</span>
      </div>
      <h3 className="text-lg font-bold mb-3">{card.title}</h3>
      <ul className="space-y-1.5 mb-5 flex-1">
        {card.bullets.map((b) => (
          <li key={b} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-shiro-red mt-1">&rsaquo;</span> {b}
          </li>
        ))}
      </ul>
      <Link
        href={card.href}
        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors"
      >
        {card.cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
