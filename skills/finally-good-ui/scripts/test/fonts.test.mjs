import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";

// A chosen typeface is only real once it loads. Tokens name the face and how it loads
// ($extensions.fgu.load); --format fonts writes the loader for the project's stack, and the CSS
// variable works with every loader: next/font's hashed family via --font-<name>-loaded, else the name.
const DEF = join(SR, "tokens", "default.tokens.json");

function tokensWithFonts() {
  const t = JSON.parse(readFileSync(DEF, "utf8"));
  t.font.sans = { $type: "fontFamily", $value: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    $extensions: { fgu: { load: { source: "google", weights: "100 900" } } } };
  t.font.display = { $type: "fontFamily", $value: ["Fraunces", "Georgia", "serif"],
    $extensions: { fgu: { load: { source: "google", weights: [400, 600] } } } };
  t.font.mono = { $type: "fontFamily", $value: ["Brand Mono", "ui-monospace", "monospace"],
    $extensions: { fgu: { load: { source: "local", weights: "100 800", files: [{ path: "fonts/brand-mono.woff2", weight: "100 800" }] } } } };
  const d = tmp();
  const f = join(d, "tokens.json");
  writeFileSync(f, JSON.stringify(t));
  return f;
}
const fonts = (file, loader) => run("emit-tokens.mjs", ["--in", file, "--format", "fonts", ...(loader ? ["--loader", loader] : [])]);

test("a loaded face reaches CSS through --font-<name>-loaded, then its own names, then the fallbacks", () => {
  const css = run("emit-tokens.mjs", ["--in", tokensWithFonts(), "--format", "css"]).stdout;
  assert.match(css, /--font-sans: var\(--font-sans-loaded, "Inter Variable", Inter\), ui-sans-serif, system-ui, sans-serif;/);
  assert.match(css, /--font-display: var\(--font-display-loaded, Fraunces\), Georgia, serif;/, "static weights: no Variable family");
  const plain = run("emit-tokens.mjs", ["--in", DEF, "--format", "css"]).stdout;
  assert.match(plain, /--font-sans: ui-sans-serif, system-ui/, "system stacks are untouched");
});

test("fonts --loader next: next/font with the loaded variable names; local files through next/font/local", () => {
  const r = fonts(tokensWithFonts(), "next");
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /import \{ Inter, Fraunces \} from "next\/font\/google";/);
  assert.match(r.stdout, /export const fontSans = Inter\(\{ subsets: \["latin"\], display: "swap", variable: "--font-sans-loaded" \}\);/);
  assert.match(r.stdout, /Fraunces\(\{[^)]*weight: \["400", "600"\]/);
  assert.match(r.stdout, /localFont\(\{ src: \[\{ path: "\.\/fonts\/brand-mono\.woff2", weight: "100 800", style: "normal" \}\], display: "swap", variable: "--font-mono-loaded" \}\)/);
  assert.match(r.stdout, /className=\{`\$\{fontSans\.variable\} \$\{fontMono\.variable\} \$\{fontDisplay\.variable\}`\}/, "token order");
});

test("fonts --loader nuxt: @nuxt/fonts families, global so variables need no detection", () => {
  const r = fonts(tokensWithFonts(), "nuxt");
  assert.match(r.stdout, /modules: \["@nuxt\/fonts"\]/);
  assert.match(r.stdout, /\{ name: "Inter", provider: "google", weights: \["100 900"\], global: true \}/);
  assert.match(r.stdout, /\{ name: "Fraunces", provider: "google", weights: \[400, 600\], global: true \}/);
  assert.match(r.stdout, /\{ name: "Brand Mono", src: "\/fonts\/brand-mono\.woff2", weight: "100 800", global: true \}/);
});

test("fonts --loader fontsource: variable package when the weights are a range, per-weight files otherwise", () => {
  const r = fonts(tokensWithFonts(), "fontsource");
  assert.match(r.stdout, /npm install @fontsource-variable\/inter @fontsource\/fraunces/);
  assert.match(r.stdout, /import "@fontsource-variable\/inter";/);
  assert.match(r.stdout, /import "@fontsource\/fraunces\/400\.css";\nimport "@fontsource\/fraunces\/600\.css";/);
  assert.match(r.stdout, /@font-face \{ font-family: "Brand Mono"; src: url\("\/fonts\/brand-mono\.woff2"\) format\("woff2"\); font-weight: 100 800; font-style: normal; font-display: swap; \}/);
});

test("fonts --loader google (default): one CSS2 link with exact axes and display=swap", () => {
  const r = fonts(tokensWithFonts());
  assert.match(r.stdout, /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/);
  assert.match(r.stdout, /href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@100\.\.900&family=Fraunces:wght@400;600&display=swap"/);
});

test("fonts: system stacks need nothing; an unknown loader is a usage error", () => {
  assert.match(fonts(DEF, "next").stdout, /nothing to load/);
  assert.equal(fonts(tokensWithFonts(), "webpack").code, 2);
});

test("detect: font loading in place, and the loader the stack should use", () => {
  const proj = (deps, files = {}) => {
    const d = tmp();
    writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps }));
    for (const [f, text] of Object.entries(files)) { mkdirSync(join(d, f, ".."), { recursive: true }); writeFileSync(join(d, f), text); }
    return detectStack(d).fonts;
  };
  assert.deepEqual(proj({ next: "16.4.6", react: "19.3.1" }, { "app/layout.tsx": 'import { Inter } from "next/font/google";' }), { loader: "next", inUse: ["next-font"] });
  assert.deepEqual(proj({ nuxt: "4.2.0", "@nuxt/fonts": "1.2.0" }), { loader: "nuxt", inUse: ["nuxt-fonts"] });
  assert.deepEqual(proj({ vite: "7.0.0", react: "19.2.0", "@fontsource-variable/inter": "5.2.0" }), { loader: "fontsource", inUse: ["fontsource"] });
  assert.deepEqual(proj({}, { "index.html": '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">' }), { loader: "google", inUse: ["google-fonts"] });
});
