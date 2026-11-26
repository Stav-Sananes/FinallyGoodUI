# Tailwag Grooming: salon booking (r5, skill side)

Brief: "Salon booking: dog owners pick a time for a groom, on their phone." Svelte 5 + Vite, plain JS. `npm install && npm run dev` / `npm run build`.

Base: the r4 app's design files (`.design/`), data, store and screens were carried over; the six components were re-scaffolded from the fixed skill and the screens adapted to the scaffold's API.

## Direction chosen: C, "Appointment Card" (agent pick, from r4 specs)
Biscuit-coloured paper, bath-tile teal primary, tennis-ball mark colour, Bricolage Grotesque + Figtree, ticket-stub motif (dashed tear line with half-round notches) on the day/time card, review ticket, confirmation and visit cards. Dark mode: deep teal-black with the same motif. Not ink-on-paper, not the quiet default.

## Flow and states
Dog + groom (10 services, price and length by size) -> day strip + slot grid -> review form (validated) -> appointment-card confirmation; Visits (Upcoming/Past, cancel dialog with the 24h consequence, rebook). Reachable states: slot skeleton, closed Sunday, nothing-fits day, Saturday load failure with retry, offline banner/errors, field validation, slot lost at confirm, visits skeleton, empty upcoming/past, damaged saved list (`localStorage` `tailwag.visits.v1`), toasts. All data is sample data.

## Components from the scaffold (kept as emitted)
button, field, toggle, dialog, tabs, toast: `scaffold-component.mjs --framework svelte`, files untouched (`.svelte`, `.css`, `.behaviour.js`). Hand-written, no spec: Choice (native radio card/chip/day), Ticket, Icon, Monogram. No primitive library. App-side changes only: props wired to the scaffold API (`toasts`, `open`+`onclose`, string `tabs` + `panel` snippet, `checked`+`onchange`, `value`+`oninput`), validation through the field behaviour (`data-msg-*`, `pattern`), and the r4 workaround block in `app.css` (re-adding borders the old profile layer removed) deleted: not needed now.

## Checks
- `check-components`: ok, 0 findings.
- `check-static`: 0 high, 0 medium, 1 low (`autofocus` on "Keep visit" in the cancel dialog: the dialog spec says focus the safe choice). The r4 `role-no-keyboard` false positive on tabs is gone.
- Build: `npm run build` exit 0 (vite 6, 145 modules, JS 108 kB / CSS 42 kB, fonts bundled via Fontsource, no CDN).
- Browser (Playwright chromium, 390x844, light and dark): full flow book -> review (empty-submit shows both field errors, focus on first) -> done -> visits -> cancel dialog (modal opens, focus on Keep visit) -> cancelled -> Past tab. 0 console errors or warnings in both schemes.

## Friction list
1. **App bug found only in the browser (r4 carry-over, mine):** `When.svelte` set the default day in an `$effect`, but a `$derived` parsed `app.dayISO` first -> `null.split` crash on every entry to step 2. Fixed in the app (set synchronously). r4 never rendered, so it was invisible. Not a skill bug.
2. **Field `error` prop vs behaviour:** the scaffold's field renders `{error}` in the error `<p>`, and `field.behaviour.js` also writes that node with `textContent`; the two would fight over the text node. I used only the behaviour (native validity + `data-msg-*`) and on submit dispatch `focusout` on invalid controls to make it show. Worth documenting in the svelte adapter: "do not pass `error` when using the behaviour".
3. **Field has no `multiline`/textarea;** the "anything we should know" note is now single-line. Spec gap for a common booking need.
4. **Value/checked are not bindable** (`...rest` on the element): `bind:value`/`bind:checked` do not work; need `value`+`oninput`, `checked`+`onchange`. The svelte adapter does not say so.
5. **Tabs:** only `tabs: string[]`; no count badge or id/label split; selection lives in the DOM (behaviour), not in a prop, so the app cannot read or set the active tab.
6. **Dialog:** `open` is one-way; closing via Escape/`data-dialog-close` happens in the DOM, so the app must mirror it with `onclose` (works, but undocumented). `title`/`description` are snippets, not strings.
7. **Toast:** event gives `dataset.id` (string) while ids are numbers; I had to compare with `String()` in the app store. Placement defaults still need a phone override above the tab bar.
8. **Button:** disabled variant label contrast is very low in both themes (see "Choose a time" / "Review" disabled), and a long label wraps in the action bar. Skill should keep disabled text at readable contrast (WCAG exempts it, but users cannot read why).
9. Scaffold emits `<script lang="ts">` in a JS project; works through vitePreprocess but is surprising (no TypeScript installed).
10. Scratchpad shared between parallel agents: another agent overwrote my script file of the same name; use a unique subdirectory.
