/**
 * Email service using Resend
 *
 * Setup: npm install resend
 * Env: RESEND_API_KEY=re_xxxxx
 *
 * Free tier: 100 emails/day, 3000/month — plenty for a SaaS launch.
 * Sign up at https://resend.com and add your API key to Vercel env vars.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'SHIJO.AI <noreply@shijo.ai>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
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

// ─── Welcome email with tool showcase ─────────────────────────────────

export function buildWelcomeEmail(name: string): { subject: string; html: string } {
  const firstName = name?.split(' ')[0] || 'there';

  const tools = [
    { category: 'Social Media', color: '#db2777', items: [
      { name: 'Post Caption Generator', free: true },
      { name: 'Social Content Planner', free: false },
      { name: 'Hashtag Optimizer', free: true },
      { name: 'Carousel & Reels Script', free: false },
      { name: 'Content Repurposer', free: false },
      { name: 'Social Bio Optimizer', free: true },
      { name: 'LinkedIn Post Generator', free: true },
    ]},
    { category: 'SEO', color: '#2563eb', items: [
      { name: 'Keyword Research', free: false },
      { name: 'SEO Content Brief', free: false },
      { name: 'SEO Meta Generator', free: true },
      { name: 'FAQ Generator', free: false },
      { name: 'AI Overview Optimizer', free: false },
    ]},
    { category: 'Ads & Copy', color: '#ea580c', items: [
      { name: 'Ad Copy Generator', free: false },
      { name: 'Ad Headline A/B Tester', free: false },
      { name: 'Audience Targeting Profiles', free: false },
      { name: 'Pain-to-Hook Converter', free: false },
      { name: 'Sales Angle Generator', free: false },
      { name: 'Landing Page Copy Generator', free: false },
    ]},
    { category: 'Email', color: '#16a34a', items: [
      { name: 'Email Sequence Generator', free: false },
      { name: 'Subject Line Generator', free: false },
      { name: 'Newsletter Generator', free: false },
    ]},
    { category: 'Content', color: '#9333ea', items: [
      { name: 'Content Idea Generator', free: false },
      { name: 'Video Content Suite', free: false },
      { name: 'Blog Post Outline', free: false },
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
      <p style="font-size: 16px; color: #6b7280; margin: 0 0 24px 0;">Your account is ready. You have access to <strong style="color: #111827;">5 free AI tools</strong> with 3 generations per day — no credit card needed.</p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://shijo.ai/dashboard/tools" style="display: inline-block; background: linear-gradient(135deg, #CC0000, #990000); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">Start Using Your Free Tools</a>
      </div>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <!-- Tool Showcase -->
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">Your 24 AI Marketing Tools</h2>
      <p style="font-size: 14px; color: #9ca3af; margin: 0 0 24px 0;">Tools marked FREE are available on your plan right now</p>

      ${toolSections}

      <!-- Upgrade CTA -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin-top: 32px;">
        <p style="font-size: 14px; color: #991b1b; margin: 0 0 12px 0; font-weight: 600;">Unlock all 24 tools for just $29/month</p>
        <a href="https://shijo.ai/dashboard" style="display: inline-block; background: #111827; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View Pro Plan</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
      <p>&copy; 2026 SHIJO.ai — AI-Powered Marketing Tools</p>
      <p>You received this email because you created an account at shijo.ai</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: `Welcome to SHIJO.AI — Your 5 free AI tools are ready, ${firstName}!`,
    html,
  };
}

// ─── Password reset email ──────────────────────────────────────────────

export function buildPasswordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
  const firstName = name?.split(' ')[0] || 'there';

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
