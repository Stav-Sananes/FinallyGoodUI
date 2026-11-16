# Direction C: Comb Teeth
Thesis: The owner's real question is "when do I drop her off and when do I get her back?", so that answer is the stage: a big drop-off → pick-up readout above the salon's day drawn as a grooming comb, one tooth per quarter hour, with the dog's time at the salon filled in.
Axes: density=balanced · contrast=stark · type=expressive display + utility · layout=stage · material=flat-hairline · motion=balanced  (rolls: 2 3 3 3 1 2; no re-rolls: differs from A on 5 axes, from B on 3)
Personality recipe: calm 45% + playful 25% (rounded friendly display, warm copy, no bounce) + serious-trustworthy 30% (stark text contrast, strict alignment)
Tension resolutions:
  - data.tension-density-clarity → clarity on the stage, balanced in the list; rare use, phone (brief §context)
  - motion.tension-delight-speed → delight once on "Booked" (≤500ms); everything else 100–250ms (brief §personality, frequency few times a year)
  - craft.tension-restraint-liveliness → one fawn "mark" hue (the brindle coat) on the comb and the chosen time only; actions in ink
Palette (OKLCH, roles):
  inputs: base hue 80 at chroma ≤ 0.006 (near-neutral, not cream) · mark hue 68 (brindle fawn) · contrast stark
  background oklch(0.988 0.003 80) / foreground oklch(0.2 0.012 60) / muted-foreground oklch(0.47 0.012 60) / primary (ink) oklch(0.22 0.014 55) / mark oklch(0.72 0.135 68) (fills) + mark-strong oklch(0.5 0.11 55) (text) / border oklch(0.2 0.012 60 / 0.12) / destructive oklch(0.52 0.17 28)
  dark: background oklch(0.17 0.008 60) / surfaces 0.205, 0.24 / foreground oklch(0.95 0.006 80) / muted-foreground oklch(0.74 0.01 70) / primary (ink) oklch(0.95 0.006 80) / mark oklch(0.78 0.12 72) / mark-strong oklch(0.82 0.11 72) / border oklch(0.95 0.006 80 / 0.14)
  check: fg/bg ≥ 15:1; muted ≥ 5:1; mark-strong as text ≥ 4.5:1; primary-foreground/primary ≥ 13:1
Type: "Bricolage Grotesque" (display: the stage readout, step titles) + "Figtree" (UI text, tabular figures in times). Fallbacks ui-sans-serif, system-ui.
  why: a friendly, slightly hand-cut grotesque gives the one big figure a voice (friendly, brief §personality.serious-playful) without a serif-on-cream costume; Figtree is open and legible at 16px on a phone in daylight [typography.limited-families-weights, personality.playful]
Layout concept: header (back · "Step 4 of 5" · close) → summary chips (Bella · Full groom · Either groomer) → STAGE (≥ 40% of first viewport at 375×812): day label, big "9:30 → about 11:30" readout, the comb ruler 8:00–17:00 with the stay span filled → date strip (14 days, "n free") → groomer switch → times list (Morning / Afternoon), each row "9:30 drop-off · back about 11:30 · Sam" → sticky "Continue with Thu 9:30". Desktop ≥ 900px: stage left (sticky, 7 cols), date strip + times right (5 cols).
  composition: one focal figure owns the top; list below/right. Unlike A (single reading column, answer last) and B (summary rail beside board).
  focal point: the drop-off → pick-up readout.
Material: flat-hairline (craft.material-restraint): no shadows; groups by space then 1px hairlines at foreground alpha 0.12; selected row = muted fill. shadows: none · dark: surfaces step lighter, hairline alpha 0.14.
  radius: sheet/panel 20 → row 12 → chip 8 → tooth 2 (concentric); pills only for the small groomer switch.
Craft values: tracking display -0.035em (readout 56–72px) / headings -0.015em / caps labels +0.07em; line-height display 1.0; numbers tabular in lists, "am/pm" at 0.7em muted on the same baseline; en dash for ranges (8:00–17:00).
Icons & imagery: Phosphor (regular weight) from unpkg CDN, two sizes 20/24; no photos (dogs as monogram discs with the dog's initial); no illustration.
Identity motif: comb teeth (quarter-hour ticks) — repeats in: the stage ruler (largest), the step progress in the header (5 teeth), each time row's tiny duration comb, the loading skeleton (teeth shimmer-free pulse replaced by static teeth), the empty/closed-day state, and the booked confirmation.
Accent moment: the filled fawn span on the comb + the fawn tooth marker on the chosen time row.
Motion personality: balanced
  durations: micro 100 · short 150 · standard 250 · medium 300 · hero 500 (signature only)
  easing: enter cubic-bezier(0,0,0,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1) · snappy cubic-bezier(0.23,1,0.32,1)
  spring: none (no bounce: calm)
  the one real transition: tap a time row → the stay span on the comb glides (translateX + scaleX, move, 250ms) to the new drop-off/pick-up and the readout crossfades; changing day slides the times list 24px in the direction of travel (slot-picker).
Signature detail: on "Booked", the comb's teeth for Bella's stay fill one by one left to right (30ms steps, ≤ 500ms total) and the readout settles into the confirmation card.
Fingerprint check: cream-serif-terracotta → avoided (near-neutral canvas chroma 0.003, grotesque display, fawn not terracotta). default-sans → Figtree chosen for brief reason (legible outdoors), display has voice. pill-everything → only the groomer switch. sterile-default → has motif, accent moment, focal figure. pass.
