#!/usr/bin/env node
// Gate G10: measure how template-like the first screen is, at 1440x900 and 375x667.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadPlaywright } from "./lib/playwright.mjs";
import { evaluateGenericness, DEFAULT_PROMISE } from "./lib/genericness.mjs";
import { PROBE_PATH } from "./check-flows.mjs";

const HELP = `
Usage: check-genericness.mjs --url <first-screen URL> [--root <dir>] [--promise-1440 <0-1>] [--promise-375 <0-1>] [--roles <n>] [--wait <selector>]
       check-genericness.mjs --report <.design/reports/<run>.json> [--screen <name>]

Loads the first screen at 1440x900 and 375x667 (light), runs probe.js and prints
{pass, count, capDim10, triggers[], fidelity[], measured}. Triggers: cardCoverage, rowRepeat,
singleColumn, defaultType, canvasNeutral, scaleFlat, signatureAbsent, radiusUniform (thresholds in
lib/genericness.mjs). 3 or more triggers fail G10 and cap rubric dimension 10 at 3. A
[data-fgu-signature] element below the spec's promised share is a high fidelity finding.
Run it right after the first screen is built, and again at verify.

  --url            page to load (a dev or static server)
  --report         instead of loading a page, read metrics.generic from a check-flows report
                   (first result at 1440 and at 375 wide; --screen picks the step name)
  --root           project whose node_modules has playwright (default: FGU_PLAYWRIGHT_ROOT, else cwd)
  --promise-1440   signature share promised at 1440 (default ${DEFAULT_PROMISE.desktop})
  --promise-375    signature share promised at 375 (default ${DEFAULT_PROMISE.mobile})
  --roles          surface roles in the spec's material block (default 3)
  --wait           selector to wait for before measuring
Exit 0 whatever the result (it is a finding); exit 2 usage, 3 browser/playwright missing.
`;

const SIZES = { desktop: { width: 1440, height: 900 }, mobile: { width: 375, height: 667 } };

async function measure(pw, url, wait) {
  const browser = await pw.chromium.launch();
  const out = {};
  try {
    for (const [key, viewport] of Object.entries(SIZES)) {
      const ctx = await browser.newContext({ viewport, colorScheme: "light", reducedMotion: "reduce", ...(key === "mobile" ? { hasTouch: true, isMobile: true } : {}) });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      if (wait) await page.waitForSelector(wait);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForTimeout(400);
      await page.addScriptTag({ content: readFileSync(PROBE_PATH, "utf8") });
      const probe = await page.evaluate(() => window.__fguProbe({ focus: false, skip: ["off-token"] }));
      out[key] = probe.metrics.generic;
      await ctx.close();
    }
  } finally { await browser.close(); }
  return out;
}

function fromReport(file, screen) {
  const rep = JSON.parse(readFileSync(file, "utf8"));
  const pick = (min, max) => (rep.results ?? []).find((r) => r.metrics?.generic && r.metrics.viewport.width >= min && r.metrics.viewport.width <= max && (!screen || r.step === screen) && !r.state);
  return { desktop: pick(1200, 4000)?.metrics.generic ?? null, mobile: pick(300, 500)?.metrics.generic ?? null };
}

export async function main({ flags }) {
  const share = (v, name) => { if (v === undefined) return undefined; const n = Number(v); if (!(n >= 0 && n <= 1)) throw new UsageError(`--${name} must be 0-1`); return n; };
  const promise = { desktop: share(flags["promise-1440"], "promise-1440") ?? DEFAULT_PROMISE.desktop, mobile: share(flags["promise-375"], "promise-375") ?? DEFAULT_PROMISE.mobile };
  const roles = flags.roles === undefined ? 3 : Number(flags.roles);
  let raw;
  if (flags.report) raw = fromReport(resolve(flags.report), flags.screen);
  else {
    if (!flags.url) throw new UsageError("give --url or --report");
    const pw = await loadPlaywright(flags.root ?? process.env.FGU_PLAYWRIGHT_ROOT ?? process.cwd());
    if (!pw) { process.exitCode = 3; return { tool: "check-genericness", ok: false, error: "playwright-missing: set --root to a project with playwright installed" }; }
    try { raw = await measure(pw, flags.url, flags.wait); }
    catch (e) { process.exitCode = 3; return { tool: "check-genericness", ok: false, error: `measure-failed: ${e.message.split("\n")[0]}` }; }
  }
  return { tool: "check-genericness", ...evaluateGenericness(raw, { promise, roles }), measured: raw };
}

if (isMain(import.meta.url)) await runCli({ help: HELP, spec: { string: ["url", "report", "screen", "root", "promise-1440", "promise-375", "roles", "wait"] }, main });
