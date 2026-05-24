import { describe, expect, test } from 'vitest';
import { copy } from './content';

describe('landing page copy', () => {
  test('uses compact bilingual access labels in the hero room module', () => {
    expect(copy.es.hero.room).toEqual(['Espacio', 'Recursos', 'Oportunidad']);
    expect(copy.en.hero.room).toEqual(['Space', 'Resources', 'Opportunity']);

    const roomCopy = `${copy.es.hero.room.join(' ')} ${copy.en.hero.room.join(' ')}`;
    expect(roomCopy).not.toContain('Mismo');
    expect(roomCopy).not.toContain('Same');
  });

  test('explains the Ateneo Abierto name in both languages', () => {
    expect(copy.es.name.title).toBe('Por qué Ateneo Abierto');
    expect(copy.es.name.body).toContain('espacio dedicado al aprendizaje cívico');
    expect(copy.es.name.body).toContain('disposición a empezar');

    expect(copy.en.name.title).toBe('Why “Ateneo Abierto”');
    expect(copy.en.name.body).toContain('space devoted to civic learning');
    expect(copy.en.name.body).toContain('willingness to begin');
  });

  test('keeps the landing manifesto brief and full manifesto available separately', () => {
    expect(copy.es.manifesto.teaser).toContain('se reconstruye desde afuera');
    expect(copy.es.manifesto.body).toContain('los profesores se fueron');
    expect(copy.es.manifesto.body.length).toBeGreaterThan(copy.es.manifesto.teaser.length);
    expect(copy.es.manifesto.cta).toBe('Leer manifiesto completo');
    expect(copy.es.manifesto.subscribeCta).toBe('Si quieres seguir el proceso, deja tu correo.');

    expect(copy.en.manifesto.teaser).toContain('being rebuilt outside the system');
    expect(copy.en.manifesto.body).toContain('teachers left');
    expect(copy.en.manifesto.body.length).toBeGreaterThan(copy.en.manifesto.teaser.length);
    expect(copy.en.manifesto.cta).toBe('Read full manifesto');
    expect(copy.en.manifesto.subscribeCta).toBe('If you want to follow the process, leave your email.');
  });

  test('adds a safe working table cue without operational details', () => {
    expect(copy.es.workingTable.body).toContain('grupos pequeños');
    expect(copy.es.workingTable.body).toMatch(/herramientas.+pueda conservar/);

    expect(copy.en.workingTable.body).toContain('small groups');
    expect(copy.en.workingTable.body).toContain('tools they can keep');

    const workingTableCopy = `${copy.es.workingTable.body} ${copy.en.workingTable.body}`;
    expect(workingTableCopy).not.toMatch(/\b\d{1,2}:\d{2}\b|venue|sede|partner|aliad/i);
  });
});
