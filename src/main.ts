import { copyFor, DEEP_LINK_ROUTES, HERO_INPUT, type DeepLinkRoute, type HeroInput, type PageCopy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import { DEFAULT_MODE, detectMode, isMode, readSavedMode, saveMode, updateUrlMode, type Mode } from './mode';
import { drawBand, initBands, initProgressRail, initReveal } from './reveal';
import { createSubscribeHandler, mailerliteProvider } from './subscribe';
import { pageMeta, renderPage, renderThread, TALK_VIDEO_ID } from './render';
import type { ScenePlayer } from './scene';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}

const root = app;

/** The hero input variant: the build's HERO_INPUT, unless ?hero= asks for the other one to review it. */
const heroParam = new URLSearchParams(window.location.search).get('hero');
const heroInput: HeroInput = heroParam === 'typed' || heroParam === 'scripted' ? heroParam : HERO_INPUT;

/** Set by the prerender on /hackaton, /talleres and /demo-nights: the door this page opens at. */
const deepLink = DEEP_LINK_ROUTES.find((route) => route === root.dataset.deepLink);

let currentLocale = detectLocale({
  search: window.location.search,
  savedLocale: readSavedLocale(window.localStorage),
  browserLanguages: navigator.languages
});

/**
 * Audience mode. Independent of the door: a deep link says which topic
 * someone came for, not whether they are technical (see detectMode).
 */
let currentMode = detectMode({
  search: window.location.search,
  savedMode: readSavedMode(window.localStorage)
});

function setLocale(locale: Locale): void {
  currentLocale = locale;
  saveLocale(window.localStorage, locale);
  window.history.replaceState(null, '', updateUrlLocale(new URL(window.location.href), locale));
  render();
}

function setMode(mode: Mode): void {
  currentMode = mode;
  saveMode(window.localStorage, mode);
  window.history.replaceState(null, '', updateUrlMode(new URL(window.location.href), mode));
  render();
}

function setMetaContent(selector: string, value: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.content = value;
  }
}

