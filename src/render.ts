import { copy, type FileKind, type PageCopy, type Scene } from './content';
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

/**
 * Thumbnails for the delivered file, drawn in the paper tokens: the file card
 * is the produced document in its final format, so paper is allowed here. One
 * shape per format, recognisable at 40 px — a sheet, a slide, a printed page,
 * a letter — without repeating the full preview from the first round.
 */
const THUMBS: Record<FileKind, string> = {
  xlsx: `<svg class="file-thumb" viewBox="0 0 26 33" aria-hidden="true" focusable="false">
    <rect class="t-paper" x="0.5" y="0.5" width="25" height="32" rx="2"/>
    <rect class="t-ink" x="4" y="6" width="18" height="3" rx="0.5"/>
    <path class="t-rule" d="M4 12h18M4 17h18M4 22h18M4 27h18M10.5 12v15M16.5 12v15"/>
    <rect class="t-accent" x="17" y="12.5" width="5" height="4"/>
  </svg>`,
  pptx: `<svg class="file-thumb file-thumb--wide" viewBox="0 0 36 26" aria-hidden="true" focusable="false">
    <rect class="t-paper" x="0.5" y="0.5" width="35" height="25" rx="2"/>
    <rect class="t-ink" x="4" y="5" width="17" height="3" rx="0.5"/>
    <circle class="t-accent" cx="5.5" cy="13" r="1.2"/><rect class="t-soft" x="8.5" y="12" width="20" height="2" rx="0.5"/>
    <circle class="t-accent" cx="5.5" cy="17" r="1.2"/><rect class="t-soft" x="8.5" y="16" width="16" height="2" rx="0.5"/>
    <circle class="t-accent" cx="5.5" cy="21" r="1.2"/><rect class="t-soft" x="8.5" y="20" width="18" height="2" rx="0.5"/>
  </svg>`,
  pdf: `<svg class="file-thumb" viewBox="0 0 26 33" aria-hidden="true" focusable="false">
    <path class="t-paper" d="M2.5 0.5h15l8 8v22a2 2 0 0 1-2 2h-21a2 2 0 0 1-2-2v-28a2 2 0 0 1 2-2z"/>
    <path class="t-soft" d="M17.5 0.5v8h8z"/>
    <rect class="t-ink" x="4" y="6" width="11" height="3" rx="0.5"/>
    <rect class="t-soft" x="4" y="13" width="18" height="1.6" rx="0.5"/>
    <rect class="t-soft" x="4" y="17" width="16" height="1.6" rx="0.5"/>
    <rect class="t-soft" x="4" y="21" width="18" height="1.6" rx="0.5"/>
    <rect class="t-soft" x="4" y="25" width="11" height="1.6" rx="0.5"/>
  </svg>`,
  docx: `<svg class="file-thumb" viewBox="0 0 26 33" aria-hidden="true" focusable="false">
    <rect class="t-paper" x="0.5" y="0.5" width="25" height="32" rx="2"/>
    <rect class="t-ink" x="4" y="5" width="9" height="2.4" rx="0.5"/>
    <rect class="t-soft" x="4" y="11" width="18" height="1.6" rx="0.5"/>
    <rect class="t-soft" x="4" y="15" width="18" height="1.6" rx="0.5"/>
    <rect class="t-soft" x="4" y="19" width="13" height="1.6" rx="0.5"/>
    <path class="t-sign" d="M14 27.5c1.5-2 2.5-2 3 0s1.5 2 3-0.5 2-1 2.5 0.5"/>
  </svg>`
};

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
    ${renderPlan(scene.steps, 'plan')}
    <div class="agent-doc" data-beat="doc">${renderDoc(scene)}</div>
    ${renderStatus(page, scene.savedAs, 'status')}

    <p class="agent-msg" data-beat="followup">${inline(scene.followUp.prompt)}</p>
    <p class="agent-ack" data-beat="ack2">${inline(scene.followUp.ack)}</p>
    ${renderPlan(scene.followUp.steps, 'plan2')}
    <div class="agent-deliverable" data-beat="file">
      <div class="file-card">
        ${THUMBS[scene.followUp.file.kind]}
        <span class="file-body">
          <span class="file-name">${inline(scene.followUp.file.name)}</span>
          <span class="file-meta">${inline(scene.followUp.file.detail)}</span>
        </span>
        <span class="file-kind" aria-hidden="true">${scene.followUp.file.kind.toUpperCase()}</span>
      </div>
    </div>
    ${renderStatus(page, scene.followUp.file.name, 'status2')}
  `;
}

function renderPlan(steps: readonly string[], beat: string): string {
  return `
    <ol class="agent-plan" data-beat="${beat}">
      ${steps
        .map(
          (step) =>
            `<li class="agent-step is-done" data-step><span class="agent-tick" aria-hidden="true"></span>${inline(step)}</li>`
        )
        .join('')}
    </ol>
  `;
}

function renderStatus(page: PageCopy, fileName: string, beat: string): string {
  return `
    <p class="agent-status" data-beat="${beat}">
      <span class="agent-status-dot" aria-hidden="true"></span>${inline(page.agent.ready)} ·
      <span class="agent-status-file">${inline(fileName)}</span>
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
            <p class="agent-input" aria-hidden="true" data-input>
              <span class="agent-input-text" data-input-text>${inline(page.agent.inputPlaceholder)}</span>
              <span class="agent-send" data-send>↑</span>
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
