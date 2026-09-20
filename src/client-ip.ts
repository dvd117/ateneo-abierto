/**
 * Who is actually asking, from behind Deflect.
 *
 * In production this app sits behind Deflect CDN, which talks to Traefik v3 on
 * the VPS. Three things have to hold before a per-visitor rate limit means
 * anything, and all three are already true here:
 *
 *   1. The firewall only lets Deflect's edge IPs reach ports 80/443, from a
 *      list re-synced every 6h.
 *   2. Traefik's `forwardedHeaders.trustedIPs` is re-rendered from that same
 *      list, so it preserves a forwarded header only when the peer is an edge
 *      and overwrites it otherwise.
 *   3. Deflect's per-site "Additional Headers" put the visitor's address in
 *      `True-Client-IP` and `X-Deflect-Client-IP`.
 *
 * Two traps, both load-bearing:
 *
 * `X-Real-IP` carries the DEFLECT EDGE address on this infrastructure, not the
 * visitor. Reading it buckets the whole internet into ~31 edges. An earlier
 * attempt at this limit read it, looked broken, and was removed; the real fix
 * landed on the infrastructure side in July 2026.
 *
 * `X-Forwarded-For` is read from the RIGHT. A CDN that appends rather than
 * replaces leaves `<whatever the visitor sent>, <the visitor>` — so the
 * leftmost entry is attacker-chosen and the rightmost is the one the trusted
 * proxy wrote. This matches the `ipStrategy.depth=1` that the Traefik-level
 * limiter used, which was verified end-to-end against a live edge.
 */

/** Set by Deflect per site. A single address, never a list. */
const EDGE_HEADERS = ['true-client-ip', 'x-deflect-client-ip'] as const;

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6 = /^[0-9a-f:]+$/i;

/**
 * Trims what a proxy or a socket hands over down to a bare address, or null.
 * Rejects anything that is not an address so a junk header cannot become a
 * bucket key of its own.
 */
export function normalizeIp(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  let candidate = value.trim();
  if (!candidate) {
    return null;
  }

  // [2001:db8::1]:443 — the bracketed form node and proxies use for v6 + port.
  const bracketed = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) {
    candidate = bracketed[1];
  }

  // ::ffff:203.0.113.4 — a v4 address inside a v6 socket.
  const mapped = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) {
    candidate = mapped[1];
  }

  // 203.0.113.4:51234 — v4 with a port. A bare v6 also contains colons, so
  // only split when what is left of the last colon still looks like v4.
  const withPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (withPort) {
    candidate = withPort[1];
  }

  const v4 = candidate.match(IPV4);
  if (v4) {
    return v4.slice(1).every((octet) => Number(octet) <= 255 && !/^0\d/.test(octet))
      ? candidate
      : null;
  }

  // Loose on purpose: the limiter only needs a stable key, and rejecting a
  // valid v6 address would hand its owner an unlimited endpoint.
  return candidate.includes(':') && IPV6.test(candidate) ? candidate.toLowerCase() : null;
}

/**
 * The visitor's address, or null when nothing trustworthy says.
 *
 * `header` is Hono's `c.req.header`. `remoteAddress` is the socket address,
 * used only in development, where there is no proxy in front.
 */
export function clientIp(
  header: (name: string) => string | undefined,
  remoteAddress?: string | null
): string | null {
  for (const name of EDGE_HEADERS) {
    const ip = normalizeIp(header(name));
    if (ip) {
      return ip;
    }
  }

  const forwarded = header('x-forwarded-for');
  if (forwarded) {
    const entries = forwarded.split(',');
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const ip = normalizeIp(entries[i]);
      if (ip) {
        return ip;
      }
    }
  }

  return normalizeIp(remoteAddress);
}
