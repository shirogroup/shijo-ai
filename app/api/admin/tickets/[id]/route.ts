import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, supportTickets } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { sendEmail, buildTicketResolvedEmail } from '@/lib/email';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const VALID_STATUSES = ['open', 'in_progress', 'resolved'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });
    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, adminNotes } = body as { status?: string; adminNotes?: string };

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const wasResolved = existing.status === 'resolved';
    const isNowResolved = status === 'resolved';

    const [updated] = await db
      .update(supportTickets)
      .set({
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt: new Date(),
        ...(isNowResolved && !wasResolved ? { resolvedAt: new Date() } : {}),
      })
      .where(eq(supportTickets.id, id))
      .returning();

    // Only notify the submitter the moment a ticket transitions INTO
    // resolved — not on every subsequent edit — so they don't get spammed
    // if an admin tweaks notes after the fact.
    if (isNowResolved && !wasResolved) {
      const { subject, html } = buildTicketResolvedEmail(updated.name, {
        subject: updated.subject,
        adminNotes: updated.adminNotes,
      });
      // Awaited rather than fire-and-forget — see note in
      // app/api/contact/route.ts on why un-awaited sends can get cut off
      // before reaching Resend on Vercel.
      await sendEmail({ to: updated.email, subject, html }).catch((err) =>
        console.error('Ticket-resolved email failed:', err)
      );
    }

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('Admin ticket update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
