/**
 * QA fixtures for the admin GEO health page.
 *
 * These are TEST SUBJECTS, not customers. Maya Yoga Studio is the persona used
 * in the real-user audit case study (docs/marketing/2026-08-23-case-study-real-user-audit.md)
 * and in the first live /geo scan on 2026-08-30. Keeping it pinned here means
 * marketing QA re-runs the same subject every time, so results are comparable
 * across runs instead of drifting with whatever someone typed that day.
 *
 * Defaults match the values stored on the 2026-08-30 scan so the "last scan for
 * this fixture" lookup lines up. All fields stay editable in the UI.
 */

export interface GeoFixture {
  id: string;
  label: string;
  businessName: string;
  websiteUrl: string;
  city: string;
  /** Shown on the page so nobody mistakes a fixture for a real account. */
  note: string;
  /** What a correct run looks like — makes a regression obvious. */
  expectation: string;
}

export const GEO_FIXTURES: GeoFixture[] = [
  {
    id: 'maya-yoga',
    label: 'Maya Yoga Studio',
    businessName: 'Maya Yoga Studio',
    websiteUrl: 'mayayoga.com',
    city: 'Dallas',
    note:
      'Case-study fixture for marketing QA — not a customer. Used in the real-user audit write-up and the first live /geo scan.',
    expectation:
      'Places may or may not resolve this name. If it does NOT resolve, the correct result is band "unverified" with no score — not a confident 0.',
  },
  {
    id: 'unresolvable',
    label: 'Unresolved-identity test',
    businessName: 'Zzqx Yoga 99999',
    websiteUrl: '',
    city: 'Dallas',
    note:
      'Deliberate nonsense name. Exercises the identity gate, which is the one path a normal scan never reaches.',
    expectation:
      'identity_resolved MUST be false, band MUST be "unverified", score MUST be withheld (rendered as a dash), and the run must not crash.',
  },
  {
    id: 'positive-control',
    label: 'Positive control',
    businessName: 'Franklin Barbecue',
    websiteUrl: 'franklinbbq.com',
    city: 'Austin',
    note:
      'Well-known public US business, chosen because answer engines asked about Austin barbecue are very likely to name it.',
    expectation:
      'identity_resolved true, and at least one engine should report a mention. Zero mentions here suggests a detection bug rather than genuine invisibility.',
  },
];

export function getFixture(id: string): GeoFixture | undefined {
  return GEO_FIXTURES.find((f) => f.id === id);
}
