import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { playScene } from './scene';

/**
 * Node environment, no jsdom: the thread is faked down to exactly the surface
 * the runner touches (classList, querySelector/All, scroll geometry).
 */
type FakeEl = {
  dataset: Record<string, string>;
  classes: Set<string>;
  classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
    contains: (name: string) => boolean;
  };
  offsetTop: number;
  offsetHeight: number;
};

function makeEl(dataset: Record<string, string> = {}): FakeEl {
  const classes = new Set<string>();
  return {
    dataset,
    classes,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name)
    },
    offsetTop: 0,
    offsetHeight: 20
  };
}

const BEATS = ['prompt', 'files', 'ack', 'plan', 'doc', 'status'];

function makeThread() {
  const beats = BEATS.map((beat) => {
    const el = makeEl({ beat });
    // The finished state the markup ships with.
    el.classes.add('is-in');
    return el;
  });
  const steps = Array.from({ length: 4 }, () => {
    const el = makeEl();
    el.classes.add('is-done');
    return el;
  });
  const thread = {
    ...makeEl(),
    scrollTop: 0,
    scrollHeight: 400,
    clientHeight: 400,
    scrollTo: vi.fn(),
    querySelector: (selector: string) =>
      beats.find((el) => selector === `[data-beat="${el.dataset.beat}"]`) ?? null,
    querySelectorAll: (selector: string) => (selector === '[data-step]' ? steps : [])
  };

  return { thread, beats, steps };
}

const revealed = (beats: FakeEl[]) =>
  beats.filter((el) => el.classes.has('is-in')).map((el) => el.dataset.beat);

const stepStates = (steps: FakeEl[]) =>
  steps
    .map((el) => (el.classes.has('is-done') ? 'D' : el.classes.has('is-running') ? 'R' : '.'))
    .join('');

describe('scene runner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setTimeout, clearTimeout });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('starts from nothing revealed, with every step pending', () => {
    const { thread, beats, steps } = makeThread();

    playScene(thread as unknown as HTMLElement, { stepMs: 100 });

    expect(thread.classes.has('is-playing')).toBe(true);
    expect(revealed(beats)).toEqual([]);
    expect(stepStates(steps)).toBe('....');
  });

  test('reveals beats in story order and ticks the plan before the document lands', () => {
    const { thread, beats, steps } = makeThread();
    const order: string[] = [];

    playScene(thread as unknown as HTMLElement, { stepMs: 100 });

    for (let t = 0; t < 2000; t += 10) {
      vi.advanceTimersByTime(10);
      for (const beat of revealed(beats)) {
        if (beat && !order.includes(beat)) {
          order.push(beat);
          if (beat === 'doc') {
            // The document never appears before every step has ticked.
            expect(stepStates(steps)).toBe('DDDD');
          }
        }
      }
    }

    expect(order).toEqual(BEATS);
  });

  test('runs exactly one step at a time', () => {
    const { thread, steps } = makeThread();

    playScene(thread as unknown as HTMLElement, { stepMs: 100 });

    for (let t = 0; t < 2000; t += 10) {
      vi.advanceTimersByTime(10);
      const running = steps.filter((el) => el.classes.has('is-running')).length;
      expect(running).toBeLessThanOrEqual(1);
    }
  });

  test('finishes on the end state and announces it once', () => {
    const { thread, beats, steps } = makeThread();
    const onFinish = vi.fn();

    playScene(thread as unknown as HTMLElement, { stepMs: 100, onFinish });
    vi.runAllTimers();

    expect(thread.classes.has('is-playing')).toBe(false);
    expect(revealed(beats)).toEqual(BEATS);
    expect(stepStates(steps)).toBe('DDDD');
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('cancel leaves a finished window, not half a conversation', () => {
    const { thread, beats, steps } = makeThread();
    const onFinish = vi.fn();

    const player = playScene(thread as unknown as HTMLElement, { stepMs: 100, onFinish });
    vi.advanceTimersByTime(250);
    player.cancel();
    vi.runAllTimers();

    expect(thread.classes.has('is-playing')).toBe(false);
    expect(revealed(beats)).toEqual(BEATS);
    expect(stepStates(steps)).toBe('DDDD');
    // A cancelled sequence did not finish; nothing is announced.
    expect(onFinish).not.toHaveBeenCalled();
  });

  test('follows the newest beat inside the thread only when it overflows', () => {
    const { thread, beats } = makeThread();
    thread.clientHeight = 100;
    beats[4].offsetTop = 300; // the document sits below the fold of the thread

    playScene(thread as unknown as HTMLElement, { stepMs: 100 });
    vi.runAllTimers();

    expect(thread.scrollTo).toHaveBeenCalled();
    const lastCall = thread.scrollTo.mock.calls.at(-1)?.[0] as { top: number };
    expect(lastCall.top).toBeGreaterThan(0);
  });
});