function render(): void {
  const meta = pageMeta(currentLocale, deepLink);

  document.documentElement.lang = meta.lang;
  document.title = meta.title;
  setMetaContent('meta[name="description"]', meta.description);
  setMetaContent('meta[property="og:description"]', meta.description);
  setMetaContent('meta[property="og:locale"]', meta.ogLocale);
  setMetaContent('meta[name="twitter:description"]', meta.description);
  setMetaContent('meta[property="og:title"]', meta.ogTitle);
  setMetaContent('meta[name="twitter:title"]', meta.ogTitle);

  root.innerHTML = renderPage(currentLocale, { heroInput, mode: currentMode });
  root.dataset.locale = currentLocale;
  // Absent rather than "general", to match what the prerender writes.
  if (currentMode === DEFAULT_MODE) {
    delete root.dataset.mode;
  } else {
    root.dataset.mode = currentMode;
  }

  // A locale switch replaces the whole tree; drop the running sequence and the
  // observer watching the old nodes with it.
  scenePlayer?.cancel();
  scenePlayer = undefined;
  agentObserver?.disconnect();
  agentObserver = undefined;
  teardownReveal?.();
  teardownReveal = undefined;
  teardownChrome?.();
  teardownChrome = undefined;
  lightingPlayers.forEach((player) => player.cancel());
  lightingPlayers = [];

  bindEvents(copyFor(currentLocale, currentMode));
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
let agentObserver: IntersectionObserver | undefined;
let sceneModule: Promise<typeof import('./scene')> | undefined;
let lightingPlayers: { cancel: () => void }[] = [];
let lightingModule: Promise<typeof import('./lighting')> | undefined;

function loadSceneRunner(): Promise<typeof import('./scene')> {
  sceneModule ??= import('./scene');
  return sceneModule;
}

/**
 * The network under the call to action and the agent column in section two.
 * Both rest in their finished state, so this only ever adds motion: it is
 * never loaded under reduced motion or saveData, and a failed chunk changes
 * nothing the visitor can see.
 */
function bindLighting(): void {
  if (!motionAllowed()) {
    return;
  }

  const net = root.querySelector<HTMLElement>('[data-network]');
  const column = root.querySelector<HTMLElement>('[data-shift-run]');
  const map = root.querySelector<HTMLElement>('[data-map]');

  if (!net && !column && !map) {
    return;
  }

  lightingModule ??= import('./lighting');

  void lightingModule
    .then(({ playMap, playNetwork, playShiftColumn }) => {
      // A locale switch may have replaced these nodes while the chunk loaded.
      if (net?.isConnected) {
        lightingPlayers.push(playNetwork(net));
      }

      if (column?.isConnected) {
        lightingPlayers.push(playShiftColumn(column));
      }

      if (map?.isConnected) {
        lightingPlayers.push(playMap(map));
      }
    })
    .catch(() => {
      // The finished state is what is already on the page.
    });
}

/**
 * How much of the window has to be on screen before its sequence may start.
 *
 * Where the whole window fits (a desktop), all of it: at 85 % the input box
 * along its bottom edge — where the follow-up types itself — was still below
 * the fold when the run began (David, 2026-09-11). Where it cannot fit (a
 * phone), as much as the viewport can show, or the sequence would never run.
 */
function visibleEnough(element: HTMLElement): number {
  const height = element.getBoundingClientRect().height;

  if (height === 0) {
    return 0.85;
  }

  if (height <= window.innerHeight * 0.95) {
    return 0.98;
  }

  return Math.min(0.85, (window.innerHeight * 0.85) / height);
}

/** Below this much of the window on screen, a running sequence is dropped. */
const GONE = 0.3;

function bindAgent(page: PageCopy): void {
  const thread = root.querySelector<HTMLElement>('[data-thread]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.agent-session[data-scene]'));
  const barTitle = root.querySelector<HTMLElement>('[data-agent-title]');
  const liveStatus = root.querySelector<HTMLElement>('[data-agent-status]');

  if (!thread || tabs.length === 0) {
    return;
  }

  // The prerendered thread arrives held back (data-autoplay) so a visitor who
  // gets motion never sees the finished window flash before it replays. Anyone
  // who will not get the runner is shown the finished window straight away.
  if (!motionAllowed()) {
    thread.removeAttribute('data-autoplay');
  }

  const tabList = root.querySelector<HTMLElement>('.agent-sessions');

  // "Ver por dentro": one class on the window, so it survives switching task
  // (only the thread is re-rendered) and needs nothing from the runner.
  const insideToggle = root.querySelector<HTMLButtonElement>('[data-inside-toggle]');
  insideToggle?.addEventListener('click', () => {
    const on = insideToggle.getAttribute('aria-pressed') !== 'true';
    insideToggle.setAttribute('aria-pressed', String(on));
    root.querySelector('.agent')?.classList.toggle('is-inside', on);
  });

  /**
   * On a phone the session list is one scrolling row; bring the chosen task
   * fully into it. Horizontal only — scrollIntoView would also move the page.
   * On desktop the list does not scroll and this returns at once.
   */
  function revealTab(tab: HTMLElement): void {
    if (!tabList || tabList.scrollWidth <= tabList.clientWidth) {
      return;
    }

    const inset = Number.parseFloat(getComputedStyle(tabList).scrollPaddingInlineStart) || 0;
    // .agent-sessions is positioned, so offsetLeft is measured inside the row.
    const left = tab.offsetLeft - inset;
    const right = left + tab.offsetWidth + inset * 2;
    const visibleLeft = tabList.scrollLeft;
    const visibleRight = visibleLeft + tabList.clientWidth;

    if (left < visibleLeft || right > visibleRight) {
      tabList.scrollTo({ left: Math.max(0, left), behavior: motionAllowed() ? 'smooth' : 'auto' });
    }
  }

  /**
   * Starts the prerendered sequence in place. Nothing is re-rendered, so the
   * opening message the window was waiting on stays exactly where it is.
   */
  function playHeld(): void {
    void loadSceneRunner()
      .then(({ playScene }) => {
        if (!thread || !thread.hasAttribute('data-autoplay')) {
          return;
        }

        scenePlayer = playScene(thread, {
          input: root.querySelector<HTMLElement>('[data-input]'),
          revealed: ['prompt', 'files'],
          onFinish: () => {
            if (liveStatus) {
              liveStatus.textContent = '';
              liveStatus.textContent = page.agent.finished;
            }
          }
        });
        thread.removeAttribute('data-autoplay');
      })
      .catch(() => {
        thread?.removeAttribute('data-autoplay');
      });
  }

  function select(
    id: string,
    { play, focus, afterRender }: { play: boolean; focus?: boolean; afterRender?: (thread: HTMLElement) => void }
  ): void {
    const scene = page.scenes.find((candidate) => candidate.id === id);

    if (!scene || !thread) {
      return;
    }

    scenePlayer?.cancel();
    scenePlayer = undefined;

    thread.innerHTML = renderThread(page, scene);
    afterRender?.(thread);
    thread.scrollTop = 0;
    thread.setAttribute('aria-labelledby', `task-${scene.id}`);

    if (barTitle) {
      barTitle.textContent = scene.session;
    }

    for (const tab of tabs) {
      const isActive = tab.dataset.scene === scene.id;
      tab.classList.toggle('is-on', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      if (isActive) {
        revealTab(tab);
        if (focus) {
          tab.focus({ preventScroll: true });
        }
      }
    }

    if (!play || !motionAllowed()) {
      return;
    }

    void loadSceneRunner().then(({ playScene }) => {
      // A later selection may have landed while the module was loading.
      if (thread.getAttribute('aria-labelledby') !== `task-${scene.id}`) {
        return;
      }

      scenePlayer = playScene(thread, {
        input: root.querySelector<HTMLElement>('[data-input]'),
        onFinish: () => {
          if (liveStatus) {
            liveStatus.textContent = '';
            liveStatus.textContent = page.agent.finished;
          }
        }
      });
      // playScene has already set is-playing, so releasing the hold here
      // cannot expose the finished state for a frame.
      thread.removeAttribute('data-autoplay');
    }).catch(() => {
      // Offline after load, or the chunk failed: show the finished window.
      thread.removeAttribute('data-autoplay');
    });
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const id = tab.dataset.scene;
      if (id) {
        typedTurn = undefined;
        select(id, { play: true });
      }
    });
  }

  // The typed-task prototype: the visitor's own task picks the closest scripted
  // sequence, which then plays with their words as its first message. The text
  // stays in this page; the checkbox only copies it into the join form.
  /** Whether the window's sequence has started since it last came into view. */
  let played = false;

  // The last typed task, so the window coming back into view replays it rather
  // than the scripted prompt; picking a task in the list clears it.
  let typedTurn: { sceneId: string; write: (target: HTMLElement) => void } | undefined;
  const typedForm = root.querySelector<HTMLFormElement>('[data-typed-form]');
  const typedField = typedForm?.querySelector<HTMLInputElement>('[data-typed-field]');
  typedForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = typedField?.value.trim() ?? '';
    if (!typedField || !text) {
      return;
    }

    void import('./typed-task').then(({ matchScene, writeTypedTurn }) => {
      const match = matchScene(text, page.scenes);
      const ack = match.score > 0 ? page.agent.typed.hit : page.agent.typed.miss;

      const sceneId = page.scenes[match.index].id;
      typedTurn = { sceneId, write: (target) => writeTypedTurn(target, text, ack) };
      // Counts as the window's run: the observer must not restart it with the script.
      played = true;
      select(sceneId, { play: true, afterRender: typedTurn.write });

      if (root.querySelector<HTMLInputElement>('[data-carry]')?.checked) {
        const delegate = root.querySelector<HTMLInputElement>('#join-delegate');
        if (delegate) {
          delegate.value = text.slice(0, delegate.maxLength > 0 ? delegate.maxLength : 200);
        }
      }

      typedField.value = '';
    });
  });

  // Tablist keyboard model. The list is vertical on desktop and a row on a
  // phone, so both arrow pairs move; Home/End jump to the ends.
  tabList?.addEventListener('keydown', (event) => {
    const forward = ['ArrowDown', 'ArrowRight'];
    const back = ['ArrowUp', 'ArrowLeft'];
    if (![...forward, ...back, 'Home', 'End'].includes(event.key)) {
      return;
    }

    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : forward.includes(event.key)
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length;

    event.preventDefault();
    const id = tabs[next]?.dataset.scene;
    if (id) {
      typedTurn = undefined;
      select(id, { play: true, focus: true });
    }
  });

  // The window is in the hero, so on a desktop load this fires at once — but it
  // keeps the runner unloaded for anyone who arrives at a deep link further
  // down the page, and it never loads at all under reduced motion or saveData.
  if (!motionAllowed()) {
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    select(page.scenes[0].id, { play: true });
    return;
  }

  const window_ = root.querySelector<HTMLElement>('.agent') ?? thread;

  /**
   * The sequence only starts once the window is properly on screen, and it
   * starts over when it comes back. Start and stop are two different lines:
   * it starts at `start` and is only dropped once the window is mostly gone,
   * so a small scroll after it starts does not restart it. Decided on the
   * ratio, not isIntersecting, whose meaning under a threshold varies.
   */
  const start = visibleEnough(window_);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= start - 0.005) {
          if (!played) {
            played = true;

            if (thread.hasAttribute('data-autoplay')) {
              playHeld();
            } else {
              const current =
                root.querySelector<HTMLElement>('.agent-session[aria-selected="true"]')?.dataset
                  .scene ?? page.scenes[0].id;
              select(current, {
                play: true,
                afterRender: typedTurn?.sceneId === current ? typedTurn.write : undefined
              });
            }
          }

          continue;
        }

        if (entry.intersectionRatio >= GONE) {
          continue;
        }

        // Gone from view: drop whatever was running and arm the next entrance,
        // so nobody comes back to a conversation that started without them.
        played = false;
        scenePlayer?.cancel();
        scenePlayer = undefined;
      }
    },
    { threshold: [0, GONE, start] }
  );

  observer.observe(window_);
  agentObserver = observer;
}

