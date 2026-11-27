import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { loadTokens } from "../lib/token-files.mjs";

// Bring an existing design system in: Figma's native variable export (one DTCG file per mode),
// Tokens Studio (legacy value/type or DTCG mode, token sets) and DTCG resolvers (Terrazzo, ours).
// The result is our standard three-file token set plus a report of what didn't map.
const write = (dir, name, obj) => { const f = join(dir, name); writeFileSync(f, JSON.stringify(obj)); return f; };
const srgb = (hex) => ({ colorSpace: "srgb", components: [1, 1, 1], alpha: 1, hex });

test("Figma export: one file per mode -> tokens + dark + resolver; seconds become ms, single families become lists", () => {
  const d = tmp();
  const light = write(d, "light.json", {
    color: { background: { $type: "color", $value: srgb("#FFFFFF") }, primary: { $type: "color", $value: { colorSpace: "srgb", components: [0.145, 0.388, 0.922], hex: "#2563EB" } } },
    spacing: { 4: { $type: "dimension", $value: { value: 16, unit: "px" } } },
    radius: { md: { $type: "dimension", $value: { value: 8, unit: "px" } } },
    motion: { fast: { $type: "duration", $value: { value: 0.15, unit: "s" } } },
    font: { body: { $type: "fontFamily", $value: "Inter" } },
  });
  const dark = write(d, "dark.json", { color: { background: { $type: "color", $value: srgb("#0B0D12") }, primary: { $type: "color", $value: srgb("#60A5FA") } } });
  const out = join(d, "design");
  const r = run("import-tokens.mjs", ["--in", light, "--dark", dark, "--out-dir", out]);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.written.sort(), ["tokens.dark.json", "tokens.json", "tokens.resolver.json"]);
  const t = loadTokens(join(out, "tokens.resolver.json"));
  assert.equal(t.color.background.$value.hex.toLowerCase(), "#ffffff");
  assert.equal(t.color.background.$extensions.fgu.dark.hex.toLowerCase(), "#0b0d12");
  assert.deepEqual(t.space["4"].$value, { value: 16, unit: "px" });
  assert.deepEqual(t.radius.md.$value, { value: 8, unit: "px" });
  assert.deepEqual(t.duration.fast.$value, { value: 150, unit: "ms" });
  assert.deepEqual(t.font.body.$value, ["Inter"]);
  assert.ok(t.easing, "groups the import lacks entirely come from the defaults");
  assert.ok(r.json.filledFromDefaults.includes("easing"));
  assert.ok(!r.json.filledFromDefaults.includes("color"), "colours are never filled in");
  assert.ok(r.json.missingRoles.includes("foreground"));
  const css = run("emit-tokens.mjs", ["--in", join(out, "tokens.json"), "--format", "css"]);
  assert.match(css.stdout, /--color-primary: #2563eb;/i);
  assert.match(css.stdout, /--duration-fast: 150ms;/);
});

