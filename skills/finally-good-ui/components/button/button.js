// Button behaviour. A native <button> already handles Enter, Space and focus; the only thing added is
// that a loading button (aria-busy="true") stays focusable but swallows activation.
export function attach(root) {
  const swallowWhileBusy = (event) => {
    const button = event.target.closest?.('[data-part="root"][aria-busy="true"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  root.addEventListener("click", swallowWhileBusy, true);
  return () => root.removeEventListener("click", swallowWhileBusy, true);
}