/**
 * The one embed on the page. Nothing reaches YouTube until the visitor presses
 * play; then the poster is replaced by the player, the only origin the CSP's
 * frame-src allows.
 *
 * youtube.com, not youtube-nocookie.com: YouTube puts a "confirm you're not a
 * bot" wall in front of embeds from networks it distrusts (reproduced from
 * Caracas, 2026-09-11), and the no-cookie origin never sees the visitor's
 * sign-in, so signing in could not get them past it. The caption carries a
 * plain link to the video for anyone the wall still stops.
 */
function bindTalk(page: PageCopy): void {
  const frame = root.querySelector<HTMLElement>('[data-talk]');
  const play = root.querySelector<HTMLButtonElement>('[data-talk-play]');

  if (!frame || !play) {
    return;
  }

  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'talk-player';
    iframe.src = `https://www.youtube.com/embed/${TALK_VIDEO_ID}?autoplay=1&rel=0`;
    iframe.title = page.talk.talkTitle;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    frame.replaceChildren(iframe);
    iframe.focus();
  });
}

/**
 * The form. It posts to the site's own endpoint, which talks to MailerLite
 * server-side, so no third party ever sees the page. The button is disabled
 * while a request is in flight and the outcome is announced in the status
 * line, which is a live region.
 */
function bindForm(page: PageCopy): void {
  const form = root.querySelector<HTMLFormElement>('[data-join]');
  const status = root.querySelector<HTMLElement>('[data-join-status]');
  const submit = root.querySelector<HTMLButtonElement>('[data-join-submit]');

  if (!form || !status || !submit) {
    return;
  }

  const subscribe = createSubscribeHandler(mailerliteProvider);
  let sending = false;

  function say(message: string, state: 'sending' | 'ok' | 'error'): void {
    if (!status) {
      return;
    }

    // Clearing first makes a repeated message announce again.
    status.textContent = '';
    status.textContent = message;
    status.dataset.state = state;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (sending) {
      return;
    }

    const data = new FormData(form);

    // The honeypot: a filled one means a bot, and the server says ok anyway.
    // Stopping here saves the round trip.
    if (String(data.get('website') ?? '') !== '') {
      say(page.form.states.ok, 'ok');
      return;
    }

    const newsletterLocale = data.get('newsletterLocale');

    sending = true;
    submit.disabled = true;
    say(page.form.states.sending, 'sending');

    void subscribe({
      email: String(data.get('email') ?? ''),
      name: String(data.get('name') ?? '') || undefined,
      newsletterLocale: newsletterLocale === 'en' ? 'en' : 'es',
      participate: data.get('participate') === 'yes',
      city: String(data.get('city') ?? '').trim() || undefined,
      delegate: String(data.get('delegate') ?? '').trim() || undefined
    })
      .then((result) => {
        if (result.ok) {
          say(page.form.states.ok, 'ok');
          form.reset();
          return;
        }

        say(
          result.reason === 'invalid-email'
            ? page.form.states.invalidEmail
            : page.form.states.error,
          'error'
        );
      })
      .catch(() => {
        say(page.form.states.error, 'error');
      })
      .finally(() => {
        sending = false;
        submit.disabled = false;
      });
  });
}

