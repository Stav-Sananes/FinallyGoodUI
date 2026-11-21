import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fx, tmp } from "./_h.mjs";
import { validateSpec, loadSpec } from "../lib/component-spec.mjs";

const read = (name) => JSON.parse(readFileSync(fx(`components/${name}`), "utf8"));

test("accepts the valid fixture", () => {
  const r = validateSpec(read("spec-valid.json"));
  assert.deepEqual(r, { ok: true, errors: [] });
});

test("rejects missing a11y.role", () => {
  const r = validateSpec(read("spec-bad-role.json"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("a11y.role")), r.errors.join("\n"));
});

test("rejects a state whose attribute is empty", () => {
  const r = validateSpec(read("spec-bad-state.json"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("states[0].attribute")), r.errors.join("\n"));
});

test('rejects a token not starting with "--"', () => {
  const r = validateSpec(read("spec-bad-token.json"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("tokens[0]")), r.errors.join("\n"));
});

test("rejects duplicate part names", () => {
  const r = validateSpec(read("spec-bad-parts.json"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("parts") && e.includes("root")), r.errors.join("\n"));
});

test("rejects a non-object spec", () => {
  assert.equal(validateSpec(null).ok, false);
});

test("loadSpec reads spec.json from the component dir", () => {
  const dir = tmp();
  writeFileSync(join(dir, "spec.json"), readFileSync(fx("components/spec-valid.json")));
  assert.equal(loadSpec(dir).name, "button");
});

test("loadSpec throws naming the file when invalid, unreadable or not JSON", () => {
  const bad = tmp();
  writeFileSync(join(bad, "spec.json"), readFileSync(fx("components/spec-bad-role.json")));
  assert.throws(() => loadSpec(bad), (e) => e.message.includes(join(bad, "spec.json")) && e.message.includes("a11y.role"));
  const junk = tmp();
  writeFileSync(join(junk, "spec.json"), "{nope");
  assert.throws(() => loadSpec(junk), (e) => e.message.includes(join(junk, "spec.json")));
  const empty = tmp();
  mkdirSync(join(empty, "x"));
  assert.throws(() => loadSpec(empty), (e) => e.message.includes(join(empty, "spec.json")));
});
