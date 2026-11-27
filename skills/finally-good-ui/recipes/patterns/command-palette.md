# Pattern: command-palette

**Intent:** ⌘K (Ctrl+K elsewhere) opens one search box that finds any page, record or action by a few typed letters, runs it with Enter, and gets out of the way: expert users reach everything without the mouse, and new users can browse what the app can do.

**Cards:** usability.recognition-over-recall · ia-nav.search-vs-browse · usability.tension-guidance-expertise · motion.frequency-budget · a11y.keyboard-complete · states.empty-state-teaches

**When NOT to use:** apps with fewer than about fifteen destinations and actions (the nav already shows them all); as the only way to reach something (every command must also be reachable from visible UI); for content search across documents (that is a search page with results, filters and paging).

**Tokens:** `--duration-micro` (100, first-open fade only) · `--duration-short` (150, list height) · `--ease-move` · `--color-overlay` · `--color-accent` (highlighted row) · `--text-sm`

## Structure
- Native `<dialog>` opened with `showModal()` (focus trap, Escape, inert page for free), containing the combobox shape from menu-select-combobox: an input with `role="combobox"`, a `role="listbox"` of options, focus kept in the input with `aria-activedescendant`.
- Rows: icon, label, optional context (`in Projects`), shortcut hint on the right in `<kbd>`. Group with headings (`role="group"` + `aria-labelledby`): Recent, Pages, Actions, then records.
- Empty query shows recent and suggested commands, not a blank list.
- Nested pages (e.g. "Change status →" opens a list of statuses): show the parent as a chip in the input; Backspace on an empty input goes back one level.
- Destructive commands run through the same confirmation or undo as their button elsewhere (usability.user-control-undo).

## Keyboard
| Key | Does |
|---|---|
| ⌘K / Ctrl+K | toggle the palette from anywhere, unless the focused editor uses that shortcut itself |
| ↑ / ↓ | move the highlight (no wrap on long lists) |
| Enter | run the highlighted command; ignore while `event.isComposing` (IME) |
| Escape | close a nested page first, then the palette; focus returns to where it was |
| Backspace on empty input | back one level |

Show the shortcut the way the platform writes it: `const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";` → `${mod}K`.

## Ranking
Rank so the obvious match wins: exact prefix of the label, then the start of a word, then a substring, then letters in order (subsequence). Break ties by recent use. Highlight the matched letters with `<mark>`.
```js
export function score(label, query) {
  const l = label.toLowerCase(), q = query.toLowerCase().trim();
  if (!q) return 1;
  if (l.startsWith(q)) return 4;
  if (l.split(/[\s/_-]+/).some((w) => w.startsWith(q))) return 3;
  if (l.includes(q)) return 2;
  let i = 0;
  for (const ch of l) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}
// results = commands.map((c) => [c, score(c.label, q)]).filter(([, s]) => s > 0)
//   .sort((a, b) => b[1] - a[1] || recency(b[0]) - recency(a[0]))
```
Update the live region with the count ("6 results") after the user pauses typing.

## Motion (used many times an hour: almost none)
```css
dialog.palette::backdrop { background: var(--color-overlay); }
dialog.palette[open] { animation: palette-in var(--duration-micro) var(--ease-move); }
@keyframes palette-in { from { opacity: 0; } }      /* fade only; no scale, no slide */
.palette-list { height: var(--palette-list-height, auto); overflow: auto;
  transition: height var(--duration-short) var(--ease-move); }
@media (prefers-reduced-motion: reduce) {
  dialog.palette[open] { animation: none; }
  .palette-list { transition: none; }
}
```
Set `--palette-list-height` from the list's `scrollHeight` after each filter (capped by `max-height`) so the box glides instead of jumping. The highlight moves with no transition. Close instantly.

## States
| State | Shows |
|---|---|
| empty query | Recent (up to 5), then suggested actions |
| no results | "No results for 'xyz'" plus one fallback action ("Search all records for 'xyz'") |
| loading records | the static commands at once; a "Searching…" row below them for remote results |
| error | a row saying records couldn't be searched, with Retry; local commands still work |

## Libraries
- `interaction` lists `cmdk` (React): use `Command.Dialog`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, `Command.Empty`; cmdk ranks for you; animate height with its `--cmdk-list-height` variable as above.
- Svelte: Bits UI `Command`. Vue: Reka UI `Combobox` or `Listbox` inside a dialog. Other stacks: the structure above with the combobox keyboard from menu-select-combobox.

## A11y
- The dialog has an accessible name ("Command menu"); the input has a visible placeholder and a label.
- Every row's command is also reachable from visible UI; the palette is a shortcut, not the only path.
- `aria-keyshortcuts="Meta+K"` (or `Control+K`) on the button that opens it, and that button exists in the header so mouse and touch users can open it.

## Upgrade trigger
None for React with cmdk or Svelte with Bits UI. Otherwise suggest the framework's combobox primitive (Reka, Kobalte, Base UI, React Aria) only when records are searched remotely with grouping and paging; ask first.
