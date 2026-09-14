/**
 * Writes the six link-preview cards for the doors' own addresses
 * (public/og-{route}.svg and og-{route}-en.svg) from public/og.svg's layout
 * and the door copy in src/content.ts, so a card can never say something the
 * page does not. scripts/render-brand-assets.sh turns them into PNGs.
 *
 *   npx tsx scripts/build-og-cards.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copy, DEEP_LINK_ROUTES, type DeepLinkRoute } from '../src/content';
import type { Locale } from '../src/locale';

const ROOT = join(import.meta.dirname, '..');

/**
 * Headline size per card. 96 is the home card's; a line that would run past
 * the 80 px right margin at 96 gets a smaller size here rather than a third line.
 */
const HEADLINE_SIZE: Partial<Record<`${DeepLinkRoute}-${Locale}`, number>> = {};

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildCard(template: string, locale: Locale, route: DeepLinkRoute): string {
  const page = copy[locale];
  const door = page.doors.doors.find((candidate) => candidate.id === route);
  if (!door) {
    throw new Error(`no door for ${route}`);
  }

  const card = page.deepLinks[route];
  const size = HEADLINE_SIZE[`${route}-${locale}`] ?? 96;
  const eyebrow = `${door.n} · ${page.nav[0].label}`.toUpperCase();
  const lines: string[] = [];

  // One headline line sits where the home card's second line does, in the
  // signal colour; two lines follow the home card exactly.
  const headlineTop = card.headline.length === 1 ? 340 : 302;
  card.headline.forEach((text, index) => {
    const last = index === card.headline.length - 1 && card.headline.length > 1;
    const single = card.headline.length === 1;
    const y = headlineTop + index * 98;
    lines.push(
      last || single
        ? `  <text class="serif-em" x="76" y="${y}" font-size="${size}" fill="#e2a638" letter-spacing="-1">${escapeXml(text)}</text>`
        : `  <text class="serif" x="76" y="${y}" font-size="${size}" fill="#f0ece2" letter-spacing="-2.6">${escapeXml(text)}</text>`
    );
  });

  const whoTop = card.headline.length === 1 ? 436 : 474;
  card.who.forEach((text, index) => {
    lines.push(
      `  <text class="sans" x="80" y="${whoTop + index * 38}" font-size="28" fill="#cfc9bb">${escapeXml(text)}</text>`
    );
  });

  const start = template.indexOf('  <text class="sans" x="80" y="200"');
  const end = template.indexOf('  <line x1="80"');
  if (start < 0 || end < 0) {
    throw new Error('public/og.svg no longer has the layout this script expects');
  }

  const body = [
    `  <text class="sans" x="80" y="200" font-size="18" font-weight="600" fill="#e2a638"`,
    `        letter-spacing="2.6">${escapeXml(eyebrow)}</text>`,
    '',
    ...lines,
    '',
    ''
  ].join('\n');

  return (template.slice(0, start) + body + template.slice(end)).replace(
    '>ateneo-abierto.org</text>',
    `>ateneo-abierto.org/${route}</text>`
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const template = readFileSync(join(ROOT, 'public/og.svg'), 'utf8');
  for (const route of DEEP_LINK_ROUTES) {
    for (const locale of ['es', 'en'] as const) {
      const file = `public/og-${route}${locale === 'en' ? '-en' : ''}.svg`;
      writeFileSync(join(ROOT, file), buildCard(template, locale, route));
      console.log(`wrote ${file}`);
    }
  }
}
