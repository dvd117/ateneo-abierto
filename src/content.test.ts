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

  test('keeps the landing manifesto brief and full manifesto available separately', () => {
    expect(copy.es.manifesto.teaser).toContain('se reconstruye desde afuera');
    expect(copy.es.manifesto.body).toContain('Los profesores se fueron');
    expect(copy.es.manifesto.body.length).toBeGreaterThan(copy.es.manifesto.teaser.length);
    expect(copy.es.manifesto.cta).toBe('Leer manifiesto completo');
    expect(copy.es.manifesto.subscribeCta).toBe('Si quieres seguir el proceso, deja tu correo.');

    expect(copy.en.manifesto.teaser).toContain('being rebuilt outside the system');
    expect(copy.en.manifesto.body).toContain('Teachers left');
    expect(copy.en.manifesto.body.length).toBeGreaterThan(copy.en.manifesto.teaser.length);
    expect(copy.en.manifesto.cta).toBe('Read full manifesto');
    expect(copy.en.manifesto.subscribeCta).toBe('If you want to follow the process, leave your email.');
  });

  test('localizes utility controls in both languages', () => {
    expect(copy.es.labels.backToTop).toBe('Volver arriba');
    expect(copy.en.labels.backToTop).toBe('Back to top');
  });
});
