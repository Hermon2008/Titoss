export type HSL = { h: number; s: number; l: number };
export const METHODS = ['Analogue', 'Complémentaire', 'Triadique', 'Monochromatique', 'Aléatoire'] as const;
export type Method = (typeof METHODS)[number];

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function hslToRgb({ h, s, l }: HSL): [number, number, number] {
  const hh = ((h % 360) + 360) % 360, S = clamp(s) / 100, L = clamp(l) / 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export const toHex = (c: HSL) =>
  '#' + hslToRgb(c).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

export function hexToHsl(hex: string): HSL | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  let h = 0;
  if (d) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
}

// ---------- Harmonies en OKLCH (espace proche de la perception) ----------
type LCH = { L: number; C: number; h: number };
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
export function hexToLch(hex: string): LCH {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}
function lchToLin({ L, C, h }: LCH): number[] {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
function lchToHex(c: LCH): string {
  let k = { ...c };
  for (let i = 0; i < 24 && lchToLin(k).some((v) => v < -0.0005 || v > 1.0005); i++) k = { ...k, C: k.C * 0.92 };
  return '#' + lchToLin(k).map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(v))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Nombre de couleurs par méthode : fixe pour les harmonies « pures », réglable pour les autres.
export const COUNTS: Record<Method, { min: number; max: number; def: number }> = {
  Analogue: { min: 3, max: 7, def: 5 },
  Complémentaire: { min: 2, max: 2, def: 2 },
  Triadique: { min: 3, max: 3, def: 3 },
  Monochromatique: { min: 3, max: 7, def: 5 },
  Aléatoire: { min: 2, max: 8, def: 5 },
};
const PURE: Method[] = ['Complémentaire', 'Triadique'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const hues = (m: Method, n: number): number[] =>
  m === 'Complémentaire' ? [0, 180]
  : m === 'Triadique' ? [0, 120, 240]
  : m === 'Analogue' ? Array.from({ length: n }, (_, i) => (i - Math.floor((n - 1) / 2)) * 15)
  : Array(n).fill(0);

// La base est la couleur dominante ; les autres suivent l'harmonie, avec des extrémités
// claires/sombres peu saturées (méthodes étalées) ou des clartés proches (harmonies pures).
function candidate(method: Method, b: LCH, n: number): LCH[] {
  const pure = PURE.includes(method), mid = pure ? 0 : Math.floor((n - 1) / 2), H = hues(method, n);
  const Cb = Math.min(0.2, Math.max(b.C, 0.05));
  return Array.from({ length: n }, (_, i) => {
    if (i === mid) return b;
    const L = pure
      ? Math.min(0.95, Math.max(0.2, b.L + (i % 2 ? 0.1 : -0.12) + rnd(-0.04, 0.04)))
      : 0.95 - (0.67 * i) / (n - 1) + rnd(-0.06, 0.06);
    const dh = method === 'Aléatoire' ? rnd(0, 360) : H[i] + rnd(-8, 8);
    const edge = !pure && (i === 0 || i === n - 1);
    return { L, C: Cb * (edge ? rnd(0.15, 0.5) : rnd(0.4, 1.2)), h: b.h + dh };
  });
}
function score(p: LCH[], pure: boolean): number {
  const L = p.map((c) => c.L).sort((x, y) => y - x), C = p.map((c) => c.C), span = L[0] - L[L.length - 1];
  if (pure) return 1 - Math.abs(span - 0.25);
  const gaps = L.slice(1).map((v, i) => L[i] - v);
  return Math.min(1, span / 0.65) + Math.min(1, Math.min(...gaps) / (0.5 / L.length)) + Math.min(1, (Math.max(...C) - Math.min(...C)) / 0.08);
}
export function generate(method: Method, base: HSL, n: number = COUNTS[method].def): string[] {
  const b = hexToLch(toHex(base)), pure = PURE.includes(method);
  let best: LCH[] = [], top = -Infinity;
  for (let i = 0; i < 80; i++) {
    const p = candidate(method, b, n), s = score(p, pure) + Math.random() * 0.05;
    if (s > top) { top = s; best = p; }
  }
  return best.sort((x, y) => y.L - x.L).map(lchToHex);
}

const lum = (hex: string) => {
  const [r, g, b] = hslToRgb(hexToHsl(hex)!).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
