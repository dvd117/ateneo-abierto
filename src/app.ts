import { Hono, type Context, type Next } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addSubscriber } from './mailerlite';
import { clientIp } from './client-ip';
import { subscribeLimiter } from './rate-limit';

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

/**
 * The three doors as their own addresses. Kept here rather than read from
 * content.ts: the runtime image ships only the server files (see Dockerfile).
 * Each must match a prerendered {route}.html and {route}.en.html.
 */
export const DEEP_LINK_ROUTES = ['demo-nights', 'talleres', 'hackaton'] as const;
type DeepLinkRoute = (typeof DEEP_LINK_ROUTES)[number];

/**
 * The prerendered file for one page: index(.en).html or the same for a door.
 * Must stay in step with pageFileName in scripts/vite-prerender.ts.
 */
export function pageFile(locale: PageLocale, route?: DeepLinkRoute): string {
  return `${route ?? 'index'}${locale === 'en' ? '.en' : ''}.html`;
}

const pageCache = new Map<string, string>();

function readPage(file: string): string | null {
  const cached = pageCache.get(file);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const html = readFileSync(join(distDir, file), 'utf8');
    pageCache.set(file, html);
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
      // The Ignite Talk is the only embed on the page, and it is only ever
      // created after the visitor presses play. Nothing else may be framed.
      // youtube.com rather than the no-cookie origin: see bindTalk in main.ts.
      frameSrc: ["'self'", 'https://www.youtube.com'],
      // The three `default-src` does not cover.
      //
      // frameAncestors is the one browsers actually honour; X-Frame-Options
      // above is the legacy spelling of the same intent, kept for old clients.
      frameAncestors: ["'none'"],
      // Without this, an injected <base> silently re-points every relative
      // URL on the page — including the script tags — at another origin.
      baseUri: ["'none'"],
      // The page has exactly one form and it posts here. An injected form
      // that ships the subscriber's address somewhere else will not submit.
      formAction: ["'self'"],
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  })
);

app.get('/api/health', (c) => c.json({ ok: true }));

/**
 * A page already rendered in the visitor's language by the build: the home
 * page, or the home page opened at one door. Locale is picked the same way for both.
 */
function servePage(route?: DeepLinkRoute) {
  return (c: Context, next: Next) => {
    const locale = pickLocale(c.req.query('lang'), c.req.header('accept-language'));
    const html = readPage(pageFile(locale, route));

    if (html === null) {
      return next();
    }

    c.header('Content-Language', locale);
    c.header('Vary', 'Accept-Language');
    // Assets are content-hashed; the page itself must revalidate to pick them up.
    c.header('Cache-Control', 'no-cache');
    return c.html(html);
  };
}

app.get('/', servePage());
for (const route of DEEP_LINK_ROUTES) {
  app.get(`/${route}`, servePage(route));
}

/** A permanent redirect that keeps a supported ?lang= and drops anything else. */
function redirectTo(path: string) {
  return (c: Context) => {
    const lang = c.req.query('lang');
    const query = lang === 'es' || lang === 'en' ? `?lang=${lang}` : '';
    return c.redirect(`${path}${query}`, 301);
  };
}

app.get('/manifesto', redirectTo('/'));
// The English spellings people will guess, onto the one address per door.
app.get('/hackathon', redirectTo('/hackaton'));
app.get('/workshops', redirectTo('/talleres'));

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

/**
 * The socket address, for development, where nothing is in front of the
 * server. In production the address comes from Deflect's headers instead.
 */
function remoteAddress(c: Context): string | null {
  const env = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
  return env?.incoming?.socket?.remoteAddress ?? null;
}

/**
 * Five posts a minute per visitor. Runs before the body is read, so a flood
 * costs a header lookup rather than a parse and a MailerLite call.
 */
const rateLimitSubscribe = async (c: Context, next: Next) => {
  const ip = clientIp((name) => c.req.header(name), remoteAddress(c));
  const decision = subscribeLimiter.check(ip);

  if (!decision.allowed) {
    c.header('Retry-After', String(decision.retryAfterSeconds));
    return c.json({ ok: false, reason: 'rate-limited' }, 429);
  }

  return next();
};

app.post(
  '/api/subscribe',
  rateLimitSubscribe,
  bodyLimit({ maxSize: 2 * 1024 }),
  async (c) => {
    // Content-Type enforcement
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return c.json({ error: 'unsupported media type' }, 415);
    }

    // Origin check (only enforced when SITE_ORIGIN env var is set).
    // A missing Origin is refused too: browsers always send it on a
    // cross-origin POST, so only a non-browser caller arrives without one.
    const siteOrigin = process.env.SITE_ORIGIN;
    if (siteOrigin && c.req.header('origin') !== siteOrigin) {
      return c.json({ error: 'forbidden' }, 403);
    }

    // Malformed JSON is a client mistake, not a server fault: say 400 rather
    // than letting the parse throw its way to a 500.
    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ ok: false, reason: 'invalid-json' }, 400);
    }

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
    // The two optional answers, capped and stripped the way name is.
    const city = typeof body.city === 'string'
      ? body.city.trim().slice(0, 100).replace(/<[^>]*>/g, '')
      : '';
    const delegate = typeof body.delegate === 'string'
      ? body.delegate.trim().slice(0, 200).replace(/<[^>]*>/g, '')
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
        city: city || undefined,
        delegate: delegate || undefined,
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

/**
 * Everything under /assets is content-hashed by the build, and the fonts and
 * the talk poster change only when their file name does, so a repeat visit on
 * a metered connection should not pay for them twice. The page itself is not
 * covered: it revalidates (see the handler above) so it can pick up new assets.
 */
app.use('/assets/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=31536000, immutable');
});

app.use('/fonts/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=31536000, immutable');
});

// Static file serving — must be last
app.use('*', serveStatic({ root: './dist' }));
