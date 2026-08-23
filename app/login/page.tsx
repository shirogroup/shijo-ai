import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  alternates: { canonical: '/login' },
  title: 'Sign In - SHIJO.AI',
  description: 'Sign in to your SHIJO.AI account to access your AI marketing tools, saved work, usage history and billing settings.',
  // Transactional page with no search value. It was indexable with a 32-char
  // description and no H1, which is what Ahrefs flagged; noindex is the right
  // fix rather than adding an H1 to a sign-in form. (2026-08-22)
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-black to-[#1a1a1a] px-4">
      <Suspense fallback={
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mx-auto mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
