// Which CSS custom properties a project defines, and which a component stylesheet needs. A component's css is written
// against the skill's token names (--size-control-md, --z-toast, --border-width-strong ...); a project with an older token
// set silently loses min-height, z-index and easings when one is missing.
import { join, dirname } from "node:path";
import { walk, readText, exists, isDir } from "./fs.mjs";
import { loadTokens } from "./token-files.mjs";
import { emitCss } from "../emit-tokens.mjs";

const STYLE_EXTS = new Set([".css", ".scss", ".sass", ".less", ".html", ".vue", ".svelte", ".astro"]);
const DEFINITION = /(?<![\w-])(--[\w-]+)\s*:/g;

/** Custom properties a stylesheet uses with no fallback (var(--x), not var(--x, 1px)), minus the ones it defines itself. */
export function usedVars(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const own = new Set([...clean.matchAll(DEFINITION)].map((m) => m[1]));
  const used = new Set([...clean.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]));
  return [...used].filter((v) => !own.has(v)).sort();
}

/** Custom properties the project defines: .design/tokens.json as emitted, plus every stylesheet outside scaffolded component
 *  folders. null when the project defines none at all (no token set to compare with). */
export function definedVars(root) {
  if (!isDir(root)) return null;
  const defined = new Set();
  const tokens = join(root, ".design/tokens.json");
  if (exists(tokens)) {
    try { for (const m of emitCss(loadTokens(tokens)).matchAll(DEFINITION)) defined.add(m[1]); } catch { /* an unreadable token file defines nothing */ }
  }
  const files = walk(root, root, { exts: STYLE_EXTS, maxDepth: 8, maxFiles: 4000 });
  for (const f of files) {
    if (exists(join(root, dirname(f), ".fgu-component.json"))) continue; // a scaffolded component's own css defines nothing the project owns
    const text = readText(join(root, f));
    if (text && text.length < 2_000_000) for (const m of text.matchAll(DEFINITION)) defined.add(m[1]);
  }
  return defined.size ? defined : null;
}
