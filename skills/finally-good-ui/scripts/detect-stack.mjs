#!/usr/bin/env node
// Build the stack profile from package.json, lockfiles and project files.
import { join, basename, resolve, dirname } from "node:path";
import { runCli, isMain } from "./lib/cli.mjs";
import { readJson, readText, walk, isDir, isFile, exists } from "./lib/fs.mjs";

const HELP = `
Usage: detect-stack.mjs [--root <dir>]

Detects framework, router, styling (Tailwind v3/v4, CSS modules, Sass, CSS-in-JS, Panda,
UnoCSS, StyleX, vanilla-extract),
component kit (for shadcn: its primitive base, style, CSS entry and port), unstyled primitive
libraries (Radix, Base UI, React Aria, Reka, Bits UI, Ark UI, Kobalte, Headless UI, UI SDK), animation,
interaction (toasts, drawers, command menus, positioning, drag and drop, carousels, virtual lists), chart, form,
schema, table and icon libraries,
the view-transition integration, font loading, TypeScript, package manager, dev script,
testing tools, design files and whether .design/ exists. Prints the stack profile as JSON.

Options:
  --root <dir>   project root (default: cwd)
  --help         show this help
`;

const cleanVersion = (v) => (typeof v === "string" ? (v.match(/\d+(\.\d+){0,2}/) || [null])[0] : null);
const major = (v) => { const c = cleanVersion(v); return c ? parseInt(c, 10) : null; };
/** Is version range `v` at least major.minor? Reads the lowest version the range names. */
const atLeast = (v, [maj, min]) => {
  const [a, b = 0] = (cleanVersion(v) || "").split(".").map(Number);
  return Number.isFinite(a) && a > 0 && (a > maj || (a === maj && b >= min));
};

const DESIGN_NAMES = new Set(["globals.css", "global.css", "app.css", "index.css", "main.css", "style.css", "styles.css", "tokens.json"]);
const isDesignFile = (rel) => {
  const b = basename(rel).toLowerCase();
  return DESIGN_NAMES.has(b) || /^tailwind\.config\.(js|cjs|mjs|ts|cts|mts)$/.test(b) ||
    /^theme\.(ts|tsx|js|jsx|mjs|cjs|css|scss|json)$/.test(b) || /\.tokens\.json$/.test(b) ||
    /^_?(design[-_]?)?(tokens?|variables|vars|colou?rs|theme)\.(css|scss|sass|less)$/.test(b);
};

/**
 * Is `name` importable from `root`? Mirrors Node's lookup: <dir>/node_modules/<name> in root and
 * every parent. A stat per directory, no module loading, so it stays fast.
 */
export function resolvable(root, name) {
  for (let d = resolve(root); ; d = dirname(d)) {
    if (isFile(join(d, "node_modules", name, "package.json"))) return true;
    if (dirname(d) === d) return false;
  }
}

/** [name, present?] in report order; the motion recipe headless-primitive-motion keys on these names. */
const PRIMITIVES = [
  ["radix", (has, hasPrefix) => hasPrefix("@radix-ui/react-") || has("radix-ui")],
  ["base-ui", (has) => has("@base-ui/react") || has("@base-ui-components/react")],
  ["react-aria", (has) => has("react-aria-components") || has("react-aria")],
  ["reka", (has) => has("reka-ui") || has("radix-vue")],
  ["bits", (has) => has("bits-ui")],
  ["ark", (has, hasPrefix) => hasPrefix("@ark-ui/")],
  ["kobalte", (has) => has("@kobalte/core")],
  ["headlessui", (has, hasPrefix) => hasPrefix("@headlessui/")],
  ["ui-sdk", (has, hasPrefix) => hasPrefix("@ui-sdk/")],
];

const isDotLottie = (d) => d.startsWith("@lottiefiles/dotlottie");

