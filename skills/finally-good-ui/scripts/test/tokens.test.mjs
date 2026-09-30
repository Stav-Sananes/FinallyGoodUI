import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp, SR } from "./_h.mjs";
import { contrastRatio } from "../lib/contrast.mjs";

const extract = (dir, extra = []) => {
  const r = run("extract-tokens.mjs", ["--root", dir, ...extra]);
  assert.equal(r.code, 0, r.stderr);
  return r.json;
};

test("extract: next CSS vars, @theme, .dark", () => {
  const o = extract(fx("next"));
  const c = o.tokens.color;
  assert.equal(c.background.$type, "color");
  assert.match(c.background.$value, /^oklch\(/);
  assert.match(c.background.$extensions.fgu.dark, /^oklch\(0\.145/);
  assert.equal(c["primary-foreground"].$value, "oklch(0.985 0 0)");
  assert.match(c.border.$value, /^oklch\(/); // hex converted
  assert.deepEqual(o.tokens.font.sans.$value, ["Inter", "ui-sans-serif", "system-ui"]);
  assert.deepEqual(o.tokens.radius.lg.$value, { value: 0.75, unit: "rem" });
  assert.deepEqual(o.tokens.radius.base.$value, { value: 0.5, unit: "rem" });
  assert.deepEqual(o.tokens.easing.snappy.$value, [0.23, 1, 0.32, 1]);
  assert.deepEqual(o.tokens.duration.standard.$value, { value: 250, unit: "ms" });
});

test("extract: tailwind v3 config regex + drift + usage", () => {
  const o = extract(fx("vite"));
  assert.match(o.tokens.color.brand.$value, /^oklch\(/);
  assert.ok(o.tokens.color["brand-foreground"]);
  assert.ok(o.tokens.color.ink);
  assert.deepEqual(o.tokens.space["18"].$value, { value: 4.5, unit: "rem" });
  assert.deepEqual(o.tokens.space.gutter.$value, { value: 24, unit: "px" });
  assert.deepEqual(o.tokens.radius.card.$value, { value: 12, unit: "px" });
  assert.deepEqual(o.tokens.font.display.$value, ["Fraunces", "serif"]);
  const green = o.usage.colors.find((u) => u.value === "#10b981");
  assert.equal(green.count, 3);
  assert.ok(o.drift.some((d) => d.value === "#10b981" && d.kind === "color"));
  assert.ok(!o.drift.some((d) => d.value === "#3b82f6"), "tokenized brand color is not drift");
  assert.ok(o.usage.spacing.some((u) => u.value === "13px"));
  assert.ok(Array.isArray(o.inferred));
  assert.ok(o.inferred.some((i) => i.role === "primary" && i.value === "#10b981"));
});

test("extract: vue [data-theme=dark]", () => {
  const o = extract(fx("vue"));
  assert.ok(o.tokens.color.bg.$extensions.fgu.dark);
  assert.deepEqual(o.tokens.space.md.$value, { value: 16, unit: "px" });
});

test("extract --write never overwrites without --force", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<html></html>");
  writeFileSync(join(d, "styles.css"), ":root{--color-primary:#2563eb}");
  const a = extract(d, ["--write"]);
  assert.equal(a.written, ".design/tokens.json");
  const saved = JSON.parse(readFileSync(join(d, ".design", "tokens.json"), "utf8"));
  assert.ok(saved.color.primary);
  writeFileSync(join(d, ".design", "tokens.json"), "{\"keep\":1}");
  const b = extract(d, ["--write"]);
  assert.equal(b.written, null);
  assert.match(b.warnings.join(" "), /exists/);
  assert.equal(readFileSync(join(d, ".design", "tokens.json"), "utf8"), "{\"keep\":1}");
  extract(d, ["--write", "--force"]);
  assert.ok(existsSync(join(d, ".design", "tokens.json")));
  assert.ok(JSON.parse(readFileSync(join(d, ".design", "tokens.json"), "utf8")).color);
});

// ---------- default tokens ----------
const DEF = join(SR, "tokens", "default.tokens.json");

test("default tokens: groups, motion exactly per spec §4", () => {
  const t = JSON.parse(readFileSync(DEF, "utf8"));
  for (const g of ["color", "font", "text", "space", "radius", "shadow", "duration", "easing"]) assert.ok(t[g], g);
  const d = Object.fromEntries(Object.entries(t.duration).map(([k, v]) => [k, v.$value.value]));
  assert.deepEqual(d, { instant: 50, micro: 100, short: 150, standard: 250, medium: 300, long: 400, hero: 500 });
  const e = Object.fromEntries(Object.entries(t.easing).map(([k, v]) => [k, v.$value]));
  assert.deepEqual(e, { enter: [0, 0, 0, 1], "enter-emphasized": [0.05, 0.7, 0.1, 1], exit: [0.3, 0, 1, 1],
    move: [0.2, 0, 0, 1], snappy: [0.23, 1, 0.32, 1], linear: [0, 0, 1, 1] });
  const sizes = Object.values(t.text).map((v) => v.$value.value);
  assert.deepEqual(sizes, [12, 14, 16, 18, 20, 24, 30, 36, 48, 60]);
  for (const v of Object.values(t.space)) assert.equal(v.$value.value % 4, 0);
});

test("default tokens: semantic pairs pass 4.5:1 in light and dark", () => {
  const c = JSON.parse(readFileSync(DEF, "utf8")).color;
  for (const n of ["background", "foreground", "card", "card-foreground", "primary", "primary-foreground", "muted",
    "muted-foreground", "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring"]) {
    assert.ok(c[n], n);
    assert.match(c[n].$value, /^oklch\(/);
    assert.match(c[n].$extensions.fgu.dark, /^oklch\(/);
  }
  const pairs = [["foreground", "background"], ["card-foreground", "card"], ["primary-foreground", "primary"],
    ["muted-foreground", "muted"], ["muted-foreground", "background"], ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"], ["success-foreground", "success"], ["warning-foreground", "warning"]];
  for (const [fg, bg] of pairs) {
    assert.ok(contrastRatio(c[fg].$value, c[bg].$value) >= 4.5, `light ${fg}/${bg}`);
    assert.ok(contrastRatio(c[fg].$extensions.fgu.dark, c[bg].$extensions.fgu.dark) >= 4.5, `dark ${fg}/${bg}`);
  }
  assert.ok(contrastRatio(c.ring.$value, c.background.$value) >= 3, "ring light");
  assert.ok(contrastRatio(c.ring.$extensions.fgu.dark, c.background.$extensions.fgu.dark) >= 3, "ring dark");
  assert.ok(contrastRatio(c.primary.$value, c.background.$value) >= 3, "primary as UI on bg light");
  assert.ok(contrastRatio(c.primary.$extensions.fgu.dark, c.background.$extensions.fgu.dark) >= 3, "primary dark");
});

// ---------- emit ----------
const emit = (fmt, file = DEF) => run("emit-tokens.mjs", ["--in", file, "--format", fmt]);

test("emit css: names + dark blocks per §5.5", () => {
  const r = emit("css");
  assert.equal(r.code, 0, r.stderr);
  const s = r.stdout;
  assert.match(s, /:root \{[^}]*--color-background: oklch\(/);
  for (const v of ["--font-sans", "--text-base: 16px", "--space-4: 16px", "--radius-md", "--shadow-md",
    "--duration-standard: 250ms", "--ease-enter: cubic-bezier(0, 0, 0, 1)", "--ease-linear: linear"]) assert.ok(s.includes(v), v);
  assert.match(s, /\.dark, \[data-theme="dark"\] \{[^}]*--color-background:/);
  assert.match(s, /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\.light\):not\(\[data-theme="light"\]\) \{[^}]*--color-background:/);
});

test("emit tailwind4", () => {
  const s = emit("tailwind4").stdout;
  assert.match(s, /@theme \{[^}]*--color-primary:/);
  assert.match(s, /\.dark, \[data-theme="dark"\] \{/);
});

test("emit tailwind3 references CSS vars", () => {
  const s = emit("tailwind3").stdout;
  assert.match(s, /module\.exports = \{/);
  assert.match(s, /theme: \{\s*extend: \{/);
  assert.match(s, /"primary-foreground": "var\(--color-primary-foreground\)"/);
  assert.match(s, /transitionDuration: \{[^}]*"standard": "var\(--duration-standard\)"/);
});

test("emit mui: createTheme-shaped with hex palette", () => {
  const r = emit("mui");
  const m = JSON.parse(r.stdout);
  assert.match(m.palette.primary.main, /^#[0-9a-f]{6}$/);
  assert.match(m.colorSchemes.dark.palette.background.default, /^#[0-9a-f]{6}$/);
  assert.equal(m.colorSchemes.light.palette.text.primary, m.palette.text.primary);
  assert.match(m.typography.fontFamily, /system-ui|sans/);
  assert.equal(typeof m.shape.borderRadius, "number");
  assert.equal(m.transitions.duration.standard, 300);
  assert.equal(m.transitions.easing.easeOut, "cubic-bezier(0, 0, 0, 1)");
});

test("emit json: flat var maps", () => {
  const m = JSON.parse(emit("json").stdout);
  assert.ok(m.light["--color-background"]);
  assert.ok(m.dark["--color-background"]);
});

test("emit usage errors", () => {
  assert.equal(run("emit-tokens.mjs", ["--format", "css"]).code, 2);
  assert.equal(emit("scss").code, 2);
  assert.equal(emit("css", join(tmp(), "missing.json")).code, 2);
});

test("emit handles extracted tokens round trip", () => {
  const d = tmp();
  const o = run("extract-tokens.mjs", ["--root", fx("next")]).json;
  writeFileSync(join(d, "t.json"), JSON.stringify(o.tokens));
  const s = emit("css", join(d, "t.json")).stdout;
  assert.match(s, /--color-primary-foreground: oklch\(0\.985 0 0\)/);
  assert.match(s, /--font-sans: Inter, ui-sans-serif, system-ui/);
});
