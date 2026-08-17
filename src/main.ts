import { copy, type PageCopy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import { createSubscribeHandler, mailerliteProvider } from './subscribe';
import { initProgressRail, initReveal } from './reveal';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}

const root = app;
let removeBackToTopScrollListener: (() => void) | undefined;
let teardownReveal: (() => void) | undefined;
let teardownProgressRail: (() => void) | undefined;

let currentLocale = detectLocale({
  search: window.location.search,
  savedLocale: readSavedLocale(window.localStorage),
  browserLanguages: navigator.languages
});

const subscribe = createSubscribeHandler(mailerliteProvider);

function renderParagraphs(body: string): string {
  return body
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');
}

function localizedPath(path: string, hash = ''): string {
  return `${path}?lang=${currentLocale}${hash}`;
}

function setLocale(locale: Locale): void {
  currentLocale = locale;
  saveLocale(window.localStorage, locale);
  window.history.replaceState(null, '', updateUrlLocale(new URL(window.location.href), locale));
  render();
}

function renderHeader(page: PageCopy): string {
  return `
    <header class="site-header">
      <a class="nav-wordmark" href="${localizedPath('/')}" aria-label="Ateneo Abierto">
        <svg class="nav-mark" width="22" height="22" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20" stroke="#b55234" stroke-width="5.5" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>
          <rect x="52" y="12" width="8" height="8" fill="#235e4f"/>
        </svg>
        Ateneo Abierto
      </a>
      <div class="locale-toggle" role="group" aria-label="${page.languageLabel}">
        ${renderLocaleButton(page, 'es', 'ES')}
        ${renderLocaleButton(page, 'en', 'EN')}
      </div>
      <div class="progress-rail" aria-hidden="true"></div>
    </header>
  `;
}

function renderLocaleButton(page: PageCopy, locale: Locale, label: string): string {
  const isActive = currentLocale === locale;

  // Only the inactive button describes a switch. Labelling the active one
  // "switch to Spanish" while it is already Spanish misleads screen readers.
  const describe = isActive ? '' : ` aria-label="${page.languageSwitchTo[locale]}"`;

  return `<button class="locale-button ${isActive ? 'is-active' : ''}" type="button" data-locale="${locale}" aria-pressed="${isActive}"${describe}>${label}</button>`;
}

function renderFooter(page: PageCopy): string {
  return `
    <footer class="site-footer">
      <a href="mailto:${page.footer.contact}">${page.footer.contact}</a>
      <p>${page.footer.disclaimer}</p>
    </footer>
  `;
}

