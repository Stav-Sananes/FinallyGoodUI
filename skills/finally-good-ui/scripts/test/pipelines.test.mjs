import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";
import { cssName, textMetrics, loadedFont, spacingAliases, isGamutBlock } from "../lib/pipelines.mjs";

// A project that already builds its tokens with Terrazzo or Style Dictionary gets our tokens as
// pipeline sources plus a config whose output uses our variable names and values, so the pipeline,
// not emit-tokens, owns the CSS from then on. (The configs were run against @terrazzo/cli 2.10 and
// style-dictionary 5.8 and compared value by value with --format css in Chromium.)
const DEF = join(SR, "tokens", "default.tokens.resolver.json");
const exportTo = (format, root, ...more) => run("emit-tokens.mjs", ["--in", DEF, "--format", format, "--root", root, ...more]);
const css = (file) => run("emit-tokens.mjs", ["--in", file, "--format", "css"]).stdout;
const syntaxOk = (file) => spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });

test("terrazzo: the token sources go to tokens/, the config to the root, and read back to the same CSS", () => {
  const root = tmp();
  const r = exportTo("terrazzo", root);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.written, ["tokens/tokens.json", "tokens/tokens.dark.json", "tokens/tokens.resolver.json", "terrazzo.config.mjs"]);
  assert.equal(r.json.build, "npx tz build");
  assert.deepEqual(r.json.install, ["@terrazzo/cli", "@terrazzo/plugin-css"]);
  assert.deepEqual(r.json.css, ["tokens/build/tokens.css"]);
  assert.equal(css(join(root, "tokens", "tokens.json")), css(DEF), "the sources are our token set, unchanged");

  const config = readFileSync(join(root, "terrazzo.config.mjs"), "utf8");
  assert.match(config, /tokens: \["\.\/tokens\/tokens\.resolver\.json"\]/);
  assert.match(config, /outDir: "\.\/tokens\/build\/"/);
  assert.match(config, /\{ input: \{ theme: "dark" \}, prepare: darkBlock \}/);
  assert.match(config, /:root:not\(\.light\):not\(\[data-theme="light"\]\)/, "the OS dark setting, unless the page forces light");
  assert.equal(syntaxOk(join(root, "terrazzo.config.mjs")).status, 0, syntaxOk(join(root, "terrazzo.config.mjs")).stderr);
});

test("style-dictionary: two builds (light, then dark on top) into tokens.css and tokens.dark.css", () => {
  const root = tmp();
  const r = exportTo("style-dictionary", root, "--out-dir", "design/tokens", "--name", "brand");
  assert.equal(r.code, 0, r.stderr);
  assert.ok(r.json.written.includes("sd.config.mjs"));
  assert.ok(existsSync(join(root, "design", "tokens", "brand.dark.json")));
  assert.deepEqual(r.json.css, ["design/tokens/build/brand.css", "design/tokens/build/brand.dark.css"]);
  const config = readFileSync(join(root, "sd.config.mjs"), "utf8");
  assert.match(config, /const BASE = "design\/tokens\/brand\.json";/);
  assert.match(config, /include: \[BASE\], source: \[DARK\]/);
  assert.match(config, /"color\/oklch"/, "colours stay OKLCH instead of Style Dictionary's default hex");
  assert.equal(syntaxOk(join(root, "sd.config.mjs")).status, 0, syntaxOk(join(root, "sd.config.mjs")).stderr);
});

test("--tailwind puts the light theme in @theme with spacing aliases and the duration utility", () => {
  const root = tmp();
  assert.equal(exportTo("terrazzo", root, "--tailwind").code, 0);
  const tz = readFileSync(join(root, "terrazzo.config.mjs"), "utf8");
  assert.match(tz, /`@theme \{\\n\$\{c\}\\n\$\{spacingAliases\(c\)\}\\n\}\\n\\n\$\{DURATION_UTILITY\}`/);
  assert.match(tz, /@utility duration-\*/);
  const sdRoot = tmp();
  assert.equal(exportTo("style-dictionary", sdRoot, "--tailwind").code, 0);
  assert.match(readFileSync(join(sdRoot, "sd.config.mjs"), "utf8"), /const TAILWIND = true;/);
});

test("an export never overwrites without --force, and the sources must stay inside the project", () => {
  const root = tmp();
  assert.equal(exportTo("terrazzo", root).code, 0);
  const again = exportTo("terrazzo", root);
  assert.equal(again.code, 2);
  assert.match(again.stderr, /already exist/);
  assert.equal(exportTo("terrazzo", root, "--force").code, 0);
  const outside = exportTo("style-dictionary", root, "--out-dir", "../elsewhere");
  assert.equal(outside.code, 2);
  assert.match(outside.stderr, /inside --root/);
});

test("printed helpers: our variable names, type metrics, loaded faces, Tailwind spacing", () => {
  assert.equal(cssName(["easing", "enter-emphasized"]), "--ease-enter-emphasized");
  assert.equal(cssName(["color", "primary-foreground"]), "--color-primary-foreground");
  assert.deepEqual(textMetrics({ fgu: { lineHeight: 1.5, letterSpacing: { value: -0.01, unit: "em" } } }),
    [["line-height", "1.5"], ["letter-spacing", "-0.01em"]]);
  assert.deepEqual(textMetrics(undefined), []);
  assert.equal(loadedFont(["font", "sans"], ["Inter", "system-ui"], { fgu: { load: { source: "google", weights: "100 900" } } }),
    'var(--font-sans-loaded, "Inter Variable", Inter), system-ui');
  assert.equal(loadedFont(["font", "display"], ["Brand Serif", "serif"], { fgu: { load: { weights: [400, 600] } } }),
    'var(--font-display-loaded, "Brand Serif"), serif');
  assert.equal(loadedFont(["font", "mono"], ["ui-monospace"], undefined), undefined, "system stacks keep the pipeline's own value");
  assert.equal(spacingAliases("  --space-1: 4px;\n  --space-1-5: 6px;\n  --color-x: red;"),
    "  --spacing-1: var(--space-1);\n  --spacing-1-5: var(--space-1-5);");
  assert.equal(isGamutBlock("  --color-primary: oklch(0.7 0.3 145);"), true);
  assert.equal(isGamutBlock("  --color-primary: red;\n  --space-1: 4px;"), false);
});

test("detect-stack names the token pipeline and its config, so build edits the sources", () => {
  const project = (deps, files = {}) => {
    const d = tmp();
    writeFileSync(join(d, "package.json"), JSON.stringify({ devDependencies: deps }));
    for (const [f, text] of Object.entries(files)) { mkdirSync(join(d, f, ".."), { recursive: true }); writeFileSync(join(d, f), text); }
    return detectStack(d).tokensPipeline;
  };
  assert.deepEqual(project({ "@terrazzo/cli": "^2.10.0" }, { "terrazzo.config.ts": "export default {}" }), { tool: "terrazzo", config: "terrazzo.config.ts" });
  assert.deepEqual(project({ "style-dictionary": "^5.8.0" }, { "sd.config.mjs": "" }), { tool: "style-dictionary", config: "sd.config.mjs" });
  assert.deepEqual(project({ "style-dictionary": "^4.0.0" }, { "config.json": "{}" }), { tool: "style-dictionary", config: "config.json" });
  assert.deepEqual(project({}, { "terrazzo.config.mjs": "" }), { tool: "terrazzo", config: "terrazzo.config.mjs" }, "a config alone counts");
  assert.equal(project({ react: "^19.0.0" }), null);
});
