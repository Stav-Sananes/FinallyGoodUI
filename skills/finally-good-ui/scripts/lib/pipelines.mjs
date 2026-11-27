// Export a token set to a token build pipeline: the standard DTCG files plus a starter config
// for Terrazzo (resolver-aware, one CSS file with both themes) or Style Dictionary v5 (two builds:
// the base set, then the dark set layered on it). Either config produces the same CSS variable
// names and values as emit-tokens --format css (or tailwind4 with { tailwind: true }), so
// components written against our variables keep working when the pipeline owns the CSS.
import { dtcgFiles, formatJson } from "./token-files.mjs";

export const PIPELINES = ["terrazzo", "style-dictionary"];

const DARK_CLASS = '.dark, [data-theme="dark"]';
const DARK_MEDIA = "@media (prefers-color-scheme: dark)";
const DARK_MEDIA_ROOT = ':root:not(.light):not([data-theme="light"])';
// Tailwind v4 has no --duration-* namespace; the same utility emit-tokens --format tailwind4 writes.
const DURATION_UTILITY = "@utility duration-* {\n  --tw-duration: --value(--duration-*);\n  transition-duration: --value(--duration-*);\n}";

// ---- helpers printed into the configs (kept here so they are unit-tested) ----

/** Our CSS variable for a token path: easing.* is --ease-*, every other group keeps its name. */
export function cssName(path) {
  const prefix = { easing: "ease" };
  return `--${[prefix[path[0]] ?? path[0], ...path.slice(1)].join("-")}`;
}

/** Text steps carry line-height and letter-spacing in $extensions.fgu: [[suffix, css]]. */
export function textMetrics(extensions) {
  const fgu = extensions?.fgu ?? {};
  const out = [];
  if (fgu.lineHeight != null) out.push(["line-height", String(fgu.lineHeight)]);
  if (fgu.letterSpacing != null) out.push(["letter-spacing", `${fgu.letterSpacing.value}${fgu.letterSpacing.unit}`]);
  return out;
}

/** A face the app loads ($extensions.fgu.load): next/font's variable first, then the face's names. */
export function loadedFont(path, value, extensions) {
  const load = extensions?.fgu?.load;
  if (!load) return undefined;
  const quote = (f) => (/^[\w-]+$/.test(f) ? f : `"${f}"`);
  const [face, ...rest] = [].concat(value);
  const variable = /^\d+\s+\d+$/.test(String(load.weights ?? "").trim());
  const faces = variable ? [`${face} Variable`, face] : [face];
  return [`var(${cssName(path)}-loaded, ${faces.map(quote).join(", ")})`, ...rest.map(quote)].join(", ");
}

/** Tailwind v4 reads p-4 from --spacing-4: alias each --space-* declared in a CSS block. */
export function spacingAliases(css) {
  const names = [...new Set([...css.matchAll(/--space-([\w-]+):/g)].map((m) => m[1]))];
  return names.map((n) => `  --spacing-${n}: var(--space-${n});`).join("\n");
}

/** A block of colour declarations only: Terrazzo's wide-gamut copy, not the full theme. */
export function isGamutBlock(css) {
  return !/--(?!color-)[\w-]+:/.test(css);
}

const printed =(...fns) => fns.map((fn) => `${fn.toString()}`).join("\n\n");

// ---- configs ----

