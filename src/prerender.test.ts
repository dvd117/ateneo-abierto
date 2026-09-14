import { describe, expect, test } from 'vitest';
import { fillTemplate, inlineStylesheet, styleHashes } from '../scripts/vite-prerender';

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
    <title>Ateneo Abierto</title>
    <link rel="stylesheet" crossorigin href="/assets/index-abc123.css">
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
    expect(html).toContain('property="og:title" content="Ateneo Abierto — Stop asking it things. Start handing it work."');
    expect(html).toContain('name="twitter:title" content="Ateneo Abierto — Stop asking it things. Start handing it work."');
    expect(html).toContain('property="og:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).toContain('name="twitter:image" content="https://ateneo-abierto.org/og-en.png"');
    expect(html).not.toContain('content="old"');
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
