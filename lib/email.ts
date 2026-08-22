/**
 * Email service using Resend
 *
 * Setup: npm install resend
 * Env: RESEND_API_KEY=re_xxxxx
 *
 * Plan (verified in the Resend dashboard 2026-08-22): Free — 3,000 emails/month,
 * 100/day, and a 10 req/s API rate limit. The rate limit is a separate,
 * per-second ceiling: bursting past it returns 429 without touching the quota.
 * Sign up at https://resend.com and add your API key to Vercel env vars.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'SHIJO.AI <noreply@shijo.ai>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
}

export async function sendEmail({ to, subject, html, cc }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY not set — skipping email send');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Send failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[EMAIL] Send error:', error);
    return false;
  }
}

// ─── Input-safety helpers ───────────────────────────────────────
//
// Added 2026-08-22 after /api/auth/register was found being used as a spam
// relay. An attacker POSTed a victim's address with the `name` field set to
// advertising copy; buildWelcomeEmail interpolated that name straight into
// the SUBJECT line, so the advert went out from a verified, DKIM-signed,
// SPF-passing shijo.ai. See SHIJO_AI_KB.md §38 and
// docs/security/email-injection-spam-relay-playbook.md.
//
// Two rules now apply to every template in this file:
//   1. Never put attacker-controllable free text into a subject line.
//   2. HTML-escape every user-supplied value before it enters a template.

export function escapeHtml(value: unknown): string {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// For the few subjects that legitimately need user text — support tickets,
// which are captcha-gated (see app/api/contact/route.ts) and whose subject
// the team needs in order to triage. Strips anything that could forge a
// mail header or carry a payload, and caps the length. NOT a substitute for
// rule 1: the registration/welcome path takes no user text in its subject.
export function sanitizeSubject(value: unknown, maxLength: number = 120): string {
  return String(value == null ? '' : value)
    .replace(/[\r\n\t]+/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

// ─── Welcome email with tool showcase ─────────────────────────────────
//
// This is the ONLY email sent at registration as of 2026-07-19 — it used
// to be two separate emails (a welcome email + a bare "Terms Accepted"
// legal notice). Merged into one so a new user gets a single, complete,
// good-looking message: account confirmation, the real tool list, the
// terms/privacy acceptance record, a soft (non-blocking) email-confirm
// link, a password-reset link, and a company/support signature.
//
// The `terms` and `verifyUrl` params are optional so this function still
// works for any future caller that only wants the plain welcome content —
// but app/api/auth/register/route.ts always passes both.

export function buildWelcomeEmail(
  name: string,
  opts?: {
    terms?: { termsVersion: string; privacyVersion: string; acceptedAt: string; ipAddress: string };
    verifyUrl?: string;
  }
): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');

  // Kept in sync by hand with lib/tools/registry.ts — this is the real,
  // live tool list (12 tools, 4 categories). A previous version of this
  // email listed 24 fabricated tool names that never existed in the
  // product; fixed 2026-07-19. If tools are added/removed in the
  // registry, update this list too.
  const tools = [
    { category: 'Social Media', color: '#db2777', items: [
      { name: 'Post Caption Generator', free: true },
    ]},
    { category: 'SEO', color: '#2563eb', items: [
      { name: 'SEO Meta Generator', free: true },
      { name: 'Keyword Research', free: false },
      { name: 'SEO Content Brief', free: false },
      { name: 'FAQ Generator', free: false },
      { name: 'AI Overview Optimizer', free: false },
    ]},
    { category: 'Ads & Copy', color: '#ea580c', items: [
      { name: 'Ad Copy Generator', free: false },
      { name: 'Ad Headline A/B Tester', free: false },
      { name: 'Audience Targeting Profiles', free: false },
      { name: 'Landing Page Copy Generator', free: false },
    ]},
    { category: 'Email', color: '#16a34a', items: [
      { name: 'Email Sequence Generator', free: false },
      { name: 'Newsletter Generator', free: false },
    ]},
  ];

  const toolSections = tools.map(cat => {
    const items = cat.items.map(t =>
      `<tr>
        <td style="padding: 6px 12px; font-size: 14px; color: #374151;">${t.name}</td>
        <td style="padding: 6px 12px; font-size: 12px; text-align: right;">
          ${t.free
            ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-weight: 600;">FREE</span>'
            : '<span style="color: #9ca3af;">Pro</span>'
          }
        </td>
      </tr>`
    ).join('');

    return `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: ${cat.color}; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">${cat.category}</h3>
        <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden;">
          ${items}
        </table>
      </div>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <!-- Card -->
    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <h2 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Welcome, ${firstName}!</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Your account is ready. You have access to <strong style="color: #111827;">2 free AI tools</strong> with 3 generations per day — no credit card needed.</p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://shijo.ai/dashboard/tools" style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Start Using Your Free Tools</a>
      </div>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <!-- Tool Showcase -->
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">Your 12 AI Marketing Tools</h2>
      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px 0;">Tools marked FREE are available on your plan right now</p>

      ${toolSections}

      <!-- Upgrade CTA -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin-top: 32px;">
        <p style="font-size: 14px; color: #991b1b; margin: 0 0 12px 0; font-weight: 600;">Unlock all 12 tools for just $29/month</p>
        <a href="https://shijo.ai/dashboard/billing" style="display: inline-block; background: #111827; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View Plans</a>
      </div>

      ${opts?.verifyUrl ? `
      <!-- Confirm email (soft, optional — never blocks access) -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin-top: 16px;">
        <p style="font-size: 14px; color: #1e40af; margin: 0 0 12px 0; font-weight: 600;">One last thing — confirm your email address</p>
        <p style="font-size: 13px; color: #3b82f6; margin: 0 0 12px 0;">This just helps us keep your account secure. You can keep using SHIJO.AI right away either way.</p>
        <a href="${opts.verifyUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Confirm Email Address</a>
      </div>
      ` : ''}

      <!-- Account & terms record -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px 0;" />
      <h3 style="font-size: 13px; font-weight: 700; color: #6b7280; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</h3>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px 20px;">
        <p style="font-size: 13px; color: #374151; margin: 0 0 6px 0;">Your account was created just now with plan <strong>Free</strong>.</p>
        ${opts?.terms ? `
        <p style="font-size: 13px; color: #374151; margin: 0 0 6px 0;">You accepted the <a href="https://shijo.ai/terms" style="color: #CC0000;">Terms of Service</a> (v${escapeHtml(opts.terms.termsVersion)}) and <a href="https://shijo.ai/privacy" style="color: #CC0000;">Privacy Policy</a> (v${escapeHtml(opts.terms.privacyVersion)}) at ${escapeHtml(opts.terms.acceptedAt)} from IP ${escapeHtml(opts.terms.ipAddress)}.</p>
        ` : ''}
        <p style="font-size: 13px; color: #374151; margin: 0;">Forgot your password? <a href="https://shijo.ai/forgot-password" style="color: #CC0000;">Reset it here</a> any time.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 4px 0;"><strong style="color: #6b7280;">SHIRO Technologies LLC</strong></p>
      <p style="margin: 0 0 4px 0;">5080 Spectrum Drive, Suite 575E, Addison, TX 75001</p>
      <p style="margin: 0 0 12px 0;">Questions? <a href="mailto:info@shijo.ai" style="color: #9ca3af;">info@shijo.ai</a> &nbsp;•&nbsp; <a href="https://shijo.ai/contact" style="color: #9ca3af;">Contact us</a></p>
      <p style="margin: 0;">&copy; 2026 SHIJO.ai — AI-Powered Marketing Tools</p>
      <p style="margin: 0;">You received this email because you created an account at shijo.ai</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    // Deliberately constant. The registrant's name is attacker-controlled
    // and MUST NOT reach a subject line (spam-relay incident, 2026-08-22).
    subject: 'Welcome to SHIJO.AI — Your 2 free AI tools are ready!',
    html,
  };
}

// ─── Email-confirmation resend (from the dashboard bell icon) ─────────
// Short and focused, unlike the full welcome email — this is a reminder,
// not a re-introduction to the product.

export function buildVerifyEmailReminder(name: string, verifyUrl: string): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Confirm your email address</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Hi ${firstName}, just a reminder to confirm your email address for ${firstName === 'there' ? 'your' : `${firstName}'s`} SHIJO.AI account. This is optional and doesn't affect your access — it just helps us keep accounts secure.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Confirm Email Address</a>
      </div>

      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 13px; color: #6b7280; word-break: break-all; margin: 0;">${verifyUrl}</p>
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — SHIRO Technologies LLC</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: 'Confirm your email address — SHIJO.AI',
    html,
  };
}

// ─── Password reset email ──────────────────────────────────────────────

export function buildPasswordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <!-- Card -->
    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Reset Your Password</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 8px 0;">Hi ${firstName},</p>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Reset Password</a>
      </div>

      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 13px; color: #6b7280; word-break: break-all; margin: 0 0 24px 0;">${resetUrl}</p>

      <!-- Security note -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="font-size: 13px; color: #6b7280; margin: 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — AI-Powered Marketing Tools</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: 'Reset your SHIJO.AI password',
    html,
  };
}

// ─── Terms of Service / Privacy Policy acceptance confirmation ───────────

export function buildTermsAcceptedEmail(
  name: string,
  opts: { termsVersion: string; privacyVersion: string; acceptedAt: string; ipAddress: string }
): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Terms &amp; Privacy Policy Accepted</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Hi ${firstName}, this confirms you accepted the SHIJO.AI Terms of Service and Privacy Policy when you created your account.</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Terms of Service version:</strong> ${escapeHtml(opts.termsVersion)}</p>
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Privacy Policy version:</strong> ${escapeHtml(opts.privacyVersion)}</p>
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Accepted at:</strong> ${escapeHtml(opts.acceptedAt)}</p>
        <p style="font-size: 13px; color: #374151; margin: 0;"><strong>IP address on record:</strong> ${escapeHtml(opts.ipAddress)}</p>
      </div>

      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">You can review these documents any time:</p>
      <p style="font-size: 14px; margin: 0 0 24px 0;">
        <a href="https://shijo.ai/terms" style="color: #CC0000;">Terms of Service</a> &nbsp;•&nbsp;
        <a href="https://shijo.ai/privacy" style="color: #CC0000;">Privacy Policy</a>
      </p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
        <p style="font-size: 13px; color: #6b7280; margin: 0;">This email is a record of your acceptance and does not require any action.</p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — SHIRO Technologies LLC</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: 'Your SHIJO.AI Terms of Service & Privacy Policy acceptance',
    html,
  };
}

// ─── Account deletion confirmation ─────────────────────────────────────

export function buildAccountDeletedEmail(
  name: string,
  opts: { email: string; deletedAt: string }
): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Your Account Has Been Deleted</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Hi ${firstName}, this confirms that the SHIJO.AI account associated with <strong>${escapeHtml(opts.email)}</strong> was deleted on ${escapeHtml(opts.deletedAt)}, at your request.</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;">What happened:</p>
        <ul style="font-size: 13px; color: #374151; margin: 0; padding-left: 18px;">
          <li style="margin-bottom: 6px;">Your account, profile, and all associated tool data (keywords, briefs, generations, usage history) were permanently deleted.</li>
          <li style="margin-bottom: 6px;">Any active subscription was canceled immediately — no further charges will occur.</li>
          <li>Per our Privacy Policy, some records may be retained for a limited period where required by law or for legitimate business purposes (such as fraud prevention or financial record-keeping), then deleted or anonymized.</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #9ca3af; margin: 0;">If you did not request this deletion, contact us immediately at legal@shijo.ai.</p>
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — SHIRO Technologies LLC</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: 'Your SHIJO.AI account has been deleted',
    html,
  };
}

// ─── Shared "customer support" signature block ─────────────────────────
// Simple, not salesy — appended to customer-facing support emails
// (ticket received / resolved) so they read as coming from a real team
// rather than an unsigned automated notice.
function supportSignature(): string {
  return `
    <p style="font-size: 14px; color: #6b7280; margin: 28px 0 0 0;">
      Best,<br>
      <strong style="color: #111827;">The SHIJO.AI Support Team</strong><br>
      <a href="mailto:info@shijo.ai" style="color: #CC0000; text-decoration: none;">info@shijo.ai</a>
    </p>
  `;
}

// Simple, single-style badge — just surfaces the category, no per-category
// priority color-coding (kept deliberately simple per product decision).
function reasonBadge(reasonLabel?: string): string {
  if (!reasonLabel) return '';
  return `<span style="display: inline-block; background: #e5e7eb; color: #374151; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; margin-bottom: 10px;">${escapeHtml(reasonLabel)}</span>`;
}

// ─── Support ticket: confirmation to the submitter ─────────────────────

export function buildTicketReceivedEmail(
  name: string,
  opts: { subject: string; message: string; ticketId: string; reasonLabel?: string }
): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">We got your message</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Hi ${firstName}, thanks for reaching out. This confirms we received your message and a member of the team will get back to you by email.</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 8px;">
        ${reasonBadge(opts.reasonLabel)}
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
        <p style="font-size: 13px; color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(opts.message)}</p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">Reference: ${escapeHtml(opts.ticketId)}</p>

      ${supportSignature()}
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — SHIRO Technologies LLC</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: `We received your message — ${sanitizeSubject(opts.subject, 80)}`,
    html,
  };
}

// ─── Support ticket: internal notification to the team ────────────────

export function buildTicketNotificationEmail(
  opts: { name: string; email: string; subject: string; message: string; ticketId: string; reasonLabel?: string }
): { subject: string; html: string } {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">New contact form submission</h2>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
        ${reasonBadge(opts.reasonLabel)}
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>From:</strong> ${escapeHtml(opts.name)} &lt;${escapeHtml(opts.email)}&gt;</p>
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0; white-space: pre-wrap;"><strong>Message:</strong>\n${escapeHtml(opts.message)}</p>
        <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">Ticket ID: ${escapeHtml(opts.ticketId)}</p>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin: 16px 0 0 0;">Manage this in the admin panel at /admin/tickets.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: `[Contact form] ${sanitizeSubject(opts.subject, 80)}`,
    html,
  };
}

// ─── Support ticket: resolution notice to the submitter ───────────────

export function buildTicketResolvedEmail(
  name: string,
  opts: { subject: string; adminNotes?: string | null }
): { subject: string; html: string } {
  const firstName = escapeHtml(name?.split(' ')[0] || 'there');
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold;">S</div>
      <h1 style="margin: 12px 0 0 0; font-size: 24px; color: #111827;">SHIJO.AI</h1>
    </div>

    <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">Your request has been resolved</h2>
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 16px 0;">Hi ${firstName}, we've marked your message about "${escapeHtml(opts.subject)}" as resolved.</p>
      ${opts.adminNotes ? `<div style="background: #f9fafb; border-radius: 8px; padding: 20px;"><p style="font-size: 13px; color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(opts.adminNotes)}</p></div>` : ''}
      <p style="font-size: 14px; color: #9ca3af; margin: 16px 0 0 0;">If this didn't fully resolve your issue, just reply to this email or use the <a href="https://shijo.ai/contact" style="color: #CC0000;">contact form</a> again.</p>

      ${supportSignature()}
    </div>

    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — SHIRO Technologies LLC</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: `Resolved: ${sanitizeSubject(opts.subject, 80)}`,
    html,
  };
}
