# Saltmarsh & Rook, Monday books (r5, skill side)

Brief (verbatim): "Studio finance: the owner of a small design studio takes a Monday look at cash, runway, overdue invoices and payroll."

- Stack: React 19 + Vite + TypeScript, `radix-ui` installed (not needed: no component wired a Radix primitive). Run: `npm install && npm run dev`. No CDN; fonts self-hosted via Fontsource.
- Run mode: autonomous, directions one. Self-answered decisions: `.design/brief.md`, `.design/decisions.md` (D1-D9). Overrule any.
- Data: made-up studio, 12 invoices, 8 people, 3 accounts, 5 costs, 4 retainers, as of Mon 23 Nov 2026. Kept in localStorage. Runway is computed from the books, not typed in.
- Key flow: Monday -> remind (undo toast) or mark paid (dialog, validation, partial payment, undo) -> runway and tide curve recalculate -> approve Friday's pay run (confirm dialog, undo).
- States: loading skeletons (900ms bank-feed delay), bank-feed error (Studio menu > "simulate a bank outage", offline, or `#/?feed=down`), cleared books empty states on all three screens (Studio menu > "clear the sample data"), empty tabs, search with no match, approved payroll, short-payroll warning.

## Direction: Tide Table (chosen by agent, for distinctiveness)
Money is a water level. The waterline (a wavy rule) is the motif: under headings, the nav and tab-bar current marker, the staff and tide curve, empty states. Runway is the headline sentence ("Afloat for 5.8 more months"), a tide-gauge staff with twelve month marks, and a month-end tide curve with a dashed "dry dock" line at zero. Sea-fog paper, deep tidal ink, teal primary, buoy-red for overdue. Fraunces (display and figures) + Instrument Sans. Flat hairline surfaces, soft radius. Dark mode designed (deep sea-night), follows the OS, switch in the header. Mobile: bottom tab bar under 720px. Expressive moment (once per session, <= 600ms, off for reduced motion): runway count-up, staff fills, curve swells.
Style profile: `{"radius":"soft","material":"flat","density":"balanced","motion":"productive"}`.

## Components: scaffold vs library vs hand-written
| Component | Source | Used for |
|---|---|---|
| button, field, toggle, disclosure, dialog, menu, tabs, toast | `scripts/scaffold-component.mjs`, all 8, kept as emitted (shared `*.behaviour.js`, source "shared"; Radix was not wired) | remind/pay buttons; invoice and payment forms; theme and scenario switches; "how runway works" disclosures; payment, new-invoice, approve dialogs; header Studio menu and per-row menu; invoice status tabs; undo toasts |
| Radix primitives | none | `radix-ui` is installed but unused: the scaffold wired none |
Hand-written (no spec covers them): app shell and nav, tide curve and staff (inline SVG), readings list, overdue list, pay-run cover bar, people list, icons, skeletons, toast provider (`src/lib/toasts.tsx`, owns the list the scaffolded Toast renders), dialog host (`src/dialogs/Dialogs.tsx`). Business logic (`forecast`, store, actions) adapted from the r4 attempt.
Edits to scaffold output (all marked `project fix`, 4 one-line changes): see friction 1-4.

## Checks
- `check-components`: ok, 0 findings.
- `check-static`: 0 findings (first run: 1 high, 2 medium, 1 low; fixed: removed `main:focus` outline reset, renamed the two 600ms animations to `signature-*`, snapped a 112px padding to tokens).
- Contrast spot checks with `scripts/lib/contrast.mjs`: body/muted/primary/destructive pairs 5.4-7.7 in both themes; input border raised from 2.9 to 3+.
- Build: `npm run build` (tsc -b + vite build) passes.
- Browser (Playwright MCP): Monday, Invoices, Payroll at 1280-1440 and 390 wide, light and dark; mark-paid validation and success, approve pay run, outage banner and retry, empty states. No console errors or warnings after friction 4 was fixed. Not done: automated flow walk (verify = static), independent reviewer, reduced-motion pass.

## Friction (skill, scaffold, scripts)
1. Scaffold TSX does not type-check under the Vite template tsconfig (`noUnusedLocals`, strict): `button.tsx` types `type` as `string` but passes it to `<button type>` (TS2322); `toggle.tsx` emits `role={... : null}` (TS2322); `field.tsx` imports `ReactNode` unused (TS6196). `npm run build` failed until each was patched.
2. `menu.tsx` emits `popovertarget` via spread; React 19 logs "Invalid DOM property popovertarget" on every load. Needs `popoverTarget`.
3. `toggle.css` switch selectors are descendant (`[data-fgu="toggle"] [data-variant="switch"] ...`) but `data-fgu` and `data-variant` sit on the same root, so no switch is ever styled: it renders as a plain checkbox. Fixed to a compound selector.
4. Toast API is a list-prop component, there is no `useToast`/provider, so every app writes its own (and its undo wiring). A provider in the scaffold would remove the most common hand-written piece.
5. Tabs are uncontrolled (aria-selected seeded from index 0, no `value`/`onChange`): selecting a tab from a URL needs reaching into `selectTab` on the DOM; the app cannot know the active tab. Dialog likewise needs `data-dialog-close` / `onClose` conventions that the adapter doc does not mention.
6. `radix-ui` installed but the react adapter's "primitives" path never fires for it (no `Primitive` export), so the install is dead weight in this stack; the stack profile still reports it.
7. Rule collision persists: autonomous says never install dependencies, `system.md` says a chosen face must load. I installed two `@fontsource-variable/*` packages (decision D5). `emit-tokens --format css` also emits a font stack that repeats the family name (`"Instrument Sans Variable", "Instrument Sans"), "Instrument Sans", ...`).
8. Token authoring is still manual: I generated `tokens.json` (DTCG, hex to OKLCH) with a throwaway script because no tool takes a hex palette and writes the light/dark pair; `color-scale.mjs` is for scales only.
9. `directions: one` plus autonomous: followed the autonomous text (pick on distinctiveness, build only the pick, no prototype page).
10. Zsh: `for p in "a b"; contrast.mjs $p` does not word-split (known); `contrast.mjs` prints verbose JSON, a `--ratio` flag would help batch checks.
