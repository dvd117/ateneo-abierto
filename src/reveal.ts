const REVEALED = 'is-revealed';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveals `[data-reveal]` elements as they enter the viewport, staggering
 * siblings via `data-reveal-delay` (in ms). Pass `animate: false` to skip the
 * observer entirely — the caller does that under `saveData`, the same way it
 * declines to load the scene runner. Returns a teardown function —
 * `render()` replaces the whole DOM on locale switch, so the previous
 * observer has to be disconnected the same way the scroll listener is.
 */
export function initReveal(
  scope: ParentNode = document,
  options: { animate?: boolean } = {}
): () => void {
  const targets = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'));

  if (targets.length === 0) {
    return () => {};
  }

  // Single guard for every scroll-triggered animation on the page: show
  // everything in its final state and never observe.
  if (options.animate === false || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
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

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 0..1, one smooth wave: the stripe proportions drift, they never jump. */
function wave(t: number, frequency: number, phase: number): number {
  return 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * frequency + phase));
}

/**
 * Draws a band's field after Cruz-Diez's additive-colour method: columns of
 * stripes at one pitch, and inside each column the widths of ochre, dark
 * ochre and bone drift continuously along the band, so the colour mixed in
 * the eye changes gradually from one end to the other — one field, not a row
 * of blocks. `seed` shifts the waves so no two bands match. Our composition,
 * never the Maiquetía floor (see render.ts).
 */
export function drawBand(field: SVGGElement, seed: number): void {
  const pitch = 6;
  const room = 5.2;
  const fragment = document.createDocumentFragment();

  for (let x = -60; x < 1260; x += pitch) {
    const t = (x + 60) / 1320;
    let ochre = 0.6 + 2.6 * wave(t, 1.3, seed * 0.17);
    let dark = 0.3 + 1.9 * wave(t, 0.8, seed * 0.23 + 0.25);
    let bone = 0.15 + 1.5 * wave(t, 2.1, seed * 0.31 + 0.6) ** 2;
    const total = ochre + dark + bone;
    // Never so full the column closes, never so empty the field goes dark.
    const fit = Math.min(room, Math.max(3.4, total)) / total;
    ochre *= fit;
    dark *= fit;
    bone *= fit;

    let at = x;
    for (const [colour, width] of [['o', ochre], ['d', dark], ['b', bone]] as const) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', `bz-${colour}`);
      rect.setAttribute('x', at.toFixed(2));
      rect.setAttribute('width', width.toFixed(2));
      rect.setAttribute('height', '100');
      fragment.append(rect);
      at += width;
    }
  }

  field.replaceChildren(fragment);
}

/** How far a phone may lean, in degrees, before the bands stop following it. */
export const TILT_RANGE = 30;

/**
 * Left-right tilt (DeviceOrientationEvent.gamma) as band travel: ±30° maps
 * linearly onto ±`travel`, and anything past that holds at the edge.
 */
export function tiltShift(gamma: number | null, travel: number): number {
  if (gamma === null || !Number.isFinite(gamma)) {
    return 0;
  }

  const clamped = Math.max(-TILT_RANGE, Math.min(TILT_RANGE, gamma));
  return (clamped / TILT_RANGE) * travel;
}

/**
 * How far the reader has come down the page: the reading rail's own ratio
 * (initProgressRail), 0 at the top and 1 at the foot, where the form is. The
 * bands read it as they cross the screen: about 0.1 at band one, 0.5 at band
 * two and 0.9 at band three, at phone and desktop widths alike.
 */
export function bandMix(scrollY: number, scrollable: number): number {
  if (scrollable <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, scrollY / scrollable));
}

