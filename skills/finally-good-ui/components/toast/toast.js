// Toast behaviour. The root is a live region that is always in the DOM (role="status", polite); toasts are
// plain elements added inside it, which is what makes them announced. attach never moves focus into a toast.
// It adds, per toast:
//  - an auto-dismiss countdown: data-timeout in ms, default 5000 (reading time, WCAG 2.2.1);
//    0 means "until dismissed", and an error toast defaults to 0;
//  - the countdown pauses while the pointer is over the region or focus is inside it, and resumes
//    with the time that was left;
//  - [data-part="dismiss"] removes its toast; error toasts get role="alert" if the markup left it out;
//  - leaving is animated: data-leaving is set, the toast is removed on transitionend (fallback timer),
//    and a cancelable bubbling `dismiss` event fires first, so a framework that owns the node can
//    preventDefault() and drop the toast from its own state instead;
//  - focus that was inside a dismissed toast goes back to where it came from.
// Every selector is scoped to data-fgu="toast": attach may be given a whole page, or the region itself.
const TOAST = '[data-fgu="toast"] [data-part="toast"]';
const DISMISS = '[data-fgu="toast"] [data-part="dismiss"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
const focusTarget = (el) => (el.matches?.(FOCUSABLE) ? el : el.querySelector?.(FOCUSABLE) ?? el);
const DEFAULT_TIMEOUT_MS = 5000; // reading time, not animation: not a motion token
const EXIT_GRACE_MS = 100; // wait this long past the transition for transitionend before removing anyway

const timeoutOf = (toast) => {
  const raw = toast.getAttribute("data-timeout");
  if (raw !== null && Number.isFinite(Number(raw))) return Number(raw);
  return toast.getAttribute("data-variant") === "error" ? 0 : DEFAULT_TIMEOUT_MS;
};

// The longest of the comma-separated transition durations, in ms ("0.15s, 150ms").
const exitMs = (toast) => {
  const style = toast.ownerDocument.defaultView?.getComputedStyle?.(toast);
  const parts = String(style?.transitionDuration ?? "0s").split(",").map((d) => d.trim());
  return Math.max(0, ...parts.map((d) => (d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000) || 0));
};

export function attach(root) {
  const counting = new Map(); // toast -> { remaining, startedAt, timer }
  const leaving = new Map(); // toast -> finish()
  let hovered = false, focused = false, returnTo = null;

  const start = (toast, entry) => { entry.startedAt = Date.now(); entry.timer = setTimeout(() => dismiss(toast), entry.remaining); };
  const pause = () => { for (const entry of counting.values()) if (entry.timer !== null) { clearTimeout(entry.timer); entry.timer = null; entry.remaining -= Date.now() - entry.startedAt; } };
  const resume = () => { for (const [toast, entry] of counting) if (entry.timer === null) start(toast, entry); };
  const sync = () => (hovered || focused ? pause() : resume());

  function track(toast) {
    if (counting.has(toast) || leaving.has(toast)) return;
    if (toast.getAttribute("data-variant") === "error" && !toast.hasAttribute("role")) toast.setAttribute("role", "alert");
    const remaining = timeoutOf(toast);
    if (remaining <= 0) return;
    const entry = { remaining, startedAt: 0, timer: null };
    counting.set(toast, entry);
    if (!hovered && !focused) start(toast, entry);
  }

  function dismiss(toast) {
    if (leaving.has(toast)) return;
    const entry = counting.get(toast);
    if (entry?.timer != null) clearTimeout(entry.timer);
    counting.delete(toast);
    toast.setAttribute("data-leaving", "");
    let fallback = null;
    const finish = () => {
      if (!leaving.has(toast)) return;
      leaving.delete(toast);
      if (fallback !== null) clearTimeout(fallback);
      const holdsFocus = toast.contains(toast.ownerDocument.activeElement);
      const proceed = toast.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, cancelable: true }));
      if (proceed) toast.remove();
      if (holdsFocus && returnTo?.isConnected) focusTarget(returnTo).focus();
    };
    leaving.set(toast, finish);
    const ms = exitMs(toast);
    if (ms === 0) finish(); else fallback = setTimeout(finish, ms + EXIT_GRACE_MS);
  }

  for (const toast of root.querySelectorAll(TOAST)) track(toast);

  let observer = null;
  if (typeof MutationObserver === "function") {
    observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.matches?.(TOAST)) track(node);
        for (const inner of node.querySelectorAll?.(TOAST) ?? []) track(inner);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  const onClick = (event) => {
    const button = event.target.closest?.(DISMISS);
    const toast = button?.closest(TOAST);
    if (toast) dismiss(toast);
  };
  const onFocusIn = (event) => {
    focused = true;
    if (event.target.closest?.(TOAST) && event.relatedTarget && !root.contains(event.relatedTarget)) returnTo = event.relatedTarget;
    sync();
  };
  const onFocusOut = (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    focused = false;
    sync();
  };
  const onEnter = () => { hovered = true; sync(); };
  const onLeave = () => { hovered = false; sync(); };
  const onTransitionEnd = (event) => leaving.get(event.target)?.();

  const listeners = { click: onClick, focusin: onFocusIn, focusout: onFocusOut, pointerenter: onEnter, pointerleave: onLeave, transitionend: onTransitionEnd };
  for (const [type, fn] of Object.entries(listeners)) root.addEventListener(type, fn);
  return () => {
    for (const [type, fn] of Object.entries(listeners)) root.removeEventListener(type, fn);
    observer?.disconnect();
    for (const entry of counting.values()) if (entry.timer !== null) clearTimeout(entry.timer);
    counting.clear();
    leaving.clear();
  };
}
