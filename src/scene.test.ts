import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BEAT_ORDER, playScene, toMs } from './scene';

/**
 * Node environment, no jsdom: the thread is faked down to exactly the surface
 * the runner touches (classList, querySelector/All, text, scroll geometry).
 */
type FakeEl = {
  dataset: Record<string, string>;
  classes: Set<string>;
  classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
    contains: (name: string) => boolean;
  };
  textContent: string;
  offsetTop: number;
  offsetHeight: number;
  children: FakeEl[];
  querySelector: (selector: string) => FakeEl | null;
  querySelectorAll: (selector: string) => FakeEl[];
};

function makeEl(dataset: Record<string, string> = {}, children: FakeEl[] = [], text = ''): FakeEl {
  const classes = new Set<string>();
  const el: FakeEl = {
    dataset,
    classes,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name)
    },
    textContent: text,
    offsetTop: 0,
    offsetHeight: 20,
    children,
    querySelector: (selector) => el.querySelectorAll(selector)[0] ?? null,
    querySelectorAll: (selector) => {
      const all = children.flatMap((child) => [child, ...child.querySelectorAll('*')]);
      if (selector === '*') return all;
      if (selector === '[data-step]') return all.filter((node) => 'step' in node.dataset);
      const beat = /^\[data-beat="(.+)"\]$/.exec(selector)?.[1];
      if (beat) return all.filter((node) => node.dataset.beat === beat);
      const attr = /^\[data-([a-z-]+)\]$/.exec(selector)?.[1];
      if (attr) return all.filter((node) => attr.replace(/-(\w)/g, (_m, c: string) => c.toUpperCase()) in node.dataset);
      return [];
    }
  };
  return el;
}

const FOLLOW_UP = 'Se ve bien. Pásalo a Excel.';
const PLACEHOLDER = 'Pídele algo más…';

function makeWindow() {
  const step = () => {
    const el = makeEl({ step: '' });
    el.classes.add('is-done');
    return el;
  };
  const plan1 = [step(), step(), step(), step()];
  const plan2 = [step(), step()];

  const beats = BEAT_ORDER.map((beat) => {
    const children = beat === 'plan' ? plan1 : beat === 'plan2' ? plan2 : [];
    const el = makeEl({ beat }, children, beat === 'followup' ? FOLLOW_UP : beat);
    // The finished state the markup ships with.
    el.classes.add('is-in');
    return el;
  });

  const thread = Object.assign(makeEl({}, beats), {
    scrollTop: 0,
    scrollHeight: 400,
    clientHeight: 400,
    scrollTo: vi.fn()
  });

  const inputText = makeEl({ inputText: '' }, [], PLACEHOLDER);
  const send = makeEl({ send: '' });
  const input = makeEl({ input: '' }, [inputText, send]);

  return { thread, beats, plan1, plan2, input, inputText, send };
}

const revealed = (beats: FakeEl[]) =>
  beats.filter((el) => el.classes.has('is-in')).map((el) => el.dataset.beat);

const states = (steps: FakeEl[]) =>
  steps
    .map((el) => (el.classes.has('is-done') ? 'D' : el.classes.has('is-running') ? 'R' : '.'))
    .join('');

const asEl = (el: unknown) => el as HTMLElement;

describe('toMs', () => {
  // The build minifies `420ms` to `.42s`; read as bare ms, that ran the whole
  // sequence in about 12 ms in production (2026-09-11).
  test.each([
    ['420ms', 420],
    ['.42s', 420],
    ['0.42s', 420],
    [' 420ms ', 420],
    ['420', 420]
  ])('reads %j as %d ms', (raw, ms) => {
    expect(toMs(raw)).toBe(ms);
  });

  test.each(['', 'auto', '0ms', '-1s'])('rejects %j', (raw) => {
    expect(toMs(raw)).toBeUndefined();
  });
});

