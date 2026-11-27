// Select behaviour. Two shapes: `native` (a styled <select data-part="control">: the platform does everything, attach only
// reports changes) and `listbox` (a combobox-style button with a native `popover` list, optionally searchable).
// Listbox contract (APG select-only combobox, with real focus on the options like the menu): the trigger (role="combobox",
// aria-haspopup="listbox") opens on click, Enter, Space or ArrowDown; focus goes to the search field, else the selected
// option, else the first; ArrowUp/Down/Home/End move, typeahead jumps, Enter or Space or a click selects and closes, Escape
// closes with focus back on the trigger (native popover). A search field filters the options by text and shows the `empty`
// part when nothing matches. The chosen label is written into the `display` part, and the value into a hidden `value` input
// for forms. A bubbling `selectchange` event (detail: value) fires on a user choice; selectValue(scope, value) is the
// programmatic and controlled-prop API. Every selector is scoped to data-fgu="select".
const ROOT = '[data-fgu="select"][data-part="root"]';
const part = (name) => `[data-fgu="select"] [data-part="${name}"]`;
const TYPEAHEAD_RESET_MS = 500; // input timing, not animation: not a motion token
let counter = 0;
const typed = new WeakMap();

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const rootOf = (el) => el.closest?.(ROOT) ?? null;
const q = (root, name) => root.querySelector(part(name));
const optionsOf = (root) => [...root.querySelectorAll(part("option"))];
const isOpen = (list) => { try { return list.matches(":popover-open"); } catch { return false; } };
const usable = (o) => !o.hidden && o.getAttribute("aria-disabled") !== "true";
const labelOf = (o) => o.textContent.trim();

function syncDisplay(root) {
  const display = q(root, "display");
  if (!display) return;
  const chosen = optionsOf(root).find((o) => o.getAttribute("aria-selected") === "true");
  const text = chosen ? labelOf(chosen) : display.getAttribute("data-placeholder") ?? "";
  if (display.textContent !== text) display.textContent = text;
  if (chosen) display.removeAttribute("data-empty"); else display.setAttribute("data-empty", "");
  const hidden = q(root, "value");
  if (hidden) hidden.value = chosen?.getAttribute("data-value") ?? "";
}

function choose(root, option, notify) {
  const value = option?.getAttribute("data-value") ?? "";
  const before = optionsOf(root).find((o) => o.getAttribute("aria-selected") === "true");
  for (const o of optionsOf(root)) o.setAttribute("aria-selected", String(o === option));
  syncDisplay(root);
  if (notify && before !== option) root.dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: value }));
}

/** Selects the option with `value` (a controlled prop or code): no event. Works for both shapes. */
export function selectValue(scope, value) {
  const root = rootOf(scope) ?? scope;
  const control = q(root, "control");
  if (control) { control.value = value ?? ""; return; }
  const option = optionsOf(root).find((o) => o.getAttribute("data-value") === String(value));
  choose(root, value === undefined || value === "" ? null : option ?? null, false);
}

function wire(root) {
  const trigger = q(root, "trigger"), list = q(root, "listbox");
  if (!trigger || !list) return;
  const n = ++counter;
  trigger.id ||= `fgu-select-${n}-trigger`;
  list.id ||= `fgu-select-${n}-list`;
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-controls", list.id);
  trigger.setAttribute("popovertarget", list.id);
  if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "false");
  if (!list.hasAttribute("popover")) list.setAttribute("popover", "auto");
  if (!list.hasAttribute("role")) list.setAttribute("role", "listbox");
  if (!list.hasAttribute("aria-labelledby")) list.setAttribute("aria-labelledby", trigger.id);
  for (const o of optionsOf(root)) { if (!o.hasAttribute("role")) o.setAttribute("role", "option"); if (!o.hasAttribute("tabindex")) o.setAttribute("tabindex", "-1"); }
  syncDisplay(root);
}

