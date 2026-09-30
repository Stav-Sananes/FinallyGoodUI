#!/usr/bin/env node
// Layer-1 static checks (spec §5.6). Regex/heuristic based: fast, dependency-free, best effort.
import { join, resolve, relative, isAbsolute, extname, basename } from "node:path";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { readText, readJson, walk, isDir, isFile, toPosix, lineIndex } from "./lib/fs.mjs";
import { cssBlocks, declarations, styleView, markupView } from "./lib/css.mjs";
import { findColors, findSpacing, stripComments, JS_EXTS, MARKUP_EXTS } from "./lib/scan.mjs";
import { RULE_CARDS, DEFAULT_SPACE_SCALE } from "./lib/rules.mjs";
import { groupTokens, parseDimension } from "./lib/tokens.mjs";

const HELP = `
Usage: check-static.mjs [--root <dir>] [--files a,b] [--tokens <tokens.json>]

Static UI checks. Prints {"tool":"check-static","findings":[{rule,severity,file,line,selector,message,card}],
"summary":{high,medium,low}}. Exit code is 0 whenever the scan ran (findings are not errors).
Rules: ${Object.keys(RULE_CARDS).join(", ")}.

Options:
  --root <dir>      project root (default: cwd)
  --files <list>    comma-separated files (relative to root or absolute). Default: scan src/, app/,
                    components/, pages/ and top-level files (css, scss, tsx, jsx, vue, svelte, html, astro)
  --tokens <file>   tokens.json whose space scale replaces the default px scale for off-scale-spacing
  --help
`;

const SCAN_DIRS = ["src", "app", "components", "pages"];
const SCAN_EXTS = new Set([".css", ".scss", ".tsx", ".jsx", ".vue", ".svelte", ".html", ".astro"]);
const LAYOUT_PROPS = /^(width|height|top|left|right|bottom|inset|margin(-[a-z-]+)?|padding(-[a-z-]+)?|(max|min)-(width|height))$/;
const LAYOUT_JS_KEYS = /\b(width|height|top|left|right|bottom|margin\w*|padding\w*|maxHeight|maxWidth|minHeight|minWidth)\s*:/g;
const INFINITE = /infinite|Infinity|animate-(spin|pulse|ping|bounce)/;
const EXEMPT_COLOR_FILE = (f) => {
  const b = basename(f).toLowerCase();
  return /^(globals?|app|index|main|style|styles|variables|vars|colors|palette)\.(css|scss|sass|less)$/.test(b) ||
    /theme|token/.test(b) || /^tailwind\.config\./.test(b) || b.endsWith(".json");
};

function isDefaultScanned(f) {
  return SCAN_EXTS.has(extname(f).toLowerCase()) && !/\.(test|spec)\.[jt]sx?$/.test(f) && !f.endsWith(".d.ts");
}

export function listDefaultFiles(root) {
  const files = [];
  for (const d of SCAN_DIRS) if (isDir(join(root, d))) files.push(...walk(root, join(root, d), { exts: SCAN_EXTS }));
  files.push(...walk(root, root, { exts: SCAN_EXTS, maxDepth: 0 }));
  return [...new Set(files)].filter(isDefaultScanned).sort();
}

function spaceScale(tokensFile) {
  if (!tokensFile) return new Set(DEFAULT_SPACE_SCALE);
  const t = readJson(tokensFile);
  if (!t) throw new UsageError(`cannot read tokens file ${tokensFile}`);
  const s = new Set([0]);
  for (const [, tok] of groupTokens(t.space)) {
    const d = parseDimension(tok.$value);
    if (d) s.add(d.unit === "rem" || d.unit === "em" ? d.value * 16 : d.value);
  }
  return s;
}

/** Scan forward from a "<tag" offset to its closing ">" (respecting quotes and {} braces). */
function tagText(text, start) {
  let depth = 0, q = null;
  for (let i = start + 1; i < text.length && i < start + 4000; i++) {
    const c = text[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth <= 0 && text[i - 1] !== "=") return text.slice(start, i + 1);
  }
  return text.slice(start, start + 400);
}

const lineAt = (text, idx) => {
  const s = text.lastIndexOf("\n", idx - 1) + 1;
  let e = text.indexOf("\n", idx);
  if (e < 0) e = text.length;
  return text.slice(s, e);
};

