import { afterEach, describe, expect, test, vi } from 'vitest';
import { playMap } from './lighting';

type FakeGroup = {
  classes: Set<string>;
  dataset: { node: string };
  classList: { add: (name: string) => void; toggle: (name: string, force?: boolean) => void };
};

function group(node: number): FakeGroup {
  const classes = new Set<string>();
  return {
    classes,
    dataset: { node: String(node) },
    classList: {
      add: (name) => classes.add(name),
      toggle: (name, force) => {
        if (force ?? !classes.has(name)) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      }
    }
  };
}

function mapFixture() {
  const lit = [group(0), group(1)];
  const edges = [group(1), group(1)];
  const cities = [group(0), group(1)];
  const classes = new Set<string>();
  const map = {
    classes,
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name)
    },
    getBoundingClientRect: () => ({ height: 200 }),
    querySelectorAll: (selector: string) => {
      if (selector === '.map-node:not(.is-planned)') return lit;
      if (selector === '.map-edge') return edges;
      if (selector === '.map-city:not(.is-planned)') return cities;
      return [];
    }
  } as unknown as HTMLElement;

  return { map, lit, edges, cities };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('playMap', () => {
  test('starts one time on reveal and does not reset when the map leaves', () => {
    let notify: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.useFakeTimers();
    vi.stubGlobal('window', { innerHeight: 800, setTimeout, clearTimeout });
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe = observe;
      disconnect = disconnect;
    });

    const { map, lit, edges, cities } = mapFixture();
    const player = playMap(map);

    expect(map.classList.contains('is-lighting')).toBe(true);
    expect(observe).toHaveBeenCalledWith(map);
    expect([...lit, ...edges, ...cities].some((group) => group.classes.has('is-lit'))).toBe(false);

    notify?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(map.classList.contains('is-drawing')).toBe(false);

    notify?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(map.classList.contains('is-lighting')).toBe(false);
    expect(map.classList.contains('is-drawing')).toBe(true);
    expect([...lit, ...edges, ...cities].every((group) => group.classes.has('is-lit'))).toBe(true);
    expect([...lit, ...edges, ...cities].some((group) => group.classes.has('is-now'))).toBe(false);
    expect(disconnect).toHaveBeenCalledTimes(1);

    notify?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(map.classList.contains('is-drawing')).toBe(true);
    expect([...lit, ...edges, ...cities].every((group) => group.classes.has('is-lit'))).toBe(true);

    player.cancel();
  });

  test('keeps the complete static map when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { map } = mapFixture();

    playMap(map);

    expect(map.classList.contains('is-lighting')).toBe(false);
    expect(map.classList.contains('is-drawing')).toBe(false);
  });
});
