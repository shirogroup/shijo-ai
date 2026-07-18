import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AI Compliance | SHIJO.AI',
  description: 'How SHIJO.AI approaches AI transparency, the EU AI Act, and responsible use of AI-generated content.',
  keywords: ['ai compliance', 'eu ai act compliance', 'ai transparency', 'responsible ai marketing tools'],
};

export default function AiCompliancePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Compliance</h1>
          <p className="text-gray-500 mb-8">Last updated: July 18, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section id="1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Our AI Infrastructure</h2>
              <p className="text-gray-700 leading-relaxed">
                SHIJO.AI&apos;s tools are powered by Anthropic&apos;s Claude models &mdash; Claude Haiku for
                free-tier tools and Claude Sonnet for Pro and Enterprise tools. We do not train or fine-tune
                our own foundation models.
              </p>
            </section>

            <section id="2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Your Inputs Are Not Used to Train Anthropic&apos;s Models</h2>
              <p className="text-gray-700 leading-relaxed">
                In accordance with Anthropic&apos;s commercial API terms, as they exist at the time you use
                the Service, data submitted through the API is not used to train Anthropic&apos;s
                general-purpose models by default. This representation depends on Anthropic&apos;s own terms
                and policies, which may be updated by Anthropic from time to time. See{' '}
                <a href="/privacy#4" className="text-shiro-red hover:underline">Section 4</a> of our Privacy
                Policy.
              </p>
            </section>

            <section id="3">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. EU AI Act &mdash; Article 50 Transparency</h2>
              <p className="text-gray-700 leading-relaxed">
                Article 50 of the EU Artificial Intelligence Act introduces transparency and machine-readable
                marking obligations for AI-generated content, applicable from August 2, 2026 (with an
                extension to December 2, 2026 for generative-AI systems already on the market). Where this
                law or a similar law applies to your use of Outputs, <strong>you are responsible, as the
                deployer of that content, for making any required AI-disclosure</strong> &mdash; SHIJO.AI
                does not automatically watermark or label Outputs on your behalf today. See{' '}
                <a href="/terms#5" className="text-shiro-red hover:underline">Section 5</a> of our Terms of
                Service.
              </p>
            </section>

            <section id="4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Human Oversight</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Terms of Service require that a human review and take ultimate responsibility for any
                AI-generated Output before it is published or distributed. We do not support fully automated,
                unreviewed publishing of AI Outputs.
              </p>
            </section>

            <section id="5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. No Guarantee of Accuracy</h2>
              <p className="text-gray-700 leading-relaxed">
                AI Outputs are generated using large language models and may be inaccurate, incomplete, or
                not fully original. We do not guarantee that Outputs are accurate, complete, original, or
                free of third-party rights &mdash; you are responsible for reviewing and fact-checking
                Outputs before relying on them. See{' '}
                <a href="/terms#6" className="text-shiro-red hover:underline">Section 6</a> of our Terms of
                Service.
              </p>
            </section>

            <section id="6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-700 leading-relaxed">
                You may not use SHIJO.AI&apos;s AI tools to generate content that is illegal, fraudulent,
                deceptive, infringing, defamatory, or that impersonates any person or entity, among other
                restrictions listed in{' '}
                <a href="/terms#5" className="text-shiro-red hover:underline">Section 5</a> of our Terms of
                Service.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
