# Pattern: empty-state

**Intent:** when there is nothing to show, explain why in one line and offer the single next step that fills the space.

**Cards:** states.empty-state-teaches · flows-forms.primary-action-clarity · writing.user-language · writing.action-labels · usability.self-evident · states.partial-and-permission

**When NOT to use:** as decoration for a transient load (that is loading, not empty); for errors (states.error-recovery — different copy, retry action).

**Tokens:** `--space-*` · `--text-*` · `--color-muted-foreground` · `--duration-standard` · `--ease-enter`

## Structure — pick the variant by cause
Empty is not one state. Diagnose the cause and write different copy for each:
| Variant | Cause | Headline pattern | Action |
|---|---|---|---|
| first-run | nothing created yet | what this place is for ("Invoices you send appear here") | create/import the first item (primary button) |
| no-results | search/filter matched nothing | echo the query ("No invoices match 'acme'") | clear filters / broaden search; show the active filters |
| cleared | user finished everything | acknowledge ("All caught up") | none, or the next logical place |
| no-permission | exists but hidden from this role | who can grant access | request access / contact owner |
| error-as-empty | fetch failed → **not** empty | use the error state instead | retry |

Anatomy (top to bottom): optional small illustration or icon drawn for the subject (≤ 96px, `aria-hidden`) → headline (≤ 8 words) → one-sentence explanation → one primary action (+ optional secondary text link, e.g. "Import CSV"). Place it where the content would be, aligned to the content column, not floating mid-screen on large displays.

## State matrix fit
For every screen in the blueprint, the `empty` cell names the variant(s) above. Lists with filters need both first-run and no-results. Dashboards: empty widgets show a compact inline variant ("No data for this period" + change-period link), not a full-page one — keep the grid shape (data.dashboard-summary-first).

## CSS baseline
```html
<section class="empty" aria-labelledby="empty-title">
  <svg class="empty-art" aria-hidden="true" viewBox="0 0 96 96">…</svg>
  <h2 id="empty-title">No invoices yet</h2>
  <p>Invoices you send to clients appear here, with their payment status.</p>
  <div class="empty-actions">
    <a class="btn btn-primary" href="/invoices/new">Create invoice</a>
    <a href="/import">Import from CSV</a>
  </div>
</section>
```
```css
.empty {
  display: grid; justify-items: start; gap: var(--space-3);
  max-inline-size: 44ch;                           /* readable measure */
  padding-block: var(--space-12, 48px);
  animation: empty-in var(--duration-standard) var(--ease-enter) both;
}
.empty-art { inline-size: 64px; block-size: 64px; color: var(--color-muted-foreground); }
.empty h2 { margin: 0; font-size: var(--text-lg); }
.empty p  { margin: 0; color: var(--color-muted-foreground); }
.empty-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); margin-block-start: var(--space-2); }
@keyframes empty-in { from { opacity: 0; } }      /* fade only: it replaces content in place */
@media (prefers-reduced-motion: reduce) { .empty { animation-duration: var(--duration-short); } } /* opacity is kept */

@media (min-width: 768px) { .empty.is-centered { justify-items: center; text-align: center; margin-inline: auto; } }
```
Use `.is-centered` only for full-page first-run states; inline/no-results variants stay left-aligned with the list they replace.

## React + Motion
Not needed. Switch variants with plain conditionals; the fade above covers the transition. If the list uses `AnimatePresence`, give the empty state `key="empty"` so it crossfades with the last removed item.

## Vue / Svelte
- Vue: `<Transition name="fade" mode="out-in">` around `v-if="items.length" … v-else-if="filtersActive" … v-else`.
- Svelte: `{#if}` chain with `in:fade={{ duration: ms('standard') }}` on each variant.

## A11y
- Headline is a real heading at the right level; the illustration is `aria-hidden`.
- When a filter action produces no results, announce it via a polite live region ("No results for 'acme'") — the list silently vanishing is not perceivable.
- The primary action is a link if it navigates, a button if it acts.

## Writing
- Speak in the user's nouns (writing.user-language); no "No data", "Nothing here!", or jokes in serious contexts (personality.serious-trustworthy).
- The button label is the verb that fixes the emptiness ("Create invoice", not "Get started").

## Upgrade trigger
None.
