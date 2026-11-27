# Pigeonhole (tracker): round 6 build

Brief (verbatim): "Issue tracker: a six-person team triages its issue list from the keyboard."
Stack: Angular 22.3 (latest stable CLI), standalone components, signals, router. No backend: 15 seeded issues, persisted to localStorage. Fonts self-hosted through fontsource, no CDN.
Mode: autonomous, directions `one`, verify `browser`. Fresh direction; nothing carried from r4 or r5.

## Run it
```
npm install
npm start                 # http://localhost:4200
npm run build             # dist/tracker
```
Node: the Angular 22 CLI needs >= 22.22.3 or >= 24.15. This machine's default is 24.11.1, so I built and served with Homebrew Node 25.9 (`PATH=/opt/homebrew/opt/node@25/bin:$PATH npm run build`); `.nvmrc` says 25.
States are reachable by URL: `/triage?state=loading|error|empty`, `/issues?state=loading|error|empty`, `/issues/224?state=loading|error`, `/issues/9999` (no such issue). Keys: `?` in the app.

## Direction: The Sorting Case (chosen by agent)
Triage is sorting slips of paper into six people's pigeonholes, so the screen is the case. You pick the slip with J/K and drop it into a hole with 1-6; each hole shows the person's load as slips standing in it. Chosen on distinctiveness: not list+detail, not kanban, not ink-on-paper (kraft canvas, verdigris primary, walnut case, brass key caps). Specs: `.design/directions/c.spec.md` (A "Morning Ledger" and B "Dispatch Wall" are written as paragraphs, unbuilt).

Axes: density balanced, contrast stark, type humanist/serif (Fraunces + Hanken Grotesk + IBM Plex Mono), layout object, material bezel/tonal, motion expressive curves at productive durations.

## Concept mapping
| World | Screen structure / interaction / record shape |
|---|---|
| pigeonhole case | the Desk: six holes in a 3x2 grid, one per teammate, load shown as slips standing in the hole |
| sorting a slip | press 1-6 (or tap a hole): the slip drops into that hole in 150ms; Z undoes |
| issue slip | record shape: perforated edge after the case number (`record-row` in the queue, `record-card` for the big slip) |

## Skeleton
First the 112px case number on the slip, then the six holes under it, then the unsorted queue beside it. At 1440: spine 72px | queue 30% | desk (slip 45%, case 55%), key strip 44px along the foot. At 390: desk first (slip, then the case in 2x3), queue below, bottom nav. The blueprint's nav was amended: no top bar, a spine of wood-coloured slots and a key strip (decisions D-2).

## Signature and measured shares
The Desk (slip + case) is the signature: a working control that assigns the current slip and shows load. Tagged `data-fgu-signature`, one per screen.
| Viewport | Promise | Measured |
|---|---|---|
| 1440x900 | >= 25% | 62.6% (light and dark) |
| 390x844 | >= 40% | 78.1% (light and dark) |
| 375x667 (tool's own) | >= 40% | 100% |

## Genericness (G10, final run, `.design/reports/genericness-final.json`)
0 triggers of 8 (pass; fewer than 3). First run had 1 (`scaleFlat`: the 112px case number was `aria-hidden`, so the probe ignored it; fixed by making the number real text, largest/second-largest now 112/26). Surface radii in use: 0, 2, 6, 14 px.
Refuses (from the spec): equal-card grid (cardCoverage 0), centred column (singleColumn did not fire), per-row menu (rows end in a visible "Later" button, rowRepeat did not fire).

## Check results
- `npm run build`: passes (Node 25.9; see Node note).
- `check-components --strict`: ok, 0 findings (8 components scaffolded for Angular: button, field, select, dialog, toast, table, record-row, record-card; role-based `.design/component-style.json`: record = perforated/flat, panel = layered/soft, control = sharp/flat; surfaces differ).
- `check-static`: 0 high, 0 medium, 0 low (the first pass found 2 high: `outline: none` on `<main>` and a clickable `<div>`; fixed).
- `check-flows` final run r4 (3 flows, all state variants, 390 and 1440, light and dark, reduced motion): 0 high, 0 medium, 5 low (justified in decisions D-7), 0 console errors, 0 flow errors. r0 had 2 high, 6 medium, 41 low.
- Own keyboard and browser walk (`walk.mjs`, 43 assertions, all pass, 0 console errors): j/k, 1-6, p, s, x, z, c, ?, g t / g i, /, Enter, Escape; empty-title error; inbox drained to the SORTED state and undone; search, sort and filters in the URL; tap-to-assign on a phone-sized touch context; no horizontal overflow at 390 on every screen, light and dark.
- Not done: no independent `ui-reviewer` (no subagents), so no reviewer scorecard; no pairwise round; no baseline.html. Axe not installed (dependencies are never installed in an autonomous run); contrast was computed with the skill's contrast script instead.
- Screens in `.design/reports/shots/`.

## Friction with the skill (precise)
1. `check-flows.mjs` ignores `FGU_PLAYWRIGHT_ROOT`; only `check-genericness.mjs` honours it. With playwright living in another project I had to build a scratch root with a `node_modules` symlink and copy `.design/` into it, then copy the reports back. One shared resolver in `lib/playwright.mjs` would fix it.
2. The Angular CLI refuses the Node on this machine (24.11, needs 24.15), and nothing in detect/build says what to do; the skill should name the Node floor next to the Angular adapter and say to report the Node actually used.
3. A flow-level `"ready"` selector is waited after every `goto`, including the forced-state `goto`s, so a ready selector that only exists in the full state times out in empty/error/loading (6 false errors in r0). The docs list `ready` without that caveat; per-state `ready: null` or a state-level override is needed.
4. Table component cells render text only (`{{ row[col.key] }}`), so a row cannot carry a link or button. I had to bolt on row click, Enter, tabindex and a cursor outside the component, and the static rule `div-onclick` then fires on any wrapper. A `cell` slot or a `rowHref` would remove the workaround.
5. Style-profile `edge: perforated` only draws a dashed border after the lead; it reads as a tear line but there are no punched holes, so a ticket-like shape needs page CSS. Fine for this app, not what the name promises.
6. Scaffolded component CSS has specificity (0,2,0) and loads after the app's global CSS, so a same-specificity override in `styles.css` silently loses (my slip title stayed 15px until I prefixed `[data-fgu=...]`). The adapter doc should say app overrides need one more class or attribute.
7. G10 `scaleFlat` ignores `aria-hidden` text, so the usual "decorative giant number" pattern with `aria-hidden` makes the check fail for a reason the doc does not state. Worth a line in verify.md 7d.
8. The skill's own `anim-color` and `off-token-spacing` lows come from scaffolded components (record-row current background, dialog computed width); G5 asks me to fix or justify every low, but these cannot be fixed in app code. A way to mark component-owned findings as accepted would save the justification boilerplate.
9. The default `anyComponentStyle` budget (4kB warn, 8kB error) is below what the scaffolded `select.css` plus a real page stylesheet need; the build fails until the budget is raised. The Angular adapter should mention it.
10. The `shared.css` side of the app (slip, skeleton, note styles) had to move out of the first page's stylesheet once a second route used the slip: the build step's "shared components first" rule covers scaffolded components but not app-level shared pieces such as the slip.
