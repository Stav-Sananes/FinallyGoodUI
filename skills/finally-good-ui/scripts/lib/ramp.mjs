// Tonal colour scales from one seed colour, in OKLCH, for component kits that want a scale per
// colour (Mantine 0–9, Tailwind/Prime/Chakra/Skeleton 50–950, Radix Themes 1–12, Fluent 10–160)
// instead of semantic pairs. Lightness follows a fixed curve, the seed lands exactly on its nearest
// step, chroma tapers towards the pale and deep ends, and every step is clamped into sRGB.
import { parseColor, toOklch, oklchInGamut } from "./contrast.mjs";
import { colorObject } from "./tokens.mjs";

const steps = (from, to, by) => Array.from({ length: (to - from) / by + 1 }, (_, i) => String(from + i * by));
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/**
 * names: step names in order. lightness: OKLCH L per step, or a function of the seed's L.
 * anchor: the step the seed always occupies; without one, the seed takes the nearest step.
 */
export const PRESETS = {
  tailwind: { names: ["50", ...steps(100, 900, 100), "950"],
    lightness: [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282] },
  mantine: { names: steps(0, 9, 1), lightness: [0.97, 0.93, 0.87, 0.79, 0.71, 0.64, 0.58, 0.52, 0.46, 0.4] },
  radix: { names: steps(1, 12, 1), anchor: "9",
    lightness: [0.993, 0.982, 0.955, 0.925, 0.89, 0.845, 0.79, 0.715, null, (L) => L - 0.04, (L) => Math.min(0.52, L - 0.08), 0.28] },
  fluent: { names: steps(10, 160, 10), lightness: linspace(0.14, 0.98, 16) },
};

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const fmt = (L, C, H) => `oklch(${round(L, 3)} ${round(C, 4)} ${H === "none" ? "none" : round(H, 2)})`;

/** The seed as exact OKLCH components, keeping the author's numbers when they wrote oklch(). */
function seedComponents(css) {
  const obj = colorObject(css);
  if (obj && typeof obj === "object" && obj.colorSpace === "oklch") return obj.components;
  const parsed = parseColor(String(css));
  if (!parsed) throw new Error(`not a colour: ${css}`);
  const o = toOklch(parsed);
  return [o.l, o.c, o.c < 1e-4 ? "none" : o.h];
}

/** Largest chroma ≤ c at (L, H) that stays inside sRGB. */
function clampChroma(L, c, H) {
  if (oklchInGamut(L, c, H)) return c;
  let lo = 0, hi = c;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (oklchInGamut(L, mid, H)) lo = mid; else hi = mid; }
  return lo;
}

/** Clamped chroma, rounded down to the printed precision so rounding can't push it out of gamut. */
function displayableChroma(L, c, H) {
  let printed = Math.floor(clampChroma(L, c, H) * 1e4) / 1e4;
  while (printed > 0 && !oklchInGamut(L, printed, H)) printed = round(printed - 1e-4, 4);
  return printed;
}

/** Chroma falls off away from the seed's lightness, so tints stay soft and shades stay deep. */
const taper = (L, seedL) => Math.max(0.12, 1 - ((L - seedL) / 0.55) ** 2);

export function colorScale(seed, presetName = "tailwind") {
  const preset = PRESETS[presetName];
  if (!preset) throw new Error(`unknown preset ${presetName} (use ${Object.keys(PRESETS).join("|")})`);
  const [L0, C0, H] = seedComponents(seed);
  const targets = preset.lightness.map((t) => (typeof t === "function" ? t(L0) : t));
  const anchorIndex = preset.anchor ? preset.names.indexOf(preset.anchor)
    : targets.reduce((best, L, i) => (Math.abs(L - L0) < Math.abs(targets[best] - L0) ? i : best), 0);
  const seedCss = typeof seed === "string" && /^oklch\(/i.test(seed.trim()) ? seed.trim() : fmt(L0, C0, H);
  const out = {};
  preset.names.forEach((name, i) => {
    if (i === anchorIndex) { out[name] = seedCss; return; }
    const L = round(targets[i], 3);
    out[name] = fmt(L, C0 === 0 ? 0 : displayableChroma(L, C0 * taper(L, L0), H), H);
  });
  return { preset: presetName, seed: seedCss, anchor: preset.names[anchorIndex], steps: out };
}
