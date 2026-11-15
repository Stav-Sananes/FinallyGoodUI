#!/usr/bin/env node
// Emit a token set in a stack-native format, or as standard DTCG 2025.10 files.
import { resolve, join, relative, dirname, sep } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadTokens, dtcgFiles, formatJson } from "./lib/token-files.mjs";
import { emitAdapters, MissingTokenError } from "./lib/adapters.mjs";
import { emitChartTheme } from "./lib/chart-theme.mjs";
import { emitFonts, LOADERS } from "./lib/fonts.mjs";
import { emitAgGrid } from "./lib/ag-grid.mjs";
import { pipelineFiles, PIPELINES } from "./lib/pipelines.mjs";
import { emitFlutter } from "./lib/flutter.mjs";
import { emitUniwind, emitNativewind, emitRnMotion, emitTamagui, emitUnistyles } from "./lib/react-native.mjs";
import { colorScale } from "./lib/ramp.mjs";
import { flatten, groupTokens, parseDimension, parseDuration, parseEasing, cssValue, darkOf, textMetrics, fontValue } from "./lib/tokens.mjs";
import { toHex } from "./lib/contrast.mjs";

const HELP = `
Usage: emit-tokens.mjs --in <tokens.json> [--format css|tailwind4|shadcn|shadcn-registry|daisyui|chakra|panda|mantine|antd|prime|angular-material|tailwind3|mui|json|js|adapters|chart-theme|fonts|ag-grid|uniwind|nativewind|tamagui|unistyles|rn-motion|flutter] [--root <dir>]
       emit-tokens.mjs --in <tokens.json> --format dtcg --out-dir <dir> [--name tokens] [--force]
       emit-tokens.mjs --in <tokens.json> --format terrazzo|style-dictionary [--out-dir tokens] [--tailwind] [--force]

--in takes a tokens file in either shape (CSS-string values with dark in $extensions.fgu.dark, or
DTCG 2025.10 objects), or a *.resolver.json. A tokens file whose sibling <name>.resolver.json
reads it is loaded through that resolver (light/dark contexts). {group.token} aliases resolve.

Prints the tokens in the requested format to stdout:
  css        :root vars + ".dark, [data-theme=dark]" + prefers-color-scheme dark block
  tailwind4  @theme { ... } + the same dark override blocks (spacing aliases as --spacing-*)
  shadcn     shadcn/ui, shadcn-vue, shadcn-svelte, Spartan: unprefixed :root/.dark vars, @theme inline
             map, fallbacks for popover/secondary/sidebar, --radius = radius.md, the rest in @theme
  shadcn-registry  a registry:theme item; install with npx shadcn add ./finally-good-ui-theme.json
  daisyui    daisyUI v5: @plugin "daisyui/theme" blocks fgu-light (default) and fgu-dark (prefersdark),
             roles mapped to base-100…error, radii to selector/field/box; the rest in @theme
  chakra     Chakra UI v3: createSystem(defaultConfig, defineConfig({ theme })) with tokens (fonts, sizes,
             spacing, radii, shadows, durations, easings), semantic colours {base, _dark} incl. bg/fg/border,
             and a brand palette (scale from primary) for colorPalette="brand"
  panda      Panda CSS v2: the same theme as a preset (definePreset)
  mantine    Mantine v9: createTheme input (10-shade hex brand palette as primaryColor, fonts, sizes, spacing,
             radius, shadows) and a cssVariablesResolver with Mantine's and our vars per colour scheme
  antd       Ant Design v6: light and dark token sets (hex seeds, px numbers, "0.25s" durations, easings)
             and themeFor(isDark, theme) for ConfigProvider (our dark values on top of darkAlgorithm)
  prime      PrimeVue, PrimeNG, PrimeReact: definePreset(Aura, …) with primary 50–950 (scale from primary),
             light/dark colourScheme (surface, primary, highlight, text, content, formField, overlay), radii
  angular-material  Angular Material (M3): SCSS mat.theme with light-dark() system-token overrides
             (primary, surface, outline, error, scrim…), our vars on :root, color-scheme switching
  tailwind3  module.exports = { theme: { extend: {...} } } referencing the CSS vars (emit css too)
  mui        createTheme-shaped JSON (palette, colorSchemes.light/dark, typography incl. h1..caption/overline
             variants with lineHeight + letterSpacing, shape, transitions)
  json       {"light": {"--var": value}, "dark": {...}}
  dtcg       writes tokens.json (DTCG 2025.10 colour/shadow objects), tokens.dark.json and
             tokens.resolver.json into --out-dir; refuses to overwrite without --force
  terrazzo   hands the tokens to a Terrazzo pipeline: the dtcg files into --out-dir (default tokens/) and
             terrazzo.config.mjs at --root. \`npx tz build\` then writes <out-dir>/build/tokens.css with the
             same variables and values as --format css (--tailwind: as tailwind4)
  style-dictionary  the same for Style Dictionary v5: sd.config.mjs; \`node sd.config.mjs\` writes
             <out-dir>/build/tokens.css (light) and tokens.dark.css
  adapters   override CSS so libraries with hard-coded motion (sonner, cmdk, react-day-picker, vaul)
             use our --duration-*/--ease-* variables; --libs picks them by stack-profile name
  ag-grid    AG Grid Quartz theme (withParams) pointing at our variables; dark mode follows them
  fonts      loader code for the faces font tokens name ($extensions.fgu.load): --loader next (next/font),
             nuxt (@nuxt/fonts), fontsource (self-hosted npm packages) or google (default, <link>)
  chart-theme  chart-theme.js for canvas chart libraries: chartColors(), echartsTheme(),
             applyChartJsTheme(Chart), onThemeChange(cb); reads the live variables, resolves any colour
  uniwind    React Native with Uniwind (also react-native-reusables / gluestack on it): @theme sizes plus
             light/dark colour variants, all literal (hex/rgba, px; line-height and letter-spacing in px)
  nativewind React Native with NativeWind v4 (and react-native-reusables on it): global.css variables
             (:root, .dark:root) and theme.extend for tailwind.config.js
  tamagui    tamagui.config.ts for Tamagui 3: @tamagui/config/v6 with our space/radius tokens and light/dark
             themes under Tamagui's keys (background, border-color, color…) and our role names
  unistyles  unistyles.ts for Unistyles 3: light/dark themes (colors, shadow, space, radius, text, duration),
             adaptiveThemes on, plus the TypeScript theme declaration
  rn-motion  motion-tokens module for Reanimated 4: duration (ms), ease (cubicBezier, CSS transitions),
             easing (Easing.bezier, withTiming), timing(), transition() with reduced-motion handling
  flutter    lib/theme/app_theme.dart: Material 3 ThemeData light/dark (ColorScheme from our roles,
             TextTheme from the text steps, component shapes from radius.md), an AppColors ThemeExtension for
             the other colours, and AppSpace / AppRadius / AppMotion constants
  js         motion-tokens ES module for JS animation (Motion, WAAPI, transition props, timers):
             ms, sec, ease, cssEase, easeFn, bezierString, spring, reduced, msMotion, secMotion,
             durations, easings. Reads the live --duration-*/--ease-*
             variable, falls back to the token value (server, tests); unknown names throw
Variable names: --color-* --font-* --text-* (+ --text-*--line-height, --text-*--letter-spacing) --tracking-*
--space-* --radius-* --shadow-* --duration-* --ease-*.

Options:
  --in <file>      tokens file (relative to --root)
  --format <fmt>   default css
  --root <dir>     base dir for --in and --out-dir (default: cwd)
  --mui-scheme <s> mui only: how dark mode is selected. media (default, follows the OS), class (.dark),
                   data ([data-dark]) or a selector such as "[data-theme=%s]"; match the app's theme toggle
  --loader <name>  fonts only: next, nuxt, fontsource or google (default); the stack profile's fonts.loader
  --libs <a,b>     adapters only: stack-profile interaction names (default: every adapter);
                   names without an adapter are skipped
  --out-dir <dir>  dtcg: where to write the three files; terrazzo / style-dictionary: where the token
                   sources go, inside --root (default tokens)
  --name <stem>    dtcg, terrazzo, style-dictionary: file stem (default tokens: tokens.json, tokens.dark.json,
                   tokens.resolver.json)
  --tailwind       terrazzo / style-dictionary: put the light theme in Tailwind v4's @theme (stack profile
                   styling.tailwind "v4")
  --force          dtcg, terrazzo, style-dictionary: overwrite existing files
  --help
`;

