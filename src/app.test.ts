import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { app, loadStyleHashes, pickLocale } from './app';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  test('returns 200 with ok:true', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe('security headers', () => {
  test('all responses include required security headers', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.get('strict-transport-security')).toBe('max-age=31536000; includeSubDomains');
  });
});

describe('static app routes', () => {
  test('redirects the retired manifesto route to home', async () => {
    const res = await app.request('/manifesto');

    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/');
  });

  test('preserves supported locales when redirecting the retired manifesto route', async () => {
    const res = await app.request('/manifesto?lang=es');

    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/?lang=es');
  });

  test('drops unsupported locales when redirecting the retired manifesto route', async () => {
    const res = await app.request('/manifesto?lang=fr');

    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/');
  });
});

describe('POST /api/subscribe', () => {
  const validBody = JSON.stringify({
    email: 'user@example.com',
    name: 'User',
    newsletterLocale: 'es',
    website: ''
  });
  const jsonHeaders = { 'Content-Type': 'application/json' };

  afterEach(() => {
    delete process.env.MAILERLITE_GROUP_ES_ID;
    delete process.env.MAILERLITE_GROUP_EN_ID;
    delete process.env.MAILERLITE_PARTICIPATE_ES_ID;
    delete process.env.MAILERLITE_PARTICIPATE_EN_ID;
  });

  test('returns 200 ok:true for valid input', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 201 })));

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: validBody,
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test('routes Spanish subscribers to the Spanish MailerLite group', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        email: 'user@example.com',
        name: 'User',
        newsletterLocale: 'es',
        website: ''
      }),
    });

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { name: 'User', preferred_language: 'es' },
      groups: ['group-es'],
    });
  });

  test('routes English subscribers to the English MailerLite group', async () => {
    process.env.MAILERLITE_GROUP_EN_ID = 'group-en';
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        email: 'user@example.com',
        newsletterLocale: 'en',
        website: ''
      }),
    });

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { preferred_language: 'en' },
      groups: ['group-en'],
    });
  });

  test('adds participate group when participate is true and env var is set', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    process.env.MAILERLITE_PARTICIPATE_ES_ID = 'participate-es';
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'user@example.com', newsletterLocale: 'es', participate: true, website: '' }),
    });

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.groups).toEqual(['group-es', 'participate-es']);
    expect(body.fields.participation_interest).toBe('yes');
  });

  test('omits participate group when participate is true but env var is not set', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'user@example.com', newsletterLocale: 'es', participate: true, website: '' }),
    });

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.groups).toEqual(['group-es']);
  });

  test('does not add participate group when participate is false', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    process.env.MAILERLITE_PARTICIPATE_ES_ID = 'participate-es';
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'user@example.com', newsletterLocale: 'es', participate: false, website: '' }),
    });

    expect(res.status).toBe(200);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.groups).toEqual(['group-es']);
    expect(body.fields.participation_interest).toBeUndefined();
  });

  test('returns 400 for missing newsletter language', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'user@example.com', website: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid newsletter language', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'user@example.com', newsletterLocale: 'fr', website: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 200 ok:true silently when honeypot is filled (bot trap)', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'bot@example.com', website: 'http://spam.com' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('returns 400 for missing email', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'No Email', website: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid email format', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'not-an-email', website: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for email longer than 254 characters', async () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: longEmail, website: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 415 when Content-Type is not application/json', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: validBody,
    });
    expect(res.status).toBe(415);
  });

  test('returns 413 when body exceeds 2KB', async () => {
    const bigBody = JSON.stringify({ email: 'user@example.com', name: 'x'.repeat(3000), website: '' });
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: bigBody,
    });
    expect(res.status).toBe(413);
  });

  test('returns 403 when Origin does not match SITE_ORIGIN', async () => {
    const original = process.env.SITE_ORIGIN;
    process.env.SITE_ORIGIN = 'https://ateneabierto.org';

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { ...jsonHeaders, Origin: 'https://evil.com' },
      body: validBody,
    });

    expect(res.status).toBe(403);
    if (original !== undefined) {
      process.env.SITE_ORIGIN = original;
    } else {
      delete process.env.SITE_ORIGIN;
    }
  });

  test('returns 422 when MailerLite reports invalid email', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 422 }))
    );

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', newsletterLocale: 'es', website: '' }),
    });

    expect(res.status).toBe(422);
    const body = await res.json() as { ok: boolean; reason: string };
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('invalid-email');
  });

  test('returns 502 when MailerLite call fails', async () => {
    process.env.MAILERLITE_GROUP_ES_ID = 'group-es';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: validBody,
    });
    expect(res.status).toBe(502);
  });
});