function renderHome(page: PageCopy): string {
  return `
    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-brand">${page.hero.title}</p>
          <p class="eyebrow">${page.hero.eyebrow}</p>
          <h1>${page.hero.promise}</h1>
          <p class="intro">${page.hero.body}</p>
          <div class="hero-actions">
            <a class="button" href="#subscribe">${page.hero.primaryCta}</a>
          </div>
        </div>
        <div class="open-room" aria-hidden="true">
          <svg class="open-room-mark" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path class="open-room-path" d="M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20" stroke="#f3eddf" stroke-width="5.5" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>
            <rect class="open-room-dot" x="52" y="12" width="8" height="8" fill="#d39b35"/>
          </svg>
        </div>
        <a class="hero-cue" href="#origin" aria-label="${page.labels.origin}">
          <span class="hero-cue-line" aria-hidden="true"></span>
        </a>
      </section>

      <section id="origin" class="section origin-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.origin}</p>
          <h2 data-reveal>${page.origin.title}</h2>
        </div>
        <ol class="origin-steps">
          ${page.origin.beats
            .map(
              (beat, index) => `
                <li class="origin-step" data-reveal data-reveal-delay="${index * 90}">
                  <span class="origin-step-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
                  <h3 class="origin-step-heading">${beat.heading}</h3>
                  <p>${beat.body}</p>
                </li>
              `
            )
            .join('')}
        </ol>
        <p class="origin-closing" data-reveal>${page.origin.closing}</p>
      </section>

      <section class="section audience-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.audience}</p>
          <h2 data-reveal>${page.audience.title}</h2>
          <p>${page.audience.body}</p>
          <ul class="audience-chips">
            ${page.audience.who
              .map(
                (who, index) =>
                  `<li class="audience-chip" data-reveal data-reveal-delay="${index * 70}">${who}</li>`
              )
              .join('')}
          </ul>
        </div>
      </section>

      <section class="section name-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.name}</p>
          <h2 data-reveal>${page.name.title}</h2>
          ${renderParagraphs(page.name.body)}
        </div>
      </section>

      <section class="section pillars-section">
        <div class="section-heading">
          <p class="eyebrow">${page.labels.structure}</p>
          <h2 data-reveal>${page.pillars.title}</h2>
        </div>
        <div class="pillars">
          ${page.pillars.items
            .map(
              (pillar, index) => `
                <article class="pillar" data-step="${index + 1}" data-reveal data-reveal-delay="${index * 110}">
                  <p class="pillar-horizon">${pillar.horizon}</p>
                  <h3>${pillar.title}</h3>
                  <p>${pillar.body}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section not-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.boundaries}</p>
          <h2 data-reveal>${page.not.title}</h2>
          <ul class="not-list">
            ${page.not.points
              .map(
                (point, index) =>
                  `<li data-reveal data-reveal-delay="${index * 80}">${point}</li>`
              )
              .join('')}
          </ul>
          <p class="not-closing">${page.not.body}</p>
        </div>
      </section>

      <section id="subscribe" class="section subscribe-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.updates}</p>
          <h2 data-reveal>${page.subscribe.title}</h2>
          <p>${page.subscribe.body}</p>
        </div>
        <form class="subscribe-form" novalidate>
          <input class="field-supplement" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <label>
            <span>${page.subscribe.nameLabel}</span>
            <input name="name" autocomplete="name" placeholder="${page.subscribe.namePlaceholder}" />
          </label>
          <label>
            <span>${page.subscribe.emailLabel}</span>
            <input name="email" type="email" autocomplete="email" placeholder="${page.subscribe.emailPlaceholder}" required />
          </label>
          <fieldset class="newsletter-language">
            <legend>${page.subscribe.newsletterLanguageLabel}</legend>
            <label>
              <input name="newsletterLocale" type="radio" value="es" ${currentLocale === 'es' ? 'checked' : ''} />
              <span>Español</span>
            </label>
            <label>
              <input name="newsletterLocale" type="radio" value="en" ${currentLocale === 'en' ? 'checked' : ''} />
              <span>English</span>
            </label>
          </fieldset>
          <label class="participate-checkbox">
            <input name="participate" type="checkbox" value="yes" />
            <span>${page.subscribe.participateLabel}</span>
          </label>
          <p class="form-message" role="status" aria-live="polite" tabindex="-1"></p>
          <button class="button" type="submit">${page.subscribe.button}</button>
          <p class="privacy-note">${page.subscribe.privacy}</p>
        </form>
      </section>
    </main>
  `;
}

function renderBackToTop(page: PageCopy): string {
  return `<button class="back-to-top" aria-label="${page.labels.backToTop}" type="button"><span aria-hidden="true">↑</span></button>`;
}

function setMetaContent(selector: string, value: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.content = value;
  }
}

function render(): void {
  const page = copy[currentLocale];
  document.documentElement.lang = currentLocale;
  document.title = `Ateneo Abierto | ${page.hero.promise}`;

  // hero.body, not hero.promise: the promise is already the tail of the title,
  // and a description that repeats the title gets discarded by search engines.
  setMetaContent('meta[name="description"]', page.hero.body);
  setMetaContent('meta[property="og:description"]', page.hero.body);
  setMetaContent('meta[property="og:locale"]', currentLocale === 'es' ? 'es_VE' : 'en_US');
  setMetaContent('meta[name="twitter:description"]', page.hero.body);

  root.innerHTML = `
    ${renderHeader(page)}
    ${renderHome(page)}
    ${renderFooter(page)}
    ${renderBackToTop(page)}
  `;

  bindEvents();
}

function bindEvents(): void {
  // render() replaces the whole tree, so the observers from the previous
  // render point at detached nodes and have to be torn down first.
  teardownReveal?.();
  teardownReveal = initReveal(root);

  teardownProgressRail?.();
  teardownProgressRail = initProgressRail(root.querySelector<HTMLElement>('.progress-rail'));

  document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      const locale = button.dataset.locale;

      if (locale === 'es' || locale === 'en') {
        setLocale(locale);
      }
    });
  });

  removeBackToTopScrollListener?.();
  const backToTop = document.querySelector<HTMLButtonElement>('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      backToTop.classList.toggle('is-visible', scrollable > 50 && window.scrollY > Math.min(300, scrollable * 0.3));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    removeBackToTopScrollListener = () => window.removeEventListener('scroll', onScroll);
    onScroll();
  }

  const form = document.querySelector<HTMLFormElement>('.subscribe-form');
  const message = document.querySelector<HTMLParagraphElement>('.form-message');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!message) {
      return;
    }

    const page = copy[currentLocale];
    const data = new FormData(form);
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    button?.setAttribute('disabled', 'true');
    message.textContent = '';
    message.className = 'form-message';
    message.setAttribute('role', 'status');

    const result = await subscribe({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      newsletterLocale: data.get('newsletterLocale') === 'en' ? 'en' : 'es',
      participate: data.get('participate') === 'yes'
    });

    button?.removeAttribute('disabled');

    if (result.ok) {
      form.reset();
      message.textContent = page.subscribe.success;
      message.classList.add('is-success');
      message.focus();
      return;
    }

    message.textContent =
      result.reason === 'invalid-email' ? page.subscribe.invalidEmail : page.subscribe.providerError;
    message.classList.add('is-error');
    // A polite status after the button leaves keyboard and screen-reader users
    // with no signal that the submit failed. Announce it and move to it.
    message.setAttribute('role', 'alert');
    message.focus();
  });
}

render();
