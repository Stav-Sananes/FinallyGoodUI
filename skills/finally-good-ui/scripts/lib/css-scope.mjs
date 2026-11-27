// CSS selector scoping: component stylesheets are keyed on the component's own attribute
// (data-fgu="<name>") so that two components that both have a [data-part="root"] never collide.
// mapSelectors walks style rules (recursing into @media, @supports, @starting-style, @layer, @container),
// leaves @keyframes and other at-rules alone, and keeps comments between rules.

/** Splits at commas that are not inside (), [] or quotes. */
export function splitTop(list) {
  const parts = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) { parts.push(list.slice(start, i)); start = i + 1; }
  }
  parts.push(list.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Index just past the comment or string that starts at `i`, else i (quotes and comments hide braces and semicolons). */
function skipOpaque(css, i) {
  const c = css[i];
  if (c === "/" && css[i + 1] === "*") { const end = css.indexOf("*/", i + 2); return end < 0 ? css.length : end + 2; }
  if (c === '"' || c === "'") {
    for (let j = i + 1; j < css.length; j++) { if (css[j] === "\\") j++; else if (css[j] === c) return j + 1; }
    return css.length;
  }
  return i;
}

/** Index of the first `{` or `;` at or after `from` outside comments, strings and parentheses: { index, ch } or null. */
function findStop(css, from) {
  let paren = 0;
  for (let i = from; i < css.length;) {
    const next = skipOpaque(css, i);
    if (next !== i) { i = next; continue; }
    const c = css[i];
    if (c === "(") paren++; else if (c === ")") paren--;
    else if (paren <= 0 && (c === "{" || c === ";")) return { index: i, ch: c };
    i++;
  }
  return null;
}

/** Index of the brace closing the one opened at `open`; comments and strings do not count. */
function closeOf(css, open) {
  let depth = 0;
  for (let i = open; i < css.length;) {
    const next = skipOpaque(css, i);
    if (next !== i) { i = next; continue; }
    const c = css[i];
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
    i++;
  }
  throw new Error("unbalanced braces in component css");
}

const GROUPING = /^@(media|supports|starting-style|layer|container)\b/;

/** Applies `fn(selector)` to every selector of every style rule; @keyframes and other at-rules pass through,
 *  and so do statements ending in `;` (@layer a, b; @import; @charset). */
export function mapSelectors(text, fn) {
  let out = "", i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const lead = rest.match(/^\s*(\/\*[\s\S]*?\*\/)\s*/); // comments between rules are kept (the profile layer's header is one)
    if (lead) { out += `${lead[1]}\n`; i += lead[0].length; continue; }
    const stop = findStop(text, i);
    if (!stop) break;
    if (stop.ch === ";") { out += `${text.slice(i, stop.index + 1).trim()}\n`; i = stop.index + 1; continue; }
    const open = stop.index;
    const head = text.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const end = closeOf(text, open);
    const body = text.slice(open + 1, end);
    if (head.startsWith("@")) out += GROUPING.test(head) ? `${head} {\n${mapSelectors(body, fn)}}\n` : `${head} {${body}}\n`;
    else out += `${splitTop(head).map(fn).join(",\n")} {${body}}\n`;
    i = end + 1;
  }
  return out;
}

/** Prefixes every selector with `scope ` (descendant). */
export const scopeCss = (text, scope) => mapSelectors(text, (s) => `${scope} ${s}`);

/** The attribute selector that scopes component `name`. */
export const scopeOf = (name) => `[data-fgu="${name}"]`;

/** One selector, scoped to its component: the root part is the scoped element itself (compound), every other part a descendant of it. */
export function scopeSelector(name, selector) {
  const scope = scopeOf(name);
  const s = selector.trim();
  return s.startsWith('[data-part="root"]') ? `${scope}${s}` : `${scope} ${s}`;
}

/** A component stylesheet with every selector scoped to the component. Idempotent. */
export function scopeComponentCss(name, text) {
  const scope = scopeOf(name);
  return mapSelectors(text, (s) => (s.trim().startsWith(scope) ? s.trim() : scopeSelector(name, s)));
}

/** The selector of one part of component `name`: the root is the scoped element, every other part a descendant. */
export const partSelector = (name, part) => (part === "root" ? `${scopeOf(name)}[data-part="root"]` : `${scopeOf(name)} [data-part="${part}"]`);
