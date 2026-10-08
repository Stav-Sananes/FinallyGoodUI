import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp } from "./_h.mjs";

const RULES = {
  "no-transition-all": "motion.compositor-only", "animate-layout-prop": "motion.compositor-only",
  "no-reduced-motion": "motion.reduced-motion", "hardcoded-color": "color.role-scale",
  "off-scale-spacing": "layout.spacing-scale", "long-duration": "motion.frequency-budget",
  "ease-in-entrance": "motion.easing-roles", "scale-from-zero": "motion.easing-roles",
  "outline-none-no-focus": "a11y.focus-visible", "img-no-alt": "a11y.semantic-first",
  "div-onclick": "a11y.semantic-first", "user-scalable-no": "a11y.target-size", "small-input-font": "a11y.target-size",
};

const check = (dir, extra = []) => {
  const r = run("check-static.mjs", ["--root", dir, ...extra]);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.tool, "check-static");
  return r.json;
};
const has = (o, rule, file, line) =>
  o.findings.some((f) => f.rule === rule && (!file || f.file === file) && (line == null || f.line === line));
const at = (o, file, line) => o.findings.filter((f) => f.file === file && f.line === line && f.rule !== "no-reduced-motion").map((f) => f.rule).sort();

const all = ["next", "vite", "vue", "html", "mui"].map((n) => check(fx(n)));

test("output shape", () => {
  for (const o of all) {
    for (const f of o.findings) {
      assert.ok(RULES[f.rule], f.rule);
      assert.equal(f.card, RULES[f.rule]);
      assert.ok(["high", "medium", "low"].includes(f.severity));
      assert.equal(typeof f.message, "string");
      assert.ok("selector" in f);
      if (f.rule !== "no-reduced-motion") assert.equal(typeof f.line, "number");
    }
    const sum = { high: 0, medium: 0, low: 0 };
    for (const f of o.findings) sum[f.severity]++;
    assert.deepEqual(o.summary, sum);
  }
});

test("every one of the 13 rules fires somewhere in the fixtures", () => {
  const fired = new Set(all.flatMap((o) => o.findings.map((f) => f.rule)));
  assert.deepEqual([...fired].sort(), Object.keys(RULES).sort());
});

test("next fixture: exact findings per line", () => {
  const o = all[0];
  const P = "src/app/page.tsx";
  assert.deepEqual(at(o, P, 7), ["long-duration", "no-transition-all", "outline-none-no-focus"]);
  assert.equal(o.findings.find((f) => f.file === P && f.line === 7 && f.rule === "long-duration").severity, "high");
  assert.deepEqual(at(o, P, 8), []);
  assert.deepEqual(at(o, P, 9), ["img-no-alt"]);
  assert.deepEqual(at(o, P, 10), []);
  assert.deepEqual(at(o, P, 11), ["div-onclick"]);
  assert.deepEqual(at(o, P, 12), []);
  assert.deepEqual(at(o, P, 13), ["hardcoded-color", "off-scale-spacing"]);
  assert.deepEqual(at(o, P, 14), ["long-duration", "scale-from-zero"]);
  assert.deepEqual(at(o, P, 15), ["ease-in-entrance"]); // animate-spin: infinite, not long-duration
  assert.deepEqual(at(o, P, 16), ["small-input-font"]);
  assert.deepEqual(at(o, P, 17), []);
  assert.ok(has(o, "user-scalable-no", "src/app/layout.tsx", 6));
  assert.ok(has(o, "hardcoded-color", "src/components/card.tsx", 2));
  assert.ok(!has(o, "off-scale-spacing", "src/components/card.tsx"));
  assert.ok(!has(o, "hardcoded-color", "src/app/globals.css"), "global token css is exempt");
  assert.ok(has(o, "no-reduced-motion"));
});

test("vite fixture: layout props, easeIn, exit ease-in allowed, reduced motion present", () => {
  const o = all[1];
  assert.ok(has(o, "animate-layout-prop", "src/App.jsx", 11));
  assert.ok(has(o, "ease-in-entrance", "src/App.jsx", 11));
  assert.ok(has(o, "hardcoded-color", "src/App.jsx", 7));
  assert.ok(has(o, "animate-layout-prop", "src/app.module.scss", 2));
  assert.ok(has(o, "off-scale-spacing", "src/app.module.scss", 3));
  assert.ok(!has(o, "ease-in-entrance", "src/app.module.scss"), "ease-in on exit is fine");
  assert.ok(!has(o, "no-reduced-motion"));
  assert.ok(!has(o, "off-scale-spacing", "src/App.jsx"));
});

