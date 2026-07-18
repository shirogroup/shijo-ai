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
          <p className="text-gray-500 mb-12">Last updated: July 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using SHIJO.AI (&quot;the Service&quot;), operated by SHIRO Technologies LLC
                (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of
                Service (&quot;Terms&quot;) and our Privacy Policy. You must affirmatively accept these Terms and
                our Privacy Policy by checking the acceptance box at account registration before you can
                create an account or use any part of the Service, including any AI tool. If you do not
                agree, you may not register for or use the Service. We reserve the right to update these
                Terms at any time; we will update the &quot;Last updated&quot; date above when we do. Where a
                change is material, we will make reasonable efforts to notify existing users (such as by
                email or an in-product notice) and, where required by law, seek renewed acceptance before
                the change applies to you. Continued use of the Service after a non-material change takes
                effect constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIJO.AI is an AI-powered SEO and digital marketing platform that provides keyword research,
                content generation, SEO optimization, and related tools. The Service is provided on a
                subscription basis with Free, Pro, and Enterprise tiers. Features, quotas, individual tools
                offered, and pricing are subject to change with reasonable notice, as described in Section
                7 below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                You must provide accurate information when creating an account. You are responsible for
                maintaining the confidentiality of your login credentials and for all activity under your
                account, whether or not you authorized that activity. You must be at least 18 years old to
                use the Service. You agree to notify us immediately at{' '}
                <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>{' '}
                of any unauthorized use of your account or any other breach of security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription &amp; Billing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Paid subscriptions are available on a recurring monthly or annual billing cycle, as selected
                at checkout, and are processed through Stripe. By subscribing, you authorize us to charge
                your payment method on file on a recurring basis for the plan and billing interval you
                selected, until you cancel.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Automatic Renewal Disclosure:</strong> Your subscription will automatically renew at
                the end of each billing period (monthly or annually, as applicable) at the then-current
                price for your plan, unless you cancel before the renewal date. We will use reasonable
                efforts to provide advance notice of any price change to your plan before it takes effect on
                a renewal, consistent with Section 4&apos;s 30-day notice commitment below. You may cancel
                auto-renewal at any time through the billing portal in your account settings; cancellation
                takes effect at the end of your current billing period, and you will retain access to paid
                features through that date. We do not currently offer a free trial for paid tiers; the Free
                plan is a separate, non-expiring tier with its own usage limits.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Refunds are handled on a case-by-case basis at our discretion, except where applicable law
                requires otherwise. We reserve the right to change pricing for any plan, provided that we
                give at least 30 days&apos; notice before a price change applies to your then-active
                subscription; continuing your subscription after that notice period constitutes acceptance
                of the new price.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain
                unauthorized access to the Service or its infrastructure; (c) reverse-engineer, scrape, or
                redistribute any part of the Service; (d) use automated tools or bots to access the Service
                beyond normal, authenticated usage; (e) transmit malicious code or interfere with the
                Service&apos;s operation; or (f) exceed your plan&apos;s usage quotas through circumvention.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                You further agree not to use the Service&apos;s AI-powered tools to generate content that: is
                illegal, fraudulent, or deceptive; infringes the intellectual property, privacy, or other
                rights of any third party; is defamatory, harassing, or discriminatory; impersonates any
                person or entity; constitutes spam or unsolicited bulk communication; or otherwise violates
                the acceptable use policies of our underlying AI infrastructure providers. You may not
                represent Outputs as being entirely human-generated where disclosure of AI involvement is
                required by applicable law, platform policy, or advertising standards — including, for
                users in the European Union, the disclosure and machine-readable marking obligations under
                Article 50 of the EU Artificial Intelligence Act for AI-generated content, and any
                applicable deepfake or synthetic-media labeling law in your jurisdiction. A human must
                review and take ultimate responsibility for any Output before it is published or
                distributed; you are solely responsible for making any AI-disclosure required in the
                jurisdictions where you publish or distribute Outputs.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We may immediately suspend or throttle your access to the Service, without prior notice,
                where we reasonably believe doing so is necessary to prevent harm, investigate suspected
                abuse, or limit legal exposure — including where we suspect unauthorized use of your
                account credentials. Confirmed violations of this Section may result in permanent
                termination of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. AI-Generated Content; Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service, including its design, code, branding, and underlying software, is the property
                of SHIRO Technologies LLC. You retain ownership of content you submit to the Service
                (&quot;Inputs&quot;). Subject to your compliance with these Terms, we grant you a non-exclusive
                license to use content generated by the Service in response to your Inputs (&quot;Outputs&quot;)
                for your own business or personal purposes.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using the Service, you grant us a limited license to process your Inputs solely to
                provide the Service to you. Outputs are generated using large language models and may not
                be unique — the same or similar Inputs may produce the same or similar Outputs for other
                users. <strong>We do not guarantee that Outputs are accurate, complete, original, or free of
                third-party rights.</strong> You are solely responsible for reviewing, fact-checking, and
                obtaining any necessary legal clearance for Outputs before publishing, distributing, or
                otherwise relying on them, including verifying they do not infringe any third party&apos;s
                trademark, copyright, or other rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Changes</h2>
              <p className="text-gray-700 leading-relaxed">
                We are continuously developing the Service and may add, modify, or discontinue individual
                tools, features, AI models, or usage limits at any time. Where a change materially reduces
                the functionality available to paid subscribers, we will make reasonable efforts to provide
                advance notice. We are not liable for any modification, suspension, or discontinuation of
                any feature or tool.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not guarantee specific SEO
                results, search rankings, traffic increases, or AI visibility outcomes. Search engine and AI
                platform algorithms are outside our control and may change at any time without notice. AI
                Outputs are for informational purposes and should be independently verified before use, as
                described in Section 6.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIRO TECHNOLOGIES LLC SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF
                PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE,
                EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE
                LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT
                YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THESE
                LIMITATIONS APPLY REGARDLESS OF THE LEGAL THEORY ON WHICH A CLAIM IS BASED. SOME
                JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE
                ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless SHIRO Technologies LLC and its officers,
                employees, and agents from and against any claims, liabilities, damages, losses, and
                expenses, including reasonable attorneys&apos; fees, arising out of or in any way connected
                with: (a) your access to or use of the Service; (b) your Inputs or your use of any Outputs;
                (c) your violation of these Terms; or (d) your violation of any third party&apos;s rights,
                including intellectual property or privacy rights.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We will, at our own expense, defend you against any third-party claim alleging that the
                Service itself (excluding your Inputs, your use of Outputs, or any third-party AI
                infrastructure we rely on) infringes that third party&apos;s U.S. patent, copyright, or
                trademark, and will indemnify you against damages finally awarded as a result, provided you
                promptly notify us of the claim and give us sole control of its defense and settlement. This
                Section 10 states our and your sole obligations, and each other&apos;s sole remedy, for any
                such claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Export Control &amp; Sanctions Compliance</h2>
              <p className="text-gray-700 leading-relaxed">
                You represent that you are not located in, under the control of, or a national or resident
                of any country or on any list subject to U.S. government embargo or sanctions, including
                designation on the U.S. Treasury Department&apos;s Specially Designated Nationals list or the
                U.S. Commerce Department&apos;s Denied Persons or Entity List. You agree to comply with all
                applicable export control and economic sanctions laws in your use of the Service, including
                those applicable to our underlying AI infrastructure providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your access to the Service at any time for violation of these
                Terms or for any other reason with reasonable notice, except where we reasonably believe
                immediate suspension is necessary (see Section 5). You may terminate your account at any
                time through your account settings. Upon termination, your right to use the Service ceases
                immediately. Provisions that by their nature should survive termination — including
                Sections 6, 8, 9, 10, 13, and 14 — shall survive.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Dispute Resolution; Arbitration Agreement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Please read this section carefully — it affects your legal rights.</strong> Except
                for disputes that qualify for small claims court, you and SHIRO Technologies LLC agree to
                resolve any dispute arising out of or relating to these Terms or the Service through
                binding, individual arbitration administered by a mutually agreed arbitration provider,
                rather than in court, except that either party may bring an individual action in small
                claims court.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Class Action Waiver:</strong> You and we agree that any arbitration or proceeding
                shall be limited to the dispute between us individually. To the fullest extent permitted by
                law, no arbitration or proceeding shall be joined with any other, and there is no right or
                authority for any dispute to be arbitrated or litigated on a class-action or
                representative-action basis.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Opt-Out:</strong> You may opt out of this arbitration agreement by sending written
                notice to <a href="mailto:legal@shijo.ai" className="text-shiro-red hover:underline">legal@shijo.ai</a>{' '}
                within 30 days of first accepting these Terms. If you opt out, disputes will be resolved
                under Section 14 (Governing Law) in the courts specified there.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms, and any dispute not subject to arbitration under Section 13, shall be governed
                by the laws of the State of Texas, without regard to conflict of law principles. Any such
                disputes shall be resolved in the state or federal courts located in Dallas County, Texas,
                and you consent to the personal jurisdiction of those courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Force Majeure</h2>
              <p className="text-gray-700 leading-relaxed">
                We will not be liable for any failure or delay in performance resulting from causes beyond
                our reasonable control, including acts of God, natural disaster, war, terrorism, riot,
                labor dispute, internet or telecommunications failure, or failure of a third-party hosting,
                payment, or infrastructure provider (including our cloud hosting, database, payment, email,
                or AI infrastructure providers).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. General Provisions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Severability:</strong> If any provision of these Terms is found unenforceable, the
                remaining provisions will remain in full force and effect, and the unenforceable provision
                will be modified to the minimum extent necessary to make it enforceable.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our prior
                written consent. We may assign these Terms without restriction, including in connection with
                a merger, acquisition, or sale of assets.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms will
                not be considered a waiver of that right or provision.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute
                the entire agreement between you and SHIRO Technologies LLC regarding the Service and
                supersede any prior agreements on this subject.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact</h2>
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
