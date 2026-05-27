import { afterEach, describe, expect, test, vi } from 'vitest';
import { createSubscribeHandler, mailerliteProvider } from './subscribe';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createSubscribeHandler', () => {
  test('rejects invalid email addresses', async () => {
    const handler = createSubscribeHandler(async () => undefined);

    await expect(handler({ email: 'not-an-email', newsletterLocale: 'es' })).resolves.toEqual({
      ok: false,
      reason: 'invalid-email'
    });
  });

  test('submits valid email addresses through the provider adapter', async () => {
    const submitted: string[] = [];
    const handler = createSubscribeHandler(async ({ email }) => {
      submitted.push(email);
    });

    await expect(handler({ email: 'reader@example.org', newsletterLocale: 'es' })).resolves.toEqual({
      ok: true
    });
    expect(submitted).toEqual(['reader@example.org']);
  });

  test('preserves newsletter language when submitting through the provider adapter', async () => {
    const submitted: string[] = [];
    const handler = createSubscribeHandler(async ({ newsletterLocale }) => {
      submitted.push(newsletterLocale);
    });

    await expect(handler({ email: 'reader@example.org', newsletterLocale: 'en' })).resolves.toEqual({
      ok: true
    });
    expect(submitted).toEqual(['en']);
  });

  test('returns provider failure when the adapter rejects', async () => {
    const handler = createSubscribeHandler(async () => {
      throw new Error('provider down');
    });

    await expect(handler({ email: 'reader@example.org', newsletterLocale: 'es' })).resolves.toEqual({
      ok: false,
      reason: 'provider-error'
    });
  });
});

describe('mailerliteProvider', () => {
  test('sends newsletter language to the subscribe API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    await mailerliteProvider({
      email: 'reader@example.org',
      name: 'Reader',
      newsletterLocale: 'es'
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'reader@example.org',
      name: 'Reader',
      newsletterLocale: 'es',
      participate: false,
      website: ''
    });
  });
});
