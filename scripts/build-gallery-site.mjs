#!/usr/bin/env node
// Build the static gallery site into _site/ (served by GitHub Pages).
//
//   node scripts/build-gallery-site.mjs [--install] [--skip-apps] [--out <dir>]
//
//   --install     run `npm ci` in each app first (CI does this; locally node_modules is kept)
//   --skip-apps   do not rebuild the apps, reuse their existing dist/ (landing page + components only)
//   --out <dir>   output directory (default: _site at the repo root)
//
// Env GALLERY_BASE is the URL path the site is served under (default '/FinallyGoodUI/', must start
// and end with '/'). Vite and Svelte/Vue apps are built with a relative base ('./'), so they work
// under any path; the Angular app needs an absolute <base href>, which is BASE + 'tracker/'.
// Routing is hash- or query-based in all four apps, so no 404.html SPA fallback is needed.

import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { runCli, isMain } from "../skills/finally-good-ui/scripts/lib/cli.mjs";
import { emitCss } from "../skills/finally-good-ui/scripts/emit-tokens.mjs";
import { loadTokens } from "../skills/finally-good-ui/scripts/lib/token-files.mjs";
import { galleryComponents } from "../skills/finally-good-ui/scripts/lib/gallery.mjs";

const HELP = `
Usage: build-gallery-site.mjs [--install] [--skip-apps] [--out <dir>]

Builds the gallery site (landing page, the four apps, the component reference pages) into --out (default _site/).
  --install     npm ci in each app first
  --skip-apps   reuse each app's existing dist/
Env GALLERY_BASE: the URL path the site is served under (default /FinallyGoodUI/).`;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.GALLERY_BASE ?? "/FinallyGoodUI/";
if (!/^\/(.*\/)?$/.test(BASE)) throw new Error(`GALLERY_BASE must start and end with '/': ${BASE}`);
const REPO_URL = "https://github.com/Stav-Sananes/FinallyGoodUI";

const R5 = join(ROOT, "docs/gallery/r5");
const R4 = join(ROOT, "docs/gallery/r4");
const SKILL = join(ROOT, "skills/finally-good-ui");
const COMPONENTS = join(SKILL, "components");

// How each app is built: the Vite and Svelte/Vue apps take a relative base, Angular an absolute <base href>.
const VITE = { buildArgs: () => ["--base", "./"], outDir: "dist" };
const ANGULAR = { buildArgs: (base) => ["--base-href", `${base}tracker/`], outDir: "dist/tracker/browser" };
const APPS = [
  { id: "finance", ...VITE, name: "Saltmarsh & Rook", framework: "React 19 + Vite", direction: "Tide Table", pitch: "Studio finance: cash, runway, overdue invoices and payroll as a water level." },
  { id: "booking", ...VITE, name: "Tailwag Grooming", framework: "Svelte 5 + Vite", direction: "Appointment Card", pitch: "Salon booking: dog owners pick a time for a groom, on their phone." },
  { id: "tracker", ...ANGULAR, name: "Sorting Office", framework: "Angular 21", direction: "Sorting Office", pitch: "Issue tracker: a six-person team triages its list from the keyboard." },
  { id: "meals", ...VITE, name: "Supper Board", framework: "Vue 3 + Vite", direction: "Greengrocer's Board", pitch: "Meal planner: a household of three plans dinners and shops by aisle." },
];

const appDir = (app) => join(R5, "apps", app.id, "skill");

// ---------- apps ----------

/** Runs a command and prefixes each output line with the app's id, so four parallel builds stay readable. */
function runPrefixed(prefix, cmd, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    for (const stream of [child.stdout, child.stderr]) createInterface({ input: stream }).on("line", (line) => console.log(`[${prefix}] ${line}`));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolveRun() : reject(new Error(`${prefix}: ${cmd} ${args.join(" ")} exited with ${code}`))));
  });
}

async function buildApp(app, install) {
  const dir = appDir(app);
  if (install) await runPrefixed(app.id, "npm", ["ci"], dir);
  await runPrefixed(app.id, "npm", ["run", "build", "--", ...app.buildArgs(BASE)], dir);
}

function builtDir(app) {
  const dir = join(appDir(app), app.outDir);
  if (!existsSync(join(dir, "index.html"))) throw new Error(`no build output for ${app.id} at ${dir}`);
  return dir;
}

// ---------- components ----------

