/**
 * lib/security/guilloche.ts
 *
 * REPLACES your current lib/security/guilloche.ts. Same SVG/UI
 * behavior as before (generateGuillochePattern, guillocheDataUri
 * still work identically) — this adds one new export,
 * generateGuillochePoints(), which returns the raw polygon point
 * data so the exact same pattern can be drawn inside a real PDF
 * (via @react-pdf/renderer's <Polygon>) as well as in the browser.
 * One seed, one shape, wherever it's used.
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface GuillocheOptions {
  seed: string;
  width?: number;
  height?: number;
  lineCount?: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Pure geometry — no SVG string, just the polygon point data. Used
 * by both generateGuillochePattern (below, for web) and DocumentPdf
 * (for print) so the pattern is identical in both places.
 */
export function generateGuillochePoints(opts: GuillocheOptions): string[] {
  const { seed, width = 800, height = 800, lineCount = 28 } = opts;

  const rand = mulberry32(seedFromString(seed));
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.42;

  const freqA = 6 + Math.floor(rand() * 4);
  const freqB = 9 + Math.floor(rand() * 5);
  const phase = rand() * Math.PI * 2;
  const ampRatio = 0.06 + rand() * 0.05;

  const polygons: string[] = [];

  for (let i = 0; i < lineCount; i++) {
    const rOffset = (i / lineCount) * baseR * 0.9;
    const r = baseR - rOffset;
    if (r <= 4) continue;

    const points: string[] = [];
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const theta = (s / steps) * Math.PI * 2;
      const wobble =
        Math.sin(theta * freqA + phase + i * 0.15) * r * ampRatio +
        Math.cos(theta * freqB - phase + i * 0.08) * r * (ampRatio * 0.6);
      const rr = r + wobble;
      const x = cx + rr * Math.cos(theta);
      const y = cy + rr * Math.sin(theta);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    polygons.push(points.join(" "));
  }

  return polygons;
}

export function generateGuillochePattern(opts: GuillocheOptions): string {
  const {
    width = 800,
    height = 800,
    strokeColor = "currentColor",
    strokeWidth = 0.6,
    opacity = 0.5,
  } = opts;

  const polygons = generateGuillochePoints(opts);
  const paths = polygons.map(
    (points) =>
      `<polygon points="${points}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths.join("")}</svg>`;
}

export function guillocheDataUri(opts: GuillocheOptions): string {
  const svg = generateGuillochePattern(opts);
  const encoded = encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}
