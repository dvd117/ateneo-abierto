# Ateneo Abierto

The site for [Ateneo Abierto](https://ateneo-abierto.org) — a Venezuelan civil
society initiative teaching AI literacy to people that subscription paywalls and
geo-restrictions leave out. One page, in Spanish and English, with a door for
each of the three things it runs.

Vite and TypeScript for the page, a small [Hono](https://hono.dev) server for
`/api/*` and for the prerendered HTML. No framework, no external request from
the page: the fonts, the map and the talk poster are all vendored.

## Run it

```bash
npm install
npm run dev
```

Vite prints a local URL and proxies `/api/*` to the Hono server on port 3000.

```bash
npm run dev        # the page and the API together
npm run dev:ui     # the page alone
npm run dev:server # the API alone
npm start          # the Hono server against a built dist/
```

The subscribe form needs the environment below. Without it the server refuses to
start rather than accepting signups it cannot deliver.

```bash
cp .env.example .env
```

| Variable | Required | What it is |
| --- | --- | --- |
| `MAILERLITE_API_KEY` | yes | MailerLite v3 key |
| `MAILERLITE_GROUP_ES_ID` | yes | group for Spanish subscribers |
| `MAILERLITE_GROUP_EN_ID` | yes | group for English subscribers |
| `MAILERLITE_PARTICIPATE_ES_ID` | no | subscribers who ticked "I want to take part" |
| `MAILERLITE_PARTICIPATE_EN_ID` | no | the same, in English |
| `SITE_ORIGIN` | in production | the origin allowed to post to `/api/subscribe` |
| `PORT` | no | defaults to 3000 |

## Check it

```bash
npm test
npm run build
```

Both before shipping. The suite covers the copy, the locale rules, the prerender
and the API; `src/source-safety.test.ts` also asserts the things that are easy
to break by accident — that the page loads nothing from a third party, that the
design tokens match `DESIGN.md`, and that the runtime image copies every file
the server imports.

## How it fits together

| File | What it holds |
| --- | --- |
| `src/content.ts` | every word on the page, both languages |
| `src/render.ts` | the page as HTML, from that content |
| `src/locale.ts` | `?lang=`, saved preference, browser language, in that order |
| `src/main.ts` | the behaviour a browser adds on top |
| `src/app.ts` | Hono: security headers, pages, `/api/subscribe`, static files |
| `src/client-ip.ts` | who is asking, from behind the CDN |
| `src/rate-limit.ts` | how often one visitor may ask |
| `src/mailerlite.ts` | the MailerLite call |
| `src/server.ts` | the Node entry point and its crash handlers |
| `src/styles.css` | the visual identity, generated in part from `DESIGN.md` |
| `scripts/vite-prerender.ts` | writes the finished page into the HTML at build time |
| `DESIGN.md` | the visual direction, and the source of truth for colour |
| `mail/` | the welcome emails |

### Addresses

`/` is the page. `/demos`, `/talleres` and `/hackaton` are the same page
opened at one door, each with its own title and link preview. `/hackathon` and
`/workshops` redirect to the Spanish spellings; `/manifesto` is retired and
redirects home. `?lang=es` and `?lang=en` override everything.

### The page is prerendered

`npm run build` renders every route and locale into its own HTML file and
inlines the stylesheet, so the first response is the finished page rather than
an empty `<div>` and a wait for two more files. The server picks the right file
from `?lang=` and `Accept-Language`.

Inline CSS is allowed by exact SHA-256 hash, never by `'unsafe-inline'`: the
build writes the hashes to `dist/csp.json` and the server reads them into the
Content-Security-Policy.

## Deploying

`docker compose up` builds the image and serves it on port 3000, with Traefik
labels for the production host.

Dokploy watches the `production` branch, not `main`. Pushing to `main` runs CI;
only once the tests, the image build and its smoke boot all pass does the `ship`
job fast-forward `production`, and that is what triggers the deploy. So a red
build never reaches the site, and `production` never moves by hand — the push is
fast-forward only and fails loudly rather than overwriting what is live.

### Preview: `dev` → dev.aragort.com

A second Dokploy environment, `dev`, runs the same `docker-compose.yml` from the
`dev` branch and deploys on every push to it. Work lands in `dev` by pull request;
`main`, and so production, moves only when `dev` is promoted. The preview sets
these variables, and production sets none of them:

| Variable | Preview value | Why |
| --- | --- | --- |
| `ROUTER_ID` | `ateneo-dev` | Traefik router, service and middleware names. Same-named services from two containers can be load-balanced together, which would send production visitors to the preview. |
| `PUBLIC_HOST` | `dev.aragort.com` | The host both routers match. |
| `SITE_ORIGIN` | `https://dev.aragort.com` | The subscribe endpoint's origin check. |
| `NOINDEX` | `1` | `X-Robots-Tag: noindex, nofollow` on every response and a disallow-all `robots.txt`. |
| `MAILERLITE_DRY_RUN` | `1` | The form validates and answers ok; MailerLite is never called. |
| `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ES_ID`, `MAILERLITE_GROUP_EN_ID` | any dummy value | The server refuses to boot without them. |

Fill the preview's variables only once its `dev` branch carries the
`ROUTER_ID` labels: before that, a healthy preview container would share
production's router names.

## Licence

Code is [MIT](LICENSE). The words, the visual direction and the project's own
images are [CC BY-SA 4.0](LICENSE-CONTENT.md). The name and the mark are not
covered by either. The fonts in `public/fonts/` carry their own licences.

Security reports: [SECURITY.md](SECURITY.md).
