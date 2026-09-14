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
  inside: SceneInside;
};

export type FileKind = 'xlsx' | 'pptx' | 'pdf' | 'docx';

/**
 * What the agent does in the background, shown under a plan step when the
 * visitor turns on "Ver por dentro": reading a file, running a command in the
 * terminal, writing a file, or using a skill. Illustrative, like the figures.
 */
export type InsideLine = ['read' | 'run' | 'write' | 'skill', string];

export type SceneInside = {
  /** One entry per plan step, in order. */
  steps: [InsideLine[], InsideLine[], InsideLine[], InsideLine[]];
  /** The skill the conversion uses, named before the second plan. */
  skill: string;
  /** One entry per follow-up step. */
  followSteps: [InsideLine[], InsideLine[]];
};

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

/**
 * The node network under the hero's call to action: the cities the program
 * wants to reach, lighting one at a time. Nothing here is a confirmed site,
 * so the copy never says one has joined.
 */
export type NetworkCopy = {
  label: string;
  /** Resting caption, shown whenever no node is lit. */
  caption: string;
  /** Read out to screen readers in place of the drawing. */
  alt: string;
  /**
   * `x`/`y` place the node in the 480×110 viewBox; `lx`/`ly` place its label
   * in the same space, because the labels have to dodge each other and the
   * edges — they are set by eye, as in the approved mockup.
   */
  cities: { name: string; x: number; y: number; lx: number; ly: number }[];
  /** Index pairs into `cities`, drawn in order as the nodes light. */
  edges: [number, number][];
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
  /** The switch that shows what the agent runs in the background. */
  inside: string;
  /** Words before each background line. `run` has none: it shows `$`. */
  insideWords: { read: string; write: string; skill: string; rules: string };
  /** The instructions file the agent reads before every task. */
  rulesFile: string;
};

/** "Palabras que vas a oír": the concepts behind the window, named. */
export type GlossaryCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  items: { term: string; sample: string; body: string }[];
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
  /** Three sentences: where the frontier is now, what it buys, who can reach it. */
  lead: string;
  /** "La misma tarea: *…*" — the task both columns run. */
  task: string;
  columns: [ShiftColumn, ShiftColumn];
};

/**
 * One of the three ways in. The number is the mockup's rail: it reads as a
 * step, not as a price. `who` is kept because people pick the door by
 * recognising themselves in it, not by the title.
 */
export type Door = {
  /** Also the dialog's id suffix, so it stays ASCII. */
  id: string;
  n: string;
  title: string;
  body: string;
  whoLabel: string;
  who: string;
  /** What the dialog behind "Ver detalles" says: the door, opened. */
  details: {
    goal: string;
    activities: string[];
    expect: string;
  };
};

/**
 * Section three. Three doors plus the one thing organisations ask for, which
 * goes through the same form rather than a second address.
 */
export type DoorsCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  doors: [Door, Door, Door];
  /** Shared labels for the three dialogs. */
  dialog: {
    open: string;
    goalLabel: string;
    activitiesLabel: string;
    expectLabel: string;
    join: string;
    close: string;
  };
  workshops: {
    label: string;
    text: string;
    cta: string;
  };
};

/**
 * One of the four principles. `icon` names a drawing in render.ts rather than
 * carrying markup, so the copy file stays text.
 */
export type Principle = {
  icon: 'open' | 'agency' | 'plain' | 'resilient';
  title: string;
  body: string;
};

/** Section four: what the program does differently, in four lines. */
export type PrinciplesCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  items: [Principle, Principle, Principle, Principle];
};

/** One of the three time horizons, on the staircase. */
export type Horizon = {
  label: string;
  text: string;
};

/**
 * A node on the map. Position is real: `lon`/`lat` go through the same
 * projection that drew the boundary, so a Venezuelan reader recognises the
 * place. `dx`/`dy` nudge the label off the node, in viewBox units.
 * `planned` nodes stay outlined and never light: none of these is a site.
 */
export type MapNode = {
  name: string;
  lon: number;
  lat: number;
  dx?: number;
  dy?: number;
  planned?: boolean;
};

/** Section five: where this is going, and the map it is going across. */
export type NorthCopy = {
  eyebrow: string;
  titleLines: { text: string; em?: boolean }[];
  lead: string;
  horizons: [Horizon, Horizon, Horizon];
  map: {
    alt: string;
    caption: string;
    /** Named on the map itself, hatched, as on maps published in Venezuela. */
    claimLabel: string;
    nodes: MapNode[];
    /** Index pairs into `nodes`, drawn in order as the nodes light. */
    edges: [number, number][];
  };
};

/**
 * Section six: David's Ignite Talk. The poster is vendored and the player is
 * not loaded until someone asks for it, so the page still reaches YouTube
 * exactly never unless the visitor clicks.
 */
export type TalkCopy = {
  eyebrow: string;
  title: string;
  body: string;
  /** Under the frame: what the talk is and where it was given. */
  label: string;
  talkTitle: string;
  /** Accessible name of the play control. */
  play: string;
  posterAlt: string;
  /** The honest line about what clicking play costs. */
  privacy: string;
  /** The way out when YouTube puts a sign-in wall in front of the embed. */
  watch: string;
};