test("vue fixture: SFC template + style", () => {
  const o = all[2];
  const F = "src/App.vue";
  assert.ok(has(o, "div-onclick", F, 2));
  assert.ok(has(o, "img-no-alt", F, 3));
  assert.deepEqual(at(o, F, 13), ["ease-in-entrance", "long-duration", "no-transition-all"]);
  assert.ok(has(o, "off-scale-spacing", F, 14));
  assert.ok(has(o, "outline-none-no-focus", F, 17));
  assert.ok(!has(o, "outline-none-no-focus", F, 20), ".field has a :focus-visible rule");
  assert.ok(has(o, "small-input-font", F, 26));
  assert.ok(has(o, "no-reduced-motion"));
});

test("html fixture: root files scanned", () => {
  const o = all[3];
  assert.ok(has(o, "user-scalable-no", "index.html", 5));
  assert.ok(has(o, "img-no-alt", "index.html", 9));
  assert.ok(has(o, "div-onclick", "index.html", 10));
  assert.ok(has(o, "long-duration", "styles.css", 2));
  assert.ok(has(o, "animate-layout-prop", "styles.css", 4));
  assert.ok(has(o, "scale-from-zero", "styles.css", 4));
  assert.ok(has(o, "no-transition-all", "styles.css", 7));
  assert.ok(!has(o, "long-duration", "styles.css", 8), "infinite spinner exempt");
  const menu = o.findings.find((f) => f.file === "styles.css" && f.line === 9 && f.rule === "long-duration");
  assert.equal(menu.severity, "medium");
  assert.ok(has(o, "small-input-font", "styles.css", 10));
});

test("--files limits scope and accepts absolute paths", () => {
  const abs = join(fx("next"), "src", "app", "layout.tsx");
  const o = check(fx("next"), ["--files", abs]);
  assert.ok(o.findings.length >= 1);
  assert.ok(o.findings.every((f) => f.file === "src/app/layout.tsx"));
  const o2 = check(fx("next"), ["--files", "src/components/card.tsx,src/app/layout.tsx"]);
  assert.deepEqual([...new Set(o2.findings.map((f) => f.file))].sort(), ["src/app/layout.tsx", "src/components/card.tsx"]);
});

test("--tokens uses the tokens space scale", () => {
  const d = tmp();
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "a.css"), ".a { padding: 10px; margin: 12px; }\n");
  writeFileSync(join(d, "t.json"), JSON.stringify({ space: { a: { $type: "dimension", $value: { value: 10, unit: "px" } } } }));
  const def = check(d);
  assert.ok(has(def, "off-scale-spacing", "src/a.css", 1));
  const tok = check(d, ["--tokens", join(d, "t.json")]);
  const msgs = tok.findings.filter((f) => f.rule === "off-scale-spacing").map((f) => f.message).join(" ");
  assert.match(msgs, /Spacing 12px/);
  assert.doesNotMatch(msgs, /Spacing[^(]*10px/);
});

test("clean project yields no findings", () => {
  const d = tmp();
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "ok.css"),
    ".b { transition: opacity 150ms var(--ease-enter); padding: 16px; color: var(--color-foreground); }\n" +
    "@media (prefers-reduced-motion: reduce) { .b { transition: none; } }\n");
  writeFileSync(join(d, "src", "ok.tsx"), 'export const A = () => <button className="p-4">x</button>;\n');
  const o = check(d);
  assert.deepEqual(o.findings, []);
  assert.deepEqual(o.summary, { high: 0, medium: 0, low: 0 });
});

