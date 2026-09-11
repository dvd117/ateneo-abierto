import { copy, type PageCopy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import { initBands, initProgressRail, initReveal } from './reveal';
import { createSubscribeHandler, mailerliteProvider } from './subscribe';
import { pageMeta, renderPage, renderThread, TALK_VIDEO_ID } from './render';
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

function setLocale(locale: Locale): void {
  currentLocale = locale;
  saveLocale(window.localStorage, locale);
  window.history.replaceState(null, '', updateUrlLocale(new URL(window.location.href), locale));
  render();
}

function setMetaContent(selector: string, value: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.content = value;
  }
}

function render(): void {
  const meta = pageMeta(currentLocale);

  document.documentElement.lang = meta.lang;
  document.title = meta.title;
  setMetaContent('meta[name="description"]', meta.description);
  setMetaContent('meta[property="og:description"]', meta.description);
  setMetaContent('meta[property="og:locale"]', meta.ogLocale);
  setMetaContent('meta[name="twitter:description"]', meta.description);
  setMetaContent('meta[property="og:title"]', meta.ogTitle);
  setMetaContent('meta[name="twitter:title"]', meta.ogTitle);

  root.innerHTML = renderPage(currentLocale);
  root.dataset.locale = currentLocale;

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

  bindEvents(copy[currentLocale]);
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
 * Most of it, so the later beats do not land off screen — but never more than
 * a short viewport can show, or on a small phone the sequence would never run.
 */
function visibleEnough(element: HTMLElement): number {
  const height = element.getBoundingClientRect().height;

  if (height === 0) {
    return 0.85;
  }

  return Math.min(0.85, (window.innerHeight * 0.85) / height);
}

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

  function select(id: string, { play, focus }: { play: boolean; focus?: boolean }): void {
    const scene = page.scenes.find((candidate) => candidate.id === id);

    if (!scene || !thread) {
      return;
    }

    scenePlayer?.cancel();
    scenePlayer = undefined;

    thread.innerHTML = renderThread(page, scene);
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
        select(id, { play: true });
      }
    });
  }

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
  let played = false;

  /**
   * The sequence only starts once the window is properly on screen, and it
   * starts over when it comes back. On a phone the thread is taller than half
   * the viewport, so a bare threshold fires while a sliver of the window is
   * peeking and the opening beats play off screen; shrinking the root from the
   * bottom means "in view" is measured against the part of the screen someone
   * is actually reading.
   */
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!played) {
            played = true;

            if (thread.hasAttribute('data-autoplay')) {
              playHeld();
            } else {
              const current =
                root.querySelector<HTMLElement>('.agent-session[aria-selected="true"]')?.dataset
                  .scene ?? page.scenes[0].id;
              select(current, { play: true });
            }
          }

          continue;
        }

        // Gone from view: drop whatever was running and arm the next entrance,
        // so nobody comes back to a conversation that started without them.
        played = false;
        scenePlayer?.cancel();
        scenePlayer = undefined;
      }
    },
    { threshold: visibleEnough(window_) }
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
      participate: data.get('participate') === 'yes'
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

  const observer = new IntersectionObserver(([entry]) => {
    toTop.classList.toggle('is-shown', !entry.isIntersecting);
  });
  observer.observe(hero);

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

  bindAgent(page);
  bindDialogs();
  bindTalk(page);
  bindForm(page);
  bindLighting();
  teardownReveal = initReveal(root, { animate: motionAllowed() });
  teardownChrome = bindChrome();
}

// The server already sent this page, rendered, in the locale it chose. Keep that
// DOM and only wire it up — unless this visitor saved the other language.
if (root.dataset.locale === currentLocale && root.childElementCount > 0) {
  bindEvents(copy[currentLocale]);
} else {
  render();
}
