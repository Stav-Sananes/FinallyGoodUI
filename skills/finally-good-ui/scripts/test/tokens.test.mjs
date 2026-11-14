import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp, SR } from "./_h.mjs";
import { contrastRatio } from "../lib/contrast.mjs";
import { cssValue, toDtcg } from "../lib/tokens.mjs";
import { loadTokens } from "../lib/token-files.mjs";

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
  assert.equal(saved.color.primary.$value.colorSpace, "oklch", "written in DTCG 2025.10");
  assert.deepEqual(a.files.sort(), [".design/tokens.dark.json", ".design/tokens.json", ".design/tokens.resolver.json"]);
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
const LEGACY = fx("tokens/legacy.tokens.json"); // the pre-2025.10 shape, kept to prove both are read
const defaults = () => loadTokens(DEF);
const css = (v) => cssValue("color", v);

test("default tokens: groups, motion exactly per the duration/easing tokens", () => {
  const t = defaults();
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
  const c = defaults().color;
  for (const n of ["background", "foreground", "card", "card-foreground", "primary", "primary-foreground", "muted",
    "muted-foreground", "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring"]) {
    assert.ok(c[n], n);
    assert.match(css(c[n].$value), /^oklch\(/);
    assert.match(css(c[n].$extensions.fgu.dark), /^oklch\(/);
  }
  const pairs = [["foreground", "background"], ["card-foreground", "card"], ["primary-foreground", "primary"],
    ["muted-foreground", "muted"], ["muted-foreground", "background"], ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"], ["success-foreground", "success"], ["warning-foreground", "warning"]];
  for (const [fg, bg] of pairs) {
    assert.ok(contrastRatio(css(c[fg].$value), css(c[bg].$value)) >= 4.5, `light ${fg}/${bg}`);
    assert.ok(contrastRatio(css(c[fg].$extensions.fgu.dark), css(c[bg].$extensions.fgu.dark)) >= 4.5, `dark ${fg}/${bg}`);
  }
  assert.ok(contrastRatio(css(c.ring.$value), css(c.background.$value)) >= 3, "ring light");
  assert.ok(contrastRatio(css(c.ring.$extensions.fgu.dark), css(c.background.$extensions.fgu.dark)) >= 3, "ring dark");
  assert.ok(contrastRatio(css(c.primary.$value), css(c.background.$value)) >= 3, "primary as UI on bg light");
  assert.ok(contrastRatio(css(c.primary.$extensions.fgu.dark), css(c.background.$extensions.fgu.dark)) >= 3, "primary dark");
});

// ---------- emit ----------
const emit = (fmt, file = DEF) => run("emit-tokens.mjs", ["--in", file, "--format", fmt]);

test("emit css: names + dark blocks", () => {
  const r = emit("css");
  assert.equal(r.code, 0, r.stderr);
  const s = r.stdout;
  assert.match(s, /:root \{[^}]*--color-background: oklch\(/);
  for (const v of ["--font-sans", "--text-base: 16px", "--space-4: 16px", "--radius-md", "--shadow-md",
    "--duration-standard: 250ms", "--ease-enter: cubic-bezier(0, 0, 0, 1)", "--ease-linear: linear"]) assert.ok(s.includes(v), v);
  assert.match(s, /\.dark, \[data-theme="dark"\] \{[^}]*--color-background:/);
  assert.match(s, /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\.light\):not\(\[data-theme="light"\]\) \{[^}]*--color-background:/);
  // native controls and scrollbars follow the theme only when color-scheme says so
  assert.match(s, /\.dark, \[data-theme="dark"\] \{[^}]*color-scheme: dark;/);
  assert.match(s, /:root:not\(\.light\):not\(\[data-theme="light"\]\) \{[^}]*color-scheme: dark;/);
  assert.doesNotMatch(s.split(".dark,")[0], /color-scheme/, "the light :root block leaves the browser default");
});

test("default tokens: an overlay scrim role for dialogs and sheets, translucent in both themes", () => {
  const c = defaults().color;
  assert.ok(c.overlay, "overlay");
  assert.match(css(c.overlay.$value), /^oklch\([^)]*\/\s*0?\.\d+\)$/);
  assert.match(css(c.overlay.$extensions.fgu.dark), /^oklch\([^)]*\/\s*0?\.\d+\)$/);
  assert.match(emit("css").stdout, /--color-overlay: oklch\(/);
  const recipe = readFileSync(join(SR, "recipes", "motion", "dialog-enter-exit.md"), "utf8");
  assert.match(recipe, /::backdrop \{\s*background: var\(--color-overlay\)/);
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

// ---------- tracking (canon craft.tracking-by-size) ----------
test("default tokens: letter-spacing per text step, tightening with size; caps tracking positive", () => {
  const t = defaults();
  const ls = Object.fromEntries(Object.entries(t.text).map(([k, v]) => [k, v.$extensions.fgu.letterSpacing]));
  for (const [k, v] of Object.entries(ls)) { assert.ok(v, `text.${k} has letterSpacing`); assert.equal(v.unit, "em"); }
  for (const k of ["xs", "sm", "base", "lg"]) assert.equal(ls[k].value, 0, `body step ${k} untracked`);
  for (const k of ["5xl", "6xl"]) assert.ok(ls[k].value <= -0.02 && ls[k].value >= -0.04, `display ${k}`);
  for (const k of ["2xl", "3xl", "4xl"]) assert.ok(ls[k].value <= -0.01 && ls[k].value >= -0.02, `heading ${k}`);
  assert.equal(t.tracking.caps.$type, "number", "letter-spacing in em is a number token in DTCG 2025.10");
  assert.ok(t.tracking.caps.$value >= 0.04 && t.tracking.caps.$value <= 0.1);
});

test("emit: tracking reaches every format", () => {
  const css = emit("css").stdout;
  assert.match(css, /--text-6xl--letter-spacing: -0\.03em;/);
  assert.match(css, /--text-base--letter-spacing: 0em;/);
  assert.match(css, /--tracking-caps: 0\.06em;/);
  const tw4 = emit("tailwind4").stdout;
  assert.match(tw4, /@theme \{[^}]*--text-6xl--letter-spacing: -0\.03em;/);
  assert.match(tw4, /--tracking-caps: 0\.06em;/);
  const tw3 = emit("tailwind3").stdout;
  assert.match(tw3, /"6xl": \["var\(--text-6xl\)",\{"lineHeight":"var\(--text-6xl--line-height\)","letterSpacing":"var\(--text-6xl--letter-spacing\)"\}\]/);
  assert.match(tw3, /letterSpacing: \{[^}]*"caps": "var\(--tracking-caps\)"/);
  const mui = JSON.parse(emit("mui").stdout);
  assert.equal(mui.typography.h1.letterSpacing, "-0.03em");
  assert.equal(mui.typography.h1.lineHeight, 1.05);
  assert.equal(mui.typography.body1.letterSpacing, "0em");
  assert.equal(mui.typography.overline.letterSpacing, "0.06em");
  const json = JSON.parse(emit("json").stdout);
  assert.equal(json.light["--text-6xl--letter-spacing"], "-0.03em");
  assert.equal(json.light["--tracking-caps"], "0.06em");
});

// ---------- extract: letter-spacing ----------
test("extract: CSS tracking vars and per-step text metrics", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<html></html>");
  writeFileSync(join(d, "styles.css"), `:root {
  --text-sm: 14px; --text-sm--letter-spacing: 0.01em; --text-sm--line-height: 1.4;
  --text-4xl: 2.25rem; --text-4xl--letter-spacing: -0.02em;
  --tracking-tight: -0.025em; --letter-spacing-caps: 0.06em;
}`);
  const o = extract(d);
  assert.deepEqual(o.tokens.text.sm.$value, { value: 14, unit: "px" });
  assert.deepEqual(o.tokens.text.sm.$extensions.fgu, { letterSpacing: { value: 0.01, unit: "em" }, lineHeight: 1.4 });
  assert.deepEqual(o.tokens.text["4xl"].$extensions.fgu, { letterSpacing: { value: -0.02, unit: "em" } });
  assert.deepEqual(o.tokens.tracking.tight.$value, { value: -0.025, unit: "em" });
  assert.equal(o.tokens.tracking.tight.$type, "dimension");
  assert.deepEqual(o.tokens.tracking.caps.$value, { value: 0.06, unit: "em" });
  assert.ok(!o.tokens.text["sm--letter-spacing"], "metric is not its own text token");
});

test("extract: tailwind v3 letterSpacing and fontSize tuples", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<html></html>");
  writeFileSync(join(d, "tailwind.config.js"), `module.exports = { theme: { extend: {
    letterSpacing: { tighter: '-0.04em', caps: '0.08em' },
    fontSize: { body: '1rem', hero: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }], lead: ['1.25rem', '1.6'] },
  } } };`);
  const o = extract(d);
  assert.deepEqual(o.tokens.tracking.tighter.$value, { value: -0.04, unit: "em" });
  assert.deepEqual(o.tokens.tracking.caps.$value, { value: 0.08, unit: "em" });
  assert.deepEqual(o.tokens.text.body.$value, { value: 1, unit: "rem" });
  assert.deepEqual(o.tokens.text.hero.$value, { value: 3, unit: "rem" });
  assert.deepEqual(o.tokens.text.hero.$extensions.fgu, { lineHeight: 1.1, letterSpacing: { value: -0.03, unit: "em" } });
  assert.deepEqual(o.tokens.text.lead.$extensions.fgu, { lineHeight: 1.6 });
});

test("extract -> emit round trip keeps letter-spacing", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<html></html>");
  writeFileSync(join(d, "styles.css"), ":root{--text-xl:20px;--text-xl--letter-spacing:-0.01em;--tracking-caps:0.05em}");
  writeFileSync(join(d, "t.json"), JSON.stringify(extract(d).tokens));
  const css = emit("css", join(d, "t.json")).stdout;
  assert.match(css, /--text-xl--letter-spacing: -0\.01em;/);
  assert.match(css, /--tracking-caps: 0\.05em;/);
});

// ---------- emit js (motion tokens helper) ----------
test("emit js: motion-tokens module reads CSS vars, falls back to token values", async () => {
  const r = emit("js");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /generated by finally-good-ui emit-tokens/);
  const d = tmp();
  writeFileSync(join(d, "motion-tokens.mjs"), r.stdout);
  const m = await import(join(d, "motion-tokens.mjs"));
  // no document (server / node): token defaults
  assert.equal(m.ms("standard"), 250);
  assert.equal(m.sec("standard"), 0.25);
  assert.deepEqual(m.ease("move"), [0.2, 0, 0, 1]);
  assert.deepEqual(m.ease("linear"), [0, 0, 1, 1]);
  assert.deepEqual(m.durations, ["instant", "micro", "short", "standard", "medium", "long", "hero"]);
  assert.ok(m.easings.includes("enter-emphasized"));
  // browser: live CSS variable wins (theme / reduced-motion overrides)
  const vars = { "--duration-standard": " 180ms", "--ease-move": "cubic-bezier(0.1, 0, 0, 1)" };
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({ getPropertyValue: (n) => vars[n] ?? "" });
  try {
    assert.equal(m.ms("standard"), 180);
    assert.deepEqual(m.ease("move"), [0.1, 0, 0, 1]);
    assert.equal(m.ms("long"), 400, "unset var falls back to the token");
  } finally { delete globalThis.document; delete globalThis.getComputedStyle; }
  assert.throws(() => m.ms("nope"), /unknown duration token "nope"/);
});

// ---------- DTCG 2025.10: read both shapes, write the standard one ----------

test("cssValue reads DTCG colour objects (oklch, alpha, none, srgb) and keeps CSS strings", () => {
  assert.equal(cssValue("color", "oklch(0.5 0.14 262)"), "oklch(0.5 0.14 262)");
  assert.equal(cssValue("color", { colorSpace: "oklch", components: [0.5, 0.14, 262] }), "oklch(0.5 0.14 262)");
  assert.equal(cssValue("color", { colorSpace: "oklch", components: [0.21, 0.012, 265], alpha: 0.45 }), "oklch(0.21 0.012 265 / 0.45)");
  assert.equal(cssValue("color", { colorSpace: "oklch", components: [1, 0, "none"] }), "oklch(1 0 none)");
  assert.equal(cssValue("color", { colorSpace: "srgb", components: [1, 0, 0], hex: "#ff0000" }), "#ff0000");
  assert.equal(cssValue("color", { colorSpace: "srgb", components: [1, 0, 0], alpha: 0.5 }), "color(srgb 1 0 0 / 0.5)");
  assert.equal(cssValue("tracking", 0.06), "0.06em", "letter-spacing as a number token (em multiple)");
  assert.equal(cssValue("shadow", [{ color: { colorSpace: "oklch", components: [0, 0, 0], alpha: 0.4 },
    offsetX: { value: 0, unit: "px" }, offsetY: { value: 1, unit: "px" }, blur: { value: 2, unit: "px" }, spread: { value: 0, unit: "px" } }]),
  "0 1px 2px 0 oklch(0 0 0 / 0.4)");
});

test("toDtcg: spec-shaped base and dark trees; nothing lost", () => {
  const legacy = JSON.parse(readFileSync(LEGACY, "utf8"));
  const { base, dark } = toDtcg(legacy);
  for (const tok of Object.values(base.color)) {
    assert.equal(tok.$value.colorSpace, "oklch");
    assert.equal(tok.$value.components.length, 3);
    assert.match(tok.$value.hex, /^#[0-9a-f]{6}$/);
    assert.equal(tok.$extensions?.fgu?.dark, undefined, "dark lives in its own file");
  }
  for (const tok of Object.values(base.shadow)) for (const layer of [].concat(tok.$value)) {
    assert.deepEqual(Object.keys(layer).sort(), ["blur", "color", "offsetX", "offsetY", "spread"]);
    assert.equal(layer.color.colorSpace, "oklch");
  }
  assert.equal(base.tracking.caps.$type, "number");
  assert.equal(base.tracking.caps.$value, 0.06);
  assert.equal(dark.color.background.$value.colorSpace, "oklch");
  assert.equal(dark.font, undefined, "only themed tokens go in the dark set");
});

test("emit --format dtcg writes tokens + dark + resolver; reading them back emits the same CSS", () => {
  const d = tmp();
  const w = run("emit-tokens.mjs", ["--in", LEGACY, "--format", "dtcg", "--out-dir", d]);
  assert.equal(w.code, 0, w.stderr);
  assert.deepEqual(w.json.written.sort(), ["tokens.dark.json", "tokens.json", "tokens.resolver.json"]);
  const resolver = JSON.parse(readFileSync(join(d, "tokens.resolver.json"), "utf8"));
  assert.equal(resolver.version, "2025.10");
  assert.deepEqual(resolver.modifiers.theme.contexts.dark, [{ $ref: "tokens.dark.json" }]);
  const want = emit("css", LEGACY).stdout;
  assert.equal(emit("css", join(d, "tokens.json")).stdout, want, "tokens.json picks up its sibling resolver");
  assert.equal(emit("css", join(d, "tokens.resolver.json")).stdout, want, "or read through the resolver directly");
  for (const fmt of ["js", "tailwind4", "tailwind3", "mui", "json"])
    assert.equal(emit(fmt, join(d, "tokens.json")).stdout, emit(fmt, LEGACY).stdout, `${fmt} is the same from either shape`);
  const again = run("emit-tokens.mjs", ["--in", LEGACY, "--format", "dtcg", "--out-dir", d]);
  assert.equal(again.code, 2, "refuses to overwrite without --force");
  assert.equal(run("emit-tokens.mjs", ["--in", LEGACY, "--format", "dtcg", "--out-dir", d, "--force"]).code, 0);
});

test("loadTokens resolves {aliases}, in base and dark values", () => {
  const d = tmp();
  writeFileSync(join(d, "tokens.json"), JSON.stringify({ color: {
    primary: { $type: "color", $value: { colorSpace: "oklch", components: [0.5, 0.14, 262] } },
    ring: { $type: "color", $value: "{color.primary}" },
  } }));
  writeFileSync(join(d, "tokens.dark.json"), JSON.stringify({ color: {
    primary: { $value: { colorSpace: "oklch", components: [0.72, 0.12, 262] } },
    ring: { $value: "{color.primary}" },
  } }));
  writeFileSync(join(d, "tokens.resolver.json"), JSON.stringify({ version: "2025.10",
    sets: { base: { sources: [{ $ref: "tokens.json" }] } },
    modifiers: { theme: { contexts: { light: [], dark: [{ $ref: "tokens.dark.json" }] }, default: "light" } },
    resolutionOrder: [{ $ref: "#/sets/base" }, { $ref: "#/modifiers/theme" }] }));
  const t = loadTokens(join(d, "tokens.json"));
  assert.equal(cssValue("color", t.color.ring.$value), "oklch(0.5 0.14 262)");
  assert.equal(cssValue("color", t.color.ring.$extensions.fgu.dark), "oklch(0.72 0.12 262)");
  writeFileSync(join(d, "loop.json"), JSON.stringify({ color: { a: { $value: "{color.b}" }, b: { $value: "{color.a}" } } }));
  assert.throws(() => loadTokens(join(d, "loop.json")), /circular/);
});

test("check-static --tokens reads a DTCG token set", () => {
  const d = tmp();
  run("emit-tokens.mjs", ["--in", DEF, "--format", "dtcg", "--out-dir", join(d, ".design")]);
  writeFileSync(join(d, "a.css"), ".x { margin: 16px; padding: 13px; }\n");
  const r = run("check-static.mjs", ["--root", d, "--tokens", ".design/tokens.json"]);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.findings.filter((f) => f.rule === "off-scale-spacing").map((f) => f.message.match(/Spacing (\S+)/)[1]), ["13px"]);
});

test("the shipped defaults are DTCG 2025.10 and emit exactly what the old file did", () => {
  const raw = JSON.parse(readFileSync(DEF, "utf8"));
  for (const tok of Object.values(raw.color)) assert.equal(typeof tok.$value, "object", "colour objects on disk");
  assert.ok(!JSON.stringify(raw).includes('"dark"'), "no dark values inside the base file");
  for (const fmt of ["css", "tailwind4", "tailwind3", "mui", "json", "js"])
    assert.equal(emit(fmt).stdout, emit(fmt, LEGACY).stdout, `${fmt} unchanged by the migration`);
});

// ---------- motion helpers for every animation library's input format ----------
const motionModule = async () => {
  const d = tmp();
  writeFileSync(join(d, "motion-tokens.mjs"), emit("js").stdout);
  return import(join(d, "motion-tokens.mjs"));
};

test("motion helpers: CSS easing strings, GSAP bezier strings, spring configs", async () => {
  const m = await motionModule();
  assert.equal(m.cssEase("move"), "cubic-bezier(0.2, 0, 0, 1)", "dnd-kit, SortableJS, AutoAnimate, WAAPI, Number Flow");
  assert.equal(m.cssEase("linear"), "linear");
  assert.equal(m.bezierString("move"), "0.2,0,0,1", "GSAP CustomEase.create(name, bezierString(…))");
  assert.deepEqual(m.spring("short"), { type: "spring", visualDuration: 0.15, bounce: 0 });
  assert.deepEqual(m.spring("medium", { bounce: 0.2 }), { type: "spring", visualDuration: 0.3, bounce: 0.2 });
  assert.throws(() => m.cssEase("wobble"), /unknown easing token "wobble"/);
});

test("motion helpers: easeFn solves the cubic-bezier (Svelte, React Spring, Lenis take functions)", async () => {
  const m = await motionModule();
  for (const name of m.easings) {
    const f = m.easeFn(name);
    assert.equal(f(0), 0, name);
    assert.ok(Math.abs(f(1) - 1) < 1e-6, name);
  }
  assert.ok(Math.abs(m.easeFn("linear")(0.37) - 0.37) < 1e-6);
  assert.ok(m.easeFn("enter")(0.5) > 0.5, "decelerating curve is ahead at half time");
  assert.ok(m.easeFn("exit")(0.5) < 0.5, "accelerating curve is behind at half time");
  // y at the x where the curve's parameter is 0.5, computed by hand for move = (0.2,0,0,1)
  const bx = (t) => 3 * (1 - t) ** 2 * t * 0.2 + t ** 3, by = (t) => 3 * (1 - t) * t ** 2 + t ** 3;
  assert.ok(Math.abs(m.easeFn("move")(bx(0.5)) - by(0.5)) < 1e-4);
});

test("motion helpers: reduced motion collapses spatial durations to 0", async () => {
  const m = await motionModule();
  assert.equal(m.reduced(), false, "no window: motion allowed");
  assert.equal(m.msMotion("standard"), 250);
  globalThis.matchMedia = (q) => ({ matches: q === "(prefers-reduced-motion: reduce)" });
  try {
    assert.equal(m.reduced(), true);
    assert.equal(m.msMotion("standard"), 0);
    assert.equal(m.secMotion("standard"), 0);
    assert.equal(m.ms("standard"), 250, "plain ms() is unchanged: opacity fades may keep their time");
  } finally { delete globalThis.matchMedia; }
});

test("tailwind4: named duration utilities (Tailwind has no --duration-* theme namespace)", () => {
  const s = emit("tailwind4").stdout;
  assert.match(s, /@utility duration-\* \{\s*--tw-duration: --value\(--duration-\*\);\s*transition-duration: --value\(--duration-\*\);\s*\}/);
});

// ---------- shadcn/ui (and shadcn-vue, shadcn-svelte, Spartan): same variable names ----------
test("emit shadcn: unprefixed :root/.dark vars, @theme inline map, fallbacks for roles we don't define", () => {
  const r = emit("shadcn");
  assert.equal(r.code, 0, r.stderr);
  const s = r.stdout;
  const root = s.match(/:root \{([^}]*)\}/)[1];
  assert.match(root, /--primary: oklch\(0\.5 0\.14 262\);/);
  assert.match(root, /--radius: 8px;/, "shadcn's single radius knob = our md");
  assert.match(root, /--popover: var\(--card\);/, "components use bg-popover; we fall back to card");
  assert.match(root, /--secondary: var\(--muted\);/);
  assert.match(root, /--sidebar: var\(--card\);/);
  assert.doesNotMatch(root, /--color-/, "shadcn vars carry no --color- prefix");
  const dark = s.match(/\.dark \{([^}]*)\}/)[1];
  assert.match(dark, /--background: oklch\(0\.17 0\.008 265\);/);
  assert.match(dark, /color-scheme: dark;/);
  assert.match(s, /@theme inline \{[^}]*--color-primary: var\(--primary\);[^}]*--color-popover: var\(--popover\);/);
  assert.match(s, /@theme \{[^}]*--ease-move: cubic-bezier\(0\.2, 0, 0, 1\);/, "motion and type stay ours");
  assert.match(s, /@utility duration-\*/);
});

