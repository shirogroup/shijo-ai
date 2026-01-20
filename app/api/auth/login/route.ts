import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, setSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('[LOGIN API] Request received');
    
    const body = await req.json();
    console.log('[LOGIN API] Email:', body.email);

    const { email, password } = body;

    // Validation
    if (!email || !password) {
      console.log('[LOGIN API] Missing credentials');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('[LOGIN API] Looking up user:', email.toLowerCase());
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      console.log('[LOGIN API] User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      console.log('[LOGIN API] User has no password (OAuth only?)');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[LOGIN API] Verifying password');
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      console.log('[LOGIN API] Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[LOGIN API] Password valid, setting session');
    
    // Set session
    await setSession({
      userId: user.id,
      email: user.email,
    });

    console.log('[LOGIN API] Login successful for:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: user.planTier,
      },
    });
  } catch (error) {
    console.error('[LOGIN API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
