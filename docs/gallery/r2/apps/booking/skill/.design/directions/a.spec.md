# Direction A: Appointment Book
Thesis: Booking should feel like the salon's own paper appointment book read aloud: one calm column, the day's times as ruled lines, nothing else competing; owners on the move get one clear decision per screen.
Axes: density=airy · contrast=standard · type=humanist / serif text · layout=column · material=soft-elevated · motion=balanced  (rolls: grounded — brief: phone first, rare use, friendly, airy)
Personality recipe: calm 60% + playful 15% + serious-trustworthy 25%
Tension resolutions:
  - data.tension-density-clarity → clarity; rare use, one hand (brief §context.environment)
  - motion.tension-delight-speed → delight once on "Booked"; rare use (brief §personality)
Palette (OKLCH): inputs base hue 85 · accent hue 150 (sage) · standard
  background oklch(0.98 0.006 85) / foreground oklch(0.24 0.015 85) / muted oklch(0.52 0.015 85) / primary oklch(0.30 0.03 150) / border oklch(0.90 0.008 85)
  dark: bg oklch(0.19 0.01 85) / fg oklch(0.93 0.01 85) / muted oklch(0.72 0.012 85) / primary oklch(0.80 0.07 150) / border oklch(0.32 0.01 85)
  check: fg/bg 13:1, primary-fg/primary ≥ 7:1
Type: "Literata" (headings) + "Source Sans 3" (UI). why: humanist warmth, book-like headings for a small craft salon [typography.limited-families-weights]
Layout concept: single column ≤ 560px: step header → summary line → week list of days (accordion) → times as ruled lines → sticky Continue. composition: one reading column, top to bottom, answer last. focal point: the selected day's heading.
Material: soft-elevated; shadows 2 layers alpha .05/.08 tinted hue 85; dark: lighter surface + hairline. radius 16 → 8 (concentric). hairlines 8%.
Craft values: tracking display -0.02em / headings -0.01em / caps +0.06em; line-height display 1.1; numbers tabular, "am/pm" muted.
Icons & imagery: Phosphor regular (CDN); no imagery needed (dogs shown by name monogram).
Identity motif: ruled appointment-book lines — repeats in: time rows, step progress, empty state.
Accent moment: sage tick on the chosen time.
Motion personality: balanced — micro 100 · standard 250 · hero 400; enter (0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1); the one real transition: tap a day → its times open beneath it (grid-rows reveal).
Signature detail: the booked appointment written into a ruled line with a ink-stroke underline.
Fingerprint check: watch cream-serif-terracotta → revised: sage accent and serif only on step headings; pass.
