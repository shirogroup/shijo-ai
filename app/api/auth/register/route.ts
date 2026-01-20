import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userQuotas } from '@/db/schema';
import { hashPassword, setSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      planTier: 'free',
    }).returning();

    // Initialize user quota (free plan defaults)
    await db.insert(userQuotas).values({
      userId: newUser.id,
      planTier: 'free',
      billingCycleStart: new Date().toISOString().split('T')[0],
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seedKeywordsQuota: 10000,
      expansionsQuota: 3,
      clusteringQuota: 0,
      briefsQuota: 0,
      auditsQuota: 0,
      metaGenQuota: 1000,
      aeoQuota: 0,
      searchVolumeQuota: 0,
      serpSnapshotsQuota: 0,
      aiVisibilityScansQuota: 0,
      aiSimulatorQuota: 0,
      predictiveSeoQuota: 0,
    });

    // Set session
    await setSession({
      userId: newUser.id,
      email: newUser.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        planTier: newUser.planTier,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
