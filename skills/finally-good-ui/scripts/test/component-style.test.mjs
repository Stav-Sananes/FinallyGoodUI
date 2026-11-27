import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fx } from "./_h.mjs";
import { validateProfile, profileCss } from "../lib/style-profile.mjs";

const json = (n) => JSON.parse(readFileSync(fx(`components/${n}.json`), "utf8"));
const spec = json("spec-valid");
// a spec that declares every token family the layer can use, so each profile axis is visible
const rich = {
  ...spec,
  tokens: [
    "--color-border", "--color-ring", "--color-foreground",
    "--radius-none", "--radius-sm", "--radius-md", "--radius-full",
    "--shadow-sm", "--shadow-md", "--border-width-hairline", "--border-width-strong",
    "--ring-width", "--ring-offset", "--size-control-sm", "--size-control-md", "--size-control-lg",
    "--space-1", "--space-2", "--space-3", "--space-4",
    "--duration-micro", "--duration-short", "--duration-standard",
    "--ease-snappy", "--ease-enter", "--ease-enter-emphasized",
  ],
};
const quiet = json("profile-quiet");
const bold = json("profile-bold");
const LITERAL = /#[0-9a-f]{3,8}\b|\d\s*px\b|\d\s*ms\b/i;

test("validateProfile accepts both fixtures", () => {
  assert.deepEqual(validateProfile(quiet), { ok: true, errors: [] });
  assert.deepEqual(validateProfile(bold), { ok: true, errors: [] });
});

test("rejects an unknown radius value", () => {
  const r = validateProfile({ ...quiet, radius: "pointy" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.startsWith("radius")), r.errors.join("|"));
});

test("rejects non-objects, bad material/density/motion and an empty motif", () => {
  assert.equal(validateProfile(null).ok, false);
  const r = validateProfile({ radius: "soft", material: "glass", density: "huge", motif: " ", motion: "wild" });
  for (const k of ["material", "density", "motif", "motion"]) assert.ok(r.errors.some((e) => e.startsWith(k)), k);
});

test("the literal check has a positive control", () => {
  for (const bad of ["a{color:#fff}", "a{width:4px}", "a{transition:200ms}", "a{x:#a1b2c3d4}"]) assert.match(bad, LITERAL);
  assert.doesNotMatch("a{width:var(--space-2);transition-duration:0s}", LITERAL);
});

test("profileCss contains no hex, px or ms literals", () => {
  for (const p of [quiet, bold]) for (const s of [spec, rich]) {
    const css = profileCss(p, s);
    assert.ok(css.includes("[data-part"), "targets parts");
    assert.doesNotMatch(css, LITERAL);
  }
});

