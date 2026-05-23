import { copy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import { createSubscribeHandler, mailerliteProvider } from './subscribe';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}

const root = app;

let currentLocale = detectLocale({
  search: window.location.search,
  savedLocale: readSavedLocale(window.localStorage),
  browserLanguages: navigator.languages
});

const subscribe = createSubscribeHandler(mailerliteProvider);

function setLocale(locale: Locale): void {
  currentLocale = locale;
  saveLocale(window.localStorage, locale);
  window.history.replaceState(null, '', updateUrlLocale(new URL(window.location.href), locale));
  render();
}

function render(): void {
  const page = copy[currentLocale];
  document.documentElement.lang = currentLocale;
  document.title = `Ateneo Abierto | ${page.hero.promise}`;

  root.innerHTML = `
    <header class="site-header">
      <a class="nav-wordmark" href="#top" aria-label="Ateneo Abierto">Ateneo Abierto</a>
      <nav class="nav-links" aria-label="Primary">
        <a href="#manifesto">${page.nav.manifesto}</a>
        <a href="#subscribe">${page.nav.participate}</a>
      </nav>
      <div class="locale-toggle" aria-label="${page.languageLabel}">
        <button class="locale-button ${currentLocale === 'es' ? 'is-active' : ''}" type="button" data-locale="es">ES</button>
        <button class="locale-button ${currentLocale === 'en' ? 'is-active' : ''}" type="button" data-locale="en">EN</button>
      </div>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">${page.hero.eyebrow}</p>
          <h1>${page.hero.title.replace(' ', '<br />')}</h1>
          <p class="promise">${page.hero.promise}</p>
          <p class="intro">${page.hero.body}</p>
          <div class="hero-actions">
            <a class="button" href="#subscribe">${page.hero.primaryCta}</a>
            <a class="text-link" href="#manifesto">${page.hero.secondaryCta}</a>
          </div>
        </div>
        <div class="open-room" aria-label="${page.hero.room.join(' ')}">
          <p>${page.hero.room.join('<br />')}</p>
        </div>
      </section>

      <section id="manifesto" class="section manifesto-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.manifesto}</p>
          <h2>${page.manifesto.title}</h2>
          <p>${page.manifesto.body.replace('\n\n', '</p><p>')}</p>
        </div>
      </section>

      <section class="section audience-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.audience}</p>
          <h2>${page.audience.title}</h2>
          <p>${page.audience.body}</p>
        </div>
      </section>

      <section class="section pillars-section">
        <div class="section-heading">
          <p class="eyebrow">${page.labels.structure}</p>
          <h2>${page.pillars.title}</h2>
        </div>
        <div class="pillars">
          ${page.pillars.items
            .map(
              (pillar) => `
                <article class="pillar">
                  <h3>${pillar.title}</h3>
                  <p>${pillar.body}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section not-section">
        <div class="section-heading">
          <p class="eyebrow">${page.labels.boundaries}</p>
          <h2>${page.not.title}</h2>
        </div>
        <ul class="not-list">
          ${page.not.items.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </section>

      <section id="subscribe" class="section subscribe-section">
        <div class="section-copy">
          <p class="eyebrow">${page.labels.updates}</p>
          <h2>${page.subscribe.title}</h2>
          <p>${page.subscribe.body}</p>
        </div>
        <form class="subscribe-form" novalidate>
          <input name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none;position:absolute;left:-9999px" />
          <label>
            <span>${page.subscribe.nameLabel}</span>
            <input name="name" autocomplete="name" placeholder="${page.subscribe.namePlaceholder}" />
          </label>
          <label>
            <span>${page.subscribe.emailLabel}</span>
            <input name="email" type="email" autocomplete="email" placeholder="${page.subscribe.emailPlaceholder}" required />
          </label>
          <button class="button" type="submit">${page.subscribe.button}</button>
          <p class="form-message" role="status"></p>
          <p class="privacy-note">${page.subscribe.privacy}</p>
        </form>
      </section>
    </main>

    <footer class="site-footer">
      <a href="mailto:${page.footer.contact}">${page.footer.contact}</a>
      <p>${page.footer.disclaimer}</p>
    </footer>
  `;

  bindEvents();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      const locale = button.dataset.locale;

      if (locale === 'es' || locale === 'en') {
        setLocale(locale);
      }
    });
  });

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

    const result = await subscribe({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? '')
    });

    button?.removeAttribute('disabled');

    if (result.ok) {
      form.reset();
      message.textContent = page.subscribe.success;
      message.classList.add('is-success');
      return;
    }

    message.textContent =
      result.reason === 'invalid-email' ? page.subscribe.invalidEmail : page.subscribe.providerError;
    message.classList.add('is-error');
  });
}

render();
