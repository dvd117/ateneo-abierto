import { createHash } from 'node:crypto';
import type { OutputAsset, OutputBundle } from 'rollup';
import type { Plugin } from 'vite';
import type { Locale } from '../src/locale';
import { DEEP_LINK_ROUTES, type DeepLinkRoute } from '../src/content';
import { pageMeta, renderPage } from '../src/render';

/**
 * Build-time prerender.
 *
 * Without it the server sends an empty <div id="app"> and a phone on a slow
 * connection waits for the stylesheet and the script before any word shows.
 * This writes the finished page into the HTML instead, once per locale, and
 * inlines the stylesheet, so the first response is the page:
 *
 *   dist/index.html      Spanish (the default)
 *   dist/index.en.html   English
 *   dist/hackaton.html, hackaton.en.html, talleres…, demo-nights…
 *                        the same page opened at one door: its own head (title,
 *                        description, preview card, canonical) and a
 *                        data-deep-link on #app that main.ts scrolls to.
 *   dist/csp.json        sha256 hashes of the inline <style> blocks, which the
 *                        Hono server adds to its Content-Security-Policy so
 *                        inline CSS is allowed by hash, never by 'unsafe-inline'.
 *
 * Copy is still edited in src/content.ts; this only runs src/render.ts early.
 */

const PLACEHOLDER = '<!--prerender-->';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Replaces one attribute value or element body, and fails the build if the
 * pattern is not there — shipping the Spanish meta tags on the English page
 * silently would be worse than a red build.
 */
function replaceOnce(html: string, pattern: RegExp, value: string, label: string): string {
  if (!pattern.test(html)) {
    throw new Error(`[prerender] could not find ${label} in index.html`);
  }

  return html.replace(pattern, (_match, before: string, after: string) => `${before}${value}${after}`);
}

/** Where a page is written: index(.en).html for home, {route}(.en).html for a door. */
export function pageFileName(locale: Locale, route?: DeepLinkRoute): string {
  return `${route ?? 'index'}${locale === 'en' ? '.en' : ''}.html`;
}

