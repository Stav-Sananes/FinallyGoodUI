// Categorical chart palettes: can every series be told apart, by everyone, on this background?
// Colour-vision deficiency is simulated with the Machado, Oliveira & Fernandes (2009) matrices at
// full severity, applied to linear sRGB; distance is Euclidean in OKLab.
import { parseColor, contrastRatio, toOklch } from "./contrast.mjs";

const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
export const VISION = ["normal", ...Object.keys(CVD)];

/** Series must stand out from the plot background as non-text graphics (WCAG 1.4.11). */
export const MIN_CONTRAST = 3;
/** Smallest OKLab distance at which two series still read as different colours at chart sizes. */
export const MIN_DISTANCE = 0.07;
/** Series a palette must keep apart for colour-blind readers; beyond this, label the series directly. */
export const CVD_SAFE_COUNT = 6;

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** How a colour looks under a vision type ("normal" returns it unchanged). */
export function simulate(color, vision) {
  const c = typeof color === "string" ? parseColor(color) : color;
  if (!c || vision === "normal") return c;
  const lin = [c.r, c.g, c.b].map(toLinear);
  const [r, g, b] = CVD[vision].map((row) => fromLinear(clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
  return { r, g, b, a: c.a };
}

/** Euclidean OKLab distance between two colours. */
export function distance(x, y) {
  const lab = (c) => { const o = toOklch(c); const h = (o.h * Math.PI) / 180; return [o.l, o.c * Math.cos(h), o.c * Math.sin(h)]; };
  const [p, q] = [lab(x), lab(y)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/**
 * Problems with a categorical palette on one background, as readable strings (empty = fine).
 * All series are checked for contrast and for normal vision; the first CVD_SAFE_COUNT under each
 * colour-vision deficiency.
 */
export function paletteIssues(colors, background, label = "") {
  const issues = [];
  const parsed = colors.map((c) => parseColor(c));
  const bg = parseColor(background);
  const at = (i) => `chart-${i + 1}`;
  parsed.forEach((c, i) => {
    if (!c) { issues.push(`${label}${at(i)}: not a colour (${colors[i]})`); return; }
    const ratio = contrastRatio(c, bg);
    if (ratio < MIN_CONTRAST) issues.push(`${label}${at(i)}: ${ratio.toFixed(2)}:1 against the background, needs ${MIN_CONTRAST}:1`);
  });
  if (parsed.some((c) => !c)) return issues;
  for (const vision of VISION) {
    const n = vision === "normal" ? parsed.length : Math.min(parsed.length, CVD_SAFE_COUNT);
    const seen = parsed.slice(0, n).map((c) => simulate(c, vision));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d = distance(seen[i], seen[j]);
      if (d < MIN_DISTANCE) issues.push(`${label}${at(i)} and ${at(j)} look alike under ${vision} vision (OKLab distance ${d.toFixed(3)}, needs ${MIN_DISTANCE})`);
    }
  }
  return issues;
}
