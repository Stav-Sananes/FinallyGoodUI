// Gallery capture: for each app and side, three stills (desktop light, desktop dark preference, phone) and
// one short motion clip (page load + the app's main interaction), recorded as video, then turned into a
// looping animated WebP. The same interaction script runs on both sides of a pair.
//   node capture.mjs <apps-dir> <out-dir> [app ...]
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, rmSync, renameSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const require = createRequire("/Users/stavnsananes/Applications/personas/node_modules/");
const { chromium } = require("playwright-core");

const [appsDir, outDir, ...only] = process.argv.slice(2);
const APPS = only.length ? only : ["booking", "finance", "meals", "tracker"];
const SIDES = ["skill", "control"];
const { interactions } = await import(join(process.cwd(), "interactions.mjs"));

// Serve the apps over http (fonts and some APIs refuse file://).
const server = createServer(async (req, res) => {
  try {
    const p = join(appsDir, decodeURIComponent(req.url.split("?")[0]));
    const body = await readFile(p.endsWith("/") ? join(p, "index.html") : p);
    res.writeHead(200, { "content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".css") ? "text/css" : "text/html" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const settle = (page) => page.waitForLoadState("networkidle").catch(() => {}).then(() => page.waitForTimeout(800));

for (const app of APPS) for (const side of SIDES) {
  const url = `${base}/${app}/${side}/`;
  const stem = join(outDir, `${app}-${side}`);
  for (const [view, opts] of [
    ["desktop-light", { viewport: { width: 1440, height: 900 }, colorScheme: "light" }],
    ["desktop-dark", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" }],
    ["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "light" }],
  ]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(url); await settle(page);
    await page.screenshot({ path: `${stem}-${view}.jpg`, type: "jpeg", quality: 82 });
    await ctx.close();
  }

  // Motion clip: desktop for desktop-first briefs, phone for booking (the brief says "on their phone").
  const phone = app === "booking";
  const size = phone ? { width: 390, height: 844 } : { width: 1280, height: 800 };
  const vidDir = `${stem}-video`;
  rmSync(vidDir, { recursive: true, force: true });
  const ctx = await browser.newContext({
    viewport: size, colorScheme: "light", ...(phone ? { isMobile: true, hasTouch: true } : {}),
    recordVideo: { dir: vidDir, size },
  });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(1200);                  // the load and first-paint motion
  await interactions[app](page, side);
  await page.waitForTimeout(900);
  await ctx.close();
  const webm = join(vidDir, readdirSync(vidDir)[0]);
  const frames = `${stem}-frames`;
  rmSync(frames, { recursive: true, force: true }); mkdirSync(frames);
  const scale = phone ? "330:-2" : "800:-2";
  execFileSync("ffmpeg", ["-v", "error", "-i", webm, "-vf", `fps=15,scale=${scale}:flags=lanczos`, join(frames, "f%04d.png")]);
  const list = readdirSync(frames).sort().map((f) => join(frames, f));
  execFileSync("img2webp", ["-loop", "0", "-lossy", "-q", "62", "-m", "6", "-d", "67", ...list, "-o", `${stem}-motion.webp`]);
  renameSync(webm, `${stem}-motion.webm`);
  rmSync(frames, { recursive: true, force: true }); rmSync(vidDir, { recursive: true, force: true });
  console.log("captured", app, side);
}
await browser.close();
server.close();
