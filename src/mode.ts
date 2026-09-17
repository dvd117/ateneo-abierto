/**
 * Audience mode: who the page is speaking to, independently of what language
 * it speaks. `general` is the whole site as written today. `tech` is the same
 * page for someone who already works with software.
 *
 * Deliberately NOT named after the reader. The URL never says "non-technical"
 * and the toggle never asks anyone to classify themselves at the door: the
 * default is `general` for everybody, and `tech` is an escape hatch for the
 * reader who wants the denser version. The program is about widening who gets
 * to touch this, so the page cannot open by sorting people.
 *
 * This mirrors src/locale.ts on purpose — same detection order, same storage
 * shape, same URL-writing helper — so there is one thing to learn, not two.
 */

export type Mode = 'general' | 'tech';

/** What a visitor gets when nothing says otherwise. Never `tech`. */
export const DEFAULT_MODE: Mode = 'general';

/**
 * Deliberately no deep link here. A door says which topic someone came for,
 * not whether they are technical: the two are orthogonal, so opening
 * /talleres must not throw away a mode the reader chose. The door decides
 * which page is served; it never decides the mode.
 */
export type ModeDetectionInput = {
  search: string;
  savedMode: string | null;
};

export function isMode(value: string | null | undefined): value is Mode {
  return value === 'general' || value === 'tech';
}

export function detectMode(input: ModeDetectionInput): Mode {
  const params = new URLSearchParams(input.search);
  const urlMode = params.get('mode');

  if (isMode(urlMode)) {
    return urlMode;
  }

  if (isMode(input.savedMode)) {
    return input.savedMode;
  }

  return DEFAULT_MODE;
}

export function readSavedMode(storage: Storage): Mode | null {
  const savedMode = storage.getItem('ateneo-abierto-mode');
  return isMode(savedMode) ? savedMode : null;
}

export function saveMode(storage: Storage, mode: Mode): void {
  storage.setItem('ateneo-abierto-mode', mode);
}

/**
 * Unlike ?lang=, the default mode is written as the *absence* of the param.
 * One address for the page everyone lands on keeps the canonical honest and
 * stops /?mode=general and / competing as two URLs for one page.
 */
export function updateUrlMode(url: URL, mode: Mode): string {
  if (mode === DEFAULT_MODE) {
    url.searchParams.delete('mode');
  } else {
    url.searchParams.set('mode', mode);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
