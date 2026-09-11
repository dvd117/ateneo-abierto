import { copy, type Door, type FileKind, type PageCopy, type Principle, type Scene, type ShiftColumn } from './content';
import type { Locale } from './locale';
import { MAP_CLAIM, MAP_MAINLAND, MAP_VIEWBOX, project } from './map-shape';

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
  //
  // The description is appended to the visible label rather than replacing it:
  // an accessible name that does not start with the words on the button breaks
  // voice control, which is how someone says "EN" and expects it to be pressed.
  const describe = isActive
    ? ''
    : `<span class="visually-hidden"> · ${page.languageSwitchTo[locale]}</span>`;

  return `<button class="locale-button ${isActive ? 'is-active' : ''}" type="button" data-locale="${locale}" aria-pressed="${isActive}">${label}${describe}</button>`;
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

/**
 * The node network under the call to action. Eight cities, lit one at a time
 * by the lazy runner; without it every node stands lit, which is the honest
 * resting state. Coordinates live in content.ts so the copy owns the map.
 */
function renderNetwork(page: PageCopy): string {
  const { network } = page;
  const nodes = network.cities
    .map(
      (city, index) =>
        `<g class="net-node" data-node="${index}"><circle class="net-halo" cx="${city.x}" cy="${city.y}" r="5"/><circle cx="${city.x}" cy="${city.y}" r="4"/></g>`
    )
    .join('');

  const edges = network.edges
    .map(([from, to]) => {
      const a = network.cities[from];
      const b = network.cities[to];
      return `<line class="net-edge" data-node="${to}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    })
    .join('');

  const labels = network.cities
    .map(
      (city, index) =>
        `<span class="net-city" data-node="${index}">${inline(city.name)}</span>`
    )
    .join('');

  return `
    <div class="net" data-network>
      <p class="net-head">
        <span class="net-label">${inline(network.label)}</span>
        <span class="net-caption" data-net-caption>${inline(network.caption)}</span>
      </p>
      <div class="net-plot">
        <svg class="net-svg" viewBox="0 0 480 110" role="img" aria-label="${inline(network.alt)}">
          ${edges}${nodes}
        </svg>
        ${labels}
      </div>
    </div>
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
      ${renderNetwork(page)}
    </section>
  `;
}

/**
 * "De preguntar a delegar": the same task run twice, side by side, as in the
 * approved mockup — no cards. Two columns split by one rule, each step a row
 * of [actor pill · line · tick], the pills strung on a vertical thread. The
 * agent's rows tick in order as the column enters the viewport, and the count
 * at the foot is the conclusion of something the visitor watched.
 */
function renderShiftColumn(column: ShiftColumn): string {
  const steps = column.steps
    .map((step, order) => {
      const mine = !step.done;
      return `
        <li class="shift-row ${mine ? 'is-mine' : 'shift-run'}" ${step.done ? `data-run="${order}"` : ''}>
          <span class="shift-who">${inline(step.actor)}</span>
          <span class="shift-text">${inline(step.text)}</span>
          <span class="shift-tick" aria-hidden="true"></span>
        </li>
      `;
    })
    .join('');

  return `
    <div class="shift-col shift-col--${column.kind}" ${column.kind === 'agent' ? 'data-shift-run' : ''}>
      <h3 class="shift-col-title">${inline(column.title)}</h3>
      <p class="shift-col-sub">${inline(column.sub)}</p>
      <ol class="shift-rows">${steps}</ol>
      <p class="shift-tally">
        <span class="shift-count">${inline(column.tallyCount)}</span>
        <span class="shift-tally-text">${inline(column.tallyText)}</span>
      </p>
    </div>
  `;
}

function renderShift(page: PageCopy): string {
  const { shift } = page;
  const title = shift.titleLines
    .map((line) => (line.em ? `<em>${inline(line.text)}</em>` : inline(line.text)))
    .join(' ');

  return `
    <section class="shift shell" id="cambio" aria-labelledby="cambio-title">
      <p class="eyebrow">${inline(shift.eyebrow)}</p>
      <h2 class="section-title shift-title" id="cambio-title">${title}</h2>
      <p class="lead shift-lead">${inline(shift.lead)}</p>
      <p class="shift-task">${inline(shift.task)}</p>
      <div class="shift-cmp">
        ${shift.columns.map((column) => renderShiftColumn(column)).join('')}
      </div>
    </section>
  `;
}


/**
 * "Tres puertas": the three ways in, as in the approved mockup — a numbered
 * rail, the promise in the serif, and the line that lets someone recognise
 * themselves before they read the title. Every door leads to the same form,
 * so nobody has to decide which address to write to.
 */
function renderDoor(door: Door, order: number): string {
  return `
    <article class="door" data-reveal data-reveal-delay="${order * 90}">
      <p class="door-n">${inline(door.n)}</p>
      <h3 class="door-title">${inline(door.title)}</h3>
      <p class="door-body">${inline(door.body)}</p>
      <p class="door-who">
        <span class="door-who-label">${inline(door.whoLabel)}</span>
        ${inline(door.who)}
      </p>
      <a class="door-cta link" href="#sumarme">${inline(door.cta)} <span aria-hidden="true">&rarr;</span></a>
    </article>
  `;
}

function renderDoors(page: PageCopy): string {
  const { doors } = page;

  return `
    <section class="doors shell" id="programa" aria-labelledby="programa-title">
      <p class="eyebrow">${inline(doors.eyebrow)}</p>
      <h2 class="section-title doors-title" id="programa-title">${inline(doors.title)}</h2>
      <p class="lead doors-lead">${inline(doors.lead)}</p>
      <div class="door-grid">
        ${doors.doors.map((door, order) => renderDoor(door, order)).join('')}
      </div>
      <p class="doors-extra">
        <b>${inline(doors.workshops.label)}</b> ${inline(doors.workshops.text)}
        <a class="link" href="#sumarme">${inline(doors.workshops.cta)} <span aria-hidden="true">&rarr;</span></a>
      </p>
    </section>
  `;
}


/**
 * The principle icons: one line drawing each, in the same 1.6 px stroke as the
 * mockup. Only the accent-filled parts carry `t-fill`, so ochre stays a signal
 * rather than a decoration.
 */
const PRINCIPLE_ICONS: Record<Principle['icon'], string> = {
  open: `<path d="M23 9.5A10 10 0 1 0 25 15"/><circle class="pr-fill" cx="25" cy="15" r="2.2"/>`,
  agency: `<path d="M3 15h15M13 10l5 5-5 5"/><rect x="21" y="7" width="7" height="16" rx="1"/>`,
  plain: `<path d="M4 8h22M4 15h16M4 22h19"/>`,
  resilient: `<rect class="pr-fill" x="3" y="19" width="4" height="7" rx=".5"/><rect class="pr-fill" x="10" y="14" width="4" height="12" rx=".5"/><rect x="17" y="9" width="4" height="17" rx=".5"/><rect x="24" y="4" width="4" height="22" rx=".5"/>`
};

/**
 * "Cómo trabajamos": the intro holds one column and the four principles run
 * beside it, so the set reads as one row of steps rather than four more cards.
 */
function renderPrinciples(page: PageCopy): string {
  const { principles } = page;

  const items = principles.items
    .map(
      (item, order) => `
        <div class="pr" data-reveal data-reveal-delay="${order * 80}">
          <svg class="pr-icon" viewBox="0 0 30 30" aria-hidden="true" focusable="false">${PRINCIPLE_ICONS[item.icon]}</svg>
          <h3 class="pr-title">${inline(item.title)}</h3>
          <p class="pr-body">${inline(item.body)}</p>
        </div>
      `
    )
    .join('');

  return `
    <section class="principles" id="principios" aria-labelledby="principios-title">
      <div class="shell principles-grid">
        <div class="principles-intro">
          <p class="eyebrow">${inline(principles.eyebrow)}</p>
          <h2 class="principles-title" id="principios-title">${inline(principles.title)}</h2>
          <p class="principles-lead">${inline(principles.lead)}</p>
        </div>
        ${items}
      </div>
    </section>
  `;
}


/**
 * "El norte": the three horizons on the left, the country on the right.
 *
 * The boundary is Natural Earth, vendored into the repo and projected at build
 * time (src/map-shape.ts) — no request, and no hand-drawn coastline. The Zona
 * en Reclamación is its own path, hatched and named, the way maps published in
 * Venezuela draw it; leaving it off would be the first thing a reader here
 * noticed. The nodes are placed from real coordinates, and the caption says
 * plainly that none of them is a site.
 */
function renderMap(page: PageCopy): string {
  const { map } = page.north;
  const { width, height } = MAP_VIEWBOX;
  const points = map.nodes.map((node) => project(node.lon, node.lat));
  void height;

  const edges = map.edges
    .map(([from, to]) => {
      const a = points[from];
      const b = points[to];
      // pathLength normalises every edge to 1, so one dash rule draws them all.
      return `<line class="map-edge" data-node="${to}" pathLength="1" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    })
    .join('');

  const nodes = map.nodes
    .map((node, index) => {
      const { x, y } = points[index];
      const planned = node.planned ? ' is-planned' : '';
      return `<g class="map-node${planned}" data-node="${index}">
        <circle class="map-halo" cx="${x}" cy="${y}" r="7"/>
        <circle class="map-dot" cx="${x}" cy="${y}" r="5"/>
      </g>`;
    })
    .join('');

  const labels = map.nodes
    .map((node, index) => {
      const { x, y } = points[index];
      const planned = node.planned ? ' is-planned' : '';
      return `<span class="map-city${planned}" data-node="${index}">${inline(node.name)}</span>`;
    })
    .join('');

  return `
    <figure class="map" data-map>
      <div class="map-plot">
        <svg class="map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${inline(map.alt)}">
          <defs>
            <pattern id="claim-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line class="map-hatch-line" x1="0" y1="0" x2="0" y2="7"/>
            </pattern>
          </defs>
          <path class="map-claim" d="${MAP_CLAIM}"/>
          <path class="map-land" d="${MAP_MAINLAND}"/>
          ${edges}${nodes}
        </svg>
        ${labels}
        <span class="map-claim-label">${inline(map.claimLabel)}</span>
      </div>
      <figcaption class="map-caption small">${inline(map.caption)}</figcaption>
    </figure>
  `;
}

