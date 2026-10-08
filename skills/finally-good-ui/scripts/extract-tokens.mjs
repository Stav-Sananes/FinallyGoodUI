#!/usr/bin/env node
// Extract an existing design system into DTCG-subset tokens plus usage, drift
// and inferred roles. Never executes project code (Tailwind v3 config is read by regex).
import { join, resolve, extname, basename, dirname } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { runCli, isMain } from "./lib/cli.mjs";
import { readText, walk, exists } from "./lib/fs.mjs";
import { blankCssComments, blankJsComments, cssBlocks, declarations } from "./lib/css.mjs";
import { parseColor, oklchString, toHex, toOklch } from "./lib/contrast.mjs";
import { GROUPS, TYPES, parseDimension, parseDuration, parseEasing, parseFontList, groupTokens } from "./lib/tokens.mjs";
import { findColors, findSpacing, stripComments, SOURCE_EXTS, JS_EXTS } from "./lib/scan.mjs";
import { detectStack } from "./detect-stack.mjs";

const HELP = `
Usage: extract-tokens.mjs [--root <dir>] [--files a.css,b.js] [--write [--force]]

Reads the project's design files (from detect-stack, or --files) and prints JSON:
  tokens    DTCG-subset groups (color/font/text/space/radius/shadow/duration/easing), colours as OKLCH,
            dark values in $extensions.fgu.dark (from .dark, [data-theme=dark], prefers-color-scheme)
  usage     colour and px-spacing literals counted across source files
  drift     values used >= 3 times that are not tokens
  inferred  guessed roles from usage [{role, value, count, confidence}]
Sources: CSS custom properties in :root/html/.dark/[data-theme]/@theme blocks, Tailwind v3
theme(.extend) colors/spacing/borderRadius/fontFamily (regex, no execution), *.tokens.json,
MUI palette mains in theme files.

Options:
  --root <dir>    project root (default: cwd)
  --files <list>  comma-separated design files to read instead of detected ones
  --write         write .design/tokens.json (refuses to overwrite unless --force)
  --force         allow overwriting .design/tokens.json
  --help
`;

const PREFIXES = [["color-", "color"], ["font-", "font"], ["text-", "text"], ["spacing-", "space"], ["space-", "space"],
  ["radius-", "radius"], ["shadow-", "shadow"], ["duration-", "duration"], ["ease-", "easing"], ["easing-", "easing"]];

function resolveVars(value, vars, depth = 0) {
  if (depth > 8 || !value.includes("var(")) return value;
  const next = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (all, name, fb) =>
    vars.has(name) ? vars.get(name).value : fb != null ? fb.trim() : all);
  return next === value ? value : resolveVars(next, vars, depth + 1);
}