describe('scene runner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setTimeout, clearTimeout });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('starts from nothing revealed, every step pending, the input at rest', () => {
    const { thread, beats, plan1, plan2, input, inputText } = makeWindow();

    playScene(asEl(thread), { stepMs: 100, input: asEl(input) });

    expect(thread.classes.has('is-playing')).toBe(true);
    expect(revealed(beats)).toEqual([]);
    expect(states([...plan1, ...plan2])).toBe('......');
    expect(inputText.textContent).toBe(PLACEHOLDER);
  });

  test('plays both rounds in order: draft first, then the converted file', () => {
    const { thread, beats, plan1, plan2, input } = makeWindow();
    const order: string[] = [];

    playScene(asEl(thread), { stepMs: 100, input: asEl(input) });

    for (let t = 0; t < 6000; t += 10) {
      vi.advanceTimersByTime(10);
      for (const beat of revealed(beats)) {
        if (beat && !order.includes(beat)) {
          order.push(beat);
          // Nothing lands before the plan above it has finished ticking.
          if (beat === 'doc') expect(states(plan1)).toBe('DDDD');
          if (beat === 'followup') expect(states(plan1)).toBe('DDDD');
          if (beat === 'file') expect(states(plan2)).toBe('DD');
        }
      }
    }

    expect(order).toEqual(BEAT_ORDER);
  });

  test('types the follow-up into the input and sends it before it appears in the chat', () => {
    const { thread, beats, input, inputText, send } = makeWindow();
    const followup = beats.find((el) => el.dataset.beat === 'followup')!;
    let sawFullText = false;
    let sawPress = false;
    let lengths: number[] = [];

    playScene(asEl(thread), { stepMs: 100, input: asEl(input) });

    for (let t = 0; t < 6000 && !followup.classes.has('is-in'); t += 5) {
      vi.advanceTimersByTime(5);
      if (input.classes.has('is-typing')) lengths.push(inputText.textContent.length);
      if (inputText.textContent === FOLLOW_UP) sawFullText = true;
      if (send.classes.has('is-pressed')) {
        sawPress = true;
        // Sent only once the whole message is in the box.
        expect(inputText.textContent).toBe(FOLLOW_UP);
      }
    }

    expect(sawFullText).toBe(true);
    expect(sawPress).toBe(true);
    // Character by character, never backwards.
    lengths = lengths.filter((length, index) => index === 0 || length !== lengths[index - 1]);
    expect(lengths.length).toBeGreaterThan(10);
    expect([...lengths].sort((a, b) => a - b)).toEqual(lengths);
    // Once sent, the box is back to its placeholder.
    expect(inputText.textContent).toBe(PLACEHOLDER);
    expect(input.classes.has('is-typing')).toBe(false);
  });

  test('runs exactly one step at a time', () => {
    const { thread, plan1, plan2, input } = makeWindow();

    playScene(asEl(thread), { stepMs: 100, input: asEl(input) });

    for (let t = 0; t < 6000; t += 10) {
      vi.advanceTimersByTime(10);
      const running = [...plan1, ...plan2].filter((el) => el.classes.has('is-running')).length;
      expect(running).toBeLessThanOrEqual(1);
    }
  });

  test('finishes on the end state and announces it once', () => {
    const { thread, beats, plan1, plan2, input } = makeWindow();
    const onFinish = vi.fn();

    playScene(asEl(thread), { stepMs: 100, input: asEl(input), onFinish });
    vi.runAllTimers();

    expect(thread.classes.has('is-playing')).toBe(false);
    expect(revealed(beats)).toEqual(BEAT_ORDER);
    expect(states([...plan1, ...plan2])).toBe('DDDDDD');
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test('cancel mid-typing leaves a finished window and a clean input', () => {
    const { thread, beats, plan1, plan2, input, inputText, send } = makeWindow();
    const onFinish = vi.fn();

    const player = playScene(asEl(thread), { stepMs: 100, input: asEl(input), onFinish });
    for (let t = 0; t < 6000 && !input.classes.has('is-typing'); t += 10) {
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(60);
    expect(input.classes.has('is-typing')).toBe(true);

    player.cancel();
    vi.runAllTimers();

    expect(thread.classes.has('is-playing')).toBe(false);
    expect(revealed(beats)).toEqual(BEAT_ORDER);
    expect(states([...plan1, ...plan2])).toBe('DDDDDD');
    expect(inputText.textContent).toBe(PLACEHOLDER);
    expect(input.classes.has('is-typing')).toBe(false);
    expect(send.classes.has('is-pressed')).toBe(false);
    // A cancelled sequence did not finish; nothing is announced.
    expect(onFinish).not.toHaveBeenCalled();
  });

  test('still plays both rounds without an input box to type into', () => {
    const { thread, beats } = makeWindow();

    playScene(asEl(thread), { stepMs: 100 });
    vi.runAllTimers();

    expect(revealed(beats)).toEqual(BEAT_ORDER);
  });

  test('follows the newest beat inside the thread only when it overflows', () => {
    const { thread, beats, input } = makeWindow();
    thread.clientHeight = 100;
    beats[BEAT_ORDER.indexOf('file')].offsetTop = 300;

    playScene(asEl(thread), { stepMs: 100, input: asEl(input) });
    vi.runAllTimers();

    expect(thread.scrollTo).toHaveBeenCalled();
    const calls = thread.scrollTo.mock.calls;
    const lastCall = calls[calls.length - 1]?.[0] as { top: number };
    expect(lastCall.top).toBeGreaterThan(0);
  });
});
