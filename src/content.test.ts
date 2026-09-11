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

  test('frames the shift as efficiency, not scarcity', () => {
    for (const locale of locales) {
      const { shift } = copy[locale];

      // David, 2026-09-11: same goal, without the negative connotation. No
      // "more with less", nothing about what the country lacks.
      expect(shift.lead).not.toMatch(/más con menos|lo poco que|do more with less|the little they/i);
      expect(shift.lead).toMatch(/chatbot/i);
      expect(shift.lead).toMatch(/gratuitas|free tools/i);
    }

    expect(copy.es.shift.titleLines.map((line) => line.text)).toEqual([
      'De preguntar',
      'a delegar'
    ]);
    expect(copy.es.shift.titleLines[1].em).toBe(true);
  });

  test('runs one recognisable office task down both columns, five steps each', () => {
    for (const locale of locales) {
      const { shift } = copy[locale];

      expect(shift.columns.map((column) => column.kind)).toEqual(['chatbot', 'agent']);
      expect(shift.task).not.toMatch(/convocatoria/i);

      for (const column of shift.columns) {
        expect(column.steps).toHaveLength(5);
        expect(column.tallyCount).toMatch(/5/);
        expect(column.tallyText.length).toBeGreaterThan(0);

        for (const step of column.steps) {
          expect(step.actor.length).toBeGreaterThan(0);
          expect(step.text.length).toBeGreaterThan(10);
        }
      }

      // The count is the point: the agent column does three of the five.
      const [chatbot, agent] = shift.columns;
      expect(chatbot.steps.filter((step) => step.done)).toHaveLength(0);
      expect(agent.steps.filter((step) => step.done)).toHaveLength(3);
    }

    // The task continues the window's first sequence rather than inventing one.
    expect(copy.es.shift.task).toContain('gastos');
    expect(copy.en.shift.task).toContain('spending');
  });

  test('names the network cities under the hero without claiming a confirmed site', () => {
    for (const locale of locales) {
      const { network } = copy[locale];

      expect(network.cities).toHaveLength(8);
      expect(network.cities.map((city) => city.name)).toContain('Caracas');
      expect(network.edges.length).toBeGreaterThan(0);

      for (const [from, to] of network.edges) {
        expect(network.cities[from]).toBeDefined();
        expect(network.cities[to]).toBeDefined();
      }

      // Nothing on the page may read as an announced venue.
      expect(network.caption).not.toMatch(/se suma|joins|sede|venue/i);
      expect(network.alt).toMatch(/no sedes confirmadas|not confirmed sites/i);
    }
  });

  test('never uses the program names another organisation owns', () => {
    for (const locale of locales) {
      const all = JSON.stringify(copy[locale]).toLowerCase();

      expect(all).not.toContain('constructores');
      expect(all).not.toContain('builders');
      expect(all).not.toContain('fuckup');
    }
  });


  test('opens three doors, all leading to the same form', () => {
    for (const locale of locales) {
      const { doors } = copy[locale];

      expect(doors.doors).toHaveLength(3);
      expect(doors.doors.map((door) => door.n)).toEqual(['01', '02', '03']);

      for (const door of doors.doors) {
        expect(door.title.length).toBeGreaterThan(0);
        expect(door.body.length).toBeGreaterThan(30);
        expect(door.who.length).toBeGreaterThan(10);
        expect(door.whoLabel.length).toBeGreaterThan(0);
        expect(door.cta.length).toBeGreaterThan(0);
      }

      // Talleres is the fourth thing we do, not a fourth door: one line, and
      // it goes through the same form rather than a second address.
      expect(doors.workshops.label.length).toBeGreaterThan(0);
      expect(doors.workshops.text.length).toBeGreaterThan(20);
      expect(doors.workshops.cta.length).toBeGreaterThan(0);
    }

    // Demo Nights is the settled name, in both locales.
    expect(copy.es.doors.doors[2].title).toBe('Demo Nights');
    expect(copy.en.doors.doors[2].title).toBe('Demo Nights');
  });

  test('says who each door is for, and ties mentorships to the hackathon', () => {
    // Nobody should have to guess which door is theirs.
    expect(copy.es.doors.doors[0].who).toMatch(/docentes|oficina/);
    expect(copy.es.doors.doors[1].who).toMatch(/hackatón/i);
    expect(copy.en.doors.doors[1].who).toMatch(/hackathon/i);

    // Neither door may ask for code as a precondition.
    expect(copy.es.doors.lead).toMatch(/programar/);
    expect(copy.es.doors.doors[0].body).toMatch(/línea de código/);
    expect(copy.en.doors.doors[0].body).toMatch(/line of code/);
  });

  test('keeps prices and dates out of the program section', () => {
    for (const locale of locales) {
      const doors = JSON.stringify(copy[locale].doors);

      expect(doors).not.toMatch(/\$\s?\d/);
      expect(doors).not.toMatch(/\b20(2[6-9]|3\d)\b/);
      expect(doors).not.toMatch(/\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i);
    }
  });


  test('states the four principles, resilience included, in both locales', () => {
    for (const locale of locales) {
      const { principles } = copy[locale];

      expect(principles.items).toHaveLength(4);
      expect(principles.items.map((item) => item.icon)).toEqual([
        'open',
        'agency',
        'plain',
        'resilient'
      ]);

      for (const item of principles.items) {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.body.length).toBeGreaterThan(30);
      }
    }
  });

  test('describes resilience as the real device story, not a mid-range Android', () => {
    for (const locale of locales) {
      const resilience = copy[locale].principles.items[3].body;

      // The mockup said "Android de gama media con 3G". That is not the
      // constraint: you read on the phone and build on a laptop.
      expect(resilience).not.toMatch(/android|gama media|3G/i);
    }

    expect(copy.es.principles.items[3].body).toMatch(/laptop modesta/);
    expect(copy.es.principles.items[3].body).toMatch(/conexión inestable/);
    expect(copy.es.principles.items[3].body).toMatch(/teléfono/);
    expect(copy.en.principles.items[3].body).toMatch(/modest laptop/);
    expect(copy.en.principles.items[3].body).toMatch(/unstable connection/);
    expect(copy.en.principles.items[3].body).toMatch(/phone/i);
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
