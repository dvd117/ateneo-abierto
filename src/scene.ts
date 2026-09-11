/**
 * The scene runner for the agent window.
 *
 * It does not build markup and it does not fetch anything. `render.ts` renders
 * a sequence's *finished* state, and this module reveals it in order. Each
 * sequence has two rounds, because that is how the work goes:
 *
 *   1. the visitor's request, the files, a plan that ticks, and a Markdown
 *      draft on paper — where the work gets settled;
 *   2. once it reads right, the visitor types a follow-up into "Pídele algo
 *      más…", sends it, and the agent converts the draft into the file they
 *      will actually send (Excel, PowerPoint, PDF, Word).
 *
 * Rendering the end state up front is deliberate:
 *  - with no JS, reduced motion or saveData, the finished window simply stands;
 *  - a cancelled sequence leaves a coherent window, not half a conversation;
 *  - the runner only toggles classes and the input's text, so it stays tiny
 *    and cannot inject anything.
 * The window's height is fixed in CSS, so the thread growing never moves the
 * page around it.
 *
 * This module is imported dynamically and only when motion is allowed. Under
 * `prefers-reduced-motion` or `saveData`, main.ts leaves the end state visible
 * and never loads this file.
 */

type Cue = {
  /** `data-beat` of the element this cue reveals. */
  beat: string;
  /** Wait before it, in multiples of --duration-step (420 ms). */
  delay: number;
  /** Type the element's text into the input and send it before revealing it. */
  typed?: boolean;
};

const TIMELINE: readonly Cue[] = [
  { beat: 'prompt', delay: 0.2 },
  { beat: 'files', delay: 0.9 },
  { beat: 'ack', delay: 1 },
  { beat: 'plan', delay: 0.8 },
  { beat: 'doc', delay: 0.7 },
  { beat: 'status', delay: 0.5 },
  // Long enough to read the draft before the visitor "asks" for the real file.
  { beat: 'followup', delay: 3.5, typed: true },
  { beat: 'ack2', delay: 0.9 },
  { beat: 'plan2', delay: 0.7 },
  { beat: 'file', delay: 0.7 },
  { beat: 'status2', delay: 0.5 }
];

export const BEAT_ORDER = TIMELINE.map((cue) => cue.beat);

/** How long a step spends in the "running" state before it ticks. */
const STEP_RUN = 1.5;
/** Gap before a step starts running. */
const STEP_GAP = 0.35;
/** One typed character: about 30 ms, a quick but human pace. */
const TYPE_CHAR = 0.07;
/** Beat between the last character and the send press, and the press itself. */
const SEND_WAIT = 0.5;
const SEND_PRESS = 0.35;

export type ScenePlayer = {
  /** Stops the sequence and leaves every beat revealed. */
  cancel: () => void;
};

export type PlayOptions = {
  /** One step of the timeline, in ms. Defaults to the --duration-step token. */
  stepMs?: number;
  /** The "Pídele algo más…" box, where the follow-up is typed and sent. */
  input?: HTMLElement | null;
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
 * never moves the page itself.
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
 * `cancel()` (which is what picking another task does).
 */
export function playScene(thread: HTMLElement, options: PlayOptions = {}): ScenePlayer {
  const unit = options.stepMs ?? stepDuration(thread);
  const timers: number[] = [];
  let cancelled = false;

  const beats = new Map<string, HTMLElement>();
  for (const { beat } of TIMELINE) {
    const el = thread.querySelector<HTMLElement>(`[data-beat="${beat}"]`);
    if (el) {
      beats.set(beat, el);
    }
  }

  const allSteps = Array.from(thread.querySelectorAll<HTMLElement>('[data-step]'));

  const input = options.input ?? null;
  const inputText = input?.querySelector<HTMLElement>('[data-input-text]') ?? null;
  const send = input?.querySelector<HTMLElement>('[data-send]') ?? null;
  const placeholder = inputText?.textContent ?? '';

  const resetInput = () => {
    input?.classList.remove('is-typing');
    send?.classList.remove('is-pressed');
    if (inputText) {
      inputText.textContent = placeholder;
    }
  };

  // Start from nothing revealed and every step pending, at the top.
  thread.classList.add('is-playing');
  thread.scrollTop = 0;
  for (const el of beats.values()) {
    el.classList.remove('is-in');
  }
  for (const step of allSteps) {
    step.classList.remove('is-running', 'is-done');
  }
  resetInput();

  const at = (delay: number, run: () => void) => {
    timers.push(window.setTimeout(run, delay));
  };

  let elapsed = 0;

  for (const cue of TIMELINE) {
    const el = beats.get(cue.beat);
    if (!el) {
      continue;
    }

    elapsed += cue.delay * unit;

    // The follow-up is typed into the input, character by character, and sent
    // with the button on the right — then it appears in the conversation.
    if (cue.typed && input && inputText) {
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');

      at(elapsed, () => {
        input.classList.add('is-typing');
        inputText.textContent = '';
      });

      for (let length = 1; length <= text.length; length += 1) {
        elapsed += TYPE_CHAR * unit;
        at(elapsed, () => {
          inputText.textContent = text.slice(0, length);
        });
      }

      elapsed += SEND_WAIT * unit;
      at(elapsed, () => send?.classList.add('is-pressed'));
      elapsed += SEND_PRESS * unit;
      at(elapsed, resetInput);
    }

    const target = el;
    at(elapsed, () => {
      target.classList.add('is-in');
      follow(thread, target);
    });

    // A plan is revealed, then its own steps tick one at a time; nothing after
    // it can land until the last one has.
    const steps = Array.from(el.querySelectorAll<HTMLElement>('[data-step]'));
    for (const step of steps) {
      elapsed += STEP_GAP * unit;
      at(elapsed, () => step.classList.add('is-running'));
      elapsed += STEP_RUN * unit;
      at(elapsed, () => {
        step.classList.remove('is-running');
        step.classList.add('is-done');
      });
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
      for (const step of allSteps) {
        step.classList.remove('is-running');
        step.classList.add('is-done');
      }
      resetInput();
    }
  };
}
