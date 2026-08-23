import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy | SHIJO.AI',
  description: 'Privacy Policy for SHIJO.AI - how we collect, use, and protect your data.',
  keywords: ['shijo.ai privacy policy', 'ai marketing platform data privacy'],
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-12">Last updated: July 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section id="1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIRO Technologies LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
                SHIJO.AI. This Privacy Policy explains how we collect, use, disclose, and protect your
                personal information when you use our Service. By using SHIJO.AI, you acknowledge the
                practices described in this policy.
              </p>
            </section>

            <section id="2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Account Information:</strong> When you register, we collect your name, email
                address, and an encrypted (hashed) version of your password. We do not store passwords in
                plain text.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Usage Data:</strong> We collect information about how you use the Service,
                including features accessed, queries made, generation counts, and timestamps. This helps
                us enforce quotas and improve the platform.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not
                store your full credit card numbers on our own servers. Stripe collects billing details in
                accordance with its own privacy policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Technical Data:</strong> We automatically collect IP addresses, browser type, device
                information, and cookies to ensure security and improve performance. See Section 13 (Cookies)
                and our separate{' '}
                <a href="/cookies" className="text-shiro-red hover:underline">Cookie Policy</a> for details.
              </p>
            </section>

            <section id="3">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed">
                We use your information to: provide and maintain the Service; process subscriptions and
                payments; send transactional emails (such as password resets and billing confirmations);
                enforce usage limits and prevent abuse; understand aggregate product usage and improve the
                Service; and comply with legal obligations. We do not sell your personal information to
                third parties.
              </p>
            </section>

            <section id="4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI Data Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you use our AI-powered tools, the inputs you submit are sent to our third-party AI
                infrastructure provider, Anthropic, to generate results. We send only the data necessary to
                generate your requested output.
              </p>
              <p className="text-gray-700 leading-relaxed">
                In accordance with Anthropic&apos;s commercial API terms, as they exist at the time you use
                the Service, data submitted through the API is not used to train Anthropic&apos;s
                general-purpose models by default. This representation depends on Anthropic&apos;s own terms
                and policies, which may be updated by Anthropic from time to time; we encourage you to also
                review{' '}
                <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-shiro-red hover:underline">
                  Anthropic&apos;s privacy policy
                </a>{' '}
                directly. AI-generated outputs are not stored by us beyond your session unless you
                explicitly save them to your account.
              </p>
            </section>

            <section id="5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing &amp; Sub-Processors</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We share data with the following categories of service providers, each of which processes
                data only as necessary to provide their service to us and is bound by its own privacy
                policy and, where applicable, a data processing agreement:
              </p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-1">
                <li><strong>Stripe</strong> — payment processing and billing.</li>
                <li><strong>Anthropic</strong> — AI model infrastructure powering platform features.</li>
                <li><strong>Resend</strong> — transactional email delivery (password resets, account
                  notifications).</li>
                <li><strong>Vercel</strong> — application hosting and infrastructure.</li>
                <li><strong>Neon</strong> — database hosting.</li>
                <li><strong>Google Analytics</strong> — aggregate website usage analytics.</li>
                <li><strong>Ahrefs</strong> — cookieless website analytics and SEO measurement.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We may also disclose information where required by law, to protect our rights or the safety
                of others, or in connection with a merger, acquisition, or sale of assets, in which case we
                will require the receiving party to honor the commitments in this Policy for previously
                collected data.
              </p>
            </section>

            <section id="6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                We and our service providers listed in Section 5 are based in the United States. If you
                access the Service from outside the United States, your information will be transferred to,
                stored, and processed in the United States, where data protection laws may differ from
                those in your jurisdiction. By using the Service, you consent to this transfer, to the
                extent permitted by applicable law.
              </p>
            </section>

            <section id="7">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures including encrypted data transmission
                (TLS/SSL), hashed passwords (bcrypt), secure session management (HTTP-only cookies), and
                access controls. While we use commercially reasonable efforts to protect your data, no
                method of electronic transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            <section id="8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Security Incident Notification</h2>
              <p className="text-gray-700 leading-relaxed">
                If we become aware of a security incident that compromises the confidentiality, integrity,
                or availability of your personal information in a manner that requires notification under
                applicable law, we will notify affected users and any relevant authorities without
                unreasonable delay and in accordance with the timelines required by applicable law.
              </p>
            </section>

            <section id="9">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your account data for as long as your account is active. Upon account deletion,
                we remove your personal data within 30 days, except where retention is required by law or
                for legitimate business purposes (such as fraud prevention, dispute resolution, or
                enforcement of our agreements). Usage analytics may be retained in aggregated, anonymized
                form after account deletion.
              </p>
            </section>

            <section id="10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the right to: access the personal data we hold
                about you; request correction of inaccurate data; request deletion of your data; object to
                or restrict certain processing; and receive your data in a portable format. To exercise any
                of these rights, contact us at the address in Section 17.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Self-service tools:</strong> logged-in users can export a complete copy of their
                account data, or permanently delete their account and all associated data, at any time from{' '}
                <strong>Dashboard &rarr; Settings &rarr; Data &amp; Privacy</strong> &mdash; no request or
                waiting period required.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>For users in the European Economic Area, United Kingdom, or Switzerland:</strong> we
                process your data on the legal bases of contract performance (to provide the Service),
                legitimate interests (such as securing the Service and preventing abuse), and consent (where
                applicable, such as certain analytics or marketing). You have the right to lodge a complaint
                with your local data protection supervisory authority.
              </p>
            </section>

            <section id="11">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Canadian Privacy Rights (PIPEDA)</h2>
              <p className="text-gray-700 leading-relaxed">
                If you are located in Canada, we collect, use, and disclose your personal information in
                accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA)
                and applicable provincial privacy legislation. We collect your information only for the
                purposes described in Section 3, with your consent, and you may withdraw consent, access
                your information, or request correction at any time by contacting us at the address in
                Section 15, subject to legal and contractual restrictions. Any commercial electronic
                messages we send are sent in compliance with Canada&apos;s Anti-Spam Legislation (CASL),
                including sender identification and a functioning unsubscribe mechanism honored within 10
                business days.
              </p>
            </section>

            <section id="12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. California Privacy Rights (CCPA/CPRA)</h2>
              <p className="text-gray-700 leading-relaxed">
                If you are a California resident, you have the right to know what personal information we
                collect, request its deletion, request correction of inaccurate information, and opt out of
                any sale or sharing of personal information (including sharing for cross-context behavioral
                advertising, if applicable). We do not sell personal information. To make a request or to
                opt out, contact us using the information in Section 17. We honor recognized
                opt-out preference signals (such as the Global Privacy Control) where required by law.
              </p>
            </section>

            <section id="13">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies for authentication, security, and analytics
                purposes. For a full description of the cookies we use and your choices regarding them, see
                our{' '}
                <a href="/cookies" className="text-shiro-red hover:underline">Cookie Policy</a>.
              </p>
            </section>

            <section id="14">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. AI-Generated Content &amp; the EU AI Act</h2>
              <p className="text-gray-700 leading-relaxed">
                Content generated through our AI tools is produced using large language models provided by
                Anthropic. Where the EU Artificial Intelligence Act or similar law applies to your use of
                Outputs — including the transparency and machine-readable marking obligations under Article
                50 of the EU AI Act — you are responsible, as the deployer of that content, for making any
                required disclosure that the content is AI-generated. See Section 6 of our{' '}
                <a href="/terms" className="text-shiro-red hover:underline">Terms of Service</a> for more.
              </p>
            </section>

            <section id="15">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is not directed to individuals under the age of 18, and our Terms of Service
                require users to be at least 18 years old. We do not knowingly collect personal information
                from children. If we become aware that a child has provided us with personal data, we will
                take steps to delete it promptly. If you believe a child has provided us with personal
                information, contact us at the address in Section 17.
              </p>
            </section>

            <section id="16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes
                by posting the updated policy on this page and updating the &quot;Last updated&quot; date, and
                where required by law, by additional notice such as email. Your continued use of the Service
                after changes take effect constitutes acceptance of the revised policy.
              </p>
            </section>

            <section id="17">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact</h2>
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