const FORMATS = ["css", "tailwind4", "shadcn", "shadcn-registry", "daisyui", "chakra", "panda", "mantine", "antd", "prime", "angular-material", "tailwind3", "mui", "json", "js", "adapters", "chart-theme", "fonts", "ag-grid", "uniwind", "nativewind", "tamagui", "unistyles", "rn-motion", "flutter", "dtcg", ...PIPELINES];
const FILE_FORMATS = ["dtcg", ...PIPELINES];

function block(selector, decls, indent = "") {
  return `${indent}${selector} {\n${decls.map((d) => `${indent}  ${d}`).join("\n")}\n${indent}}`;
}

function darkBlocks(rows) {
  const dark = rows.filter((r) => r.dark != null).map((r) => `${r.varName}: ${r.dark};`);
  if (!dark.length) return "";
  dark.push("color-scheme: dark;"); // native controls and scrollbars follow the dark palette
  return "\n\n" + block('.dark, [data-theme="dark"]', dark) + "\n\n@media (prefers-color-scheme: dark) {\n" +
    block(':root:not(.light):not([data-theme="light"])', dark, "  ") + "\n}";
}

function lightDecls(rows) {
  const out = [];
  for (const r of rows) {
    out.push(`${r.varName}: ${r.light};`);
    if (r.group === "text") for (const m of textMetrics(r.token)) out.push(`${r.varName}--${m.suffix}: ${m.value};`);
  }
  return out;
}

export function emitCss(tokens) {
  const rows = flatten(tokens);
  return "/* generated by finally-good-ui emit-tokens.mjs from tokens.json; edit the tokens, not this block */\n" +
    block(":root", lightDecls(rows)) + darkBlocks(rows) + "\n";
}

// Tailwind v4 has no --duration-* theme namespace, so name the utilities ourselves:
// duration-standard etc. (numeric duration-150 keeps working).
const DURATION_UTILITY = "@utility duration-* {\n  --tw-duration: --value(--duration-*);\n  transition-duration: --value(--duration-*);\n}";

/** Tailwind v4 @theme declarations, with spacing aliases so p-4 etc. read our space scale. */
function themeDecls(rows) {
  const decls = lightDecls(rows);
  for (const r of rows.filter((x) => x.group === "space")) decls.push(`--spacing-${r.name}: var(${r.varName});`);
  return decls;
}

export function emitTailwind4(tokens) {
  const rows = flatten(tokens);
  return "/* generated by finally-good-ui emit-tokens.mjs; paste after @import \"tailwindcss\" */\n" +
    block("@theme", themeDecls(rows)) + "\n\n" + DURATION_UTILITY + darkBlocks(rows) + "\n";
}

// ---------- shadcn/ui (React) and its ports shadcn-vue, shadcn-svelte, Spartan ----------
// They read unprefixed colour variables from :root and .dark and map them in @theme inline.
// Roles shadcn components use that our tokens may not define fall back to the nearest role.
const SHADCN_FALLBACKS = {
  popover: "card", "popover-foreground": "card-foreground",
  secondary: "muted", "secondary-foreground": "foreground",
  sidebar: "card", "sidebar-foreground": "card-foreground",
  "sidebar-primary": "primary", "sidebar-primary-foreground": "primary-foreground",
  "sidebar-accent": "accent", "sidebar-accent-foreground": "accent-foreground",
  "sidebar-border": "border", "sidebar-ring": "ring",
};

function shadcnParts(tokens) {
  const rows = flatten(tokens);
  const colors = rows.filter((r) => r.group === "color");
  const others = rows.filter((r) => r.group !== "color");
  const defined = new Set(colors.map((r) => r.name));
  const fallbacks = Object.entries(SHADCN_FALLBACKS).filter(([name, from]) => !defined.has(name) && defined.has(from));
  const radius = rows.find((r) => r.group === "radius" && r.name === "md")?.light;
  return { colors, others, fallbacks, radius };
}

