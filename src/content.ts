import type { Locale } from './locale';

export type Pillar = {
  horizon: string;
  title: string;
  body: string;
};

export type OriginBeat = {
  heading: string;
  body: string;
};

export type PageCopy = {
  languageLabel: string;
  languageSwitchTo: {
    es: string;
    en: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    promise: string;
    body: string;
    primaryCta: string;
  };
  labels: {
    origin: string;
    audience: string;
    name: string;
    structure: string;
    boundaries: string;
    updates: string;
    backToTop: string;
  };
  origin: {
    title: string;
    beats: OriginBeat[];
    closing: string;
  };
  audience: {
    title: string;
    body: string;
    who: string[];
  };
  name: {
    title: string;
    body: string;
  };
  pillars: {
    title: string;
    items: Pillar[];
  };
  not: {
    title: string;
    points: string[];
    body: string;
  };
  subscribe: {
    title: string;
    body: string;
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    newsletterLanguageLabel: string;
    participateLabel: string;
    button: string;
    privacy: string;
    success: string;
    invalidEmail: string;
    providerError: string;
  };
  footer: {
    contact: string;
    disclaimer: string;
  };
};

export const copy: Record<Locale, PageCopy> = {
  es: {
    languageLabel: 'Idioma',
    languageSwitchTo: {
      es: 'Cambiar a español',
      en: 'Cambiar a inglés'
    },
    hero: {
      eyebrow: 'Espacio abierto de aprendizaje cívico',
      title: 'Ateneo Abierto',
      promise: 'Habilidades y herramientas que nadie te puede quitar.',
      body: 'Una iniciativa venezolana de aprendizaje cívico para recuperar capacidad de acción a través de talleres, herramientas y comunidad.',
      primaryCta: 'Recibir actualizaciones'
    },
    labels: {
      origin: 'Punto de partida',
      audience: 'Para quién',
      name: 'El nombre',
      structure: 'Estructura',
      boundaries: 'Límites',
      updates: 'Actualizaciones',
      backToTop: 'Volver arriba'
    },
    origin: {
      title: 'El sistema educativo fue desmantelado. La respuesta se construye desde afuera.',
      beats: [
        {
          heading: 'La apuesta',
          body:
            'Hubo un tiempo en que Venezuela entendió que su recurso más valioso no era el petróleo, sino su gente. Fundayacucho envió a miles de estudiantes a las mejores universidades del mundo, con un compromiso: volver y enseñar lo aprendido. Muchos volvieron, y fueron profesores.'
        },
        {
          heading: 'El desmantelamiento',
          body:
            'Esa apuesta fue desmontada deliberadamente. Cambió lo que se enseñaba. Llegaron los recortes presupuestarios. Los profesores se fueron, las escuelas se vaciaron y el aprendizaje se volvió un lujo.'
        },
        {
          heading: 'La brecha',
          body:
            'Una generación entera se quedó con menos opciones. No por falta de capacidad. Por falta de acceso. Y mientras tanto, el mundo siguió avanzando.'
        },
        {
          heading: 'El puente',
          body:
            'Las herramientas y el conocimiento existen. Lo que falta es el puente: talleres prácticos, grupos pequeños y acceso compartido a herramientas que la gente se puede llevar y usar fuera del taller.'
        }
      ],
      closing: 'Lo que se nos arrebató se reconstruye desde afuera del sistema que lo destruyó.'
    },
    audience: {
      title: 'Para venezolanos que saben que el momento exige herramientas nuevas.',
      body:
        'Para venezolanos que entienden que la educación que recibieron no los preparó para los retos y oportunidades de hoy, y que están listos para empezar. No hace falta perfil técnico. Sólo curiosidad y ganas de empezar.',
      who: ['Profesores', 'Profesionales', 'Estudiantes', 'Emprendedores', 'Gente que tiene dos trabajos']
    },
    name: {
      title: 'Por qué Ateneo Abierto',
      body:
        'Ateneo — el templo griego dedicado a Atenea, diosa del conocimiento — nombra una forma: un lugar donde la gente se reúne a aprender, sin supervisión ni afiliación estatal.\n\nAbierto porque la condición de entrada no es tu situación económica, ni tu estatus social, ni tu afiliación política. Es la disposición a empezar.'
    },
    pillars: {
      title: 'Tres pilares',
      items: [
        {
          horizon: 'Para empezar ya',
          title: 'Talleres prácticos de IA y herramientas digitales',
          body:
            'Grupos pequeños, ejercicios prácticos. Aprende a usar inteligencia artificial y otras tecnologías que están cambiando las formas en que ejercemos nuestra libertad.'
        },
        {
          horizon: 'Mediano plazo',
          title: 'Junto a la educación formal',
          body:
            'Creemos que la educación formal sigue siendo fundamental. Donde las universidades y docentes siguen funcionando, queremos trabajar junto a ellos, no en su lugar. Las herramientas prácticas y los fundamentos del aula se complementan.'
        },
        {
          horizon: 'Post-transición',
          title: 'El norte estratégico',
          body:
            'El norte es una red de espacios de aprendizaje cívico: siguiendo el ejemplo de las bibliotecas públicas del siglo XXI donde el acceso a internet, herramientas y aprendizaje sea un derecho público, no un privilegio individual.'
        }
      ]
    },
    not: {
      title: 'Lo que no somos',
      points: [
        'No somos parte del Estado venezolano, ni de ninguno de sus ministerios, planes o programas.',
        'No somos una estructura partidista ni una campaña electoral.',
        'No reclutamos a nadie para actividad pública confrontativa dentro de Venezuela.'
      ],
      body:
        'Ateneo Abierto es un proyecto independiente, civil y educativo. Las habilidades que la gente aprende aquí son suyas.'
    },
    subscribe: {
      title: 'Recibe actualizaciones',
      body:
        'Estamos preparando los primeros pilotos, materiales y alianzas. Déjanos tu correo para recibir avances del proyecto y saber cuándo se abran nuevas formas de participar o apoyar.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      newsletterLanguageLabel: 'Idioma del boletín',
      participateLabel: 'También quiero enterarme de oportunidades para participar.',
      button: 'Suscribirme',
      privacy: 'Si quieres apoyar o colaborar de alguna forma, escríbenos.',
      success: 'Listo. Te avisaremos cuando haya novedades.',
      invalidEmail: 'Escribe un correo válido para suscribirte.',
      providerError: 'No pudimos registrar tu correo. Intenta de nuevo en unos minutos.'
    },
    footer: {
      contact: 'ateneo@aragort.com',
      disclaimer:
        'La seguridad es parte de cómo trabajamos. No compartimos información que pueda poner en riesgo a quienes participan en este proyecto — incluyendo detalles operativos.'
    }
  },
  en: {
    languageLabel: 'Language',
    languageSwitchTo: {
      es: 'Switch to Spanish',
      en: 'Switch to English'
    },
    hero: {
      eyebrow: 'Open civic learning space',
      title: 'Ateneo Abierto',
      promise: 'Skills and tools no one can take from you.',
      body: 'A Venezuelan civic learning initiative helping people rebuild practical agency through workshops, tools, and community.',
      primaryCta: 'Get updates'
    },
    labels: {
      origin: 'Starting point',
      audience: "Who it's for",
      name: 'The name',
      structure: 'Structure',
      boundaries: 'Boundaries',
      updates: 'Updates',
      backToTop: 'Back to top'
    },
    origin: {
      title: 'The education system was dismantled. The response is being built outside it.',
      beats: [
        {
          heading: 'The bet',
          body:
            "There was a time when Venezuela understood that its most valuable resource wasn't oil — it was its people. Fundayacucho sent thousands of students to some of the best universities in the world, with one commitment: come back and teach what they learned. Many did, and became professors themselves."
        },
        {
          heading: 'The dismantling',
          body:
            'That bet was deliberately taken apart. What was taught changed. Budget cuts followed. Teachers left, schools emptied out, and learning became a luxury.'
        },
        {
          heading: 'The gap',
          body:
            'A whole generation was left with fewer options. Not for lack of capacity. For lack of access. And meanwhile, the world kept moving.'
        },
        {
          heading: 'The bridge',
          body:
            'The tools and the knowledge exist. What is missing is the bridge: practical workshops, small groups, and shared access to tools people can take with them and use beyond the workshop.'
        }
      ],
      closing: 'What was taken is being rebuilt outside the system that destroyed it.'
    },
    audience: {
      title: 'For Venezuelans who know the moment calls for new tools.',
      body:
        "For Venezuelans who understand that the education they received didn't fully prepare them for today's challenges and opportunities, and who are ready to begin. No technical background required. Just curiosity and a reason to start.",
      who: ['Teachers', 'Professionals', 'Students', 'Entrepreneurs', 'People working two jobs']
    },
    name: {
      title: 'Why "Ateneo Abierto"',
      body:
        'Ateneo — the Greek temple dedicated to Athena, goddess of wisdom — names a form: a place where people gather to learn, without state oversight or affiliation.\n\nAbierto — open, because the entry condition is willingness, not credentials or connections.'
    },
    pillars: {
      title: 'Three pillars',
      items: [
        {
          horizon: 'Ready to start now',
          title: 'Hands-on workshops in AI and digital tools',
          body:
            'Small groups, practical. Learning to use AI and other technologies quietly changing what freedom looks like in practice.'
        },
        {
          horizon: 'Mid-term',
          title: 'Alongside formal education',
          body:
            'We believe formal education still matters. Where universities and educators are still functioning, we want to work alongside them, not replace them. Practical tools and classroom foundations strengthen each other.'
        },
        {
          horizon: 'Post-transition',
          title: 'Where this is heading',
          body:
            'The goal is a network of civic learning spaces: inspired by the 21st-century public libraries where access to internet, tools, and learning is a public right, not an individual privilege.'
        }
      ]
    },
    not: {
      title: 'What we are not',
      points: [
        'Not a Venezuelan state program, and not tied to any of its ministries or plans.',
        'Not a party structure or an electoral campaign.',
        'Not recruiting anyone into confrontational public activity inside Venezuela.'
      ],
      body:
        'Ateneo Abierto is independent, civilian, and educational. The skills people learn here belong to them.'
    },
    subscribe: {
      title: 'Get updates',
      body:
        'We are preparing the first pilots, materials, and partnerships. Leave your email to receive project updates and hear when new ways to participate or support open up.',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.org',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      newsletterLanguageLabel: 'Newsletter language',
      participateLabel: 'I also want to hear about opportunities to participate.',
      button: 'Subscribe',
      privacy: 'If you want to support or collaborate, write to us.',
      success: "You're in. We'll be in touch when things are moving.",
      invalidEmail: 'Enter a valid email address to subscribe.',
      providerError: 'We could not save your email. Please try again in a few minutes.'
    },
    footer: {
      contact: 'ateneo@aragort.com',
      disclaimer:
        'Security is built into how we work. We do not share information that could put anyone at risk — including operational details.'
    }
  }
};
