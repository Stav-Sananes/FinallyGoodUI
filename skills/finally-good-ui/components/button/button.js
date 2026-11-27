// Button behaviour. A native <button> already handles Enter, Space and focus; the only thing added is
// that a loading button (aria-busy="true") stays focusable but swallows activation.
// The listener is on the root you attach, so the button itself may be that root.
const BUSY = '[data-fgu="button"][data-part="root"][aria-busy="true"]';

export function attach(root) {
  const swallowWhileBusy = (event) => {
    const button = event.target.closest?.(BUSY);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  root.addEventListener("click", swallowWhileBusy, true);
  return () => root.removeEventListener("click", swallowWhileBusy, true);
}
