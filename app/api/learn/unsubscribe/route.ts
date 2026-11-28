import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { learnModuleSubscribers } from '@/db/schema';
import { clientIpFrom, consumeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;

/** Same shape as unsubscribe_token: 32 random bytes, hex. */
const TOKEN_RE = /^[0-9a-f]{64}$/;

/**
 * Same JSON for an unknown token and a token that matched a row.
 * Does not say whether an address was on the list.
 */
function genericOk() {
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  let body: { token?: unknown; email?: unknown; fax?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Use the unsubscribe link from the email.' },
      { status: 400 }
    );
  }

  // Honeypot. Nothing is updated.
  if (typeof body.fax === 'string' && body.fax.trim() !== '') {
    return genericOk();
  }

  const token = typeof body.token === 'string' ? body.token.trim().toLowerCase() : '';

  // Email alone must not unsubscribe anyone. Do not query by address.
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Use the unsubscribe link from the email.' },
      { status: 400 }
    );
  }

  // Invalid shape. Same public response as an unknown token, and no query.
  if (!TOKEN_RE.test(token)) {
    return genericOk();
  }

  const ip = clientIpFrom(req.headers);
  const throttle = await consumeRateLimit(`learn-unsubscribe:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!throttle.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts from this network. Try again later.' },
      { status: 429 }
    );
  }

  try {
    await db
      .update(learnModuleSubscribers)
      .set({ unsubscribedAt: new Date(), updatedAt: new Date() })
      .where(eq(learnModuleSubscribers.unsubscribeToken, token));
    return genericOk();
  } catch {
    // Do not log the error object. It can include the query and the token.
    console.error('[learn-unsubscribe] store failed');
    return NextResponse.json(
      { success: false, error: 'We could not update that just now. Please try again in a little while.' },
      { status: 503 }
    );
  }
}
