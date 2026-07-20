import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { sendEmail, buildTicketNotificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

// Internal notification inbox — same one the public Contact form and the
// dashboard "Request a feature" box use (see app/api/contact/route.ts,
// app/api/dashboard/feedback/route.ts).
const SUPPORT_INBOX = 'info@shiroapps.com';

// Marker used both to tag the ticket and to detect a duplicate signup below.
const WAITLIST_SUBJECT = 'AI Visibility / GEO Tracking — waitlist signup';

// One-click "Notify me" from the AI Visibility "coming soon" page
// (registered/logged-in users only — this is not a public form, so no
// captcha/name/email fields, same reasoning as the feedback route). Lands
// in support_tickets with reason='feature_request' so it shows up in
// /admin/tickets alongside every other ticket. This is a demand-signal
// waitlist only — nothing about pricing, timeline, or which build option
// (A vs B, per docs/product/2026-07-19-AI-Visibility-Tracking-Scoping.docx)
// is implied or promised anywhere in this flow.
export async function POST(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to join the waitlist.' },
        { status: 401 }
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

    // Dedupe — don't create a second ticket if this user already signed up.
    const existing = await db.query.supportTickets.findFirst({
      where: and(
        eq(supportTickets.userId, session.userId),
        eq(supportTickets.subject, WAITLIST_SUBJECT)
      ),
    });
    if (existing) {
      return NextResponse.json({ success: true, alreadyJoined: true });
    }

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: session.userId,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        subject: WAITLIST_SUBJECT,
        message: 'User asked to be notified when AI Visibility / GEO Tracking launches (submitted from the dashboard "coming soon" page — no message body, one-click signup).',
        reason: 'feature_request',
      })
      .returning();

    const notification = buildTicketNotificationEmail({
      name: user.name || user.email.split('@')[0],
      email: user.email,
      subject: WAITLIST_SUBJECT,
      message: 'One-click waitlist signup from the dashboard.',
      ticketId: ticket.id,
      reasonLabel: 'Feature Request — AI Visibility Waitlist',
    });

    await sendEmail({
      to: SUPPORT_INBOX,
      subject: notification.subject,
      html: notification.html,
    }).catch((err) => console.error('AI visibility waitlist notification email failed:', err));

    return NextResponse.json({ success: true, alreadyJoined: false });
  } catch (error) {
    console.error('AI visibility waitlist signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not join the waitlist right now. Please try again.' },
      { status: 500 }
    );
  }
}