/** [name, present?]: libraries that animate. dotLottie is a separate player from lottie-web. */
const ANIMATION = [
  ["motion", (has) => has("motion") || has("framer-motion") || has("motion-v") || has("@vueuse/motion")],
  ["gsap", (has) => has("gsap")],
  ["react-spring", (has, hasPrefix) => hasPrefix("@react-spring/") || has("react-spring")],
  ["auto-animate", (has) => has("@formkit/auto-animate")],
  ["lottie", (has, hasPrefix, deps) => has("lottie-web") || has("lottie-react") || deps.some((d) => d.startsWith("@lottiefiles/") && !isDotLottie(d))],
  ["dotlottie", (has, hasPrefix, deps) => deps.some(isDotLottie)],
  ["animejs", (has) => has("animejs")],
  ["rive", (has, hasPrefix) => hasPrefix("@rive-app/")],
  ["lenis", (has) => has("lenis") || has("@studio-freight/lenis")],
  ["number-flow", (has, hasPrefix) => has("number-flow") || hasPrefix("@number-flow/")],
  ["angular-animations-legacy", (has) => has("@angular/animations")], // deprecated: use animate.enter / animate.leave
  ["reanimated", (has) => has("react-native-reanimated")],
  ["moti-unmaintained", (has) => has("moti")], // no release since 2025: animate with Reanimated directly
];

/**
 * [lib, package matcher, api]. api says where the icon-stroke token goes: "stroke" (a stroke width),
 * "weight" (named weights, Phosphor), "fixed-grid" (drawn per size, pick the grid nearest the icon
 * size), "font-axes" (variable icon font), "em" (sized by font-size, no stroke control).
 */
const ICONS = [
  ["lucide", (d) => d === "lucide" || d.startsWith("lucide-") || d.startsWith("@lucide/"), "stroke"],
  ["heroicons", (d) => d.startsWith("@heroicons/"), "fixed-grid"],
  ["phosphor", (d) => d.startsWith("@phosphor-icons/") || d === "phosphor-react", "weight"],
  ["tabler", (d) => d.startsWith("@tabler/icons"), "stroke"],
  ["radix-icons", (d) => d === "@radix-ui/react-icons", "fixed-grid"],
  ["hugeicons", (d) => d === "@hugeicons/react" || d === "@hugeicons/vue" || d === "hugeicons-react", "stroke"],
  ["solar", (d) => d.startsWith("@solar-icons/"), "stroke"],
  ["remix", (d) => d.startsWith("@remixicon/") || d === "remixicon", "fixed-grid"],
  ["material-symbols", (d) => d === "material-symbols" || d.startsWith("@material-symbols/"), "font-axes"],
  ["unplugin-icons", (d) => d === "unplugin-icons", "em"],
  ["iconify", (d) => d.startsWith("@iconify/") && !d.startsWith("@iconify/json"), "em"],
  ["react-icons", (d) => d === "react-icons", "em"],
];

/** [name, present?] lists, first match wins: form state libraries, schema validators, tables. */
const FORM_LIBS = [
  ["react-hook-form", (has) => has("react-hook-form")],
  ["tanstack-form", (has, hasPrefix, deps) => deps.some((d) => /^@tanstack\/[\w-]*form$/.test(d))],
  ["conform", (has, hasPrefix) => hasPrefix("@conform-to/")],
  ["vee-validate", (has) => has("vee-validate")],
  ["superforms", (has) => has("sveltekit-superforms")],
  ["formik", (has) => has("formik")], // little maintenance: build new forms without it
];
const SCHEMAS = [["zod", (has) => has("zod")], ["valibot", (has) => has("valibot")], ["arktype", (has) => has("arktype")], ["yup", (has) => has("yup")]];
const TABLES = [
  ["ag-grid", (has) => has("ag-grid-community") || has("ag-grid-react") || has("ag-grid-vue3") || has("ag-grid-angular") || has("ag-grid-enterprise")],
  ["mui-x-data-grid", (has, hasPrefix) => hasPrefix("@mui/x-data-grid")],
  ["tanstack-table", (has, hasPrefix, deps) => deps.some((d) => /^@tanstack\/[\w-]*table$/.test(d))],
];

/** [name, present?]: chart libraries. SVG ones take var(--color-chart-N); canvas ones (echarts, chartjs,
 * ag-charts, uplot) need the resolved colours from --format chart-theme. */
