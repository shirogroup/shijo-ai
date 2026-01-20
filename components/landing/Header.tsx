'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
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
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            SHIJO.AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#about" className="text-sm text-gray-300 hover:text-white transition-colors">
            About
          </Link>
        </nav>

        {/* CTA Buttons - NOW CONNECTED */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