let teardownReveal: (() => void) | undefined;
let teardownChrome: (() => void) | undefined;

/**
 * The reading rail under the header, and the way back up. The button only
 * shows once the hero has left the screen: at the top there is nowhere to
 * return to. Both are position and opacity only, so they stay under reduced
 * motion — the transition is what reduced motion takes away, in CSS.
 */
function bindChrome(): () => void {
  // The bands' fields are drawn here for everyone: they are the artwork, not
  // motion. Only the sliding below waits for motion to be allowed.
  root.querySelectorAll<SVGGElement>('[data-band-field]').forEach((field) => {
    drawBand(field, Number(field.dataset.seed ?? 0));
  });

  const stopBands = motionAllowed()
    ? initBands(Array.from(root.querySelectorAll<HTMLElement>('[data-band]')))
    : () => {};
  const stopRail = initProgressRail(root.querySelector<HTMLElement>('[data-progress]'));
  const toTop = root.querySelector<HTMLElement>('[data-to-top]');
  const hero = root.querySelector<HTMLElement>('.hero');

  if (!toTop || !hero || typeof IntersectionObserver === 'undefined') {
    toTop?.classList.add('is-shown');
    return () => {
      stopRail();
      stopBands();
    };
  }

  // Hidden over the hero, where there is no top to go back to; over the map,
  // where on a phone it would sit on the Zona en Reclamación; and over the
  // form, where it would sit on a field someone is typing in.
  const covered = ['#norte', '#unete']
    .map((selector) => root.querySelector<HTMLElement>(selector))
    .filter((section): section is HTMLElement => section !== null);
  const covering = new Set<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) covering.add(entry.target);
      else covering.delete(entry.target);
    }
    toTop.classList.toggle('is-shown', covering.size === 0);
  });
  observer.observe(hero);
  covered.forEach((section) => observer.observe(section));

  return () => {
    stopRail();
    stopBands();
    observer.disconnect();
  };
}

