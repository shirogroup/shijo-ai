import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, termsAcceptances } from '@/db/schema';
import { hashPassword, signToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, buildWelcomeEmail } from '@/lib/email';
import { consumeRateLimit, clientIpFrom, pruneRateLimits } from '@/lib/rate-limit';
import { isIpBlocked } from '@/lib/blocklist';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/legal';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

// Abuse-throttle ceilings for this endpoint. Set deliberately generous —
// the goal is to stop an abuse run, not to police normal traffic. Shared
// office/NAT IPs can legitimately produce several signups in an hour, so
// these sit well above any plausible human and well below what makes an
// abuse run worthwhile. No real user will ever see a 429 from these.
const REGISTER_IP_LIMIT = 10;
const REGISTER_IP_WINDOW_MS = 60 * 60 * 1000;          // 10 signups / hour / IP
const REGISTER_EMAIL_LIMIT = 3;
const REGISTER_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;  // 3 attempts / day / address

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
    const ip = clientIpFrom(req.headers);

    // ── Same-origin check. Invisible to real users. ──
    // Browsers send an Origin header on every fetch() POST, including
    // same-origin ones. A script POSTing this route directly usually sends
    // none, or someone else's. Rejecting that costs a legitimate user
    // nothing — no challenge, no extra field, no UI — while removing the
    // laziest way to drive this endpoint. Spoofable by a determined
    // attacker, which is why it is one layer of several rather than the
    // defence. Escape hatch: set ALLOW_MISSING_ORIGIN=1 in Vercel if a
    // legitimate non-browser client ever has to register.
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://www.shijo.ai',
      'https://shijo.ai',
    ].filter(Boolean) as string[];
    const originOk = origin
      ? allowedOrigins.includes(origin)
      : process.env.ALLOW_MISSING_ORIGIN === '1' || process.env.NODE_ENV !== 'production';

    if (!originOk) {
      console.warn('[REGISTER][BLOCKED] Bad or missing Origin. origin=%s ip=%s', origin || '(none)', ip);
      // Deliberately generic — don't tell an attacker which control tripped.
      return NextResponse.json({ error: 'Registration failed' }, { status: 403 });
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';

    // ── Admin-managed blocklist. Invisible to real users. ──
    // Checked before ANY work is done — no DB write, no email, no account.
    // Fails open if the table is missing or the DB is unreachable
    // (see lib/blocklist.ts). Supports IPv4 CIDR, because the 2026-08 abuse
    // ran from cloud ranges where single addresses rotate for free.
    const blocked = await isIpBlocked(ip);
    if (blocked.blocked) {
      console.warn('[REGISTER][BLOCKED_IP] ip=%s matched=%s', ip, blocked.matchedEntry);
      // Same deliberately generic response as the origin check — never tell
      // an attacker which control stopped them.
      return NextResponse.json({ error: 'Registration failed' }, { status: 403 });
    }

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

    // ── Abuse throttle. Invisible to real users. ──
    // Placed deliberately HERE — after every field validation and after the
    // duplicate-email check — so it counts only genuine new account
    // creations. Earlier in the flow it would burn a real person's quota on
    // their own typos (mismatched password, too-short password, an address
    // they already registered), which is exactly the friction this work is
    // meant to avoid. An abuse request, by contrast, IS a valid new
    // registration every time, so it still counts every one of them.
    //
    // Keyed on both IP and email: IP alone misses a distributed run, email
    // alone misses one attacker cycling through many addresses.
    //
    // Fails OPEN if the table is missing or the DB is unreachable — a
    // throttle must never be able to take signups down (see lib/rate-limit.ts).
    const ipThrottle = await consumeRateLimit(`register:ip:${ip}`, REGISTER_IP_LIMIT, REGISTER_IP_WINDOW_MS);
    const emailThrottle = await consumeRateLimit(
      `register:email:${email.toLowerCase()}`,
      REGISTER_EMAIL_LIMIT,
      REGISTER_EMAIL_WINDOW_MS
    );

    if (!ipThrottle.allowed || !emailThrottle.allowed) {
      console.warn('[REGISTER][THROTTLED] ip=%s email=%s', ip, email.toLowerCase());
      return NextResponse.json(
        { error: 'Too many sign-up attempts from this location. Please try again later.' },
        { status: 429 }
      );
    }

    // Opportunistic cleanup on ~1% of requests so the table stays small.
    if (Math.random() < 0.01) void pruneRateLimits();

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
      // Kept on the user row deliberately — see db/schema.ts. Purging abuse
      // accounts previously cascaded away every attacker IP (KB §44.5).
      signupIp: ip,
      signupUserAgent: userAgent,
      emailVerificationToken,
      emailVerificationSentAt: new Date(),
    }).returning();

    // Record Terms/Privacy acceptance — append-only audit row, captures
    // the exact document versions in effect and best-effort IP/UA.
    const ipAddress = ip;
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

    // Send ONE email — the merged welcome (account confirmation, real tool
    // list, terms/privacy acceptance record, soft email-verify CTA,
    // password-reset link, company footer).
    //
    // The second email — a plain terms-acceptance copy to legal@shijo.ai —
    // was REMOVED on 2026-08-22. It was never a legal or compliance
    // requirement: KB §13 records it as a prior session's suggestion,
    // explicitly flagged as needing confirmation, which never came. It also
    // never worked — every send to that address bounced or failed (KB
    // §38.3), so it doubled registration email volume, generated bounces
    // that damage sender reputation, and delivered nothing to anyone.
    //
    // The durable record of acceptance is the append-only `termsAcceptances`
    // row inserted above, surfaced in /admin/terms. That is stronger
    // evidence than an email: queryable, tied to the user id, and it
    // captures the user agent, which the email never did.
    //
    // Awaited rather than fire-and-forget — on Vercel's serverless runtime
    // an un-awaited promise can be cut off when the function returns its
    // response, before the fetch() to Resend ever goes out.
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
    const sent = await sendEmail({ to: email.toLowerCase(), ...welcomeEmail }).catch((err) => {
      console.error('[REGISTER] Failed to send welcome email:', err);
      return false;
    });

    if (sent) {
      console.log(`[REGISTER] Welcome email sent to ${email}`);
    }

    return response;
  } catch (error) {
    return serverErrorResponse('REG', 'Registration error', error, 'Could not create your account right now.');
  }
}