test("emit shadcn-registry: a registry:theme item the shadcn CLI merges itself", () => {
  const item = JSON.parse(emit("shadcn-registry").stdout);
  assert.equal(item.type, "registry:theme");
  assert.equal(item.$schema, "https://ui.shadcn.com/schema/registry-item.json");
  assert.equal(item.cssVars.light.primary, "oklch(0.5 0.14 262)");
  assert.equal(item.cssVars.dark.background, "oklch(0.17 0.008 265)");
  assert.equal(item.cssVars.light.radius, "8px");
  assert.equal(item.cssVars.theme["ease-move"], "cubic-bezier(0.2, 0, 0, 1)");
  assert.equal(item.cssVars.theme["duration-standard"], "250ms");
});

test("emit mui: CSS theme variables with the project's dark-mode selector (MUI v6+)", () => {
  assert.equal(JSON.parse(emit("mui").stdout).cssVariables, true, "default: follow the OS, MUI's own default");
  const cls = run("emit-tokens.mjs", ["--in", DEF, "--format", "mui", "--mui-scheme", "class"]);
  assert.deepEqual(JSON.parse(cls.stdout).cssVariables, { colorSchemeSelector: "class" });
  const custom = run("emit-tokens.mjs", ["--in", DEF, "--format", "mui", "--mui-scheme", "[data-theme=%s]"]);
  assert.deepEqual(JSON.parse(custom.stdout).cssVariables, { colorSchemeSelector: "[data-theme=%s]" });
});

