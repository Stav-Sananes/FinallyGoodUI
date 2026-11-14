// Normalise someone else's token files into our token set. Sources: DTCG trees (Figma's native
// variable export writes one file per mode; Tokens Studio's DTCG mode; Terrazzo), Tokens Studio's
// legacy {value, type} format with token sets, and DTCG resolvers (read through loadTokens).
// Each token is placed in one of our groups by its $type and its path; what can't be placed is
// reported, never guessed into the wrong group.
import { GROUPS, colorObject, parseDuration, parseEasing, parseFontList } from "./tokens.mjs";

const isLeaf = (node) => node && typeof node === "object" && ("$value" in node || ("value" in node && "type" in node));

/** Every token in a tree as [pathArray, node], in document order; skips $-keys. */
function* leaves(node, path = []) {
  if (!node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    if (isLeaf(v)) yield [[...path, k], v];
    else if (v && typeof v === "object") yield* leaves(v, [...path, k]);
  }
}
const at = (tree, path) => path.reduce((n, k) => n?.[k], tree);

export function deepMerge(a, b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === "object" && !Array.isArray(v) && !isLeaf(v) ? deepMerge(out[k] || {}, v) : v;
  return out;
}

// ---------- Tokens Studio legacy format ----------

/** Tokens Studio type -> [DTCG $type, group hint]. */
const STUDIO_TYPES = {
  color: ["color"], spacing: ["dimension", "space"], sizing: ["dimension", "space"], dimension: ["dimension"],
  borderRadius: ["dimension", "radius"], fontSizes: ["dimension", "text"], letterSpacing: ["dimension", "tracking"],
  fontFamilies: ["fontFamily"], boxShadow: ["shadow"], typography: ["typography"], duration: ["duration"],
  lineHeights: ["number"], opacity: ["number"], fontWeights: ["fontWeight"], borderWidth: ["dimension"],
};

/** A tree where legacy {value, type} leaves become {$value, $type, $hint}. */
function fromStudioLegacy(tree) {
  if (!tree || typeof tree !== "object" || Array.isArray(tree)) return tree;
  if ("value" in tree && "type" in tree && !("$value" in tree)) {
    const [type, hint] = STUDIO_TYPES[tree.type] ?? [tree.type];
    return { $value: tree.value, $type: type, ...(hint ? { $hint: hint } : {}), ...(tree.description ? { $description: tree.description } : {}) };
  }
  return Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, fromStudioLegacy(v)]));
}

/** Tokens Studio keeps token sets as top-level keys, listed in $metadata.tokenSetOrder. */
export function studioSets(doc, { base, dark } = {}) {
  const names = doc.$metadata?.tokenSetOrder ?? Object.keys(doc).filter((k) => !k.startsWith("$"));
  return { base: base ?? names.filter((n) => !/dark/i.test(n)), dark: dark ?? names.filter((n) => /dark/i.test(n)) };
}
export const isStudioMultiSet = (doc) => "$metadata" in doc || "$themes" in doc;

// ---------- references and simple math ----------

const REF = /\{([^{}]+)\}/g;

/** Replace {a.b} references (whole values, or inside an expression such as "{space.sm} * 2"). */
function resolveRefs(tree) {
  const out = structuredClone(tree);
  const valueOf = (ref, seen) => {
    if (seen.has(ref)) throw new Error(`circular reference: ${[...seen, ref].join(" -> ")}`);
    const tok = at(out, ref.split("."));
    if (!tok || !("$value" in tok)) throw new Error(`reference {${ref}} points to no token`);
    return resolve(tok.$value, new Set([...seen, ref]));
  };
  const resolve = (v, seen) => {
    if (typeof v === "string") {
      const whole = v.match(/^\{([^{}]+)\}$/);
      if (whole) return valueOf(whole[1], seen);
      return v.includes("{") ? v.replace(REF, (_, ref) => scalar(valueOf(ref, seen))) : v;
    }
    if (Array.isArray(v)) return v.map((x) => resolve(x, seen));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, seen)]));
    return v;
  };
  for (const [path, tok] of leaves(out)) tok.$value = resolve(tok.$value, new Set([path.join(".")]));
  return out;
}
const scalar = (v) => (v && typeof v === "object" && "value" in v ? `${v.value}${v.unit ?? ""}` : String(v));

