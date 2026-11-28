import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { learnModuleSubscribers } from '@/db/schema';
import { clientIpFrom, consumeRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// 10 attempts / hour / IP, same ceiling and table as registration
// (signup_throttle via consumeRateLimit). The key is the IP only.
// Do not put the address in the key: the throttle logs the key if it fails.
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

function cleanName(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  if (name.length > 80) return null;
  if (/[\u0000-\u001F\u007F<>]/.test(name)) return null;
  return name;
}

export async function POST(req: NextRequest) {
  let body: {
    email?: unknown;
    name?: unknown;
    consent?: unknown;
    fax?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Honeypot. Real people never see this field. Same success shape as a
  // real signup so a bot is not told to retry. Nothing is stored.
  if (typeof body.fax === 'string' && body.fax.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const email = cleanEmail(body.email);
  if (!email) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  const name = cleanName(body.name);
  if (body.name !== undefined && body.name !== null && body.name !== '' && !name) {
    return NextResponse.json({ success: false, error: 'Name looks invalid. You can leave it blank.' }, { status: 400 });
  }

  if (body.consent !== true) {
    return NextResponse.json(
      { success: false, error: 'Check the box if you want these emails.' },
      { status: 400 }
    );
  }

  const ip = clientIpFrom(req.headers);
  const throttle = await consumeRateLimit(`learn-subscribe:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!throttle.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts from this network. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const [existing] = await db
      .select({
        id: learnModuleSubscribers.id,
        unsubscribedAt: learnModuleSubscribers.unsubscribedAt,
      })
      .from(learnModuleSubscribers)
      .where(eq(learnModuleSubscribers.email, email))
      .limit(1);

    if (existing && !existing.unsubscribedAt) {
      return NextResponse.json({ success: true });
    }

    if (existing) {
      await db
        .update(learnModuleSubscribers)
        .set({
          name,
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(learnModuleSubscribers.id, existing.id));
      return NextResponse.json({ success: true });
    }

    // Token is stored for learnUnsubscribeUrl() in lib/learn/links.ts.
    // No email is sent from this route.
    await db.insert(learnModuleSubscribers).values({
      email,
      name,
      unsubscribeToken: randomBytes(32).toString('hex'),
    });
    return NextResponse.json({ success: true });
  } catch {
    // Do not log the error object. Postgres messages include the query
    // and the address. TODO: this stays a 503 until
    // db/migrations/learn-module-subscribers.sql is applied to DATABASE_URL.
    console.error('[learn-subscribe] store failed');
    return NextResponse.json(
      { success: false, error: 'We could not save that just now. Please try again in a little while.' },
      { status: 503 }
    );
  }
}
