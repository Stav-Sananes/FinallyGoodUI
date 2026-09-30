#!/usr/bin/env node
// Build the stack profile (spec §5.4) from package.json, lockfiles and project files.
import { join, basename, resolve } from "node:path";
import { runCli, isMain } from "./lib/cli.mjs";
import { readJson, readText, walk, isDir, isFile, exists } from "./lib/fs.mjs";

const HELP = `
Usage: detect-stack.mjs [--root <dir>]

Detects framework, router, styling (Tailwind v3/v4, CSS modules, Sass, CSS-in-JS),
component kit, animation and icon libraries, TypeScript, package manager, dev script,
testing tools, design files and whether .design/ exists. Prints the §5.4 profile as JSON.

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
    /^theme\.(ts|tsx|js|jsx|mjs|cjs|css|scss|json)$/.test(b) || /\.tokens\.json$/.test(b);
};

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
    cssInJs,
  };

  // ---- components
  let components = null;
  if (file("components.json")) components = "shadcn";
  else if (has("@mui/material") || has("@mui/joy")) components = "mui";
  else if (has("@chakra-ui/react")) components = "chakra";
  else if (has("@mantine/core")) components = "mantine";
  else if (hasPrefix("@radix-ui/")) components = "radix";
  else if (hasPrefix("@headlessui/")) components = "headlessui";

  // ---- animation
  const animation = [];
  const add = (x) => { if (!animation.includes(x)) animation.push(x); };
  if (has("motion") || has("framer-motion") || has("motion-v") || has("@vueuse/motion")) add("motion");
  if (has("gsap")) add("gsap");
  if (hasPrefix("@react-spring/") || has("react-spring")) add("react-spring");
  if (has("@formkit/auto-animate")) add("auto-animate");
  if (has("lottie-web") || has("lottie-react") || hasPrefix("@lottiefiles/")) add("lottie");

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
    animation,
    icons,
    typescript: has("typescript") || file("tsconfig.json"),
    packageManager,
    devScript,
    testing: { playwright: has("@playwright/test") || has("playwright"), axe: has("@axe-core/playwright") },
    designFiles,
    existingDesign: exists(join(root, ".design")),
  };
}

if (isMain(import.meta.url)) {
  runCli({ help: HELP, spec: { string: ["root"] }, main: ({ flags }) => detectStack(flags.root || ".") });
}
