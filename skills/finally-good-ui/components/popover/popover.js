// Popover behaviour: a non-modal panel anchored to its trigger. The panel is a native `popover` (auto), so the top layer,
// light dismiss (outside click) and Escape are the platform's, and the platform returns focus to the trigger on close.
// attach adds: ids and aria-haspopup / aria-controls / aria-expanded on the trigger, popovertarget, role="dialog" with a
// name from the trigger on the panel, focus into the panel on open (first [autofocus] or focusable, else the panel),
// closing when focus leaves both trigger and panel, anchor positioning (CSS anchor-name / position-area where the browser
// has it, else --pop-x / --pop-y from the trigger's box, flipped above when there is no room below) and a bubbling
// `popoverchange` event (detail: open) so a framework wrapper can keep a bound `open`.
// Every selector is scoped to data-fgu="popover". openPopover / closePopover are the programmatic API.
const ROOT = '[data-fgu="popover"][data-part="root"]';
const TRIGGER = '[data-fgu="popover"] [data-part="trigger"]';
const PANEL = '[data-fgu="popover"] [data-part="panel"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
let counter = 0;

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const isOpen = (panel) => { try { return panel.matches(":popover-open"); } catch { return false; } };
const cssAnchors = () => typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("anchor-name", "--a");
const partsOf = (scope) => {
  const root = scope.closest?.(ROOT) ?? (scope.matches?.(ROOT) ? scope : scope.querySelector(ROOT) ?? scope);
  return { root, trigger: root.querySelector(TRIGGER), panel: root.querySelector(PANEL) };
};

function wire(root) {
  const { trigger, panel } = partsOf(root);
  if (!trigger || !panel) return;
  const n = ++counter;
  trigger.id ||= `fgu-popover-${n}-trigger`;
  panel.id ||= `fgu-popover-${n}-panel`;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", panel.id);
  trigger.setAttribute("popovertarget", panel.id);
  if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", String(isOpen(panel)));
  if (!panel.hasAttribute("popover")) panel.setAttribute("popover", "auto");
  if (!panel.hasAttribute("role")) panel.setAttribute("role", "dialog");
  if (!panel.hasAttribute("aria-label") && !panel.hasAttribute("aria-labelledby")) panel.setAttribute("aria-labelledby", trigger.id);
  if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
  if (cssAnchors()) {
    root.setAttribute("data-anchor", "css");
    trigger.style.setProperty("anchor-name", `--fgu-pop-${n}`);
    panel.style.setProperty("position-anchor", `--fgu-pop-${n}`);
  }
}

function place(root, trigger, panel) {
  if (root.getAttribute("data-anchor") === "css") return;
  const box = trigger.getBoundingClientRect();
  const height = panel.getBoundingClientRect().height;
  const view = root.ownerDocument.defaultView;
  const below = !view || view.innerHeight - box.bottom >= height || box.top < height;
  root.setAttribute("data-side", below ? "bottom" : "top");
  panel.style.setProperty("--pop-x", `${box.left}px`);
  panel.style.setProperty("--pop-y", `${below ? box.bottom : box.top - height}px`);
}

/** Opens the popover of `scope` (the root, its trigger or its panel) and moves focus into it. */
export function openPopover(scope) {
  const { panel } = partsOf(scope);
  if (panel && !isOpen(panel)) panel.showPopover();
}

/** Closes it; the platform gives focus back to the trigger. */
export function closePopover(scope) {
  const { panel } = partsOf(scope);
  if (panel && isOpen(panel)) panel.hidePopover();
}

export function attach(root) {
  for (const el of within(root, ROOT)) wire(el);

  const onBeforeToggle = (event) => {
    const panel = event.target;
    const { root: owner, trigger } = partsOf(panel);
    if (event.newState === "open" && owner && trigger) place(owner, trigger, panel);
  };
  const onToggle = (event) => {
    const panel = event.target;
    const { root: owner, trigger } = partsOf(panel);
    if (!owner || !trigger || !panel.matches?.(PANEL)) return;
    const open = event.newState === "open";
    trigger.setAttribute("aria-expanded", String(open));
    if (open) (panel.querySelector("[autofocus]") ?? panel.querySelector(FOCUSABLE) ?? panel).focus();
    panel.dispatchEvent(new CustomEvent("popoverchange", { bubbles: true, detail: open }));
  };
  // Non-modal: tabbing out of the panel closes it (focus is not trapped), without stealing focus back.
  const onFocusOut = (event) => {
    const panel = event.target.closest?.(PANEL);
    if (!panel || !isOpen(panel)) return;
    const { root: owner } = partsOf(panel);
    if (event.relatedTarget && !owner.contains(event.relatedTarget)) panel.hidePopover();
  };

  root.addEventListener("beforetoggle", onBeforeToggle, true);
  root.addEventListener("toggle", onToggle, true);
  root.addEventListener("focusout", onFocusOut);
  return () => {
    root.removeEventListener("beforetoggle", onBeforeToggle, true);
    root.removeEventListener("toggle", onToggle, true);
    root.removeEventListener("focusout", onFocusOut);
  };
}
