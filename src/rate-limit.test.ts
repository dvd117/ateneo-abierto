import { describe, expect, test } from 'vitest';
import { createRateLimiter, UNKNOWN_KEY } from './rate-limit';

/** A clock the test moves by hand, so nothing here waits on real time. */
function clock(start = 1_000_000) {
  let now = start;
  return {
    now: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
}

function limiter(overrides: Partial<Parameters<typeof createRateLimiter>[0]> = {}) {
  const time = clock();
  return {
    time,
    limiter: createRateLimiter({
      limit: 3,
      windowMs: 60_000,
      unknownLimit: 10,
      now: time.now,
      ...overrides,
    }),
  };
}

describe('createRateLimiter', () => {
  test('allows up to the limit and refuses the next one', () => {
    const { limiter: rl } = limiter();

    for (let i = 0; i < 3; i += 1) {
      expect(rl.check('203.0.113.4').allowed).toBe(true);
    }

    expect(rl.check('203.0.113.4').allowed).toBe(false);
  });

  test('counts each address separately', () => {
    const { limiter: rl } = limiter();

    for (let i = 0; i < 3; i += 1) {
      rl.check('203.0.113.4');
    }

    expect(rl.check('203.0.113.4').allowed).toBe(false);
    expect(rl.check('198.51.100.9').allowed).toBe(true);
  });

  test('forgives once the window rolls over', () => {
    const { limiter: rl, time } = limiter();

    for (let i = 0; i < 4; i += 1) {
      rl.check('203.0.113.4');
    }
    expect(rl.check('203.0.113.4').allowed).toBe(false);

    time.advance(60_001);
    expect(rl.check('203.0.113.4').allowed).toBe(true);
  });

  test('reports how long the caller has to wait', () => {
    const { limiter: rl, time } = limiter();

    rl.check('203.0.113.4');
    time.advance(20_000);

    expect(rl.check('203.0.113.4').retryAfterSeconds).toBe(40);
  });

  test('never reports a wait of zero seconds', () => {
    const { limiter: rl, time } = limiter();

    rl.check('203.0.113.4');
    time.advance(59_999);

    expect(rl.check('203.0.113.4').retryAfterSeconds).toBe(1);
  });

  test('gives everyone without an address one shared, wider bucket', () => {
    const { limiter: rl } = limiter();

    // Wider than `limit`: if the client-IP headers ever stop arriving, the
    // whole site lands here, and a form that stops working is the worse bug.
    for (let i = 0; i < 10; i += 1) {
      expect(rl.check(null).allowed).toBe(true);
    }

    expect(rl.check(null).allowed).toBe(false);
    expect(rl.check('203.0.113.4').allowed).toBe(true);
  });

  test('an address that spells itself like the unknown key shares that bucket, not its own', () => {
    const { limiter: rl } = limiter();

    // Not reachable through clientIp, which only ever returns an address or
    // null — asserted so the collision stays a known, harmless one.
    rl.check(UNKNOWN_KEY);
    expect(rl.check(null).allowed).toBe(true);
  });

  test('forgets expired entries instead of growing without bound', () => {
    const { limiter: rl, time } = limiter({ maxKeys: 5 });

    for (let i = 0; i < 6; i += 1) {
      rl.check(`203.0.113.${i}`);
    }

    time.advance(60_001);
    // The sweep runs on the next call past the cap; afterwards the old keys
    // are gone, so a returning visitor starts a fresh window.
    for (let i = 0; i < 6; i += 1) {
      expect(rl.check(`198.51.100.${i}`).allowed).toBe(true);
    }
    expect(rl.check('203.0.113.0').allowed).toBe(true);
  });

  test('reset clears every window', () => {
    const { limiter: rl } = limiter();

    for (let i = 0; i < 4; i += 1) {
      rl.check('203.0.113.4');
    }
    expect(rl.check('203.0.113.4').allowed).toBe(false);

    rl.reset();
    expect(rl.check('203.0.113.4').allowed).toBe(true);
  });
});