// ---------- values ----------

/** 8 | "8" | "8px" | "0.5rem" | "{…} * 2" evaluated | {value, unit} -> {value, unit} (unitless = px), or null. */
export function toDimension(v) {
  if (v && typeof v === "object" && "value" in v) return { value: Number(v.value), unit: v.unit ?? "px" };
  if (typeof v === "number") return { value: v, unit: "px" };
  const s = String(v ?? "").trim();
  const one = s.match(/^(-?\d*\.?\d+)(px|rem|em|%)?$/);
  if (one) return one[2] === "%" ? { value: Number(one[1]) / 100, unit: "em" } : { value: Number(one[1]), unit: one[2] ?? "px" };
  const expr = s.match(/^(-?\d*\.?\d+)(px|rem)?\s*([*+\-/])\s*(-?\d*\.?\d+)(px|rem)?$/);
  if (!expr) return null;
  const [a, b] = [Number(expr[1]), Number(expr[4])];
  const value = { "*": a * b, "/": a / b, "+": a + b, "-": a - b }[expr[3]];
  return { value: Math.round(value * 1000) / 1000, unit: expr[2] ?? expr[5] ?? "px" };
}

const toMs = (v) => {
  if (typeof v === "number") return { value: v, unit: "ms" };
  const d = parseDuration(v);
  if (!d) return null;
  return { value: Math.round((d.unit === "s" ? d.value * 1000 : d.value) * 1000) / 1000, unit: "ms" };
};

function toShadow(v) {
  if (typeof v === "string") return v;
  const one = (s) => {
    if (s.offsetX != null) return s; // already DTCG
    const dim = (x) => toDimension(x ?? 0);
    return { color: colorObject(String(s.color)), offsetX: dim(s.x), offsetY: dim(s.y), blur: dim(s.blur), spread: dim(s.spread), ...(s.type === "innerShadow" ? { inset: true } : {}) };
  };
  return Array.isArray(v) ? v.map(one) : one(v);
}

/** A typography composite becomes a text token: font size, plus line height and tracking in $extensions.fgu. */
function fromTypography(v) {
  const size = toDimension(v.fontSize);
  if (!size) return null;
  const fgu = {};
  const lh = v.lineHeight;
  if (typeof lh === "number") fgu.lineHeight = lh;
  else if (typeof lh === "string" && /%$/.test(lh)) fgu.lineHeight = Number(lh.slice(0, -1)) / 100;
  else if (lh != null) { const d = toDimension(lh); if (d) fgu.lineHeight = d.unit === "px" && size.unit === "px" ? Math.round((d.value / size.value) * 1000) / 1000 : d.value; }
  if (v.letterSpacing != null) { const t = toDimension(v.letterSpacing); if (t) fgu.letterSpacing = t; }
  return { value: size, fgu };
}

// ---------- placing tokens in our groups ----------

const ALIASES = {
  color: ["color", "colors", "colour", "colours", "palette"],
  space: ["space", "spaces", "spacing", "spacings", "gap", "size", "sizes", "sizing"],
  radius: ["radius", "radii", "rounded", "corner", "corners", "borderradius", "border-radius"],
  font: ["font", "fonts", "fontfamily", "fontfamilies", "font-family", "family", "families"],
  text: ["text", "fontsize", "fontsizes", "font-size", "type", "typography", "typescale"],
  tracking: ["tracking", "letterspacing", "letter-spacing"],
  shadow: ["shadow", "shadows", "elevation", "boxshadow"],
  duration: ["duration", "durations", "motion", "timing"],
  easing: ["easing", "easings", "ease", "curve", "curves"],
  icon: ["icon", "icons"],
};
const TYPES_FOR = {
  color: ["color"], space: ["dimension"], radius: ["dimension"], font: ["fontFamily"], text: ["dimension", "typography"],
  tracking: ["dimension", "number"], shadow: ["shadow"], duration: ["duration"], easing: ["cubicBezier"], icon: ["dimension", "number"],
};
const BY_TYPE = { color: "color", fontFamily: "font", duration: "duration", cubicBezier: "easing", shadow: "shadow", typography: "text" };
const aliasGroup = (seg) => Object.keys(ALIASES).find((g) => ALIASES[g].includes(String(seg).toLowerCase()));

