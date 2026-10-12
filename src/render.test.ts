import { describe, expect, test } from 'vitest';
import { copy } from './content';
import { caracasIsoDate, renderAllies, renderNextEvent, renderPage } from './render';

const locales = ['es', 'en'] as const;
const chapterIds = ['cambio', 'programa', 'norte', 'principios', 'charla', 'unete'];

describe('foundation sketch publication structure', () => {
  test.each(locales)('distinguishes chapter navigation from section navigation in %s', (locale) => {
    const page = renderPage(locale);
    const contents = locale === 'es' ? 'Contenido' : 'Contents';
    const sections = locale === 'es' ? 'Secciones' : 'Sections';

    expect(page).toContain(`<nav class="nav-links chapter-nav" aria-label="${contents}">`);
    expect(page).toContain(`<nav class="nav-links" aria-label="${sections}">`);
    expect(page).toContain(`<nav class="footer-nav" aria-label="${sections}">`);
  });

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
});

describe('the shift actor pills', () => {
  test.each(locales)('outlines only visitor rows and ticks only agent rows in %s', (locale) => {
    const page = renderPage(locale);
    const chatbot = page.match(/<div class="shift-col shift-col--chatbot"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
    const agent = page.match(/<div class="shift-col shift-col--agent"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';

    expect(chatbot.match(/class="shift-row is-mine"/g)).toHaveLength(4);
    expect(agent.match(/class="shift-row is-mine"/g)).toHaveLength(2);
    const machineRows = [...`${chatbot}${agent}`.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)]
      .map(([row]) => row)
      .filter((row) => /class="shift-who">(?:Chatbot|Agente|Agent)<\/span>/.test(row));
    expect(machineRows).toHaveLength(4);
    for (const row of machineRows) {
      expect(row).not.toContain('is-mine');
    }

    expect(chatbot).not.toMatch(/shift-run|data-run=/);
    expect([...agent.matchAll(/<li class="shift-row shift-run" data-run="(\d+)"/g)]
      .map(([, order]) => order)).toEqual(['1', '2', '3']);
  });
});

describe('the next date under the call to action', () => {
  const now = new Date('2026-10-12T16:00:00Z');
  const event = { label: 'Próxima demo abierta', date: '2026-11-05', time: '6:30 pm', city: 'Caracas', venue: 'La Biblioteca' };

  test.each(locales)('renders a future date as one line of the given fields in %s', (locale) => {
    const line = renderNextEvent(event, locale, now);
    const when = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2026, 10, 5)));

    expect(line).toBe(
      `<p class="next-date" data-next-date data-date="2026-11-05"><span class="next-date-label">Próxima demo abierta</span> · <span class="next-date-when">${when}</span> · Caracas · La Biblioteca · 6:30 pm</p>`
    );
  });

  test.each(locales)('keeps the line on the day itself and drops it the day after in %s', (locale) => {
    expect(renderNextEvent({ ...event, date: '2026-10-12' }, locale, now)).toContain('data-date="2026-10-12"');
    expect(renderNextEvent({ ...event, date: '2026-10-11' }, locale, now)).toBe('');
  });

  test.each(locales)('keeps today\'s event until Caracas midnight in %s', (locale) => {
    const line = renderNextEvent({ ...event, date: '2026-10-12' }, locale, new Date('2026-10-13T03:59:59Z'));

    expect(line).toContain('data-date="2026-10-12"');
  });

  test.each(locales)('drops yesterday\'s event at Caracas midnight in %s', (locale) => {
    expect(renderNextEvent({ ...event, date: '2026-10-12' }, locale, new Date('2026-10-13T04:00:00Z'))).toBe('');
  });

  test.each([
    ['2026-10-13T03:59:59Z', '2026-10-12'],
    ['2026-10-13T04:00:00Z', '2026-10-13']
  ])('uses the Caracas calendar at %s for the shared expiry comparison', (instant, expected) => {
    expect(caracasIsoDate(new Date(instant))).toBe(expected);
  });

  test.each(locales)('renders nothing without an event in %s', (locale) => {
    expect(renderNextEvent(null, locale, now)).toBe('');
    expect(copy[locale].nextEvent).toBeNull();
    expect(renderPage(locale)).not.toContain('next-date');
  });
});

describe('the allies line under the talk', () => {
  test('renders two or more names, without links, as one list', () => {
    const line = renderAllies({ label: 'Con el apoyo de', names: ['Uno', 'Dos & Tres'] });

    expect(line).toContain('<p class="talk-allies-label">Con el apoyo de</p>');
    expect(line).toContain('<ul class="talk-allies-names"><li>Uno</li><li>Dos &amp; Tres</li></ul>');
    expect(line).not.toContain('<a ');
  });

  test('renders nothing with fewer than two names or none at all', () => {
    expect(renderAllies(null)).toBe('');
    expect(renderAllies({ label: 'Con el apoyo de', names: [] })).toBe('');
    expect(renderAllies({ label: 'Con el apoyo de', names: ['Uno'] })).toBe('');
  });

  test.each(locales)('ships empty, so the talk carries no allies line in %s', (locale) => {
    expect(copy[locale].talk.allies).toBeNull();
    expect(renderPage(locale)).not.toContain('talk-allies');
  });
});
