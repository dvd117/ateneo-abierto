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
    structure: string;
    boundaries: string;
    updates: string;
  };
  manifesto: {
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
      room: ['Mismo espacio.', 'Mismos recursos.', 'Misma oportunidad.']
    },
    labels: {
      manifesto: 'Manifiesto',
      structure: 'Estructura',
      boundaries: 'Límites',
      updates: 'Actualizaciones'
    },
    manifesto: {
      title: 'No estamos esperando a que el sistema educativo se arregle.',
      body:
        'Estamos construyendo, en paralelo, lo que la gente necesita ahora: espacios para aprender, herramientas para actuar y comunidades donde nadie tenga que empezar solo.'
    },
    pillars: {
      title: 'Tres pilares',
      items: [
        {
          title: 'Talleres prácticos',
          body:
            'Grupos pequeños, hands-on, para aprender IA, herramientas digitales y capacidades útiles frente a problemas reales.'
        },
        {
          title: 'Alianzas universitarias',
          body:
            'Trabajar con instituciones que siguen funcionando, dentro y fuera de Venezuela, para ampliar lo que ya existe.'
        },
        {
          title: 'Bibliotecas públicas del siglo XXI',
          body:
            'El norte estratégico: espacios donde internet, herramientas y aprendizaje sean un derecho público, no un privilegio individual.'
        }
      ]
    },
    not: {
      title: 'Lo que no somos',
      items: [
        'No somos un programa del Estado venezolano.',
        'No somos un partido político ni una campaña electoral.',
        'No somos un proyecto de criptomonedas.',
        'No reclutamos a nadie para actividad pública confrontativa dentro de Venezuela.'
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
      room: ['Same room.', 'Same resources.', 'Same shot.']
    },
    labels: {
      manifesto: 'Manifesto',
      structure: 'Structure',
      boundaries: 'Boundaries',
      updates: 'Updates'
    },
    manifesto: {
      title: 'We are not waiting for the education system to fix itself.',
      body:
        'We are building, in parallel, what people need now: spaces to learn, tools to act, and communities where no one has to begin alone.'
    },
    pillars: {
      title: 'Three pillars',
      items: [
        {
          title: 'Hands-on workshops',
          body: 'Small groups learning AI, digital tools, and practical capabilities for real constraints.'
        },
        {
          title: 'University alliances',
          body:
            'Working with institutions that are still functioning, inside Venezuela and in exile, to amplify what already exists.'
        },
        {
          title: '21st-century public libraries',
          body:
            'The north star: spaces where internet, tools, and learning are a public right, not an individual privilege.'
        }
      ]
    },
    not: {
      title: 'What we are not',
      items: [
        'We are not a Venezuelan state program.',
        'We are not a political party or electoral campaign.',
        'We are not a cryptocurrency project.',
        'We do not recruit anyone into confrontational public activity inside Venezuela.'
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