const CHARTS = [
  ["recharts", (has) => has("recharts")],
  ["tremor", (has) => has("@tremor/react")],
  ["visx", (has, hasPrefix) => hasPrefix("@visx/")],
  ["nivo", (has, hasPrefix) => hasPrefix("@nivo/")],
  ["echarts", (has) => has("echarts") || has("echarts-for-react") || has("vue-echarts")],
  ["chartjs", (has) => has("chart.js") || has("react-chartjs-2") || has("vue-chartjs")],
  ["plot", (has) => has("@observablehq/plot")],
  ["d3", (has, hasPrefix) => has("d3") || hasPrefix("d3-")],
  ["ag-charts", (has, hasPrefix) => hasPrefix("ag-charts-")],
  ["uplot", (has) => has("uplot")],
  ["victory", (has) => has("victory")],
  ["unovis", (has, hasPrefix) => hasPrefix("@unovis/")],
  ["layerchart", (has) => has("layerchart")],
];

/** [name, present?]: interaction libraries, one name per family across its framework ports. */
const INTERACTION = [
  ["sonner", (has) => has("sonner") || has("vue-sonner") || has("svelte-sonner")],
  ["vaul-unmaintained", (has) => has("vaul") || has("vaul-vue") || has("vaul-svelte")], // use the primitive library's Drawer
  ["cmdk", (has) => has("cmdk") || has("cmdk-sv")],
  ["floating-ui", (has, hasPrefix) => hasPrefix("@floating-ui/")],
  ["dnd-kit", (has) => has("@dnd-kit/core")], // classic API
  ["dnd-kit-next", (has) => ["react", "vue", "svelte", "solid", "dom"].some((f) => has(`@dnd-kit/${f}`))],
  ["pragmatic-dnd", (has) => has("@atlaskit/pragmatic-drag-and-drop")],
  ["sortablejs", (has) => has("sortablejs") || has("vuedraggable")],
  ["embla", (has, hasPrefix) => hasPrefix("embla-carousel")],
  ["tanstack-virtual", (has, hasPrefix, deps) => deps.some((d) => /^@tanstack\/[\w-]*virtual$/.test(d))],
  ["react-day-picker", (has) => has("react-day-picker")],
  ["input-otp", (has) => has("input-otp")],
  ["react-resizable-panels", (has) => has("react-resizable-panels")],
];

/**
 * Styled component kits, first match wins (shadcn is found earlier, by its components.json).
 * versionFrom: packages whose major version is the kit's own, tried in order; a framework port
 * with its own numbering (flowbite-react 0.x) is left out so the version is not misreported.
 */
