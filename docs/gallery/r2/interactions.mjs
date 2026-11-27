// The same task on both sides of a pair, located per side (each build names its controls differently).
const pause = (page, ms = 700) => page.waitForTimeout(ms);
const tap = async (page, locator) => {
  const t0 = Date.now();
  const el = locator.first();
  await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
  await pause(page, 250);
  await el.click({ timeout: 4000 }).catch((e) => console.warn("  could not click:", String(e).split("\n")[0]));
  await pause(page);
  if (process.env.TRACE) console.log("  step", Date.now() - t0, "ms");
};
const firstInDialog = (page) =>
  page.locator('dialog[open] button:visible, [role="dialog"] button:visible, [role="dialog"] [role="option"]:visible')
    .filter({ hasNotText: /close|cancel|back|×|\bOn (Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i });

export const interactions = {
  // Pick another day, then a time, then go on to review.
  async booking(page, side) {
    if (side === "skill") {
      await tap(page, page.getByRole("radio", { name: /Thursday, November 19/ }));
      await tap(page, page.getByRole("radio", { name: /drop-off/ }));
      await tap(page, page.getByRole("button", { name: /^Continue/ }));
    } else {
      await tap(page, page.getByRole("button", { name: /Thursday 19 November/ }));
      await tap(page, page.getByRole("button", { name: /^\d.*(am|pm) to .*with/ }));
      await tap(page, page.getByRole("button", { name: /^Review/ }));
    }
  },
  // Turn on "count what clients owe", then mark one invoice paid.
  async finance(page, side) {
    if (side === "skill") {
      await tap(page, page.locator("label[for=owed-switch], label:has(#owed-switch)"));
      await tap(page, page.getByRole("button", { name: /^Mark .* as paid/ }));
    } else {
      await tap(page, page.getByRole("switch", { name: /Collect everything overdue/ }).or(page.getByText("Collect everything overdue")));
      await tap(page, page.getByRole("button", { name: /^Mark paid/ }));
    }
    await pause(page, 600);
  },
  // Plan the empty evening, then open a recipe.
  async meals(page, side) {
    if (side === "skill") await tap(page, page.getByRole("button", { name: /^Plan Friday/ }));
    else await tap(page, page.getByRole("button", { name: /^Plan Thursday/ }));
    await tap(page, firstInDialog(page));
    await page.keyboard.press("Escape"); await pause(page, 400);
    if (side === "skill") await tap(page, page.getByRole("link", { name: /Lemon chicken/ }));
    else await tap(page, page.getByRole("button", { name: /Sheet-pan lemon chicken/ }));
  },
  // Move down the list from the keyboard, open the command palette, search, close it.
  async tracker(page) {
    await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
    for (const k of ["j", "j", "j", "k"]) { await page.keyboard.press(k); await pause(page, 350); }
    await page.keyboard.press("Enter"); await pause(page);
    await page.keyboard.press("Meta+k"); await pause(page, 500);
    await page.keyboard.type("webhook", { delay: 60 }); await pause(page);
    await page.keyboard.press("Escape"); await pause(page);
  },
};
