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
interaction (toasts, drawers, command menus, positioning, drag and drop, carousels, virtual lists) and icon libraries, TypeScript, package manager, dev script,
testing tools, design files and whether .design/ exists. Prints the stack profile as JSON.

Options:
  --root <dir>   project root (default: cwd)
  --help         show this help
`;

const cleanVersion = (v) => (typeof v === "string" ? (v.match(/\d+(\.\d+){0,2}/) || [null])[0] : null);
const major = (v) => { const c = cleanVersion(v); return c ? parseInt(c, 10) : null; };

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
    ["angular", "@angular/core"], ["solid", "solid-js"], ["vue", "vue"], ["svelte", "svelte"], ["react", "react"],
  ];
  let framework = "unknown", frameworkVersion = null;
  for (const [name, dep] of FW) {
    if (has(dep)) { framework = name; frameworkVersion = cleanVersion(deps[dep]); break; }
  }
  if (!pkg && framework === "unknown" && (file("index.html") || file("public", "index.html"))) framework = "html";

  // ---- files (bounded walk for design files / css flavours)
  const files = walk(root, root, { maxDepth: 6, maxFiles: 5000,
    exts: new Set([".css", ".scss", ".sass", ".less", ".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx", ".json", ".vue", ".svelte", ".astro"]) });

  // ---- router
  let router = null;
  if (framework === "next") router = dir("app") || dir("src", "app") ? "app" : dir("pages") || dir("src", "pages") ? "pages" : null;
  else if (framework === "sveltekit") router = "sveltekit";
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
  const kit = file("components.json") ? { name: "shadcn" } : KITS.find((k) => k.test(has, hasPrefix));
  const components = kit?.name ?? null;
  const versionFrom = kit?.versionFrom?.find(has);
  const componentsVersion = versionFrom ? major(deps[versionFrom]) : null;

  // ---- unstyled primitives (no theme to emit; each animates through its own state attributes)
  const primitives = PRIMITIVES.filter(([, test]) => test(has, hasPrefix)).map(([name]) => name);

  const shadcn = file("components.json") ? shadcnProfile(readJson(join(root, "components.json")), has) : null;

  // ---- animation and interaction libraries (recipes map our motion tokens onto each one's timing options)
  const depNames = Object.keys(deps);
  const found = (list) => list.filter(([, test]) => test(has, hasPrefix, depNames)).map(([name]) => name);
  const animation = found(ANIMATION);
  const interaction = found(INTERACTION);

  // ---- icons
  let icons = null;
  if (has("lucide-react")) icons = "lucide-react";
  else if (hasPrefix("lucide")) icons = Object.keys(deps).find((d) => d.startsWith("lucide"));
  else if (hasPrefix("@heroicons/")) icons = "heroicons";
  else if (hasPrefix("@phosphor-icons/") || has("phosphor-react")) icons = "phosphor";
  else if (hasPrefix("@tabler/icons")) icons = "tabler";
  else if (has("react-icons")) icons = "react-icons";

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
    icons,
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