const KITS = [
  { name: "mui", test: (has) => has("@mui/material"), versionFrom: ["@mui/material"] },
  // React Native kits
  { name: "rn-reusables", test: (has, hasPrefix) => hasPrefix("@rn-primitives/") },
  { name: "gluestack", test: (has, hasPrefix) => hasPrefix("@gluestack-ui/"), versionFrom: ["@gluestack-ui/core", "@gluestack-ui/themed"] },
  { name: "tamagui", test: (has) => has("tamagui") || has("@tamagui/core"), versionFrom: ["tamagui", "@tamagui/core"] },
  { name: "react-native-paper", test: (has) => has("react-native-paper"), versionFrom: ["react-native-paper"] },
  { name: "joy", test: (has) => has("@mui/joy"), versionFrom: ["@mui/joy"] }, // on hold upstream: build with Material UI patterns
  { name: "daisyui", test: (has) => has("daisyui"), versionFrom: ["daisyui"] },
  { name: "antd", test: (has) => has("antd"), versionFrom: ["antd"] },
  { name: "primevue", test: (has) => has("primevue"), versionFrom: ["primevue"] },
  { name: "primeng", test: (has) => has("primeng"), versionFrom: ["primeng"] },
  { name: "primereact", test: (has) => has("primereact"), versionFrom: ["primereact"] },
  { name: "angular-material", test: (has) => has("@angular/material"), versionFrom: ["@angular/material"] },
  { name: "chakra", test: (has) => has("@chakra-ui/react"), versionFrom: ["@chakra-ui/react"] },
  { name: "mantine", test: (has) => has("@mantine/core"), versionFrom: ["@mantine/core"] },
  { name: "vuetify", test: (has) => has("vuetify"), versionFrom: ["vuetify"] },
  { name: "nuxt-ui", test: (has) => has("@nuxt/ui"), versionFrom: ["@nuxt/ui"] },
  // NextUI was renamed HeroUI; v2 is a Tailwind plugin (@heroui/theme), v3 is CSS-first (@heroui/styles)
  { name: "heroui", test: (has, hasPrefix) => hasPrefix("@heroui/") || has("@nextui-org/react"), versionFrom: ["@heroui/react", "@heroui/styles", "@heroui/theme", "@nextui-org/react"] },
  { name: "skeleton", test: (has, hasPrefix) => hasPrefix("@skeletonlabs/skeleton"), versionFrom: ["@skeletonlabs/skeleton"] },
  { name: "flowbite", test: (has, hasPrefix) => hasPrefix("flowbite"), versionFrom: ["flowbite"] },
  { name: "preline", test: (has) => has("preline"), versionFrom: ["preline"] },
  { name: "fluent", test: (has) => has("@fluentui/react-components"), versionFrom: ["@fluentui/react-components"] },
  { name: "carbon", test: (has, hasPrefix) => hasPrefix("@carbon/react") || has("@carbon/styles") || has("@carbon/web-components"), versionFrom: ["@carbon/react", "@carbon/styles", "@carbon/web-components"] },
  // unstyled libraries last: a styled kit above may depend on them
  { name: "radix", test: (has, hasPrefix) => hasPrefix("@radix-ui/") },
  { name: "headlessui", test: (has, hasPrefix) => hasPrefix("@headlessui/") },
];

/**
 * shadcn/ui and its ports share components.json. Its style prefix names the primitive base
 * (radix-*, base-*, aria-*; the older default/new-york styles are Radix), which decides the
 * data attributes that animate; tailwind.css is the file the theme goes into.
 */
function shadcnProfile(config, has) {
  const style = typeof config?.style === "string" ? config.style : null;
  const prefix = style?.match(/^(radix|base|aria)-/)?.[1];
  const port = has("@spartan-ng/brain") || has("@spartan-ng/cli") ? "spartan"
    : has("bits-ui") || has("svelte") ? "shadcn-svelte"
    : has("reka-ui") || has("radix-vue") || has("vue") ? "shadcn-vue"
    : "shadcn";
  return { base: prefix || "radix", style, css: config?.tailwind?.css || null, port };
}

