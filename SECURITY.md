# Reporting a security problem

Write to **ateneo@aragort.com**. Say what you found, how to reproduce it, and
what you think it lets someone do. You will get an answer within a week; if you
do not, assume the mail went astray and send it again.

Please do not open a public issue for anything that could be used before it is
fixed.

This is a landing page for a small civil society project, maintained by one
person. There is no bounty and no formal SLA — what there is, is that a real
report gets read and acted on, and that you will be credited if you want to be.

## What is in scope

This repository and what it serves at `ateneo-abierto.org`. In practice the
interesting surface is small:

- `POST /api/subscribe` — the only endpoint that takes input or costs anything
  to call. Rate limiting, the origin check, input handling, the MailerLite call.
- The response headers, including the Content-Security-Policy the server builds
  from the prerender's style hashes.
- The build: `scripts/vite-prerender.ts` writes the HTML the server sends.

## What is not

- The CDN and the host. Report those to their operators.
- MailerLite itself.
- Anything that needs a stolen credential, physical access, or a compromised
  maintainer machine to begin with.
- Reports from an automated scanner with nothing behind them — missing headers
  a scanner flags on a page that has no session and no login, weak TLS ciphers
  the CDN chose, a version number in a banner. If you think one of these is
  actually exploitable here, show the exploit and it is in scope.

## What the site knows about a visitor

So you know what is worth protecting: an email address, optionally a first name,
a city and one free-text answer, all of it typed into the subscribe form by the
person themselves, and all of it forwarded to MailerLite. There are no accounts,
no sessions, no cookies set by this app, and no analytics.
