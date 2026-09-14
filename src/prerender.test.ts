import { describe, expect, test } from 'vitest';
import { fillTemplate, inlineStylesheet, pageFileName, styleHashes } from '../scripts/vite-prerender';

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
  </body>
</html>`;

describe('build-time prerender', () => {
  test('writes the finished Spanish page into the first response', () => {
    const html = fillTemplate(template, 'es');

    expect(html).not.toContain('<!--prerender-->');
    expect(html).toContain('Deja de preguntarle.');
    expect(html).toContain('data-thread data-autoplay');
    expect(html).toContain('<html lang="es"');
    expect(html).toContain('<title>Ateneo Abierto · Deja de preguntarle. Empieza a delegarle.</title>');
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
    expect(html).toContain('<title>Ateneo Abierto · Stop asking it things. Start handing it work.</title>');
    expect(html).toMatch(/name="description"\s+content="A chatbot answers you\./);
    expect(html).toMatch(/name="description"\s+content="[^"]*open tools, free to start/);
    // The WebSite node speaks the page's language; the Organization node is left alone.
    expect(html).toContain('"@type": "WebSite", "url": "https://ateneo-abierto.org/?lang=en", "name": "Ateneo Abierto", "description": "A chatbot answers you. An agent does the work with you.');
    expect(html).not.toContain('"description": "old"');
    expect(html).toContain('{ "@type": "Organization", "name": "Ateneo Abierto", "email": "old@example.org" }');
    expect(html).toContain('property="og:title" content="Ateneo Abierto — Stop asking it things. Start handing it work."');
    expect(html).toContain('name="twitter:title" content="Ateneo Abierto — Stop asking it things. Start handing it work."');
    expect(html).toContain('property="og:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).toContain('name="twitter:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).not.toContain('content="old"');
  });

  test('writes each door page with its own head, in both locales', () => {
    const es = fillTemplate(template, 'es', 'hackaton');

    expect(es).toContain('<div id="app" data-locale="es" data-deep-link="hackaton">');
    expect(es).toContain('<title>Ateneo Abierto · Hackatón para no técnicos</title>');
    expect(es).toMatch(/name="description"\s+content="En un fin de semana aprendes a usar tu primer agente y sales con él funcionando, aunque nunca hayas escrito una línea de código\."/);
    expect(es).toContain('property="og:title" content="Ateneo Abierto — Hackatón para no técnicos"');
    expect(es).toContain('property="og:image" content="https://ateneo-abierto.org/og-hackaton.png"');
    expect(es).toContain('name="twitter:image" content="https://ateneo-abierto.org/og-hackaton.png"');
    expect(es).toContain('property="og:image:alt" content="Ateneo Abierto: Hackatón para no técnicos.');
    expect(es).toContain('property="og:url" content="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('rel="canonical" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('hreflang="es" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('hreflang="en" href="https://ateneo-abierto.org/hackaton?lang=en"');
    expect(es).toContain('hreflang="x-default" href="https://ateneo-abierto.org/hackaton"');
    expect(es).toContain('"@type": "WebSite", "url": "https://ateneo-abierto.org/hackaton", "name": "Ateneo Abierto", "description": "Un chatbot');

    const en = fillTemplate(template, 'en', 'demo-nights');
    expect(en).toContain('data-locale="en" data-deep-link="demo-nights"');
    expect(en).toContain('<title>Ateneo Abierto · Demo Nights</title>');
    expect(en).toMatch(/name="description"\s+content="Two to five minutes: you show the tool/);
    expect(en).toContain('property="og:image" content="https://ateneo-abierto.org/og-demo-nights-en.png"');
    expect(en).toContain('rel="canonical" href="https://ateneo-abierto.org/demo-nights?lang=en"');
    expect(en).toContain('hreflang="es" href="https://ateneo-abierto.org/demo-nights"');
    expect(en).not.toContain('content="old"');

    // The home page carries no deep link.
    expect(fillTemplate(template, 'es')).not.toContain('data-deep-link');
  });

  test('names each prerendered file after its route and locale', () => {
    expect(pageFileName('es')).toBe('index.html');
    expect(pageFileName('en')).toBe('index.en.html');
    expect(pageFileName('es', 'talleres')).toBe('talleres.html');
    expect(pageFileName('en', 'demo-nights')).toBe('demo-nights.en.html');
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
