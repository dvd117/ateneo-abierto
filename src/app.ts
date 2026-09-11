import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addSubscriber } from './mailerlite';

export const app = new Hono();

/** Where `vite build` put the site. Overridable so tests can point at fixtures. */
const distDir = process.env.DIST_DIR ?? './dist';

type PageLocale = 'es' | 'en';

/**
 * Hashes of the inline <style> blocks the prerender wrote into the pages
 * (dist/csp.json). Inline CSS is allowed by exact hash only — never by
 * 'unsafe-inline' — so anything injected into a page still will not style it.
 */
export function loadStyleHashes(dir: string): string[] {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, 'csp.json'), 'utf8')) as { styleSrc?: unknown };
    if (!Array.isArray(parsed.styleSrc)) {
      return [];
    }

    return parsed.styleSrc.filter(
      (value): value is string => typeof value === 'string' && /^'sha256-[A-Za-z0-9+/]+={0,2}'$/.test(value)
    );
  } catch {
    return [];
  }
}

/**
 * The same order the browser uses in src/locale.ts: an explicit ?lang= wins,
 * then the visitor's language preferences, then Spanish.
 */
export function pickLocale(query: string | undefined, acceptLanguage: string | undefined): PageLocale {
  if (query === 'es' || query === 'en') {
    return query;
  }

  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;

      return {
        base: tag.trim().toLowerCase().split('-')[0],
        weight: Number.isFinite(weight) ? weight : 0,
        index
      };
    })
    .filter((entry) => entry.base && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  for (const entry of ranked) {
    if (entry.base === 'es' || entry.base === 'en') {
      return entry.base;
    }
  }

  return 'es';
}

const pageCache = new Map<PageLocale, string>();

function readPage(locale: PageLocale): string | null {
  const cached = pageCache.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const html = readFileSync(join(distDir, locale === 'en' ? 'index.en.html' : 'index.html'), 'utf8');
    pageCache.set(locale, html);
    return html;
  } catch {
    return null;
  }
}

// Nothing upstream compresses (Traefik has no compress middleware here), and
// the prerendered page is 27 KB raw against 7 KB gzipped: on a slow line that
// difference is most of the wait. Fonts are already woff2 and are skipped.
app.use('*', compress());

app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", ...loadStyleHashes(distDir)],
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  })
);

app.get('/api/health', (c) => c.json({ ok: true }));

// The home page, already rendered in the visitor's language by the build.
app.get('/', async (c, next) => {
  const locale = pickLocale(c.req.query('lang'), c.req.header('accept-language'));
  const html = readPage(locale);

  if (html === null) {
    return next();
  }

  c.header('Content-Language', locale);
  c.header('Vary', 'Accept-Language');
  // Assets are content-hashed; the page itself must revalidate to pick them up.
  c.header('Cache-Control', 'no-cache');
  return c.html(html);
});

app.get('/manifesto', (c) => {
  const lang = c.req.query('lang');
  return c.redirect(lang === 'es' || lang === 'en' ? `/?lang=${lang}` : '/', 301);
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type NewsletterLocale = 'es' | 'en';

function isNewsletterLocale(value: unknown): value is NewsletterLocale {
  return value === 'es' || value === 'en';
}

function mailerLiteGroupIdFor(locale: NewsletterLocale): string {
  const groupId = locale === 'es'
    ? process.env.MAILERLITE_GROUP_ES_ID
    : process.env.MAILERLITE_GROUP_EN_ID;

  if (!groupId) {
    throw new Error('missing-mailerlite-group-id');
  }

  return groupId;
}

function mailerLiteParticipateGroupIdFor(locale: NewsletterLocale): string | null {
  return (locale === 'es'
    ? process.env.MAILERLITE_PARTICIPATE_ES_ID
    : process.env.MAILERLITE_PARTICIPATE_EN_ID) ?? null;
}

app.post(
  '/api/subscribe',
  bodyLimit({ maxSize: 2 * 1024 }),
  async (c) => {
    // Content-Type enforcement
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return c.json({ error: 'unsupported media type' }, 415);
    }

    // Origin check (only enforced when SITE_ORIGIN env var is set)
    const siteOrigin = process.env.SITE_ORIGIN;
    const origin = c.req.header('origin');
    if (siteOrigin && origin && origin !== siteOrigin) {
      return c.json({ error: 'forbidden' }, 403);
    }

    const body = await c.req.json<Record<string, unknown>>();

    // Honeypot — return ok silently so bots think they succeeded
    if (body.website) {
      console.warn('[subscribe] honeypot triggered');
      return c.json({ ok: true });
    }

    // Input validation
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = typeof body.name === 'string'
      ? body.name.trim().slice(0, 100).replace(/<[^>]*>/g, '')
      : '';
    const newsletterLocale = body.newsletterLocale;
    const participate = body.participate === true;

    if (!email || !emailPattern.test(email) || email.length > 254) {
      return c.json({ ok: false, reason: 'invalid-email' }, 400);
    }

    if (!isNewsletterLocale(newsletterLocale)) {
      return c.json({ ok: false, reason: 'invalid-newsletter-locale' }, 400);
    }

    const apiKey = process.env.MAILERLITE_API_KEY ?? '';

    const groups = [mailerLiteGroupIdFor(newsletterLocale)];
    if (participate) {
      const participateGroupId = mailerLiteParticipateGroupIdFor(newsletterLocale);
      if (participateGroupId) groups.push(participateGroupId);
    }

    try {
      await addSubscriber({
        email,
        name: name || undefined,
        newsletterLocale,
        groups,
        participationInterest: participate || undefined,
      }, apiKey);
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'invalid-email') {
        return c.json({ ok: false, reason: 'invalid-email' }, 422);
      }
      console.error('[subscribe] provider error', message || err);
      return c.json({ ok: false, reason: 'provider-error' }, 502);
    }
  }
);

// Static file serving — must be last
app.use('*', serveStatic({ root: './dist' }));
