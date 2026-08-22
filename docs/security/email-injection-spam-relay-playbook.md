# Playbook: Transactional email abused as a spam relay

**Applies to:** any product that sends transactional email triggered by an unauthenticated public endpoint (signup, contact, waitlist, invite, password reset).
**First found:** SHIJO.AI, 2026-08-20 → 2026-08-22. Full incident record in that repo's `SHIJO_AI_KB.md` §37–§38.
**Written to be portable** — nothing below is SHIJO-specific. Run the audit in §5 against every product before assuming it's clean.

---

## 1. The scenario

A public signup endpoint accepted a `name` field with **no server-side validation**, and the welcome-email template interpolated that name directly into the **email subject line**:

```ts
const firstName = name?.split(' ')[0] || 'there';
subject: `Welcome to ACME — your account is ready, ${firstName}!`
```

An attacker POSTed to that endpoint repeatedly with:

- `email` → **a third party's address** (harvested Gmail accounts)
- `name` → **advertising copy containing a shortened link**

The application did exactly what it was written to do: created the account and emailed the address supplied. The result was that advertising, in the subject line, delivered **from a verified, DKIM-signed, SPF-passing domain** owned by the business.

**The business becomes the spam sender.** Not a compromised mail server, not a stolen API key — the app's own intended flow, driven by attacker-chosen inputs. Every reputation consequence lands on the sending domain.

### Scale seen in the real incident

| Metric | Value |
|---|---|
| Duration | ~19.5 hours continuous |
| API requests to the email provider | 231,675 |
| Rejected by the provider's rate limiter (HTTP 429) | 231,239 (99.8%) |
| Actually delivered | ~430 |
| Peak request rate | 568 / minute |

Note the shape: the mail provider's own per-second rate limit absorbed almost all of it. **That was luck, not defence.** With a paid plan, a higher rate limit, or pay-as-you-go enabled, the same attack would have delivered six figures of spam and generated a real invoice.

---

## 2. How it shows up (detection)

Symptoms, roughly in the order you'll notice them:

1. **A flood of HTTP 429s** in the email provider's API log, sustained for hours, from a single API key.
2. **The provider's request log looks anonymous** — it typically records only timestamp, endpoint, method, status. It will *not* tell you which app route was hit, who the recipient was, or what the payload said. This is why the request log alone leads to the wrong conclusion.
3. **The provider's "Emails"/message view is where the truth is** — it shows recipients and subject lines. Read the *subject lines*. Spam text sitting inside your own template's subject is the whole diagnosis.
4. Real transactional email silently failing during the window (welcome, password reset) because every send is bouncing off the rate limiter.
5. Junk rows appearing in the `users` (or equivalent) table with nonsense names.

> **Diagnostic rule:** a request log tells you *how much*. A message log tells you *what*. Do not stop at the request log.

---

## 3. Root cause — the vulnerability class

Three failures stacked. The first is the actual bug; the other two set the scale.

**(a) User-controlled text reaching an email subject line.**
The core defect. A subject line is the one part of an email that a recipient reads in their inbox list without opening anything. Attacker text there *is* the advert — it doesn't even need the body to render.

**(b) A field with no validation at all.**
In the real incident, `email`, `password`, password-confirmation and terms-acceptance each had their own server-side check. `name` had **none** — not a length cap, not a character check. It went straight into the database and into the email template. Fields that feel "cosmetic" get skipped in review precisely because they feel harmless.

**(c) No rate limit and no bot check on the endpoint.**
The same codebase had a `rate_limits` table defined in its schema with **zero call sites** — designed, never wired up. Meanwhile the *contact* form on the same product had a captcha, which is exactly why the attacker used signup instead. **Attackers find the unprotected door.** Protecting one public form and not its neighbour buys nothing.

### The general rule

> Any public endpoint that (1) accepts a **recipient address** and (2) accepts **free text** that reaches the message is a spam relay until proven otherwise.

That covers far more than signup: contact forms, "invite a colleague", "share this with a friend", waitlist confirmations, referral emails, calendar invites, and any "we've received your submission" auto-responder.

---

## 4. The fix

Applied in this order. Fix 1 alone closes the relay; the rest close the class.

### Fix 1 — never put user text in a subject line *(the one that matters)*

```diff
- subject: `Welcome to ACME — your account is ready, ${firstName}!`
+ // Deliberately constant. The registrant's name is attacker-controlled
+ // and MUST NOT reach a subject line.
+ subject: 'Welcome to ACME — your account is ready!',
```

Personalisation belongs in the **body**, where it is escaped and where nobody sees it in an inbox list. This is a one-line change and it ends the attack immediately.

