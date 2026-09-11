/**
 * The scene runner for the agent window.
 *
 * It does not build markup and it does not fetch anything. `main.ts` renders a
 * sequence's *finished* state into the DOM, and this module reveals it in
 * order: the message, the files, the plan, each step ticking, the produced
 * document, the status line.
 *
 * Rendering the end state up front is deliberate:
 *  - with no JS, reduced motion or saveData, the finished window simply stands;
 *  - a cancelled sequence leaves a coherent window, not half a conversation;
 *  - the runner only toggles classes, so it stays tiny and cannot inject text.
 * The window's height is fixed in CSS, so the thread growing never moves the
 * page around it.
 *
 * This module is imported dynamically and only when motion is allowed. Under
 * `prefers-reduced-motion` or `saveData`, main.ts leaves the end state visible
 * and never loads this file.
 */

/** Beats of the sequence, in reveal order, matching `data-beat` in the markup. */
const BEATS = ['prompt', 'files', 'ack', 'plan', 'doc', 'status'] as const;

type Beat = (typeof BEATS)[number];

/** Delay before each beat, in multiples of --duration-step (420 ms). */
const BEAT_DELAY: Record<Beat, number> = {
  prompt: 0.2,
  files: 0.9,
  ack: 1,
  plan: 0.8,
  doc: 0.7,
  status: 0.5
};

/** How long a step spends in the "running" state before it ticks. */
const STEP_RUN = 1.5;

export type ScenePlayer = {
  /** Stops the sequence and leaves every beat revealed. */
  cancel: () => void;
};

export type PlayOptions = {
  /** One step of the timeline, in ms. Defaults to the --duration-step token. */
  stepMs?: number;
  /** Called once the last beat lands, for the screen-reader status line. */
  onFinish?: () => void;
};

function stepDuration(thread: HTMLElement): number {
  const raw = getComputedStyle(thread).getPropertyValue('--duration-step').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 420;
}

/**
 * Keeps the newest beat in view. The thread is the scrolling element, so this
 * never moves the page itself. It follows the beat that just landed rather
 * than the bottom of the thread: the finished state is already in the DOM, so
 * "the bottom" is where the work *will* be, not where it is.
 */
function follow(thread: HTMLElement, beat: HTMLElement): void {
  const beatBottom = beat.offsetTop + beat.offsetHeight;
  const overflow = beatBottom - (thread.scrollTop + thread.clientHeight);

  if (overflow <= 0) {
    return;
  }

  thread.scrollTo({ top: thread.scrollTop + overflow + 8, behavior: 'smooth' });
}

/**
 * Reveals one sequence. Returns immediately; the caller cancels by calling
 * `cancel()` (which is what switching prompt chips does).
 */
export function playScene(thread: HTMLElement, options: PlayOptions = {}): ScenePlayer {
  const unit = options.stepMs ?? stepDuration(thread);
  const timers: number[] = [];
  let cancelled = false;

  const beats = new Map<Beat, HTMLElement>();
  for (const beat of BEATS) {
    const el = thread.querySelector<HTMLElement>(`[data-beat="${beat}"]`);
    if (el) {
      beats.set(beat, el);
    }
  }

  const steps = Array.from(thread.querySelectorAll<HTMLElement>('[data-step]'));

  // Start from nothing revealed and every step pending, at the top.
  thread.classList.add('is-playing');
  thread.scrollTop = 0;
  for (const el of beats.values()) {
    el.classList.remove('is-in');
  }
  for (const step of steps) {
    step.classList.remove('is-running', 'is-done');
  }

  const at = (delay: number, run: () => void) => {
    timers.push(window.setTimeout(run, delay));
  };

  let elapsed = 0;

  for (const beat of BEATS) {
    const el = beats.get(beat);
    if (!el) {
      continue;
    }

    elapsed += BEAT_DELAY[beat] * unit;

    const target = el;
    at(elapsed, () => {
      target.classList.add('is-in');
      follow(thread, target);
    });

    // The plan is revealed, then its steps tick one at a time before the
    // produced file can appear.
    if (beat === 'plan') {
      for (const step of steps) {
        elapsed += 0.35 * unit;
        at(elapsed, () => step.classList.add('is-running'));
        elapsed += STEP_RUN * unit;
        at(elapsed, () => {
          step.classList.remove('is-running');
          step.classList.add('is-done');
        });
      }
    }
  }

  at(elapsed + 0.2 * unit, () => {
    thread.classList.remove('is-playing');
    options.onFinish?.();
  });

  return {
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;

      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      timers.length = 0;

      // Leave the window in its finished state rather than mid-plan.
      thread.classList.remove('is-playing');
      for (const el of beats.values()) {
        el.classList.add('is-in');
      }
      for (const step of steps) {
        step.classList.remove('is-running');
        step.classList.add('is-done');
      }
    }
  };
}
