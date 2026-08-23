import { db } from '@/db';
import { blockedIps } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Admin-managed signup blocklist.
 *
 * Added 2026-08-22 after 373,147 spam-registered accounts were purged
 * (SHIJO_AI_KB.md §44). Lives in the database rather than Vercel's firewall
 * because the Hobby plan allows only 3 custom firewall rules and one is
 * already spent on the /api/auth/register rate limit (§41.1) — a list that
 * grows over time cannot live there.
 *
 * ── Fails OPEN, deliberately ──
 * If the table is missing or the database is briefly unreachable, signups
 * continue. Same reasoning as lib/rate-limit.ts: this is one layer among
 * several (constant email subject, name validation, same-origin check,
 * Vercel WAF rate limit, signup throttle), and none of them is allowed to
 * take registration down on its own.
 *
 * ── Supports CIDR ──
 * Abuse runs from cloud ranges (the 2026-08 incident came from Azure), where
 * individual addresses rotate for free. Blocking `20.151.0.0/16` is worth far
 * more than blocking one address. IPv4 CIDR is matched properly; IPv6 entries
 * are matched exactly, which is documented rather than silently wrong.
 */

function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v < 0 || v > 255) return null;
    n = ((n << 8) | v) >>> 0;
  }
  return n >>> 0;
}

/** True when `ip` falls inside `entry`, which may be an address or an IPv4 CIDR. */
export function ipMatches(ip: string, entry: string): boolean {
  const candidate = ip.trim();
  const rule = entry.trim();
  if (!candidate || !rule) return false;

  // Exact match covers both plain IPv4 and any IPv6 entry.
  if (candidate.toLowerCase() === rule.toLowerCase()) return true;

  if (!rule.includes('/')) return false;

  const [range, bitsRaw] = rule.split('/');
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const a = ipv4ToInt(candidate);
  const b = ipv4ToInt(range);
  if (a === null || b === null) return false;

  if (bits === 0) return true;
  const mask = (~0 << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}

export interface BlocklistResult {
  blocked: boolean;
  /** The blocklist entry that matched, for logging. */
  matchedEntry?: string;
  /** True when the check could not run and the request was allowed by default. */
  degraded: boolean;
}

export async function isIpBlocked(ip: string): Promise<BlocklistResult> {
  if (!ip || ip === 'unknown') return { blocked: false, degraded: false };

  try {
    // The table is expected to hold tens of entries, not thousands, so a
    // full read is cheaper and simpler than pushing CIDR logic into SQL.
    const entries = await db
      .select({ ipAddress: blockedIps.ipAddress })
      .from(blockedIps);

    const hit = entries.find((e) => ipMatches(ip, e.ipAddress));
    if (!hit) return { blocked: false, degraded: false };

    // Record the hit so the admin panel can show which rules are earning
    // their place. Never allowed to fail the request.
    void db
      .update(blockedIps)
      .set({ lastHitAt: new Date(), hitCount: sql`${blockedIps.hitCount} + 1` })
      .where(eq(blockedIps.ipAddress, hit.ipAddress))
      .catch(() => {});

    return { blocked: true, matchedEntry: hit.ipAddress, degraded: false };
  } catch (err) {
    console.error('[BLOCKLIST][DEGRADED] Check failed, allowing request. ip=%s', ip, err);
    return { blocked: false, degraded: true };
  }
}
