/**
 * A fixed-window counter, per visitor, in front of the one endpoint that costs
 * something to call.
 *
 * Every accepted POST to /api/subscribe spends a MailerLite API call and can
 * put an address on a real list. With the source public, the honeypot field
 * name, the body cap and the validation are all readable, so "a bot will not
 * guess the form" stops being an argument. This is the part that does not care
 * whether the caller read the source.
 *
 * Deliberately in the app rather than only at Traefik. The edge limiter is
 * still there as a second layer (see docker-compose.yml), but it is configured
 * per deployment and would be lost the day the site moves; this travels with
 * the code and is covered by tests.
 *
 * In-memory and per-process on purpose: one container serves this site, and a
 * shared store would be a dependency to run, back up and reason about for a
 * landing page.
 */

export type RateLimitDecision = {
  allowed: boolean;
  /** How long until the caller's window rolls over, in whole seconds. */
  retryAfterSeconds: number;
};

export type RateLimiterOptions = {
  /** Requests allowed per window for one key. */
  limit: number;
  windowMs: number;
  /**
   * Requests allowed per window for everyone whose address could not be
   * established, together. Wider than `limit` on purpose: if Deflect's
   * client-IP headers ever stop arriving, every visitor collapses into this one
   * bucket, and a limiter that turns a CDN change into an outage of the signup
   * form is worse than the abuse it prevents.
   */
  unknownLimit: number;
  /** Sweep expired entries once the table passes this many keys. */
  maxKeys?: number;
  now?: () => number;
};

export type RateLimiter = {
  check(key: string | null): RateLimitDecision;
  reset(): void;
};

/** The key every request without a usable address shares. */
export const UNKNOWN_KEY = '~unknown';

const DEFAULT_MAX_KEYS = 10_000;

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, unknownLimit, maxKeys = DEFAULT_MAX_KEYS, now = Date.now } = options;
  const windows = new Map<string, { count: number; expiresAt: number }>();

  function sweep(at: number): void {
    for (const [key, window] of windows) {
      if (window.expiresAt <= at) {
        windows.delete(key);
      }
    }
  }

  return {
    check(key) {
      const at = now();
      const bucket = key ?? UNKNOWN_KEY;
      const allowance = key === null ? unknownLimit : limit;

      if (windows.size > maxKeys) {
        sweep(at);
      }

      const existing = windows.get(bucket);
      const window = existing && existing.expiresAt > at
        ? existing
        : { count: 0, expiresAt: at + windowMs };

      window.count += 1;
      windows.set(bucket, window);

      return {
        allowed: window.count <= allowance,
        retryAfterSeconds: Math.max(1, Math.ceil((window.expiresAt - at) / 1000)),
      };
    },

    reset() {
      windows.clear();
    },
  };
}

/**
 * Five a minute, the same allowance the Traefik middleware carried before it
 * was removed. Nobody fills this form twice, let alone five times.
 */
export const subscribeLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
  unknownLimit: 60,
});