export function emitShadcn(tokens) {
  const { colors, others, fallbacks, radius } = shadcnParts(tokens);
  const light = [...colors.map((r) => `--${r.name}: ${r.light};`), ...fallbacks.map(([n, from]) => `--${n}: var(--${from});`)];
  if (radius) light.push(`--radius: ${radius};`);
  const dark = [...colors.filter((r) => r.dark != null).map((r) => `--${r.name}: ${r.dark};`),
    ...others.filter((r) => r.dark != null).map((r) => `${r.varName}: ${r.dark};`), "color-scheme: dark;"];
  const inline = [...colors.map((r) => r.name), ...fallbacks.map(([n]) => n)].map((n) => `--color-${n}: var(--${n});`);
  return "/* generated by finally-good-ui emit-tokens.mjs (--format shadcn); replaces the :root, .dark and @theme blocks\n" +
    "   in the CSS file named by components.json tailwind.css */\n" +
    block(":root", light) + "\n\n" + block(".dark", dark) + "\n\n" + block("@theme inline", inline) + "\n\n" +
    block("@theme", themeDecls(others)) + "\n\n" + DURATION_UTILITY + "\n";
}

/** A registry:theme item: `npx shadcn add ./finally-good-ui-theme.json` merges it into the project's CSS. */
export function emitShadcnRegistry(tokens) {
  const { colors, others, fallbacks, radius } = shadcnParts(tokens);
  const key = (r) => r.varName.replace(/^--/, "");
  const light = Object.fromEntries([...colors.map((r) => [r.name, r.light]), ...fallbacks.map(([n, from]) => [n, `var(--${from})`])]);
  if (radius) light.radius = radius;
  const dark = Object.fromEntries([...colors.filter((r) => r.dark != null).map((r) => [r.name, r.dark]),
    ...others.filter((r) => r.dark != null).map((r) => [key(r), r.dark])]);
  const theme = {};
  for (const r of others) {
    theme[key(r)] = r.light;
    if (r.group === "text") for (const m of textMetrics(r.token)) theme[`${key(r)}--${m.suffix}`] = m.value;
  }
  return JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry-item.json", name: "finally-good-ui-theme",
    type: "registry:theme", title: "finally-good-ui tokens", cssVars: { theme, light, dark } }, null, 2);
}

// ---------- daisyUI v5 (Tailwind v4 plugin) ----------
// Roles map onto daisyUI's names; its "accent" is a brand colour, so it takes a "mark" role when the
// tokens define one, else primary (our "accent" is a hover tint). Each entry: [daisy, ours, fallback].
const DAISY_COLORS = [
  ["base-100", "background"], ["base-200", "muted"], ["base-300", "border"], ["base-content", "foreground"],
  ["primary", "primary"], ["primary-content", "primary-foreground"],
  ["secondary", "secondary", "muted"], ["secondary-content", "secondary-foreground", "foreground"],
  ["accent", "mark", "primary"], ["accent-content", "mark-foreground", "primary-foreground"],
  ["neutral", "foreground"], ["neutral-content", "background"],
  ["info", "info"], ["info-content", "info-foreground"],
  ["success", "success"], ["success-content", "success-foreground"],
  ["warning", "warning"], ["warning-content", "warning-foreground"],
  ["error", "destructive"], ["error-content", "destructive-foreground"],
];
const DAISY_RADII = [["radius-selector", "sm"], ["radius-field", "md"], ["radius-box", "lg"]];

function daisyTheme(rows, mode) {
  const color = Object.fromEntries(rows.filter((r) => r.group === "color").map((r) => [r.name, mode === "dark" ? r.dark ?? r.light : r.light]));
  const radius = Object.fromEntries(rows.filter((r) => r.group === "radius").map((r) => [r.name, r.light]));
  const dark = mode === "dark";
  const decls = [`name: "fgu-${mode}";`, `default: ${!dark};`, `prefersdark: ${dark};`, `color-scheme: ${mode};`];
  for (const [daisy, ours, fallback] of DAISY_COLORS) {
    const value = color[ours] ?? color[fallback];
    if (value) decls.push(`--color-${daisy}: ${value};`);
  }
  for (const [daisy, ours] of DAISY_RADII) if (radius[ours]) decls.push(`--${daisy}: ${radius[ours]};`);
  decls.push("--border: 1px;", "--depth: 0;", "--noise: 0;"); // hairlines, flat: craft.hairlines-before-boxes
  return block('@plugin "daisyui/theme"', decls);
}

export function emitDaisyui(tokens) {
  const rows = flatten(tokens);
  const others = rows.filter((r) => r.group !== "color");
  return "/* generated by finally-good-ui emit-tokens.mjs (--format daisyui); paste after @plugin \"daisyui\" */\n" +
    daisyTheme(rows, "light") + "\n\n" + daisyTheme(rows, "dark") + "\n\n" + block("@theme", themeDecls(others)) + "\n\n" +
    DURATION_UTILITY + "\n";
}

// ---------- Chakra UI v3 and Panda CSS v2 (same token engine) ----------
// Colours become semantic tokens {base, _dark}; Chakra's own bg/fg/border names point at our roles,
// and a "brand" palette (tonal scale from primary) makes colorPalette="brand" work.
const CHAKRA_ROLES = { bg: { DEFAULT: "background", panel: "card", muted: "muted" }, fg: { DEFAULT: "foreground", muted: "muted-foreground" },
  border: { DEFAULT: "border" } };

function chakraTheme(tokens) {
  const rows = flatten(tokens);
  const group = (g) => rows.filter((r) => r.group === g);
  const values = (g) => Object.fromEntries(group(g).map((r) => [r.name, { value: r.light }]));
  const themed = (r) => ({ value: r.dark == null ? r.light : { base: r.light, _dark: r.dark } });
  const colors = Object.fromEntries(group("color").map((r) => [r.name, r]));

  const fonts = values("font");
  const display = fonts.heading ?? fonts.display ?? fonts.sans;
  if (fonts.sans) Object.assign(fonts, { body: fonts.sans, heading: display });

  const tokensOut = { fonts, fontSizes: values("text"), letterSpacings: values("tracking"), spacing: values("space"),
    radii: values("radius"), shadows: values("shadow"), durations: values("duration"), easings: values("easing") };
  const semantic = {};
  for (const r of group("color")) if (!(r.name in CHAKRA_ROLES)) semantic[r.name] = themed(r);
  for (const [chakra, parts] of Object.entries(CHAKRA_ROLES)) {
    const entries = Object.entries(parts).filter(([, ours]) => colors[ours]).map(([part, ours]) => [part, themed(colors[ours])]);
    if (entries.length) semantic[chakra] = Object.fromEntries(entries);
  }
  if (colors.primary) {
    tokensOut.colors = { brand: Object.fromEntries(Object.entries(colorScale(colors.primary.light, "tailwind").steps).map(([k, v]) => [k, { value: v }])) };
    const step = (light, dark) => ({ value: { base: `{colors.brand.${light}}`, _dark: `{colors.brand.${dark}}` } });
    semantic.brand = { solid: themed(colors.primary), fg: themed(colors.primary), muted: step(200, 800), subtle: step(100, 900), emphasized: step(300, 700) };
    if (colors["primary-foreground"]) semantic.brand.contrast = themed(colors["primary-foreground"]);
    if (colors.ring) semantic.brand.focusRing = themed(colors.ring);
  }
  const shadows = Object.fromEntries(group("shadow").filter((r) => r.dark != null).map((r) => [r.name, themed(r)]));
  return { tokens: tokensOut, semanticTokens: { colors: semantic, ...(Object.keys(shadows).length ? { shadows } : {}) } };
}