function terrazzoConfig({ resolver, buildDir, name, tailwind }) {
  // Terrazzo also calls prepare() for the wide-gamut colours it moves into @media (color-gamut: …);
  // those blocks hold colours only and stay on :root, since @theme can't sit inside a media query.
  const light = tailwind
    ? '(c) => (isGamutBlock(c) ? `:root {\\n${c}\\n}` : `@theme {\\n${c}\\n${spacingAliases(c)}\\n}\\n\\n${DURATION_UTILITY}`)'
    : '(c) => `:root {\\n${c}\\n}`';
  return `// Terrazzo config written by finally-good-ui (emit-tokens --format terrazzo). Edit the tokens in
// ${resolver.replace(/[^/]+$/, "")}, then run \`npx tz build\`; never edit ${buildDir}${name}.css by hand.
// It writes the CSS variables components use (--color-*, --space-*, --ease-*…) with the light theme
// ${tailwind ? "in Tailwind's @theme" : "on :root"} and the dark theme for .dark / [data-theme=dark] and the OS setting.
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import { transformCSSValue } from "@terrazzo/token-tools/css";

const DURATION_UTILITY = ${JSON.stringify(DURATION_UTILITY)};

${printed(cssName, textMetrics, loadedFont, spacingAliases, isGamutBlock)}

/** Values our CSS writes differently from Terrazzo's defaults; undefined keeps the default. */
function transform(token, options) {
  const path = token.id.split(".");
  if (path[0] === "tracking" && token.$type === "number") return \`\${token.$value}em\`;
  if (path[0] === "font") return loadedFont(path, token.$value, token.$extensions);
  if (path[0] === "text") {
    const metrics = textMetrics(token.$extensions);
    if (metrics.length) return { ".": transformCSSValue(token, options), ...Object.fromEntries(metrics) };
  }
  return undefined;
}

const darkBlock = (c) => \`.dark, [data-theme="dark"] {\\n  color-scheme: dark;\\n\${c}\\n}\\n\\n@media (prefers-color-scheme: dark) {\\n  :root:not(.light):not([data-theme="light"]) {\\n    color-scheme: dark;\\n\${c}\\n  }\\n}\`;

export default defineConfig({
  tokens: [${JSON.stringify(`./${resolver}`)}],
  outDir: ${JSON.stringify(`./${buildDir}`)},
  plugins: [
    css({
      filename: ${JSON.stringify(`${name}.css`)},
      variableName: (token) => cssName(token.id.split(".")),
      subValueVariableName: (variable, sub) => (sub === "." ? variable : \`\${variable}--\${sub}\`),
      transform,
      permutations: [
        { input: { theme: "light" }, prepare: ${light} },
        { input: { theme: "dark" }, prepare: darkBlock },
      ],
    }),
  ],
});
`;
}

