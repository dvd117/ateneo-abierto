---
version: alpha
name: Ateneo Abierto
description: Visual system for the Ateneo Abierto redesign. Direction D "Instrumento" on the Guacamaya palette. A dark warm-graphite page where a simulated desktop agent does office work in front of the visitor. One signal colour, macaw ochre. Warm paper appears only as the document the agent produces and as the lit library nodes on the map.
webgl: none
colors:
  graphite: "#16150f"
  graphite-deep: "#100f0b"
  graphite-panel: "#1f1d16"
  graphite-raise: "#302e26"
  graphite-line: "#34312a"
  bone: "#f0ece2"
  bone-soft: "#cfc9bb"
  bone-muted: "#a8a293"
  bone-dim: "#8e887a"
  guacamaya: "#e2a638"
  on-guacamaya: "#17130a"
  guacamaya-on-paper: "#8e610f"
  done-green: "#79ad9b"
  paper: "#f3eddf"
  ink: "#1a1714"
  ink-muted: "#6b604e"
  paper-line: "#d9d1c0"
color-aliases:
  c-bg: graphite
  c-bg-deep: graphite-deep
  c-bg-panel: graphite-panel
  c-bg-raise: graphite-raise
  c-fg: bone
  c-fg-2: bone-muted
  c-fg-3: bone-dim
  c-fg-soft: bone-soft
  c-accent: guacamaya
  c-on-accent: on-guacamaya
  c-done: done-green
  c-border: graphite-line
  c-paper: paper
  c-ink: ink
  c-ink-2: ink-muted
  c-paper-border: paper-line
  c-accent-on-paper: guacamaya-on-paper
surfaces:
  primary:
    bg: c-bg
    fg: c-fg
    muted: c-fg-2
    border: c-border
    accent: c-accent
  alt:
    bg: c-paper
    fg: c-ink
    muted: c-ink-2
    border: c-paper-border
    accent: c-accent-on-paper
typography:
  display:
    fontFamily: Source Serif 4, Iowan Old Style, Palatino, Georgia, serif
    fontSize: 3.4
    fluidMin: 2.1
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.012em"
  h1:
    fontFamily: Source Serif 4, Iowan Old Style, Palatino, Georgia, serif
    fontSize: 2.4
    fluidMin: 1.75
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Source Serif 4, Iowan Old Style, Palatino, Georgia, serif
    fontSize: 1.65
    fontWeight: 400
    lineHeight: 1.2
  h3:
    fontFamily: DM Sans, Avenir Next, Segoe UI, system-ui, sans-serif
    fontSize: 1.15
    fontWeight: 600
    lineHeight: 1.3
  lead:
    fontFamily: Source Serif 4, Iowan Old Style, Palatino, Georgia, serif
    fontSize: 1.2
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: DM Sans, Avenir Next, Segoe UI, system-ui, sans-serif
    fontSize: 1
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: DM Sans, Avenir Next, Segoe UI, system-ui, sans-serif
    fontSize: 0.8
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: DM Sans, Avenir Next, Segoe UI, system-ui, sans-serif
    fontSize: 0.75
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
    textTransform: uppercase
  wordmark:
    fontFamily: DM Sans, Avenir Next, Segoe UI, system-ui, sans-serif
    fontSize: 0.95
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
    textTransform: uppercase
  mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
    fontSize: 0.85
    fontWeight: 500
    lineHeight: 1.4
spacing:
  page: 1.5
  section: 6
  stack: 1
  inline: 0.5
  gap-lg: 2.5
  gap-md: 1.5
  gap-sm: 0.75
radius:
  none: 0
  sm: 0.25
  md: 0.5
  window: 0.875
  pill: 999
motion:
  ease-out: cubic-bezier(0.23, 1, 0.32, 1)
  ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
  duration-ui: 180ms
  duration-overlay: 240ms
  duration-step: 420ms
  duration-draw: 1200ms
---

# Ateneo Abierto

## Overview

Ateneo Abierto teaches people in Venezuela to delegate office work to AI agents, and points at a
network of public libraries as the place where that happens. The site has to convince two
audiences with one page: funders who need to see a serious, forward-looking program, and
Caracas participants who need to feel "I could do this today". The redesign (direction D,
"Instrumento", decided 2026-09-11) answers both with one object: a simulated desktop agent
window, in the visitor's language, doing the kind of work they already do. Everything else on
the page is quiet so that object can be loud.

