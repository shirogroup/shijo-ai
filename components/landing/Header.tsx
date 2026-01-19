'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ShijoLogoFull } from '@/components/brand/ShijoLogo';
import { Button } from '@/components/ui/button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <ShijoLogoFull />

          {/* Desktop Navigation - NO ROADMAP */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#use-cases" className="text-sm font-medium hover:text-primary transition-colors">
              Solutions
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu - NO ROADMAP */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#use-cases" className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Solutions
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-black/10">
              <Button variant="ghost" className="w-full">Sign In</Button>
              <Button className="w-full bg-primary hover:bg-primary/90">Start Free Trial</Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
