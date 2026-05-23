import { describe, expect, test } from 'vitest';
import { detectLocale } from './locale';

describe('detectLocale', () => {
  test('uses Spanish URL override first', () => {
    expect(
      detectLocale({
        search: '?lang=es',
        savedLocale: 'en',
        browserLanguages: ['en-US']
      })
    ).toBe('es');
  });

  test('uses English URL override first', () => {
    expect(
      detectLocale({
        search: '?lang=en',
        savedLocale: 'es',
        browserLanguages: ['es-VE']
      })
    ).toBe('en');
  });

  test('uses saved locale when URL does not override', () => {
    expect(
      detectLocale({
        search: '',
        savedLocale: 'es',
        browserLanguages: ['en-US']
      })
    ).toBe('es');
  });

  test('uses Spanish browser language when no saved preference exists', () => {
    expect(
      detectLocale({
        search: '',
        savedLocale: null,
        browserLanguages: ['es-VE', 'en-US']
      })
    ).toBe('es');
  });

  test('defaults to English when language is unclear', () => {
    expect(
      detectLocale({
        search: '',
        savedLocale: null,
        browserLanguages: ['fr-FR']
      })
    ).toBe('en');
  });
});
