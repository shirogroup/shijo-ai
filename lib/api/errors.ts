import { NextResponse } from 'next/server';

// Shared helper for unexpected (5xx) API errors. Two problems this solves:
//
// 1. Every route previously caught errors and returned a bare
//    "Internal server error" — fine for a user to see, useless if they
//    report it, since there's nothing to search Vercel logs for.
// 2. Support tickets/bug reports about a crash had no way to be tied back
//    to the actual log line without guessing at timestamps.
//
// This generates a short reference code, logs the *real* error server-side
// tagged with that code, and returns the same code to the client so it can
// be shown in the UI and quoted in a support ticket — e.g. "Error ref:
// GEN-8F2K1Q". Grepping Vercel logs for that string finds the exact
// request's stack trace.
export function refCode(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
}

export function serverErrorResponse(
  prefix: string,
  context: string,
  error: unknown,
  message = 'Something went wrong on our end. Please try again.'
) {
  const ref = refCode(prefix);
  console.error(`[${ref}] ${context}:`, error);
  return NextResponse.json(
    { success: false, error: `${message} (Error ref: ${ref})`, errorRef: ref },
    { status: 500 }
  );
}