const focusOption = (root, option) => { if (!option) return; for (const o of optionsOf(root)) o.setAttribute("tabindex", "-1"); option.setAttribute("tabindex", "0"); option.focus(); };
const step = (root, from, by) => { const all = optionsOf(root).filter(usable); if (!all.length) return null; const i = all.indexOf(from); return all.at(by === "first" ? 0 : by === "last" ? -1 : (i + by + all.length) % all.length); };

export function attach(root) {
  for (const el of within(root, ROOT)) wire(el);
  const refreshers = [];
  if (typeof MutationObserver === "function") {
    for (const el of within(root, ROOT)) {
      const list = q(el, "listbox");
      if (!list) continue;
      const observer = new MutationObserver(() => { for (const o of optionsOf(el)) { if (!o.hasAttribute("role")) o.setAttribute("role", "option"); } syncDisplay(el); });
      observer.observe(list, { childList: true, subtree: true });
      refreshers.push(observer);
    }
  }

  const onClick = (event) => {
    const option = event.target.closest?.(part("option"));
    const owner = option && rootOf(option);
    if (!owner || option.tagName === "OPTION") return;
    if (option.getAttribute("aria-disabled") === "true") { event.preventDefault(); return; }
    choose(owner, option, true);
    const list = q(owner, "listbox");
    if (isOpen(list)) list.hidePopover();
  };
  const onChange = (event) => {
    const control = event.target.closest?.(part("control"));
    if (control) rootOf(control).dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: control.value }));
  };
  const onInput = (event) => {
    const search = event.target.closest?.(part("search"));
    const owner = search && rootOf(search);
    if (!owner) return;
    const text = search.value.trim().toLowerCase();
    let shown = 0;
    for (const o of optionsOf(owner)) { o.hidden = text !== "" && !labelOf(o).toLowerCase().includes(text); if (!o.hidden) shown++; }
    const empty = q(owner, "empty");
    if (empty) empty.hidden = shown > 0;
  };
  const onKeydown = (event) => {
    const owner = rootOf(event.target);
    if (!owner) return;
    const trigger = event.target.closest?.(part("trigger"));
    const list = q(owner, "listbox");
    if (trigger) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (!isOpen(list)) list.showPopover(); }
      return;
    }
    const search = event.target.closest?.(part("search"));
    const current = event.target.closest?.(part("option"));
    if (!search && !current) return;
    const from = current ?? null;
    const go = { ArrowDown: () => step(owner, from, 1), ArrowUp: () => step(owner, from, -1), Home: () => step(owner, from, "first"), End: () => step(owner, from, "last") }[event.key];
    if (go) { event.preventDefault(); focusOption(owner, go()); return; }
    if (current && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); current.click(); return; }
    if (current && !search && event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const prev = typed.get(list);
      const text = prev && event.timeStamp - prev.at <= TYPEAHEAD_RESET_MS ? prev.text + event.key : event.key;
      typed.set(list, { text, at: event.timeStamp });
      const all = optionsOf(owner).filter(usable);
      const start = all.indexOf(current) + (text.length === 1 ? 1 : 0);
      const hit = [...all.slice(start), ...all.slice(0, start)].find((o) => labelOf(o).toLowerCase().startsWith(text.toLowerCase()));
      focusOption(owner, hit);
    }
  };
  const onToggle = (event) => {
    const list = event.target;
    const owner = list.matches?.(part("listbox")) ? rootOf(list) : null;
    if (!owner) return;
    const open = event.newState === "open";
    q(owner, "trigger")?.setAttribute("aria-expanded", String(open));
    if (!open) return;
    const search = q(owner, "search");
    if (search) { search.value = ""; onInput({ target: search }); search.focus(); }
    else focusOption(owner, optionsOf(owner).find((o) => o.getAttribute("aria-selected") === "true" && usable(o)) ?? step(owner, null, "first"));
  };

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeydown);
  root.addEventListener("toggle", onToggle, true);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
    root.removeEventListener("input", onInput);
    root.removeEventListener("keydown", onKeydown);
    root.removeEventListener("toggle", onToggle, true);
    for (const o of refreshers) o.disconnect();
  };
}
