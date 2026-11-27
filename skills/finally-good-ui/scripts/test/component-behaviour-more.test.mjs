import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { SR } from "./_h.mjs";
import { Doc, make } from "./_fakedom.mjs";

// select, table, tooltip, popover against the fake DOM (real capture/bubble dispatch). Every test has a negative control.
const load = (name) => import(join(SR, "components", name, `${name}.js`));
const clicks = (el) => el.dispatch("click", { bubbles: true });
const keys = (el, key, extra = {}) => el.dispatch("keydown", { bubbles: true, key, timeStamp: 0, ...extra });

// A controllable clock for the tooltip delay.
const withClock = async (fn) => {
  const real = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  let t = 0, id = 0;
  const timers = new Map();
  globalThis.setTimeout = (f, ms) => { timers.set(++id, { f, at: t + ms }); return id; };
  globalThis.clearTimeout = (h) => { timers.delete(h); };
  const clock = { advance(ms) { const end = t + ms; for (;;) { const n = [...timers].filter(([, v]) => v.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!n) break; timers.delete(n[0]); t = n[1].at; n[1].f(); } t = end; } };
  try { return await fn(clock); } finally { Object.assign(globalThis, real); }
};

// ---- tooltip
const tooltipPage = () => {
  const doc = new Doc();
  const root = make(doc, "span", { "data-fgu": "tooltip", "data-part": "root", "data-delay": "500" });
  const trigger = make(doc, "span", { "data-part": "trigger" });
  const button = make(doc, "button");
  const content = make(doc, "span", { "data-part": "content" });
  trigger.append(button);
  root.append(trigger, content);
  doc.defaultView.innerHeight = 800;
  trigger.rect = { left: 100, top: 200, width: 40, height: 20, right: 140, bottom: 220 };
  content.rect = { left: 0, top: 0, width: 80, height: 24, right: 80, bottom: 24 };
  const outside = make(doc, "button");
  doc.body = make(doc, "body");
  doc.body.append(outside, root);
  return { doc, root, trigger, button, content, outside };
};

test("tooltip attach: role, popover=manual and aria-describedby on the control inside the trigger", async () => {
  const { attach } = await load("tooltip");
  const p = tooltipPage();
  attach(p.root);
  assert.equal(p.content.getAttribute("role"), "tooltip");
  assert.equal(p.content.getAttribute("popover"), "manual");
  assert.equal(p.button.getAttribute("aria-describedby"), p.content.id);
  assert.equal(tooltipPage().button.getAttribute("aria-describedby"), null, "negative control: nothing before attach");
});

test("tooltip: hover shows after the delay, leaving hides, a touch pointer never shows it", async () => {
  const { attach } = await load("tooltip");
  await withClock(async (clock) => {
    const p = tooltipPage();
    attach(p.root);
    p.button.dispatch("pointerover", { bubbles: true, pointerType: "mouse", relatedTarget: p.outside });
    clock.advance(499);
    assert.equal(p.content.popoverOpen, false, "not before the delay");
    clock.advance(1);
    assert.equal(p.content.popoverOpen, true);
    assert.equal(p.root.hasAttribute("data-open"), true);
    p.button.dispatch("pointerout", { bubbles: true, relatedTarget: p.outside });
    assert.equal(p.content.popoverOpen, false);
    p.button.dispatch("pointerover", { bubbles: true, pointerType: "touch", relatedTarget: p.outside });
    clock.advance(5000);
    assert.equal(p.content.popoverOpen, false, "touch hover is ignored");
  });
});

test("tooltip: moving the pointer onto the content keeps it open (hoverable)", async () => {
  const { attach, showTooltip } = await load("tooltip");
  const p = tooltipPage();
  attach(p.root);
  showTooltip(p.root);
  p.button.dispatch("pointerout", { bubbles: true, relatedTarget: p.content });
  assert.equal(p.content.popoverOpen, true);
  p.content.dispatch("pointerout", { bubbles: true, relatedTarget: p.outside });
  assert.equal(p.content.popoverOpen, false);
});

test("tooltip: keyboard focus shows at once; Escape dismisses wherever focus is; pointer down dismisses; side flips when there is no room above", async () => {
  const { attach } = await load("tooltip");
  const p = tooltipPage();
  attach(p.root);
  p.button.dispatch("focusin", { bubbles: true });
  assert.equal(p.content.popoverOpen, true);
  assert.equal(p.root.getAttribute("data-side"), "top");
  p.outside.focus();
  p.outside.dispatch("keydown", { bubbles: true, key: "Escape" });
  assert.equal(p.content.popoverOpen, false, "Escape with focus elsewhere");
  p.button.dispatch("focusin", { bubbles: true });
  p.button.dispatch("pointerdown", { bubbles: true });
  assert.equal(p.content.popoverOpen, false);
  p.trigger.rect = { ...p.trigger.rect, top: 4, bottom: 24 }; // not enough room above for a 24px tooltip
  p.button.dispatch("focusin", { bubbles: true });
  assert.equal(p.root.getAttribute("data-side"), "bottom");
});

