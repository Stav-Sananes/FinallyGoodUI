# Pattern: menu-select-combobox

**Intent:** the three "pick from a list" widgets (a menu of commands, a select of one value, a combobox that filters as you type) work fully from the keyboard, announce what is highlighted, and give focus back where it came from.

**Cards:** a11y.keyboard-complete · a11y.semantic-first · a11y.focus-visible · usability.recognition-over-recall · usability.consistency-standards · motion.frequency-budget

**When NOT to use:** two or three options that fit on screen (radio group or segmented control); navigation links (a nav list of `<a>`, never `role="menu"`); a form field with a short fixed list (native `<select>`, which already does all of this).

**Tokens:** `--duration-short` (150, open) · `--duration-micro` (100, close) · `--ease-snappy` · `--ease-exit` · `--color-accent` (highlighted option) · `--color-ring`

## First: use what is installed
If the stack profile lists any `primitives` (Radix, Base UI, React Aria, Reka, Bits, Ark, Kobalte, Headless UI, UI SDK) or a styled kit, use its Menu / Select / Combobox and only style and animate it (headless-primitive-motion). Hand-roll only a simple menu or select when nothing is installed. A combobox with async results, grouping or virtualised lists is the upgrade trigger.

## Pick the shape
| The person wants to… | Shape | Native baseline | Focus model |
|---|---|---|---|
| run one of several commands (Edit, Duplicate, Delete) | **menu button** | none (`[popover]` gives open/close only) | real focus moves into the menu (roving `tabindex`) |
| choose one value for a field | **select** | `<select>`; style it with `appearance: base-select` where supported | real focus on the `<select>` |
| type to narrow a long list, then choose | **combobox** | `<input list>` + `<datalist>` for plain suggestions | focus stays in the input; `aria-activedescendant` points at the highlighted option |

Rule of thumb: move real focus when nothing needs typing (menu); keep focus in the input when the person is typing (combobox).

