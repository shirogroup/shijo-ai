import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600">
                SHIJO<span className="text-black dark:text-white">.ai</span>
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-500 font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-500 font-medium">
                Pricing
              </Link>
              <Link href="#roadmap" className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-500 font-medium">
                Roadmap
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-500">
                Sign In
              </button>
              <button className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Start Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-8">
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              🚀 AI-Powered SEO Platform - Phase 1 Live
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-black dark:text-white mb-6 leading-tight">
            Keyword Research<br />
            <span className="text-red-600">Meets AI Search</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
            Track visibility in ChatGPT, Claude & Perplexity. Smart keyword research with AI-powered clustering, intent analysis, and opportunity scoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg">
              Start Free Trial
            </button>
            <button className="px-8 py-4 text-lg font-medium text-black dark:text-white bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="border-l-4 border-red-600 pl-4">
              <div className="text-4xl font-bold text-black dark:text-white">90%+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI Feature Margins</div>
            </div>
            <div className="border-l-4 border-red-600 pl-4">
              <div className="text-4xl font-bold text-black dark:text-white">1-2 Days</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Build Speed</div>
            </div>
            <div className="border-l-4 border-red-600 pl-4">
              <div className="text-4xl font-bold text-black dark:text-white">19</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Features (6 Phases)</div>
            </div>
            <div className="border-l-4 border-red-600 pl-4">
              <div className="text-4xl font-bold text-red-600">AI-First</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Built for 2025+</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              AI-Powered SEO Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built for where search is heading, not where it has been
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-600 transition-colors rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">
                AI Search Visibility
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Track mentions in ChatGPT, Claude, and Perplexity. Monitor brand presence in AI-generated answers.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded">
                PHASE 4
              </span>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white dark:bg-black border-2 border-red-600 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">
                Smart Keyword Research
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                AI-powered expansion, clustering, intent analysis, and opportunity scoring.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-bold bg-red-600 text-white rounded">
                LIVE NOW
              </span>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-600 transition-colors rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">
                AEO Score & Briefs
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Answer Engine Optimization scoring. Content briefs for Google and AI search.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                PHASE 2
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              6-Phase Roadmap
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built incrementally. High margins. Fast deployment.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Phase 1 */}
            <div className="p-6 bg-white dark:bg-black border-l-4 border-red-600 border-t border-r border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Phase 1: Keyword Research (MVP)
                </h3>
                <span className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded">
                  LIVE
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Seed keywords • Long-tail expansion • Intent classification • Clustering • Opportunity scoring
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-6 bg-white dark:bg-black border-l-4 border-gray-400 border-t border-r border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Phase 2: Content & On-Page SEO
                </h3>
                <span className="px-3 py-1 text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  IN PROGRESS
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Page audits • Content briefs • Meta generation • AEO scoring
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-6 bg-white dark:bg-black border-l-4 border-gray-300 border-t border-r border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Phase 3: SERP & Competitive
                </h3>
                <span className="px-3 py-1 text-xs font-bold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded">
                  Q1 2026
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Search volume • Competitor snapshots • Volatility tracking
              </p>
            </div>

            {/* Phase 4 */}
            <div className="p-6 bg-red-50 dark:bg-red-950 border-l-4 border-red-600 border-t border-r border-b border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Phase 4: AI Search Visibility ⭐
                </h3>
                <span className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded">
                  GAME CHANGER
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                LLM answer tracking • AI search simulator • Predictive modeling
              </p>
            </div>

            {/* Phase 5 & 6 */}
            <div className="p-6 bg-white dark:bg-black border-l-4 border-gray-300 border-t border-r border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Phase 5-6: Strategy & Rank Tracking
                </h3>
                <span className="px-3 py-1 text-xs font-bold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded">
                  PLANNED
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                SEO advisor • Workflow manager • Rank tracking • Monitoring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Freemium Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free. Upgrade when you see value.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg">
              <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Free</h3>
              <div className="text-5xl font-bold text-black dark:text-white mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">3 keyword expansions/day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">1 content brief/day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Basic opportunity scores</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-bold text-black dark:text-white border-2 border-black dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 bg-red-600 text-white rounded-lg relative transform scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-5xl font-bold mb-6">
                $39<span className="text-lg opacity-80">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="mr-2 font-bold">✓</span>
                  <span className="text-sm">100 expansions/month</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">✓</span>
                  <span className="text-sm">Unlimited content briefs</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">✓</span>
                  <span className="text-sm">Full AEO scoring + suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 font-bold">✓</span>
                  <span className="text-sm">50 rank keywords tracked</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-bold text-red-600 bg-white hover:bg-gray-100 rounded-lg transition-colors">
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-lg">
              <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Enterprise</h3>
              <div className="text-5xl font-bold text-black dark:text-white mb-6">
                $99<span className="text-lg text-gray-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Unlimited everything</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">AI visibility tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">200 rank keywords</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Team collaboration</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-bold text-black dark:text-white border-2 border-black dark:border-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join the beta. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="px-6 py-4 rounded-lg text-black w-full sm:w-auto sm:min-w-[300px] font-medium"
            />
            <button className="px-8 py-4 text-lg font-bold text-red-600 bg-white hover:bg-gray-100 rounded-lg transition-colors">
              Get Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold text-white">
                SHIJO<span className="text-red-600">.ai</span>
              </span>
              <p className="mt-4 text-sm">
                AI-powered SEO for the modern web.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-red-500">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-red-500">Pricing</Link></li>
                <li><Link href="#roadmap" className="hover:text-red-500">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-red-500">About</Link></li>
                <li><Link href="/blog" className="hover:text-red-500">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-red-500">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-red-500">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-red-500">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 Shijo.ai by Shiro Group. All rights reserved.</p>
            <p className="mt-2">5080 Spectrum Drive Suite 575E, Addison, TX 75001</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
