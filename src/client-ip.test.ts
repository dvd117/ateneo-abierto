import { describe, expect, test } from 'vitest';
import { clientIp, normalizeIp } from './client-ip';

/** Builds the `c.req.header` shape from a plain object, lowercasing names. */
function headers(values: Record<string, string>) {
  const lower = new Map(Object.entries(values).map(([k, v]) => [k.toLowerCase(), v]));
  return (name: string) => lower.get(name.toLowerCase());
}

describe('normalizeIp', () => {
  test('keeps a bare address of either family', () => {
    expect(normalizeIp('203.0.113.4')).toBe('203.0.113.4');
    expect(normalizeIp('2001:db8::1')).toBe('2001:db8::1');
  });

  test('strips the port, the brackets and the v4-in-v6 prefix', () => {
    expect(normalizeIp('203.0.113.4:51234')).toBe('203.0.113.4');
    expect(normalizeIp('[2001:db8::1]:443')).toBe('2001:db8::1');
    expect(normalizeIp('::ffff:203.0.113.4')).toBe('203.0.113.4');
  });

  test('refuses anything that is not an address, so junk cannot become a bucket', () => {
    for (const value of ['', '   ', 'unknown', '999.1.1.1', '203.0.113', 'drop table', null, undefined]) {
      expect(normalizeIp(value)).toBeNull();
    }
  });
});

describe('clientIp', () => {
  test("prefers Deflect's per-site header", () => {
    const ip = clientIp(headers({
      'True-Client-IP': '203.0.113.4',
      'X-Forwarded-For': '198.51.100.9',
      'X-Real-IP': '185.196.61.178',
    }));

    expect(ip).toBe('203.0.113.4');
  });

  test('accepts the X-Deflect-Client-IP spelling too', () => {
    expect(clientIp(headers({ 'X-Deflect-Client-IP': '203.0.113.4' }))).toBe('203.0.113.4');
  });

  test('never reads X-Real-IP, which holds the edge address on this infrastructure', () => {
    expect(clientIp(headers({ 'X-Real-IP': '185.196.61.178' }))).toBeNull();
  });

  test('reads X-Forwarded-For from the right, past anything the visitor sent ahead', () => {
    const ip = clientIp(headers({ 'X-Forwarded-For': '1.1.1.1, 203.0.113.4' }));

    expect(ip).toBe('203.0.113.4');
  });

  test('skips junk entries rather than bucketing by them', () => {
    expect(clientIp(headers({ 'X-Forwarded-For': '203.0.113.4, unknown' }))).toBe('203.0.113.4');
  });

  test('falls back to the socket only when no proxy header says', () => {
    expect(clientIp(headers({}), '::ffff:127.0.0.1')).toBe('127.0.0.1');
    expect(clientIp(headers({ 'True-Client-IP': '203.0.113.4' }), '127.0.0.1')).toBe('203.0.113.4');
  });

  test('says null rather than guessing', () => {
    expect(clientIp(headers({}), null)).toBeNull();
  });
});
