import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";
import { colorEntry, swiftName } from "../lib/swiftui.mjs";

// A SwiftUI app gets an asset catalog (one colour set per role, light and dark appearance) and a Swift
// file of typed accessors. Checked with Xcode 26: actool compiles the catalog with no warnings, AppKit
// reads each colour back in light and dark appearance with these exact components, and the Swift file
// compiles in Swift 6 mode for macOS 14 and iOS 17.
const DEF = join(SR, "tokens", "default.tokens.resolver.json");
function exportTo() {
  const out = join(tmp(), "App");
  const r = run("emit-tokens.mjs", ["--in", DEF, "--format", "swiftui", "--out-dir", out]);
  assert.equal(r.code, 0, r.stderr);
  return { out, r, read: (p) => readFileSync(join(out, p), "utf8") };
}

test("a namespaced colour set per role with a dark appearance, in sRGB", () => {
  const { r, read } = exportTo();
  assert.ok(r.json.written.includes("DesignTokens.xcassets/Tokens/PrimaryForeground.colorset/Contents.json"));
  assert.deepEqual(JSON.parse(read("DesignTokens.xcassets/Tokens/Contents.json")).properties, { "provides-namespace": true });
  const primary = JSON.parse(read("DesignTokens.xcassets/Tokens/Primary.colorset/Contents.json"));
  assert.deepEqual(primary.colors[0], { idiom: "universal", color: { "color-space": "srgb", components: { red: "0.205", green: "0.373", blue: "0.698", alpha: "1.000" } } });
  assert.deepEqual(primary.colors[1].appearances, [{ appearance: "luminosity", value: "dark" }]);
  assert.equal(primary.colors[1].color.components.blue, "0.940");
  const overlay = JSON.parse(read("DesignTokens.xcassets/Tokens/Overlay.colorset/Contents.json"));
  assert.equal(overlay.colors[0].color.components.alpha, "0.450");
});

test("DesignTokens.swift: Palette from the catalog, Space/Radius in points, Dynamic Type steps, Reduce Motion", () => {
  const { read } = exportTo();
  const swift = read("DesignTokens.swift");
  assert.match(swift, /public static let primaryForeground = Color\("Tokens\/PrimaryForeground", bundle: \.main\)/);
  assert.match(swift, /public static let s4: CGFloat = 16/);
  assert.match(swift, /public static let md: CGFloat = 8/);
  assert.match(swift, /public static let base = TextStep\(size: 16, lineHeight: 24, tracking: 0, relativeTo: \.body\)/);
  assert.match(swift, /public static let s2xl = TextStep\(size: 24, lineHeight: 31\.2, tracking: -0\.24, relativeTo: \.title2\)/);
  assert.match(swift, /_scale = ScaledMetric\(wrappedValue: 1, relativeTo: step\.relativeTo\)/);
  assert.match(swift, /public static let standard: Double = 0\.25/);
  assert.match(swift, /public static let enterEmphasized = Curve\(x1: 0\.05, y1: 0\.7, x2: 0\.1, y2: 1\)/);
  assert.match(swift, /reduceMotion \? nil : \.timingCurve\(curve\.x1, curve\.y1, curve\.x2, curve\.y2, duration: duration\)/);
});

test("swiftui needs --out-dir and never overwrites without --force", () => {
  const noDir = run("emit-tokens.mjs", ["--in", DEF, "--format", "swiftui"]);
  assert.equal(noDir.code, 2);
  assert.match(noDir.stderr, /needs --out-dir/);
  const { out } = exportTo();
  const again = run("emit-tokens.mjs", ["--in", DEF, "--format", "swiftui", "--out-dir", out]);
  assert.equal(again.code, 2);
  assert.match(again.stderr, /already exist/);
  assert.equal(run("emit-tokens.mjs", ["--in", DEF, "--format", "swiftui", "--out-dir", out, "--force"]).code, 0);
});

test("detect: an Xcode project or Swift package importing SwiftUI; helpers", () => {
  const app = tmp();
  mkdirSync(join(app, "Notes.xcodeproj"));
  mkdirSync(join(app, "Notes"));
  writeFileSync(join(app, "Notes", "ContentView.swift"), "import SwiftUI\n\nstruct ContentView: View { var body: some View { Text(\"Hi\") } }\n");
  const p = detectStack(app);
  assert.equal(p.framework, "swiftui");
  assert.equal(p.viewTransitions, null);
  const cli = tmp();
  writeFileSync(join(cli, "Package.swift"), "// swift-tools-version:6.0\n");
  writeFileSync(join(cli, "main.swift"), "import Foundation\n");
  assert.notEqual(detectStack(cli).framework, "swiftui", "a Swift package without SwiftUI is not a UI app");
  assert.equal(swiftName("2xl"), "s2xl");
  assert.equal(swiftName("primary-foreground"), "primaryForeground");
  assert.deepEqual(colorEntry("#ffffff").components, { red: "1.000", green: "1.000", blue: "1.000", alpha: "1.000" });
});
