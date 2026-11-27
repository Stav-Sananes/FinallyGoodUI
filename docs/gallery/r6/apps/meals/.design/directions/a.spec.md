# Direction A: Larder Board
Name: from the kitchen, a slate chalkboard hung on a kraft wall.
Thesis: dinner planning is something a household does in front of a board in the kitchen; the app is that board (seven chalk lines, three seats each) with the shopping list as the store's aisle signs beside it, because the brief says "plans the week's dinners and shops by aisle".
Axes: density=balanced(2) · contrast=stark(3) · type=expressive display + utility(3) · layout=object(4) · material=bezel/textured/tonal(3) · motion=productive(1)  (rolls: grounded by the subject, not rolled; one direction built, the picked one is the subject's own)
Personality recipe: warm 50% + playful-practical 30% + calm 20%
Tension resolutions:
  - data.tension-density-clarity: clarity wins; seven lines get 90px each at 1440 so the dish names read from across the kitchen (brief: counter use).
  - motion.tension-delight-frequency: frequency wins; routine taps <= 150ms; the only 400ms move is a dinner being chalked in (once or twice a week).
Palette (OKLCH):
  inputs: base hue 80 (kraft) · accent hue 35 (tomato) · contrast stark
  light: background oklch(0.89 0.045 78) kraft wall / foreground oklch(0.22 0.025 60) / muted oklch(0.84 0.04 78) / primary oklch(0.50 0.17 33) tomato / board oklch(0.27 0.03 190) slate / chalk oklch(0.95 0.02 100) / chalk-yellow oklch(0.86 0.13 95)
  dark: wall oklch(0.19 0.02 60) / board oklch(0.15 0.02 190) / chalk oklch(0.93 0.02 100) / primary oklch(0.72 0.14 38)
  check: fg/bg and primary-foreground/primary >= 4.5:1; chalk on board >= 7:1 (verified in the contrast script)
Type: Young Serif (display, dish names, headline) + Karla (text) + Spline Sans Mono (quantities, minutes), self-hosted through @fontsource.
  why: chalked menu boards are set in a chunky text serif; quantities want a mono for columns (typography.pairing-contrast).
Concept mapping (3 rows): the kitchen chalkboard -> the week board: seven ruled chalk lines, one per night, three seat marks on each | chalking a dinner in -> an open night opens the recipe list; picking one writes the dish onto the line and the list updates | a price tag on a shelf -> one record is a ruled chalk line (edge: ruled, the record is a rule instead of a box); aisle signs are hung panels with a cut corner
Skeleton: board (62% of width, owns the viewport top to bottom: a chalk headline "Five dinners, two open" -> seven ruled lines (day, dish, cook, three seats, one visible action) -> tally strip) -> aisle walk rail (36%, right: the hanging aisle sign "Aisle 1 Produce" then its items, next aisles below) -> left spine of four places (72px). Amends the blueprint shell: no top bar, a spine plus the board (decisions D-2).
Layout concept: object. Eye hits the huge chalk headline, then the seven lines top to bottom, then the aisle rail. Primary action is the open night's "Chalk in" button, chalk-yellow on the board.
  composition: board-as-object with a rail; no reading column.
  focal point: the headline and the first open night.
Material: bezel/textured/tonal. Slate board with a wood-tone inset frame (box-shadow inset, no border), faint chalk dust gradient texture via a tonal layer; the wall is kraft.
  shadows: board: one layered warm shadow, alpha 0.18-0.28, hue 60 · dark mode: board is darker than the wall, lit by a thin top highlight
  radius: board 6px, panels (dialog, aisle sign) 14px with a cut corner on the sign, controls 2px, records 0 (ruled); hairlines: chalk alpha 0.28 dashed
Craft values: tracking display -0.02em / headings -0.01em / caps labels 0.08em; line-height display 1.05; numbers: Spline Sans Mono tabular, units muted
Icons & imagery: lucide-vue-next, stroke 1.75; no photos (none needed: the dishes are words on a board); people as initials in seat marks
Identity motif: a chalk tally mark (four strokes and a slash) — repeats in: the headline count, the basket progress in the aisle walk, the household "dinners cooked" column, the empty states
Accent moment: chalk-yellow underline that is drawn under a dish the moment it is chalked in; tomato only for the primary action and the "tonight" marker
Motion personality: productive
  durations: micro 100ms · standard 150ms · hero 400ms (the chalk-in)
  easing: enter cubic-bezier(0,0,0,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1)
  spring: none
  the one real transition: picking a recipe in the dialog -> the dish name draws onto the night's line (clip reveal, transform/opacity) and the aisle walk's count ticks
Signature at scale: the week board itself, a working control: tap a seat to change who eats (portions and the shopping list recompute live), tap the cook to pass the pan, tap an open line to chalk a dinner in; first screen of the landing route; promise >= 45% of the first viewport at 1440x900 and >= 60% of 375x667; tagged data-fgu-signature.
Refuses: no equal-card grid (cardCoverage) · no centred column (singleColumn) · no per-row menu: every line shows its action (rowRepeat) · no neutral paper canvas (canvasNeutral)
Fingerprint check: pass (predicted): tinted kraft canvas, slate object, serif display, no near-black primary buttons, no card grid.

# Direction B (not built): Tide table
Thesis: the week as a horizontal timeline of dinners sized by minutes of cooking, with a shop list as a timetable. Concept mapping: tide table -> time axis | chalking -> dragging a bar | row -> timetable line. Skeleton: full-width time axis (70%) -> list below. Rejected: seven bars are less glanceable than seven lines and dragging is hard on a phone.
# Direction C (not built): Receipt
Thesis: the shop list is the product; the plan is the paper receipt it prints. Concept mapping: till receipt -> one long narrow column | scan -> check off | row -> receipt line with dotted leader. Skeleton: single centred receipt column. Rejected: it is a centred column, which the structure test refuses.
