# Tailwag Grooming: salon booking (r5, skill side)

Brief: "Salon booking: dog owners pick a time for a groom, on their phone." Svelte 5 + Vite, plain JS. `npm install && npm run dev` / `npm run build`.

Base: the r4 app's design files (`.design/`), data, store and screens were carried over; the six components were re-scaffolded from the fixed skill and the screens adapted to the scaffold's API.

## Direction chosen: C, "Appointment Card" (agent pick, from r4 specs)
Biscuit-coloured paper, bath-tile teal primary, tennis-ball mark colour, Bricolage Grotesque + Figtree, ticket-stub motif (dashed tear line with half-round notches) on the day/time card, review ticket, confirmation and visit cards. Dark mode: deep teal-black with the same motif. Not ink-on-paper, not the quiet default.

## Flow and states
Dog + groom (10 services, price and length by size) -> day strip + slot grid -> review form (validated) -> appointment-card confirmation; Visits (Upcoming/Past, cancel dialog with the 24h consequence, rebook). Reachable states: slot skeleton, closed Sunday, nothing-fits day, Saturday load failure with retry, offline banner/errors, field validation, slot lost at confirm, visits skeleton, empty upcoming/past, damaged saved list (`localStorage` `tailwag.visits.v1`), toasts. All data is sample data.

## Components from the scaffold (final scaffold, regenerated)
button, field, toggle, dialog, tabs, toast: re-run with `scaffold-component.mjs --framework svelte --force`; files untouched (`.svelte`, `.css`, `.behaviour.js`). Hand-written, no spec: Choice (native radio card/chip/day), Ticket, Icon, Monogram. No primitive library.

Removed from the previous version (the new scaffold makes them unnecessary):
- `value` + `oninput` and `checked` + `onchange` wiring: now `bind:value` (name, phone, notes) and `bind:checked` (both toggles).
- Single-line "anything we should know": now `<Field multiline rows={3}>`.
- Dialog: one-way `open` mirrored with `onclose`: now `bind:open`; `autofocus` on "Keep visit" replaced by `initialFocus="[data-dialog-close]"` (the check-static low finding is gone). `onclose` is kept only to clear the selected visit.
- Toast: desktop corner overrides replaced by `--toast-offset`.
- `<script lang="ts">` in a JS project: generated output is now plain script.
- Field `error` vs behaviour conflict: gone (`data-controlled`); the app passes no `error`.

## Checks
- `check-components --strict`: ok, 0 findings. `check-static`: 0 high, 0 medium, 0 low.
- Build: `npm run build` exit 0 (vite 6, JS 110 kB / CSS 42 kB, fonts bundled via Fontsource, no CDN).
- Browser (Playwright chromium, 1280 and 390 wide, light and dark): book -> Monday slot -> review (empty phone shows the field error, focus on it) -> fill, notes textarea, toggle -> done (toast shown) -> visits -> cancel dialog (modal, focus on Keep visit) -> confirm closes it via `bind:open` -> Past tab. 0 console errors or warnings in all four runs.

## Remaining friction
1. **No submit-time validation in the field behaviour:** it validates on blur only, so on submit the app dispatches `focusout` on each invalid control to make the message show (still in `Review.svelte`). A `validate`/`reportValidity` hook on the field behaviour would remove it.
2. **Toast placement is one value:** `--toast-offset` sets bottom and right together, so on a phone the region still needs an `inset-block-end` override in `app.css` to sit above the tab bar (and higher in the booking flow's action bar).
3. **Toast `ondismiss` gives `dataset.id` (string)** while ids are numbers: the app compares with `String()`.
4. **Tabs:** only `string[]` labels (no count badge or id/label split); `panel` receives the label, so the app matches on it.
5. **Dialog `title`/`description` are snippets** (not strings); fine, but the first-time reader expects props.
6. App bug fixed earlier (not a skill issue): `When.svelte` default-day `$effect` ran after a `$derived` that parsed it; now set synchronously.
7. Scratchpad shared between parallel agents: use a unique subdirectory.
