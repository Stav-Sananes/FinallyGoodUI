#!/usr/bin/env node
// Real-browser smoke for the component gallery (.design/components.html, from scaffold-component.mjs --gallery).
// The unit tests drive the behaviour scripts against a fake DOM; this opens the page in Chromium and checks what
// only a browser decides: the popover top layer, native <dialog> focus, real key events, live regions.
// Imports `playwright` from the USER's project (--root), like check-flows.mjs; this plugin has no dependency on it.
// Exit: 0 all checks pass, 1 a check failed, 2 playwright/browser missing or bad input.
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runCli, isMain, UsageError } from "../lib/cli.mjs";
import { exists } from "../lib/fs.mjs";

const HELP = `
Usage: component-smoke.mjs [--root <dir>] [--page <file>]

Opens the component gallery in Chromium and asserts real behaviour: Menu toggles and Escape returns focus,
Dialog focus in / Escape / focus back, Tabs arrow keys, Disclosure aria-expanded, Toast live region and
dismiss, Button aria-busy swallowing clicks, and no page errors.
Prints {"tool":"component-smoke","ok","checks":[{name,ok,detail}]}.

Options:
  --root <dir>   project root; playwright is resolved from here (default: cwd)
  --page <file>  gallery page (default: <root>/.design/components.html)
Exit: 0 pass, 1 a check failed, 2 playwright or the browser is missing (or the page is).
`;

const TOOL = "component-smoke";
const SETTLE_MS = 300; // long enough for a wrongly re-opening popover or a stray handler to show itself

async function loadPlaywright(root) {
  const req = createRequire(join(resolve(root), "package.json"));
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const m = await import(pathToFileURL(req.resolve(name)).href);
      const pw = m.chromium ? m : m.default;
      if (pw?.chromium) return pw;
    } catch { /* try the next one */ }
  }
  return null;
}

const section = (page, name) => page.locator(`[data-fgu-section="${name}"]`);
const expect = (cond, detail) => { if (!cond) throw new Error(detail); };

// Each check gets a fresh page so one failure cannot poison the next. Returns a detail string on success.
const CHECKS = [
  ["menu: the trigger opens the list and focuses an item", async (page) => {
    const menu = section(page, "menu"), trigger = menu.locator('[data-part="trigger"]').first(), list = menu.locator('[data-part="list"]').first();
    await trigger.click();
    expect(await list.evaluate((el) => el.matches(":popover-open")), "list did not open on a trigger click");
    expect((await trigger.getAttribute("aria-expanded")) === "true", "aria-expanded is not true while open");
    expect(await list.evaluate((el) => el.contains(document.activeElement)), "focus did not move into the list");
    return "open, aria-expanded=true, focus inside the list";
  }],
  ["menu: clicking the trigger of an open menu closes it and it stays closed", async (page) => {
    const menu = section(page, "menu"), trigger = menu.locator('[data-part="trigger"]').first(), list = menu.locator('[data-part="list"]').first();
    await trigger.click();
    await trigger.click();
    const closed = () => list.evaluate((el) => !el.matches(":popover-open"));
    expect(await closed(), "list still open right after the second click");
    await page.waitForTimeout(SETTLE_MS);
    expect(await closed(), "list re-opened after the second click");
    expect((await trigger.getAttribute("aria-expanded")) === "false", "aria-expanded is not false after closing");
    return "closed after the second click, still closed after settling";
  }],
  ["menu: Escape closes the list and returns focus to the trigger", async (page) => {
    const menu = section(page, "menu"), trigger = menu.locator('[data-part="trigger"]').first(), list = menu.locator('[data-part="list"]').first();
    await trigger.click();
    await page.keyboard.press("Escape");
    expect(await list.evaluate((el) => !el.matches(":popover-open")), "Escape did not close the list");
    expect(await trigger.evaluate((el) => el === document.activeElement), "focus did not return to the trigger");
    return "closed, trigger focused";
  }],
  ["dialog: opens with focus inside, Escape closes it, focus returns to the opener", async (page) => {
    const dlg = section(page, "dialog"), opener = dlg.locator("[data-dialog-open]").first(), dialog = dlg.locator("dialog").first();
    await opener.focus();
    await opener.click();
    expect(await dialog.evaluate((el) => el.open), "dialog did not open");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement)), "focus did not move inside the dialog");
    await page.keyboard.press("Escape");
    expect(await dialog.evaluate((el) => !el.open), "Escape did not close the dialog");
    expect(await opener.evaluate((el) => el === document.activeElement), "focus did not return to the opener");
    return "open with focus inside, Escape closed it, opener focused";
  }],
  ["tabs: arrow keys move focus and selection", async (page) => {
    const tabs = section(page, "tabs").locator('[role="tab"]');
    expect((await tabs.count()) >= 3, "fewer than three tabs");
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    expect((await tabs.nth(1).getAttribute("aria-selected")) === "true", "ArrowRight did not select the second tab");
    expect(await tabs.nth(1).evaluate((el) => el === document.activeElement), "ArrowRight did not focus the second tab");
    expect((await tabs.nth(0).getAttribute("aria-selected")) === "false", "the first tab stayed selected");
    await page.keyboard.press("ArrowLeft");
    expect((await tabs.nth(0).getAttribute("aria-selected")) === "true", "ArrowLeft did not select the first tab again");
    return "ArrowRight selected tab 2, ArrowLeft selected tab 1";
  }],
  ["disclosure: the trigger toggles aria-expanded", async (page) => {
    const closed = section(page, "disclosure").locator('[data-part="trigger"]:not([disabled])[aria-expanded="false"]').first();
    const trigger = page.locator(`#${await closed.getAttribute("id")}`); // a locator by state would follow the state change
    await trigger.click();
    expect((await trigger.getAttribute("aria-expanded")) === "true", "did not expand");
    await trigger.click();
    expect((await trigger.getAttribute("aria-expanded")) === "false", "did not collapse");
    return "false -> true -> false";
  }],
  ["toast: the live region exists and a dismiss button removes its toast", async (page) => {
    const toast = section(page, "toast"), region = toast.locator('[role="status"]').first();
    expect((await region.count()) === 1, "no role=status live region on the page");
    await toast.locator("#fail").click();
    const errorToast = region.locator('[data-part="toast"][data-variant="error"]');
    expect((await errorToast.count()) === 1, "a toast did not appear in the live region");
    await errorToast.locator('[data-part="dismiss"]').click();
    await errorToast.waitFor({ state: "detached", timeout: 2000 });
    return "toast added inside the region, dismiss removed it";
  }],
  ["button: aria-busy swallows clicks, a normal button does not", async (page) => {
    const buttons = section(page, "button");
    const busy = buttons.locator('[data-part="root"][aria-busy="true"]').first(), idle = buttons.locator('[data-part="root"]:not([aria-busy]):not([disabled])').first();
    const counted = (loc) => loc.evaluate((el) => { el.__clicks = 0; el.addEventListener("click", () => el.__clicks++); });
    await counted(busy); await counted(idle);
    await busy.click(); await idle.click();
    const clicks = async (loc) => loc.evaluate((el) => el.__clicks);
    expect((await clicks(idle)) === 1, "control: the idle button did not receive its click");
    expect((await clicks(busy)) === 0, "the busy button received a click");
    expect(await busy.evaluate((el) => !el.disabled), "the busy button became disabled instead of staying focusable");
    return "busy 0 clicks, idle 1 click";
  }],
];

