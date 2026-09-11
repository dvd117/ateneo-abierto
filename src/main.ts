import { copy, type PageCopy, type Scene } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import type { ScenePlayer } from './scene';
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

/** The produced document, on paper. The only light in the room. */
function renderDoc(scene: Scene): string {
  const { doc } = scene;

  const table = doc.table
    ? `
      <table class="doc-table">
        <thead>
          <tr>${doc.table.head.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${doc.table.rows
            .map(
              (row) => `
                <tr class="${row.rec ? 'is-rec' : ''}">
                  ${row.cells
                    .map((cell, index) =>
                      index === 0
                        ? `<th scope="row">${inline(cell)}</th>`
                        : `<td class="${row.accentCell === index ? 'is-accent' : ''}">${inline(cell)}</td>`
                    )
                    .join('')}
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '';

  const list = doc.list
    ? `
      ${doc.list.lead ? `<p class="doc-lead">${inline(doc.list.lead)}</p>` : ''}
      <ol class="doc-list">
        ${doc.list.items.map((item) => `<li>${inline(item)}</li>`).join('')}
      </ol>
    `
    : '';

  return `
    <article class="doc">
      <p class="doc-kicker">${inline(doc.kicker)}</p>
      <p class="doc-title">${inline(doc.title)}</p>
      ${table}${list}
      <p class="doc-note">${inline(doc.note)}</p>
    </article>
  `;
}

/**
 * One sequence, rendered in its finished state. The scene runner reveals these
 * beats in order when motion is allowed; when it is not, this is what stands.
 */
function renderThread(page: PageCopy, scene: Scene): string {
  return `
    <p class="agent-msg" data-beat="prompt">${inline(scene.prompt)}</p>
    <ul class="agent-files" data-beat="files">
      ${scene.files
        .map(
          (file) =>
            `<li class="agent-file"><span class="agent-file-icon" aria-hidden="true"></span>${inline(file)}</li>`
        )
        .join('')}
    </ul>
    <p class="agent-ack" data-beat="ack">${inline(scene.ack)}</p>
    <ol class="agent-plan" data-beat="plan">
      ${scene.steps
        .map(
          (step) =>
            `<li class="agent-step is-done" data-step><span class="agent-tick" aria-hidden="true"></span>${inline(step)}</li>`
        )
        .join('')}
    </ol>
    <div class="agent-doc" data-beat="doc">${renderDoc(scene)}</div>
    <p class="agent-status" data-beat="status">
      <span class="agent-status-dot" aria-hidden="true"></span>${inline(page.agent.ready)} ·
      <span class="agent-status-file">${inline(scene.savedAs)}</span>
    </p>
  `;
}

