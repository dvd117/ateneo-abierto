import { describe, expect, test } from 'vitest';
import { copy } from './content';

const locales = ['es', 'en'] as const;

describe('landing page copy', () => {
  test('leads with the claim of the page in both locales', () => {
    expect(copy.es.hero.titleLines.map((line) => line.text)).toEqual([
      'Deja de preguntarle.',
      'Empieza a delegarle.'
    ]);

    // The second line is the italic one in both locales; the design puts the
    // serif emphasis on the half that names the shift.
    for (const locale of locales) {
      const [first, second] = copy[locale].hero.titleLines;
      expect(first.em).toBeUndefined();
      expect(second.em).toBe(true);
    }
  });

  test('offers one call to action, and it goes to the form', () => {
    expect(copy.es.hero.primaryCta).toBe('Sumarme');
    expect(copy.en.hero.primaryCta).toBe('Join');
    expect('secondaryCta' in copy.es.hero).toBe(false);
  });

  test('keeps the hero promise free of dates and prices', () => {
    for (const locale of locales) {
      const hero = JSON.stringify(copy[locale].hero);

      expect(hero).not.toMatch(/\$\s?\d/);
      expect(hero).not.toMatch(/\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i);
      expect(hero).not.toMatch(/\b20(2[6-9]|3\d)\b/);
    }

    expect(copy.es.hero.manifesto).toContain('sin pagar nada para empezar');
    expect(copy.en.hero.manifesto).toContain('at no cost to start');
  });

  test('labels the agent window as a local simulation', () => {
    expect(copy.es.hero.windowCaption).toContain('no se conecta a nada');
    expect(copy.es.hero.windowCaption).toContain('de ejemplo');
    expect(copy.en.hero.windowCaption).toContain('connects to nothing');
  });

  test('offers the same four office and study sequences in both locales', () => {
    const ids = ['gastos', 'presentacion', 'apuntes', 'correo'];

    for (const locale of locales) {
      expect(copy[locale].scenes.map((scene) => scene.id)).toEqual(ids);
    }
  });

  test('gives every sequence a prompt, files, four steps and a produced document', () => {
    for (const locale of locales) {
      for (const scene of copy[locale].scenes) {
        expect(scene.session.length).toBeGreaterThan(0);
        expect(scene.prompt.length).toBeGreaterThan(20);
        expect(scene.files.length).toBeGreaterThanOrEqual(1);
        expect(scene.steps).toHaveLength(4);

        for (const step of scene.steps) {
          expect(step.length).toBeGreaterThan(0);
        }

        // The document is the payoff: it renders as a table or an outline,
        // never as an empty panel.
        const { doc } = scene;
        expect(doc.kicker.length).toBeGreaterThan(0);
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.note.length).toBeGreaterThan(0);
        expect(Boolean(doc.table) || Boolean(doc.list)).toBe(true);

        if (doc.table) {
          for (const row of doc.table.rows) {
            expect(row.cells).toHaveLength(doc.table.head.length);
          }
        }

        // Round one settles the work in Markdown.
        expect(scene.savedAs).toMatch(/\.md$/);

        // Round two converts it into the file the visitor will actually send.
        const { followUp } = scene;
        expect(followUp.prompt.length).toBeGreaterThan(10);
        expect(followUp.ack.length).toBeGreaterThan(0);
        expect(followUp.steps).toHaveLength(2);
        expect(['xlsx', 'pptx', 'pdf', 'docx']).toContain(followUp.file.kind);
        expect(followUp.file.name.endsWith(`.${followUp.file.kind}`)).toBe(true);
        // Same document, new format: the base name carries over from the draft.
        expect(followUp.file.name.replace(/\.\w+$/, '')).toBe(scene.savedAs.replace(/\.md$/, ''));
      }
    }
  });

  test('covers each proprietary format once, in both locales', () => {
    for (const locale of locales) {
      const kinds = copy[locale].scenes.map((scene) => scene.followUp.file.kind).sort();
      expect(kinds).toEqual(['docx', 'pdf', 'pptx', 'xlsx']);
    }

    // The follow-up names the format in plain words a visitor would use.
    expect(copy.es.scenes.map((scene) => scene.followUp.prompt).join(' ')).toMatch(/Excel.*PowerPoint.*PDF.*Word/);
  });

  test('drops the convocatorias framing for work anyone recognises', () => {
    for (const locale of locales) {
      const scenes = JSON.stringify(copy[locale].scenes).toLowerCase();

      expect(scenes).not.toContain('convocatoria');
      expect(scenes).not.toContain('beca');
    }

    expect(copy.es.scenes[0].prompt).toContain('hojas de cálculo');
    expect(copy.es.scenes[1].prompt).toContain('presentación');
    expect(copy.es.scenes[2].prompt).toContain('PDF');
    expect(copy.es.scenes[3].prompt).toContain('junta');
  });

  test('never uses the program names another organisation owns', () => {
    for (const locale of locales) {
      const all = JSON.stringify(copy[locale]).toLowerCase();

      expect(all).not.toContain('constructores');
      expect(all).not.toContain('builders');
      expect(all).not.toContain('fuckup');
    }
  });

  test('carries the security line and the contact address in the footer', () => {
    for (const locale of locales) {
      const { footer } = copy[locale];

      expect(footer.securityLine.length).toBeGreaterThan(0);
      expect(footer.contact).toBe('ateneo@aragort.com');
    }

    // The repository is private: nothing on the page points at the source.
    expect(JSON.stringify(copy)).not.toContain('github.com');

    expect(copy.es.footer.securityLine).toBe('La seguridad es parte de cómo trabajamos.');
  });

  test('keeps Spanish public copy in Venezuelan tuteo, without English jargon', () => {
    const spanish = JSON.stringify(copy.es);

    expect(spanish).not.toContain('hands-on');
    expect(spanish).not.toContain('usted');
    // tuteo markers the copy actually relies on
    expect(copy.es.hero.manifesto).toContain('te responde');
    expect(copy.es.scenes[0].prompt).toContain('Tengo');
  });

  test('uses the inline emphasis convention rather than raw markup', () => {
    for (const locale of locales) {
      const all = JSON.stringify(copy[locale]);

      expect(all).not.toContain('<em>');
      expect(all).not.toContain('<br');
    }

    // Exactly one emphasised phrase in the manifesto, so the pair is balanced.
    for (const locale of locales) {
      const asterisks = copy[locale].hero.manifesto.match(/\*/g) ?? [];
      expect(asterisks).toHaveLength(2);
    }
  });
});
