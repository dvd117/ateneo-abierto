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
  graphite: "#151719"
  muted-slate: "#71828b"
  workshop-signal: "#dc5c3f"
typography:
  display:
    fontFamily: Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 64px
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: 0
  headline:
    fontFamily: Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 42px
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: 0
  body:
    fontFamily: Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  label:
    fontFamily: Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif
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

Use warm paper and ink as the foundation. Use infrastructure green for civic access and repair. Use terracotta signal sparingly for urgency and action. Use graphite and muted slate in practical workshop contexts.

## Typography

Use a sturdy humanist sans as the main voice: warm enough for civic learning, practical enough for workshops and digital tools, and less product-coded than Inter. The current system stack is `Avenir Next, Avenir, Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif`; consider a bundled open font only if cross-device rendering proves inconsistent. Use monospace only as a controlled accent for workshop modules, exercises, commands, numbered cues, and technical labels.

## Layout

Prefer generous, clear layouts with strong typographic hierarchy. Use full-width bands and practical modules. Avoid decorative card-heavy layouts. The page rhythm should read as civic rooms: hero as invitation, manifesto teaser as declaration, audience and name as separate entry/context bands, and working table plus pillars as the practical register. The full manifesto lives on its own page.

## Elevation And Depth

Use flat tonal layers, borders, and contrast. Avoid heavy shadows and glossy surfaces.

## Shapes

Use modest radii. The identity should feel approachable but not soft.

## Components

The current implementation defines only the components needed for launch:

- wordmark navigation
- language toggle
- hero
- open-room layout gesture
- manifesto teaser section
- full manifesto page
- audience section
- name etymology section
- working table cue
- pillar modules
- boundaries list
- subscribe form
- footer

## Do's And Don'ts

- Do make the project feel civic, practical, and open.
- Do preserve the distinction between master identity and workshop register.
- Do treat the Oslo slide template as an adapter, not the identity source.
- Don't make the identity look like a state program, party campaign, AI startup, crypto product, or generic NGO.
- Don't roll out an avatar or standalone mark until real surfaces prove the system.
