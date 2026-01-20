#!/bin/bash

set -e

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

echo "🔧 Fixing login page and logo issues..."

# ============================================================
# FIX 1: Fix Login Page Syntax Error
# ============================================================

cat > app/login/page.tsx << 'EOF'
import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-primary flex-shrink-0"
              >
                <path
                  d="M16 2L4 9v14l12 7 12-7V9L16 2z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M16 9L10 12.5v7L16 23l6-3.5v-7L16 9z"
                  fill="currentColor"
                />
                <circle cx="16" cy="16" r="2" fill="white" />
              </svg>
              <span className="text-xl font-bold whitespace-nowrap">
                SHIJO<span className="text-primary">.ai</span>
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Form with Suspense */}
          <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
            <LoginForm />
          </Suspense>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {`Don't have an account? `}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ Fixed login page"

# ============================================================
# FIX 2: Add console logging to LoginForm for debugging
# ============================================================

cat > components/auth/LoginForm.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[LOGIN] Form submitted');
    console.log('[LOGIN] Email:', email);
    console.log('[LOGIN] Redirect target:', redirect);

    try {
      console.log('[LOGIN] Sending request to /api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[LOGIN] Response status:', response.status);

      const data = await response.json();
      console.log('[LOGIN] Response data:', data);

      if (response.ok) {
        console.log('[LOGIN] Login successful, redirecting to:', redirect);
        router.push(redirect);
        router.refresh();
      } else {
        console.error('[LOGIN] Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('[LOGIN] Exception:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
EOF

echo "✅ Added debug logging to LoginForm"

# ============================================================
# FIX 3: Verify login API route has proper logging
# ============================================================

cat > app/api/auth/login/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, setSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('[LOGIN API] Request received');
    
    const body = await req.json();
    console.log('[LOGIN API] Email:', body.email);

    const { email, password } = body;

    // Validation
    if (!email || !password) {
      console.log('[LOGIN API] Missing credentials');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('[LOGIN API] Looking up user:', email.toLowerCase());
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      console.log('[LOGIN API] User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      console.log('[LOGIN API] User has no password (OAuth only?)');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[LOGIN API] Verifying password');
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      console.log('[LOGIN API] Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[LOGIN API] Password valid, setting session');
    
    // Set session
    await setSession({
      userId: user.id,
      email: user.email,
    });

    console.log('[LOGIN API] Login successful for:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: user.planTier,
      },
    });
  } catch (error) {
    console.error('[LOGIN API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ Added debug logging to login API"

echo ""
echo "🏗️  Building..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  echo "📤 Deploying..."
  git add .
  git commit -m "fix: login page syntax error and add debug logging"
  git push origin main
  echo ""
  echo "🎉 DEPLOYED!"
  echo ""
  echo "🧪 TEST LOGIN:"
  echo "   1. Go to https://shijo.ai/login"
  echo "   2. Open browser console (F12)"
  echo "   3. Try logging in with: merianda+test5@yahoo.com"
  echo "   4. Share console output with me"
else
  echo "❌ Build failed"
  exit 1
fi
