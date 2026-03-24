import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, buildPasswordResetEmail } from '@/lib/email';

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

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a reset link has been sent',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Build and send reset email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const resetEmail = buildPasswordResetEmail(user.name || email.split('@')[0], resetUrl);

    sendEmail({ to: email.toLowerCase(), ...resetEmail }).then((sent) => {
      if (sent) {
        console.log(`[FORGOT-PASSWORD] Reset email sent to ${email}`);
      } else {
        console.error(`[FORGOT-PASSWORD] Failed to send reset email to ${email}`);
      }
    }).catch((err) => {
      console.error(`[FORGOT-PASSWORD] Email send error:`, err);
    });

    return NextResponse.json({
      message: 'If an account exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('[FORGOT-PASSWORD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
