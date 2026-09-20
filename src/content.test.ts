import { describe, expect, test } from 'vitest';
import { copy, DEEP_LINK_ROUTES, type DeepLinkRoute } from './content';
import { renderPage } from './render';

const locales = ['es', 'en'] as const;

describe('landing page copy', () => {
  test('leads with the claim of the page in both locales', () => {
    expect(copy.es.hero.titleLines.map((line) => line.text)).toEqual([
      'Deja de preguntarle.',
      'Empieza a dirigirlo.'
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
    expect(copy.es.hero.primaryCta).toBe('Únete');
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

    expect(copy.es.hero.manifesto).toContain('gratis y sin saber programar');
    expect(copy.en.hero.manifesto).toContain('free, and without knowing how to code');
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
      // David, 2026-09-11: be fair to chatbots — they read documents and hand
      // files back now. And no flat "free tools" claim: the commercial agents
      // we may also teach are paid.
      expect(shift.lead).toMatch(/documentos|documents/i);
      expect(shift.lead).not.toMatch(/gratuitas|free tools/i);
      expect(shift.lead).not.toMatch(/vueltas/i);
    }

    expect(copy.es.shift.titleLines.map((line) => line.text)).toEqual([
      'De preguntar',
      'a dirigir'
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


  test('opens three doors, each with a dialog that says what it is', () => {
    for (const locale of locales) {
      const { doors } = copy[locale];

      expect(doors.doors).toHaveLength(3);
      expect(doors.doors.map((door) => door.n)).toEqual(['01', '02', '03']);

      for (const door of doors.doors) {
        expect(door.title.length).toBeGreaterThan(0);
        expect(door.body.length).toBeGreaterThan(30);
        expect(door.who.length).toBeGreaterThan(10);
        expect(door.whoLabel.length).toBeGreaterThan(0);
        // David, 2026-09-11: three identical links to the form told nobody
        // anything. Each door opens a dialog with its goal, activities and
        // what to expect, and the dialog ends on the form.
        expect(door.id).toMatch(/^[a-z-]+$/);
        expect(door.details.goal.length).toBeGreaterThan(20);
        expect(door.details.activities.length).toBeGreaterThanOrEqual(3);
        expect(door.details.expect.length).toBeGreaterThan(20);
      }

      expect(new Set(doors.doors.map((door) => door.id)).size).toBe(3);
      expect(Object.values(doors.dialog).every((label) => label.length > 0)).toBe(true);

      // Mentorships come with the hackathon, so they are one line under the
      // doors with no way in of their own (2026-09-14).
      expect(doors.mentorship.label.length).toBeGreaterThan(0);
      expect(doors.mentorship.text.length).toBeGreaterThan(20);
      expect('cta' in doors.mentorship).toBe(false);

      // The doors run in the order someone arrives: come and look, bring your
      // team, then build it yourself (David, 2026-09-19). Talleres stays door
      // 02, and it is arranged by email, not through the form.
      expect(doors.doors.map((door) => door.id)).toEqual(['demo-nights', 'talleres', 'hackaton']);
      expect(doors.doors.map((door) => door.n)).toEqual(['01', '02', '03']);
      expect(doors.doors.map((door) => door.cta ?? 'join')).toEqual(['join', 'mail', 'join']);
    }

    // Demo Nights is the settled name, in both locales.
    expect(copy.es.doors.doors[0].title).toBe('Demo Nights');
    expect(copy.en.doors.doors[0].title).toBe('Demo Nights');
  });

  test('gives each door its own address, with a card that only rearranges the door copy', () => {
    for (const locale of locales) {
      const page = copy[locale];
      expect(page.doors.doors.map((door) => door.id)).toEqual([...DEEP_LINK_ROUTES]);

      for (const door of page.doors.doors) {
        const card = page.deepLinks[door.id as DeepLinkRoute];
        expect(card.headline.length).toBeGreaterThanOrEqual(1);
        expect(card.headline.length).toBeLessThanOrEqual(2);
        expect(card.who.length).toBeLessThanOrEqual(2);
        expect(card.headline.join(' ')).toBe(door.title);
        expect(card.who.join(' ')).toBe(door.who);
      }

      // The door ids are real anchors on the page the addresses open.
      const html = renderPage(locale);
      for (const route of DEEP_LINK_ROUTES) {
        expect(html).toContain(`<article class="door" id="${route}"`);
      }
    }
  });

  test('gives band three the one line in the founder\'s voice, unsigned and outside the hidden band', () => {
    // Drafts until David approves the final wording (2026-09-14).
    expect(copy.es.voice).toBe('Este piso lo conoces. Esta vez no es para irte.');
    expect(copy.en.voice).toBe('You know this floor. This time it is not for leaving.');

    for (const locale of locales) {
      const html = renderPage(locale);
      const voices = html.match(/<p class="band-voice[^"]*">[^<]*<\/p>/g) ?? [];

      expect(voices).toEqual([`<p class="band-voice shell">${copy[locale].voice}</p>`]);
      // A sibling that follows band three's closing tag, not a child of the aria-hidden band.
      expect(html).toMatch(/band--three" data-band aria-hidden="true">[\s\S]*?<\/svg>\s*<\/div>\s*<p class="band-voice shell">/);
      expect(html.indexOf('band-voice')).toBeLessThan(html.indexOf('id="unete"'));
    }
  });

  test('says who each door is for, and places mentorships inside the hackathon', () => {
    // Nobody should have to guess which door is theirs.
    expect(copy.es.doors.doors[2].who).toMatch(/docentes|oficina/);
    expect(copy.es.doors.doors[1].who).toMatch(/organizaciones/);
    expect(copy.en.doors.doors[1].who).toMatch(/organizations/);
    // David, 2026-09-11: mentors work inside each hackathon, not after it.
    expect(copy.es.doors.mentorship.text).toMatch(/cada hackatón[\s\S]*incluidas/);
    expect(copy.en.doors.mentorship.text).toMatch(/every hackathon[\s\S]*Included/);
    expect(copy.es.doors.doors[2].details.expect).toMatch(/Mentorías incluidas/);
    expect(copy.en.doors.doors[2].details.expect).toMatch(/Mentorship included/);
    expect(JSON.stringify(copy.es.doors.mentorship)).not.toMatch(/semanas|a tu ritmo/);
    expect(copy.es.principles.items[0].body).not.toMatch(/qué cedes|revisar, adaptar/);

    // Neither door may ask for code as a precondition.
    expect(copy.es.doors.lead).toMatch(/programar/);
    expect(copy.es.doors.doors[2].body).toMatch(/línea de código/);
    expect(copy.en.doors.doors[2].body).toMatch(/line of code/);
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

    // David, 2026-09-11: the connection claim was not true and the phone line
    // said nothing the visitor needed.
    expect(copy.es.principles.items[3].body).toMatch(/laptop modesta/);
    expect(copy.es.principles.items[3].body).not.toMatch(/inestable|teléfono|teclado/);
    expect(copy.en.principles.items[3].body).toMatch(/modest laptop/);
    expect(copy.en.principles.items[3].body).not.toMatch(/unstable|phone|keyboard/i);
  });


  test('names three horizons and ends on access, not on agents', () => {
    for (const locale of locales) {
      const { north } = copy[locale];

      expect(north.horizons).toHaveLength(3);
      for (const horizon of north.horizons) {
        expect(horizon.label.length).toBeGreaterThan(0);
        expect(horizon.text.length).toBeGreaterThan(10);
      }

      expect(north.titleLines.some((line) => line.em)).toBe(true);
      expect(north.lead.length).toBeGreaterThan(120);
    }

    expect(copy.es.north.horizons.map((horizon) => horizon.label)).toEqual([
      'Hoy',
      'Después',
      'Norte'
    ]);
    // The Oslo talk's framing: the library is about access to opportunity —
    // same room, same resources — not about where you meet an agent.
    expect(copy.es.north.lead).toMatch(/bibliotecas públicas/);
    expect(copy.en.north.lead).toMatch(/public libraries/);
    expect(copy.es.north.lead).not.toMatch(/agente/);
    expect(copy.en.north.lead).not.toMatch(/agent/);
    expect(copy.es.north.horizons[2].text).toMatch(/cada ciudad/);
    expect(copy.en.north.horizons[2].text).toMatch(/every city/);
  });

  test('places the map nodes at real coordinates and claims no site', () => {
    for (const locale of locales) {
      const { map } = copy[locale].north;

      expect(map.nodes.length).toBeGreaterThanOrEqual(6);

      for (const node of map.nodes) {
        // Inside the country's bounding box, so a node can never land at sea.
        expect(node.lon).toBeGreaterThan(-73.4);
        expect(node.lon).toBeLessThan(-59.8);
        expect(node.lat).toBeGreaterThan(0.6);
        expect(node.lat).toBeLessThan(12.3);
      }

      for (const [from, to] of map.edges) {
        expect(map.nodes[from]).toBeDefined();
        expect(map.nodes[to]).toBeDefined();
        // Edges only ever join nodes that light: a planned node is not joined.
        expect(map.nodes[from].planned).toBeUndefined();
        expect(map.nodes[to].planned).toBeUndefined();
      }

      // Some nodes are outlined rather than lit, and the caption says in words
      // that none of them is a venue.
      expect(map.nodes.some((node) => node.planned)).toBe(true);
      expect(map.caption).toMatch(/no sedes confirmadas|not confirmed sites/i);
      expect(map.alt).toMatch(/no sedes confirmadas|not confirmed sites/i);
    }

    // The hero network and the map tell one story: every city in the network
    // is lit on the map, and the map adds only planned ones beyond it.
    for (const locale of locales) {
      const { nodes, edges } = copy[locale].north.map;
      const lit = nodes.filter((node) => !node.planned).map((node) => node.name);
      expect(lit).toEqual(copy[locale].network.cities.map((city) => city.name));
      expect(edges).toEqual(copy[locale].network.edges);
      // The lighting walks nodes by index and stops at the lit count, so a
      // planned node before a lit one would leave that one dark.
      expect(nodes.slice(0, lit.length).every((node) => !node.planned)).toBe(true);
    }

    // The Esequibo is on the map and named, in both locales: a Venezuelan
    // reader notices its absence immediately.
    expect(copy.es.north.map.claimLabel).toBe('Zona en Reclamación');
    expect(copy.en.north.map.claimLabel).toBe('Zona en Reclamación');
  });


  test('frames the talk as the whole idea, and says what pressing play costs', () => {
    for (const locale of locales) {
      const { talk } = copy[locale];

      expect(talk.title.length).toBeGreaterThan(10);
      expect(talk.body.length).toBeGreaterThan(40);
      expect(talk.play.length).toBeGreaterThan(0);
      expect(talk.posterAlt.length).toBeGreaterThan(20);

      // The visitor is told the embed is not loaded until they ask for it.
      expect(talk.privacy).toMatch(/YouTube/);
    }

    expect(copy.es.talk.privacy).toMatch(/solo cuando/);
    expect(copy.en.talk.privacy).toMatch(/only when/);

    // The venue is named; the year is not, like everything else on the page.
    expect(copy.es.talk.label).toContain('Oslo Freedom Forum');
    expect(JSON.stringify(copy.es.talk)).not.toMatch(/\b20(2[6-9]|3\d)\b/);
  });


  test('asks for the fields the lists are wired to, the new two optional, and nothing else', () => {
    for (const locale of locales) {
      const { form } = copy[locale];

      expect(form.nameLabel.length).toBeGreaterThan(0);
      expect(form.emailLabel.length).toBeGreaterThan(0);
      expect(form.newsletterLegend.length).toBeGreaterThan(0);
      expect(form.participateLabel.length).toBeGreaterThan(0);
      expect(form.submit.length).toBeGreaterThan(0);

      // City and what you would delegate joined on 2026-09-14, both optional.
      expect(form.cityLabel.length).toBeGreaterThan(0);
      expect(form.cityPlaceholder.length).toBeGreaterThan(0);
      expect(form.delegateLabel.length).toBeGreaterThan(0);
      expect(form.delegatePlaceholder.length).toBeGreaterThan(0);

      const markup = renderPage(locale);
      expect(markup).toMatch(/<input[^>]*name="city"[^>]*\/>/);
      expect(markup).toMatch(/<input[^>]*name="delegate"[^>]*\/>/);
      expect(markup.match(/<input[^>]*name="city"[^>]*\/>/)?.[0]).not.toContain('required');
      expect(markup.match(/<input[^>]*name="delegate"[^>]*\/>/)?.[0]).not.toContain('required');

      // Still nothing about what someone does for a living.
      const all = JSON.stringify(form).toLowerCase();
      expect(all).not.toContain('qué haces');
      expect(all).not.toContain('what you do');
    }

    // The privacy line under the button is exact, in Spanish.
    expect(copy.es.form.privacy).toBe('Solo usamos estos datos para escribirte.');
  });

  test('gives funders and hosts a line rather than a second door', () => {
    expect(copy.es.form.allies).toBe('¿Financias, enseñas o tienes un espacio? Escríbenos:');
    expect(copy.en.form.allies).toMatch(/fund, teach/);

    for (const locale of locales) {
      // One call to action on the page, and the allies line is not a button.
      expect(JSON.stringify(copy[locale].form.allies)).not.toMatch(/Hablemos|Talk to us/);
    }
  });

  test('answers the visitor in words for every outcome of the form', () => {
    for (const locale of locales) {
      const { states } = copy[locale].form;

      for (const message of Object.values(states)) {
        expect(message.length).toBeGreaterThan(4);
      }

      // No provider name and no error code reaches the visitor.
      const all = JSON.stringify(states).toLowerCase();
      expect(all).not.toContain('mailerlite');
      expect(all).not.toMatch(/\b(400|422|500|502)\b/);
    }
  });

  test('carries the contact address in the footer', () => {
    for (const locale of locales) {
      expect(copy[locale].footer.contact).toBe('ateneo@aragort.com');
    }

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

  test('shows what the agent runs, step by step, when asked', () => {
    for (const locale of locales) {
      const page = copy[locale];

      expect(page.agent.inside.length).toBeGreaterThan(0);
      expect(page.agent.rulesFile).toBe('AGENTS.md');

      for (const scene of page.scenes) {
        // One list of background lines per plan step, none empty.
        expect(scene.inside.steps).toHaveLength(scene.steps.length);
        expect(scene.inside.followSteps).toHaveLength(scene.followUp.steps.length);
        for (const lines of [...scene.inside.steps, ...scene.inside.followSteps]) {
          expect(lines.length).toBeGreaterThan(0);
        }

        // The conversion uses the skill named after the file it produces.
        expect(scene.inside.skill).toBe(scene.followUp.file.kind);
        // And the last step writes the file the card shows.
        expect(scene.inside.followSteps[1]).toContainEqual(['write', scene.followUp.file.name]);
      }
    }
  });

  test('names the words behind the window in a glossary', () => {
    for (const locale of locales) {
      const terms = copy[locale].glossary.items.map((item) => item.term);

      // Four words, 2026-09-14: Terminal contradicted "not a terminal" and
      // Markdown's point already lives in "Tus archivos son tuyos".
      expect(terms).toHaveLength(4);
      expect(terms).not.toContain('Terminal');
      expect(terms).not.toContain('Markdown');
      expect(terms).toContain('Skill');
      expect(copy[locale].glossary.items.some((item) => item.sample.includes('AGENTS.md'))).toBe(true);
      expect(copy[locale].glossary.items.some((item) => item.sample.includes('CLAUDE.md'))).toBe(true);
    }
  });
});
