// Single source of truth for the Contact form's "Reason for contacting"
// dropdown — used by the form itself, the API route, and the admin tickets
// panel. Keeping this in one place avoids the three of them drifting apart.

export const REASON_OPTIONS = [
  { value: 'general', label: 'General Question' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical / Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'partnership', label: 'Partnership / Press' },
  { value: 'other', label: 'Other' },
] as const;

export type ContactReason = (typeof REASON_OPTIONS)[number]['value'];

export const VALID_REASONS = new Set(REASON_OPTIONS.map((r) => r.value));

export const REASON_LABELS: Record<string, string> = Object.fromEntries(
  REASON_OPTIONS.map((r) => [r.value, r.label])
);
