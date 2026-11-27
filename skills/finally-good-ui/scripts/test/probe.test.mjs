import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { PROBE_PATH } from "../check-flows.mjs";

const SRC = readFileSync(PROBE_PATH, "utf8");

test("probe focuses with focusVisible so :focus-visible styles are measured", () => {
  assert.match(SRC, /\.focus\(\{[^}]*focusVisible:\s*true/);
});

// Browser tests need playwright + chromium from the caller's project (not a plugin dependency).
// Point FGU_PLAYWRIGHT_ROOT at a dir with node_modules/playwright, or run from one; otherwise skipped.
async function loadChromium() {
  for (const root of [process.env.FGU_PLAYWRIGHT_ROOT, process.cwd()].filter(Boolean)) {
    try { return createRequire(join(root, "noop.js"))("playwright").chromium; } catch { /* next */ }
  }
  return null;
}

const FIXTURE = `<!doctype html><html><head><style>
  button { width: 120px; height: 40px; border: 1px solid #888; background: #eee; }
  .nofocus:focus, .nofocus:focus-visible { outline: none; }
  .ring:focus-visible { outline: 2px solid blue; }
  .clip { width: 40px; overflow: hidden; white-space: nowrap; }
  .sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  .vh { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style></head><body><h1>Fixture</h1>
  <button id="ring" class="ring">Has ring</button>
  <button id="none" class="nofocus">No focus style</button>
  <a id="link" href="#x" class="nofocus">Link without focus style</a>
  <p id="clipped" class="clip">This text is genuinely clipped</p>
  <span id="sr" class="sr">Screen-reader-only text</span>
  <span id="vh" class="vh">Visually hidden text</span>
</body></html>`;

test("probe in chromium: focus-visible styles count, sr-only is not clipped text, controls still flagged", async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip("playwright not resolvable (set FGU_PLAYWRIGHT_ROOT)");
  let browser;
  try { browser = await chromium.launch(); } catch (e) { return t.skip("chromium not installed: " + e.message.split("\n")[0]); }
  try {
    const page = await browser.newPage();
    await page.setContent(FIXTURE);
    await page.addScriptTag({ content: SRC });
    await page.click("#ring"); // mouse interaction: plain el.focus() would no longer match :focus-visible
    const r = await page.evaluate(() => window.__fguProbe({ focus: true, maxPerRule: 100 }));
    const by = (rule) => r.findings.filter((f) => f.rule === rule).map((f) => f.selector).sort();
    assert.deepEqual(r.errors, []);
    assert.deepEqual(by("focus-invisible"), ["#link", "#none"]);
    assert.deepEqual(by("clipped-text"), ["#clipped"]);
    assert.equal(r.metrics.focus.unverified, 0);
    // focus restored to the clicked button without a forced ring leaking into the next screenshot
    assert.deepEqual(await page.evaluate(() => [document.activeElement.id, document.activeElement.matches(":focus-visible")]), ["ring", false]);
  } finally { await browser.close(); }
});
