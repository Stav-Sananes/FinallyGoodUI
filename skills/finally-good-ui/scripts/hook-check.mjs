#!/usr/bin/env node
// PostToolUse hook (Layer 1 verify). Runs check-static on the file just edited
// and feeds high/medium findings back to Claude. Silent unless the project has
// opted in by having a .design/ folder, so it never nags unrelated projects.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const UI_EXT = new Set([".css", ".scss", ".tsx", ".jsx", ".js", ".mjs", ".vue", ".svelte", ".html", ".astro"]);
const here = dirname(fileURLToPath(import.meta.url));

function done() { process.exit(0); }

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { done(); }

const file = input?.tool_input?.file_path;
const cwd = input?.cwd || process.cwd();
if (!file || !UI_EXT.has(extname(file).toLowerCase())) done();
if (!existsSync(join(cwd, ".design"))) done();

try {
  const cfg = JSON.parse(readFileSync(join(cwd, ".design", "config.json"), "utf8"));
  if (cfg.hook === "off") done();
} catch { /* no config: default on */ }

const res = spawnSync(process.execPath, [join(here, "check-static.mjs"), "--root", cwd, "--files", file], {
  encoding: "utf8",
  timeout: 15000,
});
let out;
try { out = JSON.parse(res.stdout); } catch { done(); }

const findings = (out?.findings || []).filter((f) => f.severity === "high" || f.severity === "medium");
if (!findings.length) done();

const rel = relative(cwd, file) || file;
const lines = findings.slice(0, 8).map(
  (f) => `- ${f.severity.toUpperCase()} ${f.rule} at ${rel}:${f.line ?? "?"}: ${f.message} [canon: ${f.card}]`
);
if (findings.length > 8) lines.push(`- …and ${findings.length - 8} more (run check-static.mjs for all)`);

const context =
  `finally-good-ui static check found ${findings.length} issue(s) in the file you just edited:\n` +
  lines.join("\n") +
  `\nFix them now unless the brief/decisions.md justifies the exception (then note it in decisions.md).`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context },
}));
done();