function renderAgentWindow(page: PageCopy): string {
  const [first] = page.scenes;

  return `
    <figure class="agent-figure">
      <div class="agent">
        <div class="agent-bar">
          <span class="agent-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="agent-bar-title" data-agent-title>${inline(first.session)}</span>
        </div>
        <div class="agent-cols">
          <aside class="agent-side" aria-hidden="true">
            <p class="agent-new">+ ${inline(page.agent.newTask)}</p>
            <p class="agent-sh">${inline(page.agent.today)}</p>
            <ul class="agent-sessions">
              ${page.scenes
                .map(
                  (scene) =>
                    `<li class="agent-session ${scene.id === first.id ? 'is-on' : ''}" data-session="${scene.id}">${inline(scene.session)}</li>`
                )
                .join('')}
            </ul>
            <p class="agent-foot">${inline(page.agent.folder)}</p>
          </aside>
          <div class="agent-main">
            <div class="agent-chips" role="tablist" aria-label="${page.agent.chipsLabel}">
              ${page.scenes
                .map((scene, index) => {
                  const selected = index === 0;
                  return `<button class="chip ${selected ? 'is-on' : ''}" type="button" role="tab"
                    id="chip-${scene.id}" data-scene="${scene.id}"
                    aria-controls="agent-thread" aria-selected="${selected}"
                    tabindex="${selected ? '0' : '-1'}">${inline(scene.chip)}</button>`;
                })
                .join('')}
            </div>
            <div class="agent-thread" id="agent-thread" role="tabpanel" tabindex="0"
                 aria-labelledby="chip-${first.id}" data-thread>
              ${renderThread(page, first)}
            </div>
            <p class="agent-input" aria-hidden="true">
              <span>${inline(page.agent.inputPlaceholder)}</span>
              <span class="agent-send">↑</span>
            </p>
          </div>
        </div>
      </div>
      <p class="visually-hidden" role="status" data-agent-status></p>
      <figcaption class="agent-caption small">${inline(page.hero.windowCaption)}</figcaption>
    </figure>
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
      ${renderAgentWindow(page)}
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

  // A locale switch replaces the whole tree; drop the running sequence with it.
  scenePlayer?.cancel();
  scenePlayer = undefined;

  bindEvents(page);
}

/**
 * Motion is functional here, but it is still motion and still bytes. Skip both
 * for anyone who asked for less of either.
 */
function motionAllowed(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData !== true;
}

let scenePlayer: ScenePlayer | undefined;
let sceneModule: Promise<typeof import('./scene')> | undefined;

function loadSceneRunner(): Promise<typeof import('./scene')> {
  sceneModule ??= import('./scene');
  return sceneModule;
}

function bindAgent(page: PageCopy): void {
  const thread = root.querySelector<HTMLElement>('[data-thread]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.chip[data-scene]'));
  const barTitle = root.querySelector<HTMLElement>('[data-agent-title]');
  const liveStatus = root.querySelector<HTMLElement>('[data-agent-status]');
  const sessions = Array.from(root.querySelectorAll<HTMLElement>('[data-session]'));

  if (!thread || chips.length === 0) {
    return;
  }

  const chipRow = root.querySelector<HTMLElement>('.agent-chips');

  /**
   * On a phone the chips are one scrolling row; bring the chosen one fully
   * into it. Horizontal only — scrollIntoView would also move the page.
   */
  function revealChip(chip: HTMLElement): void {
    if (!chipRow || chipRow.scrollWidth <= chipRow.clientWidth) {
      return;
    }

    const inset = Number.parseFloat(getComputedStyle(chipRow).scrollPaddingInlineStart) || 0;
    // .agent-chips is positioned, so offsetLeft is measured inside the row.
    const left = chip.offsetLeft - inset;
    const right = left + chip.offsetWidth + inset * 2;
    const visibleLeft = chipRow.scrollLeft;
    const visibleRight = visibleLeft + chipRow.clientWidth;

    if (left < visibleLeft || right > visibleRight) {
      chipRow.scrollTo({ left: Math.max(0, left), behavior: motionAllowed() ? 'smooth' : 'auto' });
    }
  }

  function select(id: string, { play, focus }: { play: boolean; focus?: boolean }): void {
    const scene = page.scenes.find((candidate) => candidate.id === id);

    if (!scene || !thread) {
      return;
    }

    scenePlayer?.cancel();
    scenePlayer = undefined;

    thread.innerHTML = renderThread(page, scene);
    thread.scrollTop = 0;
    thread.setAttribute('aria-labelledby', `chip-${scene.id}`);

    if (barTitle) {
      barTitle.textContent = scene.session;
    }

    for (const session of sessions) {
      session.classList.toggle('is-on', session.dataset.session === scene.id);
    }

    for (const chip of chips) {
      const isActive = chip.dataset.scene === scene.id;
      chip.classList.toggle('is-on', isActive);
      chip.setAttribute('aria-selected', String(isActive));
      chip.tabIndex = isActive ? 0 : -1;

      if (isActive) {
        revealChip(chip);
        if (focus) {
          chip.focus({ preventScroll: true });
        }
      }
    }

    if (!play || !motionAllowed()) {
      return;
    }

    void loadSceneRunner().then(({ playScene }) => {
      // A later selection may have landed while the module was loading.
      if (thread.getAttribute('aria-labelledby') !== `chip-${scene.id}`) {
        return;
      }

      scenePlayer = playScene(thread, {
        onFinish: () => {
          if (liveStatus) {
            liveStatus.textContent = '';
            liveStatus.textContent = page.agent.finished;
          }
        }
      });
    });
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const id = chip.dataset.scene;
      if (id) {
        select(id, { play: true });
      }
    });
  }

  // Tablist keyboard model: arrows move and select, Home/End jump to the ends.
  chipRow?.addEventListener('keydown', (event) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }

    const current = chips.findIndex((chip) => chip.getAttribute('aria-selected') === 'true');
    const last = chips.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight'
            ? (current + 1) % chips.length
            : (current - 1 + chips.length) % chips.length;

    event.preventDefault();
    const id = chips[next]?.dataset.scene;
    if (id) {
      select(id, { play: true, focus: true });
    }
  });

  // The window is in the hero, so this fires at once on a normal load — but it
  // keeps the runner unloaded for anyone who arrives at a deep link further
  // down the page, and it never loads at all under reduced motion or saveData.
  if (!motionAllowed()) {
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    select(page.scenes[0].id, { play: true });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          select(page.scenes[0].id, { play: true });
        }
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(thread);
}

function bindEvents(page: PageCopy): void {
  root.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      const locale = button.dataset.locale;

      if (locale === 'es' || locale === 'en') {
        setLocale(locale);
      }
    });
  });

  bindAgent(page);
}

render();
