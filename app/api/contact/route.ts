import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supportTickets } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { verifyCaptcha } from '@/lib/captcha';
import { sendEmail, buildTicketReceivedEmail, buildTicketNotificationEmail } from '@/lib/email';
import { REASON_OPTIONS, VALID_REASONS } from '@/lib/contactReasons';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Internal notification inbox for Contact-form submissions — explicitly
// set to the team's actual monitored mailbox per user request (2026-07-18),
// separate from the info@shijo.ai address shown publicly on the Contact
// page and separate from legal@shijo.ai (used for ToS/privacy/legal
// records elsewhere in lib/email.ts).
const SUPPORT_INBOX = 'info@shiroapps.com';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, subject, message, reason, captchaToken, captchaAnswer } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      reason?: string;
      captchaToken?: string;
      captchaAnswer?: string | number;
    };

    // Was a flat "All fields are required." for any missing field — including
    // when the caller HAD supplied name, email and message and only the subject
    // was absent, which reads as though the form is broken. /api/generate
    // already names its missing fields; this now matches.
    const missingFields = [
      !name?.trim() && 'Name',
      !email?.trim() && 'Email',
      !subject?.trim() && 'Subject',
      !message?.trim() && 'Message',
    ].filter(Boolean) as string[];

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Please fill in: ${missingFields.join(', ')}`, missingFields },
        { status: 400 }
      );
    }
    const safeReason = reason && VALID_REASONS.has(reason as any) ? reason : 'general';
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
        reason: safeReason,
      })
      .returning();

    // Await both emails (each independently caught) before returning —
    // a slow/failed email provider still won't fail the ticket submission
    // itself (the ticket is already saved above), but on Vercel's
    // serverless runtime, un-awaited "fire and forget" promises can get cut
    // off when the function's response is sent, before the email's fetch()
    // call ever reaches Resend. Awaiting here guarantees the send is
    // actually attempted before the function ends.
    const reasonLabel = REASON_OPTIONS.find((r) => r.value === safeReason)?.label ?? 'General Question';

    const confirmation = buildTicketReceivedEmail(name.trim(), {
      subject: subject.trim(),
      message: message.trim(),
      ticketId: ticket.id,
      reasonLabel,
    });
    const notification = buildTicketNotificationEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ticketId: ticket.id,
      reasonLabel,
    });

    await Promise.allSettled([
      sendEmail({ to: email.trim(), subject: confirmation.subject, html: confirmation.html }).catch((err) =>
        console.error('Contact confirmation email failed:', err)
      ),
      sendEmail({ to: SUPPORT_INBOX, subject: notification.subject, html: notification.html }).catch((err) =>
        console.error('Contact internal notification email failed:', err)
      ),
    ]);

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error) {
    return serverErrorResponse('CTC', 'Contact form submission error', error, 'Your message could not be sent right now.');
  }
}
