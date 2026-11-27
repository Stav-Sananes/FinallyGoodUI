# Larder Board (meals)

Brief: "Meal planner: a household of three plans the week's dinners and shops by aisle." Vue 3 + Vite + TypeScript. `npm install && npm run build && npm run preview`. Local only, no CDN (fonts via @fontsource, icons via lucide-vue-next).

## Direction
A kitchen chalkboard hung on a kraft wall: seven chalk lines, three seats each, with the shopping list as store aisle signs beside it. Only direction A was built (directions: one, chosen by agent for distinctiveness; B tide table and C receipt rejected in `.design/directions/a.spec.md`).

## Concept mapping
- Kitchen chalkboard -> the week board: one ruled line per night, three seat marks per line.
- Chalking a dinner in -> an open night opens the recipe list; picking writes the dish on the line (chalk-yellow underline draws in) and the aisle walk recomputes.
- Price tag / shelf label -> a record is a ruled line (record surface: edge ruled, flat); aisle signs are hung slate panels with a cut corner; dialog and toast are layered soft panels; controls are sharp.

## Skeleton
Left spine of four places (bottom bar on the phone, no top bar) -> board (about 62% wide, headline, seven lines, tally strip) -> aisle-walk rail (about 36%) hung beside it. Amends the blueprint shell (decisions D-2).

## Signature
The week board, `data-fgu-signature`, a working control: tap a seat (portions and the list recompute), tap the cook (pass the pan), tap an open line (chalk in). Measured by check-genericness: 54.4% of the first viewport at 1440x900 (promise 45%), 89.3% at 375x667 (promise 60%).

## Genericness (final run)
0 triggers, G10 pass, no fidelity findings. Radii seen: 0, 6, 9999 (three, so radiusUniform stays quiet). Canvas kraft OKLCH L0.89 C0.045. Fonts Young Serif + Karla + Spline Sans Mono.

## Checks
- `npm run build` (vue-tsc + vite) passes.
- check-components --strict: ok, 0 findings (button, dialog, toggle, field, select, toast, record-row, record-card).
- check-static: 0 high, 0 medium, 0 low (after one fix: `main:focus` outline reset).
- Browser walk (own Playwright script, 72 assertions: 1440 and 390, light and dark): chalk in, undo, seat toggle recomputing the list, pass the pan, diet conflict warning, Escape closes dialog, check items, pantry, hide pantry, add item with empty-field error, recipe URL state, forced `?state=loading|error|empty`, retry. 0 failures, 0 console errors, no horizontal overflow.
- States: loading skeletons, error with Try again, empty (board, list, recipe pane) via `?state=`; `?state=empty` clears the saved nights.
- Not run: check-flows, the independent ui-reviewer, pairwise compare, the baseline-html comparison, scrollbars-always-visible and 50%-zoom passes. Not independently reviewed.

## Friction with the skill
1. The scaffolded `select.vue` does not compile: three consecutive `v-else` branches (native select, trigger button, listbox) and a trailing `v-else` on the hidden input. `vite build` fails with "v-else has no adjacent v-if". Fixed by hand (`v-if="variant !== 'native'"`); check-components passed anyway, so it does not catch a template that cannot compile.
2. Component spec/checker cover only structure: record-row slots (`status`, `action`) are described as words and buttons, but a board line needs seat controls; I put them in `status`. A spec for a "control cluster" slot would help.
3. Scoped token overrides (re-pointing `--color-card`, `--color-primary` inside the board so scaffolded buttons turn chalk-yellow) are the natural way to put a dark object on a light page, but the skill never says so; the style profile has no notion of an inverted surface.
4. check-static found nothing for px literals or ad-hoc rem widths in hand-written CSS; I cannot tell whether that is true cleanliness or no rule.
5. `contrast.mjs` prints multi-line JSON and takes exactly two quoted args; a one-line `--ratio` output would make the "check every text pair" step cheaper.
6. Token drafting: the CSS-string draft + `--format dtcg` normalise step worked, but there is no documented way to add a third font role (`display`); it worked by naming it freely.
7. The G10 first-viewport size is fixed at 375x667 whereas the brief asked for 390x844; I used 375 numbers as the skill defines.
