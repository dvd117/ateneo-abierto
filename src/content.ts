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
  /** Prompt chip label, and the session name in the window sidebar. */
  chip: string;
  /** Title shown in the window's title bar. */
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
  /** File name in the status line. */
  savedAs: string;
};

export type AgentChrome = {
  /** Accessible name for the whole window. */
  windowLabel: string;
  newTask: string;
  today: string;
  folder: string;
  chipsLabel: string;
  sessionsLabel: string;
  inputPlaceholder: string;
  /** Precedes the produced file name, e.g. "Listo en tu carpeta · resumen-t3.md". */
  ready: string;
  saved: string;
  replay: string;
  /** Announced to screen readers when a sequence finishes. */
  finished: string;
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
    primaryCta: string;
    secondaryCta: string;
    /** Honest label under the window: this is a simulation, figures are examples. */
    windowCaption: string;
  };
  agent: AgentChrome;
  scenes: Scene[];
  footer: {
    securityLine: string;
    securityBody: string;
    contact: string;
    contactLabel: string;
    sourceLabel: string;
    sourceHref: string;
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
      secondaryCta: 'Hablemos',
      windowCaption:
        'Demostración local: el agente de esta página no se conecta a nada y las cifras son de ejemplo.'
    },
    agent: {
      windowLabel: 'Ejemplo de un agente trabajando',
      newTask: 'Nueva tarea',
      today: 'Hoy',
      folder: 'Carpeta: Documentos/Ateneo',
      chipsLabel: 'Elige una tarea de ejemplo',
      sessionsLabel: 'Tareas de ejemplo',
      inputPlaceholder: 'Pídele algo más…',
      ready: 'Listo en tu carpeta',
      saved: 'guardado',
      replay: 'Repetir',
      finished: 'El agente terminó la tarea y guardó el documento.'
    },
    scenes: [
      {
        id: 'gastos',
        chip: 'Resumir gastos',
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
        savedAs: 'resumen-t3.md'
      },
      {
        id: 'presentacion',
        chip: 'Armar una presentación',
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
        savedAs: 'presentacion-taller.md'
      },
      {
        id: 'apuntes',
        chip: 'Apuntes de estudio',
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
        savedAs: 'apuntes-lectura-3.md'
      },
      {
        id: 'correo',
        chip: 'Correo a la junta',
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
        savedAs: 'correo-junta.md'
      }
    ],
    footer: {
      securityLine: 'La seguridad es parte de cómo trabajamos.',
      securityBody:
        'Cuidamos los datos de quienes participan y nunca publicamos sus nombres sin permiso.',
      contact: 'ateneo@aragort.com',
      contactLabel: 'Correo',
      sourceLabel: 'Código fuente',
      sourceHref: 'https://github.com/dvd117/ateneo-abierto'
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
      secondaryCta: "Let's talk",
      windowCaption:
        'Local demo: the agent on this page connects to nothing, and the figures are examples.'
    },
    agent: {
      windowLabel: 'An example of an agent at work',
      newTask: 'New task',
      today: 'Today',
      folder: 'Folder: Documents/Ateneo',
      chipsLabel: 'Pick an example task',
      sessionsLabel: 'Example tasks',
      inputPlaceholder: 'Ask for something else…',
      ready: 'Saved to your folder',
      saved: 'saved',
      replay: 'Replay',
      finished: 'The agent finished the task and saved the document.'
    },
    scenes: [
      {
        id: 'gastos',
        chip: 'Summarise spending',
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
        savedAs: 'summary-q3.md'
      },
      {
        id: 'presentacion',
        chip: 'Build a deck',
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
        savedAs: 'workshop-deck.md'
      },
      {
        id: 'apuntes',
        chip: 'Study notes',
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
        savedAs: 'notes-reading-3.md'
      },
      {
        id: 'correo',
        chip: 'Email to the board',
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
        savedAs: 'board-email.md'
      }
    ],
    footer: {
      securityLine: 'Security is part of how we work.',
      securityBody:
        'We look after the data of the people who take part, and we never publish their names without permission.',
      contact: 'ateneo@aragort.com',
      contactLabel: 'Email',
      sourceLabel: 'Source code',
      sourceHref: 'https://github.com/dvd117/ateneo-abierto'
    }
  }
};
