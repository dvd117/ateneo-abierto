import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { fillTemplate, inlineStylesheet, pageFileName, styleHashes } from '../scripts/vite-prerender';
import { aliados } from './content';
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

  test('renders every v3 partner string verbatim in the eight-section layout', () => {
    const html = fillTemplate(template, 'es', undefined, true);
    const copyFile = readFileSync('.w/aliados-copy-v3.md', 'utf8');
    const strings = [
      aliados.meta.title, aliados.meta.description, aliados.eyebrow,
      ...aliados.titleLines.map((line) => line.text), aliados.lead,
      ...aliados.proposal.flatMap((row) => [row.label, row.text]),
      aliados.gap.title, ...aliados.gap.paragraphs, aliados.gap.thesis,
      aliados.approach.title, aliados.approach.intro,
      ...aliados.approach.pillars.flatMap((pillar) => [pillar.title, pillar.body]),
      aliados.formats.title, aliados.formats.intro, ...aliados.formats.cards.flatMap((card) => [card.title, ...card.fields.flatMap((field) => [field.label, field.text])]),
      aliados.respaldo.title, aliados.respaldo.body, aliados.respaldo.caption,
      aliados.vision.title, aliados.vision.near, aliados.vision.far, aliados.vision.farDetail,
      ...aliados.vision.items, aliados.vision.closing,
      aliados.roles.title, aliados.roles.intro,
      ...aliados.roles.cards.flatMap((card) => [card.title, card.body]),
      aliados.roles.give.label, aliados.roles.give.text, aliados.roles.closing,
      aliados.contact.title, aliados.contact.line, aliados.contact.button
    ];
    expect(strings).toHaveLength(78);
    for (const value of strings) {
      expect(copyFile).toContain(value);
      expect(html).toContain(value.replace(/"/g, '&quot;'));
      expect(value).not.toMatch(/[—–]/);
    }
    for (const title of ['La brecha', 'Cómo cerramos esa brecha', 'Un camino en tres pasos', 'La idea ya salió al mundo', 'Hacia dónde vamos', 'Tu lugar en esto', 'Conversemos']) {
      expect(html).toContain(`<h2 class="section-title" id="aliados-`);
      expect(html).toContain(`>${title}</h2>`);
    }
    expect(html).toContain('class="shell aliados-hero-grid"');
    expect(html).toContain('class="door-grid aliados-format-grid"');
    expect(html).toContain('class="shell talk-grid"');
    expect(html).toContain('class="aliados-role-grid"');
    expect(html).toContain('class="shell aliados-contact-grid"');
    expect(html.match(/class="door aliados-format"/g)).toHaveLength(3);
    expect(html.match(/<dl>/g)).toHaveLength(3);
    expect(html.match(/class="aliados-proposal-row"/g)).toHaveLength(3);
    expect(html.match(/class="door aliados-role"/g)).toHaveLength(4);
    for (const href of ['/demos', '/talleres', '/hackaton']) expect(html).toContain(`href="${href}"`);
    for (const old of ['La misión', 'Una comunidad abierta', 'Lo que hacemos', 'Cómo sumarte']) expect(html).not.toContain(old);
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
    expect(html).toContain('class="aliados-approach-copy"');
    expect(aliados.roles.cards.map((card) => card.title)).toEqual(['Espacio', 'Difusión', 'Conexiones', 'Mentoría']);
  });

  test('keeps W5 partner-only card, spacing and talk-credit fixes', () => {
    const styles = readFileSync('src/styles.css', 'utf8');
    expect(styles).toMatch(/\.aliados-vision-far-detail\s*\{[^}]*font: var\(--t-lead\);[^}]*max-width: 68ch;/);
    expect(styles).toMatch(/\.aliados-vision-grid li\s*\{[^}]*font: var\(--t-body\);/);
    expect(styles.match(/\.aliados-vision-grid li\s*\{[^}]*\}/)?.[0]).not.toMatch(/(?:min-|max-)?height:/);
    expect(styles).toMatch(/\.aliados-respaldo \.talk-name\s*\{[^}]*display: none;/);
    expect(styles).toMatch(/\.aliados-approach-copy\s*\{/);
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
