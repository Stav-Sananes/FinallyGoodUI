// Tabs behaviour (WAI-ARIA APG tabs, automatic activation: selection follows focus). attach adds, where
// the markup left them out: roles, ids, aria-controls (paired by order) and aria-labelledby; then
// one tab stop (roving tabindex), only the selected panel visible, click to select, ArrowLeft/Right
// (ArrowUp/Down when aria-orientation="vertical", swapped in right-to-left lists) with wrapping,
// Home and End, and the indicator's position as CSS variables on the list. Tab leaves the tablist natively.
const LIST = '[data-part="list"]';
const TAB = '[data-part="tab"]';
const PANEL = '[data-part="panel"]';
let counter = 0;

const tabsOf = (list) => [...list.querySelectorAll(TAB)];
const panelOf = (tab) => { const id = tab.getAttribute("aria-controls"); return id ? tab.ownerDocument.getElementById(id) : null; };

function wire(list) {
  const group = list.closest('[data-part="root"]') ?? list.parentElement;
  const panels = [...group.querySelectorAll(PANEL)];
  tabsOf(list).forEach((tab, i) => {
    const n = ++counter;
    if (!tab.hasAttribute("role")) tab.setAttribute("role", "tab");
    tab.id ||= `fgu-tab-${n}`;
    const panel = panels[i];
    if (!panel) return;
    if (!tab.hasAttribute("aria-controls")) { panel.id ||= `fgu-tabpanel-${n}`; tab.setAttribute("aria-controls", panel.id); }
  });
  for (const tab of tabsOf(list)) {
    const panel = panelOf(tab);
    if (!panel) continue;
    if (!panel.hasAttribute("role")) panel.setAttribute("role", "tabpanel");
    if (!panel.hasAttribute("aria-labelledby")) panel.setAttribute("aria-labelledby", tab.id);
    if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "0");
  }
}

function place(list) {
  const tab = tabsOf(list).find((t) => t.getAttribute("aria-selected") === "true");
  if (!tab) return;
  const box = list.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  list.style.setProperty("--indicator-x", `${rect.left - box.left}px`);
  list.style.setProperty("--indicator-scale", String(box.width ? rect.width / box.width : 0));
}

function select(list, tab) {
  for (const other of tabsOf(list)) {
    const on = other === tab;
    other.setAttribute("aria-selected", String(on));
    other.setAttribute("tabindex", on ? "0" : "-1");
    const panel = panelOf(other);
    if (panel) panel.hidden = !on;
  }
  place(list);
}

export function attach(root) {
  const observers = [];
  const frames = [];
  for (const list of root.querySelectorAll(LIST)) {
    wire(list);
    const tabs = tabsOf(list);
    select(list, tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs[0]);
    if (typeof ResizeObserver === "function") { const ro = new ResizeObserver(() => place(list)); ro.observe(list); observers.push(ro); }
    if (typeof requestAnimationFrame === "function") frames.push(requestAnimationFrame(() => list.setAttribute("data-ready", "")));
  }

  const onClick = (event) => {
    const tab = event.target.closest?.(TAB);
    const list = tab?.closest(LIST);
    if (!list) return;
    select(list, tab);
    tab.focus();
  };

  const onKeydown = (event) => {
    const tab = event.target.closest?.(TAB);
    const list = tab?.closest(LIST);
    if (!list) return;
    const vertical = list.getAttribute("aria-orientation") === "vertical";
    const rtl = !vertical && list.ownerDocument.defaultView?.getComputedStyle?.(list).direction === "rtl";
    const [back, forward] = vertical ? ["ArrowUp", "ArrowDown"] : rtl ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"];
    const all = tabsOf(list);
    const i = all.indexOf(tab);
    const next = { [forward]: i + 1, [back]: i - 1 + all.length, Home: 0, End: all.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = all[next % all.length];
    select(list, target);
    target.focus();
  };

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeydown);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeydown);
    for (const ro of observers) ro.disconnect();
    if (typeof cancelAnimationFrame === "function") for (const f of frames) cancelAnimationFrame(f);
  };
}
