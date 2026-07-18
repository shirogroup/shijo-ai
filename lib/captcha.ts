import crypto from 'crypto';

/**
 * Self-hosted, stateless math CAPTCHA — no third-party service, no API
 * keys, no server-side session storage. The challenge (two numbers) and its
 * expiry are HMAC-signed with our own secret and handed back to the client
 * as an opaque token; verifying an answer just means re-computing the HMAC
 * and checking it matches, so any server instance can verify a token
 * without needing to have been the one that issued it.
 *
 * This is meant to stop unsophisticated bot/form-spam traffic on the
 * Contact page, not to stand up to a targeted attacker — that's an
 * intentional, proportionate tradeoff for a "simple captcha for now."
 */

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is not set. This is required in production.');
    }
    return 'dev-only-secret-change-in-production';
  }
  return secret;
}

const CAPTCHA_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function generateCaptcha(): { question: string; token: string } {
  const a = Math.floor(Math.random() * 9) + 1; // 1-9
  const b = Math.floor(Math.random() * 9) + 1; // 1-9
  const exp = Date.now() + CAPTCHA_TTL_MS;
  const payload = `${a}:${b}:${exp}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${sig}`, 'utf-8').toString('base64url');
  return { question: `${a} + ${b}`, token };
}

export function verifyCaptcha(token: string, answer: string | number): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;
    const [aStr, bStr, expStr, sig] = parts;

    const payload = `${aStr}:${bStr}:${expStr}`;
    const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

    // Constant-time comparison to avoid a timing side-channel on the HMAC check.
    const sigBuf = Buffer.from(sig, 'utf-8');
    const expectedBuf = Buffer.from(expectedSig, 'utf-8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const exp = parseInt(expStr, 10);
    if (Number.isNaN(exp) || Date.now() > exp) return false;

    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    const submitted = parseInt(String(answer), 10);
    if (Number.isNaN(submitted)) return false;

    return submitted === a + b;
  } catch {
    return false;
  }
}
