import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, termsAcceptances } from '@/db/schema';
import { hashPassword, signToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, buildWelcomeEmail, buildTermsAcceptedEmail } from '@/lib/email';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/legal';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Address that receives a copy of every Terms/Privacy acceptance email, as
// a durable record independent of the termsAcceptances table.
const LEGAL_RECORDS_CC = 'legal@shijo.ai';

// Same pattern used by app/api/contact/route.ts — kept in sync for
// consistent server-side email validation across the app.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── `name` validation (added 2026-08-22) ──────────────────────────────
//
// `name` previously had NO server-side validation at all, while email,
// password and terms-acceptance each had their own check. It was written
// straight to the users table AND interpolated into the welcome email's
// subject line, which let an attacker POST a victim's address with the
// name set to advertising copy and have SHIJO.AI deliver it — a spam
// relay running off our own verified sending domain. See SHIJO_AI_KB.md
// §38 and docs/security/email-injection-spam-relay-playbook.md.
//
// Deliberately a BLOCKLIST, not an allowlist: an allowlist of Latin
// letters would reject legitimate Arabic, Chinese, Cyrillic and Indic
// names. This rejects the things a real name never contains — markup,
// control characters, and URLs (the payload the attacker needs) — while
// leaving genuine international names alone.
const NAME_MAX_LENGTH = 60;
const NAME_BLOCKLIST = /(https?:\/\/|www\.|[<>]|[a-z0-9-]+\.(?:com|net|org|io|co|ly|me|ru|xyz|link|info|top|club|site|online|shop|app)(?:\/|\s|$))/i;
// eslint-disable-next-line no-control-regex
const NAME_CONTROL_CHARS = /[\u0000-\u001F\u007F]/;


export async function POST(req: NextRequest) {
  try {
    const { email, password, confirmPassword, name, acceptedTerms } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate `name` before it reaches the database or any email template.
    const safeName = typeof name === 'string' ? name.trim() : '';

    if (safeName.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Name is too long (${NAME_MAX_LENGTH} character maximum)` },
        { status: 400 }
      );
    }

    if (safeName && (NAME_BLOCKLIST.test(safeName) || NAME_CONTROL_CHARS.test(safeName))) {
      return NextResponse.json(
        { error: 'Please enter a valid name' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // RegisterForm.tsx already blocks submission on a client-side mismatch,
    // but that check is UI-only and trivially bypassed by calling this route
    // directly (e.g. via fetch/curl), so it must be re-verified server-side.
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
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

    // Soft email-verification token — same generation pattern as
    // app/api/auth/forgot-password/route.ts. Verifying is optional and
    // never blocks login or tool access (see lib/tools/usage.ts /
    // app/api/auth/[...]/route.ts — nothing checks emailVerified). It's
    // surfaced only as a dismissible-but-persistent notice in the
    // dashboard bell icon (components/dashboard/TopBar.tsx).
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name: safeName || null,
      planTier: 'free',
      emailVerificationToken,
      emailVerificationSentAt: new Date(),
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
        emailVerified: newUser.emailVerified,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Send ONE merged welcome email to the user (account confirmation +
    // real tool list + terms/privacy acceptance record + soft email-verify
    // CTA + password-reset link + company footer — see lib/email.ts for
    // why this replaced the previous two separate, thinner emails), and
    // keep a plain terms-acceptance record going to legal@ only, as a
    // durable compliance copy independent of the termsAcceptances table.
    // Awaited (via Promise.allSettled, each independently caught) rather
    // than true fire-and-forget — on Vercel's serverless runtime, un-awaited
    // promises can get cut off when the function returns its response,
    // before the email's fetch() call to Resend ever actually goes out.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shijo.ai';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}`;

    const welcomeEmail = buildWelcomeEmail(safeName || email.split('@')[0], {
      terms: {
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        acceptedAt: acceptedAt.toISOString(),
        ipAddress,
      },
      verifyUrl,
    });
    const acceptanceEmail = buildTermsAcceptedEmail(safeName || email.split('@')[0], {
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      acceptedAt: acceptedAt.toISOString(),
      ipAddress,
    });

    await Promise.allSettled([
      sendEmail({ to: email.toLowerCase(), ...welcomeEmail }).then((sent) => {
        if (sent) {
          console.log(`[REGISTER] Welcome email sent to ${email}`);
        }
      }).catch((err) => {
        console.error(`[REGISTER] Failed to send welcome email:`, err);
      }),
      sendEmail({ to: LEGAL_RECORDS_CC, ...acceptanceEmail }).then((sent) => {
        if (sent) {
          console.log(`[REGISTER] Terms acceptance record sent to ${LEGAL_RECORDS_CC} for ${email}`);
        }
      }).catch((err) => {
        console.error(`[REGISTER] Failed to send terms acceptance record:`, err);
      }),
    ]);

    return response;
  } catch (error) {
    return serverErrorResponse('REG', 'Registration error', error, 'Could not create your account right now.');
  }
}
