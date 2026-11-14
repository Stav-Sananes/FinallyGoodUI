// Design-token helpers: group metadata, value parsing and CSS formatting. Values may be in the
// older finally-good-ui shape (CSS strings, dark in $extensions.fgu.dark) or in DTCG 2025.10
// (colour/shadow objects, dark in a resolver context); toDtcg converts the first into the second.
import { parseColor, toHex } from "./contrast.mjs";

export const GROUPS = ["color", "font", "text", "tracking", "space", "radius", "shadow", "icon", "duration", "easing"];
export const VAR_PREFIX = { color: "color", font: "font", text: "text", tracking: "tracking", space: "space", radius: "radius",
  shadow: "shadow", icon: "icon", duration: "duration", easing: "ease" };
export const TYPES = { color: "color", font: "fontFamily", text: "dimension", tracking: "dimension", space: "dimension",
  radius: "dimension", shadow: "shadow", icon: "dimension", duration: "duration", easing: "cubicBezier" };

export const EASING_KEYWORDS = {
  linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1],
};

const isToken = (v) => v && typeof v === "object" && "$value" in v;

/** Iterate tokens of a group, flattening nested groups with "-": yields [name, token]. */
export function* groupTokens(group, prefix = "") {
  if (!group || typeof group !== "object") return;
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith("$")) continue;
    const name = prefix ? `${prefix}-${k}` : k;
    if (isToken(v)) yield [name, v];
    else if (v && typeof v === "object") yield* groupTokens(v, name);
  }
}

/** "0.75rem" | "12px" | 12 -> {value, unit} or null. */
export function parseDimension(v) {
  if (v && typeof v === "object" && "value" in v) return { value: Number(v.value), unit: v.unit || "px" };
  if (typeof v === "number") return { value: v, unit: "px" };
  const m = String(v ?? "").trim().match(/^(-?\d*\.?\d+)(px|rem|em|%|vh|vw|ch)?$/);
  if (!m) return null;
  return { value: Number(m[1]), unit: m[2] || "px" };
}

export function parseDuration(v) {
  if (v && typeof v === "object" && "value" in v) return { value: Number(v.value), unit: v.unit || "ms" };
  const m = String(v ?? "").trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!m) return null;
  return m[2] === "s" ? { value: Math.round(Number(m[1]) * 1000), unit: "ms" } : { value: Number(m[1]), unit: "ms" };
}

