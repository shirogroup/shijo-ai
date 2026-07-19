'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'shijo_cookie_consent'; // 'accepted' | 'rejected'

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateConsent(granted: boolean) {
  if (typeof window === 'undefined' || !window.gtag) return;
  const state = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'accepted') {
        updateConsent(true);
      } else if (stored === 'rejected') {
        updateConsent(false); // matches the default, but explicit for clarity
      } else {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. blocked) — don't show a banner we can't persist the answer to
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'rejected');
    } catch {
      // ignore — worst case we ask again next visit
    }
    updateConsent(accepted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          We use essential cookies to run SHIJO.AI, and optional analytics cookies to understand how the site is used.
          See our{' '}
          <a href="/cookies" className="text-shiro-red hover:underline">
            Cookie Policy
          </a>{' '}
          for details.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleChoice(false)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 transition-colors"
          >
            Reject non-essential
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="text-sm font-semibold text-white bg-shiro-red hover:bg-shiro-red-dark px-5 py-2 rounded-lg transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
