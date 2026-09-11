/**
 * The two scroll-triggered sequences outside the agent window: the city
 * network under the call to action, and the agent column in "De preguntar a
 * delegar". Both are lazy-loaded and both are skipped entirely under reduced
 * motion or saveData — the resting markup is already the finished state, so
 * nothing is lost by never running them.
 *
 * Neither touches content: they add and remove classes, nothing else.
 */

export type Player = { cancel: () => void };

type StepOptions = {
  /** Milliseconds between steps. */
  period?: number;
  /** Replays each time the element re-enters the viewport. */
  threshold?: number;
};

/**
 * Runs `step(k)` for k = 0…count while the element is in view, and resets to
 * `step(-1)` when it leaves, so scrolling back replays it.
 */
function onScreen(
  target: HTMLElement,
  count: number,
  step: (k: number) => void,
  { period = 900, threshold = 0.4 }: StepOptions = {}
): Player {
  let timer = 0;
  let k = -1;

  const clear = () => {
    if (timer !== 0) {
      window.clearTimeout(timer);
      timer = 0;
    }
  };

  const tick = () => {
    step(k);
    if (k < count) {
      k += 1;
      timer = window.setTimeout(tick, period);
    }
  };

  if (typeof IntersectionObserver === 'undefined') {
    step(count);
    return { cancel: clear };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        clear();
        k = 0;

        if (entry.isIntersecting) {
          tick();
        } else {
          step(-1);
        }
      }
    },
    { threshold }
  );

  observer.observe(target);

  return {
    cancel: () => {
      clear();
      observer.disconnect();
    }
  };
}

/**
 * Lights the network one city at a time and names the lit one in the caption.
 * The caption never says a city has joined: none of these is a confirmed site.
 */
export function playNetwork(net: HTMLElement): Player {
  const nodes = Array.from(net.querySelectorAll<SVGElement>('[data-node]'));
  const caption = net.querySelector<HTMLElement>('[data-net-caption]');
  const resting = caption?.textContent ?? '';
  const cities = Array.from(net.querySelectorAll<HTMLElement>('.net-city'));
  const count = cities.length;

  net.classList.add('is-lighting');

  return onScreen(
    net,
    count,
    (k) => {
      for (const node of nodes) {
        const index = Number(node.dataset.node);
        node.classList.toggle('is-lit', k >= 0 && index <= k - 1);
        node.classList.toggle('is-now', k >= 1 && index === k - 1);
      }

      if (!caption) {
        return;
      }

      const city = k >= 1 ? cities[k - 1] : undefined;
      if (city) {
        caption.textContent = '';
        const lit = document.createElement('span');
        lit.className = 'net-lit';
        lit.textContent = city.textContent ?? '';
        caption.append(lit);
      } else {
        caption.textContent = resting;
      }
    },
    { period: 1000 }
  );
}

/** Ticks the agent column's own steps in order, one spinner at a time. */
export function playShiftColumn(column: HTMLElement): Player {
  const rows = Array.from(column.querySelectorAll<HTMLElement>('[data-run]'));

  column.classList.add('is-running');

  return onScreen(column, rows.length, (k) => {
    let active = false;

    rows.forEach((row, index) => {
      const done = k >= 0 && index < k;
      row.classList.toggle('is-done', done);
      row.classList.toggle('is-active', !done && !active && k >= 0);

      if (!done) {
        active = true;
      }
    });
  });
}
