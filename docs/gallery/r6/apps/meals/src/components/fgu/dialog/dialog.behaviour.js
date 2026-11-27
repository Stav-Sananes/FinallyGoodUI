// Dialog behaviour. The root is a native <dialog>: showModal() gives the focus trap, the inert page and
// Escape; the platform fires `close` for every way of closing. attach adds only what the platform leaves out:
//  - [data-dialog-open="<id>"] opens that dialog with showModal() and remembers the opener. The opener may be
//    anywhere in the page, not only inside the attached root (the listener sits on the document);
//  - [data-part="close"] and [data-dialog-close] close their dialog;
//  - focus goes back to the opener on `close` (Escape, buttons, form method=dialog); an opener that is not
//    itself focusable (a custom element host) hands focus to the first focusable element inside it;
//  - aria-labelledby / aria-describedby from the title and description parts, only where the markup left them out;
//  - a click on the backdrop closes a dialog that says data-backdrop-close;
//  - initial focus: data-initial-focus="<selector>", else the first [autofocus], else the platform's first focusable.
// attach may be given the dialog itself or any ancestor. openDialog / closeDialog are the programmatic API.
const DIALOG = '[data-fgu="dialog"][data-part="root"]';
const CLOSE = '[data-fgu="dialog"] [data-part="close"], [data-dialog-close]';
// Copied into every behaviour file (each is shipped standalone): keep in sync with dialog.js, menu.js, popover.js, toast.js, tooltip.js.
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
let counter = 0;
const openers = new WeakMap(); // dialog -> the element to give focus back to

// Copied into every behaviour file: keep in sync with dialog, field, menu, popover, select, table, tabs, tooltip.
const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const focusTarget = (el) => (el.matches?.(FOCUSABLE) ? el : el.querySelector?.(FOCUSABLE) ?? el);

function label(dialog, part, attribute) {
  const el = dialog.querySelector(`[data-part="${part}"]`);
  if (!el || dialog.hasAttribute(attribute)) return;
  el.id ||= `fgu-dialog-${++counter}-${part}`;
  dialog.setAttribute(attribute, el.id);
}

const outside = (event, dialog) => {
  const box = dialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
};

/** Opens the dialog modally. `opener` (default: the focused element) gets focus back when it closes. */
export function openDialog(dialog, opener = null) {
  if (dialog.hasAttribute("open")) return;
  const active = dialog.ownerDocument.activeElement;
  const from = opener ?? (active && active !== dialog.ownerDocument.body ? active : null);
  if (from) openers.set(dialog, from);
  dialog.showModal();
  // Initial focus: data-initial-focus="<selector>" on the dialog, else the first [autofocus]; with neither the platform focuses the first focusable.
  const selector = dialog.getAttribute("data-initial-focus");
  const target = (selector && dialog.querySelector(selector)) || dialog.querySelector("[autofocus]");
  if (target) target.focus();
}

/** Closes the dialog (a no-op when it is closed); the platform fires `close`. */
export function closeDialog(dialog) {
  if (dialog.hasAttribute("open")) dialog.close();
}

export function attach(root) {
  for (const dialog of within(root, DIALOG)) {
    label(dialog, "title", "aria-labelledby");
    label(dialog, "description", "aria-describedby");
  }
  const doc = root.ownerDocument ?? root;

  // Openers live anywhere in the page: listen on the document, act only on dialogs inside this root.
  const onOpenerClick = (event) => {
    const opener = event.target.closest?.("[data-dialog-open]");
    if (!opener) return;
    const dialog = doc.getElementById(opener.getAttribute("data-dialog-open"));
    if (dialog?.matches?.(DIALOG) && root.contains(dialog)) openDialog(dialog, opener);
  };
  const onClick = (event) => {
    const target = event.target;
    const closer = target.closest?.(CLOSE);
    if (closer) { closer.closest(DIALOG)?.close(); return; }
    if (target.matches?.(DIALOG) && target.hasAttribute("data-backdrop-close") && outside(event, target)) target.close();
  };
  // `close` does not bubble: listen in the capture phase on the root.
  const onClose = (event) => {
    const opener = openers.get(event.target);
    openers.delete(event.target);
    if (opener?.isConnected) focusTarget(opener).focus();
  };
  doc.addEventListener("click", onOpenerClick);
  root.addEventListener("click", onClick);
  root.addEventListener("close", onClose, true);
  return () => {
    doc.removeEventListener("click", onOpenerClick);
    root.removeEventListener("click", onClick);
    root.removeEventListener("close", onClose, true);
  };
}