The palette is **Guacamaya** (chosen 2026-09-11 over Arcilla and Farol): warm graphite base, the
gold of the blue-and-yellow macaws that cross Caracas every evening as the one signal, a muted
green only for "done", and warm paper reserved for two places: the document the agent produces
and the lit library nodes on the map. The ochre continues the previous identity's ochre, so this
is an evolution, not a rebrand.

**Single-theme on purpose.** The page is dark. `surfaces.alt` is not a light mode; it is the
paper surface used inside the agent window (the produced document) and on the map nodes. Never
offer a theme toggle.

## Audience conditions

- **Participants:** Caracas and other Venezuelan cities, mixed devices. Phones are the majority
  for reading; a modest laptop on an unstable connection is the build device. Mobile data is
  metered and slow; power cuts are ordinary.
- **Funders and allies:** laptops, good connections, often reading in English.
- **Threat model:** public program, public site. No participant data on the page. The intake
  form collects the minimum (name, city, what you do, what you would delegate). No third-party
  scripts, no external fonts, no analytics that phone home; the agent window is fully local
  and makes no requests.
- **Budget (from the handoff, to confirm):** first paint under 2 s on throttled 3G; core HTML +
  CSS under 100 KB; the interactive layer lazy-loaded and skipped under `saveData` and
  `prefers-reduced-motion`. `webgl: none` follows from all of the above.

## Identity architecture

One identity. The **wordmark is DM Sans**, semibold, uppercase, tracked (the `wordmark` role),
in text colour. The **staircase mark** (kept 2026-09-11) sits beside it at 22 px in the nav
and carries the favicon on its own. Three ascending steps: access, progression, the three time
horizons of the program.

### Mark spec

SVG path (viewBox `0 0 80 80`), unchanged from the previous identity:

```
<path d="M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20"
      stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
<rect x="52" y="12" width="8" height="8"/>
```

Colouring (two-colour, decided 2026-09-11):

| Context | Staircase | Dot | Background |
|---|---|---|---|
| Nav, dark page | `guacamaya` | `bone` | none |
| Favicon / avatar, dark | `guacamaya` | `bone` | `graphite-panel`, `rx 14` |
| Avatar on ochre | `on-guacamaya` | `bone` | `guacamaya`, `rx 14` |
| On paper (documents, print) | `guacamaya-on-paper` | `ink` | `paper` |

The `bone` dot on the ochre avatar is decorative and below text contrast; it is the only
place that pairing is allowed. The staircase never appears as decoration elsewhere: its
meaning is carried by structure (see Layout).

## Colours

