import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Shijo.ai
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Pricing
              </Link>
              <Link href="#roadmap" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Roadmap
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Sign In
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg hover:from-blue-700 hover:to-violet-700">
                Start Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 mb-8">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              🚀 Now in Beta - AI Search Optimization
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6">
            SEO for the
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"> AI Search Era</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12">
            Traditional keyword research meets AI search optimization. Track your visibility in ChatGPT, Claude, and Perplexity. Build content that ranks everywhere.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg hover:from-blue-700 hover:to-violet-700 shadow-lg">
              Start Free Trial
            </button>
            <button className="px-8 py-4 text-lg font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">90%+</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Margin on AI Features</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">1-2 Days</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Average Build Speed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">19 Features</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Across 6 Phases</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">AI-First</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Built for 2025+</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Shijo.ai is Different
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              We're not just another keyword tool. We're built for where search is heading.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950 dark:to-violet-950 border border-blue-100 dark:border-blue-900">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AI Search Visibility
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Track how often ChatGPT, Claude, and Perplexity mention your brand. See what they say and how to improve it.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                Phase 4 - Coming Soon
              </span>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-100 dark:border-emerald-900">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Smart Keyword Research
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                AI-powered expansion, clustering, and opportunity scoring. Know which keywords to target before your competitors.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
                Phase 1 - Ready Now
              </span>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-100 dark:border-amber-900">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AEO Score & Briefs
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Answer Engine Optimization scoring. Generate content briefs optimized for both Google and AI search.
              </p>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                Phase 2 - In Development
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Built in Phases, Delivered Fast
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              No bloat. No delays. Just features that make money.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Phase 1 */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 1: Keyword Research
                </h3>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  MVP Ready
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Seed keywords → Long-tail expansion → Intent classification → Clustering → Opportunity scoring
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 2: Content & On-Page SEO
                </h3>
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  In Progress
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Page audits → Content briefs → Meta generation → AEO scoring
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 3: SERP & Competitive
                </h3>
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                  Q1 2026
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Search volume → Competitor snapshots → Volatility tracking
              </p>
            </div>

            {/* Phase 4 */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Phase 4: AI Search Visibility ⭐
                </h3>
                <span className="px-3 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-full">
                  Game Changer
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                LLM answer tracking → AI search simulator → Predictive modeling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Freemium to Start, Scale When Ready
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Test the platform free. Upgrade only when you see value.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">$0</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">3 keyword expansions/day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">1 content brief/day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Basic opportunity scores</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-2xl border-2 border-blue-500 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                $39<span className="text-lg text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">100 expansions/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Unlimited content briefs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Full AEO scoring + suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">50 rank keywords tracked</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg hover:from-blue-700 hover:to-violet-700">
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">$99<span className="text-lg text-slate-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Unlimited everything</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">AI visibility tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">200 rank keywords</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Team collaboration</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the beta. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="px-6 py-4 rounded-lg text-slate-900 w-full sm:w-auto sm:min-w-[300px]"
            />
            <button className="px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50">
              Get Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold text-white">Shijo.ai</span>
              <p className="mt-4 text-sm">
                AI-powered SEO for the modern web.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="#roadmap">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm">
            <p>© 2026 Shijo.ai by Shiro Group. All rights reserved.</p>
            <p className="mt-2">5080 Spectrum Drive Suite 575E, Addison, TX 75001</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
