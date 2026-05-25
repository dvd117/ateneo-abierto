# Ateneo Abierto

Launch site for Ateneo Abierto.

## Current status

- Vite + TypeScript frontend served by a small Hono Node server in production.
- Wordmark-first visual identity based on the Civic Hearth direction.
- Bilingual Spanish/English copy.
- Landing page plus full manifesto route at `/manifesto`.
- Locale behavior:
  - `?lang=es` and `?lang=en` override everything.
  - Saved language preference is stored in `localStorage`.
  - Browser language is used when there is no override or saved preference.
  - English is the fallback.
- Subscribe form posts to the Hono `/api/subscribe` endpoint and uses MailerLite.
- DNS is temporarily on Cloudflare while Deflect account/NS setup remains blocked.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The dev command runs Vite for the frontend and the Hono server for `/api/*`; Vite proxies API requests to `localhost:3000`.

Useful scripts:

```bash
npm run dev        # Vite frontend + Hono API server
npm run dev:ui     # Vite frontend only
npm run dev:server # Hono API server only
npm run start      # run the Hono server against built dist/ assets
```

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

Run both before shipping. For release checks, also verify `/`, `/manifesto`, `?lang=es`, `?lang=en`, `/api/health`, and one real subscribe flow with production credentials.

## Subscribe integration

The client uses `mailerliteProvider` in `src/subscribe.ts`, which posts to `/api/subscribe`.
The server sanitizes input, rejects invalid emails, uses a honeypot field, enforces JSON content,
and calls MailerLite through `src/mailerlite.ts`.

Required environment:

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
- Final production URL for the Oslo QR code.
- Production MailerLite API key and live subscribe test.
- QR scan test from slide distance.

## Project files

- `src/content.ts`: bilingual copy.
- `src/locale.ts`: locale detection and URL/localStorage behavior.
- `src/subscribe.ts`: client-side subscribe validation and `/api/subscribe` provider.
- `src/mailerlite.ts`: MailerLite API adapter.
- `src/app.ts`: Hono app, security headers, health check, subscribe endpoint, and static serving.
- `src/server.ts`: Node server entry point and crash handlers.
- `src/main.ts`: page rendering and form/toggle behavior.
- `src/styles.css`: visual identity and responsive layout.
- `src/*.test.ts`: unit and safety tests.
- `public/`: favicon, avatar, OG images, and self-hosted fonts.
- `scripts/render-brand-assets.sh`: regenerate PNG brand assets from SVG sources.
- `DESIGN.md`: public visual identity reference.
- `agent_docs/`: local agent-facing content, deployment, and structure notes.
