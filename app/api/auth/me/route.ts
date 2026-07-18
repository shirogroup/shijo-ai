import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with quota
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Legacy per-feature quota system retired — usage is tracked via
    // lib/tools/usage.ts (see /api/usage) instead.
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: user.planTier,
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      quota: null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
