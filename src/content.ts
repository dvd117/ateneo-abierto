import type { Locale } from './locale';

/**
 * Typed content source for the page. Everything the visitor reads lives here,
 * in both locales, so the render layer never holds a string.
 *
 * Inline emphasis convention: `*emphasised*` becomes `<em>` at render time.
 * Nothing else in a content string is markup; the renderer escapes the rest.
 */

export type NavLink = {
  label: string;
  href: string;
};

/** A row of the produced document's table. */
export type SceneRow = {
  cells: string[];
  /** The recommended row: gets the paper-side signal dot. */
  rec?: boolean;
  /** Index of the cell to render in the paper-side signal colour. */
  accentCell?: number;
};

/** The document the agent produces: either a small table or a short outline. */
export type SceneDoc = {
  kicker: string;
  title: string;
  table?: {
    head: string[];
    rows: SceneRow[];
  };
  list?: {
    lead?: string;
    items: string[];
  };
  /** The one serif-italic line the document closes on. */
  note: string;
};

/**
 * One scripted sequence in the agent window. Fully local: the runner replays
 * these strings, it never calls anything.
 */
export type Scene = {
  id: string;
  /**
   * The task's name: the clickable item in the window's session list, and the
   * title bar while it plays.
   */
  session: string;
  /** What the visitor "asked" for. */
  prompt: string;
  /** File chips that attach to the prompt. */
  files: string[];
  /** The agent's one line before the plan. */
  ack: string;
  /** Exactly four plan steps, ticked one at a time. */
  steps: [string, string, string, string];
  doc: SceneDoc;
  /** The Markdown draft's file name, in the first status line. */
  savedAs: string;
  /**
   * The second round. Markdown is where the work settles, but visitors open
   * Office files and PDFs, and neither Windows nor macOS previews Markdown on
   * its own — so once the draft is right, the visitor asks for the file they
   * will actually send, and the agent converts it.
   */
  followUp: FollowUp;
};

export type FileKind = 'xlsx' | 'pptx' | 'pdf' | 'docx';

export type FollowUp = {
  /** Typed into "Pídele algo más…", sent, and posted as the visitor's second message. */
  prompt: string;
  ack: string;
  steps: [string, string];
  file: {
    name: string;
    kind: FileKind;
    /** Format, extent and size, e.g. "Excel · 1 hoja · 14 KB". Illustrative. */
    detail: string;
  };
};

export type AgentChrome = {
  /** Accessible name for the whole window. */
  windowLabel: string;
  newTask: string;
  today: string;
  folder: string;
  /** Accessible name of the session list, the window's one control. */
  sessionsLabel: string;
  inputPlaceholder: string;
  /** Precedes the produced file name, e.g. "Listo en tu carpeta · resumen-t3.md". */
  ready: string;
  saved: string;
  replay: string;
  /** Announced to screen readers when a sequence finishes. */
  finished: string;
};

/** One step in the two columns of "De preguntar a delegar". */
export type ShiftStep = {
  /** Who does it: the visitor, the chatbot, or the agent. */
  actor: string;
  text: string;
  /** The agent's own steps carry a tick, like the plan inside the window. */
  done?: boolean;
};

export type ShiftColumn = {
  /** `chatbot` is the tiring column; `agent` is the one that pays off. */
  kind: 'chatbot' | 'agent';
  title: string;
  sub: string;
  steps: ShiftStep[];
  /** The count, set apart: "4 de 5" / "pasos los hiciste tú." */
  tallyCount: string;
  tallyText: string;
};

/**
 * Section two. The same office task done both ways, so the difference is
 * counted rather than claimed.
 */
export type ShiftCopy = {
  eyebrow: string;
  titleLines: { text: string; em?: boolean }[];
  /** Opens on what the country needs, not on what was dismantled. */
  lead: string;
  body: string;
  /** "La misma tarea: *…*" — the task both columns run. */
  task: string;
  columns: [ShiftColumn, ShiftColumn];
};

export type PageCopy = {
  languageLabel: string;
  languageSwitchTo: {
    es: string;
    en: string;
  };
  skipToContent: string;
  sectionsLabel: string;
  nav: NavLink[];
  hero: {
    eyebrow: string;
    /** Headline lines; `em` sets the italic line. */
    titleLines: { text: string; em?: boolean }[];
    manifesto: string;
    /** The one call to action: it goes to the form. */
    primaryCta: string;
    /**
     * Under the window: how to use it, and the honest label that it is a
     * simulation with example figures.
     */
    windowCaption: string;
  };
  agent: AgentChrome;
  scenes: Scene[];
  shift: ShiftCopy;
  footer: {
    securityLine: string;
    securityBody: string;
    contact: string;
    contactLabel: string;
  };
};