describe('language of the home page', () => {
  test('an explicit ?lang= wins over the browser', () => {
    expect(pickLocale('en', 'es-VE,es;q=0.9')).toBe('en');
    expect(pickLocale('es', 'en-US,en;q=0.9')).toBe('es');
  });

  test('follows the browser preference order, then defaults to Spanish', () => {
    expect(pickLocale(undefined, 'en-US,en;q=0.9')).toBe('en');
    expect(pickLocale(undefined, 'es-VE,es;q=0.9,en;q=0.8')).toBe('es');
    expect(pickLocale(undefined, 'fr-FR, en;q=0.5')).toBe('en');
    expect(pickLocale(undefined, 'en;q=0.4, es;q=0.7')).toBe('es');
    expect(pickLocale(undefined, 'de-DE')).toBe('es');
    expect(pickLocale(undefined, undefined)).toBe('es');
    expect(pickLocale('fr', undefined)).toBe('es');
  });

  test('ignores languages the visitor refused with q=0', () => {
    expect(pickLocale(undefined, 'en;q=0, es;q=0.1')).toBe('es');
  });
});

describe('prerendered home page', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ateneo-dist-'));
  const esHash = "'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='";
  let pagesApp: typeof app;

  beforeAll(async () => {
    // Over the 1 KB compression threshold, like the real page.
    writeFileSync(
      join(dir, 'index.html'),
      `<html lang="es"><body>Deja de preguntarle.${'<p>relleno</p>'.repeat(200)}</body></html>`
    );
    writeFileSync(join(dir, 'index.en.html'), '<html lang="en"><body>Stop asking it things.</body></html>');
    writeFileSync(
      join(dir, 'csp.json'),
      JSON.stringify({ styleSrc: [esHash, "'unsafe-inline'", 'https://evil.example'] })
    );

    vi.resetModules();
    process.env.DIST_DIR = dir;
    ({ app: pagesApp } = await import('./app'));
  });

  afterAll(() => {
    delete process.env.DIST_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  test('serves Spanish by default, with the headers a cache needs', async () => {
    const res = await pagesApp.request('/');

    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Deja de preguntarle.');
    expect(res.headers.get('content-language')).toBe('es');
    expect(res.headers.get('vary')).toContain('Accept-Language');
    expect(res.headers.get('cache-control')).toBe('no-cache');
  });

  test('gzips the page for clients that accept it', async () => {
    const res = await pagesApp.request('/', { headers: { 'Accept-Encoding': 'gzip' } });

    expect(res.headers.get('content-encoding')).toBe('gzip');
  });

  test('serves English for ?lang=en and for an English browser', async () => {
    const byQuery = await pagesApp.request('/?lang=en');
    expect(await byQuery.text()).toContain('Stop asking it things.');

    const byBrowser = await pagesApp.request('/', { headers: { 'Accept-Language': 'en-GB,en;q=0.9' } });
    expect(await byBrowser.text()).toContain('Stop asking it things.');
    expect(byBrowser.headers.get('content-language')).toBe('en');
  });

  test('allows inline CSS by exact hash only, never by unsafe-inline', async () => {
    const res = await pagesApp.request('/');
    const csp = res.headers.get('content-security-policy') ?? '';

    expect(csp).toContain(`style-src 'self' ${esHash}`);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('evil.example');
  });

  test('reads no hashes when csp.json is missing or malformed', () => {
    expect(loadStyleHashes(join(dir, 'nowhere'))).toEqual([]);
    expect(loadStyleHashes(dir)).toEqual([esHash]);
  });
});

