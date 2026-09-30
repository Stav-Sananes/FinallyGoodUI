// Minimal YAML subset parser for canon cards and interview questions:
//   key: scalar | "quoted" | 'quoted' | null | true/false | number
//   key: [inline, "list"]
//   key:            key:            key: |  / key: >
//     - item          sub: value      block text
// Nesting: one level of map or list under a key. Comments (# ...) outside quotes.

function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === "\\" && q === '"') { i++; continue; }
      if (c === q) { if (q === "'" && line[i + 1] === "'") { i++; continue; } q = null; }
    } else if (c === '"' || c === "'") {
      if (i === 0 || /[\s:[,\-]/.test(line[i - 1])) q = c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

function unquote(s) {
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    try { return JSON.parse(s); } catch { return s.slice(1, -1).replace(/\\"/g, '"'); }
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) return s.slice(1, -1).replace(/''/g, "'");
  return null;
}

export function parseScalar(raw) {
  const s = raw.trim();
  if (s === "") return "";
  const q = unquote(s);
  if (q !== null) return q;
  if (s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith("[") && s.endsWith("]")) return parseInlineList(s);
  return s;
}

function parseInlineList(s) {
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  const items = [];
  let cur = "", q = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q) {
      cur += c;
      if (c === "\\" && q === '"') { cur += inner[++i] ?? ""; continue; }
      if (c === q) q = null;
    } else if (c === '"' || c === "'") { q = c; cur += c; }
    else if (c === ",") { items.push(cur); cur = ""; }
    else cur += c;
  }
  items.push(cur);
  return items.map((x) => parseScalar(x)).filter((x) => x !== "");
}

const indentOf = (l) => l.match(/^ */)[0].length;
const KEY_RE = /^([A-Za-z0-9_.\-$]+)\s*:(?:\s+(.*)|\s*)$/;

/** Parse a YAML-subset document. Returns a plain object. */
export function parseYaml(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  return parseMap(lines, 0, lines.length, 0).value;
}

function parseMap(lines, start, end, baseIndent) {
  const obj = {};
  let i = start;
  let lastKey = null;
  while (i < end) {
    const rawLine = lines[i];
    if (!rawLine.trim() || /^\s*#/.test(rawLine)) { i++; continue; }
    const ind = indentOf(rawLine);
    if (ind < baseIndent) break;
    const line = stripComment(rawLine).slice(ind);
    const m = line.match(KEY_RE);
    if (!m || ind > baseIndent) {
      // continuation of a plain multi-line scalar
      if (lastKey && typeof obj[lastKey] === "string") obj[lastKey] += " " + line.trim();
      i++;
      continue;
    }
    const key = m[1];
    const rest = (m[2] ?? "").trim();
    lastKey = key;
    i++;
    if (rest === "|" || rest === ">" || rest === "|-" || rest === ">-") {
      const block = [];
      let blockIndent = null;
      while (i < end) {
        const l = lines[i];
        if (l.trim() && indentOf(l) <= baseIndent) break;
        if (l.trim() && blockIndent === null) blockIndent = indentOf(l);
        block.push(l.slice(blockIndent ?? 0));
        i++;
      }
      while (block.length && !block[block.length - 1].trim()) block.pop();
      obj[key] = rest.startsWith("|") ? block.join("\n") : block.map((b) => b.trim()).join(" ").replace(/\s+/g, " ").trim();
      continue;
    }
    if (rest !== "") { obj[key] = parseScalar(rest); continue; }
    // nested block: find its extent
    let j = i;
    while (j < end && (!lines[j].trim() || /^\s*#/.test(lines[j]) || indentOf(lines[j]) > baseIndent ||
      (indentOf(lines[j]) === baseIndent && /^\s*- /.test(lines[j])))) j++;
    const first = lines.slice(i, j).find((l) => l.trim() && !/^\s*#/.test(l));
    if (!first) { obj[key] = null; i = j; continue; }
    if (/^\s*-(\s|$)/.test(first)) obj[key] = parseList(lines, i, j);
    else obj[key] = parseMap(lines, i, j, indentOf(first)).value;
    i = j;
  }
  return { value: obj, next: i };
}

function parseList(lines, start, end) {
  const out = [];
  for (let i = start; i < end; i++) {
    const l = lines[i];
    if (!l.trim() || /^\s*#/.test(l)) continue;
    const s = stripComment(l).trim();
    if (s.startsWith("- ") || s === "-") out.push(parseScalar(s.slice(1)));
    else if (out.length && typeof out[out.length - 1] === "string") out[out.length - 1] += " " + s;
  }
  return out;
}
