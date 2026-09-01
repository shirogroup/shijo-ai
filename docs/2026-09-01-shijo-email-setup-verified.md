# SHIJO.AI email - verified setup (2026-09-01)

Checked live this session via DNS queries against 8.8.8.8 and the Gmail UI.
Labels follow the KB convention: CONFIRMED / UNKNOWN / DISCREPANCY.

---

## 1. Where shijo.ai email is hosted - CONFIRMED

| Record | Value | Meaning |
|---|---|---|
| MX | `1 smtp.google.com` | Inbound mail -> Google Workspace (new single-host MX format) |
| SPF | `v=spf1 include:_spf.google.com ~all` | Only Google authorised to send as shijo.ai |
| DKIM | `resend._domainkey.shijo.ai` -> valid RSA key | Resend configured to DKIM-sign app mail |
| DMARC | `v=DMARC1; p=none; rua=mailto:legal@shijo.ai;` | Published, monitor-only |
| TXT | `google-site-verification=NHuWrz3Q8u8Q1T2PARWKK0h0XeaMlPCsV4TSmkWW4xs` | Workspace verification |

Related domains:

- **shiroapps.com** - Google Workspace (classic 5-host `aspmx.l.google.com`). SPF still carries
  Bluehost leftovers (`include:bluehost.com`, `ip4:50.87.199.45`, `ip4:69.195.106.231`).
  **No DMARC record at all.**
- **shirotechnologies.com** - Google Workspace + Brevo. DMARC `p=none`, reporting to
  `rua@dmarc.brevo.com`. Google DKIM selector present.

### Open risks - UNRESOLVED

1. **SPF does not include Resend.** Resend mail passes DKIM but fails SPF alignment against
   `_spf.google.com`. It authenticates under relaxed DMARC via DKIM alone - one leg, not two.
2. **DMARC still `p=none`.** The post-incident cleanup in
   `docs/security/email-injection-spam-relay-playbook.md` calls for tightening to `quarantine`
   then `reject`. Not done. ~430 spam messages were delivered from this domain in the
   2026-08-20/22 relay incident; monitor-only gives no enforcement.
3. **shiroapps.com has no DMARC record.** Same org, no policy, no reporting.

**UNKNOWN:** which registrar / DNS control panel holds these zones. Not verified.

---

## 2. angie@shijo.ai - DISCREPANCY

`angie@shijo.ai` is **not its own mailbox**.

- The mailbox is **`angie@shiroapps.com`** (Google account "Angie Lopez", browser session index `u/4`).
- `Angie Lopez <Angie@shijo.ai>` exists there as a **send-as alias**, set as the **default**.
- "When replying to a message" is set to *Always reply from default address (currently Angie@shijo.ai)*.

Outbound therefore goes out as `angie@shijo.ai`. There is no separate shijo.ai login.

Signed-in accounts in that browser profile: `u/0` srikanth@shiroapps.com,
`u/1` srikanth@shirotechnologies.com, `u/2` info@shiroapps.com,
`u/3` merianda@shirotechnologies.com, `u/4` angie@shiroapps.com.

---

## 3. Marketing signature - CONFIRMED LIVE

Saved in the `angie@shiroapps.com` mailbox and verified by opening a fresh Compose window
(From line reads `Angie Lopez <Angie@shijo.ai>`, signature auto-inserted).

- Signature name: `SHIJO.AI`
- Defaults for **Angie@shijo.ai**: new emails = SHIJO.AI, reply/forward = SHIJO.AI
- "Insert signature before quoted text... remove the '--' line" - enabled
- `angie@shiroapps.com` deliberately left on *No signature*, so SHIJO branding does not appear
  on SHIRO-domain mail

Source files: `docs/marketing/2026-09-01-email-signature.html` and `.txt`.

Design: 3px `#E10600` left accent bar, Arial/Helvetica, body `#0A0A0A` / `#3C3C3C`, hairline
divider `#E6E6E6`. Table layout, inline styles, **no images and no tracking pixels** - deliberate,
given the domain's spam history and `p=none` DMARC.

**DISCREPANCY:** the signature uses `#E10600` (specified by the user) but the live "Run my free
check" button on `/geo` computes to `rgb(220, 0, 25)` = `#DC0019`. The signature is fractionally
brighter than the site. Left as specified; worth reconciling.

**Known limitation, UNTESTED:** Outlook on Windows renders through Word, which ignores
`border-radius` and handles `padding` on an inline-block anchor poorly. The CTA likely renders
square-cornered there. It stays clickable. Not verified - no test send has been made.

Claims audited before shipping (project rule 5):

- `/geo` is real and live - "Free AI Visibility Checker - See if AI Search Recommends You | SHIJO.AI",
  in the sitemap at priority 0.8. Its own copy says "One free scan per day... No account needed".
- `https://shijo.ai/geo` (apex) 301s to `www.shijo.ai/geo` and lands on the checker - verified.
- Address `5080 Spectrum Drive, Suite 575E, Addison, TX 75001` from the live `/contact` page.
  Only "Addison, TX" appears in the signature; **SHIRO Technologies LLC is not named** (brand rule 7).
- No title, certification, team size or result stat was invented.
- `/tools` was considered as a CTA and **rejected** - not in the sitemap. `/ai-marketing-tools`
  is the real directory URL.

---

## 4. Live sitemap inventory (2026-09-01)

16 URLs: `/`, `/pricing`, `/features`, `/geo`, `/ai-marketing-tools`, `/contact`, `/blog` + 3 posts,
`/terms`, `/privacy`, `/cookies`, `/gdpr-compliance`, `/ai-compliance`, `/security`.

**DISCREPANCY for copywriters:** there is no `/tools` route in the sitemap. Older documentation
(`SHIJO-AI-COMPLETE-DOCUMENTATION.md.md`) references `app/tools/...` and a 24-tool count; the live
`/contact` page states **12 tools**. Treat the documentation inventory as stale until re-verified
against `lib/tools/registry.ts`.

---

## 5. Not done

- SPF and DMARC changes for shijo.ai - **not made**. Requires DNS panel access, not identified.
- No test send has been made from angie@shijo.ai.
