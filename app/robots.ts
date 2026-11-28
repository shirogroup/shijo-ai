import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/**
 * Private and app paths stay disallowed for every user-agent group.
 *
 * A named group does not inherit rules from `User-agent: *`. The previous
 * file allowed GPTBot, ChatGPT-User, Claude-Web, and PerplexityBot with
 * only `Allow: /`, which exempted those bots from the * disallows. Each
 * named crawler now repeats the same four disallows.
 */
const PRIVATE_PATHS = ['/api/', '/admin/', '/dashboard/', '/thank-you'];

const NAMED_CRAWLERS = [
  // Already named before this change.
  'GPTBot',
  'ChatGPT-User',
  'Claude-Web',
  'PerplexityBot',
  // AI search and AI training crawlers Srikanth allowed on 2026-11-27.
  'OAI-SearchBot',
  'Claude-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Google-Extended',
  'Bingbot',
  'Applebot-Extended',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get('host') ?? '').split(':')[0].toLowerCase();
  const onLearnHost = host === 'learn.shijo.ai';

  const rule = {
    allow: '/',
    disallow: PRIVATE_PATHS,
  };

  return {
    rules: [
      { userAgent: '*', ...rule },
      ...NAMED_CRAWLERS.map((userAgent) => ({ userAgent, ...rule })),
    ],
    sitemap: onLearnHost
      ? 'https://learn.shijo.ai/sitemap.xml'
      : 'https://www.shijo.ai/sitemap.xml',
  };
}
