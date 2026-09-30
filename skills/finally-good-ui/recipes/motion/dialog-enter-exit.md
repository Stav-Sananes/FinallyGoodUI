# Recipe: dialog-enter-exit

**Intent:** a modal arrives with a short lift-and-fade over a dimming backdrop and leaves faster than it came.

**Cards:** motion.easing-roles · motion.duration-by-distance · motion.compositor-only · motion.reduced-motion · usability.user-control-undo · a11y.keyboard-complete

**When NOT to use:** for content the user should compare with the page behind (use a side panel or inline expansion); for confirmations that could be an undo toast instead (usability.user-control-undo); on mobile for long forms — use a full page or bottom sheet.

**Tokens:** `--duration-standard` (250, enter) · `--duration-short` (150, exit) · `--duration-medium` (300, backdrop) · `--ease-enter` · `--ease-exit`

## CSS baseline (`<dialog>` + `@starting-style`)
```html
<dialog id="confirm" class="dialog" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Archive 3 projects?</h2>
  <form method="dialog"><button value="cancel">Cancel</button><button value="ok">Archive</button></form>
</dialog>
<script>document.querySelector('#open').onclick = () => confirm.showModal();</script>
```
```css
.dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
  transition:
    opacity var(--duration-short) var(--ease-exit),
    transform var(--duration-short) var(--ease-exit),
    display var(--duration-short) allow-discrete,
    overlay var(--duration-short) allow-discrete;
}
.dialog[open] {
  opacity: 1;
  transform: none;
  transition-duration: var(--duration-standard);
  transition-timing-function: var(--ease-enter);
}
@starting-style { .dialog[open] { opacity: 0; transform: translateY(8px) scale(0.97); } }

.dialog::backdrop {
  background: oklch(0 0 0 / 0.45);
  opacity: 0;
  transition:
    opacity var(--duration-medium) var(--ease-exit),
    display var(--duration-medium) allow-discrete,
    overlay var(--duration-medium) allow-discrete;
}
.dialog[open]::backdrop { opacity: 1; }
@starting-style { .dialog[open]::backdrop { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .dialog, .dialog[open] { transform: none; }
  @starting-style { .dialog[open] { transform: none; } }
}
```
- Exit ≈ 60% of enter and uses `--ease-exit`; the user already decided, don't make them wait.
- Where `overlay` transitions are unsupported (non-Chromium) the exit may be cut short; acceptable.
- Backdrop colour belongs in tokens (`--color-overlay`) in real code; the literal is shown for clarity.
- Bottom sheet on mobile: swap the transform for `translateY(100%)` → `none`, enter `--duration-medium`.

## React + Motion
Use when dialog content changes height/steps inside (layout animation) or the project already uses Motion. Radix/shadcn `Dialog` + `forceMount` pattern:
```tsx
<AnimatePresence>
  {open && (
    <Dialog.Portal forceMount>
      <Dialog.Overlay asChild forceMount>
        <m.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      </Dialog.Overlay>
      <Dialog.Content asChild forceMount>
        <m.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0, 0, 0, 1] } }}
          exit={{ opacity: 0, ...(reduce ? {} : { y: 8, scale: 0.97 }), transition: { duration: 0.15, ease: [0.3, 0, 1, 1] } }}
        >{children}</m.div>
      </Dialog.Content>
    </Dialog.Portal>
  )}
</AnimatePresence>
```
(wrap once in `<LazyMotion features={domAnimation}>`; `reduce = useReducedMotion()`.)

## Vue / Svelte
- Vue: `<Teleport to="body"><Transition name="dlg">` around the panel; separate `<Transition name="fade">` for the backdrop so their durations differ.
- Svelte: `in:fly={{ y: 8, duration: 250, easing: cubicOut }} out:fade={{ duration: 150 }}` on the panel; `transition:fade={{ duration: 300 }}` on the backdrop. Or use native `<dialog>` with the CSS above.

## A11y
- `showModal()` gives focus trap, `Escape`, inert background and top layer for free — prefer it over a div.
- Initial focus: the least destructive action, or the first field. Return focus to the trigger on close.
- Label with `aria-labelledby`; destructive confirm buttons name the action ("Archive", not "OK") — writing.action-labels.

## Upgrade trigger
None for basic modals. Suggest a headless dialog (Radix, Headless UI, Bits UI) only if the stack must support nested dialogs or needs scroll-lock quirks handled on iOS.
