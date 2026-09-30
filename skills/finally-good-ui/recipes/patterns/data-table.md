# Pattern: data-table

**Intent:** let people scan, compare, sort and act on many records — dense but legible, with every state handled.

**Cards:** data.dense-tables · data.tension-density-clarity · typography.tabular-numbers · data.status-encoding · layout.grid-alignment · states.loading-perceived · states.empty-state-teaches · a11y.semantic-first

**When NOT to use:** fewer than ~5 records or 2 attributes (a list is clearer); content that is read, not compared (cards/feed); on phones when rows have > 3 key fields — switch to a stacked list with the primary field first.

**Tokens:** `--space-*` · `--text-sm` · `--color-border/muted/muted-foreground/accent` · `--duration-short` · `--ease-move`

## Structure
- Columns: identifier first (left, sticky on scroll-x), then fields in the order users decide by; numbers right-aligned with `tabular-nums`; text left; status as text + colour + icon (color.color-not-sole-signal). Units in the header, not in every cell.
- Density: resolve data.tension-density-clarity from the brief — expert/daily → 32–36px rows; occasional → 44–48px. Offer a density toggle only if both audiences exist.
- Header: sortable columns are `<button>`s inside `<th aria-sort>`. Toolbar above: search, filters (as removable chips), bulk actions appearing when rows are selected.
- Row actions: the primary action is the row link (the identifier); secondary actions in a trailing menu. Don't make the whole `<tr>` clickable without a real link inside.
- Pagination or "Load more" with total count ("1–50 of 1,284"); keep selection across pages explicit.

## States
| State | UI |
|---|---|
| loading (first) | header rendered + 5–10 skeleton rows of the real row height (skeleton-to-content) |
| refreshing | keep current rows, dim slightly (`opacity: .6`) + progress bar in the header; no skeleton flash |
| empty (first-run) | empty-state first-run variant inside the table body area |
| empty (filtered) | no-results variant naming the filters + "Clear filters" |
| error | inline error in the body with Retry; keep toolbar usable |
| partial | cells with missing data show "—" with a tooltip reason; failed columns flagged in the header |
| full | as designed; sticky header when taller than the viewport |
| no-permission | hide columns the role can't see; disable bulk actions with the reason in a tooltip |

## CSS baseline
```html
<div class="table-wrap" role="region" aria-labelledby="t-cap" tabindex="0">
  <table class="table">
    <caption id="t-cap">Invoices <span class="count">1–50 of 1,284</span></caption>
    <thead><tr>
      <th scope="col">Invoice</th>
      <th scope="col" aria-sort="descending"><button type="button">Due</button></th>
      <th scope="col" class="num">Amount (USD)</th>
      <th scope="col">Status</th>
    </tr></thead>
    <tbody><tr>
      <th scope="row"><a href="/invoices/1042">INV-1042</a></th>
      <td>Oct 3</td><td class="num">4,250.00</td>
      <td><span class="status" data-status="overdue">Overdue</span></td>
    </tr></tbody>
  </table>
</div>
```
```css
.table-wrap { overflow-x: auto; max-inline-size: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.table-wrap:focus-visible { outline: 2px solid var(--color-ring); }
.table { inline-size: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--text-sm); }
.table caption { text-align: start; padding: var(--space-3) var(--space-4); font-weight: 600; }
.table th, .table td { padding: var(--space-2) var(--space-3); text-align: start; border-block-end: 1px solid var(--color-border); white-space: nowrap; }
.table thead th { position: sticky; top: 0; z-index: 1; background: var(--color-muted); color: var(--color-muted-foreground); font-weight: 500; }
.table tbody th { position: sticky; inset-inline-start: 0; background: var(--color-background); font-weight: 500; }
.table .num { text-align: end; font-variant-numeric: tabular-nums; }
.table [aria-sort] button { all: unset; cursor: pointer; }
.table [aria-sort] button:focus-visible { outline: 2px solid var(--color-ring); }
.table [aria-sort="ascending"] button::after { content: " ↑"; }
.table [aria-sort="descending"] button::after { content: " ↓"; }
.table tbody tr > * { transition: background-color var(--duration-short) var(--ease-move); } /* colour only: fine under reduced motion */
@media (hover: hover) and (pointer: fine) { .table tbody tr:hover > * { background: var(--color-accent); } }
.table tbody tr.is-selected > * { background: var(--color-accent); }
.status::before { content: ""; display: inline-block; inline-size: .5em; block-size: .5em; border-radius: 50%; margin-inline-end: .4em; background: currentColor; }
.table[aria-busy="true"] tbody { opacity: 0.6; transition: opacity var(--duration-short); }
@media (max-width: 640px) { .table .opt { display: none; } }  /* mark optional columns .opt */
```
Sorting/filtering motion: list-reorder-flip only for < ~50 rows; otherwise swap instantly and flash nothing. Live-updating cells: brief background highlight (colour, not movement).

## React + Motion
Motion adds nothing here. For logic, use TanStack Table (headless) when sorting/filtering/selection/virtualisation grow beyond ~200 lines of hand code; render with the markup above.

## Vue / Svelte
- Vue: TanStack Table has a Vue adapter; `<TransitionGroup tag="tbody">` + `.row-move` for small reorders.
- Svelte: TanStack Table adapter or hand-rolled `$derived` sorting; `animate:flip` on keyed `<tr>` for small sets.

## A11y
- Real `<table>` semantics with `<caption>`, `scope`, `aria-sort` on the sorted header only. Don't use `role="grid"` unless implementing full arrow-key grid navigation.
- Scroll container is focusable and labelled (keyboard users can scroll it).
- Selection checkboxes have labels ("Select INV-1042"); the header checkbox reflects mixed state (`indeterminate`).
- Announce sort/filter results in a polite live region.

## Upgrade trigger
Suggest TanStack Table (headless, framework adapters) for complex logic, and a virtualiser (TanStack Virtual) only above ~500 rendered rows. Suggest AG Grid-class grids only for spreadsheet-like editing.
