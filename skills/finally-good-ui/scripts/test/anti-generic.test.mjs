import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SR } from "./_h.mjs";

const read = (rel) => readFileSync(join(SR, rel), "utf8");
const lines = (rel) => read(rel).replace(/\n$/, "").split("\n").length;

test("the direction spec template makes the concept drive structure: mapping, skeleton, signature at scale, refusals", () => {
  const d = read("modules/directions.md");
  const template = d.slice(d.indexOf("## 3. Write the three specs"), d.indexOf("Rules for the specs:"));
  for (const field of ["Concept mapping (3 rows):", "Skeleton:", "Signature at scale:", "Refuses (3 default dashboard moves"]) assert.ok(template.includes(field), field);
  assert.match(template, />= 25% of the first viewport at 1440x900 and >= 40% of 375x667/);
  assert.match(template, /data-fgu-signature/);
  assert.doesNotMatch(template, /Signature detail:/, "the decoration-sized signature line is gone");
});

test("the direction may amend the blueprint shell, and layout has an object position", () => {
  const d = read("modules/directions.md");
  assert.doesNotMatch(d, /Never override the blueprint shell/);
  assert.match(d, /The direction may amend the shell/);
  assert.match(d, /Layout position 4, \*\*object\*\*/);
  assert.match(read("modules/blueprint.md"), /chosen direction may replace the shell/);
});

test("`directions: one` and the autonomous path agree: build one pick that passes the structure test", () => {
  const d = read("modules/directions.md"), s = read("SKILL.md");
  assert.match(d, /Structure test \(every direction/);
  assert.match(d, /not "top bar \+ one centred column"/);
  assert.doesNotMatch(s, /build only the one you pick and record why/);
  assert.match(s, /`one`, or no subagents, builds only the one you pick \(not automatically A\)/);
  assert.match(s, /Skeleton that is not "top bar \+ one centred column"/);
  assert.doesNotMatch(s, /`one` builds only A/);
});

test("verify gates on genericness: G10, the 3-trigger limit, the baseline, and the first screen is probed in build", () => {
  const v = read("modules/verify.md"), b = read("modules/build.md"), r = read("rubric/rubric.md");
  assert.match(v, /\| G10 \| Genericness/);
  assert.match(v, /\| G11 \| Light, dark and 375 px/);
  for (const trigger of ["cardCoverage", "rowRepeat", "singleColumn", "defaultType", "canvasNeutral", "scaleFlat", "signatureAbsent", "radiusUniform"]) assert.ok(v.includes(`\`${trigger}\``), trigger);
  assert.match(v, /\*\*3 or more triggers: G10 fails and dimension 10 is capped at 3\.\*\*/);
  assert.match(v, /baseline\.html/);
  assert.match(r, /delivery gate G10 \(genericness\) passes/);
  assert.match(r, /A build with nine 5s and a generic first viewport does not pass|a build with nine 5s and a generic first viewport does not pass/i);
  assert.match(b, /check-genericness\.mjs/);
  assert.ok(lines("modules/build.md") <= 60, "build.md must not grow");
  assert.ok(lines("SKILL.md") < 500);
});

test("the reviewer gets the baseline and the plugin's copy of each agent matches the skill's", () => {
  for (const f of ["ui-reviewer.md", "direction-builder.md"]) assert.equal(readFileSync(join(SR, "agents", f), "utf8"), readFileSync(join(SR, "..", "..", "agents", f), "utf8"), f);
  assert.match(read("agents/ui-reviewer.md"), /Baseline swap test/);
  assert.match(read("agents/direction-builder.md"), /data-fgu-signature/);
});

test("the menu spec keeps the more-button trigger off rows with one or two actions", () => {
  assert.match(read("components/menu/spec.md"), /one or two actions[\s\S]*row-menu-button[\s\S]*three or more secondary actions/);
});
