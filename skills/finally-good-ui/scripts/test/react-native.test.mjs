import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";
import { nativeColor } from "../lib/react-native.mjs";

// React Native reads tokens through its styling layer (Uniwind, NativeWind) and can't use var() in
// StyleSheet values, rem, em letter-spacing, unitless line-height or OKLCH. These formats were compiled
// with Uniwind 1.13's and NativeWind 4.2's own CSS-to-native compilers: both resolve every utility
// below to literal native values, with separate light and dark colours.
const DEF = join(SR, "tokens", "default.tokens.resolver.json");
const emit = (format) => {
  const r = run("emit-tokens.mjs", ["--in", DEF, "--format", format]);
  assert.equal(r.code, 0, r.stderr);
  return r.stdout;
};

function project(deps, files = {}) {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps }));
  for (const [f, text] of Object.entries(files)) writeFileSync(join(d, f), text);
  return detectStack(d);
}

test("detect: Expo + Uniwind + Expo Router + Reanimated is a native project, not React on the web", () => {
  const p = project({ expo: "~54.0.0", "expo-router": "~6.0.0", react: "19.1.0", "react-native": "0.81.0",
    uniwind: "^1.13.0", "react-native-reanimated": "~4.1.0", "react-native-web": "^0.21.0" });
  assert.equal(p.framework, "expo");
  assert.equal(p.router, "expo-router");
  assert.deepEqual(p.native, { styling: "uniwind", web: true });
  assert.ok(p.animation.includes("reanimated"));
  assert.equal(p.viewTransitions, null, "no DOM: the route-transition recipes don't apply");
  assert.equal(p.fonts.loader, null, "fonts load through expo-font, not a web loader");
});

test("detect: NativeWind v4 vs v5, react-native-reusables' components.json is not shadcn/ui, Moti is flagged", () => {
  const rnr = project({ "react-native": "0.81.0", nativewind: "^4.2.0", "@rn-primitives/slot": "^1.2.0", moti: "^0.30.0" },
    { "components.json": JSON.stringify({ style: "new-york", tailwind: { css: "global.css" } }) });
  assert.equal(rnr.framework, "react-native");
  assert.deepEqual(rnr.native, { styling: "nativewind", web: false });
  assert.equal(rnr.components, "rn-reusables");
  assert.equal(rnr.shadcn, null);
  assert.ok(rnr.animation.includes("moti-unmaintained"));
  assert.equal(project({ expo: "~54.0.0", nativewind: "5.0.0-preview.2" }).native.styling, "nativewind-v5");
  assert.equal(project({ expo: "~54.0.0", tamagui: "^1.130.0" }).components, "tamagui");
  assert.equal(project({ react: "19.2.0", next: "16.0.0" }).native, null);
});

test("uniwind: literal sizes in @theme and every colour in both theme variants, in sRGB", () => {
  const css = emit("uniwind");
  assert.match(css, /@theme \{\n {2}--text-xs: 12px;\n {2}--text-xs--line-height: 18px;\n {2}--text-xs--letter-spacing: 0px;/);
  assert.match(css, /--text-2xl--letter-spacing: -0\.24px;/, "-0.01em at 24px");
  assert.match(css, /--spacing-4: 16px;/);
  assert.match(css, /--shadow-sm: 0 1px 2px 0 rgba\(22, 24, 30, 0\.06\);/);
  assert.match(css, /@layer theme \{\n {2}:root \{\n {4}@variant light \{\n {6}--color-background: #fbfcfd;/);
  assert.match(css, /@variant dark \{\n {6}--color-background: #0e0f13;/);
  const light = css.split("@variant light")[1].split("@variant dark")[0];
  const dark = css.split("@variant dark")[1];
  const names = (block) => [...block.matchAll(/(--color-[\w-]+):/g)].map((m) => m[1]);
  assert.deepEqual(names(dark), names(light), "Uniwind needs the same variables in every theme");
  assert.doesNotMatch(css, /oklch|var\(|rem\b|\d+(\.\d+)?em;/);
});

test("nativewind: unlayered :root / .dark:root channels and a theme.extend that keeps opacity modifiers", () => {
  const out = emit("nativewind");
  assert.match(out, /\n:root \{\n {2}--color-background: 251 252 253;\n[^}]*--color-primary: 52 95 178;/);
  assert.match(out, /\n\.dark:root \{\n {2}--color-background: 14 15 19;/);
  assert.doesNotMatch(out, /@layer base \{/, "Tailwind 3 purges a layered .dark rule nothing mentions");
  assert.match(out, /"primary": "rgb\(var\(--color-primary\) \/ <alpha-value>\)"/);
  assert.match(out, /--color-overlay: rgba\(22, 24, 30, 0\.45\);/);
  assert.match(out, /"overlay": "var\(--color-overlay\)"/, "translucent colours stay whole");
  assert.match(out, /"sm": \["14px", \{ "lineHeight": "21px", "letterSpacing": "0px" \}\]/);
  assert.match(out, /darkMode: "class"/);
  assert.match(out, /presets: \[require\("nativewind\/preset"\)\]/);
});

test("rn-motion: Reanimated curves and durations; reduced motion stops movement but keeps fades", () => {
  const js = emit("rn-motion");
  assert.match(js, /import \{ cubicBezier, Easing, ReduceMotion \} from "react-native-reanimated";/);
  assert.match(js, /"standard": 250/);
  assert.match(js, /"move": cubicBezier\(0\.2, 0, 0, 1\),/);
  assert.match(js, /"move": Easing\.bezier\(0\.2, 0, 0, 1\),/);
  const d = tmp();
  const stub = join(d, "node_modules", "react-native-reanimated");
  spawnSync("mkdir", ["-p", stub]);
  writeFileSync(join(stub, "package.json"), JSON.stringify({ name: "react-native-reanimated", type: "module", main: "index.js" }));
  writeFileSync(join(stub, "index.js"), "export const cubicBezier = (...p) => ({ p }); export const Easing = { bezier: (...p) => ({ p }) }; export const ReduceMotion = { System: 'system' };");
  writeFileSync(join(d, "motion-tokens.mjs"), js);
  writeFileSync(join(d, "probe.mjs"), `import { timing, transition } from "./motion-tokens.mjs";
console.log(JSON.stringify({
  timing: timing("standard", "enter"),
  move: transition(["transform", "opacity"], "standard", "move", { reduced: true }).transitionDuration,
  fade: transition("opacity", "short", "enter", { reduced: true }).transitionDuration,
  normal: transition("transform", "standard", "move").transitionDuration,
}));
try { timing("glacial", "enter"); } catch (e) { console.log(e.message); }`);
  const r = spawnSync(process.execPath, [join(d, "probe.mjs")], { encoding: "utf8", cwd: d });
  assert.equal(r.status, 0, r.stderr);
  const [json, err] = r.stdout.trim().split("\n");
  assert.deepEqual(JSON.parse(json), { timing: { duration: 250, easing: { p: [0, 0, 0, 1] }, reduceMotion: "system" }, move: 0, fade: 150, normal: 250 });
  assert.equal(err, 'unknown duration token "glacial"');
});

test("nativeColor: sRGB hex, rgba for translucent colours", () => {
  assert.equal(nativeColor("oklch(0.5 0.14 262)"), "#345fb2");
  assert.equal(nativeColor("oklch(0.21 0.012 265 / 0.45)"), "rgba(22, 24, 30, 0.45)");
  assert.throws(() => nativeColor("var(--x)"), /cannot convert/);
});
