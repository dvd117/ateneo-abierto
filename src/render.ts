import { copy, type PageCopy, type Scene } from './content';
import type { Locale } from './locale';

/**
 * Pure rendering: content in, HTML string out. No DOM, no window, no state.
 *
 * Two callers use it. The build (scripts/vite-prerender.ts) runs it once per
 * locale and writes the finished page into index.html and index.en.html, so the
 * first response already carries the text. The browser (main.ts) runs it again
 * only when it has to: a locale switch, or a saved locale that differs from the
 * one the server sent.
 */

/** A page with a folded corner, drawn — an empty box reads as a missing glyph. */
const FILE_ICON = `<svg class="agent-file-icon" viewBox="0 0 10 12" aria-hidden="true" focusable="false"><path d="M1.5 0.75h4.5l2.5 2.5v8h-7z M6 0.75v2.5h2.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>`;

/** Escapes everything, then turns the `*emphasis*` convention into <em>. */
export function inline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
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

function renderLocaleButton(page: PageCopy, current: Locale, locale: Locale, label: string): string {
  const isActive = current === locale;

  // Only the inactive button describes a switch. Labelling the active one
  // "switch to Spanish" while it is already Spanish misleads screen readers.
  const describe = isActive ? '' : ` aria-label="${page.languageSwitchTo[locale]}"`;

  return `<button class="locale-button ${isActive ? 'is-active' : ''}" type="button" data-locale="${locale}" aria-pressed="${isActive}"${describe}>${label}</button>`;
}

function renderHeader(page: PageCopy, locale: Locale): string {
  return `
    <header class="site-header shell">
      <a class="nav-wordmark" href="/?lang=${locale}">
        ${renderMark()}
        <span class="wordmark">Ateneo Abierto</span>
      </a>
      <nav class="nav-links" aria-label="${page.sectionsLabel}">
        ${page.nav.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
      </nav>
      <div class="locale-toggle" role="group" aria-label="${page.languageLabel}">
        ${renderLocaleButton(page, locale, 'es', 'ES')}
        ${renderLocaleButton(page, locale, 'en', 'EN')}
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
export function renderThread(page: PageCopy, scene: Scene): string {
  return `
    <p class="agent-msg" data-beat="prompt">${inline(scene.prompt)}</p>
    <ul class="agent-files" data-beat="files">
      ${scene.files
        .map(
          (file) =>
            `<li class="agent-file">${FILE_ICON}${inline(file)}</li>`
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

  // The session list is the window's one control, as in the real tools: pick a
  // task on the left, watch it run on the right. On a phone the same list
  // becomes one scrollable row above the conversation.
  return `
    <figure class="agent-figure">
      <div class="agent">
        <div class="agent-bar">
          <span class="agent-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="agent-bar-title" data-agent-title>${inline(first.session)}</span>
        </div>
        <div class="agent-cols">
          <div class="agent-side">
            <p class="agent-new" aria-hidden="true">+ ${inline(page.agent.newTask)}</p>
            <p class="agent-sh" aria-hidden="true">${inline(page.agent.today)}</p>
            <div class="agent-sessions" role="tablist" aria-label="${page.agent.sessionsLabel}">
              ${page.scenes
                .map((scene, index) => {
                  const selected = index === 0;
                  return `<button class="agent-session ${selected ? 'is-on' : ''}" type="button" role="tab"
                    id="task-${scene.id}" data-scene="${scene.id}"
                    aria-controls="agent-thread" aria-selected="${selected}"
                    tabindex="${selected ? '0' : '-1'}">${inline(scene.session)}</button>`;
                })
                .join('')}
            </div>
            <p class="agent-foot" aria-hidden="true">${inline(page.agent.folder)}</p>
          </div>
          <div class="agent-main">
            <div class="agent-thread" id="agent-thread" role="tabpanel" tabindex="0"
                 aria-labelledby="task-${first.id}" data-thread data-autoplay>
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
        </div>
      </div>
      ${renderAgentWindow(page)}
    </section>
  `;
}

function renderFooter(page: PageCopy, locale: Locale): string {
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
          ${renderLocaleButton(page, locale, 'es', 'ES')}
          ${renderLocaleButton(page, locale, 'en', 'EN')}
        </div>
        <p>
          ${page.footer.contactLabel}:
          <a class="link" href="mailto:${page.footer.contact}">${page.footer.contact}</a>
        </p>
      </div>
    </footer>
  `;
}

export type PageMeta = {
  lang: Locale;
  title: string;
  description: string;
  ogLocale: string;
  ogLocaleAlternate: string;
  canonical: string;
};

export function pageMeta(locale: Locale): PageMeta {
  const page = copy[locale];
  const claim = page.hero.titleLines.map((line) => line.text).join(' ');

  return {
    lang: locale,
    title: `Ateneo Abierto | ${claim}`,
    description: page.hero.manifesto.replace(/\*/g, ''),
    ogLocale: locale === 'es' ? 'es_VE' : 'en_US',
    ogLocaleAlternate: locale === 'es' ? 'en_US' : 'es_VE',
    canonical: locale === 'es' ? 'https://ateneo-abierto.org/' : 'https://ateneo-abierto.org/?lang=en'
  };
}

/** Everything inside #app, for one locale. */
export function renderPage(locale: Locale): string {
  const page = copy[locale];

  return `
    <a class="skip-link" href="#contenido">${page.skipToContent}</a>
    ${renderHeader(page, locale)}
    <main id="contenido">
      ${renderHero(page)}
    </main>
    ${renderFooter(page, locale)}
  `;
}