function renderNorth(page: PageCopy): string {
  const { north } = page;
  const title = north.titleLines
    .map((line) => (line.em ? `<em>${inline(line.text)}</em>` : inline(line.text)))
    .join(' ');

  return `
    <section class="north shell" id="norte" aria-labelledby="norte-title">
      <div class="north-copy">
        <p class="eyebrow">${inline(north.eyebrow)}</p>
        <h2 class="section-title north-title" id="norte-title">${title}</h2>
        <p class="lead north-lead">${inline(north.lead)}</p>
        <ul class="hz">
          ${north.horizons
            .map(
              (horizon) => `
                <li class="hz-row">
                  <span class="hz-label">${inline(horizon.label)}</span>
                  <span class="hz-text">${inline(horizon.text)}</span>
                </li>
              `
            )
            .join('')}
        </ul>
      </div>
      ${renderMap(page)}
    </section>
  `;
}


/**
 * The Ignite Talk. The poster is vendored next to the fonts and the player is
 * not there at all until someone presses play: this is the one embed on the
 * page, and it stays a promise until the visitor accepts it. main.ts owns the
 * iframe, and the CSP in src/app.ts names the one frame origin it may use.
 */
function renderTalk(page: PageCopy): string {
  const { talk } = page;

  return `
    <section class="talk shell" id="charla" aria-labelledby="charla-title">
      <div class="talk-copy">
        <p class="eyebrow">${inline(talk.eyebrow)}</p>
        <h2 class="section-title talk-title" id="charla-title">${inline(talk.title)}</h2>
        <p class="lead talk-body">${inline(talk.body)}</p>
      </div>
      <figure class="talk-figure">
        <div class="talk-frame" data-talk>
          <button class="talk-play" type="button" data-talk-play aria-label="${inline(talk.play)}">
            <picture>
              <source srcset="/ignite-poster.webp" type="image/webp" />
              <img class="talk-poster" src="/ignite-poster.jpg" alt="${inline(talk.posterAlt)}"
                   width="960" height="540" loading="lazy" decoding="async" />
            </picture>
            <span class="talk-play-mark" aria-hidden="true"></span>
          </button>
        </div>
        <figcaption class="talk-meta">
          <span class="talk-label">${inline(talk.label)}</span>
          <span class="talk-name">${inline(talk.talkTitle)}</span>
          <span class="talk-privacy">${inline(talk.privacy)}</span>
        </figcaption>
      </figure>
    </section>
  `;
}


