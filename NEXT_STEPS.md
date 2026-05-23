# Next steps

## While waiting for Deflect

1. Settle the subscribe provider path.
   - Brevo account exists.
   - Public sender should wait until domain/mailbox decisions are ready.
   - The app can keep the provider-ready placeholder meanwhile.

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

1. Confirm NS propagation.
2. Configure the hosting target.
3. Build the static site with `npm run build`.
4. Deploy `dist/`.
5. Verify `/?lang=es` and `/?lang=en` live.
6. Wire Brevo or the chosen subscribe provider.
7. Test a real subscription.
8. Generate the final QR code.
9. Test the QR code from the actual slide.
