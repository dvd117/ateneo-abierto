import { describe, expect, test } from 'vitest';
import { createSubscribeHandler } from './subscribe';

describe('createSubscribeHandler', () => {
  test('rejects invalid email addresses', async () => {
    const handler = createSubscribeHandler(async () => undefined);

    await expect(handler({ email: 'not-an-email' })).resolves.toEqual({
      ok: false,
      reason: 'invalid-email'
    });
  });

  test('submits valid email addresses through the provider adapter', async () => {
    const submitted: string[] = [];
    const handler = createSubscribeHandler(async ({ email }) => {
      submitted.push(email);
    });

    await expect(handler({ email: 'reader@example.org' })).resolves.toEqual({
      ok: true
    });
    expect(submitted).toEqual(['reader@example.org']);
  });

  test('returns provider failure when the adapter rejects', async () => {
    const handler = createSubscribeHandler(async () => {
      throw new Error('provider down');
    });

    await expect(handler({ email: 'reader@example.org' })).resolves.toEqual({
      ok: false,
      reason: 'provider-error'
    });
  });
});
