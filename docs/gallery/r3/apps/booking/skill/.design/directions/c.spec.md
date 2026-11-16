# Direction C: Brindle Coat
Thesis: the salon is named after a coat pattern, so the screen wears it: fawn and chocolate from a brindle dog, a grooming comb as the day's ruler, and the owner's day (drop-off → ready) as the one big figure, because that is how owners plan a groom.
Axes: density=2 balanced · contrast=3 stark · type=1 neutral grotesk · layout=3 stage · material=2 soft-elevated · motion=3 expressive
  (rolls: density 2, contrast 3, type 1, layout 1 → assigned 3, material 2, motion 3)
  layout: rolled 1, but A=column and B=rail+work, so stage is the only position satisfying "three different layouts"; assigned, not re-rolled (directions.md §2).
  vs A: differs on density, contrast, type, layout, motion (5/6). vs B: type, layout, material (3/6).
  frequency fit: booking every 4–8 weeks (rare) → expressive allowed on ≤3 moments; routine taps 100–250 ms; nothing routine over 400 ms; the comb draw (signature) 500 ms.
Personality recipe: playful 40% + calm 30% + serious 30% (warm, unhurried, exact)
Tension resolutions:
  - craft.tension-restraint-liveliness → liveliness: tinted fawn canvas, coat-derived palette, comb motif (brief: "small dog-grooming salon", name "Brindle")
  - motion.tension-delight-speed → delight on two moments only (time chosen, booked); rare use (brief context.frequency)
  - data.tension-density-clarity → clarity: one big figure, the day comb as a glanceable overview (rare, novice-ish use)
Palette (OKLCH, 6 roles): source = a brindle coat (fawn base, chocolate stripes) + the bandana groomers tie on after a groom (teal)
  inputs: base hue 70 (fawn) · accent hue 200 (bandana teal) · stark
  light: bg oklch(0.905 0.045 72) fawn / surface oklch(0.955 0.025 75) / fg oklch(0.24 0.04 45) chocolate / muted-fg oklch(0.42 0.04 50) / primary oklch(0.30 0.045 42) chocolate with fawn text / accent oklch(0.48 0.09 205) teal / border oklch(0.24 0.04 45 / 0.16)
  dark: bg oklch(0.185 0.022 48) deep coat / surface oklch(0.235 0.025 50) / fg oklch(0.93 0.03 78) / muted-fg oklch(0.76 0.035 70) / primary oklch(0.82 0.09 72) fawn with chocolate text / accent oklch(0.76 0.09 200)
  check: fg/bg light ≈ 11:1, primary-fg/primary ≈ 9:1; dark fg/bg ≈ 13:1 (verified by check-palette at system step)
Type: Archivo (grotesk with a width axis; stamped dog-tag lettering in its expanded 700 cut) single family, widths 100 and 125. why: tags and salon signage are plain stamped grotesk; width gives a display voice without a second family [typography.limited-families-weights, craft.tracking-by-size]
Layout concept: stage = the day: week strip → the big figure ("6 times open" / "9:30 → ready ~11:45") with the day comb under it, ≥ 40% of the first phone viewport; times grouped Morning / Midday / Afternoon below; sticky Review booking bar. Desktop: stage spans the content width, times in three columns beneath.
  composition: one focal figure + timeline on top, choices below (A is list-only, B is rail beside board).
  focal point: the drop-off → ready figure.
Material: soft-elevated; shadows 2 layers tinted hue 45: 0 1px 2px oklch(0.3 0.05 45/0.10), 0 8px 24px oklch(0.3 0.05 45/0.10); dark: lighter surface + hairline, no big shadows.
  radius: stage 24 → time rows 14 → chips 8 (concentric with 10px padding) · hairlines fg at 14%.
Craft values: display (Archivo 125 wdth 700) -0.03em lh 1.0; headings -0.015em; caps labels 12px +0.08em; numbers tabular, "~" and "ready" muted, en dash ranges.
Icons & imagery: Phosphor regular (unpkg CDN, pinned). No photos supplied: dogs as monograms in a tag shape (circle), groomers as initials.
Identity motif: the grooming comb (evenly spaced teeth) — repeats in: (1) the day comb (one tooth per 15 min, the timeline), (2) the step progress (4 teeth, 3 filled), (3) the loading skeleton (comb teeth shimmerless pulse), (4) the full-day empty state (a comb with its teeth "taken"), (5) the booked confirmation stub.
Accent moment: bandana teal marks the chosen appointment: the selected row's edge, the drawn drop-off → ready span on the comb.
Motion personality: expressive
  durations: micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500
  easing: enter (0,0,0,1) · enter-emphasized (0.05,0.7,0.1,1) · exit (0.3,0,1,1) · move (0.2,0,0,1) · snappy (0.23,1,0.32,1)
  spring: spatial via linear() overshoot ≈ bounce 0.15 on the selected-span cap; effects bounce 0
  the one real transition: tap a time row → the teal span draws across the day comb from drop-off to ready (scaleX from the drop-off tooth, enter-emphasized, 500 ms) and the big figure rolls to the new time (number-change).
Signature detail: the day comb with the dog's span drawn on it.
Fingerprint check: pass. Tinted fawn canvas (not near-neutral), chocolate primary sits on a tinted canvas, so ink-on-paper does not apply (canvas chroma 0.045 > 0.025); Archivo justified by stamped-tag voice; not cream-serif-terracotta (no serif, no terracotta, fawn is the coat).