function styleDictionaryConfig({ base, dark, buildDir, name, tailwind }) {
  return `// Style Dictionary v5 config written by finally-good-ui (emit-tokens --format style-dictionary).
// Edit the tokens in ${base.replace(/[^/]+$/, "")}, then run \`node sd.config.mjs\`; never edit ${buildDir} by hand.
// It writes the CSS variables components use (--color-*, --space-*, --ease-*…): ${name}.css holds the
// light theme ${tailwind ? "in Tailwind's @theme" : "on :root"}, ${name}.dark.css the dark values for .dark / [data-theme=dark]
// and the OS setting. Import both, light first.
import StyleDictionary from "style-dictionary";

const BASE = ${JSON.stringify(base)};
const DARK = ${JSON.stringify(dark)};
const BUILD = ${JSON.stringify(buildDir)};
const TAILWIND = ${tailwind};
const DURATION_UTILITY = ${JSON.stringify(DURATION_UTILITY)};

${printed(cssName, textMetrics, loadedFont, spacingAliases)}

StyleDictionary.registerTransform({ name: "fgu/name", type: "name", transform: (t) => cssName(t.path).slice(2) });
StyleDictionary.registerTransform({
  name: "fgu/tracking-em", type: "value",
  filter: (t) => t.path[0] === "tracking" && typeof t.original.$value === "number",
  transform: (t) => \`\${t.original.$value}em\`,
});
StyleDictionary.registerTransform({
  name: "fgu/font-loaded", type: "value",
  filter: (t) => t.path[0] === "font" && t.original.$extensions?.fgu?.load != null,
  transform: (t) => loadedFont(t.path, t.original.$value, t.original.$extensions),
});
// Line-height and letter-spacing of each text step become --text-<step>--line-height / --letter-spacing.
StyleDictionary.registerPreprocessor({
  name: "fgu/text-metrics",
  preprocessor: (tree) => {
    for (const [step, token] of Object.entries(tree.text ?? {})) {
      for (const [suffix, value] of textMetrics(token?.$extensions)) {
        tree.text[\`\${step}--\${suffix}\`] = { $type: "string", $value: value };
      }
    }
    return tree;
  },
});

const cssVariables = StyleDictionary.hooks.formats["css/variables"];
const withScheme = (css, scheme) => css.replace(/\\{\\n(\\s*)(?![\\s\\S]*\\{\\n)/, (_, indent) => \`{\\n\${indent}color-scheme: \${scheme};\\n\${indent}\`);
StyleDictionary.registerFormat({
  name: "fgu/light",
  format: async (args) => {
    const css = await cssVariables({ ...args, options: { ...args.options, selector: TAILWIND ? "@theme" : ":root" } });
    return TAILWIND ? css.replace(/\\n\\}\\n*$/, \`\\n\${spacingAliases(css)}\\n}\\n\\n\${DURATION_UTILITY}\\n\`) : css;
  },
});
StyleDictionary.registerFormat({
  name: "fgu/dark",
  format: async (args) => {
    const block = (selector) => cssVariables({ ...args, options: { ...args.options, selector } });
    return withScheme(await block(${JSON.stringify(DARK_CLASS)}), "dark") + "\\n" +
      withScheme(await block(${JSON.stringify([DARK_MEDIA, DARK_MEDIA_ROOT])}), "dark").replace(/^\\/\\*\\*[\\s\\S]*?\\*\\/\\n*/, "");
  },
});

const TRANSFORMS = [
  ...StyleDictionary.hooks.transformGroups.css.filter((t) => t !== "name/kebab" && t !== "color/css"),
  "fgu/name", "color/oklch", "fgu/tracking-em", "fgu/font-loaded",
];
const platform = (destination, format, filter) => ({
  css: { transforms: TRANSFORMS, buildPath: BUILD, files: [{ destination, format, filter, options: { outputReferences: false } }] },
});

await new StyleDictionary({ source: [BASE], preprocessors: ["fgu/text-metrics"], platforms: platform(${JSON.stringify(`${name}.css`)}, "fgu/light") })
  .buildAllPlatforms();
// Dark: the base set with the dark values on top; only the tokens the dark file sets are written.
await new StyleDictionary({ include: [BASE], source: [DARK], preprocessors: ["fgu/text-metrics"],
  platforms: platform(${JSON.stringify(`${name}.dark.css`)}, "fgu/dark", (t) => t.isSource) }).buildAllPlatforms();
`;
}

const PACKAGES = {
  terrazzo: ["@terrazzo/cli", "@terrazzo/plugin-css"],
  "style-dictionary": ["style-dictionary@5"],
};

/**
 * Files for a pipeline export, keyed by path relative to the project root.
 * srcDir: where the token sources go (relative, POSIX); the build output goes to <srcDir>/build/.
 */
export function pipelineFiles(tokens, pipeline, { srcDir = "tokens", name = "tokens", tailwind = false } = {}) {
  if (!PIPELINES.includes(pipeline)) throw new Error(`unknown pipeline ${pipeline} (use ${PIPELINES.join("|")})`);
  const dir = srcDir.replace(/\/+$/, "") || ".";
  const at = (file) => (dir === "." ? file : `${dir}/${file}`);
  const buildDir = at("build/");
  const files = Object.fromEntries(Object.entries(dtcgFiles(tokens, name)).map(([f, json]) => [at(f), formatJson(json)]));
  if (pipeline === "terrazzo") {
    files["terrazzo.config.mjs"] = terrazzoConfig({ resolver: at(`${name}.resolver.json`), buildDir, name, tailwind });
  } else {
    files["sd.config.mjs"] = styleDictionaryConfig({ base: at(`${name}.json`), dark: at(`${name}.dark.json`), buildDir, name, tailwind });
  }
  const css = pipeline === "terrazzo" ? [`${buildDir}${name}.css`] : [`${buildDir}${name}.css`, `${buildDir}${name}.dark.css`];
  return {
    files,
    install: PACKAGES[pipeline],
    build: pipeline === "terrazzo" ? "npx tz build" : "node sd.config.mjs",
    css,
  };
}