const themeModule = (tokens) => `const theme = ${JSON.stringify(chakraTheme(tokens), null, 2)};`;

export function emitChakra(tokens) {
  return "// generated by finally-good-ui emit-tokens.mjs (--format chakra); edit the tokens, not this file.\n" +
    "// <ChakraProvider value={system}>. Use colorPalette=\"brand\" for primary-coloured components.\n" +
    'import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";\n\n' +
    themeModule(tokens) + "\n\nexport const system = createSystem(defaultConfig, defineConfig({ theme }));\n";
}

export function emitPanda(tokens) {
  return "// generated by finally-good-ui emit-tokens.mjs (--format panda); edit the tokens, not this file.\n" +
    "// panda.config: presets: [\"@pandacss/preset-base\", fguPreset]. Dark values use Panda's _dark condition.\n" +
    'import { definePreset } from "@pandacss/dev";\n\n' +
    themeModule(tokens) + '\n\nexport default definePreset({ name: "finally-good-ui", theme: { extend: theme } });\n';
}

// ---------- Mantine v9 ----------
// Mantine's colour helpers (variants, alpha) need hex/rgb, so the 10-shade brand palette is hex.
// Everything else stays CSS: cssVariablesResolver sets Mantine's body/text/border vars and ours per scheme.
const MANTINE_SIZES = ["xs", "sm", "md", "lg", "xl"];
const MANTINE_FROM = {
  spacing: { xs: "2", sm: "3", md: "4", lg: "6", xl: "8" },
  fontSizes: { xs: "xs", sm: "sm", md: "base", lg: "lg", xl: "xl" },
  radius: { xs: "sm", sm: "sm", md: "md", lg: "lg", xl: "xl" },
  shadows: { xs: "sm", sm: "sm", md: "md", lg: "lg", xl: "lg" },
};
const MANTINE_VARS = { "--mantine-color-body": "background", "--mantine-color-text": "foreground",
  "--mantine-color-dimmed": "muted-foreground", "--mantine-color-default-border": "border",
  "--mantine-color-default": "card", "--mantine-color-default-hover": "accent", "--mantine-color-error": "destructive" };

