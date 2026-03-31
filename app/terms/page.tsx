import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | SHIJO.AI',
  description: 'Terms of Service for SHIJO.AI - AI-powered SEO and marketing platform.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-12">Last updated: March 24, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using SHIJO.AI (&quot;the Service&quot;), operated by SHIRO Technologies LLC
                (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of
                Service. If you do not agree, you may not use the Service. We reserve the right to update
                these Terms at any time; continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIJO.AI is an AI-powered SEO and digital marketing platform that provides keyword research,
                content optimization, AI search visibility tracking, and related analytics tools. The Service
                is provided on a subscription basis with Free, Pro, and Enterprise tiers. Features, quotas,
                and pricing are subject to change with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                You must provide accurate information when creating an account. You are responsible for
                maintaining the confidentiality of your login credentials and for all activity under your
                account. You must be at least 18 years old to use the Service. You agree to notify us
                immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription &amp; Billing</h2>
              <p className="text-gray-700 leading-relaxed">
                Paid subscriptions are billed on a recurring monthly basis through Stripe. By subscribing,
                you authorize us to charge your payment method. You may cancel at any time through the
                billing portal; access continues through the end of the current billing cycle. Refunds are
                handled on a case-by-case basis at our discretion. We reserve the right to change pricing
                with 30 days&apos; notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain
                unauthorized access to the Service or its infrastructure; (c) reverse-engineer, scrape,
                or redistribute any part of the Service; (d) use automated tools or bots to access the
                Service beyond normal API usage; (e) transmit malicious code or interfere with the
                Service&apos;s operation; or (f) exceed your plan&apos;s usage quotas through circumvention.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service, including its design, code, branding, and AI models, is the property of
                SHIRO Technologies LLC. You retain ownership of content you submit to the Service. By
                using the Service, you grant us a limited license to process your content solely to
                provide the Service. AI-generated outputs are provided for your use but may not be unique
                across users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED. We do not guarantee specific SEO results, search rankings, or AI
                visibility outcomes. Search engine algorithms are outside our control and may change at
                any time. AI-generated content and recommendations are for informational purposes and
                should be verified before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIRO Technologies LLC shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages arising from your
                use of the Service. Our total liability shall not exceed the amount you paid for the
                Service in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your access to the Service at any time for violation of
                these Terms or for any reason with reasonable notice. Upon termination, your right to
                use the Service ceases immediately. Provisions that by their nature should survive
                termination (including liability limitations and dispute resolution) shall survive.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by the laws of the State of Texas, without regard to
                conflict of law principles. Any disputes shall be resolved in the state or federal
                courts located in Dallas County, Texas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms, contact us at:
              </p>
              <div className="mt-4 text-gray-700">
                <p className="font-semibold">SHIRO Technologies LLC</p>
                <p>5080 Spectrum Drive, Suite 575E</p>
                <p>Addison, TX 75001</p>
                <p className="mt-2">
                  Email: <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
