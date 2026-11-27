# Direction C: The Sorting Case
Name: from the subject's world, a post-room pigeonhole case.
Thesis: triage is sorting slips into six people's pigeonholes, so the screen is the case itself: you pick the slip with j/k and drop it into a hole with 1-6; load is visible as slips already in each hole.
Axes: density=balanced(2) · contrast=stark(3) · type=humanist/serif(2) · layout=object(4) · material=bezel/textured/tonal(3) · motion=expressive(3, fitted to productive durations)  (rolls: C raw density 1 -> moved to 2 (daily experts, brief frequency), contrast 3, type 1 -> re-rolled to 2 (needs display voice), layout 3 clashed with B -> re-rolled to 4, material 3, motion 3)
Personality recipe: dense-expert 50% + craft/tactile 30% + calm 20%.
Tension resolutions:
  - data.tension-density-clarity: density wins in the queue and table (experts, 10-40 slips a session, brief), clarity wins on the slip (one big number, one title).
  - craft.tension-restraint-liveliness: restraint on all UI chrome (hairlines, no shadows on records); liveliness spent only on the case and the assign flight.
  - motion.frequency-budget vs expressive position: assign flight 140ms with `snappy`; first-load fill 600ms once per session.
Palette (OKLCH):
  inputs: base hue 80 (kraft/manila) · accent hue 195 (verdigris) · contrast stark
  background oklch(0.89 0.04 85) / foreground oklch(0.24 0.03 60) / muted oklch(0.84 0.045 82) / primary oklch(0.44 0.09 195) / border oklch(0.62 0.05 75) / destructive (stamp red) oklch(0.5 0.19 27) / case (walnut) oklch(0.36 0.055 55) / case-hole oklch(0.24 0.045 52) / brass oklch(0.8 0.12 85) / card (slip paper) oklch(0.975 0.02 92)
  dark: background oklch(0.2 0.025 62), card oklch(0.285 0.03 64) (lighter as it rises), primary oklch(0.8 0.1 190), case oklch(0.33 0.045 58), hole oklch(0.17 0.03 55); re-derived, not inverted
  check: all text pairs >= 5.2:1 light, >= 5.4:1 dark (ct run, decisions D-4)
Type: Fraunces Variable (display: slip numbers, titles, hole names) + Hanken Grotesk Variable (text) + IBM Plex Mono (keys, ids), self-hosted via fontsource.
  why: a typed-slip, post-room voice from the subject; Fraunces has optical weight for a 112px case number; Plex Mono reads as a typewriter key legend (typography.display-voice, typography.limited-families-weights).
Concept mapping (3 rows): pigeonhole case -> the Desk: six holes in a 3x2 grid, one per teammate, load shown as slips | sorting a slip -> press 1-6 (or tap a hole): the slip drops into the hole | issue slip -> record shape: perforated edge, tear line after the case number (record-row/record-card, edge=perforated)
Skeleton: first the case number 112px on the slip -> then the six holes under it -> then the unsorted queue beside it. Regions at 1440: spine 4.5% | queue 26% | Desk 69% (slip on top 45%, case below 55%); key strip foot 44px full width. At 390: top bar 48px -> Desk 58% (slip then 3x2 case) -> queue below the fold -> bottom nav. Amends blueprint shell: no top bar; spine + key strip (D-2).
Layout concept: the slip is the largest/darkest paper object; the case is the largest dark surface; primary action = keys 1-6 (the holes themselves).
  composition: differs from A (queue left, detail right) and B (one big stage) by making the work surface a physical case, not a list/detail.
  focal point: the 112px case number on the slip, then the six brass key caps.
Material: bezel/textured/tonal (craft.material-restraint)
  shadows: slip on desk: 2 layers, alpha .14/.20, hue 55 · none on records · dark mode: surfaces lighter as they rise (card .285 over bg .2) (craft.tinted-shadows)
  radius: slip 4px; holes 3px inside a case 6px; panels 10px (dialog, toast); controls 2px (craft.concentric-radii) · hairlines: pencil rule alpha 1 at 1px, on the queue only (craft.hairlines-before-boxes)
Craft values: tracking display -0.04em (112px) / headings -0.015em / caps labels +0.08em; line-height display 0.9; numbers: tabular Plex Mono figures, unit muted (craft.number-setting)
Icons & imagery: Lucide-style inline SVG, stroke 1.5, only for theme toggle and nav; no imagery; people as monograms on brass discs (craft.real-imagery-and-icons)
Identity motif: pigeonhole slot with a brass key cap — repeats in: the case, the key strip, the spine, the toast (craft.identity-motif)
Accent moment: the brass key caps on the case; stamp-red P0 tab on slips (craft.tension-restraint-liveliness)
Motion personality: expressive curves, productive durations
  durations: micro 100ms · standard 150ms · hero 600ms (first load fill only)
  easing: enter cubic-bezier(0,0,0,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1) · snappy cubic-bezier(0.23,1,0.32,1)
  spring: none (cubic-bezier only)
  the one real transition: press 1-6 (or tap a hole) -> the slip translates and shrinks into that hole (140ms, snappy) while the next slip fades in (150ms)
Signature at scale: THE CASE and its slip (the Desk): a working control, six pigeonholes that assign the current slip and show each person's load; first screen of /triage; ~66% of 1440x900, ~58% of 390x844; promise >=25% / >=40%; data-fgu-signature
Refuses: no equal-card grid (cardCoverage) · no centred column (singleColumn) · no per-row menu (rowRepeat)
Fingerprint check: revised: first draft had ink-on-paper + one accent; now tinted kraft canvas, verdigris primary, walnut case, brass; no gradients, glass or glow. Prediction: pass.

# Direction A: Morning Ledger (unbuilt)
Thesis: triage is reading a ledger top to bottom and initialling each line; quiet, ruled, dense. Concept mapping: ledger -> a ruled table of unsorted issues | initialling -> press 1-6 to set owner in the row | ledger line -> ruled record row. Skeleton: queue 38% left -> detail of the current line 62% right (rail + work). Axes density=3 contrast=2 type=1 layout=2 material=1 motion=1. Names the ink-on-paper break: a tinted canvas.
# Direction B: The Dispatch Wall (unbuilt)
Thesis: a stage where one issue owns the screen at near full bleed with a giant hotkey legend; bold, saturated, expressive. Concept mapping: dispatch board -> one giant slip | stamping -> keystroke stamps priority | board card -> large card. Skeleton: slip 70% of the viewport with a six-name strip under it (stage). Axes density=3 contrast=3 type=3 layout=3 material=3 motion=2 (rolls 3/3/1/3/3/2; B type re-rolled to 3).
