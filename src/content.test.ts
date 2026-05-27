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
    expect(copy.es.labels.origin).toBe('Punto de partida');
    expect(copy.es.origin.title).toContain('sistema educativo');
    expect(copy.es.origin.body).toContain('Fundayacucho');
    expect(copy.es.origin.body).toContain('recortes presupuestarios');
    expect(copy.es.origin.body).toContain('puente');

    expect(copy.en.labels.origin).toBe('Starting point');
    expect(copy.en.origin.title).toContain('education system');
    expect(copy.en.origin.body).toContain('Fundayacucho');
    expect(copy.en.origin.body).toContain('budget cuts');
    expect(copy.en.origin.body).toContain('bridge');
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
    expect(copy.es.pillars.items[0].body).toContain('Para empezar ya.');
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

    const institutionalCopy = [
      copy.es.origin.body,
      copy.es.pillars.items[2].body,
      copy.en.origin.body,
      copy.en.pillars.items[2].body
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
