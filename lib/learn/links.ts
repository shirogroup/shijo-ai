/**
 * Public URLs for the free Module 1 lesson.
 *
 * GEO and the optional meta tool are absolute on purpose. learn.shijo.ai
 * rewrites unknown paths back to the lesson, so a relative /geo or
 * /dashboard link on that host would never leave the training page.
 */

export const GEO_CHECK_URL = "https://shijo.ai/geo";

export const META_GENERATOR_URL =
  "https://www.shijo.ai/dashboard/tools/seo-meta-generator";

export const MAIN_SITE_URL = "https://www.shijo.ai";

export const MODULE_PATH = "/learn";

export const LOG_PATH = "/learn/visibility-log";

export const VISIBILITY_LOG_DOWNLOAD = "/downloads/visibility-log.md";

/**
 * Absolute one-click unsubscribe URL for a future Module email.
 * No mail is sent today. Pass the row's unsubscribe_token.
 */
export function learnUnsubscribeUrl(token: string): string {
  const url = new URL("/unsubscribe", "https://learn.shijo.ai");
  url.searchParams.set("token", token);
  return url.toString();
}
