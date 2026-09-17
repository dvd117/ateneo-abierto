import { describe, expect, test } from 'vitest';
import { DEFAULT_MODE, detectMode, isMode, updateUrlMode, type ModeDetectionInput } from './mode';

describe('detectMode', () => {
  test('defaults to the mode everyone gets, never the technical one', () => {
    expect(DEFAULT_MODE).toBe('general');
    expect(detectMode({ search: '', savedMode: null })).toBe('general');
  });

  test('uses an explicit ?mode= first', () => {
    expect(detectMode({ search: '?mode=tech', savedMode: 'general' })).toBe('tech');
    expect(detectMode({ search: '?mode=general', savedMode: 'tech' })).toBe('general');
  });

  test('keeps a saved mode when the URL says nothing', () => {
    expect(detectMode({ search: '', savedMode: 'tech' })).toBe('tech');
  });

  test('ignores an unsupported ?mode= rather than guessing', () => {
    expect(detectMode({ search: '?mode=expert', savedMode: null })).toBe('general');
    expect(detectMode({ search: '?mode=', savedMode: null })).toBe('general');
  });

  test('a door never decides the mode: a door is a topic, not a technical level', () => {
    // /talleres says this person wants workshops. It says nothing about
    // whether they read code, so opening a door must not discard a mode the
    // reader chose. Detection therefore takes no door at all — the case is
    // unrepresentable rather than merely untaken, and this guards the day
    // someone is tempted to pass one in again.
    expect(Object.keys({ search: '', savedMode: null } satisfies ModeDetectionInput)).toEqual([
      'search',
      'savedMode'
    ]);
    expect(detectMode({ search: '', savedMode: 'tech' })).toBe('tech');
    expect(detectMode({ search: '?lang=en', savedMode: 'tech' })).toBe('tech');
  });

  test('reads the mode alongside another param', () => {
    expect(detectMode({ search: '?lang=en&mode=tech', savedMode: null })).toBe('tech');
  });
});

describe('isMode', () => {
  test('accepts only the two modes', () => {
    expect(isMode('general')).toBe(true);
    expect(isMode('tech')).toBe(true);
    expect(isMode('technical')).toBe(false);
    expect(isMode(null)).toBe(false);
    expect(isMode(undefined)).toBe(false);
  });
});

describe('updateUrlMode', () => {
  test('writes the technical mode into the address so it can be shared', () => {
    expect(updateUrlMode(new URL('https://ateneo-abierto.org/'), 'tech')).toBe('/?mode=tech');
  });

  test('drops the param for the default, so the page keeps one address', () => {
    expect(updateUrlMode(new URL('https://ateneo-abierto.org/?mode=tech'), 'general')).toBe('/');
  });

  test('leaves the language, the path and the hash alone', () => {
    expect(
      updateUrlMode(new URL('https://ateneo-abierto.org/talleres?lang=en#unete'), 'tech')
    ).toBe('/talleres?lang=en&mode=tech#unete');
    expect(
      updateUrlMode(new URL('https://ateneo-abierto.org/talleres?lang=en&mode=tech#unete'), 'general')
    ).toBe('/talleres?lang=en#unete');
  });
});
