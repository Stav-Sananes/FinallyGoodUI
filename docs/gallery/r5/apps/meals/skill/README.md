# Supper Board (meals, skill side, round 5)

Brief: "Meal planner: a household of three plans the week's dinners and shops by aisle."

- **Stack:** Vue 3 + Vite + TypeScript, hash routing, fonts self-hosted via fontsource (no CDN). `npm install && npm run build` (vue-tsc + vite build) passes.
- **Run:** autonomous, directions one (`.design/config.json`). Brief, blueprint, decisions, direction specs, tokens and `component-style.json` carried over from r4 (same brief, same chosen direction) and not redone; src was re-assembled: store, data, views, parts and styles from r4, components freshly scaffolded and views adapted to the scaffold's API.

## Direction: Greengrocer's Board
Price board outside a greengrocer: lettuce canvas, beet-red primary, bottle-green ink (designed dark: deep green board), Fraunces display + Figtree, punched hang-tag motif (day labels, aisle headings, week-set badge, brand mark, empty states). Chosen by agent as the subject-led option; A (Kitchen Notebook) and B (Butcher's Block) specs in `.design/directions.md`, not built. Key flow: Week -> Add dinner (search dialog) -> night row + cook -> menu (swap / cook / remove with undo toast) -> seventh night shows "Week's set" tag -> Shop (derived from plan, by aisle or by dinner, tick, at-home switch, own lines, copy list). Data: 12 dinners, 24 lines. States: loading (600 ms skeletons), error (corrupt saved plan: `localStorage["supper-board:v1"]="{"`, retry / start fresh; clipboard failure toast), empty (cleared week, empty list, no search results), partial, full, all-done.

## Components
All 8 (button, field, toggle checkbox+switch, disclosure, dialog, menu, tabs, toast) come from `scripts/scaffold-component.mjs --framework vue`, used as emitted (shared `<name>.behaviour.js`, CSS scoped by `data-fgu`). Wired by props/slots/attrs only; no wrapper rewrites. Hand-written (no spec): Icon, HangTag, views, store, picker dialog content, native `<select>`s. Edits to scaffold output (3, all minimal): see friction 1, 2.

## Checks
- `check-components --root . --strict`: ok, 0 findings (8 components).
- `check-static`: 0 high, 0 medium, 2 low (`autofocus` on the first field of two dialogs; intentional, a focused field inside a dialog).
- Build: pass. Contrast on text pairs was checked in r4 (tokens unchanged).
- Browser (playwright chromium, preview build): 1440 and 375 widths, light and dark. Walked: skeleton, add via picker (search, no-results, focus on search), undo toast, menu with keyboard (cook change), completing week, Shop tick, tabs, aisle disclosure, own-line validation message, New dinner dialog validation + save, corrupt-storage error and recovery, Clear week confirm + empty states (Week, Shop), no horizontal scroll at 375, toast above bottom nav. 0 console errors or warnings. Not covered: reduced-motion probe, screen reader.

## Friction in the skill (this round)
1. **Scaffold type errors in strict TS.** `button.vue`: `type?: string` is passed to `<button :type>` (TS2322); `toggle.vue`: `:role="... : null"` (TS2322). `vue-tsc` fails the build on the raw output. Fixed in the app: `type?: "button" | "submit" | "reset"`, `null` -> `undefined`. Skill fix: emit those types.
2. **Switch variant CSS never matches in Vue.** `toggle.css` uses `[data-fgu="toggle"] [data-variant="switch"] ...` (descendant), but the Vue template puts `data-fgu` and `data-variant` on the same root, so the switch rendered as a square checkbox. Fixed in the app by `[data-fgu="toggle"][data-variant="switch"]` (5 selectors). `check-components` does not catch it (`state-unstyled` passes).
3. **Style profile gives the menu trigger no surface**, so with `radius: soft` the trigger stays square next to soft cards; added one rule in `src/styles/base.css`.
4. **No v-model path.** `field`/`toggle` use `inheritAttrs: false` with attrs on the control, so `v-model` silently does nothing; the adapter doc does not say to use `:value` + `@input` / `:checked` + `@change`. Likewise `tabs` emits no selected-change event (both panels must render), `disclosure` is one item per component, `dialog` `open` prop stays true after Escape (listen to `@close`), menu has no label prop (put a visually hidden span in the slot).
5. **No form-level validation helper.** Field validates on focusout only; on submit I dispatch `focusout` on invalid controls (`src/forms.ts`). A documented `validate` export would help.
6. **Toast placement is fixed bottom-right** with no token for a bottom nav; overridden in base.css (needed `body` prefix for specificity since component CSS loads later).
7. Positive: scaffold output was real working markup for all 8 specs; r4 friction 1-8 (empty skeletons, global CSS collisions, profile layer, `role-no-keyboard` false positives, fonts package names) did not recur. Behaviours attach once at mount; dynamic content worked here because panels/lines are outside the attached parts.
8. `dist/` is not covered by the repo .gitignore (only `node_modules/`); do not stage it.
