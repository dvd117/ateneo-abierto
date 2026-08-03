const REVEALED = 'is-revealed';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveals `[data-reveal]` elements as they enter the viewport, staggering
 * siblings via `data-reveal-delay` (in ms). Returns a teardown function —
 * `render()` replaces the whole DOM on locale switch, so the previous
 * observer has to be disconnected the same way the scroll listener is.
 */
export function initReveal(scope: ParentNode = document): () => void {
  const targets = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'));

  if (targets.length === 0) {
    return () => {};
  }

  // Single guard for every scroll-triggered animation on the page: show
  // everything in its final state and never observe.
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    targets.forEach((target) => target.classList.add(REVEALED));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target as HTMLElement;
        const delay = Number(target.dataset.revealDelay ?? 0);
        target.style.transitionDelay = delay > 0 ? `${delay}ms` : '';
        target.classList.add(REVEALED);
        observer.unobserve(target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );

  targets.forEach((target) => observer.observe(target));

  return () => observer.disconnect();
}

/**
 * Drives the reading-progress rail under the sticky header. Ratio is written
 * to a custom property so the paint stays in CSS.
 */
export function initProgressRail(rail: HTMLElement | null): () => void {
  if (!rail) {
    return () => {};
  }

  let frame = 0;

  const update = () => {
    frame = 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    rail.style.setProperty('--progress', String(ratio));
  };

  const onScroll = () => {
    if (frame === 0) {
      frame = window.requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  return () => {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
