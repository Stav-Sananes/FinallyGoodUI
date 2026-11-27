# Tracker (skill side, round 5): Sorting Office

Brief (verbatim): "Issue tracker: a six-person team triages its issue list from the keyboard."
Stack: Angular 21.2 (same install approach as r4: CLI 21.2.x, standalone components, signals, plain CSS, no router, no SSR). Not checked whether a newer CLI is the "latest stable"; r4 found 22.x needs a newer Node than this machine has (24.11), so 21 was reused.
Run: `npm install && npm start` (dev), `npm run build` (production, passes). Review states: `?state=loading|error|empty`; going offline makes loads and saves fail for real. Tray and search live in the URL (`?view=mine|all`, `?q=`).
Mode: autonomous, directions: one. All brief/blueprint/direction decisions are self-approved and logged in `.design/` (`brief.md`, `blueprint.md`, `decisions.md`, `directions/specs.md`); overrule any of them there.

## Direction chosen: C "Sorting Office" (chosen by agent: distinctiveness)
Triage is sorting mail. Six teammates are six pigeonholes (keys 1 to 6), the intake list is the tray, priority is a postmark stamp. Manila canvas, postal-blue ink, stamp red/orange/teal for priority, Roboto Slab (display) + Public Sans + JetBrains Mono (self-hosted via Fontsource, no CDN), layered paper with 2-6px sharp radii, productive motion (rows slide out in 150ms; one hero: the "SORTED" postmark stamps down when the user clears intake). Dark mode is a night sorting room (designed, not inverted). Motif: postmark ring (priority stamp, wordmark, empty states, hero) and perforated dotted edges (masthead, letter top). Not chosen: A Ledger (house style), B Console (generic dev tool).

Keys: j/k move, u/h/m/l stamp urgent/high/medium/low, - wipe, 1-6 hand to a person, 0 back to intake, s step status, x close, z undo (also Ctrl/Cmd+Z), [ ] switch tray, c compose, / search, r refresh, Enter read the letter, ? key sheet. Keys pause while typing or while a dialog or menu is open. Every change toasts what happened with Undo; a failed save rolls back and offers Retry.

Data: 13 issues (billing, auth, search, API, mobile and so on), 6 teammates, activity log per issue, in-memory gateway behind an `IssueGateway` port.

## Component sources
All 8 specs were re-scaffolded with the final `scripts/scaffold-component.mjs` (Angular adapter, `--force`) from `.design/component-style.json` and are used as generated; no scaffold output is edited. Used: button, field (search, compose dialog), menu (Stamp priority, Hand to), dialog (compose, key sheet), tabs (Intake / Mine / All), toast, toggle (Show closed), disclosure (Activity log).
Hand-written, app-specific: domain, data, state, and the desk, tray, case, letter and postmark components. App-level CSS lives in `src/styles.css`.

### Round-5 regeneration: workarounds removed (9)
1. Field error part permanently showing "!" (hand edit of `field.component.html`): gone, scaffold output is used as is.
2. `[required]="true"` / `[id]="'x'"` workarounds: bare `required` and `controlId` now work.
3. Search value pushed into the inner input by hand plus an `(input)` listener on a wrapper: `[value]` and `(valueChange)`.
4. Tabs: `focusin` listener, `selectTab` calls in `ngAfterViewInit` and for `[` `]`: `[selected]="viewIndex()"` and `(selectedChange)`.
5. Toggle: reading `event.target.checked` from `(change)`: `(checkedChange)`.
6. Dialog: `setTimeout` focus of the title field: `initialFocus="#compose-title"`.
7. Dialog: own nested `<form>`, hidden submit button and `requestSubmit()`: a real `type="submit"` button in the `actions` slot and `(submit)` on the dialog; field values via `[(value)]` instead of `querySelector`.
8. Dialog open state: `[(open)]` / `(openChange)` instead of manual `closed` plumbing and form reset via DOM.
9. CSS overrides for the always-spinning button spinner and the 20px toggle control: the scaffold now spins only while busy and draws a 24px control (verified in the browser).

## Checks
- check-components: ok, 0 findings (8 components).
- check-static: 0 high, 0 medium, 0 low (two highs found on the way, fixed: a clickable div wrapper around the tabs, and `outline: none` without a replacement).
- Token contrast (scratch script over `scripts/lib/contrast.mjs`): text pairs on background, card, muted and accent surfaces, light and dark, all >= 4.5:1 after two fixes (orange and red on the selected-row tint); input/ring >= 3:1.
- Real browser, first run (playwright-core + cached Chromium, scratchpad, not part of the app): load, j/u/3/z flow, cursor advance, undo, intake-clear hero, `]` tab switch with URL update, `?` sheet, `c` compose with caret in the title and Enter to submit, offline save rollback + error toast, `?state=loading|error|empty`, dark, 390px mobile (no horizontal overflow). 0 console errors or warnings. Probe (`browser/probe.js`) light, dark, reduced motion: 0 findings; mobile: 0 high/medium, 2 low (skip link and the checkbox input itself under 44px; its label is 44px). The probe's own focus walk reports CLS 0.4 on mobile because it opens menus and disclosures; without the walk CLS is ~0.
- Not run: `check-flows.mjs` and `component-smoke.mjs` (both need the full `playwright` package, not installed), no independent ui-reviewer (no subagents).
- Build: `npm install && npm run build` ok. Initial bundle 245.8 kB raw (63.3 kB transfer), no warnings.

## Remaining friction (after the round-5 scaffold)
1. **`ng build` fails under `noPropertyAccessFromIndexSignature`** (the Angular CLI default): `toast.component.ts` reads `dataset.id` (TS4111). Scaffold output is not edited; the app sets `"noPropertyAccessFromIndexSignature": false` in `tsconfig.json`. The scaffold should use `dataset['id']`.
2. **Dialog form has no `novalidate`**, so a `required` field blocks the dialog's submit with the browser's native bubble before the app's own handler runs; the field's behaviour only shows messages on blur, not on the form's `invalid` event. The app keeps `required` (native bubble on empty) and its own error message only for a whitespace-only title.
3. **Density profile has no touch variant.** `dense` fixes controls to 32px; the app keeps an override under `(pointer: coarse)` (`button[data-fgu]`, since scaffolded buttons carry `data-fgu` themselves).
4. **Field cannot hide its label visually**, and the empty error line still occupies space: the search box keeps a `.quiet-label` rule in `styles.css`.
5. **Toast `onAction` receives the toast and the dismiss output only an id**; the store wraps them. Minor.
6. **Probe focus walk inflates CLS** (opens menus and disclosures). Unchanged from the first run.
7. **Playwright discovery:** `check-flows` / `component-smoke` need the full `playwright` package; the walk was driven with `playwright-core` from career-ops.
8. **Dev-mode NG0956 warning** ("track by identity", collection of size 1) from the letter's activity `@for` when the cursor moves between issues; present before the regeneration too, dev server only, not in the production build. Left as is.
Verification: re-run on the final scaffold: `npm run build` ok (245.8 kB raw, 63.3 kB transfer), check-components --strict ok, check-static 0/0/0, real-browser walk (desktop 1280 and 390px, light and dark): j/u/3/z with toasts, `[` `]` and tab click with URL, search `/` with URL, Show closed, compose (caret in title, blank-title error, Enter submit), key sheet, Escape and reopen, no horizontal overflow at 390px; 0 console errors (only the NG0956 dev warning above).
