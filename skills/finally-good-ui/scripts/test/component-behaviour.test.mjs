import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { SR } from "./_h.mjs";
import { Doc, make } from "./_fakedom.mjs";

// Behaviour of the reference scripts against a fake DOM with real capture/bubble dispatch.
// Every test has a negative control: the same action without the behaviour (or with it detached) must not give the result.
const load = (name) => import(join(SR, "components", name, `${name}.js`));

// ---- dialog
const dialogPage = ({ backdropClose = false } = {}) => {
  const doc = new Doc();
  const root = make(doc, "div");
  const opener = make(doc, "button", { "data-dialog-open": "d1", id: "o1" });
  const dlg = make(doc, "dialog", { "data-part": "root", id: "d1", ...(backdropClose ? { "data-backdrop-close": "" } : {}) });
  const title = make(doc, "h2", { "data-part": "title" });
  const desc = make(doc, "p", { "data-part": "description" });
  const close = make(doc, "button", { "data-part": "close" });
  const cancel = make(doc, "button", { "data-dialog-close": "" });
  dlg.append(title, desc, close, cancel);
  root.append(opener, dlg);
  dlg.rect = { left: 100, top: 100, right: 300, bottom: 300, width: 200, height: 200 };
  const click = (el, init = {}) => el.dispatch("click", { bubbles: true, ...init });
  return { doc, root, opener, dlg, title, desc, close, cancel, click };
};

test("dialog attach: labels the dialog by its title and description, keeps ids already there", async () => {
  const { attach } = await load("dialog");
  const p = dialogPage();
  p.desc.id = "mine";
  attach(p.root);
  assert.equal(p.dlg.getAttribute("aria-labelledby"), p.title.id);
  assert.ok(p.title.id, "title got an id");
  assert.equal(p.dlg.getAttribute("aria-describedby"), "mine");
  const plain = dialogPage();
  assert.equal(plain.dlg.getAttribute("aria-labelledby"), null, "negative control: nothing is wired before attach");
});

test("dialog attach: the opener shows the dialog modally and closing returns focus to it", async () => {
  const { attach } = await load("dialog");
  const p = dialogPage();
  attach(p.root);
  p.opener.focus();
  p.click(p.opener);
  assert.equal(p.dlg.hasAttribute("open"), true);
  assert.equal(p.dlg.modal, true, "showModal, not show");
  p.cancel.focus(); // the platform moves focus into the dialog
  p.click(p.close);
  assert.equal(p.dlg.hasAttribute("open"), false);
  assert.equal(p.doc.activeElement, p.opener, "focus restored to the opener");
});

test("dialog attach: Escape (the native close) restores focus too, and a second open does not throw", async () => {
  const { attach } = await load("dialog");
  const p = dialogPage();
  attach(p.root);
  p.opener.focus();
  p.click(p.opener);
  p.click(p.opener); // already open: showModal would throw in a browser
  p.cancel.focus();
  p.dlg.close(); // what the platform does on Escape
  assert.equal(p.doc.activeElement, p.opener);
});

test("dialog attach: without attach nothing opens or restores (negative control)", async () => {
  const p = dialogPage();
  p.opener.focus();
  p.click(p.opener);
  assert.equal(p.dlg.hasAttribute("open"), false);
});

test("dialog attach: backdrop click closes only when data-backdrop-close is set and the click is outside the box", async () => {
  const { attach } = await load("dialog");
  for (const [backdropClose, init, target, expectOpen] of [
    [true, { clientX: 10, clientY: 10 }, "dlg", false],
    [true, { clientX: 150, clientY: 150 }, "dlg", true],
    [true, { clientX: 10, clientY: 10 }, "title", true],
    [false, { clientX: 10, clientY: 10 }, "dlg", true],
  ]) {
    const p = dialogPage({ backdropClose });
    attach(p.root);
    p.dlg.setAttribute("open", "");
    p.click(p[target], init);
    assert.equal(p.dlg.hasAttribute("open"), expectOpen, JSON.stringify({ backdropClose, init, target }));
  }
});