/** {group, name} for a token, or {reason} when it doesn't fit any group. */
function placement(path, tok) {
  const type = tok.$type;
  const first = aliasGroup(path[0]);
  const rest = path.length > 1 && first ? path.slice(1) : path;
  const name = rest.join("-");
  if (first && TYPES_FOR[first].includes(type)) return { group: first, name };
  if (tok.$hint && TYPES_FOR[tok.$hint]?.includes(type)) return { group: tok.$hint, name };
  if (BY_TYPE[type]) return { group: BY_TYPE[type], name };
  return { reason: type === "dimension" ? "a dimension whose path names no group (space, radius, text…)" : `no group for $type ${type ?? "(none)"}` };
}

/** The token's value in the shape our group uses, plus any $extensions.fgu it brings; null if unreadable. */
function convert(group, tok) {
  const v = tok.$value;
  switch (group) {
    case "color": return { value: typeof v === "string" ? colorObject(v) : v };
    case "font": return { value: Array.isArray(v) ? v : parseFontList(v) };
    case "duration": { const d = toMs(v); return d && { value: d }; }
    case "easing": { const e = parseEasing(v); return e && { value: e }; }
    case "shadow": return { value: toShadow(v) };
    case "tracking": return typeof v === "number" ? { value: v } : (() => { const d = toDimension(v); return d && { value: d }; })();
    case "icon": if (typeof v === "number") return { value: v };
    // falls through
    case "space": case "radius": case "text": {
      if (tok.$type === "typography") { const t = fromTypography(v); return t && { value: t.value, fgu: t.fgu }; }
      const d = toDimension(v);
      return d && { value: d, fgu: tok.$extensions?.fgu };
    }
    default: return null;
  }
}

const REQUIRED_ROLES = ["background", "foreground", "card", "card-foreground", "primary", "primary-foreground", "muted", "muted-foreground", "border", "ring", "destructive"];

/**
 * Build our token tree from a base tree and an optional dark tree (or dark values already on the
 * tokens, as loadTokens attaches them). Returns {tokens, unmapped, missingRoles}.
 */
export function placeTokens(baseRaw, darkRaw = null) {
  const base = resolveRefs(fromStudioLegacy(baseRaw));
  const dark = darkRaw ? resolveRefs(fromStudioLegacy(deepMerge(baseRaw, darkRaw))) : null;
  const tokens = {}, unmapped = [];
  for (const [path, tok] of leaves(base)) {
    const where = placement(path, tok);
    const light = where.group && convert(where.group, tok);
    if (!light) { unmapped.push({ path: path.join("."), type: tok.$type ?? null, reason: where.reason ?? "value could not be read" }); continue; }
    const out = { $type: tok.$type === "typography" ? "dimension" : tok.$type, $value: light.value };
    if (tok.$description) out.$description = tok.$description;
    const fgu = { ...(light.fgu ?? {}) };
    delete fgu.dark;
    const darkTok = dark ? at(dark, path) : null;
    const darkValue = darkTok ? convert(where.group, darkTok)?.value
      : tok.$extensions?.fgu?.dark != null ? convert(where.group, { ...tok, $value: tok.$extensions.fgu.dark })?.value : null;
    if (darkValue != null && JSON.stringify(darkValue) !== JSON.stringify(light.value)) fgu.dark = darkValue;
    if (Object.keys(fgu).length) out.$extensions = { fgu };
    (tokens[where.group] ||= {})[where.name] = out;
  }
  const colors = Object.keys(tokens.color ?? {});
  return { tokens, unmapped, missingRoles: REQUIRED_ROLES.filter((r) => !colors.includes(r)) };
}

/** Copy whole groups the import lacks from the defaults (never colours: a palette isn't mixed). */
export function fillMissingGroups(tokens, defaults) {
  const filled = [];
  for (const g of GROUPS) {
    if (g === "color" || tokens[g] || !defaults[g]) continue;
    tokens[g] = structuredClone(defaults[g]);
    filled.push(g);
  }
  return filled;
}
