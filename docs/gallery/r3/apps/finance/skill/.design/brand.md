# Brand — Studio Ledger (from Direction C: Day Book)

status: locked 2026-11-16 (autonomous)
Source of truth: `tokens.json` + `tokens.dark.json` (+ `tokens.resolver.json`). `tokens.css` is the emitted CSS, inlined into `index.html`.

## Colour roles
- Canvas: ledger paper, oklch(0.952 0.024 150) / dark oklch(0.20 0.022 165).
- Ink: green-black oklch(0.25 0.03 165) / oklch(0.93 0.02 155).
- Primary (green ink): actions, the runway rule, current tab, focus ring.
- Red ink (destructive): 30+ days late, failed sync, the run-out mark. Ledger convention: red ink marks what is owed or late.
- Warning (amber ink) = overdue under 30 days; info (blue ink) = due within 7 days; success = covered/paid. Always with icon + words.
- Hairlines: ledger rule, 22% (light) / 20% (dark) alpha of green ink.

## Type
- Archivo (variable, wght 400–700, wdth 62–125): UI, headings; column heads in condensed caps (wdth 75, +0.08em).
- IBM Plex Mono 400/500: figures only (tabular by construction).
- Scale 12/14/16/18/20/24/30/40/56/88; body 16.

## Shape and material
- Flat-hairline. Sections are sheets on the paper (radius 10), inner controls 6, tags 4. No page shadows; the toast is the only raised layer (`--shadow-lg`).
- Icons: Lucide, stroke 1.5, 16/20 px.

## Motif
The accountant's double rule (two hairlines under a final total): under the cash total, closing the run-out month on the runway strip, under the payroll total, as the current-tab indicator, in the first-run empty state.

## Motion
- **Spatial map:** destinations are siblings → cross-fade 150 ms, no slide (`motion.spatial-continuity`). Toast rises from the bottom edge, exits down. Skeleton → content cross-fade 250 ms. No drill-in depth in this build.
- **Budget per screen type** (`motion.frequency-budget`): Overview (weekly routine): press feedback 100 ms, state cross-fades 150 ms, toast 250 ms; first-paint cascade once per session ≤ 550 ms. Invoices/Spending/Payroll: cross-fade only.
- **Expressive moments (2 of max 3)** (`motion.one-signature-moment`): (1) runway rule uncovered from today to the run-out, 600 ms, enter-emphasized, once per session, the first view of the week's key figure; (2) the payroll "Covered" mark settles (400 ms) right after it.
- **Reduced motion:** opacity and colour stay; translate/scale and the cascade's rise are dropped; the runway rule appears with a fade.
