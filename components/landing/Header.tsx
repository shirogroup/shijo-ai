'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="hsl(356, 100%, 43%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="hsl(356, 100%, 43%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="hsl(356, 100%, 43%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold text-primary">
            SHIJO.AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Pricing
          </Link>
          <Link href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            About
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <Link href="#features" className="block text-sm text-gray-600 hover:text-gray-900 py-2" onClick={() => setMobileOpen(false)}>
            Features
          </Link>
          <Link href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900 py-2" onClick={() => setMobileOpen(false)}>
            Pricing
          </Link>
          <Link href="#about" className="block text-sm text-gray-600 hover:text-gray-900 py-2" onClick={() => setMobileOpen(false)}>
            About
          </Link>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
