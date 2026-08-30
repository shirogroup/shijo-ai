import type { BusinessIdentity } from './types';

/**
 * Google Places Text Search (New) — identity resolution, stage 1 of the
 * GEO pipeline.
 *
 * Why this runs first: a "mention" is only meaningful if we know what the
 * business is actually called and what category it sits in. Places gives us
 * the canonical display name (which is often not what the user typed), the
 * category types that drive prompt generation, and the address.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Failure policy: this function NEVER throws. If the key is missing, the
 * request fails, or nothing matches, it returns a fallback identity built
 * from the raw form input with resolved:false. The scan still runs — we
 * just generate prompts from a generic category noun and tell the user the
 * identity was unresolved. Blocking the whole scan on Places would mean one
 * missing key produces a blank page, which the brief explicitly rules out.
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.types',
  'places.googleMapsUri',
].join(',');

const TIMEOUT_MS = 8000;

interface PlacesResponse {
  places?: {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    types?: string[];
    googleMapsUri?: string;
  }[];
}

/**
 * Extract a bare, comparable host from user input.
 * Accepts "acme.com", "https://www.acme.com/pricing", "WWW.Acme.com".
 * Returns null for anything that isn't parseable as a host.
 */
export function normaliseDomain(websiteUrl: string): string | null {
  const raw = (websiteUrl || '').trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const host = new URL(withScheme).hostname.toLowerCase();
    const bare = host.replace(/^www\./, '');
    // Must look like a domain: at least one dot, no spaces.
    if (!bare.includes('.') || /\s/.test(bare)) return null;
    return bare;
  } catch {
    return null;
  }
}

export async function resolveIdentity(input: {
  businessName: string;
  websiteUrl: string;
  city: string;
}): Promise<BusinessIdentity> {
  const domain = normaliseDomain(input.websiteUrl);
  const fallback: BusinessIdentity = {
    placeId: null,
    displayName: input.businessName.trim(),
    formattedAddress: null,
    types: [],
    googleMapsUri: null,
    domain,
    city: input.city.trim(),
    resolved: false,
  };

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    // Never log or echo the variable's value — only its absence.
    return {
      ...fallback,
      unresolvedReason: 'Place lookup is not configured on this environment.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PLACES_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: [input.businessName.trim(), input.city.trim()]
          .filter(Boolean)
          .join(' '),
        maxResultCount: 1,
        languageCode: 'en',
      }),
    });

    if (!res.ok) {
      // Status only — the body can echo the API key in some error shapes.
      return {
        ...fallback,
        unresolvedReason: `Place lookup returned HTTP ${res.status}.`,
      };
    }

    const data = (await res.json()) as PlacesResponse;
    const place = data.places?.[0];
    if (!place) {
      return {
        ...fallback,
        unresolvedReason: 'No matching place was found for that name and city.',
      };
    }

    return {
      placeId: place.id ?? null,
      displayName: place.displayName?.text?.trim() || fallback.displayName,
      formattedAddress: place.formattedAddress ?? null,
      types: Array.isArray(place.types) ? place.types : [],
      googleMapsUri: place.googleMapsUri ?? null,
      domain,
      city: fallback.city,
      resolved: true,
    };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === 'AbortError'
        ? 'Place lookup timed out.'
        : 'Place lookup could not be completed.';
    return { ...fallback, unresolvedReason: reason };
  } finally {
    clearTimeout(timer);
  }
}