test("dialog attach: detach removes every listener and stops reacting", async () => {
  const { attach } = await load("dialog");
  const p = dialogPage();
  const detach = attach(p.root);
  assert.ok(p.root.listenerCount() > 0, "positive control: listeners were added");
  detach();
  assert.equal(p.root.listenerCount(), 0);
  p.click(p.opener);
  assert.equal(p.dlg.hasAttribute("open"), false);
});

// ---- menu
const menuPage = () => {
  const doc = new Doc();
  const root = make(doc, "div", { "data-part": "root" });
  const trigger = make(doc, "button", { "data-part": "trigger", id: "t1" });
  const list = make(doc, "div", { "data-part": "list", role: "menu", id: "m1" });
  const labels = ["Rename", "Duplicate", "Move", "Delete"];
  const items = labels.map((l) => make(doc, "button", { "data-part": "item", ...(l === "Move" ? { "aria-disabled": "true" } : {}) }, l));
  list.append(...items);
  root.append(trigger, list);
  trigger.rect = { left: 40, bottom: 80, top: 50, right: 120, width: 80, height: 30 };
  const key = (el, k, init = {}) => el.dispatch("keydown", { bubbles: true, key: k, timeStamp: 0, ...init });
  const click = (el) => el.dispatch("click", { bubbles: true });
  const open = () => click(trigger);
  return { doc, root, trigger, list, items, key, click, open };
};

test("menu attach: wires the trigger, the list and the items where the markup left them out", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  assert.equal(p.trigger.getAttribute("aria-haspopup"), "menu");
  assert.equal(p.trigger.getAttribute("aria-expanded"), "false");
  assert.equal(p.trigger.getAttribute("aria-controls"), "m1");
  assert.equal(p.list.getAttribute("aria-labelledby"), "t1");
  assert.equal(p.list.hasAttribute("popover"), true);
  for (const item of p.items) { assert.equal(item.getAttribute("role"), "menuitem"); assert.equal(item.getAttribute("tabindex"), "-1"); }
  assert.equal(menuPage().list.hasAttribute("popover"), false, "negative control: untouched without attach");
});

test("menu attach: opening focuses the first item, places the list under the trigger and sets aria-expanded", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  assert.equal(p.list.popoverOpen, true);
  assert.equal(p.trigger.getAttribute("aria-expanded"), "true");
  assert.equal(p.doc.activeElement, p.items[0]);
  assert.deepEqual([p.list.style.props["--menu-x"], p.list.style.props["--menu-y"]], ["40px", "80px"]);
});

test("menu attach: ArrowDown on the trigger opens on the first item, ArrowUp on the last", async () => {
  const { attach } = await load("menu");
  for (const [k, at] of [["ArrowDown", 0], ["ArrowUp", 3]]) {
    const p = menuPage();
    attach(p.root);
    const ev = p.key(p.trigger, k);
    assert.equal(ev.defaultPrevented, true);
    assert.equal(p.doc.activeElement, p.items[at], k);
  }
});

test("menu attach: arrows wrap, Home and End jump, and the focused item is the only tab stop", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  p.key(p.items[0], "ArrowUp");
  assert.equal(p.doc.activeElement, p.items[3], "ArrowUp from the first wraps to the last");
  p.key(p.items[3], "ArrowDown");
  assert.equal(p.doc.activeElement, p.items[0], "ArrowDown from the last wraps to the first");
  p.key(p.items[0], "End");
  assert.equal(p.doc.activeElement, p.items[3]);
  p.key(p.items[3], "Home");
  assert.equal(p.doc.activeElement, p.items[0]);
  p.key(p.items[0], "ArrowDown");
  assert.deepEqual(p.items.map((i) => i.getAttribute("tabindex")), ["-1", "0", "-1", "-1"], "roving tabindex");
  assert.equal(p.items[2].getAttribute("aria-disabled"), "true");
  p.key(p.items[1], "ArrowDown");
  assert.equal(p.doc.activeElement, p.items[2], "a disabled item still receives focus");
});

