import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, fx, tmp } from "./_h.mjs";

const detect = (dir) => {
  const r = run("detect-stack.mjs", ["--root", dir]);
  assert.equal(r.code, 0, r.stderr);
  return r.json;
};

test("next + tailwind v4 + shadcn", () => {
  const p = detect(fx("next"));
  assert.equal(p.framework, "next");
  assert.equal(p.frameworkVersion, "15.1.0");
  assert.equal(p.router, "app");
  assert.equal(p.styling.tailwind, "v4");
  assert.equal(p.components, "shadcn");
  assert.deepEqual(p.animation, ["motion"]);
  assert.deepEqual(p.icons, { lib: "lucide", package: "lucide-react", api: "stroke" });
  assert.equal(p.typescript, true);
  assert.equal(p.packageManager, "pnpm");
  assert.equal(p.devScript, "dev");
  assert.deepEqual(p.testing, { playwright: true, axe: false });
  assert.ok(p.designFiles.includes("src/app/globals.css"));
  assert.equal(p.existingDesign, false);
});

test("vite + react + tailwind v3", () => {
  const p = detect(fx("vite"));
  assert.equal(p.framework, "react");
  assert.equal(p.frameworkVersion, "18.3.1");
  assert.equal(p.router, "react-router");
  assert.equal(p.styling.tailwind, "v3");
  assert.equal(p.styling.sass, true);
  assert.equal(p.styling.cssModules, true);
  assert.equal(p.components, "headlessui");
  assert.deepEqual(p.animation, ["motion"]); // framer-motion -> motion
  assert.equal(p.icons.lib, "heroicons");
  assert.equal(p.icons.api, "fixed-grid");
  assert.equal(p.typescript, false);
  assert.equal(p.packageManager, "yarn");
  assert.equal(p.devScript, "start");
  assert.ok(p.designFiles.includes("tailwind.config.js"));
  assert.ok(p.designFiles.includes("src/index.css"));
});

test("vue + css", () => {
  const p = detect(fx("vue"));
  assert.equal(p.framework, "vue");
  assert.equal(p.router, "vue-router");
  assert.equal(p.styling.tailwind, null);
  assert.deepEqual(p.animation, ["gsap"]);
  assert.equal(p.icons.lib, "tabler");
  assert.equal(p.packageManager, "npm");
  assert.equal(p.devScript, "serve");
  assert.ok(p.designFiles.includes("src/assets/main.css"));
});

test("plain html", () => {
  const p = detect(fx("html"));
  assert.equal(p.framework, "html");
  assert.equal(p.packageManager, null);
  assert.equal(p.devScript, null);
  assert.ok(p.designFiles.includes("styles.css"));
});

test("mui + many animation libs + axe", () => {
  const p = detect(fx("mui"));
  assert.equal(p.framework, "react");
  assert.equal(p.components, "mui");
  assert.equal(p.styling.cssInJs, "emotion");
  assert.deepEqual([...p.animation].sort(), ["auto-animate", "gsap", "lottie", "react-spring"]);
  assert.equal(p.icons.lib, "phosphor");
  assert.equal(p.icons.api, "weight");
  assert.equal(p.packageManager, "bun");
  assert.deepEqual(p.testing, { playwright: true, axe: true });
  assert.ok(p.designFiles.includes("src/theme.ts"));
});

test("empty dir is unknown; .design and @import tailwindcss detected", () => {
  const d = tmp();
  assert.equal(detect(d).framework, "unknown");
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "@sveltejs/kit": "^2.0.0", svelte: "^5.0.0" } }));
  mkdirSync(join(d, ".design"));
  mkdirSync(join(d, "src"));
  writeFileSync(join(d, "src", "app.css"), '@import "tailwindcss";\n');
  writeFileSync(join(d, "brand.tokens.json"), "{}");
  const p = detect(d);
  assert.equal(p.framework, "sveltekit");
  assert.equal(p.router, "sveltekit");
  assert.equal(p.styling.tailwind, "v4");
  assert.equal(p.existingDesign, true);
  assert.ok(p.designFiles.includes("brand.tokens.json"));
});

test("next pages router", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { next: "^14.2.3" } }));
  mkdirSync(join(d, "pages"));
  const p = detect(d);
  assert.equal(p.router, "pages");
  assert.equal(p.frameworkVersion, "14.2.3");
});

