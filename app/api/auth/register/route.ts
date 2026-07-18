import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, termsAcceptances } from '@/db/schema';
import { hashPassword, signToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sendEmail, buildWelcomeEmail, buildTermsAcceptedEmail } from '@/lib/email';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/legal';

export const runtime = 'nodejs';

// Address that receives a copy of every Terms/Privacy acceptance email, as
// a durable record independent of the termsAcceptances table.
const LEGAL_RECORDS_CC = 'legal@shijo.ai';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, acceptedTerms } = await req.json();

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

    // Terms/Privacy acceptance is mandatory — must be an explicit true,
    // not just truthy, and not inferred from account creation alone.
    if (acceptedTerms !== true) {
      return NextResponse.json(
        { error: 'You must agree to the Terms of Service and Privacy Policy to create an account' },
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

    // Record Terms/Privacy acceptance — append-only audit row, captures
    // the exact document versions in effect and best-effort IP/UA.
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown');
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const acceptedAt = new Date();

    await db.insert(termsAcceptances).values({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      ipAddress,
      userAgent,
      acceptedAt,
    });

    // Create JWT token
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Build response and set cookie DIRECTLY on it
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        planTier: newUser.planTier,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Send welcome email (fire and forget — don't block registration)
    const welcomeEmail = buildWelcomeEmail(name || email.split('@')[0]);
    sendEmail({ to: email.toLowerCase(), ...welcomeEmail }).then((sent) => {
      if (sent) {
        console.log(`[REGISTER] Welcome email sent to ${email}`);
      }
    }).catch((err) => {
      console.error(`[REGISTER] Failed to send welcome email:`, err);
    });

    // Send Terms/Privacy acceptance confirmation, CC'd to legal records
    // (fire and forget — don't block registration)
    const acceptanceEmail = buildTermsAcceptedEmail(name || email.split('@')[0], {
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      acceptedAt: acceptedAt.toISOString(),
      ipAddress,
    });
    sendEmail({ to: email.toLowerCase(), cc: LEGAL_RECORDS_CC, ...acceptanceEmail }).then((sent) => {
      if (sent) {
        console.log(`[REGISTER] Terms acceptance email sent to ${email} (cc ${LEGAL_RECORDS_CC})`);
      }
    }).catch((err) => {
      console.error(`[REGISTER] Failed to send terms acceptance email:`, err);
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