test("menu attach: typeahead jumps by prefix, extends within the window, cycles on a repeated letter", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  const type = (k, t) => p.key(p.doc.activeElement, k, { timeStamp: t });
  type("d", 1000);
  assert.equal(p.doc.activeElement, p.items[1], "d -> Duplicate");
  type("e", 1200);
  assert.equal(p.doc.activeElement, p.items[3], "de -> Delete (typed within the window)");
  type("r", 5000);
  assert.equal(p.doc.activeElement, p.items[0], "after the window the search restarts: r -> Rename");
  type("d", 9000);
  assert.equal(p.doc.activeElement, p.items[1]);
  type("d", 9100);
  assert.equal(p.doc.activeElement, p.items[3], "dd cycles to the next item starting with d");
  type("z", 9200);
  assert.equal(p.doc.activeElement, p.items[3], "no match keeps focus");
});

test("menu attach: Escape closes, returns focus to the trigger and stays inside the menu", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  p.key(p.items[1], "ArrowDown");
  const ev = p.key(p.items[2], "Escape");
  assert.equal(p.list.popoverOpen, false);
  assert.equal(p.trigger.getAttribute("aria-expanded"), "false");
  assert.equal(p.doc.activeElement, p.trigger);
  assert.equal(ev.defaultPrevented, true);
  assert.equal(ev.stopped, true, "an enclosing dialog must not also close");
  const idle = menuPage();
  idle.list.showPopover();
  const e2 = idle.key(idle.items[0], "Escape");
  assert.equal(idle.list.popoverOpen, true, "negative control: nothing happens without attach");
  assert.equal(e2.stopped, false);
});

test("menu attach: Tab closes without pulling focus back to the trigger", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  const ev = p.key(p.items[0], "Tab");
  assert.equal(p.list.popoverOpen, false);
  assert.equal(ev.defaultPrevented, false, "Tab keeps its native move");
  assert.notEqual(p.doc.activeElement, p.trigger);
});

test("menu attach: activating an item closes and returns focus; a disabled item is swallowed and keeps the menu open", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  let reached = 0;
  p.items[2].addEventListener("click", () => reached++);
  p.items[0].addEventListener("click", () => reached += 10);
  p.open();
  const dead = p.click(p.items[2]);
  assert.equal(p.list.popoverOpen, true, "disabled item does not close");
  assert.equal(dead.defaultPrevented, true);
  assert.equal(reached, 0, "the item's own handler never ran");
  p.click(p.items[0]);
  assert.equal(reached, 10, "an enabled item's own handler still runs");
  assert.equal(p.list.popoverOpen, false);
  assert.equal(p.doc.activeElement, p.trigger);
});

test("menu attach: native light dismiss (toggle to closed) syncs aria-expanded", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  attach(p.root);
  p.open();
  assert.equal(p.trigger.getAttribute("aria-expanded"), "true");
  p.list.hidePopover(); // outside click closes natively
  assert.equal(p.trigger.getAttribute("aria-expanded"), "false");
});

test("menu attach: detach removes every listener and stops reacting", async () => {
  const { attach } = await load("menu");
  const p = menuPage();
  const detach = attach(p.root);
  assert.ok(p.root.listenerCount() > 0, "positive control");
  detach();
  assert.equal(p.root.listenerCount(), 0);
  p.open();
  assert.equal(p.list.popoverOpen, false);
});

