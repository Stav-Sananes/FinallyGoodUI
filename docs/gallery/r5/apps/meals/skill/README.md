# Supper Board (meals, skill side, round 5)

Brief: "Meal planner: a household of three plans the week's dinners and shops by aisle."

- **Stack:** Vue 3 + Vite + TypeScript, hash routing, fonts self-hosted via fontsource (no CDN). `npm install && npm run build` (vue-tsc + vite build) passes.
- **Run:** autonomous, directions one (`.design/config.json`). Brief, blueprint, decisions, direction specs, tokens and `component-style.json` carried over from r4 (same brief, same chosen direction) and not redone; src was re-assembled: store, data, views, parts and styles from r4, components freshly scaffolded and views adapted to the scaffold's API.

## Direction: Greengrocer's Board
Price board outside a greengrocer: lettuce canvas, beet-red primary, bottle-green ink (designed dark: deep green board), Fraunces display + Figtree, punched hang-tag motif (day labels, aisle headings, week-set badge, brand mark, empty states). Chosen by agent as the subject-led option; A (Kitchen Notebook) and B (Butcher's Block) specs in `.design/directions.md`, not built. Key flow: Week -> Add dinner (search dialog) -> night row + cook -> menu (swap / cook / remove with undo toast) -> seventh night shows "Week's set" tag -> Shop (derived from plan, by aisle or by dinner, tick, at-home switch, own lines, copy list). Data: 12 dinners, 24 lines. States: loading (600 ms skeletons), error (corrupt saved plan: `localStorage["supper-board:v1"]="{"`, retry / start fresh; clipboard failure toast), empty (cleared week, empty list, no search results), partial, full, all-done.

## Components
All 8 (button, field, toggle checkbox+switch, disclosure, dialog, menu, tabs, toast) are regenerated with the final `scripts/scaffold-component.mjs --framework vue` and used exactly as emitted (0 edits to scaffold output; shared `<name>.behaviour.js`, CSS scoped by `data-fgu`). Wired by props, slots and v-model only. Hand-written (no spec): Icon, HangTag, views, store, picker dialog content, native `<select>`s.

## Checks
- `check-components --root . --strict`: ok, 0 findings (8 components). `check-static`: 0 findings. `npm run build` (vue-tsc + vite build): pass.
- Browser (playwright chromium, preview build): 1440 and 390 widths, light and dark. Walked: picker dialog (initial focus on search, Enter does not close it, pick, undo toast), New dinner dialog (initial focus on first field, empty submit blocked, save closes and toasts), Shop (checkbox and switch via v-model, tabs, own-line validation message, add), no horizontal scroll, toast above the bottom nav on phones. 0 console errors or warnings. Not covered: reduced-motion probe, screen reader.

## Removed by the final scaffold (this regen)
1. TS fixes on `button.vue` (`type` union) and `toggle.vue` (`null` -> `undefined`): emitted correctly now.
2. Switch selector patch in `toggle.css` (5 selectors): emitted correctly now.
3. `:value` + `@input` / `:checked` + `@change` workarounds: now `v-model` (field) and `:model-value` / `@update:model-value` (toggle, controlled from the store).
4. `@close="open = false"` on dialogs: now `v-model:open`.
5. Hidden `<form novalidate>` wrapper inside dialogs and own submit/close handling for New dinner: the dialog's own `<form method="dialog">` and its `actions` slot are used; `@submit` on the dialog runs save.
6. `autofocus` attribute (two low check-static findings): `initial-focus` on the dialog.
7. Toast placement override of `inset-block-end` with specificity hack: partly replaced, see friction 1.

## Remaining friction
1. `--toast-offset` moves the region on both axes. On phones I need only the bottom raised above the tab bar; setting it pushed the toast off the right edge. Kept one rule in `src/styles/base.css` (`body [data-fgu="toast"]... { inset-block-end }`; `body` prefix because component CSS loads after app CSS). A block-axis token would remove it.
2. No form-level validation helper: field validates on focusout only. The Shop "add" form is `novalidate`, so `src/forms.ts` still dispatches `focusout` on invalid controls. (In the dialog form, native validation runs on submit, so custom `data-msg-*` texts show only after a field was blurred; the browser's own bubble appears on first submit.)
3. Dialog `<form method="dialog">` submits on Enter in a single-field body (picker search), which would close it; I stop it with `@submit.prevent` on the dialog.
4. Menu trigger gets no surface from the style profile, so with `radius: soft` it stays square; one rule in `base.css`.
5. `disclosure` is one item per component; menu has no label prop (visually hidden span in the slot).
6. `dist/` is not covered by the repo .gitignore (only `node_modules/`); do not stage it.
