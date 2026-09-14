import { afterEach, describe, expect, test, vi } from 'vitest';
import { bandMix, initBands, initProgressRail, initReveal, screenTilt, tiltShift } from './reveal';

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

describe('the bands as instruments', () => {
  test('maps left-right tilt onto band travel, clamped at thirty degrees', () => {
    expect(tiltShift(0, 90)).toBe(0);
    expect(tiltShift(15, 90)).toBe(45);
    expect(tiltShift(-30, 90)).toBe(-90);
    expect(tiltShift(75, 90)).toBe(90);
    expect(tiltShift(-120, 90)).toBe(-90);
    expect(tiltShift(null, 90)).toBe(0);
    expect(tiltShift(Number.NaN, 90)).toBe(0);
  });

  test('reads beta instead of gamma when the screen is turned to landscape', () => {
    const lean = { beta: 12, gamma: -40 };

    expect(screenTilt(lean, 0)).toBe(-40);
    expect(screenTilt(lean, 90)).toBe(12);
    expect(screenTilt(lean, 270)).toBe(-12);
    expect(screenTilt(lean, 180)).toBe(40);
    expect(screenTilt({ beta: null, gamma: null }, 90)).toBeNull();
  });

  test('reads the reading rail\'s ratio: 0 at the top, 1 at the foot, where the form is', () => {
    // A 10 357 px page read on an 844 px phone, as measured at 390 wide.
    const scrollable = 10357 - 844;
    // Where each band sits mid-screen at 390 (measured 2026-09-14).
    expect(bandMix(1538 - 422, scrollable)).toBeCloseTo(0.117, 3);
    expect(bandMix(5456 - 422, scrollable)).toBeCloseTo(0.529, 3);
    expect(bandMix(8876 - 422, scrollable)).toBeCloseTo(0.889, 3);
    // Clamped at both ends, and flat on a page that cannot scroll.
    expect(bandMix(-50, scrollable)).toBe(0);
    expect(bandMix(scrollable + 200, scrollable)).toBe(1);
    expect(bandMix(0, 0)).toBe(0);
  });

  test('attaches no scroll or orientation listener under reduced motion', () => {
    const addEventListener = vi.fn();
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
      addEventListener,
      DeviceOrientationEvent: class {}
    });
    vi.stubGlobal('navigator', {});
    const band = { addEventListener: vi.fn(), style: { setProperty: vi.fn() } } as unknown as HTMLElement;

    initBands([band])();

    expect(addEventListener).not.toHaveBeenCalled();
    expect((band.addEventListener as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  test('never asks iOS for permission on load, only on a tap on a band', () => {
    const addEventListener = vi.fn();
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      addEventListener,
      removeEventListener: vi.fn(),
      requestAnimationFrame: vi.fn(() => 1),
      cancelAnimationFrame: vi.fn(),
      innerHeight: 844,
      scrollY: 0,
      DeviceOrientationEvent: Object.assign(class {}, { requestPermission })
    });
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', { documentElement: { scrollHeight: 10357 } });
    const bandListeners: [string, () => void][] = [];
    const band = {
      addEventListener: (type: string, listener: () => void) => bandListeners.push([type, listener]),
      removeEventListener: vi.fn(),
      getBoundingClientRect: () => ({ top: 400, bottom: 480, height: 80 }),
      style: { setProperty: vi.fn(), removeProperty: vi.fn() },
      dataset: {}
    } as unknown as HTMLElement;

    initBands([band]);

    expect(requestPermission).not.toHaveBeenCalled();
    expect(addEventListener.mock.calls.map(([type]) => type)).not.toContain('deviceorientation');
    expect(bandListeners.map(([type]) => type)).toEqual(['touchend']);

    bandListeners[0][1]();
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
