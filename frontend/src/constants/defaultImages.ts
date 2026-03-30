/**
 * Default covers when no image is stored in the DB.
 * Uses lightweight SVG placeholders (no bundled JPEGs required) — tech-style gradients.
 * Events: cooler blues/teals; blogs: greens / code-adjacent tones.
 */

export const FALLBACK_SVG_DATA_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ecf39e"/><stop offset="1" stop-color="#4f772d"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/></svg>`
  );

const EVENT_PALETTES: { a: string; b: string; accent: string }[] = [
  { a: '#0f172a', b: '#0369a1', accent: '#38bdf8' },
  { a: '#134e4a', b: '#0d9488', accent: '#5eead4' },
  { a: '#1e1b4b', b: '#4338ca', accent: '#a5b4fc' },
  { a: '#0c4a6e', b: '#0284c7', accent: '#7dd3fc' },
  { a: '#164e63', b: '#0891b2', accent: '#67e8f9' },
  { a: '#312e81', b: '#4f46e5', accent: '#c7d2fe' },
];

const BLOG_PALETTES: { a: string; b: string; accent: string }[] = [
  { a: '#132a13', b: '#31572c', accent: '#90a955' },
  { a: '#14532d', b: '#166534', accent: '#86efac' },
  { a: '#1a2e05', b: '#3f6212', accent: '#d9f99d' },
  { a: '#052e16', b: '#15803d', accent: '#4ade80' },
  { a: '#0f291e', b: '#047857', accent: '#6ee7b7' },
  { a: '#1c1917', b: '#365314', accent: '#bef264' },
];

function svgCover(
  kind: 'event' | 'blog',
  slotIndex: number
): string {
  const palettes = kind === 'event' ? EVENT_PALETTES : BLOG_PALETTES;
  const { a, b, accent } = palettes[((slotIndex % palettes.length) + palettes.length) % palettes.length];
  const grid =
    kind === 'event'
      ? `<g opacity="0.15" stroke="${accent}" fill="none"><path d="M0 120h1200M0 240h1200M0 360h1200M0 480h1200M0 600h1200"/><path d="M200 0v675M400 0v675M600 0v675M800 0v675M1000 0v675"/></g>`
      : `<g opacity="0.12" fill="${accent}"><rect x="80" y="100" width="280" height="18" rx="4"/><rect x="80" y="140" width="220" height="18" rx="4"/><rect x="80" y="180" width="300" height="18" rx="4"/><rect x="80" y="220" width="160" height="18" rx="4"/></g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="1200" height="675" fill="url(#bg)"/>
${grid}
<circle cx="980" cy="120" r="90" fill="${accent}" opacity="0.08"/>
<text x="60" y="620" fill="${accent}" opacity="0.35" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${kind === 'event' ? 'Event' : 'Blog'} cover</text>
</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function pickBySlot<T>(arr: readonly T[], slotIndex: number): T {
  const n = arr.length;
  const i = ((slotIndex % n) + n) % n;
  return arr[i];
}

const EVENT_DEFAULTS = [0, 1, 2, 3, 4, 5].map((i) => svgCover('event', i));
const BLOG_DEFAULTS = [0, 1, 2, 3, 4, 5].map((i) => svgCover('blog', i));

export const DEFAULT_EVENT_IMAGES: readonly string[] = EVENT_DEFAULTS;
export const DEFAULT_BLOG_IMAGES: readonly string[] = BLOG_DEFAULTS;

export function defaultEventImage(slotIndex: number): string {
  return pickBySlot(DEFAULT_EVENT_IMAGES, slotIndex);
}

export function defaultBlogImage(slotIndex: number): string {
  return pickBySlot(DEFAULT_BLOG_IMAGES, slotIndex);
}

export function eventCoverUrl(
  stored: string | undefined | null,
  slotIndex: number
): string {
  const s = stored?.trim();
  if (s) return s;
  return defaultEventImage(slotIndex);
}

export function blogCoverUrl(
  stored: string | undefined | null,
  slotIndex: number
): string {
  const s = stored?.trim();
  if (s) return s;
  return defaultBlogImage(slotIndex);
}