/**
 * Section seven: the form. Four fields, the same ones the previous site
 * collected, because they are already wired to the four MailerLite groups —
 * and because the least we can ask for is the least we should ask for.
 */
export type FormCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  newsletterLegend: string;
  newsletterOptions: { es: string; en: string };
  participateLabel: string;
  submit: string;
  /** Under the button, and it is the whole promise. */
  privacy: string;
  /** Funders and hosts get a line, not a second form. */
  allies: string;
  /** Label on the honeypot, for the machines that read labels. */
  supplement: string;
  states: {
    sending: string;
    ok: string;
    invalidEmail: string;
    error: string;
  };
};

export type PageCopy = {
  languageLabel: string;
  languageSwitchTo: {
    es: string;
    en: string;
  };
  skipToContent: string;
  sectionsLabel: string;
  /** The floating button that returns to the top of the page. */
  toTop: string;
  nav: NavLink[];
  hero: {
    eyebrow: string;
    /** Headline lines; `em` sets the italic line. */
    titleLines: { text: string; em?: boolean }[];
    manifesto: string;
    /** The one call to action: it goes to the form. */
    primaryCta: string;
    /** Who is behind it, beside the CTA, with a link down to the talk. */
    byline: string;
    bylineLink: string;
    /**
     * Under the window: how to use it, and the honest label that it is a
     * simulation with example figures.
     */
    windowCaption: string;
  };
  agent: AgentChrome;
  network: NetworkCopy;
  scenes: Scene[];
  shift: ShiftCopy;
  glossary: GlossaryCopy;
  doors: DoorsCopy;
  principles: PrinciplesCopy;
  north: NorthCopy;
  talk: TalkCopy;
  form: FormCopy;
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
    toTop: 'Volver arriba',
    nav: [
      { label: 'Programa', href: '#programa' },
      { label: 'El norte', href: '#norte' },
      { label: 'Únete', href: '#unete' }
    ],
    hero: {
      eyebrow: 'Más allá del chatbot',
      titleLines: [{ text: 'Deja de preguntarle.' }, { text: 'Empieza a delegarle.', em: true }],
      manifesto:
        'Un chatbot te responde. Un agente *hace el trabajo contigo*: lee tus archivos, sigue un plan y te entrega el documento. Aprender a delegarle es la habilidad que viene, y desde Venezuela puedes empezar hoy: gratis y sin saber programar.',
      primaryCta: 'Únete',
      byline: 'La idea, en 5 minutos',
      bylineLink: 'Mira la charla',
      windowCaption:
        'Elige otra tarea en la lista, o toca «Ver por dentro» para ver lo que el agente hace en tu computadora. Es una demostración local: no se conecta a nada y las cifras son de ejemplo.'
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
      finished: 'El agente terminó la tarea y guardó el documento.',
      inside: 'Ver por dentro',
      insideWords: { read: 'Leyó', write: 'Escribió', skill: 'Usó la skill', rules: 'Leyó tus instrucciones' },
      rulesFile: 'AGENTS.md'
    },
    network: {
      label: 'La red que estamos tejiendo',
      caption: 'Gente, mentores y ciudades',
      alt: 'Ocho ciudades venezolanas unidas por una red: Caracas, Valencia, Barquisimeto, Maracaibo, Mérida, San Cristóbal, Cumaná y Ciudad Guayana. Son ciudades que queremos alcanzar, no sedes confirmadas.',
      cities: [
        { name: 'Caracas', x: 244, y: 16, lx: 244, ly: 30 },
        { name: 'Valencia', x: 203, y: 26, lx: 197, ly: 44 },
        { name: 'Barquisimeto', x: 155, y: 29, lx: 150, ly: 4 },
        { name: 'Maracaibo', x: 70, y: 11, lx: 70, ly: 25 },
        { name: 'Mérida', x: 88, y: 76, lx: 100, ly: 78 },
        { name: 'San Cristóbal', x: 48, y: 101, lx: 62, ly: 103 },
        { name: 'Cumaná', x: 344, y: 17, lx: 344, ly: 31 },
        { name: 'Ciudad Guayana', x: 397, y: 85, lx: 397, ly: 99 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
        [4, 5],
        [0, 6],
        [6, 7],
        [0, 7]
      ]
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
        },
        inside: {
          steps: [
            [['run', 'head -3 gastos-*.csv']],
            [['write', 'unificar.py'], ['run', 'python3 unificar.py gastos-*.csv']],
            [['run', 'python3 comparar.py --contra gastos-t2.csv']],
            [['write', 'resumen-t3.md']]
          ],
          skill: 'xlsx',
          followSteps: [[['run', 'python3 tabla_a_excel.py resumen-t3.md']], [['write', 'resumen-t3.xlsx']]]
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
        },
        inside: {
          steps: [
            [['run', 'ls notas/'], ['read', 'notas-taller.md']],
            [['run', 'grep -h "^## " notas/*.md']],
            [['write', 'presentacion-taller.md']],
            [['run', 'ls ~/Documentos/Ateneo']]
          ],
          skill: 'pptx',
          followSteps: [[['run', 'python3 crear_laminas.py presentacion-taller.md']], [['write', 'presentacion-taller.pptx']]]
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
        },
        inside: {
          steps: [
            [['run', 'pdftotext lectura-semana-3.pdf lectura.txt']],
            [['read', 'lectura.txt']],
            [['write', 'preguntas.md']],
            [['write', 'apuntes-lectura-3.md']]
          ],
          skill: 'pdf',
          followSteps: [[['run', 'python3 maquetar.py apuntes-lectura-3.md']], [['write', 'apuntes-lectura-3.pdf']]]
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
        },
        inside: {
          steps: [
            [['read', 'informe-septiembre.md']],
            [['run', 'grep -n "Total" informe-septiembre.md']],
            [['write', 'correo-junta.md'], ['run', 'wc -w correo-junta.md']],
            [['run', 'cp correo-junta.md borradores/']]
          ],
          skill: 'docx',
          followSteps: [[['run', 'python3 crear_carta.py correo-junta.md']], [['write', 'correo-junta.docx']]]
        }
      }
    ],
    shift: {
      eyebrow: 'El cambio',
      titleLines: [{ text: 'De preguntar' }, { text: 'a delegar', em: true }],
      lead:
        'Los chatbots ya leen tus documentos y te devuelven archivos. La diferencia está en cuánto del trabajo sigue siendo tuyo. Un agente trabaja en tu carpeta, sigue un plan y revisa lo que hace: la tarea se resuelve mientras haces otra cosa, y el criterio sigue siendo tuyo.',
      task: 'La misma tarea: *juntar los gastos de tres meses y decidir dónde recortar.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'Con un chatbot',
          sub: 'Hoy también lee tus archivos y te devuelve documentos. Pero cada corrección y cada archivo pasan por ti.',
          steps: [
            { actor: 'Tú', text: 'Subes las tres hojas y le pides el resumen.' },
            { actor: 'Chatbot', text: 'Te devuelve un resumen y un archivo para descargar.' },
            { actor: 'Tú', text: 'Lo revisas y ves que mezcló dos categorías.' },
            { actor: 'Tú', text: 'Se lo explicas, vuelves a subir, vuelves a descargar.' },
            { actor: 'Tú', text: 'Lo guardas en tu carpeta. El mes que viene, empiezas de cero.' }
          ],
          tallyCount: '4 de 5',
          tallyText: 'pasos los haces tú.'
        },
        {
          kind: 'agent',
          title: 'Con un agente',
          sub: 'Trabaja en tu carpeta, sigue un plan y revisa lo que hace. Tú decides.',
          steps: [
            { actor: 'Tú', text: 'Le señalas la carpeta y le dices qué necesitas.' },
            { actor: 'Agente', text: 'Arma un plan y te lo muestra antes de empezar.', done: true },
            { actor: 'Agente', text: 'Abre las tres hojas, unifica las categorías y comprueba las sumas.', done: true },
            { actor: 'Agente', text: 'Guarda el resumen y el Excel en tu carpeta, junto a los originales.', done: true },
            { actor: 'Tú', text: 'Lo revisas y decides dónde recortar. El mes que viene, se lo pides en una línea.' }
          ],
          tallyCount: '2 de 5',
          tallyText: 'pasos los haces tú: pedir y decidir.'
        }
      ]
    },
    glossary: {
      eyebrow: 'Glosario',
      title: 'Palabras que vas a oír',
      lead: 'No necesitas saberlas para inscribirte. Te las vas a encontrar desde el primer día de la hackatón, y son así de simples.',
      items: [
        {
          term: 'Agente',
          sample: '“Júntame estas tres hojas.”',
          body: 'Un programa que recibe una tarea, arma un plan y lo ejecuta en tu computadora: abre archivos, corre comandos y te entrega el resultado para que lo revises.'
        },
        {
          term: 'Terminal',
          sample: '$ ls Documentos',
          body: 'La ventana donde se le dan órdenes a la computadora escribiendo, en vez de hacer clic. El agente la usa para leer, convertir y ordenar tus archivos; tú puedes mirar lo que hace.'
        },
        {
          term: 'Markdown',
          sample: '# Título  ·  - un punto',
          body: 'Texto plano con unas pocas marcas: # para un título, - para una lista. Lo lee cualquier programa y cualquier agente, y de ahí sale el Word o el PDF que envías.'
        },
        {
          term: 'Skill',
          sample: 'skills/xlsx',
          body: 'Una receta que le enseña al agente a hacer algo bien, como armar un Excel o una presentación. Se instala una vez y la usa cada vez que la necesita.'
        },
        {
          term: 'Instrucciones',
          sample: 'AGENTS.md  ·  CLAUDE.md',
          body: 'Un archivo en tu carpeta donde escribes cómo quieres que trabaje: tu tono, tus formatos, lo que no debe tocar. El agente lo lee antes de empezar cada tarea.'
        },
        {
          term: 'Tu carpeta',
          sample: 'Documentos/Ateneo',
          body: 'Le das al agente una carpeta para trabajar. Lo que produce queda ahí, en tu computadora, donde lo puedes revisar.'
        }
      ]
    },
    doors: {
      eyebrow: 'Qué hacemos',
      title: 'Tres puertas',
      lead: 'Entra por la que te quede más cerca. Ninguna te pide saber programar.',
      doors: [
        {
          id: 'hackaton',
          n: '01',
          title: 'Hackatón para no técnicos',
          body: 'En un fin de semana aprendes a usar tu primer agente y sales con él funcionando, aunque nunca hayas escrito una línea de código.',
          whoLabel: 'Para quién',
          who: 'Gente de oficina, docentes, comerciantes, equipos de organizaciones.',
          // Approved in David's copy review, 2026-09-11. Format, venue, places
          // and cost are still to confirm before launch.
          details: {
            goal: 'Que salgas usando un agente en una tarea real de tu trabajo o tus estudios.',
            activities: [
              'Arrancamos con una demostración en vivo: la misma tarea, con chatbot y con agente.',
              'Eliges una tarea que hoy te quita tiempo y la trabajas en un equipo pequeño.',
              'Mentores te acompañan a instalar el agente y a darle tus primeras instrucciones, con archivos de ejemplo.',
              'Al cierre, cada equipo muestra lo que logró.'
            ],
            expect: 'Un fin de semana, presencial. No necesitas saber programar. Trae tu laptop; una modesta sirve.'
          }
        },
        {
          id: 'mentorias',
          n: '02',
          title: 'Mentorías',
          // Mentorships happen inside each hackathon, not as a sustained
          // programme after it (David, 2026-09-11).
          body: 'En cada hackatón, gente que ya usa agentes en su trabajo acompaña a los equipos para que salgan con algo que funciona de verdad, no solo en la demo.',
          whoLabel: 'Para quién',
          who: 'Los equipos de cada hackatón, desde que eligen su tarea hasta que la presentan.',
          details: {
            goal: 'Que ningún equipo se quede trabado: cada uno sale de la hackatón con su agente funcionando.',
            activities: [
              'Un mentor acompaña a cada equipo durante la hackatón.',
              'Ayuda a elegir una tarea que se pueda resolver en un fin de semana.',
              'Revisa con el equipo lo que entrega el agente y ajustan las instrucciones hasta que funcione.'
            ],
            expect: 'Vienen incluidas en la hackatón: no hay que inscribirse aparte.'
          }
        },
        {
          id: 'demo-nights',
          n: '03',
          title: 'Demo Nights',
          body: 'Entre 2 y 5 minutos: muestras la herramienta que te ha sido útil en tu trabajo, qué salió mal antes de que funcionara, y cómo llegaste ahí.',
          whoLabel: 'Para quién',
          who: 'Quien ya armó algo y quiere enseñarlo, o aprender del intento de otro.',
          details: {
            goal: 'Aprender de lo que otros ya están haciendo, y mostrar lo tuyo.',
            activities: [
              'Demostraciones de 2 a 5 minutos: qué tarea, con qué herramienta, qué salió mal y cómo lo resolviste.',
              'Preguntas al final de cada demo.',
              'Conversación abierta para conocer a gente que resuelve problemas parecidos.'
            ],
            expect: 'Una noche, abierta a cualquiera. Para mirar no hace falta inscribirse; para presentar, sí.'
          }
        }
      ],
      dialog: {
        open: 'Ver detalles',
        goalLabel: 'El objetivo',
        activitiesLabel: 'Qué hacemos',
        expectLabel: 'Qué esperar',
        join: 'Únete',
        close: 'Cerrar'
      },
      workshops: {
        label: 'Talleres',
        text: 'para equipos y organizaciones: una sesión práctica a la medida de lo que ya hacen.',
        cta: 'Escríbenos'
      }
    },
    principles: {
      eyebrow: 'Principios',
      title: 'Cómo trabajamos',
      lead: 'Cuatro reglas que se notan en cada cosa que hacemos.',
      items: [
        {
          icon: 'open',
          title: 'Abierto primero',
          body: 'Empezamos por herramientas de código abierto, que puedes usar sin pagar. Si ya tienes una suscripción a ChatGPT o Claude, también te enseñamos a sacarles provecho.'
        },
        {
          icon: 'agency',
          title: 'Tú decides',
          body: 'Tú das las instrucciones y revisas el resultado. El agente trabaja para ti, no al revés.'
        },
        {
          icon: 'plain',
          title: 'Tus archivos son tuyos',
          body: 'Tu trabajo vive en tu carpeta, en formatos abiertos que abres con cualquier programa hoy y en diez años. Cuando necesitas Word, Excel o PowerPoint, el agente los genera desde ahí, así que el archivo final no te ata a ninguna plataforma.'
        },
        {
          icon: 'resilient',
          title: 'Resiliencia',
          body: 'Todo lo que enseñamos funciona en una laptop modesta, y siempre hay una opción gratuita para empezar.'
        }
      ]
    },
    north: {
      eyebrow: 'El norte',
      titleLines: [
        { text: 'Mismo salón, mismos recursos,' },
        { text: 'la misma oportunidad.', em: true }
      ],
      lead:
        'Hay bibliotecas públicas donde no importa quién seas: prestan computadoras, enseñan a quien nunca ha tocado un teclado y te sientan al lado de gente que resuelve lo mismo que tú. Conocimiento, redes, infraestructura y cultura tecnológica, abiertos a cualquiera. Eso queremos para Venezuela. Empezamos pequeño; el norte es un espacio así en cada ciudad.',
      horizons: [
        { label: 'Hoy', text: 'Hackatones, mentorías y Demo Nights, en grupos pequeños.' },
        { label: 'Después', text: 'Alianzas con universidades y organizaciones, al lado de la educación formal.' },
        { label: 'Norte', text: 'Un espacio abierto en cada ciudad, donde no importa quién eres o de dónde vienes, sino a dónde quieres llegar.' }
      ],
      map: {
        alt: 'Mapa de Venezuela con la misma red de ocho ciudades: Caracas, Valencia, Barquisimeto, Maracaibo, Mérida, San Cristóbal, Cumaná y Ciudad Guayana, y una más prevista en Puerto Ayacucho. La Zona en Reclamación aparece rayada. Son ciudades que queremos alcanzar, no sedes confirmadas.',
        caption: 'Ciudades que queremos alcanzar, no sedes confirmadas.',
        claimLabel: 'Zona en Reclamación',
      // The hero network's eight cities, lit, and one further out that is only
      // planned: the horizon reaches past today's network, never around it.
      // Same order and links as the hero network, so the lighting grows the
      // same way; the planned node goes last, where the sequence never reaches.
      nodes: [
        { name: 'Caracas', lon: -66.9, lat: 10.49, dy: 16 },
        { name: 'Valencia', lon: -68.0, lat: 10.16, dy: -12 },
        { name: 'Barquisimeto', lon: -69.35, lat: 10.07, dy: 18 },
        { name: 'Maracaibo', lon: -71.64, lat: 10.65, dy: -12 },
        { name: 'Mérida', lon: -71.14, lat: 8.6, dx: -6, dy: 20 },
        { name: 'San Cristóbal', lon: -72.23, lat: 7.77, dx: 4, dy: 18 },
        { name: 'Cumaná', lon: -64.18, lat: 10.45, dy: -12 },
        { name: 'Ciudad Guayana', lon: -62.65, lat: 8.35, dy: 18 },
        { name: 'Puerto Ayacucho', lon: -67.62, lat: 5.66, dy: 18, planned: true }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
        [4, 5],
        [0, 6],
        [6, 7],
        [0, 7]
      ]
      }
    },
    talk: {
      eyebrow: 'Escúchalo',
      title: 'Lo que no nos pueden quitar',
      body:
        'De dónde viene esto: una generación que salió a estudiar y volvió a enseñar, un país que perdió ese camino, y la pregunta de qué podemos hacer mientras tanto. Habilidades que nadie te puede quitar y oportunidades al alcance de cualquiera.',
      label: 'Ignite Talk · Oslo Freedom Forum',
      talkTitle: '“What They Can’t Take” · David Aragort',
      play: 'Ver la charla',
      posterAlt: 'David Aragort en el escenario del Oslo Freedom Forum, durante su Ignite Talk.',
      privacy: 'El video se carga desde YouTube solo cuando le das play.',
      watch: '¿No carga? Míralo en YouTube'
    },
    form: {
      eyebrow: 'Mantente al tanto',
      title: 'Únete',
      lead:
        'Déjanos tu correo para mantenerte al tanto de las próximas oportunidades y actividades.',
      nameLabel: 'Nombre',
      namePlaceholder: 'Cómo te llamas',
      emailLabel: 'Correo',
      emailPlaceholder: 'tucorreo@ejemplo.com',
      newsletterLegend: 'Idioma del boletín',
      newsletterOptions: { es: 'Español', en: 'Inglés' },
      participateLabel: 'Quiero participar en una hackatón',
      submit: 'Únete',
      privacy: 'Solo usamos estos datos para escribirte.',
      allies: '¿Financias, enseñas o tienes un espacio? Escríbenos:',
      supplement: 'No llenes este campo',
      states: {
        sending: 'Enviando…',
        ok: 'Listo. Te escribimos pronto.',
        invalidEmail: 'Revisa el correo: parece que le falta algo.',
        error: 'No pudimos guardarlo. Inténtalo otra vez en un rato.'
      }
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
    toTop: 'Back to top',
    nav: [
      { label: 'Program', href: '#programa' },
      { label: 'Where this goes', href: '#norte' },
      { label: 'Join', href: '#unete' }
    ],
    hero: {
      eyebrow: 'Beyond the chatbot',
      titleLines: [{ text: 'Stop asking it things.' }, { text: 'Start handing it work.', em: true }],
      manifesto:
        'A chatbot answers you. An agent *does the work with you*: it reads your files, follows a plan and hands you the document. Learning to delegate to it is the skill that’s coming, and from Venezuela you can start today: free, and without knowing how to code.',
      primaryCta: 'Join',
      byline: 'The idea, in 5 minutes',
      bylineLink: 'Watch the talk',
      windowCaption:
        'Pick another task from the list, or press “Show what it runs” to see what the agent does on your computer. This is a local demo: it connects to nothing, and the figures are examples.'
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
      finished: 'The agent finished the task and saved the document.',
      inside: 'Show what it runs',
      insideWords: { read: 'Read', write: 'Wrote', skill: 'Used the skill', rules: 'Read your instructions' },
      rulesFile: 'AGENTS.md'
    },
    network: {
      label: 'The network we’re weaving',
      caption: 'People, mentors and cities',
      alt: 'Eight Venezuelan cities joined in a network: Caracas, Valencia, Barquisimeto, Maracaibo, Mérida, San Cristóbal, Cumaná and Ciudad Guayana. These are cities we want to reach, not confirmed sites.',
      cities: [
        { name: 'Caracas', x: 244, y: 16, lx: 244, ly: 30 },
        { name: 'Valencia', x: 203, y: 26, lx: 197, ly: 44 },
        { name: 'Barquisimeto', x: 155, y: 29, lx: 150, ly: 4 },
        { name: 'Maracaibo', x: 70, y: 11, lx: 70, ly: 25 },
        { name: 'Mérida', x: 88, y: 76, lx: 100, ly: 78 },
        { name: 'San Cristóbal', x: 48, y: 101, lx: 62, ly: 103 },
        { name: 'Cumaná', x: 344, y: 17, lx: 344, ly: 31 },
        { name: 'Ciudad Guayana', x: 397, y: 85, lx: 397, ly: 99 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
        [4, 5],
        [0, 6],
        [6, 7],
        [0, 7]
      ]
    },
    scenes: [
      {
        id: 'gastos',
        session: 'Quarterly spending',
        prompt:
          'I have three spreadsheets with this quarter’s spending. Merge them and give me a one-page summary.',
        files: ['spending-july.csv', 'spending-august.csv', 'spending-september.csv'],
        ack: 'On it. Here’s my plan:',
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
        },
        inside: {
          steps: [
            [['run', 'head -3 spending-*.csv']],
            [['write', 'reconcile.py'], ['run', 'python3 reconcile.py spending-*.csv']],
            [['run', 'python3 compare.py --against spending-q2.csv']],
            [['write', 'summary-q3.md']]
          ],
          skill: 'xlsx',
          followSteps: [[['run', 'python3 table_to_excel.py summary-q3.md']], [['write', 'summary-q3.xlsx']]]
        }
      },
      {
        id: 'presentacion',
        session: 'Workshop deck',
        prompt: 'My workshop notes are in that folder. Build me a 6-slide deck from them.',
        files: ['workshop-notes.md', 'examples.md', 'questions.md'],
        ack: 'Sure. Here’s my plan:',
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
              'What you’ll delegate on Monday'
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
        },
        inside: {
          steps: [
            [['run', 'ls notes/'], ['read', 'workshop-notes.md']],
            [['run', 'grep -h "^## " notes/*.md']],
            [['write', 'workshop-deck.md']],
            [['run', 'ls ~/Documents/Ateneo']]
          ],
          skill: 'pptx',
          followSteps: [[['run', 'python3 build_slides.py workshop-deck.md']], [['write', 'workshop-deck.pptx']]]
        }
      },
      {
        id: 'apuntes',
        session: 'This week’s reading',
        prompt: 'This PDF is the reading for the week. Make me notes and add questions to revise.',
        files: ['reading-week-3.pdf'],
        ack: 'On it. Here’s my plan:',
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
              'A tool alone doesn’t teach; guidance does',
              'What you learn stays with you, not on the platform',
              '8 revision questions, answers at the end'
            ]
          },
          note: 'Cover the answers and say them out loud: that’s what makes them stick.'
        },
        savedAs: 'notes-reading-3.md',
        followUp: {
          prompt: 'Perfect. Export it to PDF so I can print it.',
          ack: 'On it, preparing the PDF:',
          steps: ['Lay the notes out for printing', 'Export them to PDF in your folder'],
          file: { name: 'notes-reading-3.pdf', kind: 'pdf', detail: 'PDF · 2 pages · 96 KB' }
        },
        inside: {
          steps: [
            [['run', 'pdftotext reading-week-3.pdf reading.txt']],
            [['read', 'reading.txt']],
            [['write', 'questions.md']],
            [['write', 'notes-reading-3.md']]
          ],
          skill: 'pdf',
          followSteps: [[['run', 'python3 layout.py notes-reading-3.md']], [['write', 'notes-reading-3.pdf']]]
        }
      },
      {
        id: 'correo',
        session: 'Email to the board',
        prompt:
          'Using the monthly report, write me a short email for the board. Direct, no padding.',
        files: ['report-september.md'],
        ack: 'Sure. Here’s my plan:',
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
        },
        inside: {
          steps: [
            [['read', 'report-september.md']],
            [['run', 'grep -n "Total" report-september.md']],
            [['write', 'board-email.md'], ['run', 'wc -w board-email.md']],
            [['run', 'cp board-email.md drafts/']]
          ],
          skill: 'docx',
          followSteps: [[['run', 'python3 build_letter.py board-email.md']], [['write', 'board-email.docx']]]
        }
      }
    ],
    shift: {
      eyebrow: 'The shift',
      titleLines: [{ text: 'From asking' }, { text: 'to delegating', em: true }],
      lead:
        'Chatbots already read your documents and hand files back. The difference is how much of the work is still yours. An agent works in your folder, follows a plan and checks what it does: the task gets done while you do something else, and the judgment stays yours.',
      task: 'The same task: *merge three months of spending and decide where to cut.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'With a chatbot',
          sub: 'It reads your files and hands documents back now too. But every fix and every file still goes through you.',
          steps: [
            { actor: 'You', text: 'You upload the three sheets and ask for the summary.' },
            { actor: 'Chatbot', text: 'It hands back a summary and a file to download.' },
            { actor: 'You', text: 'You check it and see it mixed up two categories.' },
            { actor: 'You', text: 'You explain, upload again, download again.' },
            { actor: 'You', text: 'You save it in your folder. Next month, you start from scratch.' }
          ],
          tallyCount: '4 of 5',
          tallyText: 'steps are yours to do.'
        },
        {
          kind: 'agent',
          title: 'With an agent',
          sub: 'It works in your folder, follows a plan and checks what it does. You decide.',
          steps: [
            { actor: 'You', text: 'You point it at the folder and say what you need.' },
            { actor: 'Agent', text: 'It builds a plan and shows it to you before starting.', done: true },
            { actor: 'Agent', text: 'It opens the three sheets, reconciles the categories and checks the totals.', done: true },
            { actor: 'Agent', text: 'It saves the summary and the Excel file in your folder, next to the originals.', done: true },
            { actor: 'You', text: 'You check it and decide where to cut. Next month, you ask in one line.' }
          ],
          tallyCount: '2 of 5',
          tallyText: 'steps are yours to do: asking and deciding.'
        }
      ]
    },
    glossary: {
      eyebrow: 'Glossary',
      title: 'Words you’ll hear',
      lead: 'You don’t need them to sign up. You’ll meet them on day one of the hackathon, and they’re this simple.',
      items: [
        {
          term: 'Agent',
          sample: '“Merge these three sheets.”',
          body: 'A program that takes a task, makes a plan and carries it out on your computer: it opens files, runs commands and hands you the result to check.'
        },
        {
          term: 'Terminal',
          sample: '$ ls Documents',
          body: 'The window where you give the computer orders by typing instead of clicking. The agent uses it to read, convert and sort your files; you can watch what it does.'
        },
        {
          term: 'Markdown',
          sample: '# Title  ·  - a point',
          body: 'Plain text with a few marks: # for a heading, - for a list. Any program and any agent can read it, and the Word file or PDF you send is made from it.'
        },
        {
          term: 'Skill',
          sample: 'skills/xlsx',
          body: 'A recipe that teaches the agent to do one thing well, like building a spreadsheet or a deck. You install it once and it uses it whenever it needs to.'
        },
        {
          term: 'Instructions',
          sample: 'AGENTS.md  ·  CLAUDE.md',
          body: 'A file in your folder where you write how you want it to work: your tone, your formats, what it must not touch. The agent reads it before every task.'
        },
        {
          term: 'Your folder',
          sample: 'Documents/Ateneo',
          body: 'You give the agent a folder to work in. What it produces stays there, on your computer, where you can check it.'
        }
      ]
    },
    doors: {
      eyebrow: 'What we do',
      title: 'Three doors',
      lead: 'Come in through whichever one is closest to you. None of them asks you to know how to code.',
      doors: [
        {
          id: 'hackaton',
          n: '01',
          title: 'Hackathon for non-technical people',
          body: 'In one weekend you learn to use your first agent and walk out with it working, even if you’ve never written a line of code.',
          whoLabel: 'Who it’s for',
          who: 'Office workers, teachers, shopkeepers, teams inside organizations.',
          // Approved in David's copy review, 2026-09-11. Format, venue, places
          // and cost are still to confirm before launch.
          details: {
            goal: 'That you leave using an agent on a real task from your work or your studies.',
            activities: [
              'We open with a live demo: the same task, with a chatbot and with an agent.',
              'You pick a task that eats your time today and work on it in a small team.',
              'Mentors help you install the agent and give it its first instructions, using sample files.',
              'At the close, each team shows what it got done.'
            ],
            expect: 'One weekend, in person. You don’t need to know how to code. Bring your laptop; a modest one will do.'
          }
        },
        {
          id: 'mentorias',
          n: '02',
          title: 'Mentorships',
          body: 'At every hackathon, people who already use agents in their work stay with the teams so they leave with something that really works, not just in the demo.',
          whoLabel: 'Who it’s for',
          who: 'The teams at each hackathon, from choosing their task to presenting it.',
          details: {
            goal: 'That no team gets stuck: each one leaves the hackathon with its agent working.',
            activities: [
              'A mentor stays with each team through the hackathon.',
              'They help pick a task that can be solved in a weekend.',
              'They review what the agent hands back with the team and adjust the instructions until it works.'
            ],
            expect: 'Included in the hackathon: there’s nothing extra to sign up for.'
          }
        },
        {
          id: 'demo-nights',
          n: '03',
          title: 'Demo Nights',
          body: 'Two to five minutes: you show the tool that has been useful in your work, what went wrong before it worked, and how you got there.',
          whoLabel: 'Who it’s for',
          who: 'Anyone who has built something and wants to show it, or to learn from someone else\u2019s attempt.',
          details: {
            goal: 'Learn from what others are already doing, and show your own.',
            activities: [
              'Two-to-five-minute demos: which task, which tool, what went wrong and how you fixed it.',
              'Questions after each demo.',
              'Open conversation to meet people solving similar problems.'
            ],
            expect: 'One evening, open to anyone. You don’t need to sign up to watch; you do to present.'
          }
        }
      ],
      dialog: {
        open: 'See details',
        goalLabel: 'The goal',
        activitiesLabel: 'What we do',
        expectLabel: 'What to expect',
        join: 'Join',
        close: 'Close'
      },
      workshops: {
        label: 'Workshops',
        text: 'for teams and organizations: a practical session shaped around the work they already do.',
        cta: 'Write to us'
      }
    },
    principles: {
      eyebrow: 'Principles',
      title: 'How we work',
      lead: 'Four rules you can see in everything we do.',
      items: [
        {
          icon: 'open',
          title: 'Open first',
          body: 'We start with open-source tools you can use without paying. If you already pay for ChatGPT or Claude, we also teach you to get the most out of them.'
        },
        {
          icon: 'agency',
          title: 'You decide',
          body: 'You give the instructions and you check the result. The agent works for you, not the other way around.'
        },
        {
          icon: 'plain',
          title: 'Your files are yours',
          body: 'Your work lives in your folder, in open formats any program can open today and in ten years. When you need Word, Excel or PowerPoint, the agent produces them from there, so the final file doesn’t tie you to any platform.'
        },
        {
          icon: 'resilient',
          title: 'Resilience',
          body: 'Everything we teach runs on a modest laptop, and there’s always a free way to start.'
        }
      ]
    },
    north: {
      eyebrow: 'Where this goes',
      titleLines: [
        { text: 'Same room, same resources,' },
        { text: 'same chance.', em: true }
      ],
      lead:
        'There are public libraries where it doesn’t matter who you are: they lend computers, teach people who have never touched a keyboard, and sit you next to people working on the same problems as you. Knowledge, networks, infrastructure and a culture of technology, open to anyone. That’s what we want for Venezuela. We’re starting small; the horizon is a space like that in every city.',
      horizons: [
        { label: 'Today', text: 'Hackathons, mentorships and Demo Nights, in small groups.' },
        { label: 'Next', text: 'Partnerships with universities and organizations, alongside formal education.' },
        { label: 'Horizon', text: 'An open space in every city, where what matters isn’t who you are or where you come from, but where you want to go.' }
      ],
      map: {
        alt: 'A map of Venezuela with the same network of eight cities: Caracas, Valencia, Barquisimeto, Maracaibo, Mérida, San Cristóbal, Cumaná and Ciudad Guayana, and one more planned in Puerto Ayacucho. The Zona en Reclamación is drawn hatched. These are cities we want to reach, not confirmed sites.',
        caption: 'Cities we want to reach, not confirmed sites.',
        claimLabel: 'Zona en Reclamación',
      // The hero network's eight cities, lit, and one further out that is only
      // planned: the horizon reaches past today's network, never around it.
      // Same order and links as the hero network, so the lighting grows the
      // same way; the planned node goes last, where the sequence never reaches.
      nodes: [
        { name: 'Caracas', lon: -66.9, lat: 10.49, dy: 16 },
        { name: 'Valencia', lon: -68.0, lat: 10.16, dy: -12 },
        { name: 'Barquisimeto', lon: -69.35, lat: 10.07, dy: 18 },
        { name: 'Maracaibo', lon: -71.64, lat: 10.65, dy: -12 },
        { name: 'Mérida', lon: -71.14, lat: 8.6, dx: -6, dy: 20 },
        { name: 'San Cristóbal', lon: -72.23, lat: 7.77, dx: 4, dy: 18 },
        { name: 'Cumaná', lon: -64.18, lat: 10.45, dy: -12 },
        { name: 'Ciudad Guayana', lon: -62.65, lat: 8.35, dy: 18 },
        { name: 'Puerto Ayacucho', lon: -67.62, lat: 5.66, dy: 18, planned: true }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
        [4, 5],
        [0, 6],
        [6, 7],
        [0, 7]
      ]
      }
    },
    talk: {
      eyebrow: 'Hear it',
      title: 'What they can’t take',
      body:
        'Where this comes from: a generation that went abroad to study and came back to teach, a country that lost that path, and the question of what we can do in the meantime. Skills nobody can take from you, and opportunities within anyone’s reach.',
      label: 'Ignite Talk · Oslo Freedom Forum',
      talkTitle: '“What They Can’t Take” · David Aragort',
      play: 'Play the talk',
      posterAlt: 'David Aragort on stage at the Oslo Freedom Forum, during his Ignite Talk.',
      privacy: 'The video loads from YouTube only when you press play.',
      watch: 'Not loading? Watch it on YouTube'
    },
    form: {
      eyebrow: 'Stay in the loop',
      title: 'Join',
      lead:
        'Leave us your email and we’ll keep you posted on upcoming opportunities and activities.',
      nameLabel: 'Name',
      namePlaceholder: 'What we should call you',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      newsletterLegend: 'Newsletter language',
      newsletterOptions: { es: 'Spanish', en: 'English' },
      participateLabel: 'I want to take part in a hackathon',
      submit: 'Join',
      privacy: 'We only use this to write to you.',
      allies: 'Do you fund, teach, or have a space? Write to us:',
      supplement: 'Leave this field empty',
      states: {
        sending: 'Sending…',
        ok: 'Done. We’ll write to you soon.',
        invalidEmail: 'Check the address: something looks missing.',
        error: 'We couldn’t save that. Try again in a little while.'
      }
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
