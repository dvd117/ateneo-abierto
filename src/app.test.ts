import { describe, test, expect, vi, afterEach } from 'vitest';
import { app } from './app';

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
  });
});

describe('POST /api/subscribe', () => {
  const validBody = JSON.stringify({ email: 'user@example.com', name: 'User', website: '' });
  const jsonHeaders = { 'Content-Type': 'application/json' };

  test('returns 200 ok:true for valid input', async () => {
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

  test('returns 200 ok:true silently when honeypot is filled (bot trap)', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'bot@example.com', website: 'http://spam.com' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
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
    process.env.SITE_ORIGIN = original;
  });

  test('returns 502 when MailerLite call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));

    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: jsonHeaders,
      body: validBody,
    });
    expect(res.status).toBe(502);
  });
});
