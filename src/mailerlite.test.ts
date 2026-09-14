import { describe, test, expect, vi, afterEach } from 'vitest';
import { addSubscriber, buildFields, DELEGATE_TASK_FIELD, SEND_DELEGATE_TASK } from './mailerlite';

const API_KEY = 'test-key';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('addSubscriber', () => {
  test('calls the MailerLite v3 API with correct headers and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      name: 'User',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${API_KEY}`);
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { name: 'User', preferred_language: 'es' },
      groups: ['group-es'],
    });
  });

  test('includes English group and preferred language', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'en',
      groups: ['group-en']
    }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { preferred_language: 'en' },
      groups: ['group-en'],
    });
  });

  test('resolves on 200 (subscriber already exists, updated)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    await expect(addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY)).resolves.toBeUndefined();
  });

  test('resolves on 201 (subscriber created)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 201 })));
    await expect(addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY)).resolves.toBeUndefined();
  });

  test('throws "invalid-email" on 422', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 422 })));
    await expect(addSubscriber({
      email: 'bad@email',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY)).rejects.toThrow('invalid-email');
  });

  test('throws on any other error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    await expect(addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY)).rejects.toThrow('mailerlite-error:');
  });

  test('omits fields.name when name is not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.fields).toEqual({ preferred_language: 'es' });
  });

  test('passes an abort signal so the request can time out', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es']
    }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test('throws "mailerlite-timeout" when the upstream call times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
          });
        })
    ));

    await expect(
      addSubscriber(
        { email: 'user@example.com', newsletterLocale: 'es', groups: ['group-es'] },
        API_KEY,
        10
      )
    ).rejects.toThrow('mailerlite-timeout');
  });

  test('sends multiple groups and participation_interest field when participationInterest is true', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es', 'participate-es'],
      participationInterest: true,
    }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'user@example.com',
      fields: { preferred_language: 'es', participation_interest: 'yes' },
      groups: ['group-es', 'participate-es'],
    });
  });

  test('sends the city to the built-in field and the delegate answer to its custom field', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', mockFetch);

    await addSubscriber({
      email: 'user@example.com',
      newsletterLocale: 'es',
      groups: ['group-es'],
      city: 'Maracay',
      delegate: 'Los informes de fin de mes',
    }, API_KEY);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).fields).toEqual({
      preferred_language: 'es',
      city: 'Maracay',
      delegate_task: 'Los informes de fin de mes',
    });
  });
});

describe('buildFields', () => {
  const input = {
    email: 'user@example.com',
    newsletterLocale: 'es' as const,
    groups: ['group-es'],
    delegate: 'Los informes de fin de mes',
  };

  test('sends delegate_task by default now that the custom field exists', () => {
    // The field was created in MailerLite on 2026-09-14.
    expect(SEND_DELEGATE_TASK).toBe(true);
    expect(buildFields(input)).toHaveProperty(DELEGATE_TASK_FIELD, 'Los informes de fin de mes');
  });

  test('keeps delegate_task out when the flag is off', () => {
    expect(buildFields(input, { sendDelegateTask: false })).not.toHaveProperty(DELEGATE_TASK_FIELD);
  });

  test('sends delegate_task once the flag is on', () => {
    expect(DELEGATE_TASK_FIELD).toBe('delegate_task');
    expect(buildFields(input, { sendDelegateTask: true })).toEqual({
      preferred_language: 'es',
      delegate_task: 'Los informes de fin de mes',
    });
  });

  test('sends nothing for empty optional answers', () => {
    expect(buildFields({ ...input, delegate: '', city: '' }, { sendDelegateTask: true })).toEqual({
      preferred_language: 'es',
    });
  });
});
