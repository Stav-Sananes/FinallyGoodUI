# Direction C: Signal board
Thesis: The tracker is a signal board: stark ruled rows, heavy ink, priority shouted only where it matters, so the morning triage reads like a departures board you clear row by row.
Axes: density=balanced · contrast=stark · type=humanist / serif text · layout=rail + work (fixed by brief) · material=soft-elevated · motion=productive  (rolls: density 2, contrast 3, type 1→re-rolled 2, material 2, motion 1 kept after re-roll 1 (type 2, motion 1); first roll differed from A on only 3 axes)
  differs from A on: density, contrast, type, material (4); from B on: density, contrast, motion (3)
Personality recipe: serious-trustworthy 50% + dense-expert 30% + raw-industrial 20%
Tension resolutions:
  - data.tension-density-clarity → balanced: 44px rows (clarity) for a board read at a glance
  - motion.tension-delight-speed → speed; no springs
  - craft.tension-restraint-liveliness → stark ink contrast is the liveliness; one signal-orange mark
Palette (OKLCH): inputs: base hue 90 (neutral) · mark hue 45 · contrast stark
  background oklch(0.99 0.002 90) / foreground oklch(0.16 0.005 90) / muted-fg oklch(0.45 0.008 90) / primary = ink / mark oklch(0.58 0.16 45) / border oklch(0.16 0.005 90 / 0.18) / destructive oklch(0.5 0.19 27)
  dark: background oklch(0.15 0.004 90) / foreground oklch(0.96 0.003 90) / mark oklch(0.74 0.14 50)
Type: Alegreya Sans 400/700 (humanist UI) + Alegreya (serif display) ; mono none (keys set in tabular sans caps)
Layout concept: sidebar · ruled board (44px rows, full-width rules) · inspector docked with a stark 2px left rule and raised header
  composition: ruled board with a docked inspector (vs B raised sheet; vs A split flat sheet)
Material: soft-elevated (inspector only), radius 2/4 (sharp)
Icons & imagery: Phosphor bold; monograms
Identity motif: the signal lamp (priority squares) — rows, sidebar views, empty state, status bar
Accent moment: urgent rows' signal square + triage count
Motion personality: productive — micro 100 · short 150; enter (0,0,0,1); no springs; transition: row → inspector content crossfade 100ms
Signature detail: departures-board flip of the triage count to 0
Fingerprint check: near-black-acid-accent risk in dark (orange on near-black) → keep mark chroma ≤0.14 and no mono; pass with note
