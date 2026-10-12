import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { fillTemplate, inlineStylesheet, pageFileName, styleHashes } from '../scripts/vite-prerender';
import { aliados, copy } from './content';
import { renderPage } from './render';

/** The parts of index.html the prerender must find, in Vite's output shape. */
const template = `<!doctype html>
<html lang="es">
  <head>
    <meta
      name="description"
      content="old"
    />
    <meta property="og:description" content="old" />
    <meta property="og:url" content="https://ateneo-abierto.org/" />
    <meta property="og:locale" content="es_VE" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta name="twitter:description" content="old" />
    <meta property="og:title" content="old" />
    <meta name="twitter:title" content="old" />
    <meta property="og:image" content="old" />
    <meta name="twitter:image" content="old" />
    <meta property="og:image:alt" content="old" />
    <meta name="twitter:image:alt" content="old" />
    <link rel="canonical" href="https://ateneo-abierto.org/" />
    <link rel="alternate" hreflang="es" href="https://ateneo-abierto.org/" />
    <link rel="alternate" hreflang="en" href="https://ateneo-abierto.org/?lang=en" />
    <link rel="alternate" hreflang="x-default" href="https://ateneo-abierto.org/" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <title>Ateneo Abierto</title>
    <link rel="stylesheet" crossorigin href="/assets/index-abc123.css">
    <script type="application/ld+json">
      {
        "@graph": [
          { "@type": "WebSite", "url": "https://ateneo-abierto.org/", "name": "Ateneo Abierto", "description": "old", "inLanguage": ["es", "en"] },
          { "@type": "Organization", "name": "Ateneo Abierto", "email": "old@example.org" }
        ]
      }
    </script>
  </head>
  <body>
    <div id="app" data-locale="es"><!--prerender--></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

describe('build-time prerender', () => {
  test.each(['es', 'en'] as const)('closes the hero copy with the three ordered steps in %s', (locale) => {
    const html = fillTemplate(template, locale);
    const heroCopy = html.match(/<div class="hero-copy">([\s\S]*?)<\/div>\s*<figure class="agent-figure">/)?.[1] ?? '';
    const strip = heroCopy.match(/<ol class="hero-steps">([\s\S]*?)<\/ol>/);
    const steps = locale === 'es'
      ? [
          ['Tú diriges', 'Le señalas la carpeta y le dices qué necesitas.'],
          ['El agente trabaja', 'Arma un plan, abre tus archivos y guarda el resultado.'],
          ['Tú decides', 'Lo revisas y decides qué sigue.']
        ]
      : [
          ['You direct', 'You point it at the folder and say what you need.'],
          ['The agent works', 'It builds a plan, opens your files and saves the result.'],
          ['You decide', 'You check it and decide what comes next.']
        ];

    expect(html.match(/<ol class="hero-steps">/g)).toHaveLength(1);
    expect(strip).not.toBeNull();
    const items = [...(strip?.[1] ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)];
    expect(items).toHaveLength(3);
    for (const [index, [title, text]] of steps.entries()) {
      expect(items[index][1]).toContain(`<span class="hero-step-n" aria-hidden="true">${['I', 'II', 'III'][index]}</span>`);
      expect(items[index][1]).toContain(`<span class="hero-step-title">${title}</span>`);
      expect(items[index][1]).toContain(`<span class="hero-step-text">${text}</span>`);
    }
    expect(heroCopy).toMatch(/<div class="hero-actions">[\s\S]*?<\/div>\s*<ol class="hero-steps">/);
    expect(heroCopy).toMatch(/<\/ol>\s*$/);
  });

  test.each(['es', 'en'] as const)('renders the six desktop chapter links without a current chapter in %s', (locale) => {
    const html = fillTemplate(template, locale);
    const nav = html.match(/<nav class="nav-links chapter-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const links = [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    const names = locale === 'es'
      ? ['El cambio', 'Qué hacemos', 'El norte', 'Principios', 'Escúchalo', 'Mantente al tanto']
      : ['The shift', 'What we do', 'Where this goes', 'Principles', 'Hear it', 'Stay in the loop'];
    const ids = ['cambio', 'programa', 'norte', 'principios', 'charla', 'unete'];
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    expect(links).toHaveLength(7);
    for (let index = 0; index < 6; index++) {
      expect(links[index][1]).toContain(`href="#${ids[index]}"`);
      expect(links[index][1]).toContain(`aria-label="${numerals[index]} ${names[index]}"`);
      expect(links[index][2]).toContain(`aria-hidden="true">${numerals[index]}</span>`);
      expect(links[index][2]).toContain(`>${names[index]}</span>`);
    }
    expect(links[6][1]).toContain('href="#unete"');
    expect(links[6][2]).toBe(copy[locale].hero.primaryCta);
    expect(nav).not.toContain('aria-current');
    expect(html).not.toContain('class="progress-tick"');
    const legacy = html.match(/<nav class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    for (const link of copy[locale].nav) expect(legacy).toContain(`<a href="${link.href}">${link.label}</a>`);
  });

  test('runs five partner chapters and the contact pill without legacy nav or locale controls', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const header = html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[1] ?? '';
    const nav = header.match(/<nav class="nav-links chapter-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const chapters = [...nav.matchAll(/<a class="chapter-nav-link" data-chapter-link href="#([^"]+)" aria-label="([^"]+)">([\s\S]*?)<\/a>/g)];
    const ids = ['problema', 'metodo', 'camino', 'norte', 'tu-lugar'];
    const names = ['El problema', 'El método', 'El camino', 'El norte', 'Tu lugar'];
    const numerals = ['I', 'II', 'III', 'IV', 'V'];

    expect(chapters).toHaveLength(5);
    expect(header.match(/data-chapter-link/g)).toHaveLength(5);
    expect(header).toContain(`<nav class="nav-links chapter-nav" aria-label="${copy.es.indexLabel}">`);
    chapters.forEach((chapter, index) => {
      expect(chapter[1]).toBe(ids[index]);
      expect(chapter[2]).toBe(`${numerals[index]} ${names[index]}`);
      expect(chapter[3]).toBe(`<span class="chapter-nav-n" aria-hidden="true">${numerals[index]}</span><span class="chapter-nav-name visually-hidden">${names[index]}</span>`);
      expect(html.match(new RegExp(`id="${ids[index]}"`, 'g'))).toHaveLength(1);
    });
    expect(nav.match(/<a\b/g)).toHaveLength(6);
    expect(nav).toContain('<a class="chapter-join" href="#conversemos">Conversemos</a>');
    expect(header).not.toContain('<nav class="nav-links"');
    expect(header).not.toContain('locale-toggle');
    expect(header).not.toContain('data-locale');
    expect(header).not.toContain('aria-current');
    expect(header).toContain('data-progress');
  });

  // Captured on a950b3f: adding partner navigation must not alter either landing header.
  test.each(['es', 'en'] as const)('preserves the landing header byte for byte in %s', (locale) => {
    const header = renderPage(locale).match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? '';
    const hashes = {
      es: '6f1122ab8b6c02f82cf41d4ee495090f17e6121e32685688acf4ff7269ddc035',
      en: '96762656daa63cbfd08c0a0891fa767602f502de350a9dfdfb510a886d2c8283'
    };

    expect(createHash('sha256').update(header).digest('hex')).toBe(hashes[locale]);
  });

  test('opens each partner chapter with the shared numeral, eyebrow, preserved title id and intro', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const chapters = [
      { key: 'gap', id: 'problema', number: 'I', eyebrow: 'El problema' },
      { key: 'approach', id: 'metodo', number: 'II', eyebrow: 'El método' },
      { key: 'formats', id: 'camino', number: 'III', eyebrow: 'El camino' },
      { key: 'vision', id: 'norte', number: 'IV', eyebrow: 'El norte' },
      { key: 'roles', id: 'tu-lugar', number: 'V', eyebrow: 'Tu lugar' }
    ] as const;

    expect(html.match(/<header class="chapter-head/g)).toHaveLength(5);
    for (const { key, id, number, eyebrow } of chapters) {
      const content = aliados[key];
      const titleId = `aliados-${key}-title`;
      const section = html.match(new RegExp(`<section class="sec chapter aliados-${key}" id="${id}" aria-labelledby="${titleId}">([\\s\\S]*?)</section>`))?.[1] ?? '';
      const head = section.match(/<header class="chapter-head[^" ]*(?: chapter-head--inline)?">([\s\S]*?)<\/header>/)?.[1] ?? '';

      expect(content.eyebrow).toBe(eyebrow);
      expect(head).toContain(`<span class="chapter-n" aria-hidden="true">${number}</span>`);
      expect(head).toContain(`<p class="eyebrow">${number} · ${eyebrow}</p>`);
      expect(head).toContain(`<h2 class="section-title chapter-title" id="${titleId}"><span class="mask"><span>${content.title}</span></span></h2>`);
      expect(html.match(new RegExp(`id="${titleId}"`, 'g'))).toHaveLength(1);
      if ('intro' in content) {
        expect(head).toContain(`<p class="lead chapter-lead">${content.intro}</p>`);
        expect(section.split(content.intro)).toHaveLength(2);
      } else {
        expect(head).not.toContain('chapter-lead');
      }
    }
    expect(html).not.toContain('class="sec-head"');
    expect(html).not.toContain('aliados-approach-copy');
    expect(html).not.toContain('aliados-approach-intro');
  });

  test('removes replaced partner-head styles and the old approach grid', () => {
    const styles = readFileSync('src/styles.css', 'utf8');
    const partner = styles.slice(styles.indexOf('/* The partner page changes pace'));
    const desktop = partner.slice(partner.indexOf('@media (min-width: 861px)'));

    expect(partner).not.toMatch(/\.aliados-(?:gap|approach|vision|roles) \.sec-head/);
    expect(partner).not.toMatch(/\.aliados-approach-(?:copy|intro)\s*\{/);
    expect(desktop).not.toMatch(/\.aliados-approach (?:\.shell|\.chapter-head)\s*\{/);
    expect(desktop).not.toMatch(/grid-area: (?:head|cards|note);/);
  });

  test('puts the gap copy and thesis beside each other only on desktop, beneath the full-width head', () => {
    const styles = readFileSync('src/styles.css', 'utf8');
    const partner = styles.slice(styles.indexOf('/* The partner page changes pace'));
    const desktop = partner.slice(partner.indexOf('@media (min-width: 861px)'));
    const phone = partner.match(/@media \(max-width: 860px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    const base = partner.match(/\.aliados-gap-thesis\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(desktop).toMatch(/\.aliados-gap \.shell\s*\{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 6fr\) minmax\(0, 6fr\);[^}]*column-gap: clamp\(2rem, 5vw, 5rem\);[^}]*align-items: start;/);
    expect(desktop).toMatch(/\.aliados-gap \.chapter-head\s*\{[^}]*grid-column: 1 \/ -1;/);
    expect(desktop).toMatch(/\.aliados-gap-copy\s*\{[^}]*grid-column: 1;/);
    expect(desktop).toMatch(/\.aliados-gap-thesis\s*\{[^}]*grid-column: 2;[^}]*margin: 0;[^}]*font-size: clamp\(1\.4rem, 0\.8rem \+ 1\.1vw, 1\.95rem\);[^}]*line-height: 1\.2;[^}]*max-width: none;[^}]*padding-left: var\(--gap-md\);[^}]*border-left: 2px solid var\(--c-accent\);/);
    expect(base).toMatch(/font-weight: 560;[^}]*font-family: var\(--font-display\);/);
    expect(base).not.toMatch(/(?:font-size|line-height|max-width|margin|padding|border-left):/);
    expect(phone).toMatch(/\.aliados-gap-thesis\s*\{[^}]*max-width: 46ch;[^}]*margin-top: var\(--gap-lg\);[^}]*font-size: clamp\(2rem, 1\.3rem \+ 2\.7vw, 3\.6rem\);[^}]*line-height: 1\.12;/);
    expect(phone).not.toMatch(/grid-template-columns|grid-column|padding-left|border-left/);
  });

  test('opens three method pillars without doors, using one phone column and three desktop columns', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const section = html.match(/<section class="sec chapter aliados-approach"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
    const pillars = [...section.matchAll(/<div class="aliados-pillar" data-reveal><h3>([^<]+)<\/h3><p>([^<]+)<\/p><\/div>/g)];
    const styles = readFileSync('src/styles.css', 'utf8');
    const partner = styles.slice(styles.indexOf('/* The partner page changes pace'));
    const desktop = partner.slice(partner.indexOf('@media (min-width: 861px)'));
    const baseGrid = partner.match(/\.aliados-pillar-grid\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(pillars).toHaveLength(3);
    expect(pillars.map(([, title, body]) => ({ title, body }))).toEqual(aliados.approach.pillars);
    expect(section).not.toMatch(/class="[^"]*\bdoor\b/);
    expect(baseGrid).toMatch(/display: grid;[^}]*gap: var\(--gap-md\);/);
    expect(baseGrid).not.toMatch(/grid-template-columns|grid-area/);
    expect(desktop).toMatch(/\.aliados-pillar-grid\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(partner).toMatch(/\.aliados-pillar\s*\{[^}]*padding-top: var\(--gap-md\);[^}]*border-top: 1px solid var\(--c-border\);/);
    expect(partner).toMatch(/\.aliados-pillar h3\s*\{[^}]*margin: 0 0 0\.6rem;[^}]*font: 400 1\.6rem\s*\/\s*1\.15 var\(--font-display\);[^}]*color: var\(--c-fg\);/);
    expect(partner).toMatch(/\.aliados-pillar p\s*\{[^}]*margin: 0;[^}]*font: var\(--t-body\);[^}]*color: var\(--c-fg-2\);/);
    expect(partner).not.toContain('.aliados-pillar-grid .door');
  });

  test('writes the finished Spanish page into the first response', () => {
    const html = fillTemplate(template, 'es');

    expect(html).not.toContain('<!--prerender-->');
    expect(html).toContain('Deja de preguntarle.');
    expect(html).toContain('data-thread data-autoplay');
    expect(html).toContain('<html lang="es"');
    expect(html).toContain('<title>Ateneo Abierto · Deja de preguntarle. Empieza a dirigirlo.</title>');
    expect(html).toMatch(/name="description"\s+content="[^"]*herramientas abiertas, gratis para empezar/);
    expect(html).toContain('"@type": "WebSite", "url": "https://ateneo-abierto.org/", "name": "Ateneo Abierto", "description": "Un chatbot te responde.');
  });

  test('writes the English page with English metadata throughout', () => {
    const html = fillTemplate(template, 'en');

    expect(html).toContain('Stop asking it things.');
    expect(html).not.toContain('Deja de preguntarle.');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('data-locale="en"');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="og:locale:alternate" content="es_VE"');
    expect(html).toContain('href="https://ateneo-abierto.org/?lang=en"');
    expect(html).toContain('<title>Ateneo Abierto · Stop asking it things. Start directing it.</title>');
    expect(html).toMatch(/name="description"\s+content="A chatbot answers you\./);
    expect(html).toMatch(/name="description"\s+content="[^"]*open tools, free to start/);
    // The WebSite node speaks the page's language; the Organization node is left alone.
    expect(html).toContain('"@type": "WebSite", "url": "https://ateneo-abierto.org/", "name": "Ateneo Abierto", "description": "A chatbot answers you. An agent does the work with you.');
    expect(html).not.toContain('"description": "old"');
    expect(html).toContain('{ "@type": "Organization", "name": "Ateneo Abierto", "email": "old@example.org" }');
    expect(html).toContain('property="og:title" content="Ateneo Abierto — Stop asking it things. Start directing it."');
    expect(html).toContain('name="twitter:title" content="Ateneo Abierto — Stop asking it things. Start directing it."');
    expect(html).toContain('property="og:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).toContain('name="twitter:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).not.toContain('content="old"');
  });

  test('writes each door page with its own head, in both locales', () => {
    const es = fillTemplate(template, 'es', 'hackaton');

    expect(es).toContain('<div id="app" data-locale="es" data-deep-link="hackaton">');
    expect(es).toContain('<title>Ateneo Abierto · Hackatón para no técnicos</title>');
    expect(es).toMatch(/name="description"\s+content="Un día en equipos pequeños, con un mentor por equipo\."/);
    expect(es).toContain('property="og:title" content="Ateneo Abierto — Hackatón para no técnicos"');
    expect(es).toContain('property="og:image" content="https://ateneo-abierto.org/og-hackaton.png"');
    expect(es).toContain('name="twitter:image" content="https://ateneo-abierto.org/og-hackaton.png"');
    expect(es).toContain('property="og:image:alt" content="Ateneo Abierto: Hackatón para no técnicos.');
    expect(es).toContain('property="og:url" content="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('rel="canonical" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('hreflang="es" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('hreflang="en" href="https://ateneo-abierto.org/hackaton?lang=en"');
    expect(es).toContain('hreflang="x-default" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('"@type": "WebSite", "url": "https://ateneo-abierto.org/", "name": "Ateneo Abierto", "description": "Un chatbot');

    const en = fillTemplate(template, 'en', 'demos');
    expect(en).toContain('data-locale="en" data-deep-link="demos"');
    expect(en).toContain('<title>Ateneo Abierto · Open Demos</title>');
    expect(en).toMatch(/name="description"\s+content="Two to five minutes: you show the tool/);
    expect(en).toContain('property="og:image" content="https://ateneo-abierto.org/og-demos-en.png"');
    expect(en).toContain('rel="canonical" href="https://ateneo-abierto.org/demos?lang=en"');
    expect(en).toContain('hreflang="es" href="https://ateneo-abierto.org/demos"');
    expect(en).not.toContain('content="old"');

    // The home page carries no deep link.
    expect(fillTemplate(template, 'es')).not.toContain('data-deep-link');
  });

  test('names each prerendered file after its route and locale', () => {
    expect(pageFileName('es')).toBe('index.html');
    expect(pageFileName('en')).toBe('index.en.html');
    expect(pageFileName('es', 'talleres')).toBe('talleres.html');
    expect(pageFileName('en', 'demos')).toBe('demos.en.html');
  });

  test('renders the Spanish-only unlisted partner page with no alternates, wiring only the talk', () => {
    const html = fillTemplate(template, 'es', undefined, true);

    expect(html).toContain('<html lang="es"');
    expect(html).toContain('<title>Aliados · Ateneo Abierto</title>');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('rel="canonical" href="https://ateneo-abierto.org/aliados"');
    expect(html).toContain('property="og:image" content="https://ateneo-abierto.org/og.png"');
    expect(html).not.toContain('hreflang=');
    expect(html).not.toContain('og:locale:alternate');
    expect(html).toContain('src="/src/main.ts"');
    expect(html).toContain('data-page="aliados"');
    // The talk as the home page has it: vendored poster, no player until play is pressed.
    expect(html).toContain('data-talk-play');
    expect(html).toContain('src="/ignite-poster-1280.jpg"');
    expect(html).not.toContain('<iframe');
    // Its YouTube fallback is the only external link, with both rel values.
    expect(html.match(/<a\b[^>]*href="https?:\/\/[^>]*>/g)).toEqual([
      expect.stringMatching(/^<a class="talk-watch link" href="https:\/\/www\.youtube\.com\/watch\?v=[^"]+" target="_blank" rel="noopener noreferrer">$/)
    ]);
    expect(html).toContain('La tecnología ya está al alcance de todos.');
    expect(html).toContain('<em>Saber usarla, todavía no.</em>');
    expect(html).toContain(`content="${aliados.meta.description}"`);
    for (const path of ['/demos', '/talleres', '/hackaton']) {
      expect(html).toContain(`href="${path}"`);
    }
    expect(html).toContain('href="mailto:ateneo@aragort.com"');
  });

  test('renders every v3 partner string verbatim in the seven-section layout', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    // The approved copy lives in the coordinator's untracked `.w/` notes, so
    // the verbatim check against it only runs where that file exists.
    const copyPath = '.w/aliados-copy-v3.md';
    const copyFile = existsSync(copyPath) ? readFileSync(copyPath, 'utf8') : undefined;
    const strings = [
      aliados.meta.title, aliados.meta.description, aliados.eyebrow,
      ...aliados.titleLines.map((line) => line.text), aliados.lead,
      aliados.gap.title, ...aliados.gap.paragraphs, aliados.gap.thesis,
      aliados.approach.title, aliados.approach.intro,
      ...aliados.approach.pillars.flatMap((pillar) => [pillar.title, pillar.body]),
      aliados.formats.title, aliados.formats.intro, ...aliados.formats.cards.flatMap((card) => [card.title, ...card.fields.flatMap((field) => [field.label, field.text])]),
      aliados.respaldo.body, aliados.respaldo.caption,
      aliados.vision.title, aliados.vision.near, aliados.vision.far, aliados.vision.farDetail,
      ...aliados.vision.items, aliados.vision.closing,
      aliados.roles.title, aliados.roles.intro,
      ...aliados.roles.cards.flatMap((card) => [card.title, card.body]),
      aliados.roles.give.label, aliados.roles.give.text, aliados.roles.closing,
      aliados.contact.title, aliados.contact.line, aliados.contact.button
    ];
    expect(strings).toHaveLength(71);
    for (const value of strings) {
      if (copyFile) expect(copyFile).toContain(value);
      expect(html).toContain(value.replace(/"/g, '&quot;'));
      expect(value).not.toMatch(/[—–]/);
    }
    for (const key of ['gap', 'approach', 'formats', 'vision', 'roles'] as const) {
      expect(html).toContain(`<h2 class="section-title chapter-title" id="aliados-${key}-title"><span class="mask"><span>${aliados[key].title}</span></span></h2>`);
    }
    expect(html).toContain(`>${aliados.contact.title}</h2>`);
    expect(html).toContain('class="shell aliados-hero-grid"');
    expect(html).toContain('class="door-grid aliados-format-grid"');
    expect(html).toContain('class="aliados-role-grid"');
    expect(html).toContain('class="shell aliados-contact-grid"');
    expect(html.match(/class="door aliados-format"/g)).toHaveLength(3);
    expect(html.match(/<dl>/g)).toHaveLength(3);
    expect(html.match(/class="door aliados-role"/g)).toHaveLength(4);
    for (const href of ['/demos', '/talleres', '/hackaton']) expect(html).toContain(`href="${href}"`);
    for (const old of ['La misión', 'Una comunidad abierta', 'Lo que hacemos', 'Cómo sumarte']) expect(html).not.toContain(old);
  });

  test('puts the talk and its context in the partner hero without a proposal or respaldo section', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const hero = html.match(/<section class="hero aliados-hero"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';

    expect(hero).toContain('class="aliados-talk-column"');
    expect(hero).toContain('data-talk-play');
    expect(hero).toContain(`<p class="aliados-talk-note">${aliados.respaldo.body}</p>`);
    expect(hero).toContain(`<p class="aliados-talk-caption">${aliados.respaldo.caption.replace(/"/g, '&quot;')}</p>`);
    expect(html).not.toContain('aliados-proposal');
    expect(html).not.toContain('aliados-respaldo');
    expect(html).not.toContain('La idea ya salió al mundo');
    expect(html).toMatch(/<section class="sec chapter aliados-formats" id="camino"[^>]*>(?:(?!<\/section>)[\s\S])*<\/section>\s*<div class="band band--aliados"/);
  });

  test('renders exactly three partner steps verbatim after the hero grid', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const hero = html.match(/<section class="hero aliados-hero"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
    const steps = hero.match(/<ol class="aliados-steps">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const expected = [
      { title: 'Nos escribes', text: 'Cuéntanos qué espacio, comunidad o experiencia tienes.' },
      { title: 'Conversamos', text: 'En 30 minutos vemos qué formato encaja.' },
      { title: 'Lo hacemos juntos', text: 'Nosotros diseñamos, convocamos y acompañamos.' }
    ];

    expect(aliados.steps).toEqual(expected);
    expect(html.match(/<ol class="aliados-steps">/g)).toHaveLength(1);
    expect(steps.match(/<li>/g)).toHaveLength(3);
    expected.forEach((step, index) => {
      expect(steps).toContain(`<li><span class="aliados-step-n" aria-hidden="true">${['I', 'II', 'III'][index]}</span><span class="aliados-step-title">${step.title}</span><span class="aliados-step-text">${step.text}</span></li>`);
    });
    expect(hero).toContain('</div>\n      <div class="shell aliados-steps-row"><ol class="aliados-steps">');
    expect(hero).not.toContain('class="hero-steps"');
  });

  test('links the partner hero CTA to the unique contact anchor before the talk and steps', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const hero = html.match(/<section class="hero aliados-hero"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';

    expect(hero).toMatch(/<div class="aliados-hero-copy">[\s\S]*?<div class="hero-actions"><a class="button button--fill" href="#conversemos">Conversemos<\/a><\/div>\s*<\/div>/);
    expect(html.match(/id="conversemos"/g)).toHaveLength(1);
    expect(html).toMatch(/<section class="sec aliados-contact" id="conversemos" aria-labelledby="aliados-contact-title">/);
    expect(hero.indexOf('class="hero-actions"')).toBeLessThan(hero.indexOf('data-talk-play'));
    expect(hero.indexOf('data-talk-play')).toBeLessThan(hero.indexOf('class="aliados-steps"'));
  });

  test('balances the partner hero columns and shows its own steps at every width', () => {
    const styles = readFileSync('src/styles.css', 'utf8');
    const partner = styles.slice(styles.indexOf('/* The partner page changes pace'));
    const desktop = partner.slice(partner.indexOf('@media (min-width: 861px)'));

    expect(desktop).toMatch(/\.aliados-hero-grid\s*\{[^}]*grid-template-columns: minmax\(0, 6fr\) minmax\(0, 6fr\);[^}]*align-items: center;/);
    expect(styles).toMatch(/\.hero-actions\s*\{[^}]*display: flex;[^}]*flex-wrap: wrap;[^}]*margin-top: var\(--gap-lg\);/);
    expect(partner).toMatch(/\.aliados-steps-row\s*\{[^}]*margin-top: var\(--gap-lg\);/);
    expect(partner).toMatch(/\.aliados-steps\s*\{[^}]*list-style: none;[^}]*margin: 0;[^}]*padding: var\(--gap-md\) 0 0;[^}]*border-top: 1px solid var\(--c-border\);[^}]*display: grid;[^}]*gap: var\(--gap-md\);/);
    expect(desktop).toMatch(/\.aliados-steps\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*gap: var\(--gap-lg\);/);
    expect(partner).toMatch(/\.aliados-steps li\s*\{[^}]*display: grid;[^}]*align-content: start;[^}]*gap: 0\.35rem;/);
    expect(partner).toMatch(/\.aliados-step-n\s*\{[^}]*font: italic 400 1\.15rem\s*\/\s*1 var\(--font-display\);[^}]*color: var\(--c-fg-3\);/);
    expect(partner).toMatch(/\.aliados-steps li:first-child \.aliados-step-n\s*\{[^}]*color: var\(--c-accent\);/);
    expect(partner).toMatch(/\.aliados-step-title\s*\{[^}]*font-weight: 500;[^}]*font-size: 1rem;[^}]*color: var\(--c-fg\);/);
    expect(partner).toMatch(/\.aliados-step-text\s*\{[^}]*font: var\(--t-body\);[^}]*color: var\(--c-fg-2\);/);
    expect(partner).toMatch(/\.aliados-talk-note\s*\{[^}]*font: var\(--t-body\);/);
    expect(partner).not.toMatch(/aliados-(?:proposal|respaldo)/);
    const stepRules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => selector.includes('.aliados-step'));
    for (const [, , declarations] of stepRules) {
      expect(declarations).not.toMatch(/display:\s*none|visibility:\s*hidden|(?:animation|transition)(?:-[\w-]+)?:/);
    }
  });

  // David, 2026-09-29: each hero sentence fits two lines, so the partner hero
  // sets its own, smaller size instead of the landing's display scale.
  test('keeps partner hero alignment and its two-line title size', () => {
    const styles = readFileSync('src/styles.css', 'utf8');

    expect(styles).toMatch(/\.aliados-hero \.hero-line\s*\{[^}]*padding-left: 0\.12em;[^}]*margin-left: -0\.12em;/);
    expect(styles).toMatch(/\.aliados-hero \.hero-title\s*\{[^}]*font-size: clamp\(2\.6rem, 1\.2rem \+ 3\.6vw, 4\.4rem\);/);
  });

  test('keeps the W5 vision split, plain role titles and close approach copy', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    expect(aliados.vision.far).toBe('A largo plazo queremos una red de espacios públicos de conocimiento en Venezuela.');
    expect(aliados.vision.farDetail).toBe('La biblioteca pública del siglo XXI, abierta a cualquiera sin importar sus ingresos, su edad, su raza, su credo o su educación. Un lugar donde encontrar:');
    expect(html).toContain(`<p class="aliados-vision-far">${aliados.vision.far}</p><p class="lead aliados-vision-far-detail">${aliados.vision.farDetail}</p>`);
    expect(html).not.toContain('class="aliados-approach-copy"');
    expect(aliados.roles.cards.map((card) => card.title)).toEqual(['Espacio', 'Difusión', 'Conexiones', 'Mentoría']);
  });

  test('keeps W5 partner-only card, spacing and talk-credit fixes', () => {
    const styles = readFileSync('src/styles.css', 'utf8');
    expect(styles).toMatch(/\.aliados-vision-far-detail\s*\{[^}]*font: var\(--t-lead\);[^}]*max-width: 68ch;/);
    expect(styles).toMatch(/\.aliados-vision-grid li\s*\{[^}]*font: var\(--t-body\);/);
    expect(styles.match(/\.aliados-vision-grid li\s*\{[^}]*\}/)?.[0]).not.toMatch(/(?:min-|max-)?height:/);
    expect(styles).toMatch(/\.aliados-hero \.talk-name\s*\{[^}]*display: none;/);
    expect(styles).not.toMatch(/\.aliados-approach-copy\s*\{/);
  });

  test('keeps the partner page unlisted from the sitemap and all ordinary pages', () => {
    expect(readFileSync('public/sitemap.xml', 'utf8')).not.toContain('/aliados');
    for (const locale of ['es', 'en'] as const) {
      expect(renderPage(locale)).not.toContain('href="/aliados"');
    }
    for (const route of ['demos', 'talleres', 'hackaton'] as const) {
      expect(fillTemplate(template, 'es', route)).not.toContain('href="/aliados"');
    }
  });

  test('fails loudly rather than ship a page with stale metadata', () => {
    expect(() => fillTemplate(template.replace('<title>Ateneo Abierto</title>', ''), 'en')).toThrow(
      /<title>/
    );
    expect(() => fillTemplate(template.replace('<!--prerender-->', ''), 'es')).toThrow(/placeholder/);
  });

  test('inlines the stylesheet in place of its link', () => {
    const html = inlineStylesheet(template, 'assets/index-abc123.css', 'body{color:red}');

    expect(html).toContain('<style>body{color:red}</style>');
    expect(html).not.toContain('index-abc123.css');
  });

  test('hashes each inline style block exactly as the browser will', () => {
    // sha256("body{color:red}"), base64, computed with node:crypto outside the code under test.
    const html = '<style>body{color:red}</style><noscript><style>body{color:red}</style></noscript>';

    expect(styleHashes(html)).toEqual(["'sha256-FcQqt3aNlV7AZnGV4zkQRVeCeJOxbMPnQSx258L803E='"]);
  });
});
