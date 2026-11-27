# Direction A: Drafting Film
Thesis: A quiet, exact work surface for engineers who are in it all day: everything is a hairline row on a faintly cool film, and the only colour is where you are and what is on fire.
Axes: density=3 dense · contrast=2 standard · type=1 neutral grotesk · layout=2 rail + work (bound by brief) · material=1 flat-hairline · motion=1 productive  (rolls: grounded; layout bound by brief "issue list with the selected issue open in a side panel")
Personality recipe: dense-expert 60% + calm 25% + raw-industrial 15%
Tension resolutions:
  - data.tension-density-clarity → density; experts, many times a day (brief: purpose.expertise, context.frequency)
  - motion.tension-delight-speed → speed; keyboard-driven list
  - craft.tension-restraint-liveliness → liveliness kept by a tinted film canvas and a selection bar in accent (breaks ink-on-paper on the canvas axis)
Palette (OKLCH):
  inputs: base hue 200 (cool film) · accent hue 245 · contrast standard
  background oklch(0.965 0.012 200) / foreground oklch(0.22 0.02 230) / muted oklch(0.5 0.02 220) / primary oklch(0.46 0.13 245) / border oklch(0.22 0.02 230 / 0.12)
  dark: background oklch(0.19 0.012 220) / foreground oklch(0.93 0.01 200) / muted oklch(0.7 0.015 210) / primary oklch(0.72 0.11 245) / border oklch(0.93 0.01 200 / 0.12)
  check: fg/bg ≈ 14:1, primary-fg on primary ≥ 4.5:1
Type: Hanken Grotesk 400/600 + IBM Plex Mono 400 (keys, times). why: neutral, compact UI sans at 13px; mono only for data that aligns [typography.limited-families-weights, personality.dense-expert]
Layout concept: rail (views) · list grouped by status · right panel; eye hits the selected row then the panel title. Primary action "New issue" top-right of list toolbar.
  composition: selection row → panel title → fields column; flat, nothing raised
  focal point: selected issue title in the panel
Material: flat-hairline; shadows none (popovers only: 1 layer); radius 4 → 2; hairlines 10% alpha
Craft values: tracking headings -0.01em / caps labels +0.06em; numbers tabular, mono keys
Icons & imagery: Phosphor regular; no images; people as initials
Identity motif: drafting registration ticks (corner crop marks) on the selected row, empty state, panel header
Accent moment: the selected row's 2px accent bar and the current view in the rail
Motion personality: productive — micro 100 · short 150 · standard 250; enter (0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1); no spring. Transition: row Enter → panel slides 8px from trailing edge, 150ms.
Signature detail: crop-mark selection frame
Fingerprint check: pass (default-sans avoided: Hanken chosen for compact apertures at 13px; mono limited to keys/times)