## Keyboard contract (WAI-ARIA APG)
| Key | Menu button | Select (custom) | Combobox |
|---|---|---|---|
| Enter / Space on trigger | open, focus first item | open, highlight current value | – |
| ArrowDown / ArrowUp | open (first / last item); then move | open; then move highlight | open; then move highlight (text cursor stays) |
| Home / End | first / last item | first / last option | stay in the text (they edit text) |
| printable character | jump to next item starting with it (typeahead) | typeahead | types into the input and filters |
| Enter | activate item, close, focus returns to trigger | choose highlighted, close | accept highlighted, close |
| Escape | close, focus returns to trigger | close without changing | close list; second Escape clears the text |
| Tab | close and move on (don't trap) | choose nothing, close, move on | close, keep typed text, move on |

- **Typeahead:** collect characters typed within about half a second into one search string; pressing the same letter again cycles through items starting with it.
- **Escape belongs to the innermost open layer.** A select inside a dialog closes itself and calls `event.stopPropagation()`, so the dialog stays open.
- **Wrap or not:** menus may wrap from last to first; long lists shouldn't (End is faster than wrapping around).
- **Disabled items** stay in the list and receive highlight (so people learn they exist) but can't be activated; mark them `aria-disabled="true"`.

## Markup
```html
<!-- menu button -->
<button id="row-actions" aria-haspopup="menu" aria-expanded="false" aria-controls="row-menu">Actions</button>
<div id="row-menu" role="menu" aria-labelledby="row-actions" popover>
  <button role="menuitem" tabindex="-1">Rename</button>
  <button role="menuitem" tabindex="-1">Duplicate</button>
  <button role="menuitem" tabindex="-1" aria-disabled="true">Move</button>
  <button role="menuitem" tabindex="-1">Delete…</button>
</div>

<!-- combobox -->
<label for="assignee">Assignee</label>
<input id="assignee" role="combobox" aria-autocomplete="list" aria-expanded="false"
       aria-controls="assignee-list" aria-activedescendant="">
<ul id="assignee-list" role="listbox" aria-label="People" hidden>
  <li id="opt-ana" role="option" aria-selected="false">Ana Ruiz</li>
</ul>
<p class="visually-hidden" aria-live="polite" id="assignee-count"><!-- "5 people" --></p>
```

## Menu keyboard (vanilla, roving focus)
```js
const TYPEAHEAD_RESET_MS = 500; // input timing, not animation: not a motion token
export function menuKeyboard(trigger, menu) {
  const items = () => [...menu.querySelectorAll('[role^="menuitem"]')];
  let typed = "", typedAt = 0;
  const focusAt = (i) => { const list = items(); list.at(i % list.length)?.focus(); };
  const open = (start) => { if (!menu.matches(":popover-open")) menu.showPopover(); trigger.setAttribute("aria-expanded", "true"); focusAt(start); };
  const close = () => { menu.hidePopover(); trigger.setAttribute("aria-expanded", "false"); trigger.focus(); };

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(0); }
    if (e.key === "ArrowUp") { e.preventDefault(); open(-1); }
  });
  trigger.addEventListener("click", () => menu.matches(":popover-open") ? close() : open(0));
  menu.addEventListener("keydown", (e) => {
    const list = items(), i = list.indexOf(document.activeElement);
    const moves = { ArrowDown: i + 1, ArrowUp: i - 1 + list.length, Home: 0, End: list.length - 1 };
    if (e.key in moves) { e.preventDefault(); focusAt(moves[e.key]); return; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === "Tab") { menu.hidePopover(); trigger.setAttribute("aria-expanded", "false"); return; }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      typed = e.timeStamp - typedAt > TYPEAHEAD_RESET_MS ? e.key : typed + e.key; typedAt = e.timeStamp;
      const repeat = [...typed].every((c) => c === typed[0]); // "dd" cycles through items starting with "d"
      const search = (repeat ? typed[0] : typed).toLowerCase();
      const from = repeat ? i + 1 : i;
      const label = (el) => el.textContent.trim().toLowerCase();
      const hit = [...list.slice(from), ...list.slice(0, from)].find((el) => label(el).startsWith(search));
      hit?.focus();
    }
  });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest('[role^="menuitem"]');
    if (item && item.getAttribute("aria-disabled") !== "true") close();
  });
}
```
For a combobox, keep focus in the input and move a highlight instead: set `aria-activedescendant` to the option's `id`, mark it with `[data-highlighted]`, call `option.scrollIntoView({ block: "nearest" })`, and update the live region with the result count after filtering (debounced, so it doesn't talk on every keystroke). Ignore Enter while `event.isComposing` (IME input).

## CSS
```css
[role="menu"], [role="listbox"] { /* open/close motion: popover-from-trigger or headless-primitive-motion */ }
[role="menuitem"]:focus-visible, [role="option"][data-highlighted] {
  background: var(--color-accent); color: var(--color-accent-foreground); outline: none;
}
[role="option"][aria-selected="true"]::before { content: "✓"; } /* plus the visible highlight: not colour alone */
[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }

/* customizable native select, where supported; the plain select stays usable elsewhere */
@supports (appearance: base-select) {
  select.fgu-select, select.fgu-select::picker(select) { appearance: base-select; }
}
```
The highlight moves instantly: no transition on the highlight, people move through it many times a second (motion.frequency-budget).

## States
Empty list → the menu isn't offered (hide the trigger or disable it with a reason). Combobox: loading (`aria-busy="true"` on the listbox, a "Searching…" row), no matches (a row echoing the query, not an empty box), error (a row with retry).

## Upgrade trigger
A combobox with async search, groups, multi-select chips, or thousands of options: use the installed primitive library; if none, propose one that matches the framework (Base UI or React Aria for React, Reka for Vue, Bits UI for Svelte, Kobalte for Solid, UI SDK for any of them) and ask first with the reason and size cost.

Reference: WAI-ARIA Authoring Practices (menu button, listbox, combobox patterns); UI SDK docs (Apache-2.0, ui-sdk.dev) for the focus-model split.