// ---- popover
const popoverPage = () => {
  const doc = new Doc();
  const root = make(doc, "div", { "data-fgu": "popover", "data-part": "root" });
  const trigger = make(doc, "button", { "data-part": "trigger", id: "pt" });
  const panel = make(doc, "div", { "data-part": "panel", id: "pp" });
  const first = make(doc, "input");
  panel.append(first);
  root.append(trigger, panel);
  trigger.rect = { left: 10, top: 10, width: 60, height: 30, right: 70, bottom: 40 };
  panel.rect = { left: 0, top: 0, width: 100, height: 50, right: 100, bottom: 50 };
  const outside = make(doc, "button");
  doc.body = make(doc, "body");
  doc.body.append(outside, root);
  return { doc, root, trigger, panel, first, outside };
};

test("popover attach: trigger and panel are wired, open moves focus in and reports popoverchange, close reports false", async () => {
  const { attach, openPopover, closePopover } = await load("popover");
  const p = popoverPage();
  const seen = [];
  p.root.addEventListener("popoverchange", (e) => seen.push(e.detail));
  attach(p.root);
  assert.equal(p.trigger.getAttribute("aria-haspopup"), "dialog");
  assert.equal(p.trigger.getAttribute("aria-controls"), "pp");
  assert.equal(p.panel.getAttribute("role"), "dialog");
  assert.equal(p.panel.getAttribute("popover"), "auto");
  openPopover(p.root);
  assert.equal(p.trigger.getAttribute("aria-expanded"), "true");
  assert.equal(p.doc.activeElement, p.first, "focus into the panel");
  assert.equal(p.root.getAttribute("data-side"), "bottom");
  assert.equal(p.panel.style.props["--pop-y"], "40px");
  closePopover(p.trigger);
  assert.equal(p.trigger.getAttribute("aria-expanded"), "false");
  assert.deepEqual(seen, [true, false]);
  assert.equal(popoverPage().trigger.getAttribute("aria-haspopup"), null, "negative control");
});

test("popover: focus leaving the panel for somewhere else closes it, focus inside the root does not", async () => {
  const { attach, openPopover } = await load("popover");
  const p = popoverPage();
  attach(p.root);
  openPopover(p.root);
  p.first.dispatch("focusout", { bubbles: true, relatedTarget: p.trigger });
  assert.equal(p.panel.popoverOpen, true, "to the trigger: stays");
  p.first.dispatch("focusout", { bubbles: true, relatedTarget: p.outside });
  assert.equal(p.panel.popoverOpen, false);
});

// ---- select
const selectPage = ({ search = false } = {}) => {
  const doc = new Doc();
  const root = make(doc, "div", { "data-fgu": "select", "data-part": "root", "data-variant": "listbox" });
  const trigger = make(doc, "button", { "data-part": "trigger" });
  const display = make(doc, "span", { "data-part": "display", "data-placeholder": "Choose" });
  trigger.append(display);
  const list = make(doc, "div", { "data-part": "listbox", id: "sl" });
  const searchBox = search ? make(doc, "input", { "data-part": "search" }) : null;
  if (searchBox) { searchBox.value = ""; list.append(searchBox); }
  const names = [["design", "Design"], ["finance", "Finance"], ["legal", "Legal"], ["platform", "Platform"]];
  const options = names.map(([v, l]) => make(doc, "div", { "data-part": "option", "data-value": v, "aria-selected": "false", ...(v === "legal" ? { "aria-disabled": "true" } : {}) }, l));
  const empty = make(doc, "div", { "data-part": "empty", hidden: "" });
  list.append(...options, empty);
  const hidden = make(doc, "input", { "data-part": "value" });
  hidden.value = "";
  root.append(trigger, list, hidden);
  const outside = make(doc, "button");
  doc.body = make(doc, "body"); doc.body.append(outside, root);
  return { doc, root, trigger, display, list, options, empty, hidden, searchBox };
};

test("select attach: combobox wiring and the placeholder in the display part", async () => {
  const { attach } = await load("select");
  const p = selectPage();
  attach(p.root);
  assert.equal(p.trigger.getAttribute("role"), "combobox");
  assert.equal(p.trigger.getAttribute("aria-haspopup"), "listbox");
  assert.equal(p.list.getAttribute("popover"), "auto");
  assert.ok(p.options.every((o) => o.getAttribute("role") === "option"));
  assert.equal(p.display.textContent, "Choose");
  assert.equal(p.display.hasAttribute("data-empty"), true);
  assert.equal(selectPage().trigger.getAttribute("role"), null, "negative control");
});

