// Dialog behaviour. The root is a native <dialog>: showModal() gives the focus trap, the inert page and
// Escape; the platform fires `close` for every way of closing. attach adds only what the platform leaves out:
//  - [data-dialog-open="<id>"] opens that dialog with showModal(), and remembers the opener;
//  - [data-part="close"] and [data-dialog-close] close their dialog;
//  - focus goes back to the opener on `close` (Escape, buttons, form method=dialog);
//  - aria-labelledby / aria-describedby from the title and description parts, only where the markup left them out;
//  - a click on the backdrop closes a dialog that says data-backdrop-close.
const DIALOG = "dialog";
const CLOSE = '[data-part="close"], [data-dialog-close]';
let counter = 0;

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

export function attach(root) {
  for (const dialog of root.querySelectorAll(DIALOG)) {
    label(dialog, "title", "aria-labelledby");
    label(dialog, "description", "aria-describedby");
  }
  const openers = new WeakMap();

  const onClick = (event) => {
    const target = event.target;
    const opener = target.closest?.("[data-dialog-open]");
    if (opener) {
      const dialog = opener.ownerDocument.getElementById(opener.getAttribute("data-dialog-open"));
      if (dialog && !dialog.hasAttribute("open")) {
        openers.set(dialog, opener);
        dialog.showModal();
      }
      return;
    }
    const closer = target.closest?.(CLOSE);
    if (closer) { closer.closest(DIALOG)?.close(); return; }
    if (target.matches?.(DIALOG) && target.hasAttribute("data-backdrop-close") && outside(event, target)) target.close();
  };
  // `close` does not bubble: listen in the capture phase on the root.
  const onClose = (event) => {
    const opener = openers.get(event.target);
    openers.delete(event.target);
    if (opener?.isConnected) opener.focus();
  };
  root.addEventListener("click", onClick);
  root.addEventListener("close", onClose, true);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("close", onClose, true);
  };
}