// ---- tabs
const tabsPage = ({ controls = true, selected = null, orientation = null } = {}) => {
  const doc = new Doc();
  const root = make(doc, "div", { "data-part": "root" });
  const list = make(doc, "div", { "data-part": "list", role: "tablist", "aria-label": "Views", ...(orientation ? { "aria-orientation": orientation } : {}) });
  const names = ["open", "paid", "void"];
  const tabs = names.map((n, i) => make(doc, "button", { "data-part": "tab", id: `tab-${n}`, ...(controls ? { "aria-controls": `panel-${n}` } : {}), ...(selected === i ? { "aria-selected": "true" } : {}) }, n));
  const indicator = make(doc, "span", { "data-part": "indicator", "aria-hidden": "true" });
  const panels = names.map((n) => make(doc, "div", { "data-part": "panel", id: `panel-${n}` }));
  list.append(...tabs, indicator);
  root.append(list, ...panels);
  list.rect = { left: 10, width: 300, top: 0, height: 40, right: 310, bottom: 40 };
  tabs.forEach((t, i) => { t.rect = { left: 10 + i * 100, width: 100, top: 0, height: 40, right: 110 + i * 100, bottom: 40 }; });
  const key = (el, k) => el.dispatch("keydown", { bubbles: true, key: k });
  const click = (el) => el.dispatch("click", { bubbles: true });
  const state = () => ({ selected: tabs.map((t) => t.getAttribute("aria-selected")), tab: tabs.map((t) => t.getAttribute("tabindex")), hidden: panels.map((p) => p.hidden) });
  return { doc, root, list, tabs, panels, indicator, key, click, state };
};

test("tabs attach: first tab selected by default, one tab stop, other panels hidden, roles and ids wired", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage({ controls: false });
  attach(p.root);
  assert.deepEqual(p.state(), { selected: ["true", "false", "false"], tab: ["0", "-1", "-1"], hidden: [false, true, true] });
  assert.ok(p.tabs.every((t) => t.getAttribute("role") === "tab"));
  assert.ok(p.panels.every((q) => q.getAttribute("role") === "tabpanel" && q.getAttribute("tabindex") === "0"));
  assert.equal(p.tabs[1].getAttribute("aria-controls"), "panel-paid", "paired by order when aria-controls is missing");
  assert.equal(p.panels[1].getAttribute("aria-labelledby"), "tab-paid");
  assert.equal(tabsPage().tabs[0].getAttribute("role"), null, "negative control: untouched without attach");
});

test("tabs attach: honours the tab the markup marks selected", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage({ selected: 1 });
  attach(p.root);
  assert.deepEqual(p.state().selected, ["false", "true", "false"]);
  assert.deepEqual(p.state().hidden, [true, false, true]);
});

test("tabs attach: click selects, shows its panel and focuses the tab", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage();
  attach(p.root);
  p.click(p.tabs[2]);
  assert.deepEqual(p.state(), { selected: ["false", "false", "true"], tab: ["-1", "-1", "0"], hidden: [true, true, false] });
  assert.equal(p.doc.activeElement, p.tabs[2]);
});

test("tabs attach: arrows move and select with wrapping, Home and End jump (automatic activation)", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage();
  attach(p.root);
  p.tabs[0].focus();
  const ev = p.key(p.tabs[0], "ArrowRight");
  assert.equal(ev.defaultPrevented, true);
  assert.deepEqual([p.doc.activeElement, p.tabs[1].getAttribute("aria-selected"), p.panels[1].hidden], [p.tabs[1], "true", false]);
  p.key(p.tabs[1], "ArrowLeft");
  p.key(p.tabs[0], "ArrowLeft");
  assert.equal(p.doc.activeElement, p.tabs[2], "ArrowLeft from the first wraps to the last");
  p.key(p.tabs[2], "ArrowRight");
  assert.equal(p.doc.activeElement, p.tabs[0], "ArrowRight from the last wraps to the first");
  p.key(p.tabs[0], "End");
  assert.equal(p.tabs[2].getAttribute("aria-selected"), "true");
  p.key(p.tabs[2], "Home");
  assert.deepEqual(p.state().selected, ["true", "false", "false"]);
  const other = p.key(p.tabs[0], "ArrowDown");
  assert.equal(other.defaultPrevented, false, "ArrowDown is not a horizontal tabs key");
});

