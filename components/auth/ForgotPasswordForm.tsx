'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-gray-400">
            We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>

        <Link href="/login">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="text-gray-400">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <Link href="/login">
        <Button variant="ghost" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </Link>
    </div>
  );
}
