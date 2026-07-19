import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession, clearSession, verifyPassword } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { sendEmail, buildAccountDeletedEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

const LEGAL_RECORDS_CC = 'legal@shijo.ai';

// Self-service account deletion (GDPR Art. 17 "right to erasure" / CCPA
// deletion right). Requires the user to re-enter their current password —
// this is a destructive, irreversible action, not something a stolen
// session cookie alone should be able to trigger.
//
// Every table with a userId foreign key in db/schema.ts is declared with
// onDelete: 'cascade', so deleting the users row cascades through keywords,
// content, usage logs, subscriptions, terms acceptances, etc. in a single
// statement — there is no need to manually delete from each table first.
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { password, confirmation } = body as { password?: string; confirmation?: string };

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm.' },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Accounts created without a password (none currently, but the schema
    // allows a null passwordHash) can't pass this check — fail closed.
    if (!password || !user.passwordHash) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Cancel any active Stripe subscription immediately so the user is not
    // billed again after their account and data are gone.
    if (user.stripeCustomerId) {
      try {
        const stripe = getStripeClient();
        const activeSubs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
          limit: 10,
        });
        await Promise.all(
          activeSubs.data
            .filter((s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due')
            .map((s) => stripe.subscriptions.cancel(s.id))
        );
      } catch (stripeError) {
        // Don't block account deletion on a Stripe API hiccup — log it so
        // it can be caught manually, but the user's deletion request still
        // takes priority.
        console.error('Stripe cancellation during account deletion failed:', stripeError);
      }
    }

    const deletedAt = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' }) + ' UTC';
    const email = user.email;
    const name = user.name || 'there';

    // Delete the user row — cascades to every related table per the FK
    // constraints in db/schema.ts.
    await db.delete(users).where(eq(users.id, user.id));

    await clearSession();

    // Awaited (still independently caught, so an email failure never fails
    // this response — the account is already gone either way) rather than
    // fire-and-forget — see note in app/api/contact/route.ts on why
    // un-awaited sends can get cut off before reaching Resend on Vercel.
    const { subject, html } = buildAccountDeletedEmail(name, { email, deletedAt });
    await sendEmail({ to: email, cc: LEGAL_RECORDS_CC, subject, html }).catch((err) =>
      console.error('Account-deletion confirmation email failed:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse('DEL', 'Account deletion error', error, 'Could not delete your account right now.');
  }
}