test("testing tools installed in a parent node_modules are detected (Node resolution walks up)", () => {
  const parent = tmp();
  for (const p of ["playwright", "@axe-core/playwright"]) {
    mkdirSync(join(parent, "node_modules", p), { recursive: true });
    writeFileSync(join(parent, "node_modules", p, "package.json"), JSON.stringify({ name: p, version: "1.0.0" }));
  }
  const app = join(parent, "apps", "shop");
  mkdirSync(app, { recursive: true });
  writeFileSync(join(app, "index.html"), "<!doctype html>");
  assert.deepEqual(detect(app).testing, { playwright: true, axe: true });
  // negative control: same layout without the installed packages
  const bare = join(tmp(), "apps", "shop");
  mkdirSync(bare, { recursive: true });
  writeFileSync(join(bare, "index.html"), "<!doctype html>");
  assert.deepEqual(detect(bare).testing, { playwright: false, axe: false });
});

test("token and variable stylesheets count as design files", () => {
  const d = tmp();
  writeFileSync(join(d, "index.html"), "<!doctype html>");
  mkdirSync(join(d, "src", "styles"), { recursive: true });
  for (const f of ["tokens.css", "design-tokens.css", "_variables.scss", "vars.css", "colors.css", "theme.less", "button.css"])
    writeFileSync(join(d, "src", "styles", f), ":root{}");
  const files = detect(d).designFiles;
  for (const f of ["tokens.css", "design-tokens.css", "_variables.scss", "vars.css", "colors.css", "theme.less"])
    assert.ok(files.includes(`src/styles/${f}`), f);
  assert.ok(!files.includes("src/styles/button.css"), "component stylesheet is not a design file");
});

// shadcn now ships on three primitive bases; the base decides which data attributes animate.
test("shadcn: base from the components.json style prefix, css entry, port by framework", () => {
  assert.deepEqual(detect(fx("next")).shadcn, { base: "radix", style: "new-york", css: "src/app/globals.css", port: "shadcn" });
  const project = (style, deps) => {
    const d = tmp();
    writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps }));
    writeFileSync(join(d, "components.json"), JSON.stringify({ style, tailwind: { css: "app/globals.css" } }));
    return detect(d).shadcn;
  };
  assert.equal(project("base-vega", { react: "19.2.0", "@base-ui/react": "1.9.0" }).base, "base");
  assert.equal(project("aria-luma", { react: "19.2.0" }).base, "aria");
  assert.equal(project("radix-nova", { react: "19.2.0" }).base, "radix");
  assert.equal(project("new-york", { vue: "3.5.0", "reka-ui": "2.0.0" }).port, "shadcn-vue");
  assert.equal(project("default", { svelte: "5.0.0", "bits-ui": "2.0.0" }).port, "shadcn-svelte");
  const none = tmp();
  writeFileSync(join(none, "package.json"), JSON.stringify({ dependencies: { react: "19.2.0" } }));
  assert.equal(detect(none).shadcn, null);
});

// Unstyled primitive libraries: no theme to emit, but each animates through different attributes.
test("primitives: every headless library found, alongside any styled kit", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: {
    react: "19.2.0", "@base-ui/react": "1.9.0", "react-aria-components": "1.22.1", "@radix-ui/react-dialog": "1.3.1",
    "@ark-ui/react": "5.40.0", "@ui-sdk/core": "0.1.0-beta.2", "@ui-sdk/react": "0.1.0-beta.2",
  } }));
  assert.deepEqual(detect(d).primitives, ["radix", "base-ui", "react-aria", "ark", "ui-sdk"]);
  const v = tmp();
  writeFileSync(join(v, "package.json"), JSON.stringify({ dependencies: { vue: "3.5.0", "reka-ui": "2.11.0" } }));
  assert.deepEqual(detect(v).primitives, ["reka"]);
  const s = tmp();
  writeFileSync(join(s, "package.json"), JSON.stringify({ dependencies: { svelte: "5.0.0", "bits-ui": "2.21.0", "@kobalte/core": "0.13.14" } }));
  assert.deepEqual(detect(s).primitives, ["bits", "kobalte"]);
  assert.deepEqual(detect(fx("vue")).primitives, []);
});

test("component kit major version; Joy UI (on hold) is no longer reported as Material UI", () => {
  assert.equal(detect(fx("mui")).componentsVersion, 6);
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { react: "19.2.0", "@mui/joy": "5.0.0-beta.52" } }));
  const p = detect(d);
  assert.equal(p.components, "joy");
  assert.equal(p.componentsVersion, 5);
});

