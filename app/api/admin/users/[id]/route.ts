import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Admin-only: toggle a user's isAdmin flag. Nothing else about the account
// is editable here — this is deliberately narrow in scope.
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
    const { isAdmin } = body as { isAdmin?: boolean };

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin (boolean) is required' }, { status: 400 });
    }

    // Don't let an admin revoke their own access from this panel and get
    // locked out of it.
    if (id === requester.id && isAdmin === false) {
      return NextResponse.json(
        { error: "You can't revoke your own admin access from here." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: { id: updated.id, email: updated.email, name: updated.name, isAdmin: updated.isAdmin },
    });
  } catch (error) {
    return serverErrorResponse('ADU2', 'Admin user update error', error, 'Could not update this user.');
  }
}
