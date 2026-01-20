import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔑 FORGOT PASSWORD REQUEST:', { email });

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('❌ User not found, but returning success');
      return NextResponse.json({
        message: 'If an account exists, a reset link has been sent',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    console.log('🔐 Generated reset token:', { userId: user.id, expiresAt });

    // Store reset token in database
    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // TODO: Send email with reset link
    // For now, we'll just log the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log('📧 PASSWORD RESET URL:', resetUrl);
    console.log('⚠️  EMAIL SENDING NOT IMPLEMENTED - Use this URL to reset password');

    return NextResponse.json({
      message: 'If an account exists, a reset link has been sent',
      // In development, include the reset URL
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (error) {
    console.error('❌ FORGOT PASSWORD ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
