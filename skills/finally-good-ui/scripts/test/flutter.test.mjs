import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";
import { dartColor, dartName } from "../lib/flutter.mjs";

// A Flutter app gets one Dart file: Material 3 themes whose ColorScheme takes our roles, an AppColors
// ThemeExtension for the rest, and constants for spacing, radius and motion. The output was compiled
// with Flutter 3.50 (flutter analyze, plus a widget test that builds MaterialApp with both themes).
const DEF = join(SR, "tokens", "default.tokens.resolver.json");
const dart = () => {
  const r = run("emit-tokens.mjs", ["--in", DEF, "--format", "flutter"]);
  assert.equal(r.code, 0, r.stderr);
  return r.stdout;
};

test("ColorScheme slots take our roles, both themes, with Material's surface tint switched off", () => {
  const out = dart();
  const light = out.split("static final ThemeData light")[1].split("static final ThemeData dark")[0];
  const dark = out.split("static final ThemeData dark")[1];
  assert.match(light, /brightness: Brightness\.light,\n {6}primary: Color\(0xFF345FB2\),\n {6}onPrimary: Color\(0xFFF9FAFC\),/);
  assert.match(light, /surface: Color\(0xFFFBFCFD\),\n {6}onSurface: Color\(0xFF16181E\),/);
  assert.match(light, /outlineVariant: Color\(0xFFE0E1E4\),/, "border");
  assert.match(light, /scrim: Color\(0x7316181E\),/, "overlay keeps its alpha");
  assert.match(light, /surfaceTint: Color\(0x00000000\),/);
  assert.match(dark, /brightness: Brightness\.dark,/);
  assert.match(dark, /surface: Color\(0xFF0E0F13\),/);
});

test("AppColors carries the roles without a slot, with copyWith and lerp for animated theme changes", () => {
  const out = dart();
  assert.match(out, /class AppColors extends ThemeExtension<AppColors> \{/);
  for (const f of ["success", "warningForeground", "chart1", "chart8", "card", "border"]) {
    assert.match(out, new RegExp(`final Color ${f};`), f);
    assert.match(out, new RegExp(`${f}: Color\\.lerp\\(${f}, other\\.${f}, t\\)!,`), `${f} lerps`);
  }
  assert.doesNotMatch(out, /final Color primary;/, "primary lives in the ColorScheme");
  assert.match(out, /extensions: <ThemeExtension<dynamic>>\[colors\],/);
});

test("type, spacing, radius and motion: px steps, line-height as a multiplier, letter-spacing in px", () => {
  const out = dart();
  assert.match(out, /bodyMedium: TextStyle\(fontSize: 16\.0, height: 1\.5, letterSpacing: 0\.0\),/);
  assert.match(out, /headlineMedium: TextStyle\(fontSize: 24\.0, height: 1\.3, letterSpacing: -0\.24\),/);
  assert.match(out, /static const double s4 = 16\.0;/);
  assert.match(out, /abstract final class AppRadius \{\n {2}static const double none = 0\.0;\n {2}static const double sm = 4\.0;/);
  assert.match(out, /static const Duration standard = Duration\(milliseconds: 250\);/);
  assert.match(out, /static const Curve enterEmphasized = Cubic\(0\.05, 0\.7, 0\.1, 1\.0\);/);
  assert.match(out, /MediaQuery\.disableAnimationsOf\(context\) \? Duration\.zero : movement;/);
  assert.match(out, /final radius = BorderRadius\.circular\(8\.0\);/);
});

test("a missing role the ColorScheme requires is a usage error naming it", () => {
  const t = JSON.parse(readFileSync(join(SR, "tokens", "default.tokens.json"), "utf8"));
  delete t.color.destructive;
  const d = tmp();
  writeFileSync(join(d, "t.json"), JSON.stringify(t));
  const r = run("emit-tokens.mjs", ["--in", join(d, "t.json"), "--format", "flutter"]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ColorScheme needs the roles destructive/);
});

test("detect: a pubspec on the Flutter SDK is a Flutter project; helpers name and colour for Dart", () => {
  const d = tmp();
  writeFileSync(join(d, "pubspec.yaml"), "name: app\ndependencies:\n  flutter:\n    sdk: flutter\n");
  const p = detectStack(d);
  assert.equal(p.framework, "flutter");
  assert.equal(p.viewTransitions, null);
  assert.equal(p.fonts.loader, null);
  const dartOnly = tmp();
  writeFileSync(join(dartOnly, "pubspec.yaml"), "name: cli\ndependencies:\n  args: ^2.0.0\n");
  assert.notEqual(detectStack(dartOnly).framework, "flutter");
  assert.equal(dartName("primary-foreground"), "primaryForeground");
  assert.equal(dartName("4"), "s4");
  assert.equal(dartName("1.5"), "s1_5");
  assert.equal(dartColor("oklch(0.21 0.012 265 / 0.45)"), "Color(0x7316181E)");
});
