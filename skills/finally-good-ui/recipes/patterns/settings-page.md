# Pattern: settings-page

**Intent:** make many options findable and safe to change: grouped by the user's mental model, with one clear, consistent save model.

**Cards:** ia-nav.progressive-disclosure · layout.proximity-grouping · flows-forms.sensible-defaults · usability.user-control-undo · states.optimistic-feedback · usability.consistency-standards · writing.front-load · states.partial-and-permission

**When NOT to use:** for 1–3 options (put them where they take effect, e.g. a view menu); for onboarding choices (ask in the flow, with defaults).

**Tokens:** `--space-*` · `--text-*` · `--color-border/muted-foreground/primary/destructive` · `--duration-short` · `--duration-standard` · `--ease-snappy` · `--ease-enter` · `--ease-exit`

## Structure
- Group by the user's task ("Notifications", "Billing", "Team"), not by internal system. ≤ ~7 groups; beyond that add search.
- Desktop: section nav on the left (sub-routes, or anchors for a single scroll page) + content column ≤ 720px. Mobile: section list → section page (drill-in, back reverses — route-transition).
- Each setting row: label (front-loaded noun), one-line description of the effect, control on the right (toggles) or below (text fields). Show the current value when collapsed.
- **Pick one save model per group and never mix within a group:**
  - *Instant* — toggles, selects, radio: apply immediately, optimistic, confirm quietly ("Saved" inline for ~2s), revert + error message on failure.
  - *Explicit* — related text fields: a sticky save bar appears when dirty ("Unsaved changes · Discard · Save"); guard navigation when dirty.
- Danger zone last, visually separated: destructive actions state consequences, require typed or explicit confirmation (dialog-enter-exit), and offer undo/grace periods where possible.

## States
| State | UI |
|---|---|
| loading | section nav live; skeleton rows of real height in the content column |
| error (load) | inline error with Retry per section; other sections stay usable |
| saving | control shows pending (switch disabled + spinner, or save button "Saving…") |
| saved | inline "Saved" near the control (polite live region), fades after ~2s |
| save-failed | revert control, message beside it with the reason + Retry |
| dirty (explicit) | sticky save bar; `beforeunload` + router guard |
| partial | settings unavailable on this plan shown disabled with the reason and upgrade path |
| no-permission | read-only values as text + "Only workspace owners can change this" |
| empty | n/a — settings always have defaults (flows-forms.sensible-defaults) |

## CSS baseline
```html
<div class="setting">
  <div><h3 id="s-digest">Weekly digest</h3><p id="s-digest-d">A Monday summary of overdue invoices.</p></div>
  <button type="button" role="switch" class="switch" data-key="digest" aria-checked="true"
          aria-labelledby="s-digest" aria-describedby="s-digest-d"></button>
  <p class="saved" role="status" aria-live="polite"></p>
</div>
<div class="save-bar" hidden>Unsaved changes <button type="button">Discard</button> <button type="submit">Save</button></div>
```
```css
.setting { display: grid; grid-template-columns: 1fr auto; gap: var(--space-1) var(--space-4); align-items: center; padding-block: var(--space-4); border-block-end: 1px solid var(--color-border); }
.setting h3 { margin: 0; font-size: var(--text-base); }
.setting p  { margin: 0; color: var(--color-muted-foreground); font-size: var(--text-sm); }
.setting .saved { grid-column: 1 / -1; min-block-size: 1lh; }        /* reserve space: no layout shift */

.switch { inline-size: 44px; block-size: 24px; padding: 2px; border-radius: 999px; border: 0; background: var(--color-border); cursor: pointer; }
.switch::before { content: ""; display: block; inline-size: 20px; block-size: 20px; border-radius: 50%; background: var(--color-background);
  transition: transform var(--duration-short) var(--ease-snappy); }
.switch[aria-checked="true"] { background: var(--color-primary); }
.switch[aria-checked="true"]::before { transform: translateX(20px); }
.switch:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.switch:active::before { transform: scale(0.92); }
.switch[aria-checked="true"]:active::before { transform: translateX(20px) scale(0.92); }

.save-bar { position: sticky; bottom: var(--space-4); display: flex; gap: var(--space-2); align-items: center; justify-content: end;
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--color-foreground); color: var(--color-background);
  transition: opacity var(--duration-standard) var(--ease-enter), transform var(--duration-standard) var(--ease-enter), display var(--duration-standard) allow-discrete; }
.save-bar[hidden] { display: none; opacity: 0; transform: translateY(8px); transition-duration: var(--duration-short); transition-timing-function: var(--ease-exit); }
@starting-style { .save-bar:not([hidden]) { opacity: 0; transform: translateY(8px); } }

@media (prefers-reduced-motion: reduce) {
  .switch::before { transition-property: none; }
  .save-bar, .save-bar[hidden] { transform: none; }
  @starting-style { .save-bar:not([hidden]) { transform: none; } }
}
```
```js
// Instant model: optimistic toggle with revert on failure
document.querySelectorAll('.switch').forEach(sw => sw.addEventListener('click', async () => {
  const next = sw.getAttribute('aria-checked') !== 'true';
  const status = sw.parentElement.querySelector('.saved');
  sw.setAttribute('aria-checked', String(next));
  try { await save(sw.dataset.key, next); status.textContent = 'Saved'; setTimeout(() => (status.textContent = ''), 2000); }
  catch { sw.setAttribute('aria-checked', String(!next)); status.textContent = "Couldn't save. Check your connection and try again."; }
}));
```
(`.save-bar[hidden]` restores `display: none` over the `flex`; `allow-discrete` keeps the bar rendered during its exit.)

## React + Motion
Not needed. Use the component library's Switch (Radix/shadcn) with the same optimistic handler; `useOptimistic` (React 19) fits the instant model.

## Vue / Svelte
- Vue: `<Transition name="bar">` on `v-if="dirty"` save bar; `onBeforeRouteLeave` for the guard.
- SvelteKit: `beforeNavigate(({ cancel }) => dirty && !confirm(…) && cancel())`; `transition:fly={{ y: 8, duration: 250 }}` on the bar.

## A11y
- Switches: `role="switch"` + `aria-checked` (or a checkbox styled as a switch); label and description wired.
- Status messages in a polite live region; errors next to the control, not only in a toast.
- Headings per section so screen-reader users can jump; section nav marks `aria-current`.

## Upgrade trigger
None.
