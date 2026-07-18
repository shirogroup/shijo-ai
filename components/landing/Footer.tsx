import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-black">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">SHIJO.AI</span>
            <p className="text-gray-400 mt-3 mb-4 max-w-md text-sm">
              12 AI-powered marketing tools for SEO, content, ads, and email &mdash; keyword research,
              content generation, and campaign copy in one subscription.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-semibold text-gray-300">SHIRO Technologies LLC</p>
              <p>5080 Spectrum Drive, Suite 575E</p>
              <p>Addison, TX 75001</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#features" className="text-gray-400 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-gray-400 hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/register" className="text-gray-400 hover:text-primary transition-colors">Get Started</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Company & Compliance */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
              <li>
                <a href="https://shirotechnologies.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  SHIRO Technologies
                </a>
              </li>
              <li><Link href="/security" className="text-gray-400 hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {currentYear} SHIJO.ai &mdash; All rights reserved</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors">Privacy</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-primary transition-colors">Cookies</Link>
            <Link href="/gdpr-compliance" className="text-gray-400 hover:text-primary transition-colors">GDPR Compliance</Link>
            <Link href="/ai-compliance" className="text-gray-400 hover:text-primary transition-colors">AI Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
