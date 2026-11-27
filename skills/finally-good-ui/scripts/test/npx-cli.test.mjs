import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fx, tmp, SR } from "./_h.mjs";
import { formatText, formatGithub, failsAt } from "../lib/report.mjs";

// The published `npx finally-good-ui` entry point: the same checks as check-static,
// for people and CI without the Claude Code plugin.
const REPO = join(SR, "..", "..");
const BIN = join(REPO, "bin", "finally-good-ui.mjs");
const cli = (args, cwd = REPO) => {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8", cwd });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

const finding = (over) => ({ rule: "dead-control", severity: "high", file: "src/A.tsx", line: 7, selector: null,
  message: "Link goes nowhere.", card: "craft.nothing-dead", ...over });
const result = (findings) => {
  const summary = { high: 0, medium: 0, low: 0 };
  for (const f of findings) summary[f.severity]++;
  return { tool: "check-static", root: ".", files: 3, findings, summary };
};

test("failsAt: threshold is inclusive, 'none' never fails", () => {
  const s = { high: 0, medium: 1, low: 2 };
  assert.equal(failsAt(s, "high"), false);
  assert.equal(failsAt(s, "medium"), true);
  assert.equal(failsAt(s, "low"), true);
  assert.equal(failsAt({ high: 5, medium: 0, low: 0 }, "none"), false);
});

test("formatText groups findings by file and ends with a summary", () => {
  const out = formatText(result([finding(), finding({ line: 9, severity: "low", rule: "buzzword", message: "Buzzword.", card: "writing.plain-claims" }),
    finding({ file: "src/b.css", line: 2, severity: "medium", rule: "no-transition-all", message: "Name the properties.", card: "motion.compositor-only" })]));
  const lines = out.trimEnd().split("\n");
  assert.equal(lines[0], "src/A.tsx");
  assert.match(lines[1], /^ {2}7\s+high\s+dead-control\s+Link goes nowhere\. \(craft\.nothing-dead\)$/);
  assert.match(lines[2], /^ {2}9\s+low\s+buzzword/);
  assert.ok(lines.includes("src/b.css"));
  assert.equal(lines.at(-1), "3 findings (1 high, 1 medium, 1 low) in 3 files.");
});

test("formatText says so plainly when nothing is found", () => {
  assert.equal(formatText(result([])).trim(), "No findings in 3 files.");
});

test("formatGithub emits workflow commands, severity-mapped, escaped, with the scan root in the path", () => {
  const out = formatGithub(result([
    finding({ message: "100% wrong,\nreally" }),
    finding({ severity: "medium", line: 3 }),
    finding({ severity: "low", line: 4 }),
  ]), "apps/web");
  const lines = out.trimEnd().split("\n");
  assert.equal(lines[0], "::error file=apps/web/src/A.tsx,line=7,title=dead-control (craft.nothing-dead)::100%25 wrong,%0Areally");
  assert.match(lines[1], /^::warning file=apps\/web\/src\/A\.tsx,line=3,/);
  assert.match(lines[2], /^::notice file=apps\/web\/src\/A\.tsx,line=4,/);
});

test("check: text by default, exit 1 when a high finding exists", () => {
  const r = cli(["check", fx("html")]);
  assert.equal(r.code, 1, r.err);
  assert.match(r.out, /index\.html/);
  assert.match(r.out, /role-no-keyboard/);
  assert.match(r.out, /\d+ findings \(\d+ high/);
});

test("check --fail-on none exits 0; --format json is the check-static shape", () => {
  const r = cli(["check", fx("html"), "--fail-on", "none", "--format", "json"]);
  assert.equal(r.code, 0, r.err);
  const j = JSON.parse(r.out);
  assert.equal(j.tool, "check-static");
  assert.ok(j.findings.length > 0);
});

test("check --format github prefixes paths with the scanned directory", () => {
  const d = tmp();
  mkdirSync(join(d, "web", "src"), { recursive: true });
  writeFileSync(join(d, "web", "src", "Nav.tsx"), '<a href="#">Pricing</a>\n');
  const r = cli(["check", "web", "--format", "github"], d);
  assert.equal(r.code, 1, r.err);
  assert.match(r.out, /^::error file=web\/src\/Nav\.tsx,line=1,title=dead-control/m);
});

test("clean project: exit 0 and a plain 'no findings' line", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<!doctype html><title>Ok</title><main><h1>Ok</h1></main>\n");
  const r = cli(["check", d]);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /No findings in 1 file\./);
});

test("usage errors exit 2; --version prints package.json's version", () => {
  assert.equal(cli(["frobnicate"]).code, 2);
  assert.equal(cli(["check", ".", "--fail-on", "sometimes"]).code, 2);
  assert.equal(cli(["check", ".", "--format", "xml"]).code, 2);
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
  assert.equal(cli(["--version"]).out.trim(), pkg.version);
  assert.match(cli(["--help"]).out, /finally-good-ui check \[dir\]/);
});

test("npm package and Claude Code plugin share one version", () => {
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
  const plugin = JSON.parse(readFileSync(join(REPO, ".claude-plugin", "plugin.json"), "utf8"));
  assert.equal(pkg.version, plugin.version);
});