test("select: clicking an option selects it, writes the display and the hidden value, reports selectchange and closes", async () => {
  const { attach } = await load("select");
  const p = selectPage();
  const seen = [];
  p.root.addEventListener("selectchange", (e) => seen.push(e.detail));
  attach(p.root);
  p.list.showPopover();
  clicks(p.options[1]);
  assert.equal(p.options[1].getAttribute("aria-selected"), "true");
  assert.equal(p.display.textContent, "Finance");
  assert.equal(p.hidden.value, "finance");
  assert.deepEqual(seen, ["finance"]);
  assert.equal(p.list.popoverOpen, false, "closed after choosing");
  clicks(p.options[1]);
  assert.deepEqual(seen, ["finance"], "choosing the same option again is not a change");
  clicks(p.options[2]); // aria-disabled
  assert.equal(p.options[2].getAttribute("aria-selected"), "false");
});

test("select: opening focuses the selected option; arrows, Home and End skip disabled ones; Enter selects; typeahead jumps", async () => {
  const { attach, selectValue } = await load("select");
  const p = selectPage();
  attach(p.root);
  selectValue(p.root, "finance");
  p.list.showPopover();
  assert.equal(p.doc.activeElement, p.options[1], "the selected option");
  keys(p.options[1], "ArrowDown");
  assert.equal(p.doc.activeElement, p.options[3], "Legal is disabled: skipped");
  keys(p.options[3], "Home");
  assert.equal(p.doc.activeElement, p.options[0]);
  keys(p.options[0], "End");
  assert.equal(p.doc.activeElement, p.options[3]);
  keys(p.options[3], "d");
  assert.equal(p.doc.activeElement, p.options[0], "typeahead d -> Design");
  keys(p.options[0], "Enter");
  assert.equal(p.options[0].getAttribute("aria-selected"), "true");
});

test("select: the search field filters options, shows the empty part, and ArrowDown goes from it to the first visible option", async () => {
  const { attach } = await load("select");
  const p = selectPage({ search: true });
  attach(p.root);
  p.list.showPopover();
  assert.equal(p.doc.activeElement, p.searchBox, "focus starts in the search field");
  p.searchBox.value = "pl";
  p.searchBox.dispatch("input", { bubbles: true });
  assert.deepEqual(p.options.map((o) => o.hidden), [true, true, true, false]);
  assert.equal(p.empty.hidden, true);
  keys(p.searchBox, "ArrowDown");
  assert.equal(p.doc.activeElement, p.options[3]);
  p.searchBox.value = "zzz";
  p.searchBox.dispatch("input", { bubbles: true });
  assert.equal(p.empty.hidden, false);
});

test("select: selectValue sets the choice without an event; undefined clears it; a native control reports change", async () => {
  const { attach, selectValue } = await load("select");
  const p = selectPage();
  const seen = [];
  p.root.addEventListener("selectchange", (e) => seen.push(e.detail));
  attach(p.root);
  selectValue(p.root, "platform");
  assert.equal(p.display.textContent, "Platform");
  assert.deepEqual(seen, []);
  selectValue(p.root, undefined);
  assert.equal(p.display.textContent, "Choose");
  const doc = new Doc();
  const root = make(doc, "div", { "data-fgu": "select", "data-part": "root", "data-variant": "native" });
  const control = make(doc, "select", { "data-part": "control" });
  control.value = "paid";
  root.append(control);
  const nativeSeen = [];
  root.addEventListener("selectchange", (e) => nativeSeen.push(e.detail));
  attach(root);
  control.dispatch("change", { bubbles: true });
  assert.deepEqual(nativeSeen, ["paid"]);
  selectValue(root, "open");
  assert.equal(control.value, "open");
});

