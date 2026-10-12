import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const html = () => readFileSync('index.html', 'utf8');
const css = () => readFileSync('src/styles.css', 'utf8');
const design = () => readFileSync('DESIGN.md', 'utf8');

/** Everything in styles.css after the generated-from-DESIGN.md fence. */
function cssBelowFence(): string {
  const source = css();
  const fence = '/* --- end generated from DESIGN.md --- */';
  const index = source.indexOf(fence);

  expect(index).toBeGreaterThan(-1);
  return source.slice(index + fence.length);
}

describe('CSP-safe source markup', () => {
  test('does not load third-party font resources from the app shell', () => {
    expect(html()).not.toContain('fonts.googleapis.com');
    expect(html()).not.toContain('fonts.gstatic.com');
  });

  test('makes no external request from the page at all', () => {
    const shell = html();
    const styles = css();

    // Only the site's own origin and mailto/#/relative links may appear.
    const externalUrls = [...`${shell}\n${styles}`.matchAll(/https?:\/\/[^"'\s)]+/g)]
      .map((match) => match[0])
      .filter((url) => !url.startsWith('https://ateneo-abierto.org'))
      .filter((url) => !url.startsWith('https://schema.org'))
      .filter((url) => !url.startsWith('http://www.w3.org'));

    expect(externalUrls).toEqual([]);
  });

  test('self-hosts Figtree and Fraunces', () => {
    const styles = css();
    const fonts = [
      'public/fonts/figtree-latin.woff2',
      'public/fonts/fraunces-latin.woff2',
      'public/fonts/fraunces-latin-italic.woff2'
    ];

    for (const font of fonts) {
      expect(existsSync(font)).toBe(true);
      expect(statSync(font).size).toBeGreaterThan(10_000);
    }

    expect(styles).toContain('font-family: "Figtree"');
    expect(styles).toContain('font-family: "Fraunces"');
    expect(styles).toContain('url("/fonts/fraunces-latin.woff2")');
    expect(styles).toContain('url("/fonts/fraunces-latin-italic.woff2")');
    expect(styles).not.toMatch(/DM Sans|Source Serif/);

    // The OFL text ships with the subsets, as the licence requires.
    expect(existsSync('public/fonts/figtree-OFL.txt')).toBe(true);
    expect(existsSync('public/fonts/fraunces-OFL.txt')).toBe(true);

    const og = readFileSync('public/og.svg', 'utf8');
    expect(og).toContain('url("fonts/figtree-latin.woff2")');
    expect(og).toContain('url("fonts/fraunces-latin.woff2")');
    expect(og).not.toContain('fonts.googleapis.com');
  });

  test('leaves the finished agent window to its own layout when JavaScript is off', () => {
    const noscript = html().match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';

    expect(noscript).toContain('[data-reveal]');
    expect(noscript).not.toContain('[data-beat]');
  });

  test('only hides agent beats when the motion bootstrap has opted in', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');
    const hidingRules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors, declarations]) => selectors.includes('[data-beat]') && /display:\s*none\s*;/.test(declarations));

    expect(hidingRules.length).toBeGreaterThan(0);
    for (const [, selectors] of hidingRules) {
      for (const selector of selectors.split(',')) {
        expect(selector.trim()).toMatch(/^html\.motion-ok\s/);
      }
    }
  });

  test('preloads the two faces the first paint needs', () => {
    const shell = html();

    expect(shell).toContain('href="/fonts/figtree-latin.woff2"');
    expect(shell).toContain('href="/fonts/fraunces-latin.woff2"');
  });
});