test("emit daisyui: a light (default) and a dark (prefersdark) theme block; motion stays ours", () => {
  const r = emit("daisyui");
  assert.equal(r.code, 0, r.stderr);
  const [light, dark] = [...r.stdout.matchAll(/@plugin "daisyui\/theme" \{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(light && dark, "two theme blocks");
  assert.match(light, /name: "fgu-light";\s*default: true;\s*prefersdark: false;\s*color-scheme: light;/);
  assert.match(light, /--color-base-100: oklch\(0\.99 0\.002 265\);/, "base-100 = background");
  assert.match(light, /--color-base-content: oklch\(0\.21 0\.012 265\);/);
  assert.match(light, /--color-primary: oklch\(0\.5 0\.14 262\);/);
  assert.match(light, /--color-accent: oklch\(0\.5 0\.14 262\);/, "daisy accent is a brand colour; without a mark role it follows primary");
  assert.match(light, /--color-error: /, "destructive -> error");
  assert.match(light, /--radius-field: 8px;/);
  assert.match(dark, /name: "fgu-dark";\s*default: false;\s*prefersdark: true;\s*color-scheme: dark;/);
  assert.match(dark, /--color-base-100: oklch\(0\.17 0\.008 265\);/);
  assert.match(r.stdout, /@theme \{[^}]*--ease-move:/);
});

// ---------- Chakra UI v3 and Panda CSS v2: one token engine, two wrappers ----------
const themeObject = (out) => JSON.parse(out.match(/^const theme = (\{[\s\S]*?\n\});$/m)[1]);

test("emit chakra: createSystem with tokens, {base,_dark} semantic colours, a brand palette", () => {
  const r = emit("chakra");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /import \{ createSystem, defaultConfig, defineConfig \} from "@chakra-ui\/react";/);
  assert.match(r.stdout, /export const system = createSystem\(defaultConfig, defineConfig\(\{ theme \}\)\);/);
  const t = themeObject(r.stdout);
  assert.equal(t.tokens.durations.standard.value, "250ms");
  assert.equal(t.tokens.easings.move.value, "cubic-bezier(0.2, 0, 0, 1)");
  assert.equal(t.tokens.fonts.body.value, t.tokens.fonts.sans.value, "Chakra reads fonts.body/heading");
  assert.equal(t.tokens.radii.md.value, "8px");
  assert.equal(t.tokens.colors.brand["700"].value, "oklch(0.5 0.14 262)", "seed sits on its step");
  const sc = t.semanticTokens.colors;
  assert.deepEqual(sc.bg.DEFAULT.value, { base: "oklch(0.99 0.002 265)", _dark: "oklch(0.17 0.008 265)" });
  assert.deepEqual(sc.fg.muted.value, { base: sc["muted-foreground"].value.base, _dark: sc["muted-foreground"].value._dark });
  assert.equal(sc.brand.solid.value.base, "oklch(0.5 0.14 262)");
  assert.equal(sc.brand.subtle.value.base, "{colors.brand.100}");
  assert.ok(sc.primary && sc["primary-foreground"], "our own roles stay addressable");
  assert.ok(t.semanticTokens.shadows.md.value._dark, "shadows change in dark mode");
});

test("emit panda: the same theme as a preset", () => {
  const r = emit("panda");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /import \{ definePreset \} from "@pandacss\/dev";/);
  assert.match(r.stdout, /export default definePreset\(\{ name: "finally-good-ui", theme: \{ extend: theme \} \}\);/);
  assert.deepEqual(themeObject(r.stdout), themeObject(emit("chakra").stdout));
});

// ---------- Mantine v9 ----------
const constObject = (out, name) => JSON.parse(out.match(new RegExp(`^const ${name} = (\\{[\\s\\S]*?\\n\\});$`, "m"))[1]);

test("emit mantine: createTheme with a 10-shade brand palette and a light/dark CSS-variable resolver", () => {
  const r = emit("mantine");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /import \{ createTheme \} from "@mantine\/core";/);
  assert.match(r.stdout, /export const theme = createTheme\(themeInput\);/);
  assert.match(r.stdout, /export const resolver = \(\) => resolverInput;/);
  const t = constObject(r.stdout, "themeInput");
  assert.equal(t.colors.brand.length, 10);
  for (const c of t.colors.brand) assert.match(c, /^#[0-9a-f]{6}$/, "Mantine's colour helpers need hex");
  assert.equal(t.primaryColor, "brand");
  assert.ok(Number.isInteger(t.primaryShade.light) && Number.isInteger(t.primaryShade.dark));
  assert.equal(t.defaultRadius, "md");
  assert.equal(t.radius.md, "8px");
  assert.equal(t.spacing.md, "16px");
  assert.equal(t.fontSizes.md, "16px", "Mantine md = our base");
  assert.match(t.fontFamily, /ui-sans-serif|system-ui|Inter/);
  const v = constObject(r.stdout, "resolverInput");
  assert.equal(v.light["--mantine-color-body"], "oklch(0.99 0.002 265)");
  assert.equal(v.dark["--mantine-color-body"], "oklch(0.17 0.008 265)");
  assert.equal(v.dark["--color-primary"], "oklch(0.72 0.12 262)", "our own roles too, per scheme");
  assert.equal(v.variables["--ease-move"], "cubic-bezier(0.2, 0, 0, 1)");
});
