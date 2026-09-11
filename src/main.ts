import { copy, type PageCopy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
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

/** Escapes everything, then turns the `*emphasis*` convention into <em>. */
export function inline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
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

/**
 * The staircase mark: three ascending steps and a dot. Ochre steps, bone dot,
 * 22 px, beside the wordmark. It appears here and as the favicon, nowhere else.
 */
function renderMark(): string {
  return `
    <svg class="nav-mark" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="mark-steps" d="M14 68 L14 52 L32 52 L32 36 L50 36 L50 20 L66 20" stroke-width="5.5" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>
      <rect class="mark-dot" x="52" y="12" width="8" height="8"/>
    </svg>
  `;
}

function renderLocaleButton(page: PageCopy, locale: Locale, label: string): string {
  const isActive = currentLocale === locale;

  // Only the inactive button describes a switch. Labelling the active one
  // "switch to Spanish" while it is already Spanish misleads screen readers.
  const describe = isActive ? '' : ` aria-label="${page.languageSwitchTo[locale]}"`;

  return `<button class="locale-button ${isActive ? 'is-active' : ''}" type="button" data-locale="${locale}" aria-pressed="${isActive}"${describe}>${label}</button>`;
}

function renderHeader(page: PageCopy): string {
  return `
    <header class="site-header shell">
      <a class="nav-wordmark" href="${localizedPath('/')}">
        ${renderMark()}
        <span class="wordmark">Ateneo Abierto</span>
      </a>
      <nav class="nav-links" aria-label="${page.sectionsLabel}">
        ${page.nav.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
      </nav>
      <div class="locale-toggle" role="group" aria-label="${page.languageLabel}">
        ${renderLocaleButton(page, 'es', 'ES')}
        ${renderLocaleButton(page, 'en', 'EN')}
      </div>
    </header>
  `;
}

function renderHero(page: PageCopy): string {
  const headline = page.hero.titleLines
    .map((line) => (line.em ? `<em>${inline(line.text)}</em>` : inline(line.text)))
    .join('<br />');

  return `
    <section class="hero shell">
      <div class="hero-copy">
        <p class="eyebrow">${page.hero.eyebrow}</p>
        <h1 class="display hero-title">${headline}</h1>
        <p class="lead hero-manifesto">${inline(page.hero.manifesto)}</p>
        <div class="hero-actions">
          <a class="button button--fill" href="#sumarme">${page.hero.primaryCta}</a>
          <a class="button button--line" href="#hablemos">${page.hero.secondaryCta}</a>
        </div>
      </div>
    </section>
  `;
}

function renderFooter(page: PageCopy): string {
  return `
    <footer class="site-footer shell">
      <div class="footer-brand">
        <span class="wordmark">Ateneo Abierto</span>
      </div>
      <div class="footer-security">
        <p class="security-line">${page.footer.securityLine}</p>
        <p>${page.footer.securityBody}</p>
      </div>
      <div class="footer-meta">
        <div class="locale-toggle" role="group" aria-label="${page.languageLabel}">
          ${renderLocaleButton(page, 'es', 'ES')}
          ${renderLocaleButton(page, 'en', 'EN')}
        </div>
        <p>
          <a class="link" href="mailto:${page.footer.contact}">${page.footer.contactLabel}</a>
          <span aria-hidden="true"> · </span>
          <a class="link" href="${page.footer.sourceHref}" rel="noreferrer">${page.footer.sourceLabel}</a>
        </p>
      </div>
    </footer>
  `;
}

function setMetaContent(selector: string, value: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.content = value;
  }
}

function render(): void {
  const page = copy[currentLocale];
  const claim = page.hero.titleLines.map((line) => line.text).join(' ');
  const description = page.hero.manifesto.replace(/\*/g, '');

  document.documentElement.lang = currentLocale;
  document.title = `Ateneo Abierto | ${claim}`;

  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:locale"]', currentLocale === 'es' ? 'es_VE' : 'en_US');
  setMetaContent('meta[name="twitter:description"]', description);

  root.innerHTML = `
    <a class="skip-link" href="#contenido">${page.skipToContent}</a>
    ${renderHeader(page)}
    <main id="contenido">
      ${renderHero(page)}
    </main>
    ${renderFooter(page)}
  `;

  bindEvents();
}

function bindEvents(): void {
  root.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      const locale = button.dataset.locale;

      if (locale === 'es' || locale === 'en') {
        setLocale(locale);
      }
    });
  });
}

render();