/** The same gate the page uses for all motion: reduced motion or saveData stop it. */
export function motionAllowed(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData !== true;
}

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * The bands as instruments. Each one's two layers move in opposite directions
 * as it crosses the screen — the diagonal screen one way, the field the
 * other — so the moiré between them travels and says where the band is. On a
 * phone that reports its orientation, left-right tilt is added on top of that
 * scroll position, so the bands also move with the hand; everywhere else the
 * ochre stripes turn towards done-green as the reader approaches the form
 * (--band-mix, the reading rail's ratio: 0 at the top, 1 at the foot).
 *
 * The motion eases towards its target instead of jumping with it: a wheel
 * notch moves the screen by several of its own pitches, and without easing
 * the eye reads that as a flicker between two states (David, 2026-09-11).
 *
 * Nothing here runs under reduced motion or saveData — no scroll listener, no
 * orientation listener, no permission prompt — and the bands stand still in
 * their resting colours. The caller gates this too; the gate here is the one
 * the tests hold.
 */
export function initBands(
  bands: HTMLElement[],
  options: { travel?: number } = {}
): () => void {
  if (bands.length === 0 || !motionAllowed()) {
    return () => {};
  }

  const travel = options.travel ?? 90;
  const current = new Map<HTMLElement, number>();
  const target = new Map<HTMLElement, number>();
  // Each band is some 660 shapes; only the ones on screen are repainted.
  const onScreen = new Set<HTMLElement>();
  let frame = 0;
  let tilt = 0;
  let tilting = false;

  const measure = () => {
    const height = window.innerHeight;
    const mix = bandMix(window.scrollY, document.documentElement.scrollHeight - height);
    onScreen.clear();
    for (const band of bands) {
      const rect = band.getBoundingClientRect();
      if (rect.bottom < -height * 0.25 || rect.top > height * 1.25) {
        continue;
      }
      onScreen.add(band);
      // -0.5 as the band enters at the bottom, +0.5 as it leaves at the top.
      const position = Math.max(-0.75, Math.min(0.75, 0.5 - (rect.top + rect.height / 2) / height));
      target.set(band, position * travel + tilt);
      if (!tilting) {
        band.style.setProperty('--band-mix', mix.toFixed(3));
      }
    }
  };

  const step = () => {
    frame = 0;
    let moving = false;

    for (const band of onScreen) {
      const goal = target.get(band) ?? 0;
      const now = current.get(band) ?? goal;
      const next = now + (goal - now) * 0.12;
      const settled = Math.abs(goal - next) < 0.02;
      const value = settled ? goal : next;

      current.set(band, value);
      band.style.setProperty('--band-shift', value.toFixed(2));
      moving ||= !settled;
    }

    if (moving) {
      frame = window.requestAnimationFrame(step);
    }
  };

  const onScroll = () => {
    measure();
    if (frame === 0) {
      frame = window.requestAnimationFrame(step);
    }
  };

  const onOrientation = (event: DeviceOrientationEvent) => {
    // Desktops define the event and may fire it once with nulls: that is not a tilt.
    if (event.gamma === null) {
      return;
    }

    if (!tilting) {
      tilting = true;
      // Tilt replaces the colour drift: the bands keep their resting ochre.
      for (const band of bands) {
        band.dataset.tilt = '';
        band.style.removeProperty('--band-mix');
      }
    }

    tilt = tiltShift(event.gamma, travel);
    onScroll();
  };

  let listening = false;
  const listen = () => {
    if (!listening) {
      listening = true;
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }
  };

  const Orientation = (window as Window & { DeviceOrientationEvent?: OrientationEventWithPermission })
    .DeviceOrientationEvent;
  let askOnTouch: (() => void) | undefined;

  if (Orientation) {
    if (typeof Orientation.requestPermission === 'function') {
      // iOS asks, and only in answer to a gesture: once, on the first tap that
      // ends on a band — never on load. Denied or failed, the bands stay on scroll.
      const request = Orientation.requestPermission.bind(Orientation);
      askOnTouch = () => {
        bands.forEach((band) => band.removeEventListener('touchend', askOnTouch!));
        askOnTouch = undefined;
        request()
          .then((state) => {
            if (state === 'granted') listen();
          })
          .catch(() => {});
      };
      bands.forEach((band) => band.addEventListener('touchend', askOnTouch!, { passive: true }));
    } else {
      listen();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  return () => {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (listening) {
      window.removeEventListener('deviceorientation', onOrientation);
    }
    if (askOnTouch) {
      bands.forEach((band) => band.removeEventListener('touchend', askOnTouch!));
    }
  };
}
