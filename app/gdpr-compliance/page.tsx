import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  alternates: { canonical: '/gdpr-compliance' },
  title: 'GDPR Compliance | SHIJO.AI',
  description: 'How SHIJO.AI complies with the EU General Data Protection Regulation, covering your data rights, our sub-processors, transfers, and requests.',
  keywords: ['gdpr compliance', 'ai marketing platform gdpr', 'data privacy ai tools'],
};

export default function GdprCompliancePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GDPR Compliance</h1>
          <p className="text-gray-500 mb-8">Last updated: July 18, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section id="1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIJO.AI can be used by anyone in the world, including individuals and businesses in the
                European Economic Area, the United Kingdom, and Switzerland. This page summarizes how we
                approach the EU General Data Protection Regulation (GDPR) and related laws. It supplements,
                and does not replace, our full{' '}
                <a href="/privacy" className="text-shiro-red hover:underline">Privacy Policy</a>.
              </p>
            </section>

            <section id="2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Who We Are</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIRO Technologies LLC, operating SHIJO.AI, is the data controller for the personal
                information described in our Privacy Policy. We are based in the United States; see{' '}
                <a href="/privacy#6" className="text-shiro-red hover:underline">Section 6</a> of the Privacy
                Policy for how international transfers are handled.
              </p>
            </section>

            <section id="3">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Bases for Processing</h2>
              <p className="text-gray-700 leading-relaxed">
                We process personal data on the bases of contract performance (to provide the Service you
                signed up for), legitimate interests (such as securing the Service and preventing abuse), and
                consent where applicable (such as certain analytics or marketing). See{' '}
                <a href="/privacy#10" className="text-shiro-red hover:underline">Section 10</a> of the
                Privacy Policy.
              </p>
            </section>

            <section id="4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under the GDPR, you have the right to access, correct, delete, or receive a portable copy of
                your personal data, and to object to or restrict certain processing. You also have the right
                to lodge a complaint with your local data protection supervisory authority.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Self-service:</strong> you can export a complete copy of your account data or
                permanently delete your account at any time from Dashboard &rarr; Settings &rarr; Data &amp;
                Privacy &mdash; no request or waiting period required. For anything else, contact us at{' '}
                <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>.
              </p>
            </section>

            <section id="5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sub-Processors</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We share data with a limited set of service providers, each bound by its own privacy policy
                and, where applicable, a data processing agreement:
              </p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-1">
                <li><strong>Stripe</strong> &mdash; payment processing and billing.</li>
                <li><strong>Anthropic</strong> &mdash; AI model infrastructure powering platform features.</li>
                <li><strong>Resend</strong> &mdash; transactional email delivery.</li>
                <li><strong>Vercel</strong> &mdash; application hosting and infrastructure.</li>
                <li><strong>Neon</strong> &mdash; database hosting.</li>
                <li><strong>Google Analytics</strong> &mdash; aggregate website usage analytics.</li>
                <li><strong>Ahrefs</strong> &mdash; cookieless website analytics and SEO measurement.</li>
              </ul>
            </section>

            <section id="6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your account data for as long as your account is active. Upon account deletion, we
                remove your personal data within 30 days, except where retention is required by law or for
                legitimate business purposes. See{' '}
                <a href="/privacy#9" className="text-shiro-red hover:underline">Section 9</a> of the Privacy
                Policy.
              </p>
            </section>

            <section id="7">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Security Incident Notification</h2>
              <p className="text-gray-700 leading-relaxed">
                If we become aware of a security incident affecting your personal information that requires
                notification under applicable law, we will notify affected users and relevant authorities
                without unreasonable delay. See our{' '}
                <a href="/security" className="text-shiro-red hover:underline">Security</a> page for more.
              </p>
            </section>

            <section id="8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Questions</h2>
              <p className="text-gray-700 leading-relaxed">
                For any question about our GDPR compliance or to exercise a privacy right not covered by our
                self-service tools, contact us at{' '}
                <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
