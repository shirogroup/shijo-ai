import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supportTickets } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { verifyCaptcha } from '@/lib/captcha';
import { sendEmail, buildTicketReceivedEmail, buildTicketNotificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

// Shared inbox for now — same address used for terms-acceptance and
// account-deletion records (see lib/email.ts). Point this at a dedicated
// support@ alias once one exists.
const SUPPORT_INBOX = 'legal@shijo.ai';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, subject, message, captchaToken, captchaAnswer } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      captchaToken?: string;
      captchaAnswer?: string | number;
    };

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'Message is too long (5000 character max).' }, { status: 400 });
    }
    if (!captchaToken || captchaAnswer === undefined || captchaAnswer === null || !verifyCaptcha(captchaToken, captchaAnswer)) {
      return NextResponse.json({ error: 'Captcha answer is incorrect or expired. Please try again.' }, { status: 400 });
    }

    // Attribute the ticket to a logged-in user if there is one, but the
    // form works for anonymous/logged-out visitors too — auth is optional.
    const session = await getSession();

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: session?.userId ?? null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })
      .returning();

    // Fire-and-forget both emails — a slow/failed email provider shouldn't
    // fail the ticket submission itself, the ticket is already saved.
    const confirmation = buildTicketReceivedEmail(name.trim(), {
      subject: subject.trim(),
      message: message.trim(),
      ticketId: ticket.id,
    });
    sendEmail({ to: email.trim(), subject: confirmation.subject, html: confirmation.html }).catch((err) =>
      console.error('Contact confirmation email failed:', err)
    );

    const notification = buildTicketNotificationEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ticketId: ticket.id,
    });
    sendEmail({ to: SUPPORT_INBOX, subject: notification.subject, html: notification.html }).catch((err) =>
      console.error('Contact internal notification email failed:', err)
    );

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