export function detectStack(rootArg = ".") {
  const root = resolve(rootArg);
  const pkg = readJson(join(root, "package.json"));
  const deps = { ...(pkg?.peerDependencies || {}), ...(pkg?.devDependencies || {}), ...(pkg?.dependencies || {}) };
  const has = (n) => Object.prototype.hasOwnProperty.call(deps, n);
  const hasPrefix = (p) => Object.keys(deps).some((d) => d.startsWith(p));
  const dir = (...p) => isDir(join(root, ...p));
  const file = (...p) => isFile(join(root, ...p));

  // ---- framework (most specific first)
  const FW = [
    ["nuxt", "nuxt"], ["next", "next"], ["sveltekit", "@sveltejs/kit"], ["astro", "astro"],
    ["angular", "@angular/core"], ["solid", "solid-js"], ["vue", "vue"], ["svelte", "svelte"],
    ["expo", "expo"], ["react-native", "react-native"], ["react", "react"],
  ];
  let framework = "unknown", frameworkVersion = null;
  for (const [name, dep] of FW) {
    if (has(dep)) { framework = name; frameworkVersion = cleanVersion(deps[dep]); break; }
  }
  if (!pkg && framework === "unknown" && (file("index.html") || file("public", "index.html"))) framework = "html";
  const isNative = framework === "expo" || framework === "react-native";

  // ---- files (bounded walk for design files / css flavours)
  const files = walk(root, root, { maxDepth: 6, maxFiles: 5000,
    exts: new Set([".css", ".scss", ".sass", ".less", ".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx", ".json", ".vue", ".svelte", ".astro"]) });

  // ---- router
  let router = null;
  if (framework === "next") router = dir("app") || dir("src", "app") ? "app" : dir("pages") || dir("src", "pages") ? "pages" : null;
  else if (framework === "sveltekit") router = "sveltekit";
  else if (has("expo-router")) router = "expo-router";
  else if (framework === "nuxt" || has("vue-router")) router = "vue-router";
  else if (has("react-router") || has("react-router-dom")) router = "react-router";

  // ---- styling
  let tailwind = null;
  const twMajor = major(deps.tailwindcss);
  const cssFiles = files.filter((f) => /\.(css|scss)$/.test(f));
  const importsTw4 = () => cssFiles.some((f) => /@import\s+["']tailwindcss["']/.test(readText(join(root, f)) || ""));
  if ((twMajor && twMajor >= 4) || has("@tailwindcss/postcss") || has("@tailwindcss/vite") || importsTw4()) tailwind = "v4";
  else if (twMajor || files.some((f) => /^tailwind\.config\./.test(f))) tailwind = "v3";
  const cssInJs = has("@emotion/react") || has("@emotion/styled") ? "emotion" : has("styled-components") ? "styled-components" : null;
  const styling = {
    tailwind,
    cssModules: files.some((f) => /\.module\.(css|scss|sass|less)$/.test(f)),
    sass: has("sass") || has("node-sass") || files.some((f) => /\.(scss|sass)$/.test(f)),
    panda: has("@pandacss/dev") || files.some((f) => /^panda\.config\.(ts|js|mjs|cjs)$/.test(f)),
    unocss: has("unocss") || hasPrefix("@unocss/") || files.some((f) => /^uno\.config\.(ts|js|mjs|cjs|mts)$/.test(f)),
    stylex: has("@stylexjs/stylex"),
    vanillaExtract: has("@vanilla-extract/css"),
    cssInJs,
  };

  // ---- components
  // react-native-reusables also writes a components.json; on native it is that kit, not shadcn/ui
  const shadcnWeb = file("components.json") && !isNative;
  const kit = shadcnWeb ? { name: "shadcn" } : KITS.find((k) => k.test(has, hasPrefix));
  const components = kit?.name ?? null;
  const versionFrom = kit?.versionFrom?.find(has);
  const componentsVersion = versionFrom ? major(deps[versionFrom]) : null;

  // ---- unstyled primitives (no theme to emit; each animates through its own state attributes)
  const primitives = PRIMITIVES.filter(([, test]) => test(has, hasPrefix)).map(([name]) => name);

  const shadcn = shadcnWeb ? shadcnProfile(readJson(join(root, "components.json")), has) : null;

  // ---- animation and interaction libraries (recipes map our motion tokens onto each one's timing options)
  const depNames = Object.keys(deps);
  const found = (list) => list.filter(([, test]) => test(has, hasPrefix, depNames)).map(([name]) => name);
  const animation = found(ANIMATION);
  const interaction = found(INTERACTION);
  const charts = found(CHARTS);
  const [formLib = null] = found(FORM_LIBS), [schema = null] = found(SCHEMAS);
  const forms = formLib || schema ? { lib: formLib, schema } : null;
  const [tables = null] = found(TABLES);

  // ---- React Native: no DOM; the styling layer decides the token format
  const nativeStyling = has("uniwind") ? "uniwind"
    : has("nativewind") ? (major(deps.nativewind) >= 5 ? "nativewind-v5" : "nativewind")
    : has("tamagui") || has("@tamagui/core") ? "tamagui"
    : has("react-native-unistyles") ? "unistyles"
    : "stylesheet";
  const native = isNative ? { styling: nativeStyling, web: has("react-native-web") } : null;

  // ---- view transitions: which integration the route and shared-element recipes should use
  const viewTransitions = isNative ? null
    : has("react") && atLeast(deps.react, [19, 3]) ? "react" // <ViewTransition>, stable in 19.3
    : framework === "astro" ? "astro" // <ClientRouter />
    : framework === "sveltekit" ? "sveltekit" // onNavigate + document.startViewTransition
    : "native";

  // ---- fonts: loaders already in use, and the one the fonts emitter should target
  const readsGoogleFonts = (rel) => /fonts\.googleapis\.com/.test(readText(join(root, rel)) || "");
  const fontsInUse = [];
  if (has("next") && files.some((f) => /\.(t|j)sx?$/.test(f) && /from\s+["']next\/font\//.test(readText(join(root, f)) || ""))) fontsInUse.push("next-font");
  if (has("@nuxt/fonts")) fontsInUse.push("nuxt-fonts");
  if (hasPrefix("@fontsource/") || hasPrefix("@fontsource-variable/")) fontsInUse.push("fontsource");
  if (has("unplugin-fonts")) fontsInUse.push("unplugin-fonts");
  if (["index.html", "public/index.html", "src/app.html"].some((f) => file(f) && readsGoogleFonts(f)) || cssFiles.some(readsGoogleFonts)) fontsInUse.push("google-fonts");
  const fontLoader = isNative ? null // expo-font / useFonts: system.md step 4
    : framework === "next" ? "next" : framework === "nuxt" ? "nuxt"
    : pkg && framework !== "unknown" && framework !== "html" ? "fontsource" : "google";

  // ---- icons: the first set found, the package to import from, and how its weight is set
  const iconSet = ICONS.find(([, match]) => depNames.some(match));
  const icons = iconSet ? { lib: iconSet[0], package: depNames.find(iconSet[1]), api: iconSet[2] } : null;

  // ---- token build pipeline: when one owns the CSS, build edits its token sources, not the output
  const configFile = (re) => files.find((f) => re.test(f)) ?? null;
  const terrazzoConfig = configFile(/^terrazzo\.config\.(ts|mts|js|mjs|cjs)$/);
  const sdConfig = configFile(/^(sd|style-dictionary)\.config\.(ts|mts|js|mjs|cjs|json)$/) ?? (has("style-dictionary") ? configFile(/^config\.json$/) : null);
  const tokensPipeline = has("@terrazzo/cli") || terrazzoConfig ? { tool: "terrazzo", config: terrazzoConfig }
    : has("style-dictionary") || sdConfig ? { tool: "style-dictionary", config: sdConfig }
    : null;

  // ---- package manager
  let packageManager = null;
  if (file("pnpm-lock.yaml")) packageManager = "pnpm";
  else if (file("bun.lockb") || file("bun.lock")) packageManager = "bun";
  else if (file("yarn.lock")) packageManager = "yarn";
  else if (file("package-lock.json")) packageManager = "npm";
  else if (typeof pkg?.packageManager === "string") packageManager = pkg.packageManager.split("@")[0];
  else if (pkg) packageManager = "npm";

  const scripts = pkg?.scripts || {};
  const devScript = ["dev", "start", "serve"].find((s) => scripts[s]) || null;

  const designFiles = files.filter(isDesignFile).filter((f) => f !== "package.json" && !f.endsWith("components.json"));

  return {
    root: rootArg,
    framework,
    frameworkVersion,
    router,
    styling,
    components,
    componentsVersion,
    shadcn,
    primitives,
    animation,
    interaction,
    charts,
    forms,
    tables,
    viewTransitions,
    native,
    fonts: { loader: fontLoader, inUse: fontsInUse },
    icons,
    tokensPipeline,
    typescript: has("typescript") || file("tsconfig.json"),
    packageManager,
    devScript,
    testing: {
      playwright: has("@playwright/test") || has("playwright") || resolvable(root, "playwright") || resolvable(root, "@playwright/test"),
      axe: has("@axe-core/playwright") || resolvable(root, "@axe-core/playwright"),
    },
    designFiles,
    existingDesign: exists(join(root, ".design")),
  };
}

if (isMain(import.meta.url)) {
  runCli({ help: HELP, spec: { string: ["root"] }, main: ({ flags }) => detectStack(flags.root || ".") });
}