export async function runSmoke({ root, pageFile }) {
  const pw = await loadPlaywright(root);
  if (!pw) return { out: { tool: TOOL, ok: false, error: "playwright-missing", message: `playwright cannot be resolved from ${resolve(root)}`, fix: "npm i -D playwright && npx playwright install chromium" }, code: 2 };
  let browser;
  try { browser = await pw.chromium.launch(); }
  catch (e) { return { out: { tool: TOOL, ok: false, error: "browser-missing", message: e.message.split("\n")[0], fix: "npx playwright install chromium" }, code: 2 }; }

  const url = pathToFileURL(resolve(pageFile)).href;
  const checks = [];
  const pageErrors = [];
  try {
    const context = await browser.newContext();
    context.setDefaultTimeout(5000);
    for (const [name, fn] of CHECKS) {
      const page = await context.newPage();
      page.on("pageerror", (e) => pageErrors.push(`${name}: ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error") pageErrors.push(`${name}: console: ${m.text()}`); });
      try {
        await page.goto(url);
        checks.push({ name, ok: true, detail: await fn(page) });
      } catch (e) {
        checks.push({ name, ok: false, detail: e.message.split("\n")[0] });
      } finally { await page.close(); }
    }
  } finally { await browser.close().catch(() => {}); }
  checks.push({ name: "page: no script or console errors", ok: pageErrors.length === 0, detail: pageErrors.length ? pageErrors.slice(0, 5).join(" | ") : "none" });
  const ok = checks.every((c) => c.ok);
  return { out: { tool: TOOL, ok, page: pageFile, checks }, code: ok ? 0 : 1 };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root", "page"] },
    main: async ({ flags }) => {
      const root = flags.root || ".";
      const pageFile = flags.page || join(root, ".design", "components.html");
      if (!exists(pageFile)) throw new UsageError(`gallery page not found: ${pageFile} (write it with: node scaffold-component.mjs --gallery --root ${root})`);
      const { out, code } = await runSmoke({ root, pageFile });
      process.exitCode = code;
      return out;
    },
  });
}