export function fillTemplate(template: string, locale: Locale, route?: DeepLinkRoute): string {
  if (!template.includes(PLACEHOLDER)) {
    throw new Error('[prerender] index.html has no <!--prerender--> placeholder');
  }

  const meta = pageMeta(locale, route);
  let html = template.replace(PLACEHOLDER, () => renderPage(locale));

  html = replaceOnce(html, /(<html lang=")[^"]*(")/, meta.lang, '<html lang>');
  html = replaceOnce(
    html,
    /(<div id="app" data-locale=")[^"]*(")/,
    route ? `${locale}" data-deep-link="${route}` : locale,
    '#app data-locale'
  );
  html = replaceOnce(html, /(<title>)[^<]*(<\/title>)/, escapeAttr(meta.title), '<title>');
  html = replaceOnce(
    html,
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    escapeAttr(meta.description),
    'meta description'
  );
  html = replaceOnce(
    html,
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    escapeAttr(meta.description),
    'og:description'
  );
  html = replaceOnce(
    html,
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    escapeAttr(meta.description),
    'twitter:description'
  );
  html = replaceOnce(html, /(<meta property="og:locale" content=")[^"]*(")/, meta.ogLocale, 'og:locale');
  html = replaceOnce(
    html,
    /(<meta property="og:locale:alternate" content=")[^"]*(")/,
    meta.ogLocaleAlternate,
    'og:locale:alternate'
  );
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(")/, escapeAttr(meta.ogTitle), 'og:title');
  html = replaceOnce(html, /(<meta name="twitter:title" content=")[^"]*(")/, escapeAttr(meta.ogTitle), 'twitter:title');
  html = replaceOnce(html, /(<meta property="og:image" content=")[^"]*(")/, meta.ogImage, 'og:image');
  html = replaceOnce(html, /(<meta name="twitter:image" content=")[^"]*(")/, meta.ogImage, 'twitter:image');
  html = replaceOnce(html, /(<meta property="og:image:alt" content=")[^"]*(")/, escapeAttr(meta.ogImageAlt), 'og:image:alt');
  html = replaceOnce(html, /(<meta name="twitter:image:alt" content=")[^"]*(")/, escapeAttr(meta.ogImageAlt), 'twitter:image:alt');
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, meta.canonical, 'canonical');
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(")/, meta.canonical, 'og:url');
  html = replaceOnce(html, /(<link rel="alternate" hreflang="es" href=")[^"]*(")/, meta.alternates.es, 'hreflang es');
  html = replaceOnce(html, /(<link rel="alternate" hreflang="en" href=")[^"]*(")/, meta.alternates.en, 'hreflang en');
  html = replaceOnce(
    html,
    /(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/,
    meta.alternates.es,
    'hreflang x-default'
  );
  html = replaceOnce(html, /("@type": "WebSite"[^}]*?"url": ")[^"]*(")/, meta.canonical, 'JSON-LD WebSite url');
  // Only the WebSite node's description, which follows the page's language;
  // the Organization node carries no copy and stays as written. A door page
  // keeps the site's description: the node describes the site, not the door.
  // The value is JSON-escaped, and `<` too, so no description can close the script early.
  html = replaceOnce(
    html,
    /("@type": "WebSite"[^}]*?"description": ")[^"]*(")/,
    JSON.stringify(pageMeta(locale).description).slice(1, -1).replace(/</g, '\\u003c'),
    'JSON-LD WebSite description'
  );

  return html;
}

/** Swaps the stylesheet <link> for the stylesheet itself. */
export function inlineStylesheet(html: string, fileName: string, css: string): string {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const link = new RegExp(`<link[^>]*href="/${escaped}"[^>]*>`);

  if (!link.test(html)) {
    throw new Error(`[prerender] no <link> for ${fileName} in index.html`);
  }

  return html.replace(link, () => `<style>${css}</style>`);
}

/** CSP source expressions for every inline <style> block in the page. */
export function styleHashes(html: string): string[] {
  const hashes = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(
    (match) => `'sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}'`
  );

  return [...new Set(hashes)];
}

function isAsset(chunk: OutputBundle[string] | undefined): chunk is OutputAsset {
  return chunk?.type === 'asset';
}

export function prerender(): Plugin {
  return {
    name: 'ateneo-prerender',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = bundle['index.html'];
      if (!isAsset(page)) {
        this.error('index.html was not emitted before prerender ran');
      }

      const stylesheets = Object.values(bundle).filter(
        (chunk): chunk is OutputAsset => isAsset(chunk) && chunk.fileName.endsWith('.css')
      );
      if (stylesheets.length !== 1) {
        this.error(`expected one stylesheet to inline, found ${stylesheets.length}`);
      }

      const [stylesheet] = stylesheets;
      const template = inlineStylesheet(String(page.source), stylesheet.fileName, String(stylesheet.source));
      // Nothing references the external file any more.
      delete bundle[stylesheet.fileName];

      const spanish = fillTemplate(template, 'es');
      page.source = spanish;

      const others: [string, string][] = [['index.en.html', fillTemplate(template, 'en')]];
      for (const route of DEEP_LINK_ROUTES) {
        for (const locale of ['es', 'en'] as const) {
          others.push([pageFileName(locale, route), fillTemplate(template, locale, route)]);
        }
      }

      for (const [fileName, source] of others) {
        this.emitFile({ type: 'asset', fileName, source });
      }

      this.emitFile({
        type: 'asset',
        fileName: 'csp.json',
        source: `${JSON.stringify({ styleSrc: styleHashes(spanish) }, null, 2)}\n`
      });

      // Every page shares one stylesheet and one noscript block, so one set
      // of hashes has to cover all of them. Fail the build if that ever stops being true.
      const spanishHashes = styleHashes(spanish).join(' ');
      for (const [fileName, source] of others) {
        if (styleHashes(source).join(' ') !== spanishHashes) {
          this.error(`inline <style> blocks in ${fileName} differ from index.html; csp.json would not cover it`);
        }
      }
    }
  };
}
