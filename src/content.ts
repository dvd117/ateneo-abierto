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
    room: string[];
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
  workingTable: {
    label: string;
    title: string;
    body: string;
  };
  pillars: {
    title: string;
    items: Pillar[];
  };
  not: {
    title: string;
    items: string[];
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
      participate: 'Participar'
    },
    languageLabel: 'Idioma',
    hero: {
      eyebrow: 'Espacio abierto de aprendizaje cívico',
      title: 'Ateneo Abierto',
      promise: 'Habilidades y herramientas que nadie te puede quitar.',
      body:
        'Una iniciativa venezolana para recuperar agencia práctica a través de aprendizaje, herramientas y acceso compartido.',
      primaryCta: 'Suscribirme',
      secondaryCta: 'Leer manifiesto',
      room: ['Espacio', 'Recursos', 'Oportunidad']
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
      title: 'No estamos esperando a que el sistema educativo se arregle.',
      teaser:
        'Lo que se nos arrebató se reconstruye desde afuera del sistema que lo destruyó. Eso es lo que estamos haciendo.',
      body:
        'Hubo un tiempo en que Venezuela entendió que su recurso más valioso no era el petróleo, sino su gente. Esa apuesta fue desmontada deliberadamente: los profesores se fueron, las escuelas se vaciaron, el aprendizaje se volvió un lujo, y una generación entera se quedó con menos opciones. No por falta de capacidad. Por falta de acceso.\n\nLo que se nos arrebató se reconstruye desde afuera del sistema que lo destruyó. Eso es lo que estamos haciendo.',
      cta: 'Leer manifiesto completo',
      subscribeCta: 'Si quieres seguir el proceso, deja tu correo.',
      backCta: 'Volver al inicio'
    },
    audience: {
      title: 'Para venezolanos que están dispuestos a aprender otra vez.',
      body:
        'Para venezolanos —dentro y fuera del país— que entienden que la educación que recibimos no nos preparó para esto, y que están dispuestos a aprender otra vez. Profesores, profesionales, estudiantes, gente que trabaja dos turnos para llegar a fin de mes. No hace falta perfil técnico. Sólo curiosidad y ganas de empezar.'
    },
    name: {
      title: 'Por qué Ateneo Abierto',
      body:
        'Ateneo —del griego athḗnaion, el templo dedicado a Atenea— es el nombre clásico de un espacio dedicado al aprendizaje cívico. No nombra a una institución en particular, ni al Ateneo de Caracas; nombra una forma: un lugar donde la gente se reúne a aprender, fuera del aparato del Estado.\n\nAbierto porque la condición de entrada no es el linaje, ni el cargo, ni la afiliación política. Es la disposición a empezar.'
    },
    workingTable: {
      label: 'Mesa de trabajo',
      title: 'Aprender con las manos sobre la mesa.',
      body:
        'En la práctica: grupos pequeños, ejercicios concretos y herramientas que cada persona pueda conservar. Lo suficiente para empezar, probar y volver a usar fuera del taller.'
    },
    pillars: {
      title: 'Tres pilares',
      items: [
        {
          title: 'Talleres prácticos de IA y herramientas digitales',
          body:
            'Grupos pequeños, hands-on. Aprender a usar inteligencia artificial, herramientas financieras prácticas y otras tecnologías que están cambiando, en lo concreto, lo que significa libertad. Ejecutable ya.'
        },
        {
          title: 'Alianzas universitarias',
          body:
            'Trabajar con las instituciones que siguen funcionando —dentro de Venezuela y en el exilio— para amplificar lo que ya están haciendo. Mediano plazo.'
        },
        {
          title: 'Red de bibliotecas públicas del siglo XXI',
          body:
            'El norte estratégico: espacios físicos donde el acceso a internet, herramientas y aprendizaje sea un derecho público, no un privilegio individual. Post-transición.'
        }
      ]
    },
    not: {
      title: 'Lo que no somos',
      items: [
        '<strong>No somos un programa del Estado venezolano</strong>, ni una iniciativa vinculada a ninguno de sus ministerios, planes o programas de extensión cultural.',
        '<strong>No somos un proyecto de "cambio de régimen" patrocinado desde afuera.</strong> Trabajamos para venezolanos, con financiamiento independiente, y la decisión sobre el futuro político del país no nos corresponde.',
        '<strong>No reclutamos a nadie</strong> para actividad pública confrontativa dentro de Venezuela. Lo que enseñamos son habilidades y herramientas; lo que cada quien hace con ellas es suyo.'
      ]
    },
    subscribe: {
      title: 'Recibe actualizaciones',
      body:
        'Estamos preparando los primeros pilotos, materiales y alianzas. Déjanos tu correo si quieres seguir el proceso o encontrar una forma concreta de ayudar.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      button: 'Suscribirme',
      privacy:
        'Todavía no estamos recibiendo fondos. Si quieres apoyar más adelante, te avisaremos cuando haya una vía clara y segura.',
      success: 'Listo. Te avisaremos cuando haya novedades.',
      invalidEmail: 'Escribe un correo válido para suscribirte.',
      providerError: 'No pudimos registrar tu correo. Intenta de nuevo en unos minutos.'
    },
    footer: {
      contact: 'hola@ateneo-abierto.org',
      disclaimer:
        'No publicamos fechas, sedes, participantes ni detalles operativos de sesiones en Venezuela sin que sea seguro hacerlo.'
    }
  },
  en: {
    nav: {
      manifesto: 'Manifesto',
      participate: 'Participate'
    },
    languageLabel: 'Language',
    hero: {
      eyebrow: 'Open civic learning space',
      title: 'Ateneo Abierto',
      promise: 'Skills and tools no government can take away.',
      body:
        'A Venezuelan civic learning initiative helping people rebuild practical agency through learning, tools, and shared access.',
      primaryCta: 'Subscribe',
      secondaryCta: 'Read manifesto',
      room: ['Space', 'Resources', 'Opportunity']
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
      title: 'We are not waiting for the education system to fix itself.',
      teaser:
        "What was taken is being rebuilt outside the system that destroyed it. That's what we're doing.",
      body:
        "There was a time when Venezuela understood that its most valuable resource wasn't oil — it was its people. That bet was deliberately taken apart: teachers left, schools emptied out, learning became a luxury, and a whole generation was left with fewer options. Not for lack of capacity. For lack of access.\n\nWhat was taken is being rebuilt outside the system that destroyed it. That's what we're doing.",
      cta: 'Read full manifesto',
      subscribeCta: 'If you want to follow the process, leave your email.',
      backCta: 'Back to home'
    },
    audience: {
      title: 'For Venezuelans who are willing to learn again.',
      body:
        "Venezuelans — inside and outside the country — who understand that the education we received didn't prepare us for this, and who are willing to learn again. Teachers, professionals, students, people working two shifts to make rent. No technical background required. Just curiosity and willingness to begin."
    },
    name: {
      title: 'Why “Ateneo Abierto”',
      body:
        'Ateneo — or athenaeum, from the Greek athḗnaion, the temple dedicated to Athena — is the classical name for a space devoted to civic learning. It does not name a particular institution, and it is not named after Ateneo de Caracas; it names a form: a place where people gather to learn, outside the apparatus of the state.\n\nAbierto — open — because the entry condition is not lineage, not credential, not political affiliation. It is willingness to begin.'
    },
    workingTable: {
      label: 'Working Table',
      title: 'Learning with hands on the table.',
      body:
        'In practice: small groups, concrete exercises, and tools they can keep. Enough to begin, test, and use again beyond the workshop.'
    },
    pillars: {
      title: 'Three pillars',
      items: [
        {
          title: 'Hands-on workshops in AI and digital tools',
          body:
            'Small groups, practical. Learning to use AI, practical financial tools, and other technologies quietly changing what freedom looks like in practice. Executable now.'
        },
        {
          title: 'University alliances',
          body:
            'Working with the institutions still functioning — inside Venezuela and in exile — to amplify what they\'re already doing. Mid-term.'
        },
        {
          title: 'A network of 21st-century public libraries',
          body:
            'The north star: physical spaces where access to internet, tools, and learning is a public right, not an individual privilege. Post-transition.'
        }
      ]
    },
    not: {
      title: 'What we are not',
      items: [
        '<strong>Not a Venezuelan state program</strong>, and not tied to any ministry, plan, or cultural-extension initiative of the state.',
        '<strong>Not a foreign-funded regime-change project.</strong> We work for Venezuelans, with independent funding, and we are not in the business of deciding the country\'s political future.',
        '<strong>Not recruiting anyone</strong> into confrontational public-facing activity inside Venezuela. What we teach are skills and tools; what each person does with them is theirs.'
      ]
    },
    subscribe: {
      title: 'Get updates',
      body:
        'We are preparing the first pilots, materials, and partnerships. Leave your email if you want to follow the process or find a concrete way to help.',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.org',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      button: 'Subscribe',
      privacy:
        'We are not accepting funds yet. If you want to support later, we will share a clear and safe path when it exists.',
      success: "You're in. We'll send updates when there is something concrete to share.",
      invalidEmail: 'Enter a valid email address to subscribe.',
      providerError: 'We could not save your email. Please try again in a few minutes.'
    },
    footer: {
      contact: 'hola@ateneo-abierto.org',
      disclaimer:
        'We do not publish dates, venues, participants, or operational details for Venezuela-based sessions unless it is safe to do so.'
    }
  }
};
