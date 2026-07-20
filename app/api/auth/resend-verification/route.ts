import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, buildVerifyEmailReminder } from '@/lib/email';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Called from the "Resend confirmation email" button in the dashboard bell
// icon (components/dashboard/TopBar.tsx). Authenticated — unlike
// verify-email's GET route, there's no reason to let this be triggered by
// an unauthenticated request, and it lets us skip re-validating identity.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Please sign in first' }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, emailVerified: users.emailVerified, emailVerificationSentAt: users.emailVerificationSentAt })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Simple resend throttle — one resend per 60 seconds per account, to
    // stop a stuck/looping frontend (or someone mashing the button) from
    // burning through Resend's free-tier send quota.
    if (user.emailVerificationSentAt && Date.now() - new Date(user.emailVerificationSentAt).getTime() < 60_000) {
      return NextResponse.json({ success: false, error: 'Please wait a moment before requesting another confirmation email.' }, { status: 429 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await db
      .update(users)
      .set({ emailVerificationToken: token, emailVerificationSentAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    const email = buildVerifyEmailReminder(user.name || user.email.split('@')[0], verifyUrl);

    const sent = await sendEmail({ to: user.email, ...email });

    if (!sent) {
      return NextResponse.json({ success: false, error: 'Could not send the confirmation email right now. Please try again shortly.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse('RVE', 'Resend verification error', error, 'Could not resend the confirmation email.');
  }
}