/**
 * The form. Four fields, and every one of them is used: name and email go to
 * MailerLite, the language picks the list, and the checkbox adds the
 * participation group. Nothing here asks what someone does for a living or
 * what they would delegate — that is a conversation, not an intake field.
 *
 * Funders and hosts get one line under the button rather than a second form:
 * there is one way in, and it is this one.
 */
function renderForm(page: PageCopy, locale: Locale): string {
  const { form } = page;

  return `
    <section class="join shell" id="sumarme" aria-labelledby="sumarme-title">
      <p class="eyebrow">${inline(form.eyebrow)}</p>
      <h2 class="section-title join-title" id="sumarme-title">${inline(form.title)}</h2>
      <p class="lead join-lead">${inline(form.lead)}</p>

      <form class="join-form" data-join novalidate>
        <p class="field">
          <label class="field-label" for="join-name">${inline(form.nameLabel)}</label>
          <input class="field-input" id="join-name" name="name" type="text" autocomplete="name"
                 placeholder="${inline(form.namePlaceholder)}" maxlength="100" />
        </p>
        <p class="field">
          <label class="field-label" for="join-email">${inline(form.emailLabel)}</label>
          <input class="field-input" id="join-email" name="email" type="email" autocomplete="email"
                 placeholder="${inline(form.emailPlaceholder)}" maxlength="254" required
                 aria-describedby="join-note" />
        </p>

        <fieldset class="field field--choice">
          <legend class="field-label">${inline(form.newsletterLegend)}</legend>
          <span class="choice-row">
            <label class="choice">
              <input type="radio" name="newsletterLocale" value="es" ${locale === 'es' ? 'checked' : ''} />
              <span>${inline(form.newsletterOptions.es)}</span>
            </label>
            <label class="choice">
              <input type="radio" name="newsletterLocale" value="en" ${locale === 'en' ? 'checked' : ''} />
              <span>${inline(form.newsletterOptions.en)}</span>
            </label>
          </span>
        </fieldset>

        <label class="choice choice--check">
          <input type="checkbox" name="participate" value="yes" />
          <span>${inline(form.participateLabel)}</span>
        </label>

        <!-- Not display:none — a bot reads that as a trap. See .field-supplement. -->
        <label class="field-supplement" aria-hidden="true">
          ${inline(form.supplement)}
          <input name="website" type="text" tabindex="-1" autocomplete="off" />
        </label>

        <div class="join-foot">
          <button class="button button--fill" type="submit" data-join-submit>${inline(form.submit)}</button>
          <small class="join-note" id="join-note">${inline(form.privacy)}</small>
        </div>

        <p class="join-status" role="status" data-join-status></p>
      </form>

      <p class="join-allies">
        ${inline(form.allies)}
        <a class="link" href="mailto:${page.footer.contact}">${page.footer.contact}</a>
      </p>
    </section>
  `;
}

