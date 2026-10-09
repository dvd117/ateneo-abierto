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

  test.each(locales)('uses the existing Ignite poster and copy for both plates in %s', (locale) => {
    const page = renderPage(locale);
    const plates = [...page.matchAll(/<figure class="plate[^>]*>[\s\S]*?<\/figure>/g)].map(([html]) => html);

    expect(plates).toHaveLength(2);
    for (const plate of plates) {
      expect(plate).toContain('/ignite-poster-1280.webp');
      expect(plate).toContain('/ignite-poster-1280.jpg');
      expect(plate).toContain(`alt="${copy[locale].talk.posterAlt}"`);
      expect(plate).toContain(copy[locale].talk.label);
      expect(plate).toContain('width="1280" height="720"');
      expect(plate).toContain('loading="lazy" decoding="async"');
      expect(plate).not.toMatch(/biblioteca|library/i);
    }
  });
});
