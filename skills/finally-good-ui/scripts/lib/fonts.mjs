// Loader code for the typefaces a token set names ($extensions.fgu.load on font tokens), per stack.
// load: { source: "google" | "fontsource" | "local", weights: "100 900" (variable) | [400, 600],
//         files?: [{ path, weight, style? }] (local) }
import { capitalize as capital } from "./names.mjs";
import { groupTokens, fontLoad, isVariableFont, baseFace, namedVariable, weightRange } from "./tokens.mjs";

export const LOADERS = ["next", "nuxt", "fontsource", "google"];

const slug = (family) => family.toLowerCase().replace(/\s+/g, "-");
const weightList = (load) => (isVariableFont(load) ? null : (load.weights ?? [400]).map(Number));

/** [{name, family, load}] for every font token that names a face to load. A family written the Fontsource way
 *  ("Figtree Variable") is the family "Figtree" loaded as a variable font. */
function loadedFaces(tokens) {
  return [...groupTokens(tokens?.font)].filter(([, tok]) => fontLoad(tok)).map(([name, tok]) => {
    const written = Array.isArray(tok.$value) ? tok.$value[0] : tok.$value;
    const load = fontLoad(tok);
    return { name, family: baseFace(written), load: namedVariable(written) && !isVariableFont(load) ? { ...load, variable: true } : load };
  });
}

const fontFace = (family, file) =>
  `@font-face { font-family: "${family}"; src: url("/${file.path.replace(/^\.?\//, "")}") format("woff2"); ` +
  `font-weight: ${file.weight ?? 400}; font-style: ${file.style ?? "normal"}; font-display: swap; }`;

function next(faces) {
  const google = faces.filter((f) => f.load.source !== "local");
  const local = faces.filter((f) => f.load.source === "local");
  const lines = ["// app/fonts.ts"];
  if (google.length) lines.push(`import { ${google.map((f) => f.family.replace(/\s+/g, "_")).join(", ")} } from "next/font/google";`);
  if (local.length) lines.push('import localFont from "next/font/local";');
  lines.push("");
  for (const f of faces) {
    const variable = `variable: "--font-${f.name}-loaded"`;
    const id = `font${capital(f.name)}`;
    if (f.load.source === "local") {
      const src = (f.load.files ?? []).map((file) =>
        `{ path: "./${file.path.replace(/^\.?\//, "")}", weight: "${file.weight ?? 400}", style: "${file.style ?? "normal"}" }`);
      lines.push(`export const ${id} = localFont({ src: [${src.join(", ")}], display: "swap", ${variable} });`);
    } else {
      const weights = weightList(f.load);
      const weight = weights ? `, weight: [${weights.map((w) => `"${w}"`).join(", ")}]` : "";
      lines.push(`export const ${id} = ${f.family.replace(/\s+/g, "_")}({ subsets: ["latin"], display: "swap"${weight}, ${variable} });`);
    }
  }
  const classes = faces.map((f) => `\${font${capital(f.name)}.variable}`).join(" ");
  lines.push("", "// app/layout.tsx: put every font's variable on <html>; the token CSS picks them up",
    `// <html lang="en" className={\`${classes}\`}>`);
  return lines.join("\n");
}

function nuxt(faces) {
  const entry = (f) => {
    if (f.load.source === "local") {
      return (f.load.files ?? []).map((file) =>
        `      { name: "${f.family}", src: "/${file.path.replace(/^\.?\//, "")}", weight: "${file.weight ?? 400}", global: true },`).join("\n");
    }
    const weights = weightList(f.load);
    return `      { name: "${f.family}", provider: "${f.load.source}", weights: ${weights ? `[${weights.join(", ")}]` : `["${weightRange(f.load).replace("..", " ")}"]`}, global: true },`;
  };
  return ["// nuxt.config.ts (local files live in public/)", "export default defineNuxtConfig({",
    '  modules: ["@nuxt/fonts"],', "  fonts: {", "    families: [", ...faces.map(entry), "    ],", "  },", "});"].join("\n");
}

function fontsource(faces) {
  const remote = faces.filter((f) => f.load.source !== "local");
  const pkg = (f) => (isVariableFont(f.load) ? `@fontsource-variable/${slug(f.family)}` : `@fontsource/${slug(f.family)}`);
  const lines = [];
  if (remote.length) {
    lines.push(`# npm install ${remote.map(pkg).join(" ")}`, "", "// the app's entry file (main.ts, +layout.svelte, the root layout)");
    for (const f of remote) {
      if (isVariableFont(f.load)) lines.push(`import "${pkg(f)}";`);
      else for (const w of weightList(f.load)) lines.push(`import "${pkg(f)}/${w}.css";`);
    }
  }
  const local = faces.filter((f) => f.load.source === "local");
  if (local.length) lines.push("", "/* global CSS (files under public/) */", ...local.flatMap((f) => (f.load.files ?? []).map((file) => fontFace(f.family, file))));
  return lines.join("\n");
}

function google(faces) {
  const remote = faces.filter((f) => f.load.source !== "local");
  const family = (f) => {
    const weights = weightList(f.load);
    const axis = weights ? weights.join(";") : weightRange(f.load);
    return `family=${f.family.replace(/\s+/g, "+")}:wght@${axis}`;
  };
  const lines = [];
  if (remote.length) {
    lines.push("<!-- <head>: Google serves these; self-host with --loader fontsource when the app has a bundler -->",
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${remote.map(family).join("&")}&display=swap">`);
  }
  const local = faces.filter((f) => f.load.source === "local");
  if (local.length) lines.push("", "<style>", ...local.flatMap((f) => (f.load.files ?? []).map((file) => fontFace(f.family, file))), "</style>");
  return lines.join("\n");
}

const WRITERS = { next, nuxt, fontsource, google };

/** Loader code for `loader` (one of LOADERS). */
export function emitFonts(tokens, loader = "google") {
  const faces = loadedFaces(tokens);
  const head = `/* generated by finally-good-ui emit-tokens.mjs (--format fonts --loader ${loader}) */\n`;
  if (!faces.length) return head + "/* nothing to load: every font token is a system stack (add $extensions.fgu.load to load a face) */\n";
  return head + WRITERS[loader](faces) + "\n";
}
