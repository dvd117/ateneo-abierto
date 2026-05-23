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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      return c.json({ ok: true });
    }

    // Input validation
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = typeof body.name === 'string'
      ? body.name.trim().slice(0, 100).replace(/<[^>]*>/g, '')
      : '';

    if (!email || !emailPattern.test(email) || email.length > 254) {
      return c.json({ ok: false, reason: 'invalid-email' }, 400);
    }

    const apiKey = process.env.MAILERLITE_API_KEY ?? '';

    try {
      await addSubscriber({ email, name: name || undefined }, apiKey);
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'invalid-email') {
        return c.json({ ok: false, reason: 'invalid-email' }, 422);
      }
      return c.json({ ok: false, reason: 'provider-error' }, 502);
    }
  }
);

// Static file serving — must be last
app.use('*', serveStatic({ root: './dist' }));
