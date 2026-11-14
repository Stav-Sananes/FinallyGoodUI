import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";

// Some libraries hard-code their motion in their own CSS (Sonner 400ms, Vaul 0.5s, react-day-picker
// 0.3s). --format adapters emits override CSS that points them at our motion tokens instead.
const DEF = join(SR, "tokens", "default.tokens.json");
const adapters = (...args) => run("emit-tokens.mjs", ["--in", DEF, "--format", "adapters", ...args]);

test("adapters: one section per library, referencing our variables, no timing literals", () => {
  const r = adapters();
  assert.equal(r.code, 0, r.stderr);
  for (const lib of ["sonner", "cmdk", "react-day-picker", "vaul-unmaintained"]) assert.match(r.stdout, new RegExp(`/\\* ${lib}:`));
  assert.match(r.stdout, /:root \[data-sonner-toaster\] \[data-sonner-toast\] \{[^}]*transition-duration: var\(--duration-medium\)/);
  assert.match(r.stdout, /\[cmdk-list\] \{[^}]*height: var\(--cmdk-list-height\)/);
  assert.match(r.stdout, /--rdp-animation_duration: var\(--duration-medium\)/);
  assert.match(r.stdout, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(r.stdout.replace(/\/\*[\s\S]*?\*\//g, ""), /\b[1-9]\d*m?s\b/, "no hard-coded durations outside comments (0s under reduced motion is fine)");
});

test("adapters --libs takes stack-profile interaction names and emits only those", () => {
  const r = adapters("--libs", "sonner,cmdk,floating-ui");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /\/\* sonner:/);
  assert.match(r.stdout, /\/\* cmdk:/);
  assert.doesNotMatch(r.stdout, /rdp|vaul/);
  const none = adapters("--libs", "floating-ui");
  assert.equal(none.code, 0);
  assert.match(none.stdout, /no adapter needed/);
});

test("adapters: a token the bridge needs but the set lacks is a usage error naming it", () => {
  const d = tmp();
  const f = join(d, "t.json");
  writeFileSync(f, JSON.stringify({ duration: { short: { $type: "duration", $value: "150ms" } }, easing: { move: { $type: "cubicBezier", $value: [0.2, 0, 0, 1] } } }));
  const r = run("emit-tokens.mjs", ["--in", f, "--format", "adapters", "--libs", "sonner"]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /duration\.medium/);
});