test("profileCss only references variables listed in spec.tokens", () => {
  for (const p of [quiet, bold]) for (const s of [spec, rich]) {
    const used = [...profileCss(p, s).matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
    for (const v of used) assert.ok(s.tokens.includes(v), `${v} not in spec.tokens`);
  }
  assert.ok(profileCss(bold, rich).includes("var(--"), "positive control: rich spec yields var()");
});

test("two different profiles give different CSS for the same spec", () => {
  const a = profileCss(quiet, rich), b = profileCss(bold, rich);
  assert.notEqual(a, b);
  assert.notEqual(profileCss(quiet, spec), profileCss(bold, spec));
});

test("material changes the box-shadow and border declarations", () => {
  const decl = (material) => {
    const css = profileCss({ ...quiet, material }, rich);
    return { shadow: css.match(/box-shadow:[^;]*;/)?.[0], border: css.match(/border-style:[^;]*;/)?.[0] };
  };
  const flat = decl("flat"), layered = decl("layered"), outlined = decl("outlined");
  assert.notEqual(flat.shadow, layered.shadow);
  assert.match(layered.shadow, /var\(--shadow-/);
  assert.notEqual(flat.border, outlined.border);
  assert.match(outlined.border, /solid/);
});

test("radius, density and motion each change declarations", () => {
  const css = (o) => profileCss({ ...quiet, ...o }, rich);
  assert.match(css({ radius: "round" }), /border-radius:\s*var\(--radius-full\)/);
  assert.match(css({ radius: "sharp" }), /border-radius:\s*var\(--radius-none\)/);
  assert.match(css({ density: "airy" }), /var\(--size-control-lg\)/);
  assert.match(css({ density: "dense" }), /var\(--size-control-sm\)/);
  assert.match(css({ motion: "expressive" }), /var\(--duration-standard\)/);
  assert.match(css({ motion: "productive" }), /var\(--duration-micro\)/);
});

test("spec states become attribute selectors", () => {
  const css = profileCss(quiet, spec);
  assert.match(css, /\[aria-disabled\]/);
  assert.match(css, /\[aria-busy\]/);
});

test("output has a reduced-motion block", () => {
  for (const p of [quiet, bold]) {
    const css = profileCss(p, spec);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*(transition|animation)/);
  }
});

test("motif cannot break out of its comment", () => {
  const css = profileCss({ ...quiet, motif: "x */ a{color:red} /*" }, spec);
  assert.doesNotMatch(css, /a\{color:red\}\s*\/\*/);
  assert.equal((css.match(/\*\//g) || []).length, (css.match(/\/\*/g) || []).length);
});

// ---- role-based surfaces: record, panel and control each take their own radius, material, edge and corner
import { surfaceOf, surfacesIdentical, ROLES, EDGES, CORNERS } from "../lib/style-profile.mjs";
import { validateSpec } from "../lib/component-spec.mjs";

const withRole = (role, extra = {}) => ({ ...rich, parts: [...rich.parts, "lead"], profile: { surface: "root", role, ...extra } });
const ledger = { ...quiet, surfaces: { record: { edge: "ruled", radius: "sharp", material: "flat" }, panel: { material: "layered" }, control: { radius: "soft" } } };

test("validateProfile accepts surfaces and names the field that is wrong", () => {
  assert.deepEqual(validateProfile(ledger), { ok: true, errors: [] });
  assert.deepEqual(validateProfile(quiet), { ok: true, errors: [] }, "surfaces stay optional");
  const bad = validateProfile({ ...quiet, surfaces: { record: { edge: "wavy", corner: "round" }, drawer: {}, panel: { size: "big" }, control: null } });
  for (const e of ["surfaces.record.edge", "surfaces.record.corner", "surfaces.drawer", "surfaces.panel.size", "surfaces.control"]) assert.ok(bad.errors.some((m) => m.startsWith(e)), `${e}: ${bad.errors.join("|")}`);
  assert.equal(validateProfile({ ...quiet, surfaces: [] }).ok, false);
});

test("surfaceOf falls back to the profile's radius and material, square edge, uniform corner", () => {
  assert.deepEqual(surfaceOf(quiet, "record"), { radius: quiet.radius, material: quiet.material, edge: "square", corner: "uniform" });
  assert.deepEqual(surfaceOf(ledger, "record"), { radius: "sharp", material: "flat", edge: "ruled", corner: "uniform" });
  assert.deepEqual(surfaceOf(ledger, "panel"), { radius: quiet.radius, material: "layered", edge: "square", corner: "uniform" });
  assert.deepEqual(ROLES, ["record", "panel", "control"]);
});

test("surfacesIdentical: true for a profile with no surfaces, false once one role differs", () => {
  assert.equal(surfacesIdentical(quiet), true);
  assert.equal(surfacesIdentical({ ...quiet, surfaces: { record: {}, panel: {}, control: {} } }), true, "empty roles are still one card");
  assert.equal(surfacesIdentical({ ...quiet, surfaces: { record: { edge: "tab" } } }), false);
  assert.equal(surfacesIdentical(ledger), false);
});

test("the same spec takes its role's surface: a record is ruled while a panel keeps its box", () => {
  const record = profileCss(ledger, withRole("record")), panel = profileCss(ledger, withRole("panel"));
  assert.match(record, /radius=sharp material=flat density=\w+ motion=\w+ motif="[^"]*" role=record edge=ruled/);
  assert.match(record, /border-block-end-width:\s*var\(--border-width-hairline\)/);
  assert.match(record, /border-radius:\s*var\(--radius-none\)/);
  assert.match(panel, /role=panel/);
  assert.doesNotMatch(panel, /border-block-end-width/, "negative control: the ruled edge is the record's only");
  assert.notEqual(record, panel);
  // a profile with no surfaces gives every role the same declarations (the role only shows in the header comment)
  const body = (css) => css.replace(/^\/\*.*\*\/\n/, "");
  assert.equal(body(profileCss(quiet, withRole("record"))), body(profileCss(quiet, withRole("panel"))));
});

test("every edge and corner emits tokens only, and only the shape that was asked", () => {
  const css = (surface) => profileCss({ ...quiet, surfaces: { record: surface } }, withRole("record", { lead: "lead" }));
  for (const edge of EDGES) for (const corner of CORNERS) assert.doesNotMatch(css({ edge, corner }), LITERAL, `${edge}/${corner}`);
  assert.match(css({ edge: "tab" }), /border-inline-start-width:\s*var\(--border-width-strong\)/);
  assert.match(css({ edge: "perforated" }), /\[data-part="lead"\][^}]*border-inline-end-style:\s*dashed/);
  assert.match(css({ edge: "notch" }), /clip-path:\s*polygon\(0 0, calc\(100% - var\(--space-3\)\) 0/);
  assert.match(css({ corner: "cut" }), /clip-path:\s*polygon\(var\(--space-3\) 0/);
  assert.match(css({ corner: "asymmetric" }), /border-start-start-radius:\s*var\(--radius-md\)/);
  const plain = css({});
  for (const p of ["clip-path", "border-inline-start-style", "border-inline-end-style", "border-start-start-radius", "border-block-end-width"]) assert.doesNotMatch(plain, new RegExp(p), `negative control: ${p}`);
});

test("a spec's profile.role and profile.lead are validated", () => {
  const base = { ...spec, parts: [...spec.parts, "lead"] };
  assert.deepEqual(validateSpec({ ...base, profile: { surface: "root", role: "record", lead: "lead" } }).errors.filter((e) => e.startsWith("profile")), []);
  assert.ok(validateSpec({ ...base, profile: { role: "card" } }).errors.some((e) => e.startsWith("profile.role")));
  assert.ok(validateSpec({ ...base, profile: { lead: "nope" } }).errors.some((e) => e.startsWith("profile.lead")));
});
