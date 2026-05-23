# Ateneo Abierto

Launch landing page for Ateneo Abierto.

## Current status

- Static Vite + TypeScript landing page.
- Wordmark-first visual identity based on the Civic Hearth direction.
- Bilingual Spanish/English copy.
- Locale behavior:
  - `?lang=es` and `?lang=en` override everything.
  - Saved language preference is stored in `localStorage`.
  - Browser language is used when there is no override or saved preference.
  - English is the fallback.
- Subscribe form is provider-ready but not wired to Brevo yet.
- Deflect deployment is paused until NS/account setup is complete.

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
```

## Verify

```bash
npm test
npm run build
```

Current verification:

- `npm test`: 8 tests passing.
- `npm run build`: passing.
- Browser render checked in Chrome.

## Subscribe integration

The form currently uses `placeholderSubscribeProvider` in `src/subscribe.ts`.

When Brevo is ready:

1. Decide final public sender and list/audience in Brevo.
2. Add the minimal integration endpoint or embedded form adapter.
3. Replace `placeholderSubscribeProvider` with the Brevo adapter.
4. Keep the visible UI and success/error states unchanged.
5. Test a real subscription in both Spanish and English.

## Deployment notes

Deflect is expected to sit in front of the site once NS/account verification is complete.

Pending:

- Deflect account/domain verification.
- NS records fully propagated.
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
