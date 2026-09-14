import { describe, expect, test } from 'vitest';
import { copy } from './content';
import { renderPage } from './render';
import { matchScene, normalize, writeTypedTurn } from './typed-task';

const locales = ['es', 'en'] as const;

describe('typed task: normalising what was typed', () => {
  test('lowercases, strips accents and splits on anything that is not a letter', () => {
    expect(normalize('Ármame la PRESENTACIÓN, 6 láminas… ¿sí?')).toEqual(['armame', 'la', 'presentacion', 'laminas', 'si']);
    expect(normalize('  ')).toEqual([]);
  });
});

describe('typed task: choosing the scene', () => {
  const scenes = copy.es.scenes;

  test('plays the scene the text hits most, counting plurals', () => {
    expect(matchScene('Tengo las facturas del mes en Excel', scenes)).toEqual({ index: 0, score: 3 });
    expect(matchScene('Necesito las láminas de la clase en PowerPoint', scenes)).toEqual({ index: 1, score: 3 });
    expect(matchScene('Resúmeme este PDF y hazme preguntas para estudiar', scenes).index).toBe(2);
    expect(matchScene('Un correo para la junta con el informe', scenes).index).toBe(3);
    expect(matchScene('Make me slides for class', copy.en.scenes).index).toBe(1);
  });

  test('gives a tie to the earlier scene', () => {
    // "resumen" is a gastos word, "apuntes" an apuntes word: one hit each.
    expect(matchScene('resumen y apuntes', scenes)).toEqual({ index: 0, score: 1 });
    expect(matchScene('apuntes y resumen', scenes)).toEqual({ index: 0, score: 1 });
  });

  test('sends a task with no hit to scene one, with a score of zero', () => {
    expect(matchScene('Organízame las vacaciones', scenes)).toEqual({ index: 0, score: 0 });
    expect(matchScene('', scenes)).toEqual({ index: 0, score: 0 });
  });

  test('gives every scene 8 to 15 keywords in both locales', () => {
    for (const locale of locales) {
      for (const scene of copy[locale].scenes) {
        expect(scene.keywords.length).toBeGreaterThanOrEqual(8);
        expect(scene.keywords.length).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe('typed task: what the visitor typed stays text', () => {
  test('is written with textContent and never as markup', () => {
    const assigned: string[] = [];
    const slot = () => {
      const node = { textContent: '' as string | null };
      Object.defineProperty(node, 'innerHTML', {
        set: (value: string) => assigned.push(value),
        get: () => ''
      });
      return node;
    };
    const prompt = slot();
    const ack = slot();
    const thread = {
      querySelector: (selector: string) =>
        selector === '[data-beat="prompt"]' ? prompt : selector === '[data-beat="ack"]' ? ack : null
    };
    const hostile = '<img src=x onerror="alert(1)">Mis facturas';

    writeTypedTurn(thread, hostile, copy.es.agent.typed.hit);

    expect(prompt.textContent).toBe(hostile);
    expect(ack.textContent).toBe('Esto lo haría así:');
    expect(assigned).toEqual([]);
  });
});

describe('hero input variants', () => {
  test('renders the scripted window by default, with no trace of the typed one', () => {
    for (const locale of locales) {
      const html = renderPage(locale);

      expect(html).toBe(renderPage(locale, { heroInput: 'scripted' }));
      expect(html).toContain('<p class="agent-input" aria-hidden="true" data-input>');
      expect(html).not.toContain('data-typed-form');
      expect(html).not.toContain('data-carry');
    }
  });

  test('renders a real input and the carry checkbox when typed', () => {
    const html = renderPage('es', { heroInput: 'typed' });

    expect(html).toMatch(/<input class="agent-input-field" type="text" maxlength="140"/);
    expect(html).toContain('<button class="agent-send" type="submit" aria-label="Enviar" data-send>');
    expect(html).toMatch(/<label class="agent-carry"><input type="checkbox" data-carry \/> Llevar esta tarea al formulario<\/label>/);
    expect(renderPage('en', { heroInput: 'typed' })).toContain('Carry this task to the form');
  });
});
