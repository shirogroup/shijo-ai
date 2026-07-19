'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { REASON_OPTIONS } from '@/lib/contactReasons';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<string>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const res = await fetch('/api/contact/captcha');
      const data = await res.json();
      setCaptchaQuestion(data.question);
      setCaptchaToken(data.token);
      setCaptchaAnswer('');
    } catch {
      setError('Could not load the verification question. Please refresh the page.');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, reason, subject, message, captchaToken, captchaAnswer }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setReason('general');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      loadCaptcha(); // issue a fresh challenge after any failed attempt
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Message sent</h3>
        <p className="text-gray-600 text-sm mb-4">
          Thanks for reaching out — we&apos;ve emailed you a confirmation and will follow up soon.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm text-shiro-red hover:underline font-medium"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for contacting</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red"
        >
          {REASON_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          required
          rows={5}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quick check — what&apos;s {captchaLoading ? '…' : captchaQuestion}?
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            required
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            disabled={captchaLoading}
            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-shiro-red/30 focus:border-shiro-red disabled:opacity-50"
            placeholder="Answer"
          />
          <button
            type="button"
            onClick={loadCaptcha}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            New question
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || captchaLoading}
        className="w-full bg-shiro-red hover:bg-shiro-red-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
