# Pattern: inline-edit

**Intent:** rename or change a short value where it is shown (a project name, a cell, a title) without a form or dialog: Enter saves, Escape cancels, and the saved value appears at once.

**Cards:** states.optimistic-feedback · usability.user-control-undo · usability.error-prevention · a11y.keyboard-complete · flows-forms.inline-validation-timing · writing.error-messages

**When NOT to use:** several fields that must be valid together (a form or settings-page); values with side effects people must confirm (prices, permissions: a dialog); long text (an editor); touch-first lists where a tap must open the item (put Rename in the item's menu instead).

**Tokens:** `--duration-short` (150, saved tint) · `--ease-move` · `--color-ring` · `--color-destructive` (error) · `--color-accent` (saved tint)

## Behaviour
| Moment | Does |
|---|---|
| start | an "Edit" / "Rename" button (or F2 on a focused row, or double-click as a shortcut, never the only way) swaps the text for an input with the text selected |
| Enter | save |
| Escape | cancel: the old value comes back |
| blur (click away, Tab) | save, same as Enter; this choice is stated once, in the button's description |
| empty or invalid value | stay in the input, show the error under it, don't save |
| unchanged value | close without a save request |
| after save or cancel | focus returns to the edit button |

## Markup and script
```html
<div class="inline-edit">
  <span class="inline-edit-value" id="name-1">Q3 launch</span>
  <button class="inline-edit-start" aria-describedby="name-1">Rename</button>
</div>
```
```js
export function inlineEdit(root, { save, validate = (v) => (v.trim() ? "" : "Name can't be empty."), announce }) {
  const value = root.querySelector(".inline-edit-value");
  const start = root.querySelector(".inline-edit-start");
  start.addEventListener("click", () => {
    const old = value.textContent;
    const input = Object.assign(document.createElement("input"), { value: old, className: "inline-edit-input" });
    input.setAttribute("aria-label", start.textContent + ": " + old);
    const error = Object.assign(document.createElement("p"), { className: "inline-edit-error", id: `${value.id}-error` });
    value.replaceWith(input); start.hidden = true; input.after(error); input.select();
    let done = false;
    const finish = async (commit) => {
      if (done) return;
      const next = input.value.trim();
      const problem = commit ? validate(next) : "";
      if (problem) { error.textContent = problem; input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", error.id); input.focus(); return; }
      done = true;
      value.textContent = commit ? next : old;
      input.replaceWith(value); error.remove(); start.hidden = false; start.focus();
      if (!commit || next === old) return;
      value.setAttribute("data-saved", "");
      try { await save(next); announce(`Renamed to ${next}.`); }
      catch { value.textContent = old; announce(`Couldn't rename. It's still ${old}.`); } // plus a toast with Retry
      finally { value.removeAttribute("data-saved"); }
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
  });
}
```
```css
.inline-edit-input { font: inherit; field-sizing: content; min-width: 8ch; } /* the input is as wide as the text where supported */
.inline-edit-input[aria-invalid="true"] { outline: 2px solid var(--color-destructive); }
.inline-edit-error { color: var(--color-destructive); font-size: var(--text-sm); }
.inline-edit-value[data-saved] { animation: saved-tint var(--duration-short) var(--ease-move); }
@keyframes saved-tint { from { background: var(--color-accent); } }
@media (prefers-reduced-motion: reduce) { .inline-edit-value[data-saved] { animation: none; } }
```
The input inherits the text's font so the swap doesn't shift the line. Escape stops propagation so a dialog or sheet around it stays open.

## In frameworks
Same state machine (`viewing → editing → saving`, back to `viewing`) in component state; React: keep the draft in local state, call the mutation optimistically and roll back in its error handler. Focus the edit button after the input unmounts (a ref and an effect on the state change).

## A11y
- The edit button's name says what is edited ("Rename Q3 launch"), via `aria-describedby` or the label text.
- Errors are text under the input, linked with `aria-describedby`.
- A failed save puts the old value back and says so in a toast with Retry; never leave a value on screen that wasn't saved.

## Upgrade trigger
None. Data grids with cell editing use the grid library's editor (AG Grid, TanStack Table with your own cells) with the same keys.
