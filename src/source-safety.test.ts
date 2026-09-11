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

  test('keeps a noscript fallback that shows the finished agent window', () => {
    expect(html()).toMatch(/<noscript>\s*<style>[\s\S]*\.agent-thread\[data-autoplay\][\s\S]*display: revert;/);
  });

  test('preloads the two faces the first paint needs', () => {
    const shell = html();

    expect(shell).toContain('href="/fonts/figtree-latin.woff2"');
    expect(shell).toContain('href="/fonts/fraunces-latin.woff2"');
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

    // The mark appears once in the nav. Anywhere else would be decoration.
    const marks = [...render.matchAll(/renderMark\(\)/g)];
    expect(marks.length).toBe(2); // the definition and the single nav call site
  });
});

describe('the map is vendored, not fetched', () => {
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