/** The components in INDEX.md order with their one-line descriptions; every component folder must have a line and the reverse. */
function componentList() {
  const lines = readFileSync(join(COMPONENTS, "INDEX.md"), "utf8").split("\n");
  const rows = lines.map((l) => l.match(/^- \[([a-z-]+)\]\([^)]*\) — (.+)$/)).filter(Boolean).map(([, name, description]) => ({ name, description }));
  if (rows.length === 0) throw new Error("components/INDEX.md: no component lines found");
  const folders = galleryComponents();
  const listed = rows.map((r) => r.name);
  const missing = [...folders.filter((n) => !listed.includes(n)), ...listed.filter((n) => !folders.includes(n))];
  if (missing.length) throw new Error(`components/INDEX.md and the component folders disagree on: ${missing.join(", ")}`);
  return rows;
}

const tokensCss = () => emitCss(loadTokens(join(SKILL, "tokens/default.tokens.json")));

// A reference page lives at components/<name>/reference/index.html and reaches ../<name>.css and
// ../<name>.js. Standalone, all four files sit side by side in _site/components/<name>/.
function copyComponent({ name }, tokens, out) {
  const dest = join(out, "components", name);
  mkdirSync(dest, { recursive: true });
  const html = readFileSync(join(COMPONENTS, name, "reference/index.html"), "utf8")
    .replaceAll(`"../${name}.css"`, `"${name}.css"`)
    .replaceAll(`"../${name}.js"`, `"./${name}.js"`);
  if (/"\.\.\//.test(html)) throw new Error(`${name}: reference page still has a ../ path`);
  const back = `<p style="position:fixed;inset-block-end:8px;inset-inline-start:8px;margin:0;font:13px system-ui,sans-serif"><a href="../../">&larr; Gallery</a></p>\n</body>`;
  writeFileSync(join(dest, "index.html"), html.replace("</body>", back));
  for (const ext of ["css", "js"]) cpSync(join(COMPONENTS, name, `${name}.${ext}`), join(dest, `${name}.${ext}`));
  writeFileSync(join(dest, "tokens.css"), tokens);
}

/** Copies one capture (<dir>/captures/<file>) into <out>/captures/<round>/. */
const copyCapture = (out, round, dir, file) => cpSync(join(dir, "captures", file), join(out, "captures", round, file));

// ---------- landing page ----------

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const inlineCode = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

function appCard(app) {
  const shot = (mode) => `<img class="shot shot-${mode}" src="captures/r5/${app.id}-desktop-${mode}.jpg" width="1440" height="900" loading="lazy" alt="${esc(app.name)}, first screen, ${mode} theme">`;
  return `<article class="card">
  <a class="shots" href="${app.id}/" tabindex="-1" aria-hidden="true">${shot("light")}${shot("dark")}</a>
  <div class="card-body">
    <h3>${esc(app.name)}</h3>
    <p class="meta"><span>${esc(app.framework)}</span><span>${esc(app.direction)}</span></p>
    <p>${esc(app.pitch)}</p>
    <p class="links"><a class="button" href="${app.id}/">Open app<span class="sr"> ${esc(app.name)}</span></a><a href="${REPO_URL}/tree/main/docs/gallery/r5/apps/${app.id}/skill">Source</a></p>
  </div>
</article>`;
}

function r4Pair(app) {
  const fig = (side, label) => `<figure><img src="captures/r4/${app.id}-${side}-desktop-light.jpg" width="1440" height="900" loading="lazy" alt="${esc(app.id)} app built ${label}, first screen"><figcaption>${label}</figcaption></figure>`;
  return `<div class="pair"><h3>${esc(app.id[0].toUpperCase() + app.id.slice(1))}</h3><div class="pair-grid">${fig("skill", "with skill")}${fig("control", "without skill")}</div></div>`;
}

function componentItem(c) {
  return `<li><a class="comp-name" href="components/${c.name}/">${c.name}</a><span>${inlineCode(c.description)}</span><a class="spec" href="${REPO_URL}/blob/main/skills/finally-good-ui/components/${c.name}/spec.md">spec</a></li>`;
}

const CSS = `
:root{--bg:#f6f1e7;--surface:#fffdf8;--ink:#1f1b16;--muted:#5e564b;--line:#ddd3c1;--accent:#1d5c63;--accent-ink:#fff;--mark:#c8501e;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#15130f;--surface:#1e1b16;--ink:#f1ebdf;--muted:#b3a994;--line:#3a342a;--accent:#7cc4cb;--accent-ink:#0f1c1e;--mark:#f08a5a;color-scheme:dark}}
:root[data-theme=dark]{--bg:#15130f;--surface:#1e1b16;--ink:#f1ebdf;--muted:#b3a994;--line:#3a342a;--accent:#7cc4cb;--accent-ink:#0f1c1e;--mark:#f08a5a;color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:1rem/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent);text-underline-offset:.2em}
a:focus-visible,button:focus-visible{outline:3px solid var(--mark);outline-offset:3px;border-radius:4px}
code{font:.88em ui-monospace,SFMono-Regular,Menlo,monospace;background:color-mix(in srgb,var(--ink) 8%,transparent);padding:.05em .3em;border-radius:4px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.wrap{max-width:68rem;margin:0 auto;padding:0 16px}
header.top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 0}
.brand{font:700 1rem ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.01em;color:var(--ink);text-decoration:none}
.brand::before{content:"";display:inline-block;width:.7em;height:.7em;margin-inline-end:.5em;background:var(--mark);border-radius:50% 50% 50% 0;transform:rotate(-45deg)}
.theme{font:inherit;font-size:.875rem;background:transparent;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:6px 14px;min-height:36px;cursor:pointer}
.theme:hover{border-color:var(--ink)}
.hero{padding:clamp(32px,7vw,88px) 0 clamp(24px,4vw,48px);max-width:46rem}
h1{font:700 clamp(2.2rem,7vw,4rem)/1.05 ui-serif,Georgia,"Times New Roman",serif;letter-spacing:-.02em;margin:0 0 .5em;text-wrap:balance}
.lede{font-size:1.15rem;color:var(--muted);margin:0 0 1.25em;max-width:40rem}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.button{display:inline-block;background:var(--accent);color:var(--accent-ink);padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;min-height:44px;line-height:24px}
.button:hover{filter:brightness(1.08)}
.button.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
section{padding:clamp(28px,5vw,56px) 0;border-top:1px solid var(--line)}
h2{font:700 clamp(1.5rem,4vw,2rem)/1.15 ui-serif,Georgia,serif;margin:0 0 .4em;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 1.5em;max-width:44rem}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(min(100%,20rem),1fr))}
.apps{grid-template-columns:1fr}
@media (min-width:44rem){.apps{grid-template-columns:repeat(2,1fr)}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.shots{display:block;border-bottom:1px solid var(--line);background:var(--line);aspect-ratio:16/10}
.shot{display:block;width:100%;height:auto}
.shot-dark{display:none}
:root[data-theme=dark] .shot-light{display:none}
:root[data-theme=dark] .shot-dark{display:block}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .shot-light{display:none}:root:not([data-theme=light]) .shot-dark{display:block}}
.card-body{padding:16px 18px 20px;display:flex;flex-direction:column;gap:6px;flex:1}
.card h3,.pair h3{margin:0;font:700 1.2rem/1.25 ui-serif,Georgia,serif}
.card p{margin:0}
.meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.8125rem;color:var(--muted)}
.meta span+span::before{content:"";display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--mark);margin-inline-end:14px;vertical-align:middle}
.links{margin-top:auto!important;padding-top:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.pairs{display:grid;gap:28px}
.pair-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));margin-top:10px}
figure{margin:0}
figure img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
figcaption{font-size:.875rem;color:var(--muted);margin-top:6px}
.note{font-size:.9rem;color:var(--muted);max-width:44rem;margin-top:1.25em}
.comps{list-style:none;margin:0;padding:0;display:grid;gap:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.comps li{display:grid;grid-template-columns:7.5rem 1fr auto;gap:4px 16px;padding:12px 16px;border-top:1px solid var(--line);align-items:baseline}
.comps li:first-child{border-top:0}
.comp-name{font:600 1rem ui-monospace,SFMono-Regular,Menlo,monospace}
.spec{font-size:.875rem}
.steps{padding-inline-start:1.2em;max-width:44rem}
.steps li{margin:.4em 0}
footer{padding:32px 0 48px;color:var(--muted);font-size:.875rem;border-top:1px solid var(--line)}
@media (max-width:40rem){.comps li{grid-template-columns:1fr auto}.comps li>span{grid-column:1/-1;order:3}}
@media (prefers-reduced-motion:no-preference){.card{transition:transform .18s ease,box-shadow .18s ease}.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgb(0 0 0/.12)}}
`;

const THEME_JS = `(function(){var r=document.documentElement,b=document.getElementById("theme");
function stored(){try{return localStorage.getItem("fgu-theme")}catch(e){return null}}
function sys(){return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
function cur(){return r.getAttribute("data-theme")||sys()}
function label(){b.textContent=cur()==="dark"?"Light theme":"Dark theme"}
var s=stored();if(s)r.setAttribute("data-theme",s);label();
b.addEventListener("click",function(){var n=cur()==="dark"?"light":"dark";r.setAttribute("data-theme",n);try{localStorage.setItem("fgu-theme",n)}catch(e){}label()});})();`;

function landingPage(components, oneLiner) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>finally-good-ui: gallery</title>
<meta name="description" content="${esc(oneLiner)}">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top"><a class="brand" href="./">finally-good-ui</a><button class="theme" id="theme" type="button">Dark theme</button></header>
<main>
<div class="hero">
<h1>Whole apps, designed the way a senior product designer would.</h1>
<p class="lede">${esc(oneLiner)}</p>
<div class="cta"><a class="button" href="#apps">See the apps</a><a class="button ghost" href="${REPO_URL}">Source on GitHub</a></div>
</div>

<section id="apps" aria-labelledby="apps-h">
<h2 id="apps-h">Four apps, four frameworks</h2>
<p class="sub">Each app was built by following the skill end to end, with its components generated by the skill's scaffold for that framework. These are the production builds, running live.</p>
<div class="grid apps">
${APPS.map(appCard).join("\n")}
</div>
</section>

<section id="r4" aria-labelledby="r4-h">
<h2 id="r4-h">The skill against a plain prompt</h2>
<p class="sub">Round 4 built the same four briefs twice: once with the skill, once from one prompt with no skill. First screen, desktop, light theme.</p>
<div class="pairs">
${APPS.map(r4Pair).join("\n")}
</div>
<p class="note">A process comparison, not a verdict on visual quality: no independent reviewer scored it. The <a href="${REPO_URL}/tree/main/docs/gallery/r5">round 5 notes</a> list what worked and what is still rough.</p>
</section>

<section id="components" aria-labelledby="comp-h">
<h2 id="comp-h">${components.length} component specs</h2>
<p class="sub">Each spec ships native-first markup, behaviour, CSS and a standalone reference page that runs on the default tokens. Open one to try it.</p>
<ul class="comps">
${components.map(componentItem).join("\n")}
</ul>
</section>

<section id="how" aria-labelledby="how-h">
<h2 id="how-h">How it works</h2>
<ol class="steps">
<li>You answer a short design interview and approve a blueprint of screens, flows and states.</li>
<li>The skill previews three animated design directions; you pick one.</li>
<li>It locks the tokens for your stack, builds the app from specified components, and checks the result in a real browser.</li>
</ol>
<p class="sub">The checks are a static CLI (<code>npx finally-good-ui</code>) for accessibility, motion, tokens and the tells of AI-generated UI. Install and usage are in the <a href="${REPO_URL}#readme">README</a>.</p>
</section>
</main>
<footer>Built from <a href="${REPO_URL}">Stav-Sananes/FinallyGoodUI</a>. Rebuild with <code>node scripts/build-gallery-site.mjs</code>.</footer>
</div>
<script>${THEME_JS}</script>
</body>
</html>
`;
}

// ---------- main ----------

function readOneLiner() {
  const text = readFileSync(join(ROOT, "README.md"), "utf8");
  const line = text.split("\n").find((l) => l.startsWith("Your coding agent designs"));
  if (!line) throw new Error("README.md one-liner not found");
  return line.replace(/\*\*/g, "");
}

async function main({ flags }) {
  const out = resolve(flags.out ?? join(ROOT, "_site"));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  if (!flags["skip-apps"]) await Promise.all(APPS.map((app) => buildApp(app, flags.install)));
  for (const app of APPS) cpSync(builtDir(app), join(out, app.id), { recursive: true });

  for (const app of APPS) {
    for (const mode of ["light", "dark"]) copyCapture(out, "r5", R5, `${app.id}-desktop-${mode}.jpg`);
    for (const side of ["skill", "control"]) copyCapture(out, "r4", R4, `${app.id}-${side}-desktop-light.jpg`);
  }

  const components = componentList();
  const tokens = tokensCss();
  for (const c of components) copyComponent(c, tokens, out);

  writeFileSync(join(out, "index.html"), landingPage(components, readOneLiner()));
  writeFileSync(join(out, ".nojekyll"), "");
  return `gallery built: ${out} (base ${BASE}, ${APPS.length} apps, ${components.length} components)`;
}

if (isMain(import.meta.url)) runCli({ help: HELP, spec: { string: ["out"], boolean: ["install", "skip-apps"] }, main });
