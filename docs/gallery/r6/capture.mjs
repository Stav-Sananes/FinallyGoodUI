// Round-6 capture, each served from its own http server.
//   node capture.mjs [app ...]
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, statSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createServer } from "node:http";
// playwright-core: first root that has it (r4 used personas; fall back to career-ops)
const ROOTS = ["/Users/stavnsananes/Applications/personas/node_modules/", "/Users/stavnsananes/Applications/career-ops/node_modules/"];
let chromium;
for (const r of ROOTS) { try { ({ chromium } = createRequire(r)("playwright-core")); break; } catch {} }
if (!chromium) throw new Error("playwright-core not found in " + ROOTS.join(", "));

const here = dirname(fileURLToPath(import.meta.url));
const APPS = process.argv.slice(2).length ? process.argv.slice(2) : ["finance", "booking", "tracker", "meals"];
const outDir = join(here, "captures");
mkdirSync(outDir, { recursive: true });

const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".json": "application/json", ".html": "text/html", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon" };

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules") continue;
    const p = join(dir, e.name); e.isDirectory() ? walk(p, acc) : acc.push(p);
  } return acc;
}
function findBuilt(appDir) {
  if (!existsSync(join(appDir, "dist"))) return null;
  const hit = walk(join(appDir, "dist")).filter((p) => p.endsWith("/index.html"));
  return hit.length ? dirname(hit.sort((a, b) => a.length - b.length)[0]) : null;
}
function stale(appDir, built) {
  if (!built) return true;
  const t = statSync(join(built, "index.html")).mtimeMs;
  const srcs = [...walk(join(appDir, "src")), join(appDir, "package.json")].filter(existsSync);
  return srcs.some((p) => statSync(p).mtimeMs > t);
}
function serve(root) {
  const idx = readFileSync(join(root, "index.html"));
  return createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]);
    let p = join(root, rel);
    if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) p = join(root, "index.html");
    const body = p.endsWith("index.html") ? idx : readFileSync(p);
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  }).listen(0, "127.0.0.1");
}
const busy = (page) => page.evaluate(() => !![...document.querySelectorAll('[aria-busy="true"],[role="progressbar"],[class*="skeleton" i]')]
  .find((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; }));

const VIEWS = [
  ["desktop-light", { viewport: { width: 1440, height: 900 }, colorScheme: "light" }],
  ["desktop-dark", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" }],
  ["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "light" }],
];

const browser = await chromium.launch();
const log = {};
async function stdDev(buf) {
  const ctx = await browser.newContext(); const pg = await ctx.newPage();
  const v = await pg.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/jpeg;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = 200; c.height = Math.max(1, Math.round(200 * img.height / img.width));
    const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0, s = 0, q = 0;
    for (let i = 0; i < d.length; i += 4) { const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; s += l; q += l * l; }
    const m = s / n; return Math.sqrt(q / n - m * m);
  }, buf.toString("base64"));
  await ctx.close(); return v;
}

for (const app of APPS) {
  const appDir = join(here, "apps", app);
  let built = findBuilt(appDir);
  if (stale(appDir, built)) {
    console.log("building", app);
    execSync("npm run build", { cwd: appDir, stdio: "inherit" });
    built = findBuilt(appDir);
  }
  const server = serve(built); await new Promise((r) => server.once("listening", r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const entry = log[app] = { builtDir: built.replace(here + "/", ""), views: {} };
  for (const [view, opts] of VIEWS) {
    const ctx = await browser.newContext(opts); const page = await ctx.newPage();
    const v = entry.views[view] = { consoleErrors: [], pageErrors: [], failedRequests: [], notes: [] };
    page.on("console", (m) => { if (m.type() === "error") v.consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => v.pageErrors.push(String(e)));
    page.on("requestfailed", (r) => v.failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on("response", (r) => { if (r.status() >= 400) v.failedRequests.push(`${r.url()} HTTP ${r.status()}`); });
    await page.goto(url).catch((e) => v.pageErrors.push("goto: " + e.message));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    if (await busy(page).catch(() => false)) {
      v.notes.push("loading indicator present after 1.5s; waiting up to 4s");
      for (let i = 0; i < 16 && await busy(page).catch(() => false); i++) await page.waitForTimeout(250);
      if (await busy(page).catch(() => false)) v.notes.push("loading indicator STILL present at capture");
    }
    const buf = await page.screenshot({ path: join(outDir, `${app}-${view}.jpg`), type: "jpeg", quality: 80 });
    const sd = await stdDev(buf);
    v.bytes = buf.length; v.pixelStdDev = +sd.toFixed(2);
    if (sd < 3) v.notes.push(`BLANK? luminance std dev ${sd.toFixed(2)}`);
    await ctx.close();
  }
  server.close();
  console.log("captured", app);
}
await browser.close();
writeFileSync(join(outDir, "capture-log.json"), JSON.stringify(log, null, 2));
console.log("done");
