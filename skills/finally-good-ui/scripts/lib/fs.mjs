// File-system helpers: safe reads and a bounded recursive walk.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";

export const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".output", ".vercel", ".turbo", ".cache",
  "dist", "build", "out", "coverage", ".design", "vendor",
]);

export const toPosix = (p) => p.split(sep).join("/");

export function readText(file) {
  try { return readFileSync(file, "utf8"); } catch { return null; }
}

export function readJson(file) {
  const t = readText(file);
  if (t == null) return null;
  try { return JSON.parse(t); } catch { return null; }
}

export const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
export const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };
export { existsSync as exists };

/**
 * Recursively list files under `dir` (absolute), returning paths relative to `root` (posix).
 * opts.exts: Set of extensions (".css") to keep; opts.maxDepth; opts.maxFiles.
 */
export function walk(root, dir = root, opts = {}) {
  const { exts = null, maxDepth = 12, maxFiles = 20000 } = opts;
  const out = [];
  const visit = (d, depth) => {
    if (depth > maxDepth || out.length >= maxFiles) return;
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (out.length >= maxFiles) return;
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name) || (e.name.startsWith(".") && e.name !== ".storybook")) continue;
        visit(full, depth + 1);
      } else if (e.isFile()) {
        if (!exts || exts.has(extname(e.name).toLowerCase())) out.push(toPosix(relative(root, full)));
      }
    }
  };
  visit(dir, 0);
  return out;
}

/** 1-based line number of a character offset, using a precomputed newline index. */
export function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (offset) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}