test("tabs attach: a vertical tablist uses ArrowUp and ArrowDown only", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage({ orientation: "vertical" });
  attach(p.root);
  p.key(p.tabs[0], "ArrowRight");
  assert.equal(p.tabs[0].getAttribute("aria-selected"), "true", "ArrowRight ignored");
  p.key(p.tabs[0], "ArrowDown");
  assert.equal(p.tabs[1].getAttribute("aria-selected"), "true");
  p.key(p.tabs[1], "ArrowUp");
  assert.equal(p.tabs[0].getAttribute("aria-selected"), "true");
});

test("tabs attach: in a right-to-left list ArrowLeft goes to the next tab", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage();
  p.doc.defaultView.getComputedStyle = () => ({ direction: "rtl" });
  attach(p.root);
  p.key(p.tabs[0], "ArrowLeft");
  assert.equal(p.tabs[1].getAttribute("aria-selected"), "true");
});

test("tabs attach: the indicator follows the selected tab with transform variables, ready after the first paint", async () => {
  const { attach } = await load("tabs");
  const frames = [];
  const seen = { ro: null };
  globalThis.requestAnimationFrame = (f) => { frames.push(f); return frames.length; };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class { constructor(f) { this.f = f; seen.ro = this; } observe(el) { this.el = el; } disconnect() { this.gone = true; } };
  try {
    const p = tabsPage();
    const detach = attach(p.root);
    assert.deepEqual([p.list.style.props["--indicator-x"], p.list.style.props["--indicator-scale"]], ["0px", String(100 / 300)]);
    assert.equal(p.list.hasAttribute("data-ready"), false, "no transition on the first measure");
    frames.forEach((f) => f());
    assert.equal(p.list.hasAttribute("data-ready"), true);
    p.click(p.tabs[2]);
    assert.equal(p.list.style.props["--indicator-x"], "200px");
    assert.equal(seen.ro.el, p.list, "resizes re-measure");
    detach();
    assert.equal(seen.ro.gone, true, "the observer is disconnected on detach");
    assert.equal(p.root.listenerCount(), 0);
  } finally {
    delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame; delete globalThis.ResizeObserver;
  }
});

test("tabs attach: detach stops reacting", async () => {
  const { attach } = await load("tabs");
  const p = tabsPage();
  const detach = attach(p.root);
  assert.ok(p.root.listenerCount() > 0, "positive control");
  detach();
  p.click(p.tabs[1]);
  assert.equal(p.tabs[1].getAttribute("aria-selected"), "false");
});

// ---- toast
// A controllable clock: attach reads setTimeout, clearTimeout and Date.now at call time.
const withClock = async (fn) => {
  const real = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, now: Date.now, MutationObserver: globalThis.MutationObserver, CustomEvent: globalThis.CustomEvent };
  let t = 0, id = 0;
  const timers = new Map();
  const observers = [];
  globalThis.setTimeout = (f, ms) => { timers.set(++id, { f, at: t + ms }); return id; };
  globalThis.clearTimeout = (h) => { timers.delete(h); };
  Date.now = () => t;
  globalThis.MutationObserver = class { constructor(f) { this.f = f; observers.push(this); } observe(el, o) { this.el = el; this.o = o; } disconnect() { this.gone = true; } };
  const clock = {
    pending: () => timers.size,
    observer: () => observers[0],
    advance(ms) {
      const end = t + ms;
      for (;;) {
        const next = [...timers].filter(([, v]) => v.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]); t = next[1].at; next[1].f();
      }
      t = end;
    },
  };
  try { return await fn(clock); }
  finally { Object.assign(globalThis, { setTimeout: real.setTimeout, clearTimeout: real.clearTimeout, MutationObserver: real.MutationObserver }); Date.now = real.now; if (!real.MutationObserver) delete globalThis.MutationObserver; }
};

