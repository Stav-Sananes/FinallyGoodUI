// Tooltip behaviour (WAI-ARIA APG tooltip). A short plain-text description for a control that is already labelled.
// attach wires: role="tooltip" and popover="manual" on the content (top layer, no light dismiss of its own), aria-describedby
// from the focusable control inside the trigger to the content; shows on hover after a delay (data-delay, default 500ms) and
// on keyboard focus at once; hides on pointer leave (the content counts as part of the tooltip: WCAG 1.4.13 hoverable), blur,
// pointer down and Escape (also when focus is elsewhere). A touch pointer never opens it by hover; a tap that only focuses
// a button does not either (:focus-visible is false for it). Placement: data-placement="top|bottom", flipped when there is no room.
// showTooltip / hideTooltip are the programmatic API. Every selector is scoped to data-fgu="tooltip".
const ROOT = '[data-fgu="tooltip"][data-part="root"]';
const TRIGGER = '[data-fgu="tooltip"] [data-part="trigger"]';
const CONTENT = '[data-fgu="tooltip"] [data-part="content"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
const DEFAULT_DELAY_MS = 500; // hover intent, not animation: not a motion token
let counter = 0;
const timers = new WeakMap(); // tooltip root -> pending show
const open = new Set(); // tooltip roots currently shown

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const rootOf = (el) => el.closest?.(ROOT) ?? null;
const contentOf = (tip) => tip.querySelector(CONTENT);
const keyboardFocus = (el) => { try { return el.matches(":focus-visible"); } catch { return true; } };

function wire(tip) {
  const content = contentOf(tip);
  const trigger = tip.querySelector(TRIGGER);
  if (!content || !trigger) return;
  content.id ||= `fgu-tooltip-${++counter}`;
  if (!content.hasAttribute("role")) content.setAttribute("role", "tooltip");
  if (!content.hasAttribute("popover")) content.setAttribute("popover", "manual");
  const target = trigger.querySelector(FOCUSABLE) ?? trigger;
  if (target === trigger && !trigger.hasAttribute("tabindex")) trigger.setAttribute("tabindex", "0");
  const ids = (target.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  if (!ids.includes(content.id)) target.setAttribute("aria-describedby", [...ids, content.id].join(" "));
}

function place(tip, content) {
  const trigger = tip.querySelector(TRIGGER);
  const box = trigger.getBoundingClientRect();
  const height = content.getBoundingClientRect().height;
  const view = tip.ownerDocument.defaultView;
  const wants = tip.getAttribute("data-placement") === "bottom" ? "bottom" : "top";
  const roomAbove = box.top >= height, roomBelow = !view || view.innerHeight - box.bottom >= height;
  const side = wants === "top" ? (roomAbove || !roomBelow ? "top" : "bottom") : (roomBelow || !roomAbove ? "bottom" : "top");
  tip.setAttribute("data-side", side);
  content.style.setProperty("--tip-x", `${box.left + box.width / 2}px`);
  content.style.setProperty("--tip-y", `${side === "top" ? box.top : box.bottom}px`);
}

/** Shows the tooltip of `scope` (the tooltip root, or anything inside it) now. */
export function showTooltip(scope) {
  const tip = rootOf(scope) ?? scope;
  const content = contentOf(tip);
  if (!content || open.has(tip)) return;
  clearTimeout(timers.get(tip));
  if (typeof content.showPopover === "function") content.showPopover();
  open.add(tip);
  tip.setAttribute("data-open", "");
  place(tip, content);
}

/** Hides it (and cancels a show that is still waiting for its delay). */
export function hideTooltip(scope) {
  const tip = rootOf(scope) ?? scope;
  clearTimeout(timers.get(tip));
  if (!open.delete(tip)) return;
  const content = contentOf(tip);
  if (content && typeof content.hidePopover === "function") { try { content.hidePopover(); } catch { /* already hidden */ } }
  tip.removeAttribute("data-open");
}

export function attach(root) {
  for (const tip of within(root, ROOT)) wire(tip);
  const doc = root.ownerDocument ?? root;

  const onOver = (event) => {
    const tip = rootOf(event.target);
    if (!tip || event.pointerType === "touch" || tip.contains(event.relatedTarget)) return;
    const delay = Number(tip.getAttribute("data-delay") ?? DEFAULT_DELAY_MS);
    clearTimeout(timers.get(tip));
    timers.set(tip, setTimeout(() => showTooltip(tip), delay));
  };
  const onOut = (event) => {
    const tip = rootOf(event.target);
    if (tip && !tip.contains(event.relatedTarget)) hideTooltip(tip);
  };
  const onFocusIn = (event) => {
    const tip = rootOf(event.target);
    if (tip && !contentOf(tip)?.contains(event.target) && keyboardFocus(event.target)) showTooltip(tip);
  };
  const onFocusOut = (event) => { const tip = rootOf(event.target); if (tip && !tip.contains(event.relatedTarget)) hideTooltip(tip); };
  const onDown = (event) => { const tip = rootOf(event.target); if (tip) hideTooltip(tip); }; // activating the control dismisses it
  // Escape works wherever focus is, while a tooltip is open (WCAG 1.4.13 dismissible).
  const onEscape = (event) => { if (event.key === "Escape" && open.size) for (const tip of [...open]) hideTooltip(tip); };

  const listeners = { pointerover: onOver, pointerout: onOut, focusin: onFocusIn, focusout: onFocusOut, pointerdown: onDown };
  for (const [type, fn] of Object.entries(listeners)) root.addEventListener(type, fn);
  doc.addEventListener("keydown", onEscape);
  return () => {
    for (const [type, fn] of Object.entries(listeners)) root.removeEventListener(type, fn);
    doc.removeEventListener("keydown", onEscape);
    for (const tip of [...open]) hideTooltip(tip);
  };
}
