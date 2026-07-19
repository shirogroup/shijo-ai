import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { sendEmail, buildTicketNotificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

// Internal notification inbox — same one the public Contact form uses
// (see app/api/contact/route.ts) so both funnel into the same monitored
// mailbox and the same admin Tickets queue.
const SUPPORT_INBOX = 'info@shiroapps.com';

// Lightweight "Request a feature" submission from the dashboard bell menu
// (registered/logged-in users only). Deliberately skips the captcha and
// name/email fields the public Contact form requires — the user is already
// authenticated, so we pull name/email from their account instead of
// asking them to retype it. Lands in the same support_tickets table with
// reason='feature_request', so it shows up in /admin/tickets like any
// other ticket.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to submit feedback.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { message } = body as { message?: string };

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Enter your feature request before submitting.' },
        { status: 400 }
      );
    }
    if (message.trim().length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message is too long (2000 character max).' },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: session.userId,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        subject: 'Feature request (from dashboard)',
        message: message.trim(),
        reason: 'feature_request',
      })
      .returning();

    const notification = buildTicketNotificationEmail({
      name: user.name || user.email.split('@')[0],
      email: user.email,
      subject: 'Feature request (from dashboard)',
      message: message.trim(),
      ticketId: ticket.id,
      reasonLabel: 'Feature Request',
    });

    await sendEmail({
      to: SUPPORT_INBOX,
      subject: notification.subject,
      html: notification.html,
    }).catch((err) => console.error('Dashboard feedback notification email failed:', err));

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error) {
    console.error('Dashboard feedback submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not submit your feedback right now. Please try again.' },
      { status: 500 }
    );
  }
}
