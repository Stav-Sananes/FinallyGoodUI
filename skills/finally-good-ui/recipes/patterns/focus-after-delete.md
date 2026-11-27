# Pattern: focus-after-delete

**Intent:** when the item that has keyboard focus disappears (a deleted row, a dismissed chip, a closed toast, an archived card), focus lands on the next sensible thing instead of the top of the page, and the person hears what happened.

**Cards:** a11y.keyboard-complete · a11y.focus-visible · usability.user-control-undo · usability.system-status · states.empty-state-teaches

**When NOT to use:** removals the person didn't cause (live data refresh: leave focus alone unless the focused item itself went away, then apply the same rule quietly).

**Tokens:** none of its own; the removal animation comes from list-reorder-flip (`removeWithFlip`).

## Where focus goes
In this order, the first that exists:
1. the **next** item in the same list (the one that moved up into the gap);
2. the **previous** item, when the deleted one was last;
3. the list's **empty state** heading or its primary action, when the list is now empty;
4. the control that **opened** the thing (a toast's trigger, a dialog's opener).

Deleting from a detail page: go back to the list and focus the row that took its place (rule 1 or 2) or the list heading.
Bulk delete: focus the list heading or the bulk bar's status text ("3 invoices deleted").
After Undo: put the item back and focus it again.

## Script
```js
// Each item marks the one element that should receive focus (its link, checkbox or main button).
const target = (item) => item?.querySelector("[data-focus-target]") ?? item;

export async function removeAndRefocus(item, { list, emptyFocus, announce, message, remove = (el) => el.remove() }) {
  const items = [...list.children];
  const i = items.indexOf(item);
  const next = items[i + 1] ?? items[i - 1] ?? null;
  const hadFocus = item.contains(document.activeElement);
  await remove(item);                      // e.g. (el) => removeWithFlip(list, el)
  if (hadFocus) (next ? target(next) : emptyFocus())?.focus();
  announce(message);                       // "Invoice 12 deleted." (plus Undo in a toast)
}
```
Pick `next` before removing: afterwards the item's position is gone. Use `emptyFocus` to return the element that exists only after the list renders empty (e.g. `() => document.querySelector(".empty-state h2")`, with `tabindex="-1"` on that heading).

## With Undo
Show the confirmation in a toast with Undo (toast-stack), but don't move focus into the toast: it would pull the person away from the list. Make Undo reachable by keyboard (a shortcut such as ⌘Z / Ctrl+Z while the toast is visible, announced in the toast text) and keep the toast until it is used or dismissed when it holds the only Undo.

## In frameworks
React/Vue/Svelte remove the node during render, so compute the next item's id before the state update and focus it after the update commits (a ref map by id plus `useEffect` / `nextTick` / `tick()`). Component-library lists (React Aria `GridList`, `ListBox`) already move focus to a neighbour: check before adding your own.

## A11y
- Focus is never dropped to `<body>`; check with the keyboard after every delete path (row action, bulk, detail page, keyboard shortcut).
- The announcement names the item and says what happened ("Invoice 12 deleted"), not just "Deleted".

## Upgrade trigger
None.
