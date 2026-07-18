import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, termsAcceptances } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

// Admin-only endpoint. Deliberately re-checks isAdmin against the database
// on every request rather than trusting anything in the JWT — the JWT
// payload is only decoded (not signature-verified) by middleware.ts on the
// Edge runtime, so admin status must never be sourced from the token itself.
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

    const acceptances = await db.query.termsAcceptances.findMany({
      orderBy: [desc(termsAcceptances.acceptedAt)],
      limit: 500,
    });

    return NextResponse.json({ acceptances });
  } catch (error) {
    console.error('Admin terms-acceptances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
