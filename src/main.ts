import { copy, type PageCopy } from './content';
import { detectLocale, readSavedLocale, saveLocale, updateUrlLocale, type Locale } from './locale';
import { pageMeta, renderPage, renderThread } from './render';
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

  root.innerHTML = renderPage(currentLocale);
  root.dataset.locale = currentLocale;

  // A locale switch replaces the whole tree; drop the running sequence with it.
  scenePlayer?.cancel();
  scenePlayer = undefined;

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
let sceneModule: Promise<typeof import('./scene')> | undefined;

function loadSceneRunner(): Promise<typeof import('./scene')> {
  sceneModule ??= import('./scene');
  return sceneModule;
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

// The server already sent this page, rendered, in the locale it chose. Keep that
// DOM and only wire it up — unless this visitor saved the other language.
if (root.dataset.locale === currentLocale && root.childElementCount > 0) {
  bindEvents(copy[currentLocale]);
} else {
  render();
}
