import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('CSP-safe source markup', () => {
  test('does not load third-party font resources from the app shell', () => {
    const html = readFileSync('index.html', 'utf8');

    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });

  test('uses a self-hosted DM Sans font asset', () => {
    const css = readFileSync('src/styles.css', 'utf8');
    const design = readFileSync('DESIGN.md', 'utf8');
    const og = readFileSync('public/og.svg', 'utf8');
    const fontPath = 'public/fonts/dm-sans-latin-variable.woff2';
    const extendedFontPath = 'public/fonts/dm-sans-latin-ext-variable.woff2';

    expect(existsSync(fontPath)).toBe(true);
    expect(existsSync(extendedFontPath)).toBe(true);
    expect(statSync(fontPath).size).toBeGreaterThan(10_000);
    expect(statSync(extendedFontPath).size).toBeGreaterThan(10_000);
    expect(css).toContain('@font-face');
    expect(css).toContain('font-family: "DM Sans"');
    expect(css).toContain('url("/fonts/dm-sans-latin-variable.woff2")');
    expect(css).toContain('url("/fonts/dm-sans-latin-ext-variable.woff2")');
    expect(og).toContain('font-family: "DM Sans"');
    expect(og).toContain('url("fonts/dm-sans-latin-variable.woff2")');
    expect(og).toContain('url("fonts/dm-sans-latin-ext-variable.woff2")');
    expect(og).not.toContain('fonts.googleapis.com');
    expect(og).not.toContain('fonts.gstatic.com');
    expect(design).toContain('DM Sans');
  });

  test('does not hide the subscribe honeypot with inline styles', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    const css = readFileSync('src/styles.css', 'utf8');

    expect(main).toContain('class="field-supplement"');
    expect(main).not.toContain('style="display:none');
    expect(css).toContain('.field-supplement');
    expect(css).not.toContain('display: none');
  });
});
