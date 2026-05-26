import type { Locale } from './locale';

export type Pillar = {
  title: string;
  body: string;
};

export type PageCopy = {
  languageLabel: string;
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
    structure: string;
    boundaries: string;
    updates: string;
    backToTop: string;
  };
  origin: {
    title: string;
    body: string;
  };
  audience: {
    title: string;
    body: string;
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
    body: string;
  };
  subscribe: {
    title: string;
    body: string;
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
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
      structure: 'Estructura',
      boundaries: 'Límites',
      updates: 'Actualizaciones',
      backToTop: 'Volver arriba'
    },
    origin: {
      title: 'El sistema educativo fue desmantelado. La respuesta se construye desde afuera.',
      body:
        'Hubo un tiempo en que Venezuela apostó por formar talento al más alto nivel. Fundayacucho fue una de las expresiones más visibles de esa apuesta: enviar estudiantes a prepararse afuera con la expectativa de que volvieran a enseñar, construir y multiplicar lo aprendido.\n\nEsa idea de país fue desmantelada. La educación siguió existiendo, pero golpeada por años de abandono, recortes presupuestarios, migración docente, instituciones debilitadas y acceso cada vez más desigual. El resultado no es sólo una generación con menos oportunidades: es una brecha acumulada frente a un mundo que siguió avanzando.\n\nAteneo Abierto no viene a reemplazar la educación formal. Viene a complementar lo que la gente ya aprendió con habilidades que muchas escuelas y universidades no pudieron enseñar a tiempo, porque esta época empezó a moverse más rápido que el sistema educativo venezolano incluso en sus mejores condiciones.\n\nLas herramientas y el conocimiento existen. Lo que falta es el puente: talleres prácticos, grupos pequeños y acceso compartido a herramientas que la gente puede llevarse y usar fuera del taller.\n\nLo que se arrebató se reconstruye desde afuera del sistema que lo destruyó. Ese es el punto de partida.'
    },
    audience: {
      title: 'Para venezolanos que saben que el momento exige herramientas nuevas.',
      body:
        'Para venezolanos que entienden que la educación que recibieron no los preparó para los retos y oportunidades de hoy, y que están listos para empezar. Profesores, profesionales, estudiantes, emprendedores, gente que tiene dos trabajos. No hace falta perfil técnico. Sólo curiosidad y ganas de empezar.'
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
          title: 'Talleres prácticos de IA y herramientas digitales',
          body:
            'Grupos pequeños, ejercicios prácticos. Aprende a usar inteligencia artificial y otras tecnologías que están cambiando las formas en que ejercemos nuestra libertad. Para empezar ya.'
        },
        {
          title: 'Junto a la educación formal',
          body:
            'Creemos que la educación formal sigue siendo fundamental. Donde las universidades y docentes siguen funcionando, queremos trabajar junto a ellos, no en su lugar. Las herramientas prácticas y los fundamentos del aula se complementan. Mediano plazo.'
        },
        {
          title: 'El norte estratégico',
          body:
            'El norte es una red de espacios de aprendizaje cívico: siguiendo el ejemplo de las bibliotecas públicas del siglo XXI donde el acceso a internet, herramientas y aprendizaje sea un derecho público, no un privilegio individual. Post-transición.'
        }
      ]
    },
    not: {
      body:
        'Ateneo Abierto es un proyecto independiente, civil y educativo. No somos parte del Estado venezolano, de ninguna estructura partidista, ni de ningún esfuerzo de reclutamiento público. Las habilidades que la gente aprende aquí son suyas.'
    },
    subscribe: {
      title: 'Recibe actualizaciones',
      body:
        'Estamos preparando los primeros pilotos, materiales y alianzas. Déjanos tu correo para recibir avances del proyecto y saber cuándo se abran nuevas formas de participar o apoyar.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
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
      structure: 'Structure',
      boundaries: 'Boundaries',
      updates: 'Updates',
      backToTop: 'Back to top'
    },
    origin: {
      title: 'The education system was dismantled. The response is being built outside it.',
      body:
        "There was a time when Venezuela invested in educating talent at the highest level. Fundayacucho was one of the clearest expressions of that bet: sending students abroad to study with the expectation that they would return to teach, build, and multiply what they learned.\n\nThat idea of the country was dismantled. Education continued to exist, but it was damaged by years of neglect, budget cuts, teacher migration, weakened institutions, and increasingly unequal access. The result is not only a generation with fewer opportunities: it is an accumulated gap with a world that kept moving forward.\n\nAteneo Abierto is not here to replace formal education. It is here to complement what people already learned with skills many schools and universities could not teach in time, because this era started moving faster than the Venezuelan education system could have moved even in better conditions.\n\nThe tools and knowledge exist. What is missing is the bridge: practical workshops, small groups, and shared access to tools people can take and use beyond the workshop.\n\nWhat was taken is being rebuilt outside the system that destroyed it. That is the starting point."
    },
    audience: {
      title: 'For Venezuelans who know the moment calls for new tools.',
      body:
        "For Venezuelans who understand that the education they received didn't fully prepare them for today's challenges and opportunities, and who are ready to begin. Teachers, professionals, students, entrepreneurs, people working two jobs. No technical background required. Just curiosity and a reason to start."
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
          title: 'Hands-on workshops in AI and digital tools',
          body:
            'Small groups, practical. Learning to use AI and other technologies quietly changing what freedom looks like in practice. Ready to start now.'
        },
        {
          title: 'Alongside formal education',
          body:
            "We believe formal education still matters. Where universities and educators are still functioning, we want to work alongside them, not replace them. Practical tools and classroom foundations strengthen each other. Mid-term."
        },
        {
          title: 'Where this is heading',
          body:
            'The goal is a network of civic learning spaces: inspired by the 21st-century public libraries where access to internet, tools, and learning is a public right, not an individual privilege. Post-transition.'
        }
      ]
    },
    not: {
      body:
        'Ateneo Abierto is independent, civilian, and educational. We are not part of the Venezuelan state, a party structure, or any public recruitment effort. The skills people learn here belong to them.'
    },
    subscribe: {
      title: 'Get updates',
      body:
        'We are preparing the first pilots, materials, and partnerships. Leave your email to receive project updates and hear when new ways to participate or support open up.',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.org',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
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