function colorValue(raw) {
  const s = raw.trim();
  if (/^oklch\(/i.test(s)) return s;
  const c = parseColor(s);
  return c ? oklchString(c) : null;
}

/** Map a custom property (+ resolved value) to [group, name, $value] or null. */
function classify(prop, value) {
  if (prop.slice(2).includes("--")) return null; // e.g. --text-xs--line-height
  let name = prop.slice(2);
  let group = null;
  for (const [p, g] of PREFIXES) if (name.startsWith(p)) { group = g; name = name.slice(p.length); break; }
  if (!group) {
    if (name === "radius") { group = "radius"; name = "base"; }
    else if (name === "spacing") { group = "space"; name = "base"; }
    else if (parseColor(value)) group = "color";
    else return null;
  }
  if (!name) return null;
  switch (group) {
    case "color": { const v = colorValue(value); return v ? [group, name, v] : null; }
    case "font": {
      if (/weight|size|feature|variation/.test(name) || parseDimension(value) || /^\d+$/.test(value.trim())) return null;
      return [group, name, parseFontList(value)];
    }
    case "text": case "space": case "radius": { const d = parseDimension(value); return d ? [group, name, d] : null; }
    case "duration": { const d = parseDuration(value); return d ? [group, name, d] : null; }
    case "easing": { const e = parseEasing(value); return e ? [group, name, e] : null; }
    case "shadow": return [group, name, value.trim()];
  }
  return null;
}

const isDarkCtx = (sel, parents) =>
  /(^|[\s,.:])\.dark\b|data-theme=["']?dark|\[data-mode=["']?dark|\.theme-dark\b/.test(sel) ||
  parents.some((p) => /prefers-color-scheme:\s*dark/.test(p));
const isTokenCtx = (sel) => /:root|^html\b|^@theme\b|\.dark\b|\.light\b|data-theme|data-mode|^\*$|^:host\b/.test(sel);

function readCssVars(text, light, dark, file) {
  for (const b of cssBlocks(blankCssComments(text))) {
    if (!isTokenCtx(b.prelude)) continue;
    const target = isDarkCtx(b.prelude, b.parents) ? dark : light;
    for (const d of declarations(b.own)) if (d.prop.startsWith("--")) target.set(d.prop, { value: d.value, file });
  }
}

// ---- tiny JS object literal reader (for tailwind.config / theme files) ----
function matchBrace(text, open) {
  let depth = 0, q = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

export function parseJsObject(src) {
  let i = 0;
  const ws = () => { while (i < src.length && /[\s,]/.test(src[i])) i++; };
  const str = () => { const q = src[i++]; let s = ""; while (i < src.length && src[i] !== q) { if (src[i] === "\\") i++; s += src[i++]; } i++; return s; };
  const value = () => {
    ws();
    const c = src[i];
    if (c === "{") { const end = matchBrace(src, i); const o = parseJsObject(src.slice(i + 1, end)); i = end + 1; return o; }
    if (c === "[") {
      const end = matchBrace(src, i); const inner = src.slice(i + 1, end); i = end + 1;
      return [...inner.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
    }
    if (c === '"' || c === "'" || c === "`") return str();
    let s = "", depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      if (ch === ")" || ch === "]" || ch === "}") { if (depth === 0) break; depth--; }
      if (ch === "," && depth === 0) break;
      s += ch; i++;
    }
    return { $raw: s.trim() };
  };
  const obj = {};
  while (i < src.length) {
    ws();
    if (i >= src.length) break;
    if (src.startsWith("...", i)) { value(); continue; }
    let key;
    if (src[i] === '"' || src[i] === "'") key = str();
    else { const m = src.slice(i).match(/^[\w$-]+/); if (!m) { i++; continue; } key = m[0]; i += key.length; }
    ws();
    if (src[i] !== ":") continue;
    i++;
    obj[key] = value();
  }
  return obj;
}

function findObject(text, key) {
  const ext = text.search(/\bextend\s*:\s*\{/);
  const re = new RegExp(`(?:^|[\\s,{])["']?${key}["']?\\s*:\\s*\\{`, "g");
  const hits = [...text.matchAll(re)].map((m) => m.index + m[0].length - 1);
  if (!hits.length) return null;
  const pick = hits.find((h) => ext >= 0 && h > ext) ?? hits[0];
  const end = matchBrace(text, pick);
  return end < 0 ? null : parseJsObject(text.slice(pick + 1, end));
}

function flattenObj(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const name = k === "DEFAULT" ? prefix : prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && !("$raw" in v)) out.push(...flattenObj(v, name));
    else out.push([name, v]);
  }
  return out;
}

function readTailwind3(text, add, vars) {
  const src = blankJsComments(text);
  const raw = (v) => (v && typeof v === "object" && "$raw" in v ? v.$raw : v);
  for (const [name, v] of flattenObj(findObject(src, "colors"))) {
    if (typeof raw(v) !== "string") continue;
    const c = colorValue(resolveVars(raw(v), vars).replace(/<alpha-value>/g, "1"));
    if (c && name) add("color", name, c);
  }
  for (const [name, v] of flattenObj(findObject(src, "spacing"))) { const d = parseDimension(raw(v)); if (d && name) add("space", name, d); }
  for (const [name, v] of flattenObj(findObject(src, "borderRadius"))) { const d = parseDimension(raw(v)); if (d) add("radius", name || "base", d); }
  for (const [name, v] of Object.entries(findObject(src, "fontFamily") || {})) {
    const list = Array.isArray(v) ? v : typeof raw(v) === "string" ? parseFontList(raw(v)) : null;
    if (list?.length) add("font", name, list);
  }
}

function readMuiTheme(text, add) {
  const re = /\b(primary|secondary|error|warning|info|success)\s*:\s*\{[^{}]*?\bmain\s*:\s*["'`]([^"'`]+)["'`]/g;
  const names = { error: "destructive" };
  let m;
  while ((m = re.exec(text))) { const c = colorValue(m[2]); if (c) add("color", names[m[1]] || m[1], c); }
}

// ---- usage / drift / inference ----
function countUsage(root, designFiles) {
  const skip = new Set(designFiles);
  const files = walk(root, root, { exts: SOURCE_EXTS, maxFiles: 8000 })
    .filter((f) => !skip.has(f) && !/^tailwind\.config\./.test(basename(f)) && !/\.(test|spec|stories)\./.test(f) &&
      !/(^|\/)(scripts|test|tests|__tests__)\//.test(f));
  const colors = new Map(), spacing = new Map();
  for (const f of files) {
    const text = readText(join(root, f));
    if (text == null || text.length > 500_000) continue;
    const clean = stripComments(f, text);
    for (const c of findColors(clean)) colors.set(c.value, (colors.get(c.value) || 0) + 1);
    for (const s of findSpacing(clean, JS_EXTS.has(extname(f)))) {
      const key = `${Math.round(s.px * 100) / 100}px`;
      spacing.set(key, (spacing.get(key) || 0) + 1);
    }
  }
  const sorted = (m) => [...m].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return { files: files.length, colors: sorted(colors), spacing: sorted(spacing) };
}

const confidence = (count, total) => Math.min(0.9, Math.round((0.3 + Math.min(count, 20) / 40 + (total ? count / total : 0) * 0.2) * 100) / 100);

function inferRoles(usage) {
  const total = usage.colors.reduce((s, c) => s + c.count, 0);
  const rows = usage.colors.map((u) => ({ ...u, o: toOklch(u.value) })).filter((u) => u.o && (u.o.a ?? 1) >= 0.95);
  const pick = (role, pred, used) => {
    const hit = rows.find((r) => pred(r.o) && !used.has(r.value));
    if (!hit) return null;
    used.add(hit.value);
    return { role, value: hit.value, oklch: oklchString(hit.value), count: hit.count, confidence: confidence(hit.count, total) };
  };
  const used = new Set();
  const out = [
    pick("primary", (o) => o.c >= 0.08 && o.l > 0.3 && o.l < 0.85, used),
    pick("destructive", (o) => o.c >= 0.1 && (o.h < 40 || o.h > 345), used),
    pick("background", (o) => o.l >= 0.93 && o.c < 0.03, used),
    pick("foreground", (o) => o.l <= 0.35 && o.c < 0.05, used),
    pick("muted-foreground", (o) => o.l > 0.4 && o.l < 0.75 && o.c < 0.04, used),
    pick("border", (o) => o.l >= 0.8 && o.l < 0.95 && o.c < 0.03, used),
  ].filter(Boolean);
  const sp = usage.spacing.filter((s) => parseFloat(s.value) > 0);
  const n = sp.reduce((a, s) => a + s.count, 0);
  if (n >= 3) {
    const on8 = sp.filter((s) => parseFloat(s.value) % 8 === 0).reduce((a, s) => a + s.count, 0);
    const on4 = sp.filter((s) => parseFloat(s.value) % 4 === 0).reduce((a, s) => a + s.count, 0);
    const base = on8 / n >= 0.8 ? 8 : 4;
    out.push({ role: "space.base", value: `${base}px`, count: n, confidence: Math.round(((base === 8 ? on8 : on4) / n) * 100) / 100 });
  }
  return out;
}

export function extractTokens(rootArg = ".", { files } = {}) {
  const root = resolve(rootArg);
  const warnings = [];
  const designFiles = files?.length ? files : detectStack(root).designFiles;
  const light = new Map(), dark = new Map();
  const tokens = {};
  const sources = [];
  const add = (group, name, $value, darkValue, source) => {
    const g = (tokens[group] ||= {});
    const prev = g[name];
    const tok = { $type: TYPES[group], $value };
    if (darkValue != null) tok.$extensions = { fgu: { dark: darkValue } };
    else if (prev?.$extensions) tok.$extensions = prev.$extensions;
    if (source) tok.$description = `from ${source}`;
    g[name] = tok;
  };

  const cssLike = designFiles.filter((f) => /\.(css|scss|sass|less|vue|svelte)$/.test(f));
  for (const f of cssLike) {
    const text = readText(join(root, f));
    if (text == null) { warnings.push(`cannot read ${f}`); continue; }
    sources.push(f);
    readCssVars(text, light, dark, f);
  }
  const lookup = (prop, map) => (map === dark ? dark.get(prop) ?? light.get(prop) : light.get(prop));
  const resolveIn = (v, map) => resolveVars(v, map === dark ? new Map([...light, ...dark]) : light);
  for (const [prop, { value, file }] of light) {
    const hit = classify(prop, resolveIn(value, light));
    if (!hit) continue;
    const [group, name, $value] = hit;
    let dv = null;
    if (dark.has(prop)) {
      const dh = classify(prop, resolveIn(lookup(prop, dark).value, dark));
      if (dh) dv = dh[2];
    }
    add(group, name, $value, typeof dv === "object" && !Array.isArray(dv) ? undefined : dv, file);
  }
  // dark-only properties still become tokens (value = dark value, flagged)
  for (const [prop, { value, file }] of dark) {
    if (light.has(prop)) continue;
    const hit = classify(prop, resolveIn(value, dark));
    if (hit) { add(hit[0], hit[1], hit[2], hit[2], file); warnings.push(`${prop} defined only for dark mode`); }
  }

  for (const f of designFiles.filter((x) => /^tailwind\.config\./.test(basename(x)))) {
    const text = readText(join(root, f));
    if (text == null) continue;
    sources.push(f);
    readTailwind3(text, (g, n, v) => { if (!tokens[g]?.[n]) add(g, n, v, undefined, f); }, light);
  }
  for (const f of designFiles.filter((x) => /^theme\.(ts|tsx|js|jsx|mjs|cjs)$/.test(basename(x)))) {
    const text = readText(join(root, f));
    if (text == null) continue;
    sources.push(f);
    readMuiTheme(text, (g, n, v) => { if (!tokens[g]?.[n]) add(g, n, v, undefined, f); });
  }
  for (const f of designFiles.filter((x) => x.endsWith(".json"))) {
    let j = null;
    try { j = JSON.parse(readText(join(root, f)) || "null"); } catch { warnings.push(`invalid JSON in ${f}`); }
    if (!j || typeof j !== "object") continue;
    sources.push(f);
    for (const g of GROUPS) for (const [n, t] of groupTokens(j[g])) if (!tokens[g]?.[n]) (tokens[g] ||= {})[n] = t;
  }

  // strip $description noise into a compact form and order groups
  const ordered = {};
  for (const g of GROUPS) if (tokens[g] && Object.keys(tokens[g]).length) ordered[g] = tokens[g];

  const usageAll = countUsage(root, designFiles);
  const tokenHex = new Set();
  for (const [, t] of groupTokens(ordered.color)) {
    for (const v of [t.$value, t.$extensions?.fgu?.dark]) { const h = v && toHex(v); if (h) tokenHex.add(h); }
  }
  const tokenPx = new Set();
  for (const [, t] of groupTokens(ordered.space)) {
    const d = parseDimension(t.$value);
    if (d) tokenPx.add(d.unit === "rem" ? d.value * 16 : d.value);
  }
  const drift = [];
  for (const c of usageAll.colors) {
    if (c.count < 3) continue;
    const h = toHex(c.value);
    if (!h || !tokenHex.has(h)) drift.push({ kind: "color", value: c.value, count: c.count });
  }
  for (const s of usageAll.spacing) {
    if (s.count < 3) continue;
    const px = parseFloat(s.value);
    if (px !== 0 && !tokenPx.has(px)) drift.push({ kind: "spacing", value: s.value, count: s.count });
  }
  const usage = { files: usageAll.files, colors: usageAll.colors, spacing: usageAll.spacing };
  return { tool: "extract-tokens", root: rootArg, sources, tokens: ordered, usage, drift, inferred: inferRoles(usageAll), warnings };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root", "files"], boolean: ["write", "force"] },
    main: ({ flags }) => {
      const rootArg = flags.root || ".";
      const files = flags.files ? flags.files.split(",").map((s) => s.trim()).filter(Boolean) : null;
      const out = extractTokens(rootArg, { files });
      out.written = null;
      if (flags.write) {
        const target = join(resolve(rootArg), ".design", "tokens.json");
        if (exists(target) && !flags.force) {
          out.warnings.push(".design/tokens.json exists; not overwritten (pass --force to replace)");
        } else {
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, JSON.stringify(out.tokens, null, 2) + "\n");
          out.written = ".design/tokens.json";
        }
      }
      return out;
    },
  });
}
