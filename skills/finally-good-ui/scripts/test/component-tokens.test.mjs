import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { run, SR } from "./_h.mjs";

const VARS = ["--border-width-hairline", "--border-width-strong", "--ring-width", "--ring-offset",
  "--size-control-sm", "--size-control-md", "--size-control-lg", "--z-overlay", "--z-toast"];

test("emits component token groups as CSS variables", () => {
  const r = run("emit-tokens.mjs", ["--in", join(SR, "tokens/default.tokens.json"), "--format", "css"]);
  assert.equal(r.code, 0, r.stderr);
  for (const v of VARS) assert.match(r.stdout, new RegExp(`${v}:\\s*[^;]+;`), `missing ${v}`);
  assert.match(r.stdout, /--size-control-lg:\s*44px;/);
  assert.match(r.stdout, /--ring-width:\s*2px;/);
});
