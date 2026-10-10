import { describe, expect, test } from 'vitest';
import { copy } from './content';
import { renderPage } from './render';

const locales = ['es', 'en'] as const;
const chapterIds = ['cambio', 'programa', 'norte', 'principios', 'charla', 'unete'];

describe('foundation sketch publication structure', () => {
  test.each(locales)('renders six chapters and index links in %s', (locale) => {
    const page = renderPage(locale);
    const sections = [...page.matchAll(/<section class="[^"]*chapter[^"]*" id="([^"]+)"/g)];

    expect(sections.map(([, id]) => id)).toEqual(chapterIds);
    expect(sections.map((section, index) => {
      const end = sections[index + 1]?.index ?? page.length;
      const markup = page.slice(section.index, end);
      return {
        number: markup.match(/<span class="chapter-n" aria-hidden="true">([^<]+)<\/span>/)?.[1],
        label: markup.match(/<p class="eyebrow">([^<]+)<\/p>/)?.[1]
      };
    })).toEqual([
      { number: 'I', label: `${locale === 'es' ? 'I · El cambio' : 'I · The shift'}` },
      { number: 'II', label: `${locale === 'es' ? 'II · Qué hacemos' : 'II · What we do'}` },
      { number: 'III', label: `${locale === 'es' ? 'III · El norte' : 'III · Where this goes'}` },
      { number: 'IV', label: `${locale === 'es' ? 'IV · Principios' : 'IV · Principles'}` },
      { number: 'V', label: `${locale === 'es' ? 'V · Escúchalo' : 'V · Hear it'}` },
      { number: 'VI', label: `${locale === 'es' ? 'VI · Mantente al tanto' : 'VI · Stay in the loop'}` }
    ]);

    const label = locale === 'es' ? 'Contenido' : 'Contents';
    expect(page).toContain(`<nav class="chapter-index shell" aria-label="${label}">`);
    expect(page).not.toContain('data-running-head');
    expect(page).not.toContain('class="running-head"');
    expect(page).not.toContain('data-chapter-label');
    expect(page).toContain(`<nav class="nav-links" aria-label="${copy[locale].sectionsLabel}">`);
    for (const link of copy[locale].nav) {
      expect(page).toContain(`<a href="${link.href}">${link.label}</a>`);
    }
    expect(page).toContain('<div class="progress-rail" data-progress aria-hidden="true"><span></span></div>');
    expect([...page.matchAll(/class="door-row"/g)]).toHaveLength(3);
    expect(page).toContain('aria-describedby="door-demos-body door-demos-who"');
    for (const id of chapterIds) {
      expect(page).toContain(`href="#${id}"`);
    }
    expect(page).not.toContain('class="sec-head');
  });

  test.each(locales)('keeps the existing Ignite poster once in chapter V in %s', (locale) => {
    const page = renderPage(locale);
    const poster = page.match(/<img class="talk-poster"[^>]*>/)?.[0];
    const talk = page.slice(page.indexOf('id="charla"'), page.indexOf('id="unete"'));

    expect(page).not.toContain('data-plate');
    expect(page.match(/class="talk-poster"/g)).toHaveLength(1);
    expect(page.slice(0, page.indexOf('id="charla"'))).not.toContain('ignite-poster');
    expect(page.slice(page.indexOf('id="unete"'))).not.toContain('ignite-poster');
    expect(talk).toContain(poster);
    expect(poster).not.toBeNull();
    expect(poster).toContain(`alt="${copy[locale].talk.posterAlt}"`);
    expect(poster).toContain('width="1280" height="720"');
    expect(poster).toContain('loading="lazy" decoding="async"');
  });

  test('marks chapter II so its numeral can stay clear of the existing lead', () => {
    const page = renderPage('en');

    expect(page).toMatch(/class="chapter-head(?: chapter-head--inline)? chapter-head--ii"/);
  });
});
