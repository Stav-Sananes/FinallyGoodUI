// Disclosure behaviour. The trigger is a native <button aria-expanded aria-controls>, so Enter, Space and
// focus are native. attach adds: toggle on click, closed content made `inert` (not focusable, not read),
// and single-open when the root says data-mode="single" (default is multiple: users compare sections).
const TRIGGER = '[data-part="trigger"]';
const panelOf = (trigger) => {
  const id = trigger.getAttribute("aria-controls");
  return id ? trigger.ownerDocument.getElementById(id) : null;
};

function setOpen(trigger, open) {
  trigger.setAttribute("aria-expanded", String(open));
  const panel = panelOf(trigger);
  if (panel) panel.inert = !open;
}

export function attach(root) {
  for (const trigger of root.querySelectorAll(TRIGGER)) setOpen(trigger, trigger.getAttribute("aria-expanded") === "true");

  const onClick = (event) => {
    const trigger = event.target.closest?.(TRIGGER);
    if (!trigger || trigger.disabled) return;
    const open = trigger.getAttribute("aria-expanded") !== "true";
    if (open) {
      const owner = trigger.closest('[data-part="root"]');
      if (owner?.getAttribute("data-mode") === "single") {
        for (const other of owner.querySelectorAll(TRIGGER)) if (other !== trigger) setOpen(other, false);
      }
    }
    setOpen(trigger, open);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
