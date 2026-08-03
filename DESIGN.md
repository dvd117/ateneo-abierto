---
version: alpha
name: Ateneo Abierto
description: Visual identity for a Venezuelan civic learning initiative focused on practical agency, public knowledge spaces, and tools people can keep under constraint.
colors:
  paper: "#f3eddf"
  ink: "#171a16"
  infrastructure-green: "#235e4f"
  terracotta-signal: "#b55234"
  learning-ochre: "#d39b35"
  warm-graphite: "#1a1a12"
  workshop-signal: "#c47a1e"
typography:
  display:
    fontFamily: DM Sans, Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 64px
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: -0.02em
  headline:
    fontFamily: DM Sans, Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 42px
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: -0.01em
  body:
    fontFamily: DM Sans, Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  label:
    fontFamily: DM Sans, Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.08em
  code-label:
    fontFamily: ui-monospace
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
rounded:
  sm: 4px
  md: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
---

# Ateneo Abierto

## Overview

Ateneo Abierto should feel like a serious, open civic learning space built for people recovering agency under constraint. It should evoke a public library and a working table: warm, useful, credible, and open, without becoming bureaucratic, partisan, or startup-coded.

## Identity Architecture

Use one master identity, not two competing brands.

- **Master identity:** Civic Hearth.
- **Secondary register:** Working Table for workshops, toolkits, exercises, and practical AI/digital-tools materials.
- **Logo mark:** Staircase — three ascending steps = access, progression, practical learning. Confirmed as the canonical mark.

### Mark spec

SVG path (viewBox `0 0 80 80`):
```
<path d="M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20"
      stroke-width="5.5" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>
<rect x="52" y="12" width="8" height="8"/>
```

**Standalone (on paper background):** staircase `#b55234` (terracotta), dot `#235e4f` (infrastructure green).

**Avatar (on green background `#235e4f`):** staircase `#f3eddf` (paper), dot `#d39b35` (ochre). Background rect `rx="14"`.

The mark appears in the nav wordmark (22px, beside the text) and as the favicon (80px avatar variant).

## Colors

Use warm paper and ink as the foundation. Use infrastructure green for civic access and repair. Use terracotta for structure and sparing urgency. Use ochre/workshop signal for practical cues, numbering, and action accents. Use warm graphite only for the subscribe band.

## Typography

Use DM Sans as the main voice: warm enough for civic learning, practical enough for workshops and digital tools, and less product-coded than Inter. The public page self-hosts the normal variable Latin and Latin Extended WOFF2 subsets from `public/fonts/` and falls back to `Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif`. Do not load third-party web fonts from the public page. Use monospace only as a controlled accent for workshop modules, exercises, commands, numbered cues, and technical labels.

For Google Slides, use DM Sans with the same weights and color tokens instead of approximating the look with another sans. For standalone SVG assets, include `@font-face` declarations that point to the self-hosted DM Sans files; a `font-family` name alone is not enough because renderers without DM Sans installed will fall back. Regenerate PNG assets with `npm run render:brand` so the output comes from the same browser font rendering path.

## Layout

Prefer generous, clear layouts with strong typographic hierarchy. Use full-width bands and practical modules. Avoid decorative card-heavy layouts. The page rhythm should read as civic rooms: hero as invitation, origin as the historical starting point, audience and name as separate entry/context bands, pillars as the practical register, boundaries as safety framing, and subscribe as the clear update form. The former full-manifesto route is retired; `/manifesto` redirects to `/`.

### The staircase as structure, not ornament

The mark is three ascending steps meaning access and progression. It carries that meaning structurally rather than appearing as a repeated logo:

- **Hero:** the path draws itself once on load (`stroke-dashoffset`), ochre dot landing last. This is the page's single orchestrated motion moment.
- **Origin:** the section is a stepped sequence of four beats, each with a mono step marker, joined by a terracotta riser that fills as each step is revealed.
- **Pillars:** the three pillars sit at ascending offsets, matching the mark's geometry to the three time horizons the copy already names.

Per the launch brief, the open-room gesture is layout language, not a logo. Do not place the mark on a panel purely as decoration.

### Prose is structured, never a wall

`content.ts` types sections so the markup can express sequence and emphasis: `origin` is `beats[]` plus a promoted `closing` pull-quote, `pillars.items[]` carry a `horizon` label, `audience` carries `who[]`, and `not` carries `points[]`. Signal that belongs in a label or a list must never be left buried at the end of a paragraph. Body copy stays under ~360 characters per beat — enforced in `content.test.ts`.

## Elevation And Depth

Use flat tonal layers, borders, and contrast. Avoid heavy shadows and glossy surfaces.

## Shapes

Use modest radii. The identity should feel approachable but not soft.

## Components

The current implementation defines only the components needed for launch:

- wordmark navigation
- language toggle
- reading-progress rail (terracotta, under the sticky header)
- hero (promise as the display line; the wordmark carries the name)
- open-room layout gesture with the staircase draw-on
- hero scroll cue
- origin / starting-point stepped sequence + closing pull-quote
- audience section with audience-type chips
- name etymology section
- pillar modules with mono time-horizon labels
- boundaries list
- subscribe form
- footer
- back-to-top button

### Motion

All scroll-triggered motion goes through `src/reveal.ts` (`[data-reveal]`, optional `data-reveal-delay` for stagger). It short-circuits under `prefers-reduced-motion: reduce`, and the CSS carries a matching guard so the page is inert on its own. Both observers are torn down and re-armed on locale switch, because `render()` replaces the whole tree.

## Do's And Don'ts

- Do make the project feel civic, practical, and open.
- Do preserve the distinction between master identity and workshop register.
- Do treat the Oslo slide template as an adapter, not the identity source.
- Don't make the identity look like a state program, party campaign, AI startup, crypto product, or generic NGO.
- Don't add a second mark or competing logo system. The staircase mark is the canonical public mark.
