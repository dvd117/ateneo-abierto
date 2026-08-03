import { afterEach, describe, expect, test, vi } from 'vitest';
import { initProgressRail, initReveal } from './reveal';

/**
 * These run in the default node environment (the project has no jsdom), so the
 * scope is faked down to exactly the surface initReveal touches.
 */
type FakeTarget = {
  classes: Set<string>;
  classList: { add: (name: string) => void };
  dataset: Record<string, string>;
  style: Record<string, string>;
};

function makeTarget(): FakeTarget {
  const classes = new Set<string>();
  return {
    classes,
    classList: { add: (name: string) => classes.add(name) },
    dataset: {},
    style: {}
  };
}

function makeScope(count: number) {
  const targets = Array.from({ length: count }, makeTarget);
  return {
    targets,
    scope: { querySelectorAll: () => targets } as unknown as ParentNode
  };
}

function stubMatchMedia(reduced: boolean): void {
  // reveal.ts reads window.matchMedia, so the stub has to live on window.
  vi.stubGlobal('window', {
    matchMedia: (media: string) => ({ matches: reduced, media })
  });
}

function stubObserver() {
  const observe = vi.fn();
  const disconnect = vi.fn();

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    }
  );

  return { observe, disconnect };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initReveal', () => {
  test('reveals everything immediately and never observes under reduced motion', () => {
    stubMatchMedia(true);
    const { observe } = stubObserver();
    const { targets, scope } = makeScope(3);

    initReveal(scope);

    expect(targets.every((target) => target.classes.has('is-revealed'))).toBe(true);
    expect(observe).not.toHaveBeenCalled();
  });

  test('observes each target when motion is allowed', () => {
    stubMatchMedia(false);
    const { observe } = stubObserver();
    const { targets, scope } = makeScope(3);

    initReveal(scope);

    expect(targets.some((target) => target.classes.has('is-revealed'))).toBe(false);
    expect(observe).toHaveBeenCalledTimes(3);
  });

  test('teardown disconnects the observer so locale switches do not leak', () => {
    stubMatchMedia(false);
    const { disconnect } = stubObserver();
    const { scope } = makeScope(2);

    initReveal(scope)();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test('falls back to revealed when IntersectionObserver is unavailable', () => {
    stubMatchMedia(false);
    vi.stubGlobal('IntersectionObserver', undefined);
    const { targets, scope } = makeScope(2);

    initReveal(scope);

    expect(targets.every((target) => target.classes.has('is-revealed'))).toBe(true);
  });

  test('is a no-op when nothing opts into revealing', () => {
    stubMatchMedia(false);
    const { observe } = stubObserver();

    initReveal(makeScope(0).scope)();

    expect(observe).not.toHaveBeenCalled();
  });
});

describe('initProgressRail', () => {
  test('is a no-op without a rail element', () => {
    expect(() => initProgressRail(null)()).not.toThrow();
  });
});
