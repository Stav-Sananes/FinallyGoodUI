import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp } from "./_h.mjs";

// Slop detectors: the mechanical half of rubric/ai-default-fingerprints.md.
const SLOP = {
  "dead-control": "craft.nothing-dead", "placeholder-code": "craft.nothing-dead",
  "placeholder-content": "craft.honest-content", "unsourced-claim": "craft.honest-content",
  "buzzword": "writing.plain-claims", "em-dash-copy": "writing.plain-claims", "generic-cta": "writing.action-labels",
  "gradient-text": "layout.hierarchy-by-weight", "purple-blue-gradient": "color.accent-restraint",
  "glass-overuse": "craft.material-restraint", "colored-glow": "craft.material-restraint",
  "bg-pattern": "craft.material-restraint", "blurred-orb": "craft.material-restraint",
  "fake-terminal": "craft.real-imagery-and-icons", "ai-icon": "craft.real-imagery-and-icons",
  "emoji-ui": "craft.real-imagery-and-icons", "decorative-pulse": "motion.purpose-only",
  "eyebrow-overuse": "layout.tension-consistency-emphasis", "viewport-100vh": "layout.intrinsic-responsive",
};

const check = (dir, extra = []) => {
  const r = run("check-static.mjs", ["--root", dir, ...extra]);
  assert.equal(r.code, 0, r.stderr);
  return r.json;
};
const has = (o, rule, file, line) =>
  o.findings.some((f) => f.rule === rule && (!file || f.file === file) && (line == null || f.line === line));
const sev = (o, rule, file, line) => o.findings.find((f) => f.rule === rule && f.file === file && f.line === line)?.severity;

const o = check(fx("slop"));
const T = "src/Landing.tsx", C = "src/glass.css";

test("every slop rule fires in the slop fixture and maps to its card", () => {
  const fired = new Set(o.findings.map((f) => f.rule));
  for (const [rule, card] of Object.entries(SLOP)) {
    assert.ok(fired.has(rule), `${rule} did not fire`);
    for (const f of o.findings.filter((x) => x.rule === rule)) assert.equal(f.card, card);
  }
});

test("slop findings land on the right lines", () => {
  assert.ok(has(o, "ai-icon", T, 1));
  assert.ok(has(o, "gradient-text", T, 5));
  assert.ok(has(o, "gradient-text", "src/Inline.tsx", 2), "JS style object form");
  assert.ok(has(o, "purple-blue-gradient", T, 5));
  assert.ok(has(o, "buzzword", T, 6));
  assert.ok(has(o, "dead-control", T, 7));
  assert.equal(sev(o, "dead-control", T, 7), "high");
  assert.ok(has(o, "dead-control", T, 8));
  assert.ok(has(o, "generic-cta", T, 8));
  assert.equal(sev(o, "generic-cta", T, 8), "low");
  assert.ok(has(o, "unsourced-claim", T, 9));
  assert.ok(has(o, "placeholder-content", T, 10));
  assert.ok(has(o, "placeholder-content", T, 11));
  assert.ok(has(o, "blurred-orb", T, 12));
  assert.ok(has(o, "decorative-pulse", T, 13));
  assert.ok(has(o, "em-dash-copy", T, 14));
  assert.ok(has(o, "viewport-100vh", T, 17));
  assert.ok(has(o, "emoji-ui", T, 17));
  assert.ok(has(o, "placeholder-code", T, 18));
  assert.ok(has(o, "eyebrow-overuse", T));
  assert.ok(has(o, "glass-overuse", C));
  assert.ok(has(o, "colored-glow", C, 2));
  assert.ok(has(o, "bg-pattern", C, 4));
  assert.ok(has(o, "fake-terminal", C));
  assert.ok(has(o, "viewport-100vh", C, 7));
});

test("html: in-page anchor to a missing id is dead; to an existing id is fine", () => {
  assert.ok(has(o, "dead-control", "page.html", 3));
  const msgs = o.findings.filter((f) => f.file === "page.html" && f.rule === "dead-control").map((f) => f.message).join(" ");
  assert.match(msgs, /#invoices/);
  assert.doesNotMatch(msgs, /#main/);
});

test("negative controls: legitimate patterns are not flagged", () => {
  assert.ok(!has(o, "em-dash-copy", T, 15), "a lone em dash is an empty-value marker in data cells");
  assert.ok(!has(o, "dead-control", T, 16), "#main is a real in-page target");
  assert.ok(!has(o, "colored-glow", C, 6), "a 0-blur ring is a focus ring, not a glow");
  assert.ok(!has(o, "ai-icon", T, 1) || o.findings.filter((f) => f.rule === "ai-icon").length === 1, "one finding per import line");
});

test("a project with 2 glass surfaces and 3 eyebrows is not flagged", () => {
  const d = tmp();
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "a.css"), ".nav { backdrop-filter: blur(12px); }\n.sheet { backdrop-filter: blur(8px); }\n");
  writeFileSync(join(d, "src", "b.tsx"),
    'export const B = () => (<>\n<p className="uppercase tracking-wide">A</p>\n<p className="uppercase tracking-wide">B</p>\n<p className="uppercase tracking-wide">C</p>\n<a href="/pricing">Compare plans</a>\n<li>Material: soft-elevated surfaces</li>\n</>);\n');
  const r = check(d);
  assert.deepEqual(r.findings.filter((f) => f.rule !== "no-reduced-motion"), []);
});

test("100dvh alongside 100vh fallback is not flagged", () => {
  const d = tmp();
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "a.css"), ".hero { min-height: 100vh; min-height: 100dvh; }\n");
  assert.deepEqual(check(d).findings, []);
});
