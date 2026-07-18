/**
 * Current version identifiers for legal documents.
 * Bump these whenever /terms or /privacy content changes materially —
 * each bump means existing users may need to re-accept, and every new
 * acceptance is stamped with whichever version was current at the time
 * (see db/schema.ts termsAcceptances table, app/api/auth/register/route.ts).
 *
 * Convention: use the same date as the "Last updated" text on the
 * corresponding page.
 */
export const CURRENT_TERMS_VERSION = '2026-07-17';
export const CURRENT_PRIVACY_VERSION = '2026-07-17';