Where user text genuinely must appear in a subject — a support ticket the team has to triage — sanitize and cap it, and only on a path that is captcha-gated:

```ts
export function sanitizeSubject(value: unknown, maxLength: number = 120): string {
  return String(value == null ? '' : value)
    .replace(/[\r\n\t]+/g, ' ')                 // no header forging
    .replace(/[\u0000-\u001F\u007F]/g, '')      // no control characters
    .trim()
    .slice(0, maxLength);
}
```

Sanitizing is a **fallback**, not a substitute for Fix 1.

### Fix 2 — validate the free-text field, with a blocklist

```ts
const NAME_MAX_LENGTH = 60;
const NAME_BLOCKLIST = /(https?:\/\/|www\.|[<>]|[a-z0-9-]+\.(?:com|net|org|io|co|ly|me|ru|xyz|link|info|top|club|site|online|shop|app)(?:\/|\s|$))/i;
const NAME_CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
```

**Use a blocklist, not an allowlist.** The tempting fix is `/^[A-Za-z\s'-]+$/`, which rejects every Arabic, Chinese, Cyrillic and Indic name your real customers have. Block what a name never legitimately contains — markup, control characters, URLs — and leave the rest alone. The URL clause matters most: a spam advert without a link is worthless to the attacker.

Verified against real payloads and real names before shipping:

| Input | Result |
|---|---|
| `✨70.000TL✨bonus✨…https://bit.ly/…✨` (actual payload) | blocked |
| `bit.ly/4qfrCC8` (bare, no scheme) | blocked |
| `Win now www.spam.ru` | blocked |
| `<a href=x>hi</a>` | blocked |
| `Bob\r\nBcc: victim@example.com` | blocked |
| `José Álvarez`, `张伟`, `محمد علي`, `Владимир`, `Mary-Jane O'Brien` | **allowed** |

### Fix 3 — HTML-escape every user value in every template

The subject is the loud problem; the body is the quiet one. Unescaped interpolation lets an attacker inject real anchor tags into a message sent from your domain.

```ts
export function escapeHtml(value: unknown): string {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

Apply to **every** interpolated value, including ones that look server-generated. Client-settable headers such as `X-Forwarded-For` are a common blind spot — an IP address rendered into a "for your records" email is attacker-controlled.

### Fix 4 — rate-limit the endpoint

Per-IP and per-email-address, on every public endpoint that can trigger a send. A schema table that was never wired up is not a rate limiter.

### Fix 5 — bot check on *every* public form, not just one

If one form has a captcha and its neighbour doesn't, the neighbour is the attack surface.

---

## 5. Audit checklist for any other product

Run all of it. Any single "no" is a live relay.

- [ ] Grep every email template for interpolation inside a `subject:` field. Does any of it originate from a request body?
- [ ] For each public endpoint that sends mail: is **every** accepted field validated server-side — including the ones that feel cosmetic?
- [ ] Can an unauthenticated caller supply **both** the recipient address and text that reaches the message? (If yes: relay.)
- [ ] Is every user value HTML-escaped in the template — including IPs and other header-derived values?
- [ ] Is there a real, wired-up rate limit, per IP and per address?
- [ ] Do **all** public forms have a bot check, or only some?
- [ ] Does the sending domain have SPF, DKIM **and** a published DMARC record?
- [ ] Is pay-as-you-go / overage billing off on the email provider, so an attack can't turn into an invoice?
- [ ] Does anything alert when the provider starts returning 429s, or is the first signal a human noticing?

---

## 6. Cleanup after an incident

1. **Ship Fix 1 first.** Everything else can follow; the relay closes with the deploy.
2. **Purge the junk accounts.** Every abuse request created a real user row. Identify them by the blocklist pattern and by registration timestamp clustering.
3. **Check suppressions and bounces** at the provider. Delivered spam generates spam complaints, and complaints damage domain reputation for months.
4. **Publish DMARC** if missing (start `p=none` with a `rua=` reporting address, then tighten to `quarantine`, then `reject`).
5. **Tell the email provider** what happened. A cooperative disclosure is much better than being flagged as a spam source by their abuse team.
6. **Write the incident down** in the product's own knowledge base, with the timestamps and the payload — the next person needs the payload to recognise a repeat.

---

## 7. Standing rules to carry into new products

1. A subject line takes **constants only**, unless there is a specific, reviewed reason otherwise.
2. Every request-body field gets a server-side check. "It's just a display name" is how this happens.
3. Escape at the template boundary, always, regardless of where the value came from.
4. Public endpoint that sends email ⇒ rate limit **and** bot check. Both.
5. Blocklists for human-language input; allowlists reject real people.
6. Turn off overage billing on transactional email providers unless you actively need it.