function renderFooter(page: PageCopy, locale: Locale): string {
  return `
    <footer class="site-footer shell">
      <div class="footer-brand">
        <span class="wordmark">Ateneo Abierto</span>
        <!-- The header's links are hidden on a phone and the header does not
             follow the scroll, so on a long page the footer is the only way
             back. Same three destinations, same words. -->
        <nav class="footer-nav" aria-label="${page.sectionsLabel}">
          ${page.nav.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
        </nav>
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


/**
 * The one generated stylesheet on the page: where the two sets of map labels
 * sit, as percentages of their plot.
 *
 * These cannot be `style` attributes. The server's CSP allows inline CSS by
 * sha256 hash and never by 'unsafe-inline', and a hash does not cover a style
 * attribute — so an inline position is simply dropped and every label lands on
 * top of the first one. A <style> block is hashed by the build (see
 * scripts/vite-prerender.ts) and is byte-identical in both locales, because
 * coordinates are not translated, so one hash covers the page either way.
 */
function renderPositions(page: PageCopy): string {
  const rules: string[] = [`.map-plot{aspect-ratio:${MAP_VIEWBOX.width}/${MAP_VIEWBOX.height}}`];

  page.network.cities.forEach((city, index) => {
    const left = ((city.lx / 480) * 100).toFixed(2);
    const top = ((city.ly / 110) * 100).toFixed(2);
    rules.push(`.net-city[data-node="${index}"]{left:${left}%;top:${top}%}`);
  });

  page.north.map.nodes.forEach((node, index) => {
    const { x, y } = project(node.lon, node.lat);
    const left = (((x + (node.dx ?? 0)) / MAP_VIEWBOX.width) * 100).toFixed(2);
    const top = (((y + (node.dy ?? 0)) / MAP_VIEWBOX.height) * 100).toFixed(2);
    rules.push(`.map-city[data-node="${index}"]{left:${left}%;top:${top}%}`);
  });

  return `<style>${rules.join('')}</style>`;
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
    ${renderPositions(page)}
    ${renderHeader(page, locale)}
    <main id="contenido">
      ${renderHero(page)}
      ${renderShift(page)}
      ${renderDoors(page)}
      ${renderPrinciples(page)}
      ${renderNorth(page)}
      ${renderTalk(page)}
      ${renderForm(page, locale)}
    </main>
    ${renderFooter(page, locale)}
  `;
}
