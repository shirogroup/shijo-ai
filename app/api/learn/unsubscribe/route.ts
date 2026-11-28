import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { learnModuleSubscribers } from '@/db/schema';
import { clientIpFrom, consumeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; fax?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (typeof body.fax === 'string' && body.fax.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const email = cleanEmail(body.email);
  if (!email) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
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
      .where(eq(learnModuleSubscribers.email, email));
    // Same response whether or not the address was on the list.
    return NextResponse.json({ success: true });
  } catch {
    console.error('[learn-unsubscribe] store failed');
    return NextResponse.json(
      { success: false, error: 'We could not update that just now. Please try again in a little while.' },
      { status: 503 }
    );
  }
}
