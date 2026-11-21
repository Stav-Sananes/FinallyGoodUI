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
