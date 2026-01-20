import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