const toastPage = ({ toasts = [{}], duration = "0s" } = {}) => {
  const doc = new Doc();
  doc.defaultView.getComputedStyle = () => ({ transitionDuration: duration });
  const root = make(doc, "div", { "data-part": "root", role: "status" });
  const outside = make(doc, "button", { id: "outside" });
  const made = toasts.map((attrs, i) => {
    const toast = make(doc, "div", { "data-part": "toast", ...attrs });
    const message = make(doc, "p", { "data-part": "message" }, `message ${i}`);
    const dismiss = make(doc, "button", { "data-part": "dismiss", "aria-label": "Dismiss" });
    toast.append(message, dismiss);
    root.append(toast);
    return { toast, dismiss };
  });
  doc.body = make(doc, "body");
  doc.body.append(outside, root);
  const leaving = (i = 0) => made[i].toast.hasAttribute("data-leaving");
  const gone = (i = 0) => made[i].toast.removed;
  return { doc, root, outside, made, leaving, gone };
};

test("toast attach: auto-dismisses after the reading time, 5 seconds by default, and removes the toast", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage();
    attach(p.root);
    clock.advance(4999);
    assert.equal(p.leaving(), false, "still there just before the timeout");
    clock.advance(1);
    assert.equal(p.gone(), true);
  });
});

test("toast attach: data-timeout sets the delay, 0 keeps the toast until dismissed, an error never auto-dismisses", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage({ toasts: [{ "data-timeout": "8000" }, { "data-timeout": "0" }, { "data-variant": "error" }, { "data-variant": "error", "data-timeout": "9000" }] });
    attach(p.root);
    clock.advance(7999);
    assert.deepEqual([0, 1, 2, 3].map((i) => p.gone(i)), [false, false, false, false]);
    clock.advance(1);
    assert.deepEqual([0, 1, 2, 3].map((i) => p.gone(i)), [true, false, false, false]);
    clock.advance(1000);
    assert.deepEqual([0, 1, 2, 3].map((i) => p.gone(i)), [true, false, false, true], "an explicit timeout wins for an error");
    clock.advance(10 ** 7);
    assert.deepEqual([1, 2].map((i) => p.gone(i)), [false, false]);
  });
});

test("toast attach: an error toast is announced as an alert, a plain one is not", async () => {
  const { attach } = await load("toast");
  await withClock(async () => {
    const p = toastPage({ toasts: [{}, { "data-variant": "error" }] });
    attach(p.root);
    assert.equal(p.made[1].toast.getAttribute("role"), "alert");
    assert.equal(p.made[0].toast.getAttribute("role"), null);
  });
});

test("toast attach: hovering pauses the countdown and leaving resumes it with the time that was left", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage();
    attach(p.root);
    clock.advance(3000);
    p.root.dispatch("pointerenter");
    clock.advance(60000);
    assert.equal(p.gone(), false, "paused while hovered");
    p.root.dispatch("pointerleave");
    clock.advance(1999);
    assert.equal(p.gone(), false, "2000 ms were left, not a fresh 5000");
    clock.advance(1);
    assert.equal(p.gone(), true);
  });
  await withClock(async (clock) => { // negative control: without a pause the toast is gone at 5000
    const p = toastPage();
    attach(p.root);
    clock.advance(5000);
    assert.equal(p.gone(), true);
  });
});

test("toast attach: focus inside pauses too, and the countdown waits for both hover and focus to end", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage();
    attach(p.root);
    clock.advance(1000);
    p.made[0].dismiss.dispatch("focusin", { bubbles: true, relatedTarget: p.outside });
    p.root.dispatch("pointerenter");
    clock.advance(20000);
    assert.equal(p.gone(), false);
    p.made[0].dismiss.dispatch("focusout", { bubbles: true, relatedTarget: p.outside });
    clock.advance(20000);
    assert.equal(p.gone(), false, "still hovered");
    p.root.dispatch("pointerleave");
    clock.advance(3999);
    assert.equal(p.gone(), false);
    clock.advance(1);
    assert.equal(p.gone(), true);
  });
});