/**
 * The three doors' dialogs. Native <dialog>: showModal() traps focus, Escape
 * closes it, and focus returns to the button that opened it. This adds the
 * close button, a click on the backdrop, and the Únete link, which closes the
 * dialog before the page scrolls to the form.
 */
function bindDialogs(): void {
  root.querySelectorAll<HTMLButtonElement>('[data-dialog-open]').forEach((button) => {
    const dialog = root.querySelector<HTMLDialogElement>(`#${button.dataset.dialogOpen}`);

    if (!dialog || typeof dialog.showModal !== 'function') {
      return;
    }

    button.addEventListener('click', () => dialog.showModal());

    dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-dialog-join]')?.addEventListener('click', () => dialog.close());

    // A click that lands on the dialog element itself, outside .dlg, is the backdrop.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
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

  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isMode(button.dataset.mode)) {
        setMode(button.dataset.mode);
      }
    });
  });

  bindAgent(page);
  bindDialogs();
  bindTalk(page);
  bindForm(page);
  bindLighting();
  teardownReveal = initReveal(root, { animate: motionAllowed() });
  teardownChrome = bindChrome();

  // PROTOTYPE, shelved: the tap-to-run terminal. It asks visitors to learn
  // commands the agent is there to run for them, so it does not ship (David,
  // 2026-09-11). Kept for reference: dev server only, and only at ?terminal.
  // The build replaces import.meta.env.DEV with false and drops the module.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('terminal')) {
    const locale = currentLocale;
    void import('./terminal-demo').then(({ mountTerminalDemo }) => {
      mountTerminalDemo(root, locale, motionAllowed());
    });
  }
}

/**
 * A door's own address opens the home page at that door: one jump, no smooth
 * scroll on load, and focus on the door's title so a keyboard or screen-reader
 * user starts there too. Runs once, after the first render; a later locale
 * switch keeps wherever the visitor has got to.
 */
function openAtDoor(container: ParentNode, route: DeepLinkRoute): void {
  const door = container.querySelector<HTMLElement>(`#${route}`);
  const title = door?.querySelector<HTMLElement>('.door-title');

  if (!door || !title) {
    return;
  }

  // Not scrollIntoView: the door is still mid-entrance (translated), and the
  // browser would aim at the moved box and land short once it settles.
  let top = 0;
  for (let node: HTMLElement | null = door; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  // 'instant', not 'auto': html has scroll-behavior: smooth, which 'auto' would inherit.
  window.scrollTo({ top: top - parseFloat(getComputedStyle(door).scrollMarginTop || '0'), behavior: 'instant' });
  title.setAttribute('tabindex', '-1');
  title.focus({ preventScroll: true });
}

// The server already sent this page, rendered, in the locale and mode it chose.
// Keep that DOM and only wire it up — unless this visitor saved the other
// language, or the other mode. The server never sees a saved mode, so a
// returning technical reader is the case that re-renders here.
const servedMode: Mode = isMode(root.dataset.mode) ? root.dataset.mode : DEFAULT_MODE;

if (
  root.dataset.locale === currentLocale &&
  servedMode === currentMode &&
  heroInput === HERO_INPUT &&
  root.childElementCount > 0
) {
  bindEvents(copyFor(currentLocale, currentMode));
} else {
  render();
}

if (deepLink) {
  openAtDoor(root, deepLink);
}
