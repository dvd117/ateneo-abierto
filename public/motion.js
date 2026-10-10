(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection;

  function isMainBundle(script) {
    if (!(script instanceof HTMLScriptElement) || script.type !== 'module') {
      return false;
    }

    const url = new URL(script.src, window.location.href);
    return url.origin === window.location.origin && /^\/assets\/index-[^/]+\.js$/.test(url.pathname);
  }

  function showPrerender() {
    if (root.classList.contains('motion-ready')) {
      return;
    }

    root.classList.remove('motion-ok');
    document.querySelectorAll('[data-thread]').forEach((thread) => {
      thread.removeAttribute('data-autoplay');
      thread.classList.remove('is-playing');
      thread.querySelectorAll('[data-beat].is-in').forEach((beat) => beat.classList.remove('is-in'));
      thread.querySelectorAll('.agent-step.is-running').forEach((step) => step.classList.remove('is-running'));
    });
  }

  function handleError(event) {
    if (event.target instanceof HTMLScriptElement) {
      if (!isMainBundle(event.target)) {
        return;
      }
    } else if (!(event instanceof ErrorEvent)) {
      return;
    }

    showPrerender();
  }

  window.addEventListener('error', handleError, true);
  window.addEventListener('unhandledrejection', showPrerender, true);
  window.addEventListener('load', () => {
    const mainBundle = Array.from(document.scripts).some(isMainBundle);
    if (mainBundle) {
      showPrerender();
    }
  }, { once: true });

  if (!reducedMotion && connection?.saveData !== true) {
    root.classList.add('motion-ok');
  }
})();
