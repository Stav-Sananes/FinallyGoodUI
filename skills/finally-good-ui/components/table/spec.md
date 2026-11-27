# Component: table

**Intent:** a real `<table>` for scanning, comparing, sorting and selecting many records, in a scroll region with a sticky header, aria-sort on sortable columns, row selection with a select-all, and loading and empty states that keep the table's size.

**Cards:** data.dense-tables · data.tension-density-clarity · typography.tabular-numbers · a11y.semantic-first · a11y.keyboard-complete · states.loading-perceived · states.empty-state-teaches · layout.stable-media

**When NOT to use:** fewer than about five records or two attributes (a list); content that is read, not compared (cards or a feed); a phone-width layout where rows have more than three key fields (a stacked list); an interactive spreadsheet with cell editing (a grid widget: out of scope); layout (CSS grid).

**Tokens:** `--color-muted` / `--color-muted-foreground` (header) · `--color-accent` (selected row) · `--color-border` · `--color-ring` · `--size-control-md` (row height) · `--icon-lg` (checkbox) · `--space-1..6` · `--text-sm` · `--radius-*`, `--shadow-*` (profile). The full list is `tokens` in `spec.json`.

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | scroll region: `role="region"` named by the caption, `tabindex="0"`, `aria-busy` while loading; `data-sticky` pins the header (set `--table-max-height` for an inner scroll) |
| `table`, `caption`, `head`, `body`, `row`, `header`, `cell` | `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, `<td>`; `data-align="end"` right-aligns numbers (tabular) |
| `sort` | `<button>` inside a sortable `<th data-key aria-sort>`; the arrow reserves its width |
| `select` | `<input type="checkbox">` in each row (`tr[data-row-id]`, `aria-selected`) and one in the head for all rows (mixed state) |
| `status` | the single `<td colspan>` row that says Loading or the empty message (`role="status"`) |

## States
| State | How it shows |
|---|---|
| sorted | `aria-sort="ascending|descending"` on the `th`, `none` on the other sortable ones |
| selected | `aria-selected="true"` on the row, fill plus the checked box (never colour alone) |
| loading | `aria-busy="true"`, rows dimmed, a status row; rows keep their height |
| empty | a status row with the message (teach what to do next in it) |

## Keyboard
Native: Tab reaches the scroll region, each sort button and checkbox; Enter or Space activates a sort button, Space toggles a checkbox. A roving grid focus (arrows between cells) is not part of this component.

## Scaffold API
Props `columns` (`{ key, label, sortable?, align? }[]`), `rows` (`{ id, ...cells }[]`, in display order), `caption`, `sort` (`"key:ascending|descending"`, bound: `v-model:sort`, `bind:sort`, `[(sort)]`, `onSortChange`), `selectable`, `selected` (row ids, bound the same way), `loading`, `sticky`, `emptyText`, `loadingText`. Sorting is reported, not performed: update `sort` and re-order `rows` yourself. `attach` fires bubbling `sortchange` and `selectionchange`; `syncSelection(scope, ids?)` is exported for code. Cells show text and numbers.
