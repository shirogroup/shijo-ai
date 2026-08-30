import { MAX_PROMPTS, type BusinessIdentity } from './types';

/**
 * Local prompt generation for the /geo checker.
 *
 * The point of these prompts is to imitate how a real person asks an answer
 * engine for a local recommendation — "best yoga studio in Dallas" — NOT to
 * ask the engine about the business by name. Asking "tell me about Acme Yoga"
 * guarantees a mention and measures nothing. Every prompt below is
 * deliberately name-free so that a mention is earned, not prompted.
 *
 * If you add prompts, keep that rule: no prompt may contain the business
 * name or domain.
 */

/** Places `types` → a natural noun a person would actually type.
 *  Places returns snake_case machine types; rendering those raw ("yoga_studio
 *  in Dallas") produces prompts no human would write, which skews results. */
const TYPE_NOUNS: Record<string, string> = {
  yoga_studio: 'yoga studio',
  gym: 'gym',
  fitness_center: 'fitness center',
  spa: 'spa',
  hair_care: 'hair salon',
  beauty_salon: 'beauty salon',
  nail_salon: 'nail salon',
  restaurant: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'coffee shop',
  bakery: 'bakery',
  bar: 'bar',
  dentist: 'dentist',
  doctor: 'doctor',
  physiotherapist: 'physical therapist',
  chiropractor: 'chiropractor',
  veterinary_care: 'veterinarian',
  lawyer: 'lawyer',
  accounting: 'accountant',
  real_estate_agency: 'real estate agent',
  insurance_agency: 'insurance agent',
  plumber: 'plumber',
  electrician: 'electrician',
  roofing_contractor: 'roofing contractor',
  general_contractor: 'contractor',
  moving_company: 'moving company',
  car_repair: 'auto repair shop',
  car_dealer: 'car dealership',
  pet_store: 'pet store',
  florist: 'florist',
  book_store: 'bookstore',
  clothing_store: 'clothing store',
  furniture_store: 'furniture store',
  hardware_store: 'hardware store',
  pharmacy: 'pharmacy',
  school: 'school',
  preschool: 'preschool',
  child_care_agency: 'childcare',
  photographer: 'photographer',
  travel_agency: 'travel agency',
  storage: 'storage facility',
  laundry: 'laundromat',
  locksmith: 'locksmith',
  landscaping: 'landscaper',
  pest_control_service: 'pest control service',
  marketing_agency: 'marketing agency',
  consultant: 'consultant',
};

/** Places types that describe a category so broad the prompt becomes
 *  meaningless. Skipped when picking a noun. */
const GENERIC_TYPES = new Set([
  'point_of_interest',
  'establishment',
  'store',
  'food',
  'health',
  'finance',
  'place_of_worship',
  'local_business',
]);

/**
 * Pick the most specific useful noun for the business.
 * Falls back to "business" — vague, but honest, and still produces a
 * usable local-intent prompt.
 */
export function categoryNoun(types: string[]): string {
  for (const t of types) {
    if (GENERIC_TYPES.has(t)) continue;
    if (TYPE_NOUNS[t]) return TYPE_NOUNS[t];
  }
  // Unmapped but non-generic type: de-snake it rather than dropping to
  // "business", so a niche category still reads naturally.
  const firstSpecific = types.find((t) => !GENERIC_TYPES.has(t));
  if (firstSpecific) return firstSpecific.replace(/_/g, ' ');
  return 'business';
}

/**
 * Build up to MAX_PROMPTS name-free local-intent prompts.
 *
 * Ordered by how commonly a real person phrases the question, so that a
 * truncated run (fewer prompts) still covers the highest-value queries.
 */
export function buildLocalPrompts(identity: BusinessIdentity): string[] {
  const noun = categoryNoun(identity.types);
  const city = identity.city.trim();
  const where = city ? ` in ${city}` : '';

  const candidates = [
    `What are the best ${noun}s${where}?`,
    `Can you recommend a good ${noun}${where}?`,
    `Which ${noun}${where} do people rate most highly?`,
    `I'm new to ${city || 'the area'} — which ${noun} should I go to?`,
    `What's the most popular ${noun}${where} right now?`,
    `Compare the top ${noun}s${where}.`,
    `Which ${noun}${where} is best for beginners?`,
    `List a few well-reviewed ${noun}s${where} with their websites.`,
  ];

  return dedupe(candidates).slice(0, MAX_PROMPTS);
}

/**
 * Normalise caller-supplied prompts: trim, drop empties, dedupe, cap.
 * Returns [] when nothing usable was supplied, so the caller can fall back
 * to buildLocalPrompts().
 */
export function normalisePrompts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    // Cap individual prompt length. A very long prompt inflates token cost
    // on every engine simultaneously and is the cheapest way for an
    // anonymous caller to burn the daily budget.
    .filter((p) => p.length > 0 && p.length <= 300);
  return dedupe(cleaned).slice(0, MAX_PROMPTS);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