export const copy: Record<Locale, PageCopy> = {
  es: {
    languageLabel: 'Idioma',
    languageSwitchTo: {
      es: 'Cambiar a español',
      en: 'Cambiar a inglés'
    },
    skipToContent: 'Saltar al contenido',
    sectionsLabel: 'Secciones',
    nav: [
      { label: 'Programa', href: '#programa' },
      { label: 'El norte', href: '#norte' },
      { label: 'Sumarme', href: '#sumarme' }
    ],
    hero: {
      eyebrow: 'Más allá del chatbot',
      titleLines: [{ text: 'Deja de preguntarle.' }, { text: 'Empieza a delegarle.', em: true }],
      manifesto:
        'Un chatbot te responde. Un agente *hace el trabajo contigo*: lee tus archivos, sigue un plan y te entrega un documento. Aprende a delegar con herramientas libres, desde Venezuela, sin pagar nada para empezar.',
      primaryCta: 'Sumarme',
      windowCaption:
        'Elige otra tarea en la lista para verla. Es una demostración local: no se conecta a nada y las cifras son de ejemplo.'
    },
    agent: {
      windowLabel: 'Ejemplo de un agente trabajando',
      newTask: 'Nueva tarea',
      today: 'Hoy',
      folder: 'Carpeta: Documentos/Ateneo',
      sessionsLabel: 'Elige una tarea de ejemplo',
      inputPlaceholder: 'Pídele algo más…',
      ready: 'Listo en tu carpeta',
      saved: 'guardado',
      replay: 'Repetir',
      finished: 'El agente terminó la tarea y guardó el documento.'
    },
    scenes: [
      {
        id: 'gastos',
        session: 'Gastos del trimestre',
        prompt:
          'Tengo tres hojas de cálculo con los gastos del trimestre. Júntalas y hazme un resumen de una página.',
        files: ['gastos-julio.csv', 'gastos-agosto.csv', 'gastos-septiembre.csv'],
        ack: 'Va. Este es mi plan:',
        steps: [
          'Leer las 3 hojas',
          'Unificar las categorías',
          'Comparar con el trimestre anterior',
          'Guardar el resumen en tu carpeta'
        ],
        doc: {
          kicker: 'Resumen · Tercer trimestre',
          title: 'Gastos por categoría',
          table: {
            head: ['Categoría', 'Total', 'vs. T2'],
            rows: [
              { cells: ['Transporte', '412', '+18 %'], rec: true, accentCell: 2 },
              { cells: ['Materiales', '268', '−4 %'] },
              { cells: ['Conectividad', '150', '0 %'] }
            ]
          },
          note: 'Transporte es lo único que se movió de verdad: por ahí conviene empezar a revisar.'
        },
        savedAs: 'resumen-t3.md',
        followUp: {
          prompt: 'Se ve bien. Pásalo a Excel para la reunión.',
          ack: 'Va, lo paso a Excel:',
          steps: ['Pasar la tabla a una hoja de Excel', 'Guardarla junto al resumen'],
          file: { name: 'resumen-t3.xlsx', kind: 'xlsx', detail: 'Excel · 1 hoja · 14 KB' }
        }
      },
      {
        id: 'presentacion',
        session: 'Presentación del taller',
        prompt:
          'En esa carpeta están mis notas del taller. Ármame una presentación de 6 láminas con eso.',
        files: ['notas-taller.md', 'ejemplos.md', 'preguntas.md'],
        ack: 'Listo. Este es mi plan:',
        steps: [
          'Leer las notas de la carpeta',
          'Agrupar las ideas en 6 bloques',
          'Escribir el título y los puntos de cada lámina',
          'Guardar el esquema en tu carpeta'
        ],
        doc: {
          kicker: 'Esquema · 6 láminas',
          title: 'Delegar tu primera tarea',
          list: {
            items: [
              'Qué cambia cuando delegas en vez de preguntar',
              'El agente vive en tu computadora, no en una pestaña',
              'Tu primera tarea, paso a paso',
              'Cómo revisar lo que te entrega',
              'Los tres errores del principio',
              'Qué vas a delegar el lunes'
            ]
          },
          note: 'Cada lámina lleva tres puntos y un ejemplo tuyo, no uno inventado.'
        },
        savedAs: 'presentacion-taller.md',
        followUp: {
          prompt: 'Me gusta el orden. Hazla en PowerPoint.',
          ack: 'Listo, la armo en PowerPoint:',
          steps: ['Crear las 6 láminas en PowerPoint', 'Guardarla en tu carpeta'],
          file: { name: 'presentacion-taller.pptx', kind: 'pptx', detail: 'PowerPoint · 6 láminas · 84 KB' }
        }
      },
      {
        id: 'apuntes',
        session: 'Lectura de la semana',
        prompt:
          'Este PDF es la lectura de la semana. Hazme apuntes y agrégale preguntas para repasar.',
        files: ['lectura-semana-3.pdf'],
        ack: 'Va. Este es mi plan:',
        steps: [
          'Leer el PDF completo',
          'Sacar las ideas principales',
          'Escribir 8 preguntas de repaso',
          'Guardar los apuntes en tu carpeta'
        ],
        doc: {
          kicker: 'Apuntes · Lectura 3',
          title: 'Ideas principales y repaso',
          list: {
            lead: 'Tres ideas sostienen el texto:',
            items: [
              'El acceso pesa más que el talento',
              'Una herramienta sola no enseña; el acompañamiento sí',
              'Lo que aprendes se queda contigo, no en la plataforma',
              '8 preguntas de repaso, con las respuestas al final'
            ]
          },
          note: 'Tapa las respuestas y contéstalas en voz alta: es lo que mejor fija.'
        },
        savedAs: 'apuntes-lectura-3.md',
        followUp: {
          prompt: 'Perfecto. Expórtalo a PDF para imprimirlo.',
          ack: 'Va, lo preparo en PDF:',
          steps: ['Maquetar los apuntes para imprimir', 'Exportarlos a PDF en tu carpeta'],
          file: { name: 'apuntes-lectura-3.pdf', kind: 'pdf', detail: 'PDF · 2 páginas · 96 KB' }
        }
      },
      {
        id: 'correo',
        session: 'Correo a la junta',
        prompt:
          'Con el informe del mes, escríbeme un correo corto para la junta. Directo, sin adornos.',
        files: ['informe-septiembre.md'],
        ack: 'Listo. Este es mi plan:',
        steps: [
          'Leer el informe del mes',
          'Sacar los tres puntos que importan',
          'Redactarlo en menos de 150 palabras',
          'Guardar el borrador en tu carpeta'
        ],
        doc: {
          kicker: 'Borrador · Correo',
          title: 'Septiembre, en tres puntos',
          list: {
            lead: 'Equipo: el mes en corto, para que no lean seis páginas.',
            items: [
              'Cerramos el mes con las tres actividades que estaban previstas',
              'El gasto de transporte subió 18 % y hay que decidir qué hacer',
              'Pedimos luz verde para la próxima ronda antes del 30'
            ]
          },
          note: 'Si quieren el detalle, el informe completo va adjunto.'
        },
        savedAs: 'correo-junta.md',
        followUp: {
          prompt: 'Así está bien. Pásalo a Word para firmarlo.',
          ack: 'Listo, lo paso a Word:',
          steps: ['Darle formato de carta', 'Guardarlo como Word en tu carpeta'],
          file: { name: 'correo-junta.docx', kind: 'docx', detail: 'Word · 1 página · 22 KB' }
        }
      }
    ],
    shift: {
      eyebrow: 'El cambio',
      titleLines: [{ text: 'De preguntar' }, { text: 'a delegar', em: true }],
      lead:
        'Venezuela necesita gente que haga más con lo poco que tiene: menos horas, menos equipo, menos dinero.',
      body:
        'Eso ya está al alcance de cualquiera aquí, con herramientas gratuitas y sin saber programar. El sistema que debía enseñarlo lleva años desarmado, así que no esperamos a que alguien lo arregle: lo enseñamos nosotros.',
      task: 'La misma tarea: *juntar los gastos de tres meses y decidir dónde recortar.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'Con un chatbot',
          sub: 'Tú preguntas, él responde, y el trabajo sigue siendo tuyo.',
          steps: [
            { actor: 'Tú', text: 'Le preguntas cómo comparar tres meses de gastos.' },
            { actor: 'Chatbot', text: 'Te explica el método. Los números se los pegas tú.' },
            { actor: 'Tú', text: 'Copias y pegas las tres hojas, columna por columna.' },
            { actor: 'Tú', text: 'Revisas a mano qué subió y qué bajó.' },
            { actor: 'Tú', text: 'Escribes el resumen y lo guardas.' }
          ],
          tallyCount: '4 de 5',
          tallyText: 'pasos los hiciste tú.'
        },
        {
          kind: 'agent',
          title: 'Con un agente',
          sub: 'Tú delegas, él planifica y ejecuta, tú decides.',
          steps: [
            { actor: 'Tú', text: 'Le pasas la carpeta y le dices qué necesitas.' },
            { actor: 'Agente', text: 'Arma un plan y te lo muestra.', done: true },
            { actor: 'Agente', text: 'Lee las tres hojas y unifica las categorías.', done: true },
            { actor: 'Agente', text: 'Escribe el resumen y lo guarda en tu carpeta.', done: true },
            { actor: 'Tú', text: 'Lo revisas y decides dónde recortar.' }
          ],
          tallyCount: '2 de 5',
          tallyText: 'pasos son tuyos: pedir y decidir.'
        }
      ]
    },
    footer: {
      securityLine: 'La seguridad es parte de cómo trabajamos.',
      securityBody:
        'Cuidamos los datos de quienes participan y nunca publicamos sus nombres sin permiso.',
      contact: 'ateneo@aragort.com',
      contactLabel: 'Escríbenos'
    }
  },
  en: {
    languageLabel: 'Language',
    languageSwitchTo: {
      es: 'Switch to Spanish',
      en: 'Switch to English'
    },
    skipToContent: 'Skip to content',
    sectionsLabel: 'Sections',
    nav: [
      { label: 'Program', href: '#programa' },
      { label: 'Where this goes', href: '#norte' },
      { label: 'Join', href: '#sumarme' }
    ],
    hero: {
      eyebrow: 'Past the chatbot',
      titleLines: [{ text: 'Stop asking it things.' }, { text: 'Start handing it work.', em: true }],
      manifesto:
        'A chatbot answers you. An agent *does the work with you*: it reads your files, follows a plan, and hands you a document. Learn to delegate with free and open tools, from Venezuela, at no cost to start.',
      primaryCta: 'Join',
      windowCaption:
        'Pick another task from the list to watch it. This is a local demo: it connects to nothing, and the figures are examples.'
    },
    agent: {
      windowLabel: 'An example of an agent at work',
      newTask: 'New task',
      today: 'Today',
      folder: 'Folder: Documents/Ateneo',
      sessionsLabel: 'Pick an example task',
      inputPlaceholder: 'Ask for something else…',
      ready: 'Saved to your folder',
      saved: 'saved',
      replay: 'Replay',
      finished: 'The agent finished the task and saved the document.'
    },
    scenes: [
      {
        id: 'gastos',
        session: 'Quarterly spending',
        prompt:
          'I have three spreadsheets with this quarter’s spending. Merge them and give me a one-page summary.',
        files: ['spending-july.csv', 'spending-august.csv', 'spending-september.csv'],
        ack: 'On it. Here is my plan:',
        steps: [
          'Read the 3 spreadsheets',
          'Reconcile the categories',
          'Compare against the previous quarter',
          'Save the summary to your folder'
        ],
        doc: {
          kicker: 'Summary · Third quarter',
          title: 'Spending by category',
          table: {
            head: ['Category', 'Total', 'vs. Q2'],
            rows: [
              { cells: ['Transport', '412', '+18%'], rec: true, accentCell: 2 },
              { cells: ['Materials', '268', '−4%'] },
              { cells: ['Connectivity', '150', '0%'] }
            ]
          },
          note: 'Transport is the only line that really moved: start there.'
        },
        savedAs: 'summary-q3.md',
        followUp: {
          prompt: 'Looks good. Put it in Excel for the meeting.',
          ack: 'On it, moving it to Excel:',
          steps: ['Put the table in an Excel sheet', 'Save it next to the summary'],
          file: { name: 'summary-q3.xlsx', kind: 'xlsx', detail: 'Excel · 1 sheet · 14 KB' }
        }
      },
      {
        id: 'presentacion',
        session: 'Workshop deck',
        prompt: 'My workshop notes are in that folder. Build me a 6-slide deck from them.',
        files: ['workshop-notes.md', 'examples.md', 'questions.md'],
        ack: 'Sure. Here is my plan:',
        steps: [
          'Read the notes in the folder',
          'Group the ideas into 6 blocks',
          'Write a title and bullets for each slide',
          'Save the outline to your folder'
        ],
        doc: {
          kicker: 'Outline · 6 slides',
          title: 'Delegating your first task',
          list: {
            items: [
              'What changes when you delegate instead of asking',
              'The agent lives on your computer, not in a tab',
              'Your first task, step by step',
              'How to check what it hands back',
              'The three beginner mistakes',
              'What you will delegate on Monday'
            ]
          },
          note: 'Each slide carries three points and one example of your own, not an invented one.'
        },
        savedAs: 'workshop-deck.md',
        followUp: {
          prompt: 'I like the order. Make it in PowerPoint.',
          ack: 'Sure, building it in PowerPoint:',
          steps: ['Build the 6 slides in PowerPoint', 'Save it to your folder'],
          file: { name: 'workshop-deck.pptx', kind: 'pptx', detail: 'PowerPoint · 6 slides · 84 KB' }
        }
      },
      {
        id: 'apuntes',
        session: 'This week’s reading',
        prompt: 'This PDF is the reading for the week. Make me notes and add questions to revise.',
        files: ['reading-week-3.pdf'],
        ack: 'On it. Here is my plan:',
        steps: [
          'Read the full PDF',
          'Pull out the main ideas',
          'Write 8 revision questions',
          'Save the notes to your folder'
        ],
        doc: {
          kicker: 'Notes · Reading 3',
          title: 'Main ideas and revision',
          list: {
            lead: 'Three ideas hold the text together:',
            items: [
              'Access counts for more than talent',
              'A tool alone does not teach; company does',
              'What you learn stays with you, not on the platform',
              '8 revision questions, answers at the end'
            ]
          },
          note: 'Cover the answers and say them out loud: that is what makes them stick.'
        },
        savedAs: 'notes-reading-3.md',
        followUp: {
          prompt: 'Perfect. Export it to PDF so I can print it.',
          ack: 'On it, preparing the PDF:',
          steps: ['Lay the notes out for printing', 'Export them to PDF in your folder'],
          file: { name: 'notes-reading-3.pdf', kind: 'pdf', detail: 'PDF · 2 pages · 96 KB' }
        }
      },
      {
        id: 'correo',
        session: 'Email to the board',
        prompt:
          'Using the monthly report, write me a short email for the board. Direct, no padding.',
        files: ['report-september.md'],
        ack: 'Sure. Here is my plan:',
        steps: [
          'Read the monthly report',
          'Pull the three points that matter',
          'Draft it in under 150 words',
          'Save the draft to your folder'
        ],
        doc: {
          kicker: 'Draft · Email',
          title: 'September, in three points',
          list: {
            lead: 'Team: the month in short, so nobody reads six pages.',
            items: [
              'We closed the month with all three planned activities',
              'Transport spending rose 18% and we need a decision',
              'We need a green light for the next round before the 30th'
            ]
          },
          note: 'The full report is attached if anyone wants the detail.'
        },
        savedAs: 'board-email.md',
        followUp: {
          prompt: 'That works. Put it in Word so I can sign it.',
          ack: 'Sure, moving it to Word:',
          steps: ['Format it as a letter', 'Save it as Word in your folder'],
          file: { name: 'board-email.docx', kind: 'docx', detail: 'Word · 1 page · 22 KB' }
        }
      }
    ],
    shift: {
      eyebrow: 'The shift',
      titleLines: [{ text: 'From asking' }, { text: 'to delegating', em: true }],
      lead:
        'Venezuela needs people who can do more with the little they have: fewer hours, less equipment, less money.',
      body:
        'That is already within reach here, with free tools and without knowing how to code. The system that should have taught it has been taken apart for years, so we did not wait for anyone to fix it: we teach it ourselves.',
      task: 'The same task: *merge three months of spending and decide where to cut.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'With a chatbot',
          sub: 'You ask, it answers, and the work is still yours.',
          steps: [
            { actor: 'You', text: 'You ask it how to compare three months of spending.' },
            { actor: 'Chatbot', text: 'It explains the method. You paste the numbers yourself.' },
            { actor: 'You', text: 'You copy and paste the three sheets, column by column.' },
            { actor: 'You', text: 'You check by hand what went up and what went down.' },
            { actor: 'You', text: 'You write the summary and save it.' }
          ],
          tallyCount: '4 of 5',
          tallyText: 'steps you did yourself.'
        },
        {
          kind: 'agent',
          title: 'With an agent',
          sub: 'You delegate, it plans and executes, you decide.',
          steps: [
            { actor: 'You', text: 'You hand it the folder and say what you need.' },
            { actor: 'Agent', text: 'It builds a plan and shows it to you.', done: true },
            { actor: 'Agent', text: 'It reads the three sheets and reconciles the categories.', done: true },
            { actor: 'Agent', text: 'It writes the summary and saves it to your folder.', done: true },
            { actor: 'You', text: 'You check it and decide where to cut.' }
          ],
          tallyCount: '2 of 5',
          tallyText: 'steps are yours: asking and deciding.'
        }
      ]
    },
    footer: {
      securityLine: 'Security is part of how we work.',
      securityBody:
        'We look after the data of the people who take part, and we never publish their names without permission.',
      contact: 'ateneo@aragort.com',
      contactLabel: 'Write to us'
    }
  }
};
