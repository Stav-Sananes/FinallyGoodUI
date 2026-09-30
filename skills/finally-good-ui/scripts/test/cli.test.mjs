import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "./_h.mjs";

const scripts = ["detect-stack.mjs", "extract-tokens.mjs", "emit-tokens.mjs", "check-static.mjs",
  "export-rules.mjs", "lint-skill.mjs", "lib/contrast.mjs"];

for (const s of scripts) {
  test(`${s} --help exits 0 and prints usage`, () => {
    const r = run(s, ["--help"]);
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /usage/i);
  });
  test(`${s} rejects unknown flags with exit 2`, () => {
    const r = run(s, ["--definitely-not-a-flag"]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /unknown/i);
  });
}
