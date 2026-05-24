# Ateneo Abierto

Launch landing page for Ateneo Abierto.

## Current status

- Static Vite + TypeScript landing page.
- Wordmark-first visual identity based on the Civic Hearth direction.
- Bilingual Spanish/English copy.
- Landing page plus full manifesto route at `/manifesto`.
- Locale behavior:
  - `?lang=es` and `?lang=en` override everything.
  - Saved language preference is stored in `localStorage`.
  - Browser language is used when there is no override or saved preference.
  - English is the fallback.
- Subscribe form posts to the Hono `/api/subscribe` endpoint and uses MailerLite when `MAILERLITE_API_KEY` is configured.
- DNS is temporarily on Cloudflare while Deflect account/NS setup remains blocked.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Useful language URLs:

```text
/?lang=es
/?lang=en
/manifesto?lang=es
/manifesto?lang=en
```

## Verify

```bash
npm test
npm run build
```

Current verification:

- `npm test`: 31 tests passing.
- `npm run build`: passing.
- Local route checks for `/`, `/manifesto`, `?lang=es`, and `?lang=en`.

## Subscribe integration

The client uses `mailerliteProvider` in `src/subscribe.ts`, which posts to `/api/subscribe`.
The server sanitizes input, rejects invalid emails, uses a honeypot field, enforces JSON content,
and calls MailerLite through `src/mailerlite.ts`.

Required production environment:

```text
MAILERLITE_API_KEY=
SITE_ORIGIN=https://example.org
PORT=3000
```

## Deployment notes

Cloudflare is the temporary DNS/CDN path. Deflect remains the preferred protective CDN path once account verification and nameserver setup are available.

Pending:

- Deflect account/domain verification.
- Final Deflect vs Cloudflare cutover decision.
- Final hosting target.
- Final production URL for the Oslo QR code.
- QR scan test from slide distance.

## Project files

- `src/content.ts`: bilingual copy.
- `src/locale.ts`: locale detection and URL/localStorage behavior.
- `src/subscribe.ts`: provider-agnostic subscribe handler.
- `src/main.ts`: page rendering and form/toggle behavior.
- `src/styles.css`: visual identity and responsive layout.
- `src/*.test.ts`: unit tests for locale and subscribe behavior.