test("daisyUI detected as the component kit, with its major version", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ devDependencies: { tailwindcss: "4.3.0", daisyui: "5.8.0" } }));
  const p = detect(d);
  assert.equal(p.components, "daisyui");
  assert.equal(p.componentsVersion, 5);
});

test("Panda CSS detected as a styling engine", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ devDependencies: { "@pandacss/dev": "2.0.0" } }));
  assert.equal(detect(d).styling.panda, true);
  assert.equal(detect(fx("next")).styling.panda, false);
});

test("Ant Design detected as the component kit", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { react: "19.2.0", antd: "6.7.0" } }));
  const p = detect(d);
  assert.equal(p.components, "antd");
  assert.equal(p.componentsVersion, 6);
});

test("Prime kits detected per framework", () => {
  const kit = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); return detect(d); };
  assert.equal(kit({ vue: "3.5.0", primevue: "5.0.5", "@primeuix/themes": "3.1.1" }).components, "primevue");
  assert.equal(kit({ "@angular/core": "21.0.0", primeng: "22.1.5" }).components, "primeng");
  const react = kit({ react: "19.2.0", primereact: "11.2.3" });
  assert.equal(react.components, "primereact");
  assert.equal(react.componentsVersion, 11);
});

test("Angular Material detected; legacy @angular/animations flagged (deprecated, use animate.enter/leave)", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: { "@angular/core": "22.2.0", "@angular/material": "22.2.7", "@angular/animations": "22.2.0" } }));
  const p = detect(d);
  assert.equal(p.framework, "angular");
  assert.equal(p.components, "angular-material");
  assert.equal(p.componentsVersion, 22);
  assert.ok(p.animation.includes("angular-animations-legacy"));
});

test("long-tail component kits detected, each with the major version of its own package", () => {
  const kit = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); return detect(d); };
  const cases = [
    [{ vue: "3.5.0", vuetify: "4.3.3" }, "vuetify", 4],
    [{ nuxt: "4.2.0", "@nuxt/ui": "4.12.0" }, "nuxt-ui", 4],
    [{ react: "19.2.0", "@heroui/react": "3.2.7", "@heroui/styles": "3.2.7" }, "heroui", 3],
    [{ react: "18.3.0", "@nextui-org/react": "2.6.11" }, "heroui", 2],
    [{ svelte: "5.0.0", "@skeletonlabs/skeleton": "5.0.4" }, "skeleton", 5],
    [{ "flowbite-react": "0.12.17", flowbite: "4.0.2" }, "flowbite", 4],
    [{ preline: "5.1.0" }, "preline", 5],
    [{ react: "19.2.0", "@fluentui/react-components": "9.75.2" }, "fluent", 9],
    [{ react: "19.2.0", "@carbon/react": "1.120.0" }, "carbon", 1],
  ];
  for (const [deps, name, version] of cases) {
    const p = kit(deps);
    assert.equal(p.components, name, JSON.stringify(deps));
    assert.equal(p.componentsVersion, version, name);
  }
  assert.equal(kit({ react: "19.2.0", "flowbite-react": "0.12.17" }).componentsVersion, null, "a port's own version is not Flowbite's");
});

test("compile-time styling engines detected: UnoCSS (package or uno.config), StyleX, vanilla-extract", () => {
  const engines = (deps, files = {}) => {
    const d = tmp();
    writeFileSync(join(d, "package.json"), JSON.stringify({ devDependencies: deps }));
    for (const [f, text] of Object.entries(files)) writeFileSync(join(d, f), text);
    return detect(d).styling;
  };
  assert.equal(engines({ unocss: "66.13.0" }).unocss, true);
  assert.equal(engines({ "@unocss/preset-wind4": "66.13.0" }).unocss, true);
  assert.equal(engines({}, { "uno.config.ts": "export default {}" }).unocss, true);
  assert.equal(engines({ "@stylexjs/stylex": "0.19.2" }).stylex, true);
  assert.equal(engines({ "@vanilla-extract/css": "1.21.3" }).vanillaExtract, true);
  const none = detect(fx("next")).styling;
  assert.deepEqual([none.unocss, none.stylex, none.vanillaExtract], [false, false, false]);
});

