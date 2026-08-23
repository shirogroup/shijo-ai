import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  alternates: { canonical: '/security' },
  title: 'Security | SHIJO.AI',
  description: 'How SHIJO.AI protects your account, data and payments: encryption in transit, session security, access controls, and vulnerability reporting.',
  keywords: ['ai marketing platform security', 'shijo.ai security', 'data security ai tools'],
};

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Security</h1>
          <p className="text-gray-500 mb-8">Last updated: July 18, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section id="1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Data in Transit</h2>
              <p className="text-gray-700 leading-relaxed">
                All traffic between your browser and SHIJO.AI is encrypted using TLS/SSL. We do not serve
                the application or accept form submissions over unencrypted HTTP.
              </p>
            </section>

            <section id="2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Password &amp; Session Security</h2>
              <p className="text-gray-700 leading-relaxed">
                Passwords are hashed with bcrypt before storage &mdash; we never store or have access to
                your plaintext password. Sessions are managed with an HTTP-only, secure cookie, which means
                the session token is not readable by page scripts, reducing exposure to cross-site scripting
                attacks.
              </p>
            </section>

            <section id="3">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Security</h2>
              <p className="text-gray-700 leading-relaxed">
                All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor.
                Your card details are sent directly to Stripe and never touch our servers &mdash; we only
                store a Stripe customer and subscription reference.
              </p>
            </section>

            <section id="4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Access Controls</h2>
              <p className="text-gray-700 leading-relaxed">
                Administrative access to account and billing data is restricted to authorized SHIRO
                Technologies personnel. Admin privileges are re-verified against our database on every
                request rather than trusted from a client-supplied token, so a compromised or forged token
                alone cannot grant administrative access.
              </p>
            </section>

            <section id="5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Infrastructure</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIJO.AI is hosted on Vercel and backed by Neon (managed PostgreSQL). Our AI features are
                powered by Anthropic&apos;s Claude models. Each of these providers maintains its own security
                program; see our{' '}
                <a href="/gdpr-compliance" className="text-shiro-red hover:underline">GDPR Compliance</a> page
                for the full list of sub-processors we use.
              </p>
            </section>

            <section id="6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Own Data Controls</h2>
              <p className="text-gray-700 leading-relaxed">
                You can export a complete copy of your account data, or permanently delete your account and
                all associated data, at any time from Dashboard &rarr; Settings &rarr; Data &amp; Privacy.
                Account deletion requires re-entering your password as a safeguard against a stolen or
                shared session.
              </p>
            </section>

            <section id="7">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Incident Notification</h2>
              <p className="text-gray-700 leading-relaxed">
                If we become aware of a security incident that compromises the confidentiality, integrity,
                or availability of your personal information in a manner that requires notification under
                applicable law, we will notify affected users and any relevant authorities without
                unreasonable delay, consistent with Section 8 of our{' '}
                <a href="/privacy#8" className="text-shiro-red hover:underline">Privacy Policy</a>.
              </p>
            </section>

            <section id="8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. No Guarantee</h2>
              <p className="text-gray-700 leading-relaxed">
                We use commercially reasonable, industry-standard measures to protect your data, but no
                method of electronic transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            <section id="9">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Reporting a Security Issue</h2>
              <p className="text-gray-700 leading-relaxed">
                If you believe you&apos;ve found a security vulnerability in SHIJO.AI, please report it to{' '}
                <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>{' '}
                with as much detail as possible. Please do not publicly disclose a suspected vulnerability
                until we&apos;ve had a reasonable opportunity to investigate and address it.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
