# Direction C: Plates on the Table
Name source: the household's own dinner table, laid for three.
Thesis: A week of dinners is seven plates on a table: tonight's plate sits in front of you, large and ready, and the rest of the week waits in a row of rimmed plates that fill as Sunday's planning goes on; the palette is a green-glazed kitchen tile and a ripe tomato, not a paper page. (brief: "plan dinners for the week, open a recipe while cooking")
Axes: density=airy · contrast=stark · type=humanist/serif text · layout=stage · material=soft-elevated · motion=expressive  (rolls: density 1, contrast 3, type 2, layout 2→re-rolls 1,1,1,3 (C clashed with B, C re-rolls) = 3, material 2, motion 3)
Personality recipe: calm 50% + playful 30% + energetic 20% (friendly, warm, practical); spacing and radius from playful, contrast from energetic, motion curves from playful with calm durations.
Tension resolutions:
  - motion.tension-delight-speed: speed on routine (nights open most evenings → taps ≤ 150ms, drill-in 300ms), delight on "week planned" (plates fill once a week, ≤ 600ms) (brief §context.frequency)
  - data.tension-density-clarity: clarity; airy stage for a kitchen glance (brief §context.environment)
  - craft.tension-restraint-liveliness: liveliness from one motif (the plate) and one accent (tomato), not from effects
  - craft.ink-and-accent not-when: friendly/playful lean, so the primary may be tomato-filled; neutrals stay green-tinted ink
Palette (OKLCH, sources named):
  inputs: base hue 150 (green-glazed kitchen tile) · accent hue 30 (ripe tomato) · contrast target stark
  background oklch(0.945 0.035 150) tile glaze / surface-1 oklch(0.985 0.012 110) plate-white / foreground oklch(0.25 0.03 165) cast-iron green-black / muted-foreground oklch(0.47 0.03 160) / primary oklch(0.56 0.2 30) tomato, primary-foreground oklch(0.99 0.01 100) / accent text oklch(0.5 0.19 30) / herb oklch(0.52 0.11 145) for "done" / border oklch(0.25 0.03 165 / 0.12)
  dark: background oklch(0.2 0.025 165) / surface-1 oklch(0.25 0.025 165) / surface-2 oklch(0.29 0.025 165) / foreground oklch(0.95 0.015 130) / muted-foreground oklch(0.76 0.025 150) / primary oklch(0.68 0.17 32) with fg oklch(0.18 0.03 30) / herb oklch(0.75 0.12 145)
  check: fg/bg 13.6:1, primary-fg/primary 5.0:1, muted/bg 5.8:1 (a11y.contrast-minimums)
Type: Young Serif (display: tonight's dinner, page title, recipe title) + Atkinson Hyperlegible (UI and body; made for legibility at a distance).
  why: Young Serif is a warm, sturdy, low-contrast serif with the friendliness of a handwritten menu board (not a high-contrast editorial serif); Atkinson Hyperlegible reads from arm's length at the counter (brief: "open a recipe while cooking") [typography.limited-families-weights, typography.measure]
Layout concept: stage. Tonight's plate (a big plate-white disc-rimmed card holding tonight's dinner name, cook, time and "Open recipe") owns ≥ 40% of the first viewport; beneath it the week row of 7 small plates (progress), then the nights as rows. Primary action: "Open recipe" on the stage when tonight is planned, "Plan <day>" when the week has gaps (moves to the sticky week header). (layout.hierarchy-by-weight)
  composition: stage → plate row → nights list; unlike A (one equal column of rows) and B (rail beside work area), here one focal object dominates.
  focal point: tonight's dinner name in Young Serif, the largest thing on the screen.
Material: soft-elevated (craft.material-restraint)
  shadows: 2 layers, tinted hue 165: 0 1px 2px oklch(0.3 0.04 165 / .08), 0 8px 24px oklch(0.3 0.04 165 / .08); overlay 3 layers up to /.12 · dark mode: lighter surfaces + hairline border, no shadow growth (craft.tinted-shadows)
  radius: stage 28 → inner pills/buttons 14 (padding 14 — concentric); rows 16; small chips 999 (craft.concentric-radii) · hairlines: 12% of foreground
Craft values: display −0.02em / headings −0.01em / caps labels +0.06em; lh display 1.05; numbers tabular, units ("min", "g") muted, quantities right-aligned in the list (craft.number-setting)
Icons & imagery: Phosphor (regular, 1 weight) from unpkg CDN, two sizes (20, 24); no food photos: dinners are named, not pictured, because the household's recipes have no photos and an honest text-first plan reads better at a glance; people as initials on a small plate-rim monogram (craft.real-imagery-and-icons)
Identity motif: the rimmed plate (a circle with an inner rim ring) — repeats in: (1) the week row of 7 plates that fill when a night is planned, (2) empty nights as an empty plate with "Plan Wednesday", (3) the cook's initials on a tiny plate, (4) the shopping-list aisle progress ring, (5) skeleton loading plates (craft.identity-motif)
Accent moment: tonight's plate in the week row is tomato-rimmed; the list count chip turns tomato as items are added.
Motion personality: expressive (curves), fitted to the budget: the key screen opens most evenings, so taps ≤ 150ms, drill-in/sheet 300ms enter / 200ms exit; only the "week planned" plates fill and the list-count roll use the expressive range.
  durations: micro 100 · short 150 · standard 250 · medium 300 · hero 600
  easing: enter cubic-bezier(0,0,0,1) · enter-emphasized (0.05,0.7,0.1,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1) · snappy (0.23,1,0.32,1)
  spring (if any): spatial {0.5s, bounce 0.2} via linear() approximating overshoot, for the plates fill only · effects {bounce 0}
  the one real transition: tap a night row ("Thursday · Beef ragù") → the recipe panel enters from the trailing edge with the dinner title as a shared element (view transition); Back reverses.
Signature detail: when the 7th night is planned, the seven plates fill left to right with a small overshoot and the header reads "Week planned · 41 things on the list".
Fingerprint check: cream-serif-terracotta → revised: canvas is tile-green (not cream), display serif is low-contrast Young Serif, accent is saturated tomato red (h30 c0.2), not muted terracotta; ink-on-paper → not matched (canvas chroma 0.035 green, primary tomato); default-sans → Atkinson justified by kitchen glance; pass.
