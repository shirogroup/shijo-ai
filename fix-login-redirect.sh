#!/bin/bash

set -e

cd ~/Projects/shiro-group-monorepo/my-turborepo/apps/shijo-ai

echo "🔧 Fixing post-login redirect..."

# ============================================================
# FIX: Use window.location.href for reliable redirect
# ============================================================

cat > components/auth/LoginForm.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LoginForm() {
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
        // Use window.location for full page reload after login
        window.location.href = redirect;
      } else {
        console.error('[LOGIN] Login failed:', data.error);
        setError(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('[LOGIN] Exception:', err);
      setError('An error occurred. Please try again.');
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

echo "✅ Fixed LoginForm to use window.location.href"

# Also fix RegisterForm with same approach
cat > components/auth/RegisterForm.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[REGISTER] Attempting registration with:', { name, email, passwordLength: password.length });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('[REGISTER] Response status:', response.status);

      const data = await response.json();
      console.log('[REGISTER] Response data:', data);

      if (response.ok) {
        console.log('[REGISTER] Registration successful, redirecting to dashboard...');
        // Use window.location for full page reload
        window.location.href = '/dashboard';
      } else {
        console.error('[REGISTER] Registration failed:', data.error);
        setError(data.error || 'Registration failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('[REGISTER] Exception:', err);
      setError('An error occurred. Please try again.');
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
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="John Doe"
          />
        </div>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
EOF

echo "✅ Fixed RegisterForm to use window.location.href"

echo ""
echo "🏗️  Building..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  echo "📤 Deploying..."
  git add .
  git commit -m "fix: use window.location.href for post-login redirect"
  git push origin main
  echo ""
  echo "🎉 DEPLOYED!"
  echo ""
  echo "🧪 TEST LOGIN AGAIN:"
  echo "   1. Go to https://shijo.ai/login"
  echo "   2. Email: merianda@yahoo.com"
  echo "   3. Password: TestPassword123"
  echo "   4. Should redirect to dashboard!"
else
  echo "❌ Build failed"
  exit 1
fi
