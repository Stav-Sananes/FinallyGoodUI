// Shared source scanners: colour literals and spacing px values with offsets.
import { extname } from "node:path";
import { blankCssComments, blankJsComments, blankHtmlComments } from "./css.mjs";

export const SOURCE_EXTS = new Set([".css", ".scss", ".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte", ".html", ".astro"]);
export const JS_EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs"]);
export const MARKUP_EXTS = new Set([".vue", ".svelte", ".html", ".astro"]);

/** Blank comments appropriate to the file type (offsets preserved). */
export function stripComments(file, text) {
  const ext = extname(file).toLowerCase();
  if (ext === ".css") return blankCssComments(text);
  if (ext === ".scss") return blankJsComments(text);
  if (JS_EXTS.has(ext)) return blankJsComments(text);
  if (MARKUP_EXTS.has(ext)) return blankCssComments(blankHtmlComments(text));
  return text;
}

const HEX_RE = /(?<![\w&#$])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const FN_RE = /\b(?:rgba?|hsla?|oklch|oklab)\([^()]*\)/gi;

export function normalizeColor(raw) {
  let s = raw.trim().toLowerCase();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length === 8 && h.endsWith("ff")) h = h.slice(0, 6);
    return "#" + h;
  }
  return s.replace(/\s+/g, " ").replace(/\(\s+/, "(").replace(/\s+\)/, ")").replace(/\s*,\s*/g, ", ");
}

/** Colour literals: [{raw, value (normalized), index}]. Skips functions using var(). */
export function findColors(text) {
  const out = [];
  let m;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 6), m.index);
    if (/(href|src|url\(|to)=?["'(]?\s*$/i.test(before)) continue; // "#anchor"-like
    out.push({ raw: m[0], value: normalizeColor(m[0]), index: m.index });
  }
  FN_RE.lastIndex = 0;
  while ((m = FN_RE.exec(text))) {
    if (/var\(/.test(m[0])) continue;
    out.push({ raw: m[0], value: normalizeColor(m[0]), index: m.index });
  }
  return out.sort((a, b) => a.index - b.index);
}

const SPACE_PROP = String.raw`(?:margin|padding|gap|row-?gap|column-?gap|space)(?:-?(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end|x|y|Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd|X|Y))?`;
const DECL_RE = new RegExp(String.raw`(?<![\w-])(${SPACE_PROP})\s*:\s*(['"\x60]?)([^;{}\n]*)`, "gi");
const TW_RE = /(?<![\w-])-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-\[(-?\d*\.?\d+)(px|rem)\]/g;

/**
 * Spacing values in px: [{px, raw, index}] from CSS declarations, JS style objects and
 * Tailwind arbitrary classes. `jsLike` treats bare numbers in style objects as px.
 */
export function findSpacing(text, jsLike = false) {
  const out = [];
  let m;
  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(text))) {
    const quote = m[2];
    let value = m[3];
    if (quote) value = value.split(quote)[0];
    else if (jsLike) value = value.split(/[,}]/)[0];
    const valueStart = m.index + m[0].length - m[3].length;
    if (/var\(|calc\(|\$|theme|\{/.test(value)) continue;
    const re = /(-?\d*\.?\d+)(px|rem)\b/g;
    let v, found = false;
    while ((v = re.exec(value))) {
      found = true;
      const px = v[2] === "rem" ? Number(v[1]) * 16 : Number(v[1]);
      out.push({ px: Math.abs(px), raw: v[0], index: valueStart + v.index });
    }
    if (!found && jsLike && !quote) {
      const n = value.trim().match(/^(-?\d+(?:\.\d+)?)$/);
      if (n) out.push({ px: Math.abs(Number(n[1])), raw: n[1], index: valueStart });
    }
  }
  TW_RE.lastIndex = 0;
  while ((m = TW_RE.exec(text))) {
    const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
    out.push({ px: Math.abs(px), raw: m[0], index: m.index });
  }
  return out;
}
