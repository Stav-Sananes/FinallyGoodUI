// A tiny fake DOM for the component behaviour tests: elements with attributes, a tree, simple selectors
// (`[attr]`, `[attr="v"]`, `[attr^="v"]`, `tag`, `:popover-open`, comma lists), focus, and real
// capture/bubble event dispatch. It implements only what the reference scripts call.
const ATTR = /^\[([\w-]+)(?:(\^?)=["']([^"']*)["'])?\]$/;

export class Doc {
  constructor() { this.activeElement = null; this.popovers = new Set(); this.ids = new Map(); this.defaultView = { getComputedStyle: () => ({ direction: "ltr", transitionDuration: "0s" }) }; }
  getElementById(id) { return this.ids.get(id) ?? null; }
}

export class El {
  constructor(doc, tag = "div", attrs = {}) {
    this.doc = doc; this.ownerDocument = doc; this.tag = tag; this.attrs = new Map(); this.children = []; this.parent = null;
    this.listeners = []; this.style = { props: {}, setProperty(k, v) { this.props[k] = v; } };
    this.textContent = ""; this.popoverOpen = false; this.removed = false; this.rect = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    for (const [k, v] of Object.entries(attrs)) this.setAttribute(k, v);
  }
  get id() { return this.getAttribute("id") ?? ""; }
  set id(v) { this.setAttribute("id", v); }
  get hidden() { return this.hasAttribute("hidden"); }
  set hidden(v) { v ? this.setAttribute("hidden", "") : this.removeAttribute("hidden"); }
  get tabIndex() { return Number(this.getAttribute("tabindex") ?? -1); }
  set tabIndex(v) { this.setAttribute("tabindex", v); }
  get isConnected() { return !this.removed && (this.parent ? this.parent.isConnected : true); }
  get parentElement() { return this.parent; }
  get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] ?? null; }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  hasAttribute(k) { return this.attrs.has(k); }
  setAttribute(k, v) { this.attrs.set(k, String(v)); if (k === "id") this.doc.ids.set(String(v), this); }
  removeAttribute(k) { this.attrs.delete(k); }
  append(...els) { for (const e of els) { e.parent = this; this.children.push(e); if (e.id) this.doc.ids.set(e.id, e); } return this; }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; this.dispatchRemoved?.(); }
  descendants() { return this.children.flatMap((c) => [c, ...c.descendants()]); }
  contains(el) { return el === this || this.descendants().includes(el); }
  matches(sel) {
    return sel.split(",").some((raw) => {
      const s = raw.trim();
      if (s === ":popover-open") return this.popoverOpen;
      const m = ATTR.exec(s);
      if (m) {
        const v = this.getAttribute(m[1]);
        return m[3] === undefined ? v !== null : m[2] ? v !== null && v.startsWith(m[3]) : v === m[3];
      }
      return s === this.tag;
    });
  }
  closest(sel) { for (let e = this; e; e = e.parent) if (e.matches(sel)) return e; return null; }
  querySelectorAll(sel) { return this.descendants().filter((e) => e.matches(sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  focus() { this.doc.activeElement = this; this.dispatch("focusin", { bubbles: true }); }
  getBoundingClientRect() { return this.rect; }
  showPopover() { this.dispatch("beforetoggle", { newState: "open" }); this.popoverOpen = true; this.doc.popovers.add(this); this.dispatch("toggle", { newState: "open" }); }
  hidePopover() { this.popoverOpen = false; this.doc.popovers.delete(this); this.dispatch("toggle", { newState: "closed" }); }
  /** A real mouse click: pointerup first (light dismiss), then click, then the invoker's default action. */
  mouseClick() {
    this.dispatch("pointerup", { bubbles: true });
    const ev = this.dispatch("click", { bubbles: true });
    const target = this.getAttribute("popovertarget") && this.doc.getElementById(this.getAttribute("popovertarget"));
    if (target && !ev.defaultPrevented) target.popoverOpen ? target.hidePopover() : target.showPopover();
    return ev;
  }
  showModal() { this.setAttribute("open", ""); this.modal = true; }
  close() { if (!this.hasAttribute("open")) return; this.removeAttribute("open"); this.dispatch("close"); }
  addEventListener(type, fn, opts) { this.listeners.push({ type, fn, capture: opts === true || opts?.capture === true }); }
  removeEventListener(type, fn, opts) {
    const capture = opts === true || opts?.capture === true;
    const i = this.listeners.findIndex((l) => l.type === type && l.fn === fn && l.capture === capture);
    if (i >= 0) this.listeners.splice(i, 1);
  }
  /** Real capture then bubble dispatch. Non-bubbling events reach only capture listeners on ancestors. */
  dispatch(type, init = {}) {
    const path = []; for (let e = this; e; e = e.parent) path.push(e);
    if (type === "pointerup") for (const pop of [...this.doc.popovers]) { // light dismiss, unless inside the popover or on its invoker
      const invoker = this.closest("[popovertarget]");
      if (!pop.contains(this) && !(invoker && this.doc.getElementById(invoker.getAttribute("popovertarget")) === pop)) pop.hidePopover();
    }
    const ev = { type, target: this, defaultPrevented: false, stopped: false, bubbles: false, ...init,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, stopImmediatePropagation() { this.stopped = true; } };
    const fire = (el, capture) => { for (const l of [...el.listeners]) if (!ev.stopped && l.type === type && l.capture === capture) { ev.currentTarget = el; l.fn(ev); } };
    for (const el of [...path].reverse()) { if (el !== this) fire(el, true); }
    fire(this, true); fire(this, false);
    if (ev.bubbles) for (const el of path.slice(1)) fire(el, false);
    return ev;
  }
  dispatchEvent(ev) { return !this.dispatch(ev.type, { bubbles: ev.bubbles, cancelable: ev.cancelable, detail: ev.detail }).defaultPrevented; }
  listenerCount() { return this.descendants().concat(this).reduce((n, e) => n + e.listeners.length, 0); }
}

/** el(doc, "button", {...}, text?) builder. */
export const make = (doc, tag, attrs, ...kids) => {
  const e = new El(doc, tag, attrs);
  for (const k of kids) typeof k === "string" ? (e.textContent = k) : e.append(k);
  return e;
};