- **Base.** `graphite` for the page, `graphite-deep` for bands that need to recede,
  `graphite-panel` for the agent window and cards, `graphite-raise` for the one surface that
  sits *on* the panel (the visitor's message bubble and the selected task in the session list),
  `graphite-line` for every border.
- **Text.** `bone` for headlines and body; `bone-soft` for the manifesto voice; `bone-muted`
  for UI text; `bone-dim` only for inactive map labels.
- **Signal.** `guacamaya` is the only accent. It fills the primary button (label in
  `on-guacamaya`, never white), draws the active edges of the map, marks the eyebrow, the
  focus ring, and the edge of the selected task in the agent window. Flat, never metallic, never a gradient; that is the
  line between macaw and crypto.
- **Done.** `done-green` only for completed steps and the "listo" status line. Never for
  anything else, so a green mark always means the agent finished.
- **Paper.** `paper` + `ink` for the produced document inside the window, and as the lit
  library nodes on the map (treatment B, decided 2026-09-11: paper nodes, ochre edges). On
  paper, the accent is `guacamaya-on-paper`, never `guacamaya`.

### Contrast table (WCAG 2.2, computed 2026-09-11)

Page and identity pairs first, then the pairs the agent window adds
(computed 2026-09-11 during the hero build).

| Pair | Ratio | Need |
|---|---|---|
| bone / graphite | 15.50 | 4.5 |
| bone-soft / graphite | 11.08 | 4.5 |
| bone-muted / graphite | 7.19 | 4.5 |
| bone-dim / graphite | 5.18 | 4.5 |
| guacamaya as text / graphite | 8.49 | 4.5 |
| on-guacamaya / guacamaya (button label) | 8.59 | 4.5 |
| guacamaya vs graphite (UI) | 8.49 | 3 |
| done-green / graphite | 7.20 | 4.5 |
| bone / graphite-panel | 14.29 | 4.5 |
| bone-muted / graphite-panel | 6.63 | 4.5 |
| bone-muted / graphite-deep | 7.54 | 4.5 |
| ink / paper | 15.29 | 4.5 |
| ink-muted / paper | 5.28 | 4.5 |
| guacamaya-on-paper / paper | 4.65 | 4.5 |
| bone / graphite-deep (title bar, sidebar) | 16.25 | 4.5 |
| done-green / graphite-panel (ticked step) | 6.63 | 4.5 |
| bone-dim vs graphite-panel (pending step ring, UI) | 4.78 | 3 |
| graphite-panel / done-green (tick glyph, UI) | 6.63 | 3 |
| bone / graphite-raise (message bubble, selected task) | 11.53 | 4.5 |
| bone-muted / graphite-raise (secondary text on raise) | 5.34 | 4.5 |
| guacamaya vs graphite-panel (selected-task pill, phone) | 7.82 | 3 |
| guacamaya vs graphite-raise (selected-task edge, desktop) | 6.31 | 3 |
| ink-muted / paper (document kicker, table head) | 5.28 | 4.5 |

`graphite-line` on `graphite-panel` is 1.30 and is deliberately below 3: it is a decorative
separator, never the only thing identifying a control. Where an edge does carry state — the
selected task in the session list — it is `guacamaya` (6.31 on raise, 7.82 on panel), and the task's surface and label
change value as well, so the state survives for anyone who cannot see the hue.

Signal vs done separation (OKLab ΔE×100): normal 16.5, deuteranopia 15.1, protanopia 12.3.
All above the 10 risk line. Re-run the table whenever a token changes.

## Typography

Two voices, deliberately split:

- **Serif** (`display`, `h1`, `h2`, `lead`) is the manifesto voice: the headline, section
  titles, the pull quotes, the title of the produced document. Regular weight, never bold.
  Italic is allowed inside the headline and manifesto for the emphasised phrase.
- **Sans** (DM Sans, self-hosted, already in `public/fonts/`) is the interface voice: body,
  buttons, labels, the agent window, the wordmark, the form.
- **Mono** only inside the agent window status line and for file names.

The serif face is **Source Serif 4** (open licence, self-host the variable Latin subset next to
DM Sans; do not load it from a third party). Until the file is added, the system fallback
stack renders Iowan Old Style or Palatino, which is what the mockups used. Confirm the face
against a rendered hero before the build locks it.

## Layout

Page order (decision 8): hero → De preguntar a delegar → Tres puertas (+ Talleres) → Cómo
trabajamos → El norte (map) → Ignite Talk slot → Sumarme / Hablemos → footer with the security
line and ES/EN.

- **Hero.** Two columns on desktop, headline left, agent window right. On mobile the window
  stacks under the headline, and the window's session list — its one control, as in the real
  tools — becomes a swipeable row above the conversation; each sequence plays on tap. One call
  to action in the hero (Sumarme), and it goes to the form. The three or four scripted prompts are office and study tasks (spreadsheets, decks,
  reports, study notes), never "convocatorias".
- **The staircase as structure.** The three-horizon pillars sit at ascending offsets; the
  "Cómo trabajamos" principles read as steps. The mark itself is not repeated.
- **El norte.** Venezuela from GeoJSON, the Zona en Reclamación hatched as on Venezuelan maps.
  Library nodes are paper-lit with a soft paper halo; active edges are ochre and draw on
  scroll; planned nodes are outlined in `bone-dim`.
- Generous measure: manifesto copy at most 46ch; body at most 68ch.

## Motion

Functional only; every animation tells the story (a step ticking, a file appearing, an edge
drawing, a node lighting). Nothing loops, nothing floats. `duration-step` paces the agent
window; `duration-draw` paces the map edges. Everything short-circuits under
`prefers-reduced-motion`, and the interactive layer is not loaded at all under `saveData`.

## Elevation and depth

Flat tonal layers and 1 px borders. The agent window is the one element allowed a shadow
(`0 20px 40px -18px rgba(0,0,0,.6)`), because it is the one object on the page.

## Shapes

`sm` for chips and inputs, `md` for buttons and cards, `window` for the agent window only.

## Do's and don'ts

- Do keep the whole page quiet so the agent window can be loud.
- Do use ochre once per viewport at most as a fill; as text and lines it may repeat.
- Don't use gradient text, blobs, glassmorphism, purple, orbits, sparkle icons, radial glow,
  3D shapes, or decorative motion (the anti-slop rules, decision 5).
- Don't let ochre go metallic or gradient; don't let the base drift to brown.
- Don't put prices, dates, or participant names on the page.
- Don't make it look like a state program, a party campaign, an AI startup, or a crypto
  product.
- Don't add a second mark. The staircase is the icon; the sans wordmark is the name.
