// Lightweight CSS helpers: comment blanking (offset-preserving), <style> extraction,
// and a brace-matching block scanner. Best effort, not a full CSS parser.

const blank = (s) => s.replace(/[^\n]/g, " ");

/** Replace /* *\/ comments with spaces (keeps offsets and newlines). */
export function blankCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, blank);
}

/** Blank JS/TS comments (block + line) while respecting simple strings. Offsets preserved. */
export function blankJsComments(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i], d = text[i + 1];
    if (c === "/" && d === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += blank(text.slice(i, stop));
      i = stop;
    } else if (c === "/" && d === "/" && text[i - 1] !== ":" && text[i - 1] !== "\\") {
      let end = text.indexOf("\n", i);
      if (end === -1) end = n;
      out += blank(text.slice(i, end));
      i = end;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && text[j] !== c && !(c !== "`" && text[j] === "\n")) { if (text[j] === "\\") j++; j++; }
      out += text.slice(i, j + 1);
      i = j + 1;
    } else { out += c; i++; }
  }
  return out;
}

export const blankHtmlComments = (text) => text.replace(/<!--[\s\S]*?-->/g, blank);

/** Keep only the contents of <style> elements (everything else blanked). */
export function styleView(text) {
  let out = blank(text).split("");
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(text))) {
    const start = m.index + m[0].indexOf(">") + 1;
    for (let k = 0; k < m[1].length; k++) out[start + k] = m[1][k];
  }
  return out.join("");
}

/** Blank <style> contents (so markup rules don't see CSS). */
export function markupView(text) {
  return text.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, a, b, c) => a + blank(b) + c);
}

/**
 * Scan CSS text into blocks. Returns [{prelude, start, bodyStart, bodyEnd, parents, own}]
 *  prelude: selector or at-rule text before "{"
 *  own: body text with nested blocks removed (declarations only)
 *  parents: preludes of enclosing blocks (outermost first)
 */
export function cssBlocks(text) {
  const blocks = [];
  const stack = [];
  let segStart = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === "\\") i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === "{") {
      const prelude = text.slice(segStart, i).trim();
      stack.push({ prelude, start: segStart, bodyStart: i + 1, children: [] });
      segStart = i + 1;
    } else if (c === "}") {
      const b = stack.pop();
      if (!b) { segStart = i + 1; continue; }
      b.bodyEnd = i;
      b.parents = stack.map((s) => s.prelude);
      let own = text.slice(b.bodyStart, b.bodyEnd);
      for (const ch of b.children.slice().reverse()) {
        const a = ch.start - b.bodyStart, z = ch.bodyEnd + 1 - b.bodyStart;
        own = own.slice(0, a) + blank(own.slice(a, z)) + own.slice(z);
      }
      b.own = own;
      if (stack.length) stack[stack.length - 1].children.push(b);
      delete b.children;
      blocks.push(b);
      segStart = i + 1;
    } else if (c === ";") {
      segStart = i + 1;
    }
  }
  return blocks;
}

/** Parse declarations from a block's own text: [{prop, value, offset}] (offset relative to own). */
export function declarations(own) {
  const out = [];
  const re = /(^|[;{\s])(--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;]*)/g;
  let m;
  while ((m = re.exec(own))) {
    const value = m[3].trim();
    if (!value) continue;
    out.push({ prop: m[2].toLowerCase().startsWith("--") ? m[2] : m[2].toLowerCase(), value, offset: m.index + m[1].length });
  }
  return out;
}
