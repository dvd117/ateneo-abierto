/**
 * Rebuilds src/data/venezuela.geo.json from Natural Earth.
 *
 * The page must make no external request, so the boundary is vendored into the
 * repo rather than fetched. A hand-drawn outline is not acceptable: a
 * Venezuelan reader spots a wrong coastline, and spots a missing Esequibo
 * immediately — so the Zona en Reclamación is carried as its own feature and
 * drawn hatched, the way it appears on maps published in Venezuela.
 *
 * Sources (public domain, Natural Earth v5, https://www.naturalearthdata.com):
 *   ne_10m_admin_0_countries.geojson        → Venezuela, mainland and islands
 *   ne_10m_admin_0_disputed_areas.geojson   → "West of Essequibo River"
 *
 * Both layers are 10 m, so the shared border matches. Run:
 *   node scripts/vendor-venezuela-map.mjs <countries.geojson> <disputed.geojson>
 */

import { readFileSync, writeFileSync } from 'node:fs';

const [countriesPath, disputedPath] = process.argv.slice(2);

if (!countriesPath || !disputedPath) {
  console.error('usage: vendor-venezuela-map.mjs <ne_10m_admin_0_countries> <ne_10m_admin_0_disputed_areas>');
  process.exit(1);
}

/** Perpendicular distance from p to the segment a→b, in degrees. */
function distance(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas–Peucker. Tolerance is in degrees; 0.02° is well under a pixel here. */
function simplify(points, tolerance) {
  if (points.length < 3) {
    return points;
  }

  let index = 0;
  let furthest = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const d = distance(points[i], points[0], points[points.length - 1]);
    if (d > furthest) {
      furthest = d;
      index = i;
    }
  }

  if (furthest <= tolerance) {
    return [points[0], points[points.length - 1]];
  }

  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

const TOLERANCE = 0.02;
const round = (value) => Number(value.toFixed(3));

function ringArea(ring) {
  const lons = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  return (Math.max(...lons) - Math.min(...lons)) * (Math.max(...lats) - Math.min(...lats));
}

/**
 * Rings only — holes are dropped. At this scale none of them is a pixel wide,
 * and the map is a diagram of where the nodes are, not a cadastre.
 */
function ringsOf(geometry) {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  return polygons.map((polygon) => polygon[0]);
}

function clean(rings, { minArea = 0, maxLat = Infinity } = {}) {
  return rings
    .filter((ring) => ringArea(ring) >= minArea)
    .filter((ring) => Math.min(...ring.map((point) => point[1])) < maxLat)
    .map((ring) => simplify(ring, TOLERANCE).map(([lon, lat]) => [round(lon), round(lat)]))
    .filter((ring) => ring.length > 3)
    .sort((a, b) => ringArea(b) - ringArea(a));
}

function read(path) {
  return JSON.parse(readFileSync(path, 'utf8')).features;
}

const venezuela = read(countriesPath).find((feature) => feature.properties.NAME === 'Venezuela');
const claim = read(disputedPath).find(
  (feature) => feature.properties.BRK_NAME === 'West of Essequibo River'
);

if (!venezuela || !claim) {
  console.error('could not find Venezuela or the Essequibo claim in those files');
  process.exit(1);
}

// Isla de Aves sits 500 km north of the coast; including it would triple the
// frame for one pixel. Everything from Margarita down stays.
const mainland = clean(ringsOf(venezuela.geometry), { minArea: 0.01, maxLat: 12.8 });
const claimRings = clean(ringsOf(claim.geometry));

const collection = {
  type: 'FeatureCollection',
  note: 'Natural Earth v5 (public domain), 10 m admin-0 countries and disputed areas, simplified to 0.02 deg. Rebuild with scripts/vendor-venezuela-map.mjs.',
  features: [
    {
      type: 'Feature',
      properties: { id: 'mainland', name: 'Venezuela' },
      geometry: { type: 'MultiPolygon', coordinates: mainland.map((ring) => [ring]) }
    },
    {
      type: 'Feature',
      properties: { id: 'claim', name: 'Zona en Reclamación' },
      geometry: { type: 'MultiPolygon', coordinates: claimRings.map((ring) => [ring]) }
    }
  ]
};

writeFileSync('src/data/venezuela.geo.json', `${JSON.stringify(collection)}\n`);

console.log(
  `mainland: ${mainland.length} rings, ${mainland.reduce((n, r) => n + r.length, 0)} points\n` +
    `claim: ${claimRings.length} rings, ${claimRings.reduce((n, r) => n + r.length, 0)} points`
);
