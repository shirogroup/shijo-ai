import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | SHIJO.AI',
  description: 'Privacy Policy for SHIJO.AI - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-12">Last updated: March 24, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIRO Technologies LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
                SHIJO.AI. This Privacy Policy explains how we collect, use, disclose, and protect your
                personal information when you use our Service. By using SHIJO.AI, you consent to the
                practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Account Information:</strong> When you register, we collect your name, email
                address, and an encrypted version of your password. We do not store passwords in plain text.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Usage Data:</strong> We collect information about how you use the Service,
                including features accessed, queries made, generation counts, and timestamps. This helps
                us enforce quotas and improve the platform.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not
                store your credit card numbers. Stripe may collect billing details in accordance with
                their own privacy policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Technical Data:</strong> We automatically collect IP addresses, browser type,
                device information, and cookies to ensure security and improve performance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed">
                We use your information to: provide and maintain the Service; process subscriptions and
                payments; send transactional emails (password resets, billing confirmations); enforce usage
                limits and prevent abuse; improve and develop new features; comply with legal obligations.
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI Data Processing</h2>
              <p className="text-gray-700 leading-relaxed">
                When you use our AI-powered tools, your queries and content are sent to third-party AI
                providers (such as Anthropic) for processing. We send only the minimum data necessary to
                generate results. We do not use your content to train AI models. AI-generated outputs are
                not stored beyond your session unless you explicitly save them to your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
              <p className="text-gray-700 leading-relaxed">
                We may share data with: Stripe for payment processing; AI providers (Anthropic) to power
                platform features; Resend for transactional email delivery; analytics services to understand
                platform usage. All third-party providers are bound by their respective privacy policies
                and data processing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures including encrypted data transmission
                (TLS/SSL), hashed passwords (bcrypt), secure session management (HTTP-only cookies),
                and access controls. While we strive to protect your data, no method of electronic
                transmission or storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your account data for as long as your account is active. Upon account deletion,
                we remove your personal data within 30 days, except where retention is required by law or
                for legitimate business purposes (such as fraud prevention). Usage analytics may be retained
                in aggregated, anonymized form.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed">
                Depending on your jurisdiction, you may have the right to: access the personal data we
                hold about you; request correction of inaccurate data; request deletion of your data;
                object to or restrict certain processing; receive your data in a portable format. To
                exercise any of these rights, contact us at the address below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. California Residents (CCPA)</h2>
              <p className="text-gray-700 leading-relaxed">
                If you are a California resident, you have the right to know what personal information we
                collect, request its deletion, and opt out of any sale of personal information. We do not
                sell personal information. To make a request, contact us using the information below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is not directed to individuals under the age of 18. We do not knowingly
                collect personal information from children. If we become aware that a child has provided
                us with personal data, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
                Your continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about this Privacy Policy or to exercise your data rights, contact us at:
              </p>
              <div className="mt-4 text-gray-700">
                <p className="font-semibold">SHIRO Technologies LLC</p>
                <p>5080 Spectrum Drive, Suite 575E</p>
                <p>Addison, TX 75001</p>
                <p className="mt-2">
                  Email: <a href="mailto:privacy@shijo.ai" className="text-shiro-red hover:underline">privacy@shijo.ai</a>
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
