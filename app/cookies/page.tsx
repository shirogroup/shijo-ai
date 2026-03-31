import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Cookie Policy | SHIJO.AI',
  description: 'Cookie Policy for SHIJO.AI - how we use cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-gray-500 mb-12">Last updated: March 24, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help
                the site remember your preferences and understand how you interact with it. SHIJO.AI uses
                cookies to provide a secure and functional experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cookies We Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Essential Cookies (Required):</strong> Our session cookie is necessary for
                authentication and security. It is an HTTP-only, secure cookie that maintains your
                logged-in state. The Service cannot function without it.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Analytics Cookies (Optional):</strong> We may use analytics services to
                understand how visitors use the platform. These cookies collect anonymized usage data
                such as pages visited and time spent on the site.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Third-Party Cookies:</strong> Our payment provider (Stripe) may set cookies
                during the checkout process to facilitate secure transactions. These cookies are governed
                by Stripe&apos;s own cookie and privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How to Manage Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Most browsers allow you to control cookies through their settings. You can block or
                delete cookies, but this may affect functionality — particularly authentication. If you
                block our essential session cookie, you will not be able to log in to SHIJO.AI.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy as our use of cookies evolves. Changes will be reflected
                on this page with an updated date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about our use of cookies, contact us at:
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
