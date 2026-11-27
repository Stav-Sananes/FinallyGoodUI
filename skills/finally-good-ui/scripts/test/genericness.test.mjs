import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateGenericness, DEFAULT_PROMISE, TRIGGER_LIMIT } from "../lib/genericness.mjs";

// A first viewport that trips nothing: wide content, distinct type, tinted canvas, big display, signature at scale.
const distinct = () => ({
  viewport: { width: 1440, height: 900 },
  cardCoverage: 0.05, cardLooks: 1, rows: { groups: 0, max: 0 },
  column: { left: 40, right: 40, width: 1360 },
  type: { families: { Fraunces: 6, "JetBrains Mono": 4, Figtree: 3 }, textElements: 13, sizes: [96, 20, 14], body: 16 },
  canvas: { l: 0.82, c: 0.09 },
  surfaces: { containers: 8, radii: [0, 2, 6] },
  signature: { count: 1, share: 0.42 },
});
// The stock dashboard: centred 990px column of identical bordered cards with "..." buttons.
const stock = () => ({
  viewport: { width: 1440, height: 900 },
  cardCoverage: 0.52, cardLooks: 1, rows: { groups: 1, max: 6 },
  column: { left: 225, right: 225, width: 990 },
  type: { families: { Figtree: 30, Fraunces: 2 }, textElements: 32, sizes: [32, 22, 16, 14], body: 15 },
  canvas: { l: 0.96, c: 0.03 },
  surfaces: { containers: 12, radii: [12] },
  signature: { count: 0, share: 0 },
});
const ids = (r) => r.triggers.map((t) => t.id).sort();

test("positive control: the stock layout trips every trigger, the distinct one none", () => {
  const bad = evaluateGenericness({ desktop: stock() });
  assert.deepEqual(ids(bad), ["canvasNeutral", "cardCoverage", "defaultType", "radiusUniform", "rowRepeat", "scaleFlat", "signatureAbsent", "singleColumn"]);
  assert.equal(bad.count, 8);
  assert.equal(bad.capDim10, 3);
  assert.equal(bad.pass, false);
  const good = evaluateGenericness({ desktop: distinct() });
  assert.deepEqual(good.triggers, []);
  assert.equal(good.capDim10, null);
  assert.equal(good.pass, true);
});

test("each trigger fires on its own threshold and not just below it", () => {
  const one = (mut) => { const d = distinct(); mut(d); return ids(evaluateGenericness({ desktop: d })); };
  assert.deepEqual(one((d) => { d.cardCoverage = 0.31; }), ["cardCoverage"]);
  assert.deepEqual(one((d) => { d.cardCoverage = 0.3; }), []);
  assert.deepEqual(one((d) => { d.rows = { groups: 1, max: 5 }; }), ["rowRepeat"]);
  assert.deepEqual(one((d) => { d.column = { left: 225, right: 225, width: 990 }; }), ["singleColumn"]);
  assert.deepEqual(one((d) => { d.column = { left: 225, right: 225, width: 1100 }; }), [], "wider than 1000 is not a narrow column");
  assert.deepEqual(one((d) => { d.column = { left: 40, right: 400, width: 1000 }; }), [], "off-centre is a layout, not a centred column");
  assert.deepEqual(one((d) => { d.type.families = { Inter: 12, Figtree: 1 }; d.type.textElements = 13; }), ["defaultType"]);
  assert.deepEqual(one((d) => { d.type.families = { Inter: 12, Fraunces: 3 }; d.type.textElements = 15; }), [], "three display nodes break the default look");
  assert.deepEqual(one((d) => { d.canvas = { l: 0.95, c: 0.049 }; }), ["canvasNeutral"]);
  assert.deepEqual(one((d) => { d.canvas = { l: 0.95, c: 0.05 }; }), []);
  assert.deepEqual(one((d) => { d.canvas = { l: 0.3, c: 0.01 }; }), [], "dark canvas is not the paper tint");
  assert.deepEqual(one((d) => { d.type.sizes = [34, 20, 14]; }), ["scaleFlat"]);
  assert.deepEqual(one((d) => { d.surfaces = { containers: 8, radii: [12, 4] }; }), ["radiusUniform"]);
  assert.deepEqual(one((d) => { d.surfaces = { containers: 3, radii: [12] }; }), [], "too few containers to call it uniform");
  assert.deepEqual(one((d) => { d.signature = { count: 1, share: 0.2 }; }), ["signatureAbsent"]);
});

test("signature promise: desktop 25%, mobile 40%; a miss is a high fidelity finding", () => {
  assert.deepEqual(DEFAULT_PROMISE, { desktop: 0.25, mobile: 0.4 });
  const m = distinct(); m.viewport = { width: 375, height: 667 }; m.signature = { count: 1, share: 0.3 };
  const r = evaluateGenericness({ desktop: distinct(), mobile: m });
  assert.equal(r.triggers.length, 0, "the mobile miss is a fidelity finding, not a desktop trigger");
  assert.deepEqual(r.fidelity.map((f) => [f.severity, f.viewport, f.share, f.promise]), [["high", 375, 0.3, 0.4]]);
  const own = evaluateGenericness({ desktop: distinct() }, { promise: { desktop: 0.45, mobile: 0.4 } });
  assert.deepEqual(own.fidelity.map((f) => f.viewport), [1440], "the spec's own promise replaces the default");
});

test("limit: two triggers pass, the third caps dimension 10 at 3 and fails G10", () => {
  assert.equal(TRIGGER_LIMIT, 3);
  const d = distinct(); d.cardCoverage = 0.6; d.canvas = { l: 0.97, c: 0.01 };
  const two = evaluateGenericness({ desktop: d });
  assert.equal(two.count, 2); assert.equal(two.pass, true); assert.equal(two.capDim10, null);
  d.rows = { groups: 2, max: 7 };
  const three = evaluateGenericness({ desktop: d });
  assert.equal(three.count, 3); assert.equal(three.pass, false); assert.equal(three.capDim10, 3);
});

test("missing measurements are reported, never counted as a pass", () => {
  const r = evaluateGenericness({ desktop: null });
  assert.equal(r.pass, null);
  assert.match(r.error, /1440/);
});

test("check-genericness --report reads the first 1440 and 375 results of a flow-walk report", async () => {
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { main } = await import("../check-genericness.mjs");
  const mobile = distinct(); mobile.viewport = { width: 375, height: 667 }; mobile.signature = { count: 1, share: 0.45 };
  const rep = { results: [
    { step: "home", metrics: { viewport: { width: 375, height: 667 }, generic: mobile } },
    { step: "home", metrics: { viewport: { width: 1440, height: 900 }, generic: stock() } },
  ] };
  const f = join(mkdtempSync(join(tmpdir(), "fgu-gen-")), "r0.json");
  writeFileSync(f, JSON.stringify(rep));
  const r = await main({ flags: { report: f } });
  assert.equal(r.pass, false);
  assert.equal(r.count, 8);
  assert.equal(r.measured.mobile.signature.share, 0.45);
  await assert.rejects(() => main({ flags: {} }), /--url or --report/);
  await assert.rejects(() => main({ flags: { report: f, "promise-1440": "2" } }), /0-1/);
});
