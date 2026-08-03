import { describe, expect, test } from 'vitest';
import { copy } from './content';

describe('landing page copy', () => {
  test('explains the Ateneo Abierto name in both languages', () => {
    expect(copy.es.name.title).toBe('Por qué Ateneo Abierto');
    expect(copy.es.name.body).toContain('un lugar donde la gente se reúne a aprender');
    expect(copy.es.name.body).toContain('disposición a empezar');

    expect(copy.en.name.title).toBe('Why "Ateneo Abierto"');
    expect(copy.en.name.body).toContain('a place where people gather to learn');
    expect(copy.en.name.body).toContain('willingness');
  });

  test('folds the manifesto starting point into the landing page in both languages', () => {
    const spanishBeats = copy.es.origin.beats.map((beat) => beat.body).join(' ');
    const englishBeats = copy.en.origin.beats.map((beat) => beat.body).join(' ');

    expect(copy.es.labels.origin).toBe('Punto de partida');
    expect(copy.es.origin.title).toContain('sistema educativo');
    expect(spanishBeats).toContain('Fundayacucho');
    expect(spanishBeats).toContain('recortes presupuestarios');
    expect(spanishBeats).toContain('puente');

    expect(copy.en.labels.origin).toBe('Starting point');
    expect(copy.en.origin.title).toContain('education system');
    expect(englishBeats).toContain('Fundayacucho');
    // Case-insensitive: these anchors may begin a sentence after a rewrite.
    expect(englishBeats).toMatch(/budget cuts/i);
    expect(englishBeats).toMatch(/bridge/i);
  });

  test('keeps the origin section scannable rather than a single prose block', () => {
    for (const locale of ['es', 'en'] as const) {
      const { beats, closing } = copy[locale].origin;

      expect(beats.length).toBeGreaterThanOrEqual(3);

      for (const beat of beats) {
        expect(beat.heading.length).toBeGreaterThan(0);
        // Each beat should stay short enough to read at a glance.
        expect(beat.body.length).toBeLessThan(360);
      }

      expect(closing.length).toBeGreaterThan(0);
    }

    // The line the section exists to deliver is promoted out of the prose.
    expect(copy.es.origin.closing).toContain('se reconstruye desde afuera');
    expect(copy.en.origin.closing).toContain('rebuilt outside the system');
  });

  test('surfaces the pillar time horizons as labels instead of trailing prose', () => {
    expect(copy.es.pillars.items.map((pillar) => pillar.horizon)).toEqual([
      'Para empezar ya',
      'Mediano plazo',
      'Post-transición'
    ]);
    expect(copy.en.pillars.items.map((pillar) => pillar.horizon)).toEqual([
      'Ready to start now',
      'Mid-term',
      'Post-transition'
    ]);

    // The horizon must not also be left dangling at the end of the body copy.
    for (const locale of ['es', 'en'] as const) {
      for (const pillar of copy[locale].pillars.items) {
        expect(pillar.body).not.toContain(pillar.horizon);
      }
    }
  });

  test('lists the boundaries as discrete points in both languages', () => {
    for (const locale of ['es', 'en'] as const) {
      expect(copy[locale].not.title.length).toBeGreaterThan(0);
      expect(copy[locale].not.points.length).toBeGreaterThanOrEqual(3);
    }

    expect(copy.es.not.points[0]).toContain('Estado venezolano');
    expect(copy.en.not.points[0]).toContain('Venezuelan state');
  });

  test('lists audience types as discrete entries in both languages', () => {
    expect(copy.es.audience.who).toContain('Profesores');
    expect(copy.en.audience.who).toContain('Teachers');

    for (const locale of ['es', 'en'] as const) {
      expect(copy[locale].audience.who.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('localizes utility controls in both languages', () => {
    expect(copy.es.labels.backToTop).toBe('Volver arriba');
    expect(copy.en.labels.backToTop).toBe('Back to top');
  });

  test('keeps Spanish public copy free of English workshop jargon', () => {
    const spanishCopy = JSON.stringify(copy.es);

    expect(spanishCopy).not.toContain('hands-on');
    expect(spanishCopy).not.toContain('Ejecutable ya');
    expect(copy.es.hero.body).toContain('recuperar capacidad de acción');
    expect(copy.es.pillars.items[0].body).toContain('Grupos pequeños, ejercicios prácticos.');
    expect(copy.es.pillars.items[0].horizon).toBe('Para empezar ya');
  });

  test('makes subscription calls to action explicit in both languages', () => {
    expect(copy.es.hero.primaryCta).toBe('Recibir actualizaciones');
    expect(copy.es.subscribe.button).toBe('Suscribirme');
    expect(copy.es.subscribe.body).toContain('Déjanos tu correo');
    expect(copy.es.subscribe.newsletterLanguageLabel).toBe('Idioma del boletín');

    expect(copy.en.hero.primaryCta).toBe('Get updates');
    expect(copy.en.subscribe.button).toBe('Subscribe');
    expect(copy.en.subscribe.body).toContain('Leave your email');
    expect(copy.en.subscribe.newsletterLanguageLabel).toBe('Newsletter language');
  });

  test('keeps origin and strategic pillar in institutional voice', () => {
    const firstPersonSingular = [
      /\byo\b/i,
      /\bme\b/i,
      /\bmi\b/i,
      /\bentro\b/i,
      /\bI\b/,
      /\bme\b/i,
      /\bmy\b/i,
      /\bwalk into\b/i
    ];

    const originCopy = (locale: 'es' | 'en') => [
      ...copy[locale].origin.beats.flatMap((beat) => [beat.heading, beat.body]),
      copy[locale].origin.closing
    ];

    const institutionalCopy = [
      ...originCopy('es'),
      copy.es.pillars.items[2].body,
      copy.es.pillars.items[2].horizon,
      ...originCopy('en'),
      copy.en.pillars.items[2].body,
      copy.en.pillars.items[2].horizon
    ];

    for (const body of institutionalCopy) {
      for (const phrase of firstPersonSingular) {
        expect(body).not.toMatch(phrase);
      }
    }
  });

  test('keeps the English workshop body current without banning idiomatic title copy', () => {
    expect(copy.en.pillars.items[0].title).toContain('Hands-on workshops');
    expect(copy.en.pillars.items[0].body).not.toContain('Executable now');
  });
});
