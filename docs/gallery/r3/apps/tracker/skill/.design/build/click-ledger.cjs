// Delivery gate G4: click every control on the key screen once and record what happened.
// Run: NODE_PATH=<dir with playwright> node click-ledger.cjs <baseUrl>
const { chromium } = require("playwright");
const base = process.argv[2];

const desktop = [
  ["rail: Triage", "[data-view=triage]", (p) => p.evaluate(() => location.search)],
  ["rail: My issues", "[data-view=mine]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["rail: All open", "[data-view=all]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["rail: P0–P1 open", "[data-view=urgent]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["rail: Waiting on review", "[data-view=review]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["rail: Unassigned", "[data-view=unassigned]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["rail: Search or run…", "#open-palette", async (p) => { const r = await p.evaluate(() => document.querySelector("#palette").open); await p.keyboard.press("Escape"); return `palette open=${r}`; }],
  ["rail: Keyboard shortcuts", "#open-shortcuts", async (p) => { const r = await p.evaluate(() => document.querySelector("#keys-dialog").open); await p.keyboard.press("Escape"); return `dialog open=${r}`; }],
  ["rail: Theme", "#theme-btn", (p) => p.evaluate(() => `${document.querySelector("#theme-label").textContent}, data-theme=${document.documentElement.dataset.theme}`)],
  ["rail: Preview state", "#preview-btn", async (p) => { const r = await p.evaluate(() => !document.querySelector("#menu").hidden); await p.keyboard.press("Escape"); return `menu open=${r}`; }],
  ["toolbar: Priority filter", "[data-filter=priority]", async (p) => { const r = await p.evaluate(() => document.querySelectorAll("#menu-list .opt").length); await p.keyboard.press("Escape"); return `menu with ${r} options`; }],
  ["toolbar: Assignee filter", "[data-filter=assignee]", async (p) => { const r = await p.evaluate(() => document.querySelectorAll("#menu-list .opt").length); await p.keyboard.press("Escape"); return `menu with ${r} options`; }],
  ["toolbar: Label filter", "[data-filter=label]", async (p) => { const r = await p.evaluate(() => document.querySelectorAll("#menu-list .opt").length); await p.keyboard.press("Escape"); return `menu with ${r} options`; }],
  ["toolbar: New issue", "#new-issue", async (p) => { const r = await p.evaluate(() => document.querySelector("#new-dialog").open); await p.click("#new-cancel"); return `dialog open=${r}`; }],
  ["rail: All open (back to the full list)", "[data-view=all]", (p) => p.evaluate(() => document.querySelector("#view-name").textContent)],
  ["list: row ING-214", ".row[data-key=ING-214]", (p) => p.evaluate(() => document.querySelector("#panel-title").textContent)],
  ["list: Closed group toggle", "[data-act=toggle-closed]", (p) => p.evaluate(() => `closed rows shown: ${document.querySelectorAll(".row[data-closed]").length}`)],
  ["panel: Status field", ".field-btn[data-field=status]", async (p) => { const r = await p.evaluate(() => document.querySelector("#menu-input").getAttribute("aria-label")); await p.keyboard.press("Escape"); return r; }],
  ["panel: Priority field", ".field-btn[data-field=priority]", async (p) => { const r = await p.evaluate(() => document.querySelector("#menu-input").getAttribute("aria-label")); await p.keyboard.press("Escape"); return r; }],
  ["panel: Assignee field", ".field-btn[data-field=assignee]", async (p) => { const r = await p.evaluate(() => document.querySelector("#menu-input").getAttribute("aria-label")); await p.keyboard.press("Escape"); return r; }],
  ["panel: Labels field", ".field-btn[data-field=labels]", async (p) => { const r = await p.evaluate(() => document.querySelector("#menu-input").getAttribute("aria-label")); await p.keyboard.press("Escape"); return r; }],
  ["panel: Copy link", "[data-act=copy-link]", (p) => p.waitForTimeout(200).then(() => p.evaluate(() => document.querySelector("#toasts").lastElementChild?.textContent.trim()))],
  ["panel: Comment", ".comment-form button[type=submit]", async (p) => { await p.fill("#comment-box", "Canary on pool B is clean, rolling to all workers at 11:00."); await p.click(".comment-form button[type=submit]"); await p.waitForTimeout(600); return p.evaluate(() => document.querySelector(".activity .cm:last-child p").textContent); }, true],
  ["panel: Close", ".panel-close", (p) => p.evaluate(() => `panel hidden=${document.querySelector("#panel").hidden}`)],
];
const phone = [
  ["phone: view select", null, async (p) => { await p.selectOption("#view-select", "mine"); return p.evaluate(() => document.querySelector("#view-name").textContent); }],
  ["phone: search button", "#m-palette", async (p) => { const r = await p.evaluate(() => document.querySelector("#palette").open); await p.keyboard.press("Escape"); return `palette open=${r}`; }],
  ["phone: new issue button", "#m-new", async (p) => { const r = await p.evaluate(() => document.querySelector("#new-dialog").open); await p.click("#new-cancel"); return `dialog open=${r}`; }],
  ["phone: row opens sheet", ".row", (p) => p.evaluate(() => `sheet hidden=${document.querySelector("#panel").hidden}`)],
  ["phone: Back to issues", ".panel-back", (p) => p.evaluate(() => `sheet hidden=${document.querySelector("#panel").hidden}`)],
];

async function walk(page, steps) {
  const out = [];
  for (const [name, sel, check, skipClick] of steps) {
    try {
      if (sel && !skipClick) await page.click(sel, { timeout: 3000 });
      await page.waitForTimeout(120);
      out.push(`${name} → ${await check(page)}`);
    } catch (e) { out.push(`${name} → FAILED: ${e.message.split("\n")[0]}`); }
  }
  return out;
}
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/index.html?view=triage`); await page.waitForSelector(".row");
  const lines = await walk(page, desktop);
  const ph = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
  const pp = await ph.newPage();
  pp.on("pageerror", (e) => errors.push(e.message));
  await pp.goto(`${base}/index.html?view=triage`); await pp.waitForSelector(".row");
  lines.push(...await walk(pp, phone));
  const st = await ctx.newPage();
  st.on("pageerror", (e) => errors.push(e.message));
  const stateCase = async (name, url, sel, check) => {
    try { await st.goto(`${base}/index.html?${url}`); await st.click(sel, { timeout: 3000 }); await st.waitForTimeout(900); lines.push(`${name} → ${await check(st)}`); }
    catch (e) { lines.push(`${name} → FAILED: ${e.message.split("\n")[0]}`); }
  };
  await stateCase("error: Try again", "view=triage&state=error", "[data-act=retry-load]", (p) => p.evaluate(() => `rows: ${document.querySelectorAll(".row").length}`));
  await stateCase("issue error: Try again", "view=mine&issue=ING-219&state=issue-error", "[data-act=retry-issue]", (p) => p.evaluate(() => document.querySelector("#panel-title")?.textContent));
  await stateCase("offline: Reconnect", "view=all&state=offline", "[data-act=reconnect]", (p) => p.evaluate(() => `banner hidden=${document.querySelector("#banner").hidden}`));
  await stateCase("no results: Clear filters", "view=all&q=kubernetes", "[data-act=clear-filters]", (p) => p.evaluate(() => `rows: ${document.querySelectorAll(".row").length}`));
  await stateCase("empty: New issue", "view=triage&state=empty", "[data-act=new]", (p) => p.evaluate(() => `dialog open=${document.querySelector("#new-dialog").open}`));
  await stateCase("fail: change rolls back, toast Try again", "view=triage&state=fail", ".row", async (p) => {
    await p.keyboard.press("1"); await p.waitForTimeout(1000);
    const msg = await p.evaluate(() => document.querySelector('.toast[data-kind="error"] p')?.textContent);
    await p.click('.toast[data-kind="error"] button'); await p.waitForTimeout(200);
    return `${msg} | after Try again: ${await p.evaluate(() => document.querySelector(".row[aria-current] .tag").textContent.trim())}`;
  });
  await stateCase("cleared: Go to My issues", "view=triage", ".row", async (p) => {
    for (let i = 0; i < 6; i++) { await p.keyboard.press("2"); await p.keyboard.press("s"); await p.fill("#menu-input", "Todo"); await p.keyboard.press("Enter"); }
    await p.waitForTimeout(700); await p.click("[data-act=goto-mine]"); return p.evaluate(() => document.querySelector("#view-name").textContent);
  });
  await stateCase("toast Undo button reverts all listed changes", "view=triage", ".row", async (p) => {
    await p.keyboard.press("1"); await p.keyboard.press("i"); await p.waitForTimeout(100);
    const t = await p.evaluate(() => document.querySelector(".toast p").textContent);
    await p.click(".toast .btn"); await p.waitForTimeout(300);
    return `${t} | after Undo: ${await p.evaluate(() => { const r = document.querySelector('.row[data-key="ING-231"]'); return r.querySelector(".tag").textContent.trim() + " " + r.querySelector(".avatar").getAttribute("aria-label"); })}`;
  });
  console.log(lines.join("\n"));
  console.log(`page errors: ${errors.length ? errors.join(" | ") : "none"}`);
  await browser.close();
})();
