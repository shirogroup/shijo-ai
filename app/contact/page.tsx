import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | SHIJO.AI',
  description: 'Get in touch with the SHIJO.AI team — questions, support, or feedback.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Questions about a tool, your billing, or anything else — send us a message and we&apos;ll
              get back to you by email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
              <ContactForm />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                  <Mail className="w-4 h-4" /> Email
                </div>
                <a href="mailto:legal@shijo.ai" className="text-sm text-shiro-red hover:underline">
                  legal@shijo.ai
                </a>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
                  <MapPin className="w-4 h-4" /> Address
                </div>
                <p className="text-sm text-gray-600">
                  SHIRO Technologies LLC<br />
                  5080 Spectrum Drive, Suite 575E<br />
                  Addison, TX 75001
                </p>
              </div>
              <p className="text-xs text-gray-400">
                For billing changes or cancellations, you can also manage your subscription directly from{' '}
                <a href="/dashboard/billing" className="text-shiro-red hover:underline">Dashboard &rarr; Billing</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