export function parseEasing(v) {
  if (Array.isArray(v) && v.length === 4) return v.map(Number);
  const s = String(v ?? "").trim();
  if (EASING_KEYWORDS[s]) return EASING_KEYWORDS[s];
  const m = s.match(/^cubic-bezier\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(",").map((x) => Number(x.trim()));
  return parts.length === 4 && parts.every(Number.isFinite) ? parts : null;
}

/** Split a CSS font-family list into names (quotes removed). */
export function parseFontList(v) {
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

const fmtNum = (n) => String(Math.round(n * 1000) / 1000);

/** Convert a token value to a CSS value string. */
export function cssValue(group, value) {
  if (value == null) return "";
  switch (group) {
    case "font":
      return fontCss(value);
    case "color":
      return cssColor(value);
    case "tracking":
      if (typeof value === "number") return `${fmtNum(value)}em`; // DTCG number token: a multiple of the font size
    // falls through
    case "icon":
      if (typeof value === "number") return fmtNum(value); // stroke width, in the icon's own grid units
    // falls through
    case "text": case "space": case "radius": {
      const d = parseDimension(value);
      return d ? `${fmtNum(d.value)}${d.unit}` : String(value);
    }
    case "duration": {
      const d = parseDuration(value);
      return d ? `${fmtNum(d.value)}${d.unit}` : String(value);
    }
    case "easing": {
      const e = parseEasing(value);
      if (!e) return String(value);
      if (e.join() === "0,0,1,1") return "linear";
      return `cubic-bezier(${e.map(fmtNum).join(", ")})`;
    }
    case "shadow": {
      const length = (x) => {
        const d = parseDimension(x ?? 0);
        return !d || d.value === 0 ? "0" : `${fmtNum(d.value)}${d.unit}`;
      };
      const toCss = (s) => (typeof s === "string" ? s :
        `${s.inset ? "inset " : ""}${[s.offsetX, s.offsetY, s.blur, s.spread].map(length).join(" ")} ${cssColor(s.color)}`);
      return Array.isArray(value) ? value.map(toCss).join(", ") : toCss(value);
    }
    default:
      return String(value);
  }
}

/** Font names in CSS need quotes only when they contain spaces; keep it readable. */
export function fontCss(list) {
  return (Array.isArray(list) ? list : [list]).map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
}

export const darkOf = (tok) => tok?.$extensions?.fgu?.dark;

/** How a font token's face loads ($extensions.fgu.load), or null for a system stack. */
export const fontLoad = (tok) => tok?.$extensions?.fgu?.load ?? null;
/** A weight range ("100 900") means a variable font. */
export const isVariableFont = (load) => typeof load?.weights === "string" && /^\d+\s+\d+$/.test(load.weights.trim());

/**
 * CSS for a font token whose face is loaded: next/font publishes its hashed family as
 * --font-<name>-loaded; other loaders register the face under its own name (Fontsource adds
 * " Variable" for variable fonts), so both names follow as the var() fallback.
 */
export function loadedFontCss(name, tok) {
  const [face, ...rest] = Array.isArray(tok.$value) ? tok.$value : [tok.$value];
  const names = isVariableFont(fontLoad(tok)) ? [`${face} Variable`, face] : [face];
  return [`var(--font-${name}-loaded, ${fontCss(names)})`, ...(rest.length ? [fontCss(rest)] : [])].join(", ");
}

/**
 * Per-step type metrics carried on text tokens ($extensions.fgu): line-height (unitless) and
 * letter-spacing (dimension, em). Returns [{suffix, prop, value}] as CSS strings, emitted as
 * --text-<step>--line-height / --text-<step>--letter-spacing (Tailwind v4's own naming).
 */
export function textMetrics(tok) {
  const fgu = tok?.$extensions?.fgu || {};
  const out = [];
  if (fgu.lineHeight != null) out.push({ suffix: "line-height", prop: "lineHeight", value: String(fgu.lineHeight) });
  if (fgu.letterSpacing != null) out.push({ suffix: "letter-spacing", prop: "letterSpacing", value: cssValue("tracking", fgu.letterSpacing) });
  return out;
}

export class MissingTokenError extends Error {}

/** var(--…) for a token that must exist; `who` names the output that needs it in the error. */
export function tokenRef(tokens, group, name, who) {
  if (![...groupTokens(tokens?.[group])].some(([n]) => n === name)) {
    throw new MissingTokenError(`${who} needs the token ${group}.${name}`);
  }
  return `var(--${VAR_PREFIX[group]}-${name})`;
}

/** The CSS font-family list for a font token, loaded face first when it has one. */
export const fontValue = (name, tok) => (fontLoad(tok) ? loadedFontCss(name, tok) : cssValue("font", tok.$value));

/** Flatten to [{group, name, varName, light, dark, token}] in group order. */
export function flatten(tokens) {
  const out = [];
  for (const group of GROUPS) {
    for (const [name, tok] of groupTokens(tokens?.[group])) {
      const d = darkOf(tok);
      const light = group === "font" ? fontValue(name, tok) : cssValue(group, tok.$value);
      out.push({ group, name, varName: `--${VAR_PREFIX[group]}-${name}`, light,
        dark: d == null ? null : cssValue(group, d), token: tok });
    }
  }
  return out;
}

// ---------- colour: DTCG object <-> CSS ----------

const POLAR_SPACES = new Set(["oklch", "oklab", "lch", "lab"]);
const withAlpha = (alpha) => (alpha == null || alpha === 1 ? "" : ` / ${alpha}`);

/** A DTCG colour object ({colorSpace, components, alpha?, hex?}) or a CSS string, as CSS. */
export function cssColor(value) {
  if (value == null || typeof value !== "object") return value == null ? "" : String(value);
  const { colorSpace: space, components: c = [], alpha, hex } = value;
  if (POLAR_SPACES.has(space)) return `${space}(${c.join(" ")}${withAlpha(alpha)})`;
  if (space === "srgb" && hex && (alpha == null || alpha === 1)) return hex;
  if (space === "hsl") return `hsl(${c[0]} ${c[1]}% ${c[2]}%${withAlpha(alpha)})`;
  return `color(${space} ${c.join(" ")}${withAlpha(alpha)})`;
}

const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/i;

/** A CSS colour string as a DTCG colour object. OKLCH keeps its exact numbers; other notations become sRGB. */
export function colorObject(css) {
  if (typeof css !== "string") return css;
  const parsed = parseColor(css);
  const hex = parsed ? toHex(parsed) : undefined;
  const m = css.trim().match(OKLCH);
  if (m) {
    const L = m[2] ? Number(m[1]) / 100 : Number(m[1]);
    const alpha = m[5] == null ? 1 : m[6] ? Number(m[5]) / 100 : Number(m[5]);
    return { colorSpace: "oklch", components: [L, Number(m[3]), m[4] === "none" ? "none" : Number(m[4])], ...(alpha < 1 ? { alpha } : {}), hex };
  }
  if (!parsed) return css; // leave unknown notations alone rather than guess
  const round = (x) => Math.round(x * 10000) / 10000;
  return { colorSpace: "srgb", components: [round(parsed.r), round(parsed.g), round(parsed.b)], ...(parsed.a < 1 ? { alpha: parsed.a } : {}), hex };
}

// ---------- shadow: CSS string -> DTCG objects ----------

function splitTopLevel(s, sep) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && sep.test(ch)) { if (cur.trim()) out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const LENGTH = /^-?\d*\.?\d+(px|rem)?$/;

/** "0 1px 2px 0 oklch(…), …" -> one shadow object, or an array for several layers. */
export function shadowObject(css) {
  if (typeof css !== "string") return css;
  const layers = splitTopLevel(css, /,/).map((layer) => {
    const parts = splitTopLevel(layer, /\s/);
    const inset = parts[0] === "inset" ? (parts.shift(), true) : false;
    const lengths = [];
    while (parts.length && LENGTH.test(parts[0]) && lengths.length < 4) lengths.push(parseDimension(parts.shift()));
    const [offsetX, offsetY, blur = { value: 0, unit: "px" }, spread = { value: 0, unit: "px" }] = lengths;
    return { color: colorObject(parts.join(" ")), offsetX, offsetY, blur, spread, ...(inset ? { inset } : {}) };
  });
  return layers.length === 1 ? layers[0] : layers;
}

// ---------- whole token trees ----------

const toStandardValue = (group, value) =>
  group === "color" ? colorObject(value) : group === "shadow" ? shadowObject(value) : value;

/**
 * Convert a token tree in the older shape to DTCG 2025.10: colours and shadows become objects,
 * em letter-spacing becomes a number token, and dark values move to their own tree (for a resolver).
 * Returns {base, dark}; dark holds only the tokens that change in dark mode.
 */
export function toDtcg(tokens) {
  const base = structuredClone(tokens);
  const dark = {};
  for (const group of GROUPS) {
    for (const [path, tok] of tokenPaths(base[group], [group])) {
      const darkValue = darkOf(tok);
      tok.$value = toStandardValue(group, tok.$value);
      if (group === "tracking") {
        const d = parseDimension(tok.$value);
        if (d?.unit === "em") { tok.$type = "number"; tok.$value = d.value; }
      }
      if (darkValue == null) continue;
      delete tok.$extensions.fgu.dark;
      if (!Object.keys(tok.$extensions.fgu).length) delete tok.$extensions.fgu;
      if (!Object.keys(tok.$extensions).length) delete tok.$extensions;
      setPath(dark, path, { $type: tok.$type, $value: toStandardValue(group, darkValue) });
    }
  }
  return { base, dark };
}

/** Yields [pathArray, token] for every token under a group, keeping nesting. */
export function* tokenPaths(group, prefix) {
  if (!group || typeof group !== "object") return;
  for (const [k, v] of Object.entries(group)) {
    if (k.startsWith("$")) continue;
    if (isToken(v)) yield [[...prefix, k], v];
    else if (v && typeof v === "object") yield* tokenPaths(v, [...prefix, k]);
  }
}

function setPath(tree, path, value) {
  let node = tree;
  for (const key of path.slice(0, -1)) node = node[key] ||= {};
  node[path.at(-1)] = value;
}
