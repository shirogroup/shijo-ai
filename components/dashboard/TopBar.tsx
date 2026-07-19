'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, Search, User, Lightbulb, Send } from 'lucide-react';

const TIPS = [
  'Start with the 2 free tools (Post Caption & SEO Meta Generator) — no credit card needed.',
  'Leave optional fields blank if you\'re not sure — every tool fills in sensible defaults.',
  'Free plan resets your 3 daily generations every day. Pro gives you 200/month across all 12 tools.',
  'Use Settings → Export My Data any time to download everything tied to your account.',
];

// Tracks whether this browser has opened the bell menu before, so the
// "new" dot only shows until someone actually notices it once.
const SEEN_KEY = 'shijo_bell_seen';

export function TopBar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true); // default true to avoid a flash of the dot on first paint
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(typeof window !== 'undefined' && window.localStorage.getItem(SEEN_KEY) === '1');
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function toggleOpen() {
    setOpen((v) => !v);
    if (!open) {
      window.localStorage.setItem(SEEN_KEY, '1');
      setSeen(true);
    }
  }

  async function submitFeedback() {
    if (!feedback.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedback.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not submit your feedback right now.');
      } else {
        setSubmitted(true);
        setFeedback('');
      }
    } catch {
      setError('Could not submit your feedback right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search keywords, content..."
            className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications / Tips + Feature Request */}
        <div className="relative" ref={panelRef}>
          <Button variant="ghost" size="sm" className="relative" onClick={toggleOpen}>
            <Bell className="h-5 w-5 text-gray-400" />
            {!seen && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
          </Button>

          {open && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Tips for getting the most out of Shijo.ai</span>
              </div>
              <ul className="mb-4 space-y-2">
                {TIPS.map((tip, i) => (
                  <li key={i} className="text-xs leading-relaxed text-gray-400">
                    • {tip}
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-800 pt-3">
                <div className="mb-2 text-sm font-semibold text-white">Have an idea for a new tool or feature?</div>
                {submitted ? (
                  <div className="text-xs text-green-400">Thanks — your feature request has been sent to the team.</div>
                ) : (
                  <>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us what would help you..."
                      rows={3}
                      maxLength={2000}
                      className="w-full resize-none rounded-md border border-gray-800 bg-gray-950 p-2 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
                    <button
                      onClick={submitFeedback}
                      disabled={submitting || !feedback.trim()}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      {submitting ? 'Sending...' : 'Send feature request'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || 'User'} className="h-6 w-6 rounded-full" />
              ) : (
                <User className="h-3 w-3 text-white" />
              )}
            </div>
            <span className="text-sm text-gray-300">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
