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

// Genericness measurements (metrics.generic) on two pages built for the purpose: a stock dashboard and one whose concept sets the structure.
const STOCK = `<!doctype html><html><head><style>
  body { margin: 0; background: #f6f6f4; font-family: Inter, sans-serif; }
  main { width: 900px; margin: 0 auto; padding: 24px 0; }
  h1 { font-size: 28px; margin: 0 0 16px; } p { font-size: 16px; margin: 0; }
  li { list-style: none; display: flex; justify-content: space-between; align-items: center; border: 1px solid #ddd; border-radius: 12px; height: 60px; padding: 0 16px; margin-bottom: 12px; background: #fff; }
</style></head><body><main><h1>Meals</h1><ul style="padding:0">
  ${[1, 2, 3, 4, 5, 6].map((i) => `<li><span>Dish ${i}</span><button aria-label="More options">...</button></li>`).join("")}
</ul></main></body></html>`;
const CONCEPT = `<!doctype html><html><head><style>
  body { margin: 0; background: #20332a; color: #f3ead2; font-family: Georgia, serif; }
  h1 { font-size: 120px; margin: 0; padding: 24px 40px; } p { font-size: 18px; margin: 0 40px; }
  #board { margin: 24px 40px; height: 380px; width: 1000px; background: #f3ead2; color: #20332a; clip-path: polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%); }
</style></head><body><h1>Tonight</h1><div id="board" data-fgu-signature><p>Roast squash, 3 plates</p></div><p>Six more nights.</p></body></html>`;

test("probe genericness in chromium: a stock list reads generic, a concept-led page does not, and the signature share is measured", async (t) => {
  const chromium = await loadChromium();
  if (!chromium) return t.skip("playwright not resolvable (set FGU_PLAYWRIGHT_ROOT)");
  let browser;
  try { browser = await chromium.launch(); } catch (e) { return t.skip("chromium not installed: " + e.message.split("\n")[0]); }
  const { evaluateGenericness } = await import("../lib/genericness.mjs");
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const measure = async (html, promise) => {
      await page.setContent(html);
      await page.addScriptTag({ content: SRC });
      return page.evaluate((p) => window.__fguProbe({ focus: false, promise: p }), promise);
    };
    const stock = await measure(STOCK);
    assert.deepEqual(stock.errors, []);
    const g = stock.metrics.generic;
    assert.equal(g.rows.max, 6, "six sibling rows ending in a more button");
    assert.deepEqual(g.column && [g.column.left, g.column.right, g.column.width], [270, 270, 900]);
    assert.equal(g.signature.count, 0);
    const bad = evaluateGenericness({ desktop: g });
    assert.ok(["rowRepeat", "singleColumn", "scaleFlat", "defaultType", "signatureAbsent"].every((id) => bad.triggers.some((x) => x.id === id)), JSON.stringify(bad.triggers));
    assert.equal(bad.pass, false);

    const concept = await measure(CONCEPT, { desktop: 0.5, mobile: 0.4 });
    const c = concept.metrics.generic;
    assert.equal(c.signature.count, 1);
    assert.ok(c.signature.share > 0.28 && c.signature.share < 0.31, `share ${c.signature.share}`); // 1000 x 380 of 1440 x 900
    assert.equal(c.rows.groups, 0);
    assert.ok(c.canvas.l < 0.5, "dark canvas");
    assert.ok(concept.findings.some((f) => f.rule === "signature-below-promise" && f.severity === "high"), "promised 50%, built 29%");
    const good = evaluateGenericness({ desktop: c });
    assert.ok(good.pass, JSON.stringify(good.triggers));
    const kept = await measure(CONCEPT, { desktop: 0.25, mobile: 0.4 });
    assert.equal(kept.findings.filter((f) => f.rule === "signature-below-promise").length, 0, "promise kept: no finding");
  } finally { await browser.close(); }
});
