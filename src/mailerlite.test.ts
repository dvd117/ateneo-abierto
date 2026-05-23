import { describe, test, expect, vi, afterEach } from 'vitest';
import { addSubscriber } from './mailerlite';

const API_KEY = 'test-key';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('addSubscriber', () => {
  test('calls the MailerLite v3 API with correct headers and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({ email: 'user@example.com', name: 'User' }, API_KEY);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${API_KEY}`);
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { name: 'User' },
    });
  });

  test('resolves on 200 (subscriber already exists, updated)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    await expect(addSubscriber({ email: 'user@example.com' }, API_KEY)).resolves.toBeUndefined();
  });

  test('resolves on 201 (subscriber created)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 201 })));
    await expect(addSubscriber({ email: 'user@example.com' }, API_KEY)).resolves.toBeUndefined();
  });

  test('throws "invalid-email" on 422', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })));
    await expect(addSubscriber({ email: 'bad@email' }, API_KEY)).rejects.toThrow('invalid-email');
  });

  test('throws on any other error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    await expect(addSubscriber({ email: 'user@example.com' }, API_KEY)).rejects.toThrow('mailerlite-error:');
  });

  test('omits fields.name when name is not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({ email: 'user@example.com' }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.fields).toBeUndefined();
  });
});