// ---------- plain HTML + JS apps (bug A, found by the end-to-end examples) ----------
const plainApp = () => {
  const d = tmp();
  for (const p of ["css", "js", "node_modules/lib", "dist", "test"]) mkdirSync(join(d, p), { recursive: true });
  writeFileSync(join(d, "index.html"), '<!doctype html><link rel="stylesheet" href="css/app.css"><main id="app"></main><script src="js/app.js"></script>\n');
  writeFileSync(join(d, "css", "tokens.css"), ":root { --duration-micro: 100ms; --duration-slow: 600ms; --duration-alias: var(--duration-slow); }\n");
  writeFileSync(join(d, "css", "app.css"),
    ".a { transition: transform var(--duration-micro) ease-out; }\n" +          // 1: 100ms, fine
    ".b { transition: transform var(--duration-slow) ease-out; }\n" +           // 2: 600ms, high
    ".c { animation: pop var(--duration-alias) ease-out both; }\n" +            // 3: alias -> 600ms, high
    ".d { transition: opacity var(--nope, 450ms) ease-out; }\n" +               // 4: fallback 450ms, medium
    "@media (prefers-reduced-motion: reduce) { .b { transition: none; } }\n");
  writeFileSync(join(d, "js", "app.js"), [
    "const robust = 2; if (a > robust && b < c) go();",                         // 1: code, not copy
    'btn.textContent = "Unlock seamless booking";',                             // 2: buzzword
    "list.innerHTML = `<p class=\"x\">Ready — ${count} pets</p>`;",            // 3: em-dash-copy
    'const proof = "Trusted by 10,000+ customers";',                            // 4: unsourced-claim
    "toast(`Saved 🎉`);",                                                        // 5: emoji-ui
    'el.innerHTML = `<img src="${pet.photo}"><div onclick="open()">${pet.name}</div>`;', // 6: img-no-alt, div-onclick
    'cta.innerHTML = `<button class="b">Get started</button>`;',               // 7: generic-cta
  ].join("\n") + "\n");
  writeFileSync(join(d, "js", "vendor.min.js"), 'x.innerHTML="<img src=a>";\n');
  writeFileSync(join(d, "vite.config.js"), 'export default { server: { port: 5173 }, color: "#ff0000" };\n');
  writeFileSync(join(d, "node_modules", "lib", "index.js"), 'x.innerHTML = "<img src=a>";\n');
  writeFileSync(join(d, "dist", "app.js"), 'x.innerHTML = "<img src=a>";\n');
  writeFileSync(join(d, "test", "app.test.js"), 'x.innerHTML = "<img src=a>";\n');
  return d;
};

test("default scan covers .js files and css/ js/ dirs; excludes node_modules, dist, tests, minified, configs", () => {
  const o = check(plainApp());
  const files = new Set(o.findings.map((f) => f.file));
  assert.ok(files.has("css/app.css"), "css/ scanned");
  assert.ok(files.has("js/app.js"), "js/ scanned");
  for (const f of files) assert.doesNotMatch(f, /node_modules|^dist\/|^test\/|\.min\.js$|vite\.config/, f);
  assert.ok(has(o, "img-no-alt", "js/app.js", 6));
  assert.ok(has(o, "div-onclick", "js/app.js", 6));
  assert.ok(!has(o, "no-reduced-motion"), "guard in css/app.css is seen");
});

test("copy rules read JS string literals, not code", () => {
  const o = check(plainApp());
  const J = "js/app.js";
  assert.ok(has(o, "buzzword", J, 2));
  assert.ok(has(o, "em-dash-copy", J, 3));
  assert.ok(has(o, "unsourced-claim", J, 4));
  assert.ok(has(o, "emoji-ui", J, 5));
  assert.ok(has(o, "generic-cta", J, 7));
  assert.ok(!has(o, "buzzword", J, 1), "identifiers between > and < are code, not copy");
});

test("long-duration resolves var(--x) from custom properties in scanned CSS", () => {
  const d = plainApp();
  const o = check(d);
  const C = "css/app.css";
  assert.ok(!has(o, "long-duration", C, 1), "100ms token is fine");
  assert.equal(o.findings.find((f) => f.rule === "long-duration" && f.file === C && f.line === 2)?.severity, "high");
  assert.equal(o.findings.find((f) => f.rule === "long-duration" && f.file === C && f.line === 3)?.severity, "high");
  assert.equal(o.findings.find((f) => f.rule === "long-duration" && f.file === C && f.line === 4)?.severity, "medium");
  // single-file run still resolves tokens defined in another file
  const one = check(d, ["--files", "css/app.css"]);
  assert.ok(has(one, "long-duration", C, 2));
});
