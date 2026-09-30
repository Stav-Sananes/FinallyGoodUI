#!/usr/bin/env node
// Colour parsing (hex, rgb, hsl, oklch, oklab, shadcn HSL triplets), sRGB <-> OKLCH,
// WCAG 2 contrast ratio and APCA Lc (informational). Zero dependencies.
import { runCli, isMain, UsageError } from "./cli.mjs";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const NAMED = {
  white: [1, 1, 1], black: [0, 0, 0], red: [1, 0, 0], green: [0, 128 / 255, 0], blue: [0, 0, 1],
  gray: [128 / 255, 128 / 255, 128 / 255], grey: [128 / 255, 128 / 255, 128 / 255],
};

function num(tok, pctScale = 1) {
  tok = String(tok).trim();
  if (tok === "none") return 0;
  if (tok.endsWith("%")) return (parseFloat(tok) / 100) * pctScale;
  const v = parseFloat(tok);
  return Number.isFinite(v) ? v : NaN;
}

function hue(tok) {
  tok = String(tok).trim();
  const v = parseFloat(tok);
  if (tok.endsWith("turn")) return v * 360;
  if (tok.endsWith("grad")) return v * 0.9;
  if (tok.endsWith("rad") ) return (v * 180) / Math.PI;
  return v;
}

/** Split "a b c / d" or "a, b, c, d" into [parts, alpha]. */
function splitArgs(inner) {
  let alpha = 1;
  let body = inner.trim();
  const slash = body.split("/");
  if (slash.length === 2) { body = slash[0]; alpha = num(slash[1]); }
  const parts = body.includes(",") ? body.split(",").map((s) => s.trim()) : body.trim().split(/\s+/);
  if (parts.length === 4 && slash.length === 1) alpha = num(parts.pop());
  return [parts, alpha];
}

const hslToRgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
};

// OKLab <-> linear sRGB (Björn Ottosson's matrices)
function oklabToLinear(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
function linearToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Parse a CSS colour to {r,g,b,a} (sRGB 0..1, gamut-clamped). Returns null if unparseable. */
export function parseColor(input) {
  if (input == null) return null;
  const s = String(input).trim().toLowerCase().replace(/\s*!important$/, "");
  if (!s) return null;
  if (NAMED[s]) { const [r, g, b] = NAMED[s]; return { r, g, b, a: 1 }; }
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const v = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: v(0), g: v(2), b: v(4), a: h.length === 8 ? v(6) : 1 };
  }
  m = s.match(/^(rgba?|hsla?|oklch|oklab)\((.*)\)$/);
  let fn, inner;
  if (m) { fn = m[1]; inner = m[2]; }
  else if (/^-?[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%(\s*\/\s*[\d.]+%?)?$/.test(s)) { fn = "hsl"; inner = s; } // shadcn triplet
  else return null;
  if (inner.includes("var(")) return null;
  const [p, alpha] = splitArgs(inner);
  if (p.length !== 3) return null;
  let rgb;
  if (fn.startsWith("rgb")) rgb = p.map((t) => num(t, 255) / 255);
  else if (fn.startsWith("hsl")) rgb = hslToRgb(hue(p[0]), num(p[1]) / (p[1].endsWith("%") ? 1 : 100), num(p[2]) / (p[2].endsWith("%") ? 1 : 100));
  else {
    const L = p[0].endsWith("%") ? num(p[0]) : num(p[0]);
    let a, b;
    if (fn === "oklch") {
      const C = p[1].endsWith("%") ? num(p[1]) * 0.4 : num(p[1]);
      const H = (hue(p[2]) * Math.PI) / 180;
      a = C * Math.cos(H); b = C * Math.sin(H);
    } else {
      a = p[1].endsWith("%") ? num(p[1]) * 0.4 : num(p[1]);
      b = p[2].endsWith("%") ? num(p[2]) * 0.4 : num(p[2]);
    }
    rgb = oklabToLinear(L, a, b).map((c) => fromLinear(clamp01(c)));
  }
  if (rgb.some((x) => !Number.isFinite(x))) return null;
  const [r, g, b] = rgb.map(clamp01);
  return { r, g, b, a: Number.isFinite(alpha) ? clamp01(alpha) : 1 };
}

