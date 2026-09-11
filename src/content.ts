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
  n: string;
  title: string;
  body: string;
  whoLabel: string;
  who: string;
  cta: string;
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
        'Un chatbot te responde. Un agente *hace el trabajo contigo*: lee tus archivos, sigue un plan y te entrega un documento. Aprende a delegar con herramientas libres, desde Venezuela, sin pagar nada para empezar.',
      primaryCta: 'Únete',
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
    network: {
      label: 'La red que estamos tejiendo',
      caption: 'Bibliotecas, mentores y ciudades',
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
        'La frontera ya no está en hacerle mejores preguntas a un chatbot. Está en delegarle el trabajo a un agente y revisar lo que te entrega: lo que antes te consumía demasiado tiempo se resuelve mientras haces otra cosa, y el criterio sigue siendo tuyo. Ya está al alcance de cualquiera en Venezuela, con herramientas gratuitas.',
      task: 'La misma tarea: *juntar los gastos de tres meses y decidir dónde recortar.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'Con un chatbot',
          sub: 'Tú preguntas, él responde, y el trabajo sigue siendo tuyo.',
          steps: [
            { actor: 'Tú', text: 'Le preguntas cómo comparar los tres meses.' },
            { actor: 'Chatbot', text: 'Te explica el método; los números los pegas tú.' },
            { actor: 'Tú', text: 'Copias y pegas las hojas, columna por columna.' },
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
    doors: {
      eyebrow: 'Qué hacemos',
      title: 'Tres puertas',
      lead: 'Entra por la que te quede más cerca. Ninguna te pide saber programar.',
      doors: [
        {
          n: '01',
          title: 'Hackatón para no técnicos',
          body: 'En un fin de semana aprendes a usar tu primer agente y sales con él funcionando, aunque nunca hayas escrito una línea de código.',
          whoLabel: 'Para quién',
          who: 'Gente de oficina, docentes, comerciantes, equipos de organizaciones.',
          cta: 'Únete'
        },
        {
          n: '02',
          title: 'Mentorías',
          body: 'Alguien que ya lo hizo acompaña a tu equipo hasta que el agente trabaje de verdad, no solo en la demo.',
          whoLabel: 'Para quién',
          who: 'Los equipos que salieron de la hackatón y quieren terminar lo que empezaron.',
          cta: 'Únete'
        },
        {
          n: '03',
          title: 'Demo Nights',
          body: 'Entre 2 y 5 minutos: muestras la herramienta que te ha sido útil en tu trabajo y cuentas cómo llegaste ahí.',
          whoLabel: 'Para quién',
          who: 'Quien ya armó algo y quiere enseñarlo, o aprender del intento de otro.',
          cta: 'Únete'
        }
      ],
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
          title: 'Código abierto',
          body: 'Usamos y enseñamos herramientas que puedes revisar, copiar y mejorar.'
        },
        {
          icon: 'agency',
          title: 'Agencia directa',
          body: 'Tú das las instrucciones y tú decides. El agente trabaja para ti, no al revés.'
        },
        {
          icon: 'plain',
          title: 'Texto plano',
          body: 'Tus documentos quedan en archivos que abres con cualquier cosa, hoy y en diez años.'
        },
        {
          icon: 'resilient',
          title: 'Resiliencia',
          body: 'Todo funciona en una laptop modesta.'
        }
      ]
    },
    north: {
      eyebrow: 'El norte',
      titleLines: [
        { text: 'Una red de bibliotecas públicas' },
        { text: 'del siglo XXI.', em: true }
      ],
      lead:
        'Empezamos con hackatones y mentorías. Lo que sigue son alianzas con universidades, para que esto viva al lado de la educación formal. Y el norte: bibliotecas públicas donde cualquiera pueda sentarse, delegarle su primer trabajo a un agente y salir con algo propio.',
      horizons: [
        { label: 'Hoy', text: 'Hackatones, mentorías y Demo Nights.' },
        { label: 'Después', text: 'Alianzas con universidades, al lado de la educación formal.' },
        { label: 'Norte', text: 'Una red de bibliotecas públicas del siglo XXI, en todo el país.' }
      ],
      map: {
        alt: 'Mapa de Venezuela con nodos de bibliotecas en Caracas, Barquisimeto, Maracaibo, Mérida, Cumaná y Ciudad Guayana, y dos previstos en San Cristóbal y Puerto Ayacucho. La Zona en Reclamación aparece rayada. Son nodos ilustrativos, no sedes confirmadas.',
        caption: 'Nodos ilustrativos, no sedes confirmadas.',
        claimLabel: 'Zona en Reclamación',
      nodes: [
        { name: 'Caracas', lon: -66.9, lat: 10.49, dy: 16 },
        { name: 'Barquisimeto', lon: -69.35, lat: 10.07, dy: 18 },
        { name: 'Maracaibo', lon: -71.64, lat: 10.65, dy: -12 },
        { name: 'Mérida', lon: -71.14, lat: 8.6, dx: -6, dy: 20 },
        { name: 'Cumaná', lon: -64.18, lat: 10.45, dy: -12 },
        { name: 'Ciudad Guayana', lon: -62.65, lat: 8.35, dy: 18 },
        { name: 'San Cristóbal', lon: -72.23, lat: 7.77, dx: 4, dy: 18, planned: true },
        { name: 'Puerto Ayacucho', lon: -67.62, lat: 5.66, dy: 18, planned: true }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [1, 3],
        [0, 4],
        [4, 5],
        [0, 5]
      ]
      }
    },
    talk: {
      eyebrow: 'Escúchalo',
      title: 'La idea completa, en cinco minutos',
      body:
        'Por qué el salto del chatbot al agente ya está al alcance de cualquiera en Venezuela, y qué estamos haciendo con eso.',
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
      participateLabel: 'Quiero participar en una hackatón o una mentoría',
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
    network: {
      label: 'The network we are weaving',
      caption: 'Libraries, mentors and cities',
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
        'The frontier is no longer about asking a chatbot better questions. It is about handing an agent the work and checking what comes back: what used to take far too much of your time gets done while you do something else, and the judgement stays yours. It is already within reach for anyone in Venezuela, with free tools.',
      task: 'The same task: *merge three months of spending and decide where to cut.*',
      columns: [
        {
          kind: 'chatbot',
          title: 'With a chatbot',
          sub: 'You ask, it answers, and the work is still yours.',
          steps: [
            { actor: 'You', text: 'You ask it how to compare the three months.' },
            { actor: 'Chatbot', text: 'It explains the method; you paste the numbers.' },
            { actor: 'You', text: 'You copy and paste the sheets, column by column.' },
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
    doors: {
      eyebrow: 'What we do',
      title: 'Three doors',
      lead: 'Come in through whichever one is closest to you. None of them asks you to know how to code.',
      doors: [
        {
          n: '01',
          title: 'Hackathon for non-technical people',
          body: 'In one weekend you learn to use your first agent and walk out with it working, even if you have never written a line of code.',
          whoLabel: 'Who it is for',
          who: 'Office workers, teachers, shopkeepers, teams inside organisations.',
          cta: 'Join'
        },
        {
          n: '02',
          title: 'Mentorships',
          body: 'Someone who has already done it works alongside your team until the agent really works, not just in the demo.',
          whoLabel: 'Who it is for',
          who: 'The teams that came out of the hackathon and want to finish what they started.',
          cta: 'Join'
        },
        {
          n: '03',
          title: 'Demo Nights',
          body: 'Two to five minutes: you show the tool that has been useful in your work, and how you got there.',
          whoLabel: 'Who it is for',
          who: 'Anyone who has built something and wants to show it, or to learn from someone else\u2019s attempt.',
          cta: 'Join'
        }
      ],
      workshops: {
        label: 'Workshops',
        text: 'for teams and organisations: a practical session shaped around the work they already do.',
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
          title: 'Open source',
          body: 'We use and teach tools you can read, copy and improve.'
        },
        {
          icon: 'agency',
          title: 'Direct agency',
          body: 'You give the instructions and you decide. The agent works for you, not the other way round.'
        },
        {
          icon: 'plain',
          title: 'Plain text',
          body: 'Your documents stay in files you can open with anything, today and in ten years.'
        },
        {
          icon: 'resilient',
          title: 'Resilience',
          body: 'Everything works on a modest laptop.'
        }
      ]
    },
    north: {
      eyebrow: 'Where this goes',
      titleLines: [
        { text: 'A network of public libraries' },
        { text: 'for this century.', em: true }
      ],
      lead:
        'We start with hackathons and mentorships. Next come partnerships with universities, so this lives alongside formal education. And the horizon: public libraries where anyone can sit down, hand an agent their first piece of work, and walk out with something of their own.',
      horizons: [
        { label: 'Today', text: 'Hackathons, mentorships and Demo Nights.' },
        { label: 'Next', text: 'Partnerships with universities, alongside formal education.' },
        { label: 'Horizon', text: 'A network of twenty-first-century public libraries, across the country.' }
      ],
      map: {
        alt: 'A map of Venezuela with library nodes in Caracas, Barquisimeto, Maracaibo, Mérida, Cumaná and Ciudad Guayana, and two planned in San Cristóbal and Puerto Ayacucho. The Zona en Reclamación is drawn hatched. These are illustrative nodes, not confirmed sites.',
        caption: 'Illustrative nodes, not confirmed sites.',
        claimLabel: 'Zona en Reclamación',
      nodes: [
        { name: 'Caracas', lon: -66.9, lat: 10.49, dy: 16 },
        { name: 'Barquisimeto', lon: -69.35, lat: 10.07, dy: 18 },
        { name: 'Maracaibo', lon: -71.64, lat: 10.65, dy: -12 },
        { name: 'Mérida', lon: -71.14, lat: 8.6, dx: -6, dy: 20 },
        { name: 'Cumaná', lon: -64.18, lat: 10.45, dy: -12 },
        { name: 'Ciudad Guayana', lon: -62.65, lat: 8.35, dy: 18 },
        { name: 'San Cristóbal', lon: -72.23, lat: 7.77, dx: 4, dy: 18, planned: true },
        { name: 'Puerto Ayacucho', lon: -67.62, lat: 5.66, dy: 18, planned: true }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [1, 3],
        [0, 4],
        [4, 5],
        [0, 5]
      ]
      }
    },
    talk: {
      eyebrow: 'Hear it',
      title: 'The whole idea, in five minutes',
      body:
        'Why the jump from chatbot to agent is already within reach for anyone in Venezuela, and what we are doing with it.',
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
        'Leave us your email and we will keep you posted on upcoming opportunities and activities.',
      nameLabel: 'Name',
      namePlaceholder: 'What we should call you',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      newsletterLegend: 'Newsletter language',
      newsletterOptions: { es: 'Spanish', en: 'English' },
      participateLabel: 'I want to take part in a hackathon or a mentorship',
      submit: 'Join',
      privacy: 'We only use this to write to you.',
      allies: 'Do you fund, teach, or have a space? Write to us:',
      supplement: 'Leave this field empty',
      states: {
        sending: 'Sending…',
        ok: 'Done. We will write to you soon.',
        invalidEmail: 'Check the address: something looks missing.',
        error: 'We could not save that. Try again in a little while.'
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
