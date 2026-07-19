import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    console.log('🔐 RESET PASSWORD REQUEST');

    // Find valid reset token
    const [resetRecord] = await db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          gt(passwordResets.expiresAt, new Date()),
          eq(passwordResets.used, false)
        )
      )
      .limit(1);

    if (!resetRecord) {
      console.log('❌ Invalid or expired token');
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('✅ Updating password for user:', resetRecord.userId);

    // Update user password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetRecord.userId));

    // Mark token as used
    await db
      .update(passwordResets)
      .set({
        used: true,
        usedAt: new Date(),
      })
      .where(eq(passwordResets.id, resetRecord.id));

    console.log('✅ Password reset successful');

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    return serverErrorResponse('RST', 'RESET PASSWORD ERROR', error, 'Could not reset your password right now.');
  }
}
