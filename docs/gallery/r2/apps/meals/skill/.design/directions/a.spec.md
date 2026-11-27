# Direction A: Menu Board
Name: the week's dinners written out like a bistro's menu card.
Thesis: The week should read like a menu someone wrote for the family: seven evenings, ruled and named, tonight's dish set largest, so planning on Sunday and glancing on Wednesday are the same calm read.
Axes: density=balanced · contrast=soft · type=humanist/serif text · layout=column · material=flat-hairline · motion=productive  (rolls: grounded)
  - density=balanced: brief "a week of seven evenings fits one screen" (interview.personality.dense-airy)
  - contrast=soft: brief "calm, with one lift" (interview.personality.calm-energetic)
  - type=serif text: brief "editorial: cookbook print discipline" (interview.personality.references)
  - layout=column: phone-first, "what's tonight?" answered first (interview.context.device, D2)
  - material=flat-hairline: editorial rules, not cards (D3)
  - motion=productive: opened several times a week (interview.context.frequency)
Personality recipe: calm 55% + editorial 45%; spacing/contrast from personality.calm produces, type/hairlines/washed tags from personality.editorial produces.
Tension resolutions:
  - motion.tension-delight-speed → speed; routine ≤200ms, one weekly signature moment (week set).
  - data.tension-density-clarity → clarity; tonight is read from a counter at arm's length.
  - craft.tension-restraint-liveliness → liveliness via one aubergine ink accent + dotted-leader motif + real type contrast.
Palette (OKLCH, roles):
  inputs: base hue 85 (barely warm, chroma ≤0.006) · accent hue 340 (aubergine) · contrast soft
  light: background oklch(0.985 0.004 85) / surface-2 oklch(0.965 0.005 85) / foreground oklch(0.22 0.012 60) / muted-foreground oklch(0.50 0.012 60) / primary (ink) oklch(0.22 0.012 60) on oklch(0.985 0.004 85) / accent oklch(0.45 0.13 345) / accent-wash oklch(0.95 0.025 345) / border oklch(0.22 0.012 60 / 0.10) / destructive oklch(0.50 0.17 27)
  dark: background oklch(0.18 0.006 60) / surface-2 oklch(0.22 0.007 60) / foreground oklch(0.93 0.008 85) / muted-foreground oklch(0.70 0.01 85) / primary oklch(0.93 0.008 85) / accent oklch(0.78 0.10 345) / accent-wash oklch(0.30 0.05 345) / border oklch(0.93 0.008 85 / 0.12)
  check: fg/bg ≈ 15:1; muted ≈ 5.5:1; accent/bg ≈ 7:1 light; primary-foreground/primary ≈ 15:1.
Type: Newsreader (display + dish names, opsz, 400/500, italic for "night off") + Hanken Grotesk (UI, labels, numbers; 400/500/600). Fallbacks ui-serif, Georgia / ui-sans-serif, system-ui.
  why: dish names are the content and a menu sets them in a book face; UI chrome in a quiet grotesk with tabular figures for quantities. [typography.limited-families-weights, personality.editorial]
Layout concept: shell = bottom tabs (phone) / left rail (≥1024). Content: one column ≤ 720px. Eye: "Tonight" block (dish name at display size + Cook button) → status line "5 of 7 planned · 31 items" → seven ruled evening rows Mon–Sun → list summary. At ≥1200 a marginal note (shopping list by aisle summary) hangs in the right margin like a side note.
  composition: single reading column, answer first; B is rail+work, C is a stage.
  focal point: tonight's dish name (largest, darkest).
Material: flat-hairline. shadows: none except the pick sheet (overlay) shadow-3 tinted hue 60 alpha 0.08/0.12 · dark: lighter surface + hairline.
  radius: sheet 16 → rows 0 (ruled) → buttons 8 → tags pill. hairlines: 10% ink alpha.
Craft values: tracking display -0.02em / headings -0.01em / caps labels +0.06em; line-height display 1.08; numbers tabular, units in muted grotesk same baseline.
Icons & imagery: Phosphor regular (CDN @phosphor-icons/web 2.1.1), 20px and 16px. Images: none needed, a menu is text; people as initials (N, E, M).
Identity motif: menu dotted leaders (day …… dish, item …… qty) — repeats in: evening rows (day ··· cook time), shopping list summary (aisle ··· count), recipe ingredients (ingredient ··· qty), status/progress line (7 dots, one per evening, filled as planned).
Accent moment: the "tonight" marker and the week-progress dots in aubergine; the signature underline.
Motion personality: productive
  durations: micro 100 · short 150 · standard 250 · medium 300 (sheet) · hero 500 (signature only)
  easing: enter (0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1) · snappy (0.23,1,0.32,1)
  spring: none
  the one real transition: tap an unplanned evening → pick sheet rises from bottom (phone) → choose → evening row fills (fade + 4px settle) and progress dot fills.
Signature detail: when the 7th evening is planned, an aubergine pen stroke draws under "This week is set" and the seven progress dots fill left to right once.
Fingerprint check: cream-serif-terracotta → revised: canvas near-neutral (chroma 0.004), text serif not a high-contrast display, accent aubergine not terracotta; serif kept because brief "editorial: cookbook print discipline". Pass otherwise.
