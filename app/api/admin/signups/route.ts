import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, blockedIps } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { count, desc, eq, gte, isNotNull, max, min, sql } from 'drizzle-orm';
import { serverErrorResponse } from '@/lib/api/errors';
import { ipMatches } from '@/lib/blocklist';

export const runtime = 'nodejs';

/**
 * Admin signups review — built 2026-08-22 after 373,147 spam-registered
 * accounts were purged and the attacker trail was lost with them
 * (SHIJO_AI_KB.md §44). Purpose: see an abuse run FORMING, not months later.
 *
 * Every handler re-checks `isAdmin` against the database rather than trusting
 * the JWT, matching app/api/admin/users/route.ts and the standing rule from
 * §3/§13 — Edge middleware decodes the token without verifying its signature,
 * so admin status must never be sourced from it.
 */

const SIGNUP_WINDOW_DAYS = 30;
const MAX_ROWS = 500;

/** Same shape as the register route's NAME_BLOCKLIST, plus emoji. */
const SUSPICIOUS_NAME =
  /(https?:\/\/|www\.|[<>]|[a-z0-9-]+\.(?:com|net|org|io|co|ly|me|ru|xyz|link|info|top|club|site|online|shop|app)(?:\/|\s|$))/i;
const EMOJI_HEAVY = /[\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u2728]|[\uD800-\uDBFF][\uDC00-\uDFFF]/;

/** Accounts sharing one IP above this are worth a look. */
const IP_CLUSTER_FLAG = 3;

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const requester = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!requester || !requester.isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { requester };
}

export async function GET() {
  try {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const since = new Date(Date.now() - SIGNUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [recent, clusters, blocklist] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          planTier: users.planTier,
          emailVerified: users.emailVerified,
          signupIp: users.signupIp,
          signupUserAgent: users.signupUserAgent,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(gte(users.createdAt, since))
        .orderBy(desc(users.createdAt))
        .limit(MAX_ROWS),

      // Accounts grouped by signup IP across ALL time — an abuse run shows up
      // here as one address with an implausible account count.
      db
        .select({
          signupIp: users.signupIp,
          accounts: count(users.id),
          firstSeen: min(users.createdAt),
          lastSeen: max(users.createdAt),
        })
        .from(users)
        .where(isNotNull(users.signupIp))
        .groupBy(users.signupIp)
        .having(sql`count(${users.id}) >= ${IP_CLUSTER_FLAG}`)
        .orderBy(desc(count(users.id)))
        .limit(50),

      db.select().from(blockedIps).orderBy(desc(blockedIps.createdAt)),
    ]);

    const blockedValues = blocklist.map((b) => b.ipAddress);
    const isBlocked = (ip: string | null) =>
      !!ip && blockedValues.some((entry) => ipMatches(ip, entry));

    const enriched = recent.map((u) => {
      const reasons: string[] = [];
      if (u.name && SUSPICIOUS_NAME.test(u.name)) reasons.push('name contains a URL or markup');
      if (u.name && EMOJI_HEAVY.test(u.name)) reasons.push('name contains emoji');
      if (!u.signupIp) reasons.push('no signup IP recorded (pre-2026-08-22 account)');
      const cluster = clusters.find((c) => c.signupIp && c.signupIp === u.signupIp);
      if (cluster && cluster.accounts >= IP_CLUSTER_FLAG) {
        reasons.push(`${cluster.accounts} accounts share this IP`);
      }
      return { ...u, suspicious: reasons.length > 0, reasons, blocked: isBlocked(u.signupIp) };
    });

    return NextResponse.json({
      signups: enriched,
      clusters: clusters.map((c) => ({ ...c, blocked: isBlocked(c.signupIp) })),
      blocklist,
      summary: {
        windowDays: SIGNUP_WINDOW_DAYS,
        totalInWindow: enriched.length,
        suspiciousInWindow: enriched.filter((u) => u.suspicious).length,
        distinctIps: new Set(enriched.map((u) => u.signupIp).filter(Boolean)).size,
        blockedEntries: blocklist.length,
        truncated: enriched.length >= MAX_ROWS,
      },
    });
  } catch (error) {
    return serverErrorResponse('ASG', 'Admin signups list error', error, 'Could not load signups.');
  }
}

/** Add an address or IPv4 CIDR to the blocklist. */
export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const body = await req.json().catch(() => ({}));
    const ipAddress = typeof body.ipAddress === 'string' ? body.ipAddress.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null;

    if (!ipAddress || ipAddress.length > 64) {
      return NextResponse.json({ error: 'Enter an IP address or CIDR range.' }, { status: 400 });
    }
    // Cheap shape check — an address, or an address with a prefix length.
    if (!/^[0-9a-fA-F:.]+(\/\d{1,3})?$/.test(ipAddress)) {
      return NextResponse.json({ error: 'That is not a valid IP address or CIDR range.' }, { status: 400 });
    }

    // Guard against locking the admin out of their own product.
    const selfIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';
    if (selfIp && ipMatches(selfIp, ipAddress)) {
      return NextResponse.json(
        { error: 'That range covers your own current IP address. Blocking it would lock you out.' },
        { status: 400 }
      );
    }

    await db
      .insert(blockedIps)
      .values({ ipAddress, reason, createdBy: gate.requester!.id })
      .onConflictDoNothing();

    console.warn('[ADMIN][BLOCKLIST] %s added %s (%s)', gate.requester!.email, ipAddress, reason || 'no reason given');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse('ASB', 'Admin blocklist add error', error, 'Could not add that entry.');
  }
}

/** Remove an entry from the blocklist. */
export async function DELETE(req: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (gate.error) return gate.error;

    const ipAddress = req.nextUrl.searchParams.get('ipAddress')?.trim();
    if (!ipAddress) {
      return NextResponse.json({ error: 'Missing ipAddress.' }, { status: 400 });
    }

    await db.delete(blockedIps).where(eq(blockedIps.ipAddress, ipAddress));
    console.warn('[ADMIN][BLOCKLIST] %s removed %s', gate.requester!.email, ipAddress);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse('ASU', 'Admin blocklist remove error', error, 'Could not remove that entry.');
  }
}