test("toast attach: the dismiss button removes its toast at once and cancels its timer", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage({ toasts: [{}, {}] });
    attach(p.root);
    const before = clock.pending();
    p.made[0].dismiss.dispatch("click", { bubbles: true });
    assert.equal(p.gone(0), true);
    assert.equal(p.gone(1), false, "the other toast stays");
    assert.equal(clock.pending(), before - 1, "its timer is cleared");
  });
});

test("toast attach: with a leave animation the toast is marked leaving, then removed on transitionend or the fallback", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage({ duration: "0.15s" });
    attach(p.root);
    p.made[0].dismiss.dispatch("click", { bubbles: true });
    assert.equal(p.leaving(), true);
    assert.equal(p.gone(), false, "kept while it animates out");
    p.made[0].toast.dispatch("transitionend", { bubbles: true });
    assert.equal(p.gone(), true);
  });
  await withClock(async (clock) => {
    const p = toastPage({ duration: "0.15s" });
    attach(p.root);
    p.made[0].dismiss.dispatch("click", { bubbles: true });
    clock.advance(150);
    assert.equal(p.gone(), false, "grace period for transitionend");
    clock.advance(100);
    assert.equal(p.gone(), true, "fallback when no transition ever ends (reduced motion)");
  });
});

test("toast attach: the app can cancel the dismiss event to own the removal", async () => {
  const { attach } = await load("toast");
  await withClock(async () => {
    const p = toastPage();
    attach(p.root);
    let seen = 0;
    p.root.addEventListener("dismiss", (e) => { seen++; e.preventDefault(); });
    p.made[0].dismiss.dispatch("click", { bubbles: true });
    assert.equal(seen, 1);
    assert.equal(p.gone(), false, "the framework removes it from its own state");
    assert.equal(p.leaving(), true);
  });
});

test("toast attach: a toast added later gets its own countdown", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage({ toasts: [] });
    attach(p.root);
    const late = make(p.doc, "div", { "data-part": "toast" });
    p.root.append(late);
    clock.observer().f([{ addedNodes: [late] }]);
    clock.advance(5000);
    assert.equal(late.removed, true);
    const missed = make(p.doc, "div", { "data-part": "toast" });
    p.root.append(missed);
    clock.advance(10 ** 6);
    assert.equal(missed.removed, false, "negative control: a toast the observer never reported has no timer");
  });
});

test("toast attach: dismissing a toast that held focus returns focus to where it came from, and never steals it otherwise", async () => {
  const { attach } = await load("toast");
  await withClock(async () => {
    const p = toastPage({ toasts: [{}, {}] });
    attach(p.root);
    p.outside.focus();
    p.made[0].dismiss.dispatch("focusin", { bubbles: true, relatedTarget: p.outside });
    p.doc.activeElement = p.made[0].dismiss;
    p.made[0].dismiss.dispatch("click", { bubbles: true });
    assert.equal(p.doc.activeElement, p.outside);
    p.doc.activeElement = p.outside;
    p.made[1].dismiss.dispatch("click", { bubbles: true });
    assert.equal(p.doc.activeElement, p.outside, "a toast without focus never moves focus");
  });
});

test("toast attach: detach clears timers, disconnects the observer and removes every listener", async () => {
  const { attach } = await load("toast");
  await withClock(async (clock) => {
    const p = toastPage();
    const detach = attach(p.root);
    assert.ok(p.root.listenerCount() > 0 && clock.pending() > 0, "positive control");
    detach();
    assert.equal(clock.observer().gone, true);
    assert.equal(p.root.listenerCount(), 0);
    assert.equal(clock.pending(), 0);
    clock.advance(10 ** 6);
    assert.equal(p.gone(), false);
  });
});