/** Selector (prelude) of the CSS rule enclosing idx, or "". */
function enclosingSelector(text, idx) {
  const open = text.lastIndexOf("{", idx), close = text.lastIndexOf("}", idx);
  if (open < 0 || open < close) return "";
  const start = Math.max(text.lastIndexOf("}", open), text.lastIndexOf(";", open), text.lastIndexOf("{", open - 1));
  return text.slice(start + 1, open).trim();
}

/** Text of the {...} region enclosing idx (for "infinite" look-ups). */
function enclosingBody(text, idx) {
  const open = text.lastIndexOf("{", idx);
  const close = text.indexOf("}", idx);
  if (open < 0) return lineAt(text, idx);
  return text.slice(open, close < 0 ? text.length : close + 1);
}

function durationsMs(prop, value) {
  const times = [];
  const isShorthand = /^(transition|animation)$/i.test(prop);
  for (const part of value.split(",")) {
    const all = [...part.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)].map((m) => (m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1])));
    if (!all.length) continue;
    if (isShorthand) times.push(all[0]); else times.push(...all);
  }
  return times;
}

export function checkFile(rel, text, ctx) {
  const findings = [];
  const ext = extname(rel).toLowerCase();
  const isCss = ext === ".css" || ext === ".scss" || ext === ".sass" || ext === ".less";
  const isMarkup = MARKUP_EXTS.has(ext);
  const isJs = JS_EXTS.has(ext);
  const clean = stripComments(rel, text);
  const css = isCss ? clean : isMarkup ? styleView(clean) : "";
  const markup = isMarkup ? markupView(clean) : isJs ? clean : "";
  const line = lineIndex(text);
  const seen = new Set();
  const add = (rule, idx, severity, message) => {
    const ln = line(idx);
    const key = `${rule}:${ln}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ rule, severity, file: rel, line: ln, selector: null, message, card: RULE_CARDS[rule] });
  };
  const each = (re, src, fn) => { re.lastIndex = 0; let m; while ((m = re.exec(src))) fn(m); };

  // ---- motion signals (for the project-level reduced-motion rule)
  if (!ctx.motionAt) {
    const sig = /(?<![\w-])(?:transition|animation)(?:-[a-z]+)?\s*:\s*(?!\s*none)|@keyframes|(?<![\w-])(?:transition(?:-\w+)?|animate-[\w-]+)(?=[\s"'`])|from\s+["'](?:motion\/react|motion|framer-motion|gsap)["']/;
    const m = clean.match(sig);
    if (m) ctx.motionAt = { file: rel, line: line(m.index) };
  }
  if (/prefers-reduced-motion|motion-safe:|motion-reduce:|useReducedMotion|reducedMotion|MotionConfig/.test(clean)) ctx.guarded = true;

  // ---- no-transition-all
  each(/transition(?:-property|Property)?\s*:\s*['"`]?\s*all\b/gi, clean, (m) =>
    add("no-transition-all", m.index, "medium", "Transitioning `all` animates layout and colour properties you did not intend; list only transform/opacity (or the specific colour props)."));
  each(/(?<![\w-])transition-all(?![\w-])/g, markup, (m) =>
    add("no-transition-all", m.index, "medium", "`transition-all` animates every property; use `transition-transform`/`transition-opacity` or `transition-colors`."));
  each(/(?<![\w-])transition\s*:\s*['"`]?\s*\d*\.?\d+m?s\b/gi, clean, (m) =>
    add("no-transition-all", m.index, "medium", "A transition shorthand without a property defaults to `all`; name the property (transform, opacity)."));

  // ---- animate-layout-prop
  each(/transition(?:-property|Property)?\s*:\s*(['"`]?)([^;{}\n]+)/gi, clean, (m) => {
    const value = m[1] ? m[2].split(m[1])[0] : m[2];
    const props = value.split(",").map((p) => p.trim().split(/\s+/)[0].toLowerCase());
    const bad = props.filter((p) => LAYOUT_PROPS.test(p));
    if (bad.length) add("animate-layout-prop", m.index, "medium", `Transitioning ${bad.join(", ")} triggers layout every frame; animate transform/opacity instead (or use a FLIP/grid-rows technique).`);
  });
  each(/(?<![\w-])transition-\[([^\]]+)\]/g, markup, (m) => {
    const bad = m[1].split(",").map((s) => s.trim()).filter((p) => LAYOUT_PROPS.test(p));
    if (bad.length) add("animate-layout-prop", m.index, "medium", `Transitioning ${bad.join(", ")} triggers layout; animate transform/opacity.`);
  });
  if (css) {
    for (const b of cssBlocks(css)) {
      if (!b.parents.some((p) => /^@(-webkit-)?keyframes\b/.test(p))) continue;
      for (const d of declarations(b.own)) {
        if (LAYOUT_PROPS.test(d.prop)) add("animate-layout-prop", b.bodyStart + d.offset, "medium", `@keyframes animates \`${d.prop}\` (layout); use transform/opacity.`);
      }
    }
  }
  if (markup) {
    each(/\b(?:animate|initial|exit|whileHover|whileTap|whileInView|whileFocus)\s*=\s*\{\{([^}]*)\}\}/g, markup, (m) => {
      const inner = m[1];
      LAYOUT_JS_KEYS.lastIndex = 0;
      const k = LAYOUT_JS_KEYS.exec(inner);
      if (k) add("animate-layout-prop", m.index, "medium", `Motion animates \`${k[1]}\` (layout); prefer transform (x/y/scale) or the layout prop.`);
    });
    each(/\bgsap\.(?:to|from|fromTo)\([^)]*?\{([^}]*)\}/g, markup, (m) => {
      LAYOUT_JS_KEYS.lastIndex = 0;
      const k = LAYOUT_JS_KEYS.exec(m[1]);
      if (k) add("animate-layout-prop", m.index, "medium", `GSAP tween animates \`${k[1]}\` (layout); prefer x/y/scale/autoAlpha.`);
    });
  }

  // ---- long-duration
  const judge = (idx, ms, what) => {
    if (ms > 500) add("long-duration", idx, "high", `${what} ${Math.round(ms)}ms exceeds the 500ms ceiling (spec §4); routine UI stays ≤300ms.`);
    else if (ms > 300) add("long-duration", idx, "medium", `${what} ${Math.round(ms)}ms is over 300ms; reserve long/hero durations for rare moments.`);
  };
  each(/(?<![\w-])(transition(?:-duration)?|animation(?:-duration)?|transitionDuration|animationDuration)\s*:\s*(['"`]?)([^;{}\n]+)/gi, clean, (m) => {
    const value = m[2] ? m[3].split(m[2])[0] : m[3];
    if (INFINITE.test(value) || INFINITE.test(enclosingBody(clean, m.index))) return;
    if (/backdrop|overlay/i.test(enclosingSelector(clean, m.index) + lineAt(clean, m.index))) return;
    const ms = durationsMs(m[1].replace(/Duration$/, "-duration").toLowerCase(), value);
    if (ms.length) judge(m.index, Math.max(...ms), "Duration");
  });
  if (markup) {
    each(/\bduration\s*:\s*(\d*\.?\d+)(?![\w.%])(?!\s*(?:ms|s)\b)/g, markup, (m) => {
      const win = markup.slice(Math.max(0, m.index - 200), m.index + 200);
      if (/Infinity|repeat:\s*-1/.test(win)) return;
      const n = Number(m[1]);
      judge(m.index, n < 10 ? n * 1000 : n, "Duration");
    });
    each(/(?<![\w-])duration-(?:(\d+)|\[(\d*\.?\d+)(ms|s)\])(?![\w-])/g, markup, (m) => {
      if (INFINITE.test(lineAt(markup, m.index))) return;
      const ms = m[1] ? Number(m[1]) : m[3] === "s" ? Number(m[2]) * 1000 : Number(m[2]);
      judge(m.index, ms, "Duration");
    });
  }

  // ---- ease-in-entrance
  const exitCtx = (idx) => /exit|leave|leaving|hide|hiding|clos|dismiss|out\b/i.test(enclosingSelector(clean, idx) + " " + lineAt(clean, idx));
  each(/(?<![\w-])ease-in(?!-out)(?![\w-])/g, clean, (m) => {
    if (!exitCtx(m.index)) add("ease-in-entrance", m.index, "medium", "`ease-in` starts slow, so entrances feel laggy; use an enter (decelerate) curve such as var(--ease-enter). Keep ease-in for exits only.");
  });
  each(/['"`](?:easeIn|(?:power\d|sine|expo|circ|quad|cubic|quart|quint)\.in)['"`]/g, markup, (m) => {
    if (!exitCtx(m.index)) add("ease-in-entrance", m.index, "medium", "Accelerating ease on an entrance feels laggy; use an enter/decelerate curve.");
  });

  // ---- scale-from-zero
  const scaleMsg = "Scaling from 0 makes elements appear from nowhere; start near 0.9–0.95 with opacity 0.";
  each(/\bscale(?:3d)?\(\s*0(?:\.0+)?\s*(?:,\s*0(?:\.0+)?\s*)*\)/g, clean, (m) => add("scale-from-zero", m.index, "medium", scaleMsg));
  each(/(?<![\w-])scale\s*:\s*['"]?0(?![.\d])/g, clean, (m) => add("scale-from-zero", m.index, "medium", scaleMsg));
  each(/(?<![\w-])scale-0(?![\w-])/g, markup, (m) => add("scale-from-zero", m.index, "medium", scaleMsg));

  // ---- hardcoded-color
  if (!EXEMPT_COLOR_FILE(rel)) {
    const byLine = new Map();
    for (const c of findColors(isMarkup ? clean : isCss ? css : clean)) {
      const declStart = Math.max(clean.lastIndexOf(";", c.index), clean.lastIndexOf("{", c.index), clean.lastIndexOf("\n", c.index));
      if (/^\s*--[\w-]+\s*:/.test(clean.slice(declStart + 1, c.index))) continue; // defining a custom property
      if (/theme-color|mask-icon/.test(lineAt(clean, c.index))) continue;
      const ln = line(c.index);
      if (!byLine.has(ln)) byLine.set(ln, { idx: c.index, vals: [] });
      byLine.get(ln).vals.push(c.raw);
    }
    for (const { idx, vals } of byLine.values())
      add("hardcoded-color", idx, "medium", `Hard-coded colour ${[...new Set(vals)].join(", ")}; use a semantic token (var(--color-*) or its utility).`);
  }

  // ---- off-scale-spacing
  {
    const byLine = new Map();
    for (const s of findSpacing(clean, isJs)) {
      if (ctx.scale.has(Math.round(s.px * 100) / 100)) continue;
      const ln = line(s.index);
      if (!byLine.has(ln)) byLine.set(ln, { idx: s.index, vals: [] });
      byLine.get(ln).vals.push(`${Math.round(s.px * 100) / 100}px`);
    }
    for (const { idx, vals } of byLine.values())
      add("off-scale-spacing", idx, "low", `Spacing ${[...new Set(vals)].join(", ")} is off the spacing scale (${[...ctx.scale].sort((a, b) => a - b).join("/")}px); snap to a space token.`);
  }

  // ---- outline-none-no-focus
  const focusMsg = "Focus outline removed without a :focus-visible replacement; keyboard users lose their place.";
  if (css) {
    const blocks = cssBlocks(css);
    const bases = (sel) => sel.split(",").map((s) => s.replace(/::?[\w-]+(\([^)]*\))?/g, "").trim()).filter(Boolean);
    const fvBases = new Set(blocks.filter((b) => /focus-visible/.test(b.prelude)).flatMap((b) => bases(b.prelude)));
    for (const b of blocks) {
      if (/focus-visible/.test(b.prelude) || /focus-visible/.test(b.own)) continue;
      for (const d of declarations(b.own)) {
        if (!/^outline(-style)?$/.test(d.prop) || !/^(none|0)(\s|!|$)/.test(d.value)) continue;
        if (bases(b.prelude).some((x) => fvBases.has(x))) continue;
        add("outline-none-no-focus", b.bodyStart + d.offset, "high", focusMsg);
      }
    }
  }
  if (markup) {
    const ok = (idx) => /focus-visible|focus:ring|focus:border|focus:shadow|focus:outline-(?!none)/.test(lineAt(markup, idx));
    each(/(?<![\w-])outline-none(?![\w-])/g, markup, (m) => { if (!ok(m.index)) add("outline-none-no-focus", m.index, "high", focusMsg); });
    each(/\boutline\s*:\s*['"`](?:none|0)['"`]/g, markup, (m) => { if (!ok(m.index)) add("outline-none-no-focus", m.index, "high", focusMsg); });
  }

  // ---- img-no-alt / div-onclick / small-input-font (tags)
  if (markup) {
    each(/<(img|Image)\b/g, markup, (m) => {
      const tag = tagText(markup, m.index);
      if (/\s(?::|v-bind:|\[attr\.)?alt\]?\s*=|\salt(?=[\s/>])|\{\s*\.\.\./.test(tag)) return;
      add("img-no-alt", m.index, "high", "Image without alt; add a description, or alt=\"\" if decorative.");
    });
    each(/<(div|span|li|td)\b/g, markup, (m) => {
      const tag = tagText(markup, m.index);
      if (!/\s(?:onClick|onclick|@click|v-on:click|on:click|\(click\))\s*=/.test(tag)) return;
      const role = /\srole\s*=/.test(tag), tab = /\s(?:tabIndex|tabindex|:tabindex)\s*=/.test(tag);
      if (role && tab) return;
      add("div-onclick", m.index, "high", `Clickable <${m[1]}> is not keyboard or screen-reader accessible; use <button>/<a> (or add role, tabIndex and key handlers).`);
    });
    each(/<(input|select|textarea|Input|Select|Textarea)\b/g, markup, (m) => {
      const tag = tagText(markup, m.index);
      const cls = (tag.match(/\s(?:className|class)\s*=\s*(?:\{?\s*)?(["'`])([^"'`]*)\1/) || [])[2] || "";
      const small = cls.match(/(?<![\w:-])text-(xs|sm)(?![\w-])/);
      if (small) add("small-input-font", m.index, "medium", `Form control uses text-${small[1]} (<16px) at mobile size; iOS zooms the page on focus. Use text-base (optionally md:text-sm).`);
    });
  }
  if (css) {
    for (const b of cssBlocks(css)) {
      if (/::?placeholder/.test(b.prelude) || !/(^|[\s>+~,(])(input|select|textarea)(?![\w-])/.test(b.prelude)) continue;
      if (b.parents.some((p) => /min-width/.test(p))) continue;
      for (const d of declarations(b.own)) {
        if (d.prop !== "font-size" && d.prop !== "font") continue;
        const v = d.value.match(/(\d*\.?\d+)(px|rem|em)\b/);
        if (!v) continue;
        const px = v[2] === "px" ? Number(v[1]) : Number(v[1]) * 16;
        if (px < 16) add("small-input-font", b.bodyStart + d.offset, "medium", `Form control font-size ${v[0]} (<16px); iOS zooms the page on focus. Use at least 16px on mobile.`);
      }
    }
  }

  // ---- user-scalable-no
  const zoomMsg = "Viewport disables or limits zoom; users with low vision cannot enlarge the page (WCAG 1.4.4).";
  each(/<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/gi, markup || clean, (m) => {
    const bad = m[0].match(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*(\d*\.?\d+)/i);
    if (bad && (bad[1] || Number(bad[2]) < 2)) add("user-scalable-no", m.index, "high", zoomMsg);
  });
  if (isJs) {
    each(/\buserScalable\s*:\s*(?:false|['"]no['"])/g, clean, (m) => add("user-scalable-no", m.index, "high", zoomMsg));
    each(/\bmaximumScale\s*:\s*(\d*\.?\d+)/g, clean, (m) => { if (Number(m[1]) < 2) add("user-scalable-no", m.index, "high", zoomMsg); });
  }

  return findings;
}

export function checkStatic(rootArg = ".", { files, tokens } = {}) {
  const root = resolve(rootArg);
  const ctx = { scale: spaceScale(tokens ? resolve(root, tokens) : null), motionAt: null, guarded: false };
  const defaults = listDefaultFiles(root);
  const targets = files?.length
    ? files.map((f) => toPosix(isAbsolute(f) ? relative(root, f) : f)).filter((f) => isFile(join(root, f)))
    : defaults;
  const findings = [];
  for (const rel of targets) {
    const text = readText(join(root, rel));
    if (text == null || text.length > 1_000_000) continue;
    findings.push(...checkFile(rel, text, ctx));
  }
  if (ctx.motionAt && !ctx.guarded && files?.length) {
    // single-file runs: look for a reduced-motion guard anywhere in the project before flagging
    for (const rel of defaults) {
      const t = readText(join(root, rel));
      if (t && /prefers-reduced-motion|motion-safe:|motion-reduce:|useReducedMotion|reducedMotion|MotionConfig/.test(t)) { ctx.guarded = true; break; }
    }
  }
  if (ctx.motionAt && !ctx.guarded) {
    findings.push({ rule: "no-reduced-motion", severity: "medium", file: ctx.motionAt.file, line: ctx.motionAt.line, selector: null,
      message: "The project animates but never honours prefers-reduced-motion; add a reduced-motion policy (keep opacity/colour, drop movement).",
      card: RULE_CARDS["no-reduced-motion"] });
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const summary = { high: 0, medium: 0, low: 0 };
  for (const f of findings) summary[f.severity]++;
  return { tool: "check-static", root: rootArg, files: targets.length, findings, summary };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root", "files", "tokens"] },
    main: ({ flags }) => {
      const files = flags.files ? flags.files.split(",").map((s) => s.trim()).filter(Boolean) : null;
      return checkStatic(flags.root || ".", { files, tokens: flags.tokens });
    },
  });
}
