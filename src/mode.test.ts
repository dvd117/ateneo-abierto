import { describe, expect, test } from 'vitest';
import { DEFAULT_MODE, detectMode, isMode, updateUrlMode } from './mode';

describe('detectMode', () => {
  test('defaults to the mode everyone gets, never the technical one', () => {
    expect(DEFAULT_MODE).toBe('general');
    expect(
      detectMode({ search: '', savedMode: null, deepLink: null })
    ).toBe('general');
  });

  test('uses an explicit ?mode= first', () => {
    expect(detectMode({ search: '?mode=tech', savedMode: 'general', deepLink: null })).toBe('tech');
    expect(detectMode({ search: '?mode=general', savedMode: 'tech', deepLink: null })).toBe('general');
  });

  test('keeps a saved mode when the URL says nothing', () => {
    expect(detectMode({ search: '', savedMode: 'tech', deepLink: null })).toBe('tech');
  });

  test('ignores an unsupported ?mode= rather than guessing', () => {
    expect(detectMode({ search: '?mode=expert', savedMode: null, deepLink: null })).toBe('general');
    expect(detectMode({ search: '?mode=', savedMode: null, deepLink: null })).toBe('general');
  });

  test('lets a door outrank a saved mode', () => {
    expect(detectMode({ search: '', savedMode: 'tech', deepLink: 'talleres' })).toBe('general');
  });

  test('but an explicit ?mode= in the door link still wins', () => {
    expect(detectMode({ search: '?mode=tech', savedMode: null, deepLink: 'talleres' })).toBe('tech');
  });

  test('reads the mode alongside another param', () => {
    expect(detectMode({ search: '?lang=en&mode=tech', savedMode: null, deepLink: null })).toBe('tech');
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