// ---- table
const tablePage = () => {
  const doc = new Doc();
  const root = make(doc, "div", { "data-fgu": "table", "data-part": "root" });
  const table = make(doc, "table", { "data-part": "table" });
  const head = make(doc, "thead", { "data-part": "head" });
  const hrow = make(doc, "tr", { "data-part": "row" });
  const all = make(doc, "input", { "data-part": "select" });
  const thAll = make(doc, "th", { "data-part": "header" });
  thAll.append(all);
  const mk = (key, sort) => { const th = make(doc, "th", { "data-part": "header", "data-key": key, "aria-sort": sort }); const b = make(doc, "button", { "data-part": "sort" }); th.append(b); return { th, b }; };
  const due = mk("due", "none"), amount = mk("amount", "ascending");
  hrow.append(thAll, due.th, amount.th);
  head.append(hrow);
  const body = make(doc, "tbody", { "data-part": "body" });
  const rows = ["A", "B", "C"].map((id) => {
    const tr = make(doc, "tr", { "data-part": "row", "data-row-id": id, "aria-selected": "false" });
    const box = make(doc, "input", { "data-part": "select" });
    box.checked = false;
    const td = make(doc, "td", { "data-part": "cell" });
    td.append(box); tr.append(td); body.append(tr);
    return { tr, box };
  });
  all.checked = false; all.indeterminate = false;
  table.append(head, body);
  root.append(table);
  doc.body = make(doc, "body"); doc.body.append(root);
  return { doc, root, all, due, amount, rows };
};

test("table: a sort button moves aria-sort, reports key:direction and cycles ascending <-> descending", async () => {
  const { attach } = await load("table");
  const p = tablePage();
  const seen = [];
  p.root.addEventListener("sortchange", (e) => seen.push(e.detail));
  attach(p.root);
  clicks(p.due.b);
  assert.equal(p.due.th.getAttribute("aria-sort"), "ascending");
  assert.equal(p.amount.th.getAttribute("aria-sort"), "none", "the previous column is reset");
  clicks(p.due.b);
  assert.equal(p.due.th.getAttribute("aria-sort"), "descending");
  assert.deepEqual(seen, ["due:ascending", "due:descending"]);
});

test("table: row checkboxes set aria-selected and the mixed head state; the head checkbox selects and clears all; the event carries the ids", async () => {
  const { attach } = await load("table");
  const p = tablePage();
  const seen = [];
  p.root.addEventListener("selectionchange", (e) => seen.push(e.detail));
  attach(p.root);
  p.rows[1].box.checked = true;
  p.rows[1].box.dispatch("change", { bubbles: true });
  assert.equal(p.rows[1].tr.getAttribute("aria-selected"), "true");
  assert.equal(p.all.indeterminate, true);
  assert.equal(p.all.checked, false);
  p.all.checked = true;
  p.all.dispatch("change", { bubbles: true });
  assert.ok(p.rows.every((r) => r.box.checked && r.tr.getAttribute("aria-selected") === "true"));
  assert.equal(p.all.indeterminate, false);
  p.all.checked = false;
  p.all.dispatch("change", { bubbles: true });
  assert.ok(p.rows.every((r) => !r.box.checked));
  assert.deepEqual(seen, [["B"], ["A", "B", "C"], []]);
});

test("table: syncSelection(ids) checks exactly those rows without an event", async () => {
  const { attach, syncSelection } = await load("table");
  const p = tablePage();
  const seen = [];
  p.root.addEventListener("selectionchange", (e) => seen.push(e.detail));
  attach(p.root);
  syncSelection(p.root, ["A", "C"]);
  assert.deepEqual(p.rows.map((r) => r.box.checked), [true, false, true]);
  assert.equal(p.rows[0].tr.getAttribute("aria-selected"), "true");
  assert.equal(p.all.indeterminate, true);
  syncSelection(p.root, []);
  assert.ok(p.rows.every((r) => !r.box.checked));
  assert.deepEqual(seen, []);
});

// ---- ArrowUp with nothing focused lands on the last item
test("select: ArrowUp from the search field goes to the last option, ArrowDown to the first", async () => {
  const { attach } = await load("select");
  const p = selectPage({ search: true });
  attach(p.root);
  p.list.showPopover();
  keys(p.searchBox, "ArrowUp");
  assert.equal(p.doc.activeElement, p.options[3], "the last enabled option, not the one before it");
  p.searchBox.focus();
  keys(p.searchBox, "ArrowDown");
  assert.equal(p.doc.activeElement, p.options[0]);
});

test("menu: ArrowUp inside the list with no item focused goes to the last item", async () => {
  const { attach } = await load("menu");
  const doc = new Doc();
  const root = make(doc, "div", { "data-fgu": "menu", "data-part": "root" });
  const trigger = make(doc, "button", { "data-part": "trigger", id: "mt" });
  const list = make(doc, "div", { "data-part": "list", id: "ml" });
  const items = ["A", "B", "C"].map((t) => make(doc, "button", { "data-part": "item" }, t));
  list.append(...items);
  root.append(trigger, list);
  doc.body = make(doc, "body"); doc.body.append(root);
  attach(root);
  list.showPopover();
  items[0].focus();
  doc.activeElement = list; // focus on the list itself: no current item
  keys(list, "ArrowUp");
  assert.equal(doc.activeElement, items[2]);
});
