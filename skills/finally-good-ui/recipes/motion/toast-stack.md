# Recipe: toast-stack

**Intent:** brief, non-blocking confirmation (often with Undo) that slides in from the edge and stacks without covering work.

**Cards:** usability.system-status · usability.user-control-undo · states.optimistic-feedback · motion.frequency-budget · motion.spatial-continuity · a11y.keyboard-complete · writing.error-messages

**When NOT to use:** for errors that need a decision or block progress (inline error or dialog — states.error-recovery); for form field errors; for anything the user must read later (put it in the page). Max 3 visible.

**Tokens:** `--duration-medium` (300, enter) · `--duration-short` (150, exit) · `--duration-standard` (250, restack) · `--ease-enter` · `--ease-exit` · `--ease-move`

## CSS baseline
```html
<section class="toasts" aria-label="Notifications">
  <ol role="status" aria-live="polite" aria-relevant="additions"></ol>
</section>
```
```css
.toasts ol { position: fixed; inset: auto var(--space-4) var(--space-4) auto; display: grid; margin: 0; padding: 0; list-style: none; z-index: 50; }
.toast {
  grid-area: 1 / 1;                        /* all toasts share one cell; offset by --i */
  align-self: end;
  width: min(360px, calc(100vw - 2 * var(--space-4)));
  --i: 0;                                  /* 0 = newest */
  transform: translateY(calc(var(--i) * -10px)) scale(calc(1 - var(--i) * 0.05));
  opacity: calc(1 - var(--i) * 0.25);
  transform-origin: bottom center;
  transition:
    transform var(--duration-standard) var(--ease-move),
    opacity var(--duration-standard) var(--ease-move);
}
@starting-style { .toast { transform: translateY(100%); opacity: 0; } }
.toast:first-child { transition-duration: var(--duration-medium); transition-timing-function: var(--ease-enter); }
.toast.is-leaving {
  transform: translateX(calc(100% + var(--space-4)));
  opacity: 0;
  transition: transform var(--duration-short) var(--ease-exit), opacity var(--duration-short) var(--ease-exit);
}
@media (prefers-reduced-motion: reduce) {
  .toast, .toast.is-leaving { transform: none; }
  @starting-style { .toast { transform: none; } }
}
```
```js
const list = document.querySelector('.toasts ol');
function restack() { [...list.children].forEach((t, i) => t.style.setProperty('--i', i)); }
export function toast(message, { action, onAction, timeout = 5000 } = {}) {
  const li = document.createElement('li');
  li.className = 'toast';
  li.innerHTML = `<p></p>${action ? '<button type="button"></button>' : ''}`;
  li.querySelector('p').textContent = message;
  if (action) Object.assign(li.querySelector('button'), { textContent: action, onclick: () => { onAction?.(); dismiss(li); } });
  list.prepend(li);
  while (list.children.length > 3) list.lastElementChild.remove();
  restack();
  let timer = setTimeout(() => dismiss(li), timeout);
  li.addEventListener('pointerenter', () => clearTimeout(timer));
  li.addEventListener('pointerleave', () => (timer = setTimeout(() => dismiss(li), 2000)));
  li.addEventListener('focusin', () => clearTimeout(timer));
}
function dismiss(li) {
  if (!li.isConnected || li.classList.contains('is-leaving')) return;
  li.classList.add('is-leaving');
  const done = () => { li.remove(); restack(); };
  li.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 400); // fallback when reduced motion skips the transition
}
```

## React + Motion
Hand-rolling a stack in React is rarely worth it: use **Sonner** (shadcn's toast). Tune it rather than rebuild: `position`, `duration`, `visibleToasts={3}`, `closeButton`, action for Undo. If Motion is already present and you need a custom one, use `<AnimatePresence initial={false}>` with `m.li layout` and `exit={{ opacity: 0, x: 40 }}`.

## Vue / Svelte
- Vue: `<TransitionGroup tag="ol" name="toast">` gives enter/leave + `.toast-move` for restacking. Or `vue-sonner`.
- Svelte: `{#each toasts as t (t.id)}<li in:fly={{ y: 24, duration: 300 }} out:fly={{ x: 40, duration: 150 }} animate:flip={{ duration: 250 }}>`. Or `svelte-sonner`.

## A11y
- One persistent live region in the DOM from page load (added-late regions are often not announced). `role="status"` + `polite`; use `role="alert"` only for urgent failures.
- Auto-dismiss ≥ 5s, paused on hover and focus (WCAG 2.2.1). Undo stays reachable by keyboard; provide a shortcut or a history for missed toasts in data-critical apps.
- Don't move focus into the toast.

## Upgrade trigger
Suggest Sonner / vue-sonner / svelte-sonner when the app needs swipe-to-dismiss, promise (loading → success) toasts, or expanding stacks on hover.
