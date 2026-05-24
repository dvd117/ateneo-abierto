# Next steps

## While waiting for Deflect

1. Settle the subscribe provider path.
   - MailerLite is the current provider path.
   - Brevo was discarded after account suspension.
   - Public sender should wait until domain/mailbox decisions are ready.
   - The app already posts to `/api/subscribe`; production still needs a real MailerLite API key and live subscription test.

2. Decide the final production URL.
   - Likely root: `https://ateneo-abierto.org/`
   - Optional event path: `/oslo`
   - The QR code should point to the durable URL, not a temporary preview URL.

3. Prepare slide assets.
   - Use the wordmark-first reveal treatment.
   - Use a high-contrast QR panel.
   - Test scanning from stage distance.

4. Review copy.
   - Spanish is source voice.
   - English is adapted for Oslo/international readers.
   - Keep operational details off the page.

5. Decide whether to include a short David bio.
   - Current version omits it.
   - If added, keep it short and avoid exposing operational details.

## After Deflect is ready

1. Decide whether to cut over from temporary Cloudflare DNS/CDN to Deflect.
2. Confirm NS propagation if cutting over.
3. Configure the hosting target.
4. Build the app with `npm run build`.
5. Deploy the Hono server with `dist/` assets.
6. Verify `/?lang=es`, `/?lang=en`, `/manifesto?lang=es`, and `/manifesto?lang=en` live.
7. Configure MailerLite production credentials.
8. Test a real subscription.
9. Generate the final QR code.
10. Test the QR code from the actual slide.
