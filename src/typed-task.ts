/**
 * The typed-task prototype (HERO_INPUT 'typed', or ?hero=typed for review).
 *
 * The visitor types a task into the agent window; this picks the scripted
 * sequence that looks most like it and writes the visitor's words into that
 * sequence's first message. It is a prototype of the idea, not an agent: no
 * text is sent anywhere, and nothing is generated — the match only chooses
 * which of the four scripted tasks to play.
 *
 * Loaded on demand, only on the typed variant, so the scripted page never
 * carries it.
 */

/** Lowercase, accents stripped, split on anything that is not a letter. */
export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** A typed word counts for a keyword as written or in its plural: factura, facturas. */
function hits(word: string, keyword: string): boolean {
  return word === keyword || word === `${keyword}s` || word === `${keyword}es`;
}

export type SceneMatch = {
  /** Index into the locale's scenes. */
  index: number;
  /** Distinct keywords the text hit; 0 means nothing matched and scene one plays. */
  score: number;
};

/**
 * Scores each scene by how many of its keywords the text contains (each
 * keyword once). The highest score wins; a tie goes to the earlier scene; no
 * hit at all goes to scene one.
 */
export function matchScene(text: string, scenes: readonly { keywords: readonly string[] }[]): SceneMatch {
  const words = normalize(text);
  let best: SceneMatch = { index: 0, score: 0 };

  scenes.forEach((scene, index) => {
    const keywords = new Set(scene.keywords.flatMap(normalize));
    let score = 0;
    for (const keyword of keywords) {
      if (words.some((word) => hits(word, keyword))) {
        score += 1;
      }
    }

    if (score > best.score) {
      best = { index, score };
    }
  });

  return best;
}

type TextSlot = { textContent: string | null };
type ThreadLike = { querySelector: (selector: string) => TextSlot | null };

/**
 * Puts the visitor's words in the sequence's first message and the agent's
 * answer in its first line. Text only, never markup: whatever was typed is
 * shown as typed.
 */
export function writeTypedTurn(thread: ThreadLike, text: string, ack: string): void {
  const prompt = thread.querySelector('[data-beat="prompt"]');
  const reply = thread.querySelector('[data-beat="ack"]');

  if (prompt) {
    prompt.textContent = text;
  }

  if (reply) {
    reply.textContent = ack;
  }
}
