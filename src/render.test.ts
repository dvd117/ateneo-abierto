import { describe, expect, test } from 'vitest';
import { copy } from './content';
import { renderPage } from './render';

const locales = ['es', 'en'] as const;
const chapterIds = ['cambio', 'programa', 'norte', 'principios', 'charla', 'unete'];

describe('foundation sketch publication structure', () => {
  test.each(locales)('renders six chapters and index links in %s', (locale) => {
    const page = renderPage(locale);
    const sections = [...page.matchAll(/<section class="[^"]*chapter[^"]*" id="([^"]+)" data-chapter-label="([^"]+)"/g)];

    expect(sections.map(([, id]) => id)).toEqual(chapterIds);
    expect(sections.map(([, , label]) => label)).toEqual([
      `${locale === 'es' ? 'I · El cambio' : 'I · The shift'}`,
      `${locale === 'es' ? 'II · Qué hacemos' : 'II · What we do'}`,
      `${locale === 'es' ? 'III · El norte' : 'III · Where this goes'}`,
      `${locale === 'es' ? 'IV · Principios' : 'IV · Principles'}`,
      `${locale === 'es' ? 'V · Escúchalo' : 'V · Hear it'}`,
      `${locale === 'es' ? 'VI · Mantente al tanto' : 'VI · Stay in the loop'}`
    ]);

    const label = locale === 'es' ? 'Contenido' : 'Contents';
    expect(page).toContain(`<nav class="chapter-index shell" aria-label="${label}">`);
    expect(page).toContain(`<span class="running-head" data-running-head aria-hidden="true">${sections[0][2]}</span>`);
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
