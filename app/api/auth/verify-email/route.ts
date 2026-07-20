import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// Soft email verification — clicking the link in the welcome email lands
// here. This is authenticated by the token itself (single-use, cleared on
// success), not by session, since the person may be opening this link on a
// different device than the one they signed up on. Verifying is purely a
// trust signal: nothing in the app gates login or tool access on it (see
// lib/tools/usage.ts and app/api/auth/me/route.ts — emailVerified is only
// ever read, never enforced). Always redirects back to the dashboard
// rather than returning raw JSON, since this route is only ever reached by
// a human clicking a link in an email client.
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/dashboard?emailVerify=missing`);
  }

  const [user] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);

  if (!user) {
    // Token not found — either already used (cleared on prior success) or
    // never valid. Either way, the safe response is the same generic
    // "expired" redirect rather than distinguishing the two cases, so a
    // guessed/brute-forced token can't be used to probe validity.
    return NextResponse.redirect(`${baseUrl}/dashboard?emailVerify=expired`);
  }

  if (user.emailVerified) {
    return NextResponse.redirect(`${baseUrl}/dashboard?emailVerify=already`);
  }

  // Same IP-capture pattern as app/api/auth/register/route.ts's terms
  // acceptance record — captured here independently of the signup-time IP
  // so a mismatch between the two is visible for fraud review, per the
  // explicit ask that prompted this feature.
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown');

  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifiedIp: ipAddress,
      emailVerificationToken: null, // single-use
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(`${baseUrl}/dashboard?emailVerify=success`);
}
