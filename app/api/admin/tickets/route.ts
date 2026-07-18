import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, supportTickets } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

// Admin-only endpoint — same pattern as /api/admin/terms-acceptances:
// re-checks isAdmin against the database on every request rather than
// trusting the JWT, since middleware.ts only decodes (doesn't verify) the
// token on the Edge runtime.
export async function GET(req: NextRequest) {
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

    const tickets = await db.query.supportTickets.findMany({
      orderBy: [desc(supportTickets.createdAt)],
      limit: 500,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Admin tickets list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