describe('the skip link stays accessible above page chrome', () => {
  test('has a higher z-index than the sticky header and back-to-top link', () => {
    const styles = css();
    const zIndex = (selector: string) => {
      const start = styles.indexOf(`${selector} {`);
      expect(start).toBeGreaterThan(-1);
      const rule = styles.slice(start, styles.indexOf('}', start));
      const value = rule.match(/z-index:\s*(\d+)\s*;/)?.[1];
      expect(value).toBeDefined();
      return Number(value);
    };

    expect(zIndex('.skip-link')).toBeGreaterThan(zIndex('.site-header'));
    expect(zIndex('.skip-link')).toBeGreaterThan(zIndex('.to-top'));
  });

  test('shows its keyboard focus state without animation', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => /\.skip-link\b/.test(selectors));

    expect(rules.length).toBeGreaterThan(0);
    for (const [, , declarations] of rules) {
      expect(declarations).not.toMatch(/(?:transition|animation)(?:-[\w-]+)?:/);
    }
  });
});

describe('inline chapter heads respect their available width', () => {
  test('names the chapter head as an inline-size container only on desktop', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');
    const base = styles.match(/\.chapter-head\s*\{([^}]*)\}/)?.[1] ?? '';
    const desktop = styles.match(/@media \(min-width: 861px\)\s*\{\s*\.chapter-head\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(base).not.toMatch(/container-(?:type|name):/);
    expect(desktop).toMatch(/container-type:\s*inline-size;/);
    expect(desktop).toMatch(/container-name:\s*chapter-head;/);
  });

  test('stacks inline children inside a lane reserved for the numeral', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');

    expect(styles).toMatch(/@container chapter-head \(width < 36\.25rem\)\s*\{\s*\.chapter-head--inline \.chapter-main,\s*\.chapter-head--inline \.chapter-lead\s*\{\s*grid-column:\s*1 \/ -1;\s*\}/);
    // Wide heads keep the numeral at the right, in padding as wide as the widest numeral.
    expect(styles).toMatch(/\.chapter-head\s*\{\s*padding-right:\s*calc\(var\(--chapter-n-size\) \* 0\.85 \+ var\(--gap-md\)\);\s*\}/);
  });
});

describe('the desktop running head', () => {
  test('reveals the current name without animating layout and keeps the progress rail', () => {
    const styles = css();

    expect(styles).toMatch(/\.chapter-nav,\s*\.progress-tick\s*\{\s*display: none;/);
    expect(styles).toMatch(/\.chapter-nav-link\s*\{[^}]*transition: none;[^}]*animation: none;/);
    expect(styles).toMatch(/\.chapter-nav-link\[aria-current="location"\] \.chapter-nav-name\s*\{[^}]*position: static;/);
    expect(styles).toContain('.progress-rail {');
    expect(styles).toContain('.progress-rail span {');
  });
});

