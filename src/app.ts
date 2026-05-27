import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { bodyLimit } from 'hono/body-limit';
import { addSubscriber } from './mailerlite';

export const app = new Hono();

app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  })
);

app.get('/api/health', (c) => c.json({ ok: true }));

// TEMP: remove after debugging rate limit IP detection
app.get('/api/debug-ip', (c) => c.json({
  'x-forwarded-for': c.req.header('x-forwarded-for'),
  'x-real-ip': c.req.header('x-real-ip'),
  'cf-connecting-ip': c.req.header('cf-connecting-ip'),
  remoteAddr: c.env?.incoming?.socket?.remoteAddress,
}));

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
