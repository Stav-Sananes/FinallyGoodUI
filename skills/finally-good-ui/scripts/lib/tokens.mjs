// DTCG-subset token helpers (spec §5.5): group metadata, value parsing and CSS formatting.

export const GROUPS = ["color", "font", "text", "space", "radius", "shadow", "duration", "easing"];
export const VAR_PREFIX = { color: "color", font: "font", text: "text", space: "space", radius: "radius",
  shadow: "shadow", duration: "duration", easing: "ease" };
export const TYPES = { color: "color", font: "fontFamily", text: "dimension", space: "dimension", radius: "dimension",
  shadow: "shadow", duration: "duration", easing: "cubicBezier" };

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
      const toCss = (s) => (typeof s === "string" ? s :
        `${s.inset ? "inset " : ""}${[s.offsetX, s.offsetY, s.blur, s.spread].map((x) => (typeof x === "object" ? cssValue("space", x) : x ?? 0)).join(" ")} ${s.color}`);
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

/** Flatten to [{group, name, varName, light, dark, token}] in group order. */
export function flatten(tokens) {
  const out = [];
  for (const group of GROUPS) {
    for (const [name, tok] of groupTokens(tokens?.[group])) {
      const d = darkOf(tok);
      out.push({ group, name, varName: `--${VAR_PREFIX[group]}-${name}`, light: cssValue(group, tok.$value),
        dark: d == null ? null : cssValue(group, d), token: tok });
    }
  }
  return out;
}