test("Tokens Studio legacy file: sets, references, math and its own types; what doesn't map is reported", () => {
  const d = tmp();
  const f = write(d, "tokens.json", {
    global: {
      colors: { blue: { 500: { value: "#2563eb", type: "color" } }, white: { value: "#ffffff", type: "color" } },
      spacing: { sm: { value: "8", type: "spacing" }, md: { value: "{spacing.sm} * 2", type: "spacing" } },
      radii: { md: { value: "8px", type: "borderRadius" } },
      fonts: { body: { value: "Inter", type: "fontFamilies" } },
      shadow: { card: { value: { x: "0", y: "2", blur: "8", spread: "0", color: "#0000001a", type: "dropShadow" }, type: "boxShadow" } },
      type: { body: { value: { fontFamily: "{fonts.body}", fontSize: "16", lineHeight: "150%", letterSpacing: "0" }, type: "typography" } },
      opacity: { muted: { value: "0.6", type: "opacity" } },
    },
    light: { background: { value: "{colors.white}", type: "color" }, primary: { value: "{colors.blue.500}", type: "color" } },
    dark: { background: { value: "#0b0d12", type: "color" }, primary: { value: "#60a5fa", type: "color" } },
    $themes: [], $metadata: { tokenSetOrder: ["global", "light", "dark"] },
  });
  const out = join(d, "design");
  const r = run("import-tokens.mjs", ["--in", f, "--out-dir", out]);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.sets, { base: ["global", "light"], dark: ["dark"] });
  const t = loadTokens(join(out, "tokens.resolver.json"));
  assert.equal(t.color.primary.$value.hex, "#2563eb", "alias resolved");
  assert.equal(t.color.primary.$extensions.fgu.dark.hex, "#60a5fa");
  assert.equal(t.color["blue-500"].$value.hex, "#2563eb");
  assert.deepEqual(t.space.sm.$value, { value: 8, unit: "px" }, "unitless Studio numbers are px");
  assert.deepEqual(t.space.md.$value, { value: 16, unit: "px" }, "math evaluated");
  assert.deepEqual(t.radius.md.$value, { value: 8, unit: "px" });
  assert.deepEqual(t.font.body.$value, ["Inter"]);
  assert.equal(t.shadow.card.$value.blur.value, 8);
  assert.deepEqual(t.text.body.$value, { value: 16, unit: "px" });
  assert.equal(t.text.body.$extensions.fgu.lineHeight, 1.5);
  assert.deepEqual(r.json.unmapped.map((u) => u.path), ["opacity.muted"]);
});

test("a DTCG resolver (ours, Terrazzo) imports unchanged: the emitted CSS is identical", () => {
  const out = join(tmp(), "design");
  const r = run("import-tokens.mjs", ["--in", join(SR, "tokens", "default.tokens.resolver.json"), "--out-dir", out]);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.unmapped, []);
  assert.deepEqual(r.json.missingRoles, []);
  const css = (f) => run("emit-tokens.mjs", ["--in", f, "--format", "css"]).stdout;
  assert.equal(css(join(out, "tokens.json")), css(join(SR, "tokens", "default.tokens.json")));
});

test("import refuses to overwrite an existing token set without --force", () => {
  const d = tmp();
  const f = write(d, "light.json", { color: { background: { $type: "color", $value: srgb("#FFFFFF") } } });
  const out = join(d, "design");
  assert.equal(run("import-tokens.mjs", ["--in", f, "--out-dir", out]).code, 0);
  const again = run("import-tokens.mjs", ["--in", f, "--out-dir", out]);
  assert.equal(again.code, 2);
  assert.match(again.stderr, /--force/);
  assert.equal(run("import-tokens.mjs", ["--in", f, "--out-dir", out, "--force"]).code, 0);
  assert.ok(existsSync(join(out, "tokens.resolver.json")));
  assert.equal(run("import-tokens.mjs", []).code, 2);
});

// ---- the component token groups survive an import (review T1): z, size.control, border-width, ring
test("import keeps z, size.control, border-width and ring as their own groups; a plain size.* stays spacing", () => {
  const d = tmp();
  const dim = (v) => ({ $type: "dimension", $value: { value: v, unit: "px" } });
  const f = write(d, "in.json", {
    z: { toast: { $type: "number", $value: 100 }, overlay: { $type: "number", $value: 50 } },
    size: { control: { md: dim(40), lg: dim(44) }, huge: dim(96) },
    "border-width": { strong: dim(2) },
    ring: { width: dim(2) },
    color: { background: { $type: "color", $value: srgb("#FFFFFF") } },
  });
  const r = run("import-tokens.mjs", ["--in", f, "--out-dir", join(d, "out"), "--no-defaults"]);
  assert.equal(r.code, 0, r.stderr);
  const t = loadTokens(join(d, "out", "tokens.json"));
  assert.equal(t.z.toast.$value, 100);
  assert.equal(t.z.overlay.$value, 50);
  assert.equal(t.size["control-md"].$value.value, 40);
  assert.equal(t.size["control-lg"].$value.value, 44);
  assert.equal(t["border-width"].strong.$value.value, 2);
  assert.equal(t.ring.width.$value.value, 2);
  assert.equal(t.size.huge, undefined, "negative control: size.huge is a spacing alias, not a control size");
  assert.ok(t.space?.huge || t.space?.["huge"], "it went to space");
});
