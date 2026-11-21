# Supper Board (meals, skill side)

Brief: "Meal planner: a household of three plans the week's dinners and shops by aisle."

- **Framework:** Vue 3 + Vite + TypeScript (`<script setup>`, hash routing, no router lib). Fonts self-hosted through fontsource (no CDN). `npm install && npm run build` passes (`vue-tsc` + `vite build`); `npm run dev` runs.
- **Run:** autonomous mode, `.design/config.json` = `{mode: autonomous, directions: one, verify: static}`. Brief, blueprint, decisions, direction specs and tokens are in `.design/`. A short browser look (dev server, Week, picker dialog, Shop, toast) was done by the builder; nothing else was walked in a browser.

## Direction: Greengrocer's Board
Thesis: the week should read like the price board outside a greengrocer: hand-lettered, tag-shaped, fresh-coloured, quick to read at arm's length. Lettuce-tinted canvas, beet-red primary, bottle-green ink, Fraunces display + Figtree, punched hang-tag motif (day labels, aisle headings, completion badge, brand mark, empty states). Chosen by agent because it is the subject-led one (A "Kitchen Notebook" and B "Butcher's Block" are written in `.design/directions.md` but not built). Not ink-on-paper: coloured primary, tinted canvas.

Key flow: Week -> "Add dinner" dialog (search) -> night row with cook -> menu (swap, cook, remove with undo toast) -> seventh night triggers the "Week's set" tag -> Shop list derived from the plan, sorted by aisle, with tick, "at home", own lines, copy list. Data: 12 dinners, 5 of 7 nights pre-planned, 24 list lines.

States: loading (skeletons, 600 ms simulated read), error (saved plan unreadable or storage blocked: retry / start fresh; copy-list clipboard failure toast), empty (cleared week, empty list, no search results), partial (open nights), full, all-done. To see the load error: in devtools set `localStorage["supper-board:v1"] = "{"` and reload.

## Components
| Component | Source |
|---|---|
| button, field, toggle (checkbox + switch), disclosure, dialog, menu, tabs, toast | **shared module**, scaffolded with `scaffold-component.mjs` (source `shared`, behaviour in `<name>.behaviour.js`). No primitive library installed, so none wired. All 8 used. |
| Icon, HangTag, views, store, toast queue, native `<select>`s | hand-written (no spec covers them) |

The scaffolded `.vue` files were **not usable as emitted** and were hand-edited (parts, state attributes and behaviour kept; `check-components` still passes). See friction.

## Checks
- `check-components`: 8 components, 0 findings (after hand-edits; the very first run on the raw scaffold also had 0, see friction 1).
- `check-static`: 2 high, 0 medium, 0 low after fixes. Both are `role-no-keyboard` on `menu.vue` `role="menu"` and `tabs.vue` `role="tablist"`: **justified false positives**, the arrow/Home/End/typeahead model is `menu.behaviour.js` / `tabs.behaviour.js` (scaffolded, `attach`), which the rule cannot see. Fixed: HangTag 600 ms swing (renamed selector to `signature-swing`, the week-complete moment), skeleton pulse shortened.
- Contrast checked with `contrast.mjs` on text pairs (min 6.35:1; input border 3.15:1 on canvas).

## Friction and bugs in the skill (honest list)
1. **Scaffolded Vue components are static skeletons.** Empty `<h2 data-part="title"></h2>`, `<input>` and `<p>` with no binding; props like `label`/`hint` are bound as attributes on the root `<div>`; disclosure/menu/tabs/dialog/toast emit one empty span per part, not a usable DOM (disclosure has no heading>trigger>panel nesting, no ids). `check-components` passes on this, so a green check says nothing about usability. I rewrote all 8 templates.
2. **Component CSS is global and collides.** Every file uses bare `[data-part="root"]`; in Vue `<style src>` is unscoped, so toast's `position: fixed` root rule hit every component's root. Fixed by `<style scoped src>`, which then forced menu items, tabs and dialog actions to be rendered inside the component (slot content is not scoped), i.e. an items-array API the adapter doc does not describe.
3. **The style-profile layer breaks the reference CSS.** Generated `[data-part] { border-style: none; border-radius; box-shadow }` has the same specificity as the reference rules and comes later, so it removes the checkbox/switch/field borders and puts a shadow on every label and hint. I deleted the generic block in each CSS and wrote narrow per-part overrides. Profile also cannot express display font, per-part radius or elevation (dialog vs button).
4. `component-style.json` is required but no module says how to derive it ("chosen in the design interview"); the schema is only in `scripts/lib/style-profile.mjs`. Nothing in interview/system modules or the question bank mentions it.
5. `check-components` prints truncated paths (`rc/components/...` for `src/...`).
6. `emit-tokens --format fonts --loader fontsource` prints `@fontsource/figtree-variable`; the real packages are `@fontsource-variable/figtree` (fixed by hand).
7. `check-static` `role-no-keyboard` flags the skill's own scaffolded menu/tabs (see above); adapter docs forbid `@keydown`, so the two rules cannot both be satisfied without an allow marker. Only the `signature`/`expressive` selector escape exists for durations; a general allow comment would help.
8. Behaviours attach once at mount (disclosure `inert`, tabs wiring, menu items), so dynamic Vue content needs care (re-mount with `key`); the Vue adapter says nothing about it. Dialog: the adapter's opener-focus-return relies on `[data-dialog-open]`; with programmatic `showModal()` I re-implemented focus return in the wrapper.
9. `detect-stack` reports `icons: null`, `components: null` correctly for greenfield, but `scaffold --framework` auto-detect worked only once `package.json` listed `vue`. Fine, minor.
10. Autonomous mode works as written; the directions "one" path still asks for rolls/specs for B and C in text, which was useful but heavy without a builder.