const nearestStep = (steps, css) => {
  const L = (c) => (c.match(/^oklch\(([\d.]+)/) || [])[1] * 1;
  const target = L(cssValue("color", css)) || 0.5;
  return steps.reduce((best, c, i) => (Math.abs(L(c) - target) < Math.abs(L(steps[best]) - target) ? i : best), 0);
};

function mantineParts(tokens) {
  const rows = flatten(tokens);
  const by = (g) => Object.fromEntries(rows.filter((r) => r.group === g).map((r) => [r.name, r]));
  const colors = by("color"), fonts = by("font"), texts = by("text");
  const pick = (group, map) => Object.fromEntries(MANTINE_SIZES.filter((k) => group[map[k]]).map((k) => [k, group[map[k]].light]));
  const theme = {
    fontSizes: pick(texts, MANTINE_FROM.fontSizes), spacing: pick(by("space"), MANTINE_FROM.spacing),
    radius: pick(by("radius"), MANTINE_FROM.radius), defaultRadius: "md", shadows: pick(by("shadow"), MANTINE_FROM.shadows),
    lineHeights: Object.fromEntries(MANTINE_SIZES.filter((k) => texts[MANTINE_FROM.fontSizes[k]])
      .map((k) => [k, textMetrics(texts[MANTINE_FROM.fontSizes[k]].token).find((m) => m.suffix === "line-height")?.value]).filter(([, v]) => v)),
  };
  if (fonts.sans) theme.fontFamily = fonts.sans.light;
  if (fonts.mono) theme.fontFamilyMonospace = fonts.mono.light;
  const heading = fonts.heading ?? fonts.display ?? fonts.sans;
  if (heading) theme.headings = { fontFamily: heading.light };
  if (colors.primary) {
    const scale = Object.values(colorScale(colors.primary.light, "mantine").steps);
    theme.colors = { brand: scale.map((c) => toHex(c)) };
    theme.primaryColor = "brand";
    theme.primaryShade = { light: nearestStep(scale, colors.primary.light), dark: nearestStep(scale, colors.primary.dark ?? colors.primary.light) };
  }
  const scheme = (mode) => {
    const out = {};
    for (const [mantine, ours] of Object.entries(MANTINE_VARS)) if (colors[ours]) out[mantine] = mode === "dark" ? colors[ours].dark ?? colors[ours].light : colors[ours].light;
    for (const r of rows.filter((x) => x.dark != null || x.group === "color")) out[r.varName] = mode === "dark" ? r.dark ?? r.light : r.light;
    return out;
  };
  const variables = Object.fromEntries(rows.filter((r) => r.group === "duration" || r.group === "easing").map((r) => [r.varName, r.light]));
  return { theme, resolver: { variables, light: scheme("light"), dark: scheme("dark") } };
}

export function emitMantine(tokens) {
  const { theme, resolver } = mantineParts(tokens);
  return "// generated by finally-good-ui emit-tokens.mjs (--format mantine); edit the tokens, not this file.\n" +
    "// <MantineProvider theme={theme} cssVariablesResolver={resolver}>\n" +
    'import { createTheme } from "@mantine/core";\n\n' +
    `const themeInput = ${JSON.stringify(theme, null, 2)};\n\n` +
    `const resolverInput = ${JSON.stringify(resolver, null, 2)};\n\n` +
    "export const theme = createTheme(themeInput);\nexport const resolver = () => resolverInput;\n";
}

// ---------- Ant Design v6 ----------
// antd derives palettes from hex seeds and wants sizes as px numbers and durations as "0.25s".
// It normally computes dark mode with darkAlgorithm; we pass our designed dark values on top of it.
const ANTD_COLORS = { colorPrimary: "primary", colorSuccess: "success", colorWarning: "warning", colorError: "destructive",
  colorInfo: "info", colorBgBase: "background", colorTextBase: "foreground", colorBgLayout: "background",
  colorBgContainer: "card", colorBgElevated: "card", colorBorder: "border", colorBorderSecondary: "border",
  colorText: "foreground", colorTextSecondary: "muted-foreground", colorFillSecondary: "muted", colorLink: "primary" };
const ANTD_DURATIONS = { motionDurationFast: "micro", motionDurationMid: "standard", motionDurationSlow: "medium" };
const ANTD_EASINGS = { motionEaseInOut: "move", motionEaseOut: "enter", motionEaseIn: "exit" };

function antdTokens(rows, mode) {
  const by = (g) => Object.fromEntries(rows.filter((r) => r.group === g).map((r) => [r.name, r]));
  const colors = by("color"), radius = by("radius"), texts = by("text"), fonts = by("font");
  const durations = by("duration"), easings = by("easing");
  const out = {};
  for (const [antd, ours] of Object.entries(ANTD_COLORS)) {
    const r = colors[ours];
    if (r) out[antd] = toHex(mode === "dark" ? r.dark ?? r.light : r.light);
  }
  const px = (r) => (r ? parseDimension(r.light)?.value : undefined);
  if (radius.md) out.borderRadius = px(radius.md);
  if (radius.sm) out.borderRadiusSM = px(radius.sm);
  if (radius.lg) out.borderRadiusLG = px(radius.lg);
  if (texts.base) out.fontSize = px(texts.base);
  if (fonts.sans) out.fontFamily = fonts.sans.light;
  if (fonts.mono) out.fontFamilyCode = fonts.mono.light;
  for (const [antd, ours] of Object.entries(ANTD_DURATIONS)) if (durations[ours]) out[antd] = `${parseDuration(durations[ours].light).value / 1000}s`;
  for (const [antd, ours] of Object.entries(ANTD_EASINGS)) if (easings[ours]) out[antd] = easings[ours].light;
  return out;
}

export function emitAntd(tokens) {
  const rows = flatten(tokens);
  const sets = { light: antdTokens(rows, "light"), dark: antdTokens(rows, "dark") };
  return "// generated by finally-good-ui emit-tokens.mjs (--format antd); edit the tokens, not this file.\n" +
    "// import { ConfigProvider, theme } from \"antd\"; <ConfigProvider theme={themeFor(isDark, theme)}>\n\n" +
    `const tokens = ${JSON.stringify(sets, null, 2)};\n\n` +
    "export { tokens };\n\n" +
    "/** antd theme config: our designed dark values on top of antd's dark algorithm, CSS variables on. */\n" +
    "export function themeFor(isDark, antdTheme) {\n" +
    "  return isDark\n" +
    "    ? { algorithm: antdTheme.darkAlgorithm, token: tokens.dark, cssVar: true }\n" +
    "    : { algorithm: antdTheme.defaultAlgorithm, token: tokens.light, cssVar: true };\n}\n";
}

// ---------- PrimeVue / PrimeNG / PrimeReact: one @primeuix preset on top of Aura ----------
// Shape checked against primefaces/primeuix packages/themes/src/presets/aura/base/index.ts.
function primeOverrides(tokens) {
  const rows = flatten(tokens);
  const by = (g) => Object.fromEntries(rows.filter((r) => r.group === g).map((r) => [r.name, r]));
  const colors = by("color"), radius = by("radius"), durations = by("duration");
  const pick = (name, mode) => colors[name] && (mode === "dark" ? colors[name].dark ?? colors[name].light : colors[name].light);
  const primary = colorScale(pick("primary", "light"), "tailwind");
  const names = Object.keys(primary.steps);
  const near = (css) => names[nearestStep(Object.values(primary.steps), css)];
  const neighbour = (step, by) => `{primary.${names[Math.max(0, Math.min(names.length - 1, names.indexOf(step) + by))]}}`;
  const neutral = colorScale(pick("muted-foreground", "light") ?? "oklch(0.55 0.01 265)", "tailwind").steps;

  const scheme = (mode) => {
    const c = (name) => pick(name, mode);
    const step = near(c("primary"));
    const darker = mode === "dark" ? -1 : 1; // hover moves away from the canvas
    const surface = { 0: c("card"), ...neutral };
    const panel = { background: c("card"), borderColor: c("border"), color: "{text.color}" };
    return {
      surface,
      primary: { color: c("primary"), contrastColor: c("primary-foreground"), hoverColor: neighbour(step, darker), activeColor: neighbour(step, 2 * darker) },
      highlight: { background: c("accent"), focusBackground: c("accent"), color: c("accent-foreground"), focusColor: c("accent-foreground") },
      mask: { background: c("overlay") },
      text: { color: c("foreground"), hoverColor: c("foreground"), mutedColor: c("muted-foreground"), hoverMutedColor: c("foreground") },
      content: { background: c("card"), hoverBackground: c("muted"), borderColor: c("border"), color: "{text.color}", hoverColor: "{text.hover.color}" },
      formField: { background: c("card"), borderColor: c("input"), hoverBorderColor: c("muted-foreground"), focusBorderColor: "{primary.color}",
        color: c("foreground"), placeholderColor: c("muted-foreground") },
      overlay: { select: panel, popover: panel, modal: panel },
    };
  };
  const radii = Object.fromEntries(["none", "sm", "md", "lg", "xl"].filter((k) => radius[k]).map((k) => [k, radius[k].light]));
  if (radius.sm) radii.xs = radius.sm.light;
  const standard = durations.standard && parseDuration(durations.standard.light);
  return {
    primitive: { borderRadius: radii },
    semantic: {
      ...(standard ? { transitionDuration: `${standard.value / 1000}s` } : {}),
      primary: primary.steps,
      colorScheme: { light: scheme("light"), dark: scheme("dark") },
    },
  };
}

export function emitPrime(tokens) {
  return "// generated by finally-good-ui emit-tokens.mjs (--format prime); edit the tokens, not this file.\n" +
    "// PrimeVue: app.use(PrimeVue, { theme: { preset: FguPreset, options: { darkModeSelector: \".dark\" } } })\n" +
    "// PrimeNG: providePrimeNG({ theme: { preset: FguPreset, options: { darkModeSelector: \".dark\" } } })\n" +
    "// PrimeReact: <PrimeReactProvider value={{ theme: { preset: FguPreset, options: { darkModeSelector: \".dark\" } } }}>\n" +
    'import { definePreset } from "@primeuix/themes";\nimport Aura from "@primeuix/themes/aura";\n\n' +
    `const overrides = ${JSON.stringify(primeOverrides(tokens), null, 2)};\n\n` +
    "export const FguPreset = definePreset(Aura, overrides);\n";
}

// ---------- Angular Material (M3 system tokens) ----------
// Override names checked against angular/components src/material/core/tokens/m3/_md-sys-color.scss.
// light-dark() carries both themes, so one mat.theme call serves light and dark (color-scheme decides).
const M3_OVERRIDES = [
  ["primary", "primary"], ["on-primary", "primary-foreground"],
  ["primary-container", "accent"], ["on-primary-container", "accent-foreground"],
  ["surface", "background"], ["on-surface", "foreground"], ["on-surface-variant", "muted-foreground"],
  ["surface-container-lowest", "card"], ["surface-container-low", "card"], ["surface-container", "card"],
  ["surface-container-high", "muted"], ["surface-container-highest", "muted"],
  ["outline", "input"], ["outline-variant", "border"],
  ["error", "destructive"], ["on-error", "destructive-foreground"], ["scrim", "overlay"],
];

export function emitAngularMaterial(tokens) {
  const rows = flatten(tokens);
  const colors = Object.fromEntries(rows.filter((r) => r.group === "color").map((r) => [r.name, r]));
  const fonts = Object.fromEntries(rows.filter((r) => r.group === "font").map((r) => [r.name, r.light]));
  const ld = (r) => (r.dark == null ? r.light : `light-dark(${r.light}, ${r.dark})`);
  const overrides = M3_OVERRIDES.filter(([, ours]) => colors[ours]).map(([m3, ours]) => `      ${m3}: ${ld(colors[ours])},`);
  const plain = (fonts.sans ?? "system-ui").replace(/'/g, '"');
  const brand = (fonts.heading ?? fonts.display ?? fonts.sans ?? "system-ui").replace(/'/g, '"');
  const ours = rows.map((r) => `  ${r.varName}: ${r.group === "color" ? ld(r) : r.light};`);
  return "// generated by finally-good-ui emit-tokens.mjs (--format angular-material); edit the tokens, not this file.\n" +
    "// Put in the global styles.scss. Dark mode follows color-scheme: the OS by default, .dark to force it.\n" +
    "@use '@angular/material' as mat;\n\n" +
    "html {\n  color-scheme: light dark;\n" +
    `  @include mat.theme((color: mat.$azure-palette, typography: (plain-family: '${plain}', brand-family: '${brand}'), density: 0), $overrides: (\n` +
    overrides.join("\n") + "\n  ));\n}\n\n" +
    ".dark { color-scheme: dark; }\n.light { color-scheme: light; }\n\n" +
    `:root {\n${ours.join("\n")}\n}` + darkBlocks(rows.filter((r) => r.group !== "color")) + "\n";
}

export function emitTailwind3(tokens) {
  const rows = flatten(tokens);
  const KEYS = { color: "colors", font: "fontFamily", text: "fontSize", tracking: "letterSpacing", space: "spacing",
    radius: "borderRadius", shadow: "boxShadow", duration: "transitionDuration", easing: "transitionTimingFunction" };
  const extend = {};
  for (const r of rows) {
    const k = KEYS[r.group];
    let v = `var(${r.varName})`;
    if (r.group === "text") {
      // Tailwind 3 fontSize tuple: [size, { lineHeight, letterSpacing }]
      const metrics = Object.fromEntries(textMetrics(r.token).map((m) => [m.prop, `var(${r.varName}--${m.suffix})`]));
      if (Object.keys(metrics).length) v = [v, metrics];
    }
    (extend[k] ||= {})[r.name] = v;
  }
  const body = Object.entries(extend).map(([k, obj]) =>
    `      ${k}: {\n${Object.entries(obj).map(([n, v]) => `        ${JSON.stringify(n)}: ${JSON.stringify(v)},`).join("\n")}\n      },`).join("\n");
  return "// generated by finally-good-ui emit-tokens.mjs. Requires the CSS variables from --format css.\n" +
    "module.exports = {\n  darkMode: [\"class\"],\n  theme: {\n    extend: {\n" + body + "\n    },\n  },\n};\n";
}

export function emitJson(tokens) {
  const rows = flatten(tokens);
  const light = {}, dark = {};
  for (const r of rows) {
    light[r.varName] = r.light;
    if (r.group === "text") for (const m of textMetrics(r.token)) light[`${r.varName}--${m.suffix}`] = m.value;
    if (r.dark != null) dark[r.varName] = r.dark;
  }
  return { light, dark };
}

export function emitJs(tokens) {
  const durs = Object.fromEntries([...groupTokens(tokens?.duration)].map(([n, t]) => [n, parseDuration(t.$value)?.value]).filter(([, v]) => v != null));
  const eases = Object.fromEntries([...groupTokens(tokens?.easing)].map(([n, t]) => [n, parseEasing(t.$value)]).filter(([, v]) => v));
  return `// generated by finally-good-ui emit-tokens.mjs from tokens.json (--format js); edit the tokens, not this file.
// Motion tokens for JS (Motion, WAAPI, Svelte/Vue transition props, timers that wait on a transition).
// Call when animating, not at module load: the live CSS variable wins (theme and reduced-motion overrides),
// the token value is the fallback (server rendering, tests).
const DURATIONS = ${JSON.stringify(durs)};
const EASINGS = ${JSON.stringify(eases)};
const cssVar = (n) => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const known = (map, kind, name) => { if (!Object.hasOwn(map, name)) throw new Error(\`unknown \${kind} token "\${name}"\`); };

export const durations = Object.keys(DURATIONS);
export const easings = Object.keys(EASINGS);

/** Duration in ms: ms("standard") -> 250. */
export function ms(name) {
  known(DURATIONS, "duration", name);
  const live = cssVar(\`--duration-\${name}\`);
  const n = parseFloat(live);
  if (!Number.isFinite(n)) return DURATIONS[name];
  return /ms$/.test(live) ? n : /s$/.test(live) ? n * 1000 : n;
}

/** Duration in seconds (Motion): sec("standard") -> 0.25. */
export const sec = (name) => ms(name) / 1000;

/** Cubic-bezier control points: ease("move") -> [0.2, 0, 0, 1]. */
export function ease(name) {
  known(EASINGS, "easing", name);
  const live = cssVar(\`--ease-\${name}\`);
  if (live === "linear") return [0, 0, 1, 1];
  const pts = live.match(/-?[\\d.]+/g);
  return pts && pts.length === 4 ? pts.map(Number) : EASINGS[name];
}

/** CSS easing string: cssEase("move") -> "cubic-bezier(0.2, 0, 0, 1)" (WAAPI, dnd-kit, SortableJS, AutoAnimate, Number Flow). */
export function cssEase(name) {
  const p = ease(name);
  return p.join() === "0,0,1,1" ? "linear" : \`cubic-bezier(\${p.join(", ")})\`;
}

/** Control points as one string, for GSAP: CustomEase.create("fgu-move", bezierString("move")). */
export const bezierString = (name) => ease(name).join(",");

/** Easing as a function of progress 0..1, for libraries that take one (Svelte transition:, React Spring, Lenis). */
export function easeFn(name) {
  const [x1, y1, x2, y2] = ease(name);
  if (x1 === y1 && x2 === y2) return (x) => x;
  const curve = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
  const slope = (a, b, t) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * (1 - t) * t + 3 * (1 - b) * t ** 2;
  const solveT = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = curve(x1, x2, t) - x, d = slope(x1, x2, t);
      if (Math.abs(err) < 1e-7 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    if (t >= 0 && t <= 1 && Math.abs(curve(x1, x2, t) - x) < 1e-6) return t;
    let lo = 0, hi = 1; // Newton wandered off: bisect instead
    for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (curve(x1, x2, t) < x) lo = t; else hi = t; }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : curve(y1, y2, solveT(x)));
}

/** Motion spring that settles in a duration token: spring("medium", { bounce: 0.2 }). */
export const spring = (name, { bounce = 0 } = {}) => ({ type: "spring", visualDuration: sec(name), bounce });

/** Does the user ask for reduced motion? False on the server. */
export const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Durations for movement (translate, scale, layout): 0 under reduced motion. Fades may keep ms()/sec(). */
export const msMotion = (name) => (reduced() ? 0 : ms(name));
export const secMotion = (name) => msMotion(name) / 1000;
`;
}

/**
 * MUI createTheme input. scheme sets cssVariables: "media" (follow the OS; MUI's default), "class"
 * (.dark), "data" ([data-dark]), or a custom selector such as "[data-theme=%s]".
 */
export function emitMui(tokens, { scheme = "media" } = {}) {
  const colors = Object.fromEntries(groupTokens(tokens?.color));
  const hex = (name, mode) => {
    const t = colors[name];
    if (!t) return undefined;
    const v = cssValue("color", mode === "dark" ? darkOf(t) ?? t.$value : t.$value);
    return toHex(v) ?? v;
  };
  const palette = (mode) => {
    const p = { mode };
    const set = (key, obj) => { const clean = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)); if (Object.keys(clean).length) p[key] = clean; };
    set("primary", { main: hex("primary", mode), contrastText: hex("primary-foreground", mode) });
    set("secondary", { main: hex("secondary", mode) ?? hex("accent", mode), contrastText: hex("secondary-foreground", mode) ?? hex("accent-foreground", mode) });
    set("error", { main: hex("destructive", mode), contrastText: hex("destructive-foreground", mode) });
    set("success", { main: hex("success", mode), contrastText: hex("success-foreground", mode) });
    set("warning", { main: hex("warning", mode), contrastText: hex("warning-foreground", mode) });
    set("info", { main: hex("info", mode), contrastText: hex("info-foreground", mode) });
    set("background", { default: hex("background", mode), paper: hex("card", mode) ?? hex("background", mode) });
    set("text", { primary: hex("foreground", mode), secondary: hex("muted-foreground", mode) });
    const divider = hex("border", mode);
    if (divider) p.divider = divider;
    return p;
  };
  const light = palette("light"), dark = palette("dark");

  const fonts = Object.fromEntries(groupTokens(tokens?.font));
  const fontName = ["sans", "body"].find((n) => fonts[n]) ?? Object.keys(fonts)[0];
  const texts = Object.fromEntries(groupTokens(tokens?.text));
  const px = (d) => (d ? (d.unit === "rem" ? d.value * 16 : d.value) : undefined);
  const typography = {};
  if (fontName) typography.fontFamily = fontValue(fontName, fonts[fontName]);
  if (fonts.mono) typography.fontFamilyMonospace = fontValue("mono", fonts.mono);
  const base = texts.base ?? texts.md;
  if (base) typography.fontSize = px(parseDimension(base.$value));
  // Variants carry the per-step metrics (craft.tracking-by-size). Mapped by the default step names.
  const variant = (tok) => {
    const d = parseDimension(tok.$value);
    const v = d ? { fontSize: `${Math.round((px(d) / 16) * 10000) / 10000}rem` } : {};
    for (const m of textMetrics(tok)) v[m.prop] = m.prop === "lineHeight" ? Number(m.value) : m.value;
    return v;
  };
  const VARIANTS = { h1: "6xl", h2: "5xl", h3: "4xl", h4: "3xl", h5: "2xl", h6: "xl", subtitle1: "lg",
    body1: texts.base ? "base" : "md", body2: "sm", caption: "xs" };
  for (const [mui, ours] of Object.entries(VARIANTS)) if (texts[ours]) typography[mui] = variant(texts[ours]);
  const caps = Object.fromEntries(groupTokens(tokens?.tracking)).caps;
  if (caps) typography.overline = { ...(texts.xs ? variant(texts.xs) : {}), textTransform: "uppercase", letterSpacing: cssValue("tracking", caps.$value) };

  const radii = Object.fromEntries(groupTokens(tokens?.radius));
  const r = radii.md ?? radii.base ?? radii.DEFAULT ?? Object.values(radii).find((t) => (parseDimension(t.$value)?.value ?? 0) > 0);
  const shape = r ? { borderRadius: px(parseDimension(r.$value)) } : {};

  const durs = Object.fromEntries([...groupTokens(tokens?.duration)].map(([n, t]) => [n, parseDuration(t.$value)?.value]));
  const duration = {};
  const map = { shortest: "micro", shorter: "short", short: "standard", standard: "medium", complex: "long", enteringScreen: "standard" };
  for (const [k, ours] of Object.entries(map)) if (durs[ours] != null) duration[k] = durs[ours];
  if (durs.standard != null) duration.leavingScreen = Math.round(durs.standard * 0.7);
  const eases = Object.fromEntries([...groupTokens(tokens?.easing)].map(([n, t]) => [n, t.$value]));
  const easing = {};
  const emap = { easeInOut: "move", easeOut: "enter", easeIn: "exit", sharp: "snappy" };
  for (const [k, ours] of Object.entries(emap)) {
    if (eases[ours] != null) { const e = parseEasing(eases[ours]); easing[k] = e ? `cubic-bezier(${e.join(", ")})` : String(eases[ours]); }
  }
  return {
    cssVariables: scheme === "media" ? true : { colorSchemeSelector: scheme },
    palette: light,
    colorSchemes: { light: { palette: light }, dark: { palette: dark } },
    typography,
    shape,
    transitions: { duration, easing },
  };
}

export function emit(tokens, format, { muiScheme, libs, loader } = {}) {
  switch (format) {
    case "css": return emitCss(tokens);
    case "tailwind4": return emitTailwind4(tokens);
    case "shadcn": return emitShadcn(tokens);
    case "shadcn-registry": return emitShadcnRegistry(tokens);
    case "daisyui": return emitDaisyui(tokens);
    case "chakra": return emitChakra(tokens);
    case "panda": return emitPanda(tokens);
    case "mantine": return emitMantine(tokens);
    case "antd": return emitAntd(tokens);
    case "prime": return emitPrime(tokens);
    case "angular-material": return emitAngularMaterial(tokens);
    case "tailwind3": return emitTailwind3(tokens);
    case "mui": return emitMui(tokens, { scheme: muiScheme });
    case "json": return emitJson(tokens);
    case "js": return emitJs(tokens);
    case "adapters": return emitAdaptersOrUsageError(tokens, libs);
    case "chart-theme": return emitChartThemeOrUsageError(tokens);
    case "fonts": return emitFonts(tokens, loader);
    case "ag-grid": return missingTokenAsUsage(() => emitAgGrid(tokens));
    case "uniwind": return emitUniwind(tokens);
    case "nativewind": return emitNativewind(tokens);
    case "tamagui": return emitTamagui(tokens);
    case "unistyles": return emitUnistyles(tokens);
    case "rn-motion": return emitRnMotion(tokens);
    case "flutter": try { return emitFlutter(tokens); } catch (e) { throw new UsageError(e.message); }
    default: throw new UsageError(`unknown --format ${format} (use ${FORMATS.join("|")})`);
  }
}

function fontLoader(name = "google") {
  if (!LOADERS.includes(name)) throw new UsageError(`unknown --loader ${name} (use ${LOADERS.join("|")})`);
  return name;
}

function emitChartThemeOrUsageError(tokens) {
  try { return emitChartTheme(tokens); } catch (e) { throw new UsageError(e.message); }
}

function missingTokenAsUsage(emitFn) {
  try { return emitFn(); } catch (e) {
    if (e instanceof MissingTokenError) throw new UsageError(e.message);
    throw e;
  }
}

const emitAdaptersOrUsageError = (tokens, libs) => missingTokenAsUsage(() => emitAdapters(tokens, libs));

/** Write {relativePath: text} under dir; refuses to replace existing files unless force. */
function writeFiles(dir, files, force) {
  const taken = Object.keys(files).filter((f) => existsSync(join(dir, f)));
  if (taken.length && !force) throw new UsageError(`${taken.join(", ")} already exist in ${dir}; pass --force to overwrite`);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
  return Object.keys(files);
}

export function writeDtcg(tokens, outDir, { force = false, name = "tokens" } = {}) {
  const files = Object.fromEntries(Object.entries(dtcgFiles(tokens, name)).map(([f, json]) => [f, formatJson(json)]));
  return { tool: "emit-tokens", format: "dtcg", outDir, written: writeFiles(outDir, files, force) };
}

/** Token sources plus a Terrazzo or Style Dictionary config, written under the project root. */
export function writePipeline(tokens, pipeline, root, { srcDir = "tokens", name = "tokens", tailwind = false, force = false } = {}) {
  const rel = relative(root, resolve(root, srcDir));
  if (rel.startsWith("..")) throw new UsageError(`--out-dir ${srcDir} must be inside --root`);
  const out = pipelineFiles(tokens, pipeline, { srcDir: rel.split(sep).join("/") || ".", name, tailwind });
  return { tool: "emit-tokens", format: pipeline, root, written: writeFiles(root, out.files, force),
    install: out.install, build: out.build, css: out.css };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root", "in", "format", "out-dir", "name", "mui-scheme", "libs", "loader"], boolean: ["force", "tailwind"] },
    main: ({ flags }) => {
      const format = flags.format || "css";
      if (!FORMATS.includes(format)) throw new UsageError(`unknown --format ${format} (use ${FORMATS.join("|")})`);
      if (!flags.in) throw new UsageError("--in <tokens.json> is required");
      let tokens;
      try { tokens = loadTokens(resolve(flags.root || ".", flags.in)); } catch (e) { throw new UsageError(e.message); }
      if (!FILE_FORMATS.includes(format)) return emit(tokens, format, { muiScheme: flags["mui-scheme"] || "media", libs: flags.libs?.split(",").map((x) => x.trim()).filter(Boolean), loader: fontLoader(flags.loader) });
      const name = flags.name || "tokens";
      if (format !== "dtcg") {
        return writePipeline(tokens, format, resolve(flags.root || "."), { srcDir: flags["out-dir"] || "tokens", name, tailwind: flags.tailwind, force: flags.force });
      }
      if (!flags["out-dir"]) throw new UsageError("--format dtcg needs --out-dir <dir>");
      return writeDtcg(tokens, resolve(flags.root || ".", flags["out-dir"]), { force: flags.force, name });
    },
  });
}