test("more motion libraries: anime.js, Rive, Lenis, Number Flow; dotLottie reported apart from Lottie", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: {
    animejs: "4.5.0", "@rive-app/react-canvas": "4.20.0", lenis: "1.3.0", "@number-flow/react": "0.5.10",
    "@lottiefiles/dotlottie-react": "0.15.0", "lottie-web": "5.13.0",
  } }));
  assert.deepEqual([...detect(d).animation].sort(), ["animejs", "dotlottie", "lenis", "lottie", "number-flow", "rive"]);
  const only = tmp();
  writeFileSync(join(only, "package.json"), JSON.stringify({ dependencies: { "@lottiefiles/dotlottie-web": "0.50.0", "number-flow": "0.5.8" } }));
  assert.deepEqual([...detect(only).animation].sort(), ["dotlottie", "number-flow"]);
});

test("interaction libraries reported in interaction[], one name per family; Vaul flagged as unmaintained", () => {
  const d = tmp();
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: {
    "vue-sonner": "2.0.0", "vaul-vue": "0.4.1", "cmdk-sv": "0.0.18", "@floating-ui/vue": "1.1.0",
    "@dnd-kit/core": "6.3.1", "@dnd-kit/react": "0.5.0", "@atlaskit/pragmatic-drag-and-drop": "1.7.0",
    vuedraggable: "4.1.0", "embla-carousel-vue": "8.6.0", "@tanstack/vue-virtual": "3.13.0",
    "react-day-picker": "10.0.2", "input-otp": "1.4.2", "react-resizable-panels": "3.0.0",
  } }));
  assert.deepEqual([...detect(d).interaction].sort(), [
    "cmdk", "dnd-kit", "dnd-kit-next", "embla", "floating-ui", "input-otp", "pragmatic-dnd",
    "react-day-picker", "react-resizable-panels", "sonner", "sortablejs", "tanstack-virtual", "vaul-unmaintained",
  ]);
  assert.deepEqual(detect(fx("next")).interaction, []);
});

test("viewTransitions names the integration the route recipes should use", () => {
  const vt = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); return detect(d).viewTransitions; };
  assert.equal(vt({ next: "16.1.0", react: "^19.3.1" }), "react");
  assert.equal(vt({ react: "19.2.4" }), "native", "<ViewTransition> ships stable in React 19.3");
  assert.equal(vt({ react: "20.0.0" }), "react");
  assert.equal(vt({ astro: "6.0.0" }), "astro");
  assert.equal(vt({ "@sveltejs/kit": "2.40.0", svelte: "5.0.0" }), "sveltekit");
  assert.equal(vt({ vue: "3.5.0" }), "native");
});

test("icon sets: the first one found, its package and how its weight is controlled", () => {
  const icons = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); return detect(d).icons; };
  assert.deepEqual(icons({ "lucide-vue-next": "1.0.0" }), { lib: "lucide", package: "lucide-vue-next", api: "stroke" });
  assert.deepEqual(icons({ "@lucide/svelte": "1.0.0" }), { lib: "lucide", package: "@lucide/svelte", api: "stroke" });
  assert.deepEqual(icons({ "@radix-ui/react-icons": "1.3.2" }), { lib: "radix-icons", package: "@radix-ui/react-icons", api: "fixed-grid" });
  assert.deepEqual(icons({ "@iconify/react": "6.0.4" }), { lib: "iconify", package: "@iconify/react", api: "em" });
  assert.deepEqual(icons({ "unplugin-icons": "24.0.0", "@iconify-json/mdi": "1.2.0" }), { lib: "unplugin-icons", package: "unplugin-icons", api: "em" });
  assert.deepEqual(icons({ "material-symbols": "0.49.0" }), { lib: "material-symbols", package: "material-symbols", api: "font-axes" });
  assert.deepEqual(icons({ "@remixicon/react": "4.9.0" }), { lib: "remix", package: "@remixicon/react", api: "fixed-grid" });
  assert.deepEqual(icons({ "@hugeicons/react": "1.1.10", "@hugeicons/core-free-icons": "4.4.0" }), { lib: "hugeicons", package: "@hugeicons/react", api: "stroke" });
  assert.deepEqual(icons({ "@solar-icons/react": "2.6.0" }), { lib: "solar", package: "@solar-icons/react", api: "stroke" });
  assert.equal(icons({}), null);
});