const asColor = (c) => (typeof c === "string" ? parseColor(c) : c);

export function toHex(c, withAlpha = false) {
  c = asColor(c);
  if (!c) return null;
  const h = (x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}${withAlpha && c.a < 1 ? h(c.a) : ""}`;
}

/** sRGB colour -> {l, c, h} OKLCH (l 0..1). */
export function toOklch(c) {
  c = asColor(c);
  if (!c) return null;
  const [L, a, b] = linearToOklab(toLinear(c.r), toLinear(c.g), toLinear(c.b));
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 1e-4 ? 0 : H, a: c.a };
}

const round = (x, d) => { const f = 10 ** d; return Math.round(x * f) / f; };

/** Canonical OKLCH string, e.g. "oklch(0.628 0.258 29.23)". */
export function oklchString(c) {
  const o = toOklch(c);
  if (!o) return null;
  const base = `${round(o.l, 3)} ${round(o.c, 3)} ${round(o.h, 2)}`;
  return o.a < 1 ? `oklch(${base} / ${round(o.a, 3)})` : `oklch(${base})`;
}

function over(fg, bg) {
  if (fg.a >= 1) return fg;
  const k = fg.a;
  return { r: fg.r * k + bg.r * (1 - k), g: fg.g * k + bg.g * (1 - k), b: fg.b * k + bg.b * (1 - k), a: 1 };
}

export function relativeLuminance(c) {
  c = asColor(c);
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

/** WCAG 2.x contrast ratio (1..21). fg alpha is composited over bg. */
export function contrastRatio(fg, bg) {
  const b = asColor(bg), f0 = asColor(fg);
  if (!b || !f0) return NaN;
  const bb = over(b, { r: 1, g: 1, b: 1, a: 1 });
  const f = over(f0, bb);
  const L1 = relativeLuminance(f), L2 = relativeLuminance(bb);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/** APCA 0.0.98G-4g lightness contrast (Lc). Positive = dark text on light bg. */
export function apcaLc(text, bg) {
  const b = over(asColor(bg), { r: 1, g: 1, b: 1, a: 1 });
  const t = over(asColor(text), b);
  const Y = (c) => {
    let y = 0.2126729 * c.r ** 2.4 + 0.7151522 * c.g ** 2.4 + 0.072175 * c.b ** 2.4;
    if (y < 0.022) y += (0.022 - y) ** 1.414;
    return y;
  };
  const Yt = Y(t), Yb = Y(b);
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  let out;
  if (Yb > Yt) {
    const sapc = (Yb ** 0.56 - Yt ** 0.57) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    const sapc = (Yb ** 0.65 - Yt ** 0.62) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}

export function contrastReport(fg, bg) {
  const f = parseColor(fg), b = parseColor(bg);
  if (!f) throw new UsageError(`cannot parse colour: ${fg}`);
  if (!b) throw new UsageError(`cannot parse colour: ${bg}`);
  const ratio = contrastRatio(f, b);
  return {
    fg, bg, fgHex: toHex(f), bgHex: toHex(b),
    ratio: round(ratio, 2),
    wcag: {
      aa: { normal: ratio >= 4.5, large: ratio >= 3, ui: ratio >= 3 },
      aaa: { normal: ratio >= 7, large: ratio >= 4.5 },
    },
    apca: round(apcaLc(f, b), 1),
    note: "WCAG 2 ratio is normative; APCA Lc is informational (|Lc| >= 75 body text, >= 60 large/UI, >= 45 large headings).",
  };
}

const HELP = `
Usage: contrast.mjs <fg> <bg>

WCAG 2 contrast ratio + APCA Lc for two CSS colours (hex, rgb(), hsl(), oklch(), oklab(),
or shadcn "H S% L%" triplets). Prints JSON: {ratio, wcag:{aa,aaa}, apca}.
Options: --help
`;

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root"] },
    main: ({ positionals }) => {
      if (positionals.length !== 2) throw new UsageError("expected exactly two colours: <fg> <bg>");
      return contrastReport(positionals[0], positionals[1]);
    },
  });
}
