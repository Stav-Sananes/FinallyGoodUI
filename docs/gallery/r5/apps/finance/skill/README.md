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
Components regenerated with the final scaffold (no hand edits to scaffold output; 0 `project fix` markers).

## Checks
- `check-components --strict`: ok, 0 findings.
- `check-static`: 0 findings (first run: 1 high, 2 medium, 1 low; fixed: removed `main:focus` outline reset, renamed the two 600ms animations to `signature-*`, snapped a 112px padding to tokens).
- Contrast spot checks with `scripts/lib/contrast.mjs`: body/muted/primary/destructive pairs 5.4-7.7 in both themes; input border raised from 2.9 to 3+.
- Build: `npm run build` (tsc -b + vite build) passes.
- Browser (playwright-core script, 1280 and 390, light and dark): tab from URL and tab click to URL, mark-paid invalid/valid, new-invoice 3 errors, Escape, approve pay run: 0 console errors or warnings. Earlier manual pass (Playwright MCP): Monday, Invoices, Payroll at 1280-1440 and 390 wide, light and dark; mark-paid validation and success, approve pay run, outage banner and retry, empty states. No console errors or warnings after friction 4 was fixed. Not done: automated flow walk (verify = static), independent reviewer, reduced-motion pass.

## Regenerated with the final scaffold
Removed (patches and app-side workarounds), 11 in all:
- Scaffold output edits: button `type` typing, toggle `role={null}`, field unused `ReactNode`, toggle.css compound selector, menu `popoverTarget` (5; the new output type-checks and styles as emitted).
- Tabs: DOM `querySelector` + `selectTab` import and effect replaced by `selected` + `onSelectedChange` (URL `status` is now both source and sink; tab clicks update it).
- Dialogs: `onClose` -> `onOpenChange`; manual `focusout` dispatch removed (errors via Field `error` prop); nested own `<form>` + `form="..."` hidden-submit wiring removed (submit button sits in the dialog's own form, `onSubmit` on the dialog); first-field focus via `initialFocus`.
- Fields: controlled with `value` + `onChange`.
- Toast: provider kept (app state), uses `onDismiss`.

Remaining friction:
1. No submit-time "show every error" API on Field: the app computes messages itself (`validate` in `src/dialogs/Dialogs.tsx` reads `validity` + `data-msg-*`) and passes `error`; it also needs `formNoValidate` on the submit button and `e.preventDefault()` so the dialog's `method=dialog` form neither shows native bubbles nor closes on invalid input.
2. `--toast-offset` moves the region on both axes, so the mobile bottom tab-bar clearance is still a CSS override (`inset-block-end: 72px` in `app.css`).
3. `toggle` `checked` is initial-only (`defaultChecked`): the app's switches stay in step through `onChange`, not by re-passing `checked`.
4. `radix-ui` is installed but the scaffold wires none of it (no `Primitive` export in the unified package); dead dependency.
5. Toast has no provider/`useToast`; `src/lib/toasts.tsx` still owns the list.
6. Font loading vs "never install dependencies" rule collision (two `@fontsource-variable/*` installs, D5); `emit-tokens --format css` repeats the family name in the font stack.
7. Token authoring from a hex palette is manual (throwaway script); `contrast.mjs` output is verbose (a `--ratio` flag would help).
