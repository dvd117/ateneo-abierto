import type { Locale } from './locale';

export type Pillar = {
  title: string;
  body: string;
};

export type PageCopy = {
  nav: {
    manifesto: string;
    participate: string;
  };
  languageLabel: string;
  hero: {
    eyebrow: string;
    title: string;
    promise: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  labels: {
    manifesto: string;
    audience: string;
    structure: string;
    boundaries: string;
    updates: string;
    backToTop: string;
  };
  manifesto: {
    title: string;
    teaser: string;
    body: string;
    cta: string;
    subscribeCta: string;
    backCta: string;
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
    nav: {
      manifesto: 'Manifiesto',
      participate: 'Sumarme'
    },
    languageLabel: 'Idioma',
    hero: {
      eyebrow: 'Espacio abierto de aprendizaje cívico',
      title: 'Ateneo Abierto',
      promise: 'Habilidades y herramientas que nadie te puede quitar.',
      body: 'Una iniciativa venezolana de aprendizaje cívico para recuperar agencia práctica a través de talleres, herramientas y comunidad.',
      primaryCta: 'Seguir el proceso',
      secondaryCta: 'Leer manifiesto'
    },
    labels: {
      manifesto: 'Manifiesto',
      audience: 'Para quién',
      structure: 'Estructura',
      boundaries: 'Límites',
      updates: 'Actualizaciones',
      backToTop: 'Volver arriba'
    },
    manifesto: {
      title: 'El sistema educativo fue desmantelado. Nosotros no esperamos.',
      teaser:
        'Lo que se nos arrebató se reconstruye desde afuera del sistema que lo destruyó. Eso es lo que estamos haciendo.',
      body:
        'Hubo un tiempo en que Venezuela entendió que su recurso más valioso no era el petróleo, sino su gente. La apuesta tenía un nombre: Fundayacucho. Un programa que mandaba estudiantes a las mejores universidades del mundo con el compromiso de que volvieran y aplicaran lo que aprendieran. Muchos volvieron a dar clases. La apuesta era real.\n\nEsa apuesta fue desmantelada deliberadamente. No fue descuido: fue una decisión política. Los profesores se fueron, las escuelas se vaciaron, el aprendizaje se volvió un lujo, y una generación entera se quedó con menos opciones. No por falta de capacidad. Por falta de acceso.\n\nPor mucho tiempo la pregunta central fue cómo salir de esta situación. En algún momento apareció otra pregunta: ¿qué puede hacer la gente mientras tanto? Eso es lo que Ateneo Abierto responde.\n\nNo porque las herramientas y el conocimiento no existan — es que nadie ha construido el puente. Eso es lo que estamos haciendo: talleres prácticos, grupos pequeños, acceso compartido a herramientas que la gente puede llevarse y usar fuera del taller.\n\nCada vez que entro a una biblioteca pública en otra ciudad, pienso: esto. Un espacio donde no importa quién eres — misma sala, mismos recursos, misma oportunidad. Eso es lo que queremos construir en casa. Aún no estamos ahí. Pero ese es el norte.',
      cta: 'Leer manifiesto completo',
      subscribeCta: 'Si quieres seguir el proceso, deja tu correo.',
      backCta: 'Volver al inicio'
    },
    audience: {
      title: 'Para venezolanos que saben que el momento exige herramientas nuevas.',
      body:
        'Para venezolanos que entienden que la educación que recibieron no los preparó para los retos y oportunidades de hoy, y que están listos para empezar. Profesores, profesionales, estudiantes, emprendedores, gente que trabaja dos trabajos. No hace falta perfil técnico. Sólo curiosidad y ganas de empezar.'
    },
    name: {
      title: 'Por qué Ateneo Abierto',
      body:
        'Ateneo — el templo griego dedicado a Atenea, diosa del conocimiento — nombra una forma: un lugar donde la gente se reúne a aprender, sin supervisión ni afiliación estatal.\n\nAbierto porque la condición de entrada no es el linaje, ni el cargo, ni la afiliación política. Es la disposición a empezar.'
    },
    pillars: {
      title: 'Tres pilares',
      items: [
        {
          title: 'Talleres prácticos de IA y herramientas digitales',
          body:
            'Grupos pequeños, hands-on. Aprender a usar inteligencia artificial y otras tecnologías que están cambiando, en lo concreto, lo que significa libertad. Ejecutable ya.'
        },
        {
          title: 'Junto a la educación formal',
          body:
            'Creemos que la educación formal sigue importando. Donde las universidades y docentes siguen funcionando, queremos trabajar junto a ellos, no en su lugar. Las herramientas prácticas y los fundamentos del aula se complementan. Mediano plazo.'
        },
        {
          title: 'El norte estratégico',
          body:
            'Cada vez que entro a una biblioteca pública fuera de Venezuela, pienso: esto. Un espacio donde no importa quién eres — misma sala, mismos recursos, misma oportunidad. Aún no estamos ahí. Pero es el norte. Post-transición.'
        }
      ]
    },
    not: {
      body:
        'Ateneo Abierto es independiente, civil y educativo. No somos parte del Estado venezolano, de ninguna estructura partidista, ni de ningún esfuerzo de reclutamiento público. Las habilidades que la gente aprende aquí son suyas.'
    },
    subscribe: {
      title: 'Recibe actualizaciones',
      body:
        'Estamos preparando los primeros pilotos, materiales y alianzas. Déjanos tu correo si quieres seguir el proceso o encontrar una forma concreta de ayudar.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      button: 'Seguir el proceso',
      privacy: 'Si quieres apoyar o colaborar de alguna forma, escríbenos.',
      success: 'Listo. Te avisaremos cuando haya novedades.',
      invalidEmail: 'Escribe un correo válido para suscribirte.',
      providerError: 'No pudimos registrar tu correo. Intenta de nuevo en unos minutos.'
    },
    footer: {
      contact: 'hola@ateneo-abierto.org',
      disclaimer:
        'La seguridad es parte de cómo trabajamos. No compartimos información que pueda poner en riesgo a quienes participan en este proyecto — incluyendo fechas, sedes y detalles operativos.'
    }
  },
  en: {
    nav: {
      manifesto: 'Manifesto',
      participate: 'Get involved'
    },
    languageLabel: 'Language',
    hero: {
      eyebrow: 'Open civic learning space',
      title: 'Ateneo Abierto',
      promise: 'Skills and tools no one can take from you.',
      body: 'A Venezuelan civic learning initiative helping people rebuild practical agency through workshops, tools, and community.',
      primaryCta: 'Follow along',
      secondaryCta: 'Read manifesto'
    },
    labels: {
      manifesto: 'Manifesto',
      audience: "Who it's for",
      structure: 'Structure',
      boundaries: 'Boundaries',
      updates: 'Updates',
      backToTop: 'Back to top'
    },
    manifesto: {
      title: "The education system was dismantled. We didn't wait.",
      teaser:
        "What was taken is being rebuilt outside the system that destroyed it. That's what we're doing.",
      body:
        "There was a time when Venezuela understood that its most valuable resource wasn't oil — it was its people. That bet had a name: Fundayacucho. A scholarship program that sent students to top universities around the world, with the commitment that they would come back and apply what they learned. Many came back as professors. The bet was real.\n\nThat bet was deliberately dismantled. Not through neglect — through political choice. Teachers left, schools emptied out, learning became a luxury, and a whole generation was left with fewer options. Not for lack of capacity. For lack of access.\n\nFor a long time the central question was how to get out of this situation. At some point another question appeared: what can people do in the meantime? That's what Ateneo Abierto answers.\n\nNot because the tools and knowledge don't exist — it's that no one has built the bridge. That's what we're doing: practical workshops, small groups, shared access to tools people can take and use beyond the workshop.\n\nEvery time I walk into a public library in another city, I think: this. A space where it doesn't matter who you are — same room, same resources, same shot. That's what we want to build at home. We're not there yet. But that's the north star.",
      cta: 'Read full manifesto',
      subscribeCta: 'If you want to follow the process, leave your email.',
      backCta: 'Back to home'
    },
    audience: {
      title: 'For Venezuelans who know the moment calls for new tools.',
      body:
        "For Venezuelans who understand that the education they received didn't fully prepare them for today's challenges and opportunities, and who are ready to begin. Teachers, professionals, students, entrepreneurs, people working two jobs. No technical background required. Just curiosity and a reason to start."
    },
    name: {
      title: 'Why "Ateneo Abierto"',
      body:
        'Ateneo — the Greek temple dedicated to Athena, goddess of wisdom — names a form: a place where people gather to learn, without state oversight or affiliation.\n\nOpen — because the entry condition is willingness, not credentials or connections.'
    },
    pillars: {
      title: 'Three pillars',
      items: [
        {
          title: 'Hands-on workshops in AI and digital tools',
          body:
            'Small groups, practical. Learning to use AI and other technologies quietly changing what freedom looks like in practice. Executable now.'
        },
        {
          title: 'Alongside formal education',
          body:
            "We believe formal education still matters. Where universities and educators are still functioning, we want to work alongside them, not replace them. Practical tools and classroom foundations strengthen each other. Mid-term."
        },
        {
          title: 'Where this is heading',
          body:
            "Every time I walk into a public library outside Venezuela, I think: this. A space where it doesn't matter who you are — same room, same resources, same shot. We're not there yet. But that's where we're building toward. Post-transition."
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
        'We are preparing the first pilots, materials, and partnerships. Leave your email if you want to follow the process or find a concrete way to help.',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.org',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      button: 'Follow along',
      privacy: 'If you want to support or collaborate, write to us.',
      success: "You're in. We'll be in touch when things are moving.",
      invalidEmail: 'Enter a valid email address to subscribe.',
      providerError: 'We could not save your email. Please try again in a few minutes.'
    },
    footer: {
      contact: 'hola@ateneo-abierto.org',
      disclaimer:
        'Security is built into how we work. We do not share information that could put anyone at risk — including dates, venues, and operational details.'
    }
  }
};