describe('the shift actor pills', () => {
  test('fills machine pills with design tokens rather than hex colours', () => {
    const rule = css().match(/\.shift-row:not\(\.is-mine\) \.shift-who\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(rule).toMatch(/background:\s*color-mix\(in oklab, var\(--c-fg\) 9%, var\(--c-bg\)\);/);
    expect(rule).toMatch(/border-color:\s*transparent;/);
    expect(rule).toMatch(/color:\s*var\(--c-fg-soft\);/);
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('DESIGN.md is the source of truth for colour', () => {
  test('emits every DESIGN.md colour token into the generated fence', () => {
    const tokens = [...design().matchAll(/^ {2}([a-z0-9-]+): "(#[0-9a-f]{6})"$/gim)].map(
      (match) => ({ name: match[1], value: match[2] })
    );

    expect(tokens.length).toBeGreaterThanOrEqual(16);

    const styles = css();
    for (const token of tokens) {
      expect(styles).toContain(`--${token.name}: ${token.value};`);
    }
  });

  test('never hard-codes a colour outside the generated fence', () => {
    const below = cssBelowFence();
    const hexes = [...below.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0]);

    expect(hexes).toEqual([]);
  });
});

describe('anti-slop rules hold in the stylesheet', () => {
  const banned: [string, RegExp][] = [
    ['gradient text', /background-clip:\s*text/i],
    ['glassmorphism', /backdrop-filter/i],
    ['gradients on the signal', /linear-gradient|radial-gradient|conic-gradient/i],
    ['3D transforms', /perspective\(|rotate3d|translateZ/i]
  ];

  for (const [label, pattern] of banned) {
    test(`has no ${label}`, () => {
      expect(css()).not.toMatch(pattern);
    });
  }

  test('has no infinite or decorative loop outside the agent window spinner', () => {
    const loops = [...css().matchAll(/animation:[^;]*infinite[^;]*;/g)].map((match) => match[0]);

    // The only permitted loops are the two "step running" spinners: the one
    // inside the agent window and the one on the agent column in section two.
    // Both stop as soon as the step they describe finishes.
    expect(loops.length).toBeLessThanOrEqual(2);
    for (const loop of loops) {
      expect(loop).toMatch(/spin/);
    }
  });

  test('short-circuits motion under prefers-reduced-motion', () => {
    expect(css()).toContain('@media (prefers-reduced-motion: reduce)');
  });
});

describe('hero motion and first paint', () => {
  test('skips the hero steps below 1024px', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');

    expect(styles).toMatch(/@media \(max-width: 1023px\)\s*\{\s*\.hero-steps\s*\{\s*display: none;\s*\}/);
  });

  test('keeps the hero in normal flow and independent of scroll timelines', () => {
    const styles = css();
    const hero = styles.slice(
      styles.indexOf('/* ---------- hero ----------'),
      styles.indexOf('/* ---------- the agent window ----------')
    );
    const main = readFileSync('src/main.ts', 'utf8');

    expect(hero).not.toContain('position: sticky');
    expect(hero).not.toContain('animation-timeline: --hero');
    expect(hero).not.toContain('height: 200svh');
    expect(hero).not.toContain('hero-stacked');
    expect(hero).not.toContain('is-focus-stable');
    expect(main).not.toContain('hero-stacked');
    expect(main).not.toContain('is-focus-stable');
  });

  test('uses a short desktop load entrance and keeps mobile content visible together', () => {
    const hero = css().slice(
      css().indexOf('/* ---------- hero ----------'),
      css().indexOf('/* ---------- the agent window ----------')
    );

    expect(hero).toMatch(/@media \(min-width: 861px\)/);
    expect(hero).toContain('visibility: hidden');
    expect(hero).toContain('hero-load-in 220ms');
    expect(hero).toContain('360ms');
    const focusRule = hero.match(/([^{}]*\.hero:focus-within[^{}]*)\{([^{}]*)\}/);
    expect(focusRule?.[1].trim().split(/,\s*/)).toEqual([
      'html.motion-ok .hero:focus-within .hero-copy',
      'html.motion-ok .hero:focus-within .agent-figure'
    ]);
    expect(focusRule?.[2]).toContain('visibility: visible');
    expect(hero).not.toContain('.hero:focus-within .hero ');
    expect(hero).not.toContain('line-rise');
    expect(hero).not.toContain('animation-timeline: --hero');
  });

  test('sets motion eligibility before page content can paint, with static JS-off fallback', () => {
    const shell = html();
    const bootstrapTag = '<script src="/motion.js"></script>';
    const main = readFileSync('src/main.ts', 'utf8');
    const bootstrap = readFileSync('public/motion.js', 'utf8');

    expect(shell.indexOf(bootstrapTag)).toBeGreaterThan(-1);
    expect(shell.indexOf(bootstrapTag)).toBeLessThan(shell.indexOf('</head>'));
    expect(shell).not.toMatch(/<script[^>]+(?:async|defer|type="module")[^>]*src="\/motion\.js"/);
    expect(bootstrap).toContain("prefers-reduced-motion: reduce");
    expect(bootstrap).toContain('saveData');
    expect(bootstrap).toContain("classList.add('motion-ok')");
    expect(main).not.toContain("classList.add('motion-ok')");
    expect(css()).toContain('.motion-ok [data-reveal]');
  });

  test('falls back to the complete prerender when the main bundle cannot initialize', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const bootstrap = readFileSync('public/motion.js', 'utf8');

    expect(main).toContain("classList.add('motion-ready')");
    expect(bootstrap).toContain("addEventListener('error'");
    expect(bootstrap).toContain("addEventListener('load'");
    expect(bootstrap).toContain("classList.contains('motion-ready')");
    expect(bootstrap).toContain("classList.remove('motion-ok')");
    expect(bootstrap).toContain("removeAttribute('data-autoplay')");
  });

  test('rechecks the visible agent after its desktop entrance and after late initialization', () => {
    const main = readFileSync('src/main.ts', 'utf8');

    expect(main).toContain("figure.addEventListener('animationend'");
    expect(main).toContain("event.animationName === 'hero-load-in'");
    expect(main).toContain('visibleRatio = currentVisibleRatio(window_);');
    expect(main).toContain('refreshVisibility();');
  });
});

describe('door and map motion', () => {
  test('limits door entrance animations to pointer-opened dialogs', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const styles = css();
    const doorMotion = styles.slice(styles.indexOf('/* ---------- the door, opened ---------- */'));
    const clickHandlerStart = main.indexOf("button.addEventListener('click', (event) => {");
    const clickHandlerEnd = main.indexOf("dialog.querySelector('[data-dialog-close]')", clickHandlerStart);
    const clickHandler = main.slice(clickHandlerStart, clickHandlerEnd);

    expect(clickHandler).toContain("dialog.dataset.openMotion = event.detail === 0 ? 'none' : 'pointer';");
    expect(clickHandler.indexOf('dialog.dataset.openMotion')).toBeLessThan(clickHandler.indexOf('dialog.showModal()'));
    expect(main).toContain("dialog.addEventListener('close', () => delete dialog.dataset.openMotion);");
    expect(doorMotion).toContain('.door-dialog[data-open-motion="pointer"][open] {');
    expect(doorMotion).toContain('.door-dialog[data-open-motion="pointer"][open]::backdrop {');
    expect(doorMotion).not.toContain('.door-dialog[open] {');
  });

  test('draws map edges once on reveal, without a scroll timeline', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const styles = css();
    const support = styles.slice(styles.indexOf('@supports (animation-timeline: view())'));

    expect(support).not.toContain('view-timeline-name: --map;');
    expect(support).not.toContain('animation-timeline: --map;');
    expect(styles).toMatch(/\.map\.is-lighting \.map-edge\s*\{[^}]*stroke-dashoffset: 1;/s);
    expect(styles).toMatch(/\.map\.is-drawing \.map-edge\.is-lit\s*\{[^}]*animation: map-edge-draw var\(--duration-draw\) var\(--ease-out\) both;/s);
    expect(styles).toMatch(/@keyframes map-edge-draw\s*\{\s*from\s*\{\s*stroke-dashoffset: 1;/s);
    expect(main).toMatch(/if \(map\?\.isConnected\) \{\s*lightingPlayers\.push\(playMap\(map\)\);\s*\}/);
  });
});

describe('form and honeypot handling', () => {
  test('does not hide the subscribe honeypot with inline styles', () => {
    const markup = readFileSync('src/render.ts', 'utf8') + readFileSync('src/main.ts', 'utf8');
    const styles = css();

    expect(markup).not.toContain('style="display:none');
    expect(styles).toContain('.field-supplement');

    // The honeypot is clipped, not display:none — bots read display:none as a trap.
    const rule = styles.slice(styles.indexOf('.field-supplement'));
    expect(rule.slice(0, rule.indexOf('}'))).not.toContain('display: none');
  });
});

describe('identity', () => {
  test('draws the staircase mark from the DESIGN.md path, in the DESIGN.md colours', () => {
    const markPath = 'M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20';
    const favicon = readFileSync('public/favicon.svg', 'utf8');
    const render = readFileSync('src/render.ts', 'utf8');

    expect(design()).toContain(markPath);
    expect(favicon).toContain(markPath);
    expect(render).toContain(markPath);

    // Favicon on dark: ochre steps, bone dot, graphite-panel ground.
    expect(favicon).toContain('#1f1d16');
    expect(favicon).toContain('#e2a638');
    expect(favicon).toContain('#f0ece2');
  });

  test('keeps the wordmark in the interface sans and the mark out of the body copy', () => {
    const styles = css();
    const render = readFileSync('src/render.ts', 'utf8');

    expect(styles).toMatch(/\.nav-wordmark \.wordmark\s*\{[^}]*text-transform:\s*uppercase;/s);

    // The mark goes with the wordmark: the header and the footer, and nowhere
    // else. Anywhere else would be decoration (David, 2026-09-19).
    const marks = [...render.matchAll(/renderMark\(\)/g)];
    expect(marks.length).toBe(3); // the definition, the header and the footer
  });
});

describe('the map is vendored, not fetched', () => {
  test('anchors the map key from 1024px and stacks it below a hairline at narrower widths', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');
    const base = styles.match(/\n\.map-key\s*\{([^}]*)\}/)?.[1] ?? '';
    const narrowDesktop = styles.match(/@media \(min-width: 861px\)\s*\{\s*\.north-body\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    const desktop = styles.match(/@media \(min-width: 1024px\)\s*\{\s*\.north-body \.map(?:,\s*\.aliados-vision-body \.map)?\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    const key = desktop.match(/\.north-body \.map-key(?:,\s*\.aliados-vision-body \.map-key)?\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(base).toMatch(/display:\s*grid;/);
    expect(base).toMatch(/gap:\s*0\.6rem;/);
    expect(base).toMatch(/margin-top:\s*var\(--gap-sm\);/);
    expect(base).toMatch(/padding-top:\s*var\(--gap-sm\);/);
    expect(base).toMatch(/border-top:\s*1px solid var\(--c-border\);/);
    expect(base).not.toMatch(/position:\s*absolute;/);
    expect(narrowDesktop).not.toContain('.map-key');
    expect(narrowDesktop).not.toMatch(/\.north-body \.map\s*\{[^}]*position:\s*relative;/);
    expect(desktop).toMatch(/\.north-body \.map(?:,\s*\.aliados-vision-body \.map)?\s*\{[^}]*position:\s*relative;/);
    expect(key).toMatch(/position:\s*absolute;/);
    expect(key).toMatch(/left:\s*0;/);
    expect(key).toMatch(/bottom:\s*4%;/);
    expect(key).toMatch(/max-width:\s*15rem;/);
    expect(key).toMatch(/margin:\s*0;/);
    expect(desktop).toMatch(/\.map-key \.map-legend\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*0\.45rem;/);
    expect(styles).toMatch(/\.map-key \.map-legend,\s*\.map-key \.map-caption\s*\{\s*margin:\s*0;/);
  });

  test('pairs the partner vision list with the map while sharing the wide corner-key rules', () => {
    const styles = css().replace(/\/\*[\s\S]*?\*\//g, '');
    const partner = styles.slice(styles.indexOf('.sec[class*="aliados-"]'));

    expect(partner).toMatch(/\.aliados-vision-body\s*\{[^}]*display: grid;[^}]*gap: var\(--gap-lg\);/);
    expect(partner).toMatch(/@media \(min-width: 861px\)[\s\S]*?\.aliados-vision-body\s*\{[^}]*grid-template-columns: minmax\(0, 5fr\) minmax\(0, 7fr\);[^}]*gap: clamp\(2rem, 5vw, 4\.5rem\);[^}]*align-items: center;/);
    expect(partner).toMatch(/@media \(min-width: 861px\)[\s\S]*?\.aliados-vision-grid\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
    expect(styles).toMatch(/@media \(min-width: 1024px\)\s*\{\s*\.north-body \.map,\s*\.aliados-vision-body \.map\s*\{[^}]*position: relative;/);
    expect(styles).toMatch(/\.north-body \.map-key,\s*\.aliados-vision-body \.map-key\s*\{[^}]*position: absolute;/);
  });

  test('wires the partner map through the existing guarded lazy lighting runner', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const branch = main.match(/if \(root.dataset.page === 'aliados'\) \{([\s\S]*?)\} else if/)?.[1] ?? '';
    const runner = main.match(/function bindLighting\(\): void \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const eligibility = main.match(/function motionAllowed\(\): boolean \{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(branch).toContain('bindLighting();');
    expect(runner).toMatch(/^\s*if \(!motionAllowed\(\)\) \{\s*return;/);
    expect(runner).toContain("lightingModule ??= import('./lighting');");
    expect(runner).toContain('playMap(map)');
    expect(eligibility).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    expect(eligibility).toContain('return connection?.saveData !== true;');
  });

  test('ships the boundary as GeoJSON in the repo, with the claim as its own feature', () => {
    const raw = readFileSync('src/data/venezuela.geo.json', 'utf8');
    const geo = JSON.parse(raw) as {
      features: { properties: { id: string }; geometry: { coordinates: unknown[] } }[];
    };

    const ids = geo.features.map((feature) => feature.properties.id);
    expect(ids).toEqual(['mainland', 'claim']);

    // Natural Earth, public domain — the provenance travels with the file.
    expect(raw).toContain('Natural Earth');

    for (const feature of geo.features) {
      expect(feature.geometry.coordinates.length).toBeGreaterThan(0);
    }
  });

  test('draws the map from generated paths, with no request at runtime', () => {
    const shape = readFileSync('src/map-shape.ts', 'utf8');
    const render = readFileSync('src/render.ts', 'utf8');

    expect(shape).toContain('export const MAP_MAINLAND');
    expect(shape).toContain('export const MAP_CLAIM');
    expect(shape).not.toMatch(/fetch\(|XMLHttpRequest|import\(/);

    // Nothing anywhere near the map reads the GeoJSON at runtime.
    expect(render).not.toContain('venezuela.geo.json');

    // Only the site's own canonical URLs and the SVG namespace appear in the
    // render layer, and none of them is ever requested.
    const urls = [...`${shape}\n${render}`.matchAll(/https?:\/\/[^"'\s)]+/g)]
      .map((match) => match[0])
      .filter((url) => !url.startsWith('https://ateneo-abierto.org'))
      .filter((url) => url !== 'http://www.w3.org/2000/svg')
      // A link the visitor follows, not a request the page makes.
      .filter((url) => !url.startsWith('https://www.youtube.com/watch'));

    expect(urls).toEqual([]);
  });

  test('never positions anything with a style attribute', () => {
    // The server allows inline CSS by sha256 hash and never by 'unsafe-inline'.
    // A hash does not cover a style attribute, so an inline position is simply
    // dropped and every map label lands on top of the first one. Positions go
    // in the one generated <style> block instead.
    const render = readFileSync('src/render.ts', 'utf8');

    expect(render).not.toMatch(/style="/);
    expect(render).toContain('<style>');
  });
});

describe('the one embed on the page', () => {
  test('vendors the poster and loads nothing from YouTube in the shell or the markup', () => {
    for (const name of ['ignite-poster', 'ignite-poster-1280']) {
      expect(existsSync(`public/${name}.webp`)).toBe(true);
      expect(existsSync(`public/${name}.jpg`)).toBe(true);
    }

    const render = readFileSync('src/render.ts', 'utf8');
    expect(render).toContain('/ignite-poster-1280.webp 1280w');
    // The only mention is the plain watch link: an href, which fetches nothing.
    expect(render.match(/youtube/g)).toHaveLength(1);
    expect(render).toContain('href="https://www.youtube.com/watch?v=${TALK_VIDEO_ID}"');
    expect(render).not.toMatch(/ytimg|youtube\.com\/embed|<iframe/);
    expect(html()).not.toContain('youtube');
  });

  test('creates the player only on a click, from the one allowed origin', () => {
    const main = readFileSync('src/main.ts', 'utf8');

    expect(main).toContain('https://www.youtube.com/embed/');

    // The iframe is built inside the click handler, never at render time.
    const handler = main.slice(main.indexOf("play.addEventListener('click'"));
    expect(handler).toContain("createElement('iframe')");
  });

  test('names the one frame origin in the CSP and loosens nothing else', () => {
    const server = readFileSync('src/app.ts', 'utf8');

    expect(server).toContain("frameSrc: [\"'self'\", 'https://www.youtube.com']");
    // As CSP source expressions, not as the words in the comment above them.
    expect(server).not.toContain('"\'unsafe-inline\'"');
    expect(server).not.toContain('"\'unsafe-eval\'"');
    expect(server).toMatch(/defaultSrc: \["'self'"\]/);
  });
});

describe('the agent thread never traps the page scroll', () => {
  test('does not contain its overscroll: a thumb at the edge scrolls the page', () => {
    // Comments stripped first: the block explains why the property is absent.
    const declarations = cssBelowFence().replace(/\/\*[\s\S]*?\*\//g, '');
    const thread = declarations.slice(declarations.indexOf('.agent-thread {'));

    expect(thread.slice(0, thread.indexOf('}'))).not.toContain('overscroll-behavior');
  });

  test('hands touch to the page while the runner drives the scroll', () => {
    expect(cssBelowFence()).toMatch(/\.agent-thread\.is-playing\s*\{[^}]*overflow-y:\s*hidden/);
  });
});

describe('back to top', () => {
  test('targets the document top, not the sticky header', () => {
    const render = readFileSync('src/render.ts', 'utf8');

    // A sticky element is always in view, so a link to it scrolls nowhere.
    expect(render).toContain('class="to-top" href="#top"');
    expect(render).not.toMatch(/id="top"/);
  });
});

describe('the runtime image ships every file the server imports', () => {
  /**
   * The Dockerfile copies named server files rather than all of src/, so the
   * image stays small and the browser bundle never rides along. The cost is
   * that adding an import to app.ts can break production while every test
   * passes — the failure only shows up as a crash loop after deploy.
   */
  function serverModules(): Set<string> {
    const seen = new Set<string>();
    const queue = ['server'];

    while (queue.length > 0) {
      const name = queue.pop() as string;
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);

      const source = readFileSync(`src/${name}.ts`, 'utf8');
      for (const [, specifier] of source.matchAll(/from\s+'\.\/([\w.-]+)'/g)) {
        queue.push(specifier);
      }
    }

    return seen;
  }

  test('lists each of them in the COPY line', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const copied = dockerfile.match(/^COPY .*src\/server\.ts.*$/m)?.[0] ?? '';

    expect(copied).not.toBe('');
    for (const name of serverModules()) {
      expect(copied).toContain(`src/${name}.ts`);
    }
  });
});

describe('links that leave the site', () => {
  test('every external link carries noopener AND noreferrer', () => {
    const render = readFileSync('src/render.ts', 'utf8');
    const anchors = [...render.matchAll(/<a\b[^>]*href="https?:\/\/[^>]*>/g)].map((m) => m[0]);

    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      // noopener alone still hands the destination a Referer. The header says
      // origin-only today, but Deflect's Referrer-Policy toggle is per site and
      // on for aragort.com, where it downgrades to the full URL — so the rel is
      // the part of this that does not depend on an edge setting.
      expect(anchor).toContain('noopener');
      expect(anchor).toContain('noreferrer');
    }
  });
});
