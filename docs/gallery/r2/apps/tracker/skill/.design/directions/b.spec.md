# Direction B: Punch list
Thesis: The issue list is the team's punch list, the dense written record of what's left; the open issue is lifted off it like a sheet pulled onto the bench, so reading and changing one issue never hides the list.
Axes: density=dense · contrast=standard · type=humanist / serif text · layout=rail + work (fixed by brief) · material=soft-elevated · motion=balanced→fitted  (rolls: density 3, contrast 2, type 2, material 2, motion 2; layout not rolled: brief fixes "list with the selected issue open in a side panel")
  differs from A on: contrast, type, material, motion (4 of 6)
  budget fit: balanced position gives curves (enter-emphasized for the panel's first open, move for row regrouping) but durations stay ≤150ms on routine actions; keyboard-triggered (J/K, S/P/A, ⌘K) = 0ms; only the signature "Triage clear" runs 400ms.
Personality recipe: dense-expert 60% + calm 25% + editorial 15% (the serif issue title)
Tension resolutions:
  - data.tension-density-clarity → density: 36px rows, 14px UI; clarity recovered by status grouping and a raised panel (brief: experts, daily)
  - motion.tension-delight-speed → speed on every repeated path; delight spent once a day on Triage clear (brief: triage every morning)
  - craft.tension-restraint-liveliness → teal "mark" on selection, triage count and the keycap legend; serif display for the one title that matters
  - usability.tension-guidance-expertise → expertise, with keycaps shown next to every action so shortcuts are learnable (recognition)
Palette (OKLCH, ink-and-accent): inputs: base hue 255 (cool graphite, chroma ≤0.006) · accent (mark) hue 195 deep teal · contrast standard
  background oklch(0.982 0.003 255) / foreground oklch(0.22 0.012 255) / muted oklch(0.955 0.004 255) / muted-foreground oklch(0.49 0.012 255) / primary = ink oklch(0.22 0.012 255), primary-fg oklch(0.985 0.002 255) / mark oklch(0.50 0.095 195), mark-tint oklch(0.94 0.03 195) / border oklch(0.22 0.012 255 / 0.10) / destructive oklch(0.52 0.18 27)
  status: urgent oklch(0.57 0.18 35) · in progress oklch(0.62 0.13 70) · in review oklch(0.52 0.13 285) · done oklch(0.52 0.11 155)
  dark: background oklch(0.175 0.006 255) / sidebar oklch(0.16) / panel oklch(0.215 0.007 255) / foreground oklch(0.93 0.005 255) / muted-fg oklch(0.71 0.01 255) / primary oklch(0.93) ink-on-dark / mark oklch(0.76 0.085 195), mark-tint oklch(0.29 0.035 195)
  check: fg/bg ≥ 4.5:1 both themes; muted-fg ≥ 4.5:1 on bg, panel and selected-row tint (verified in system step)
Type: Newsreader (display, opsz; 600) for the panel's issue title, page title and Triage clear + Source Sans 3 (400/600) for UI + JetBrains Mono (500) for issue keys and branch names.
  why: humanist sans stays readable at 13–14px over all-day sessions (typography.type-scale, personality.dense-expert); the issue title is a written report, a serif gives it document weight (personality.editorial); mono only for IDs that must align (craft.number-setting).
Layout concept: sidebar 232px (flat, muted) · list (flat on canvas) · panel 44% raised over the canvas with tinted shadow and 10px outer radius. Primary action "New issue" ink button top-right of list header; panel primary = status control. Eye: selected row (mark tint + 2px mark edge) → panel title (serif 22px) → properties.
  composition: flat list on the canvas, one raised sheet beside it (vs A: one flat sheet split by a hairline; vs C: stark ruled table with a docked inspector)
  focal point: the open issue's serif title
Material: soft-elevated. shadows: panel = 0 1px 2px oklch(0.3 0.02 255/0.06), 0 8px 24px oklch(0.3 0.02 255/0.08); menus/palette 3 layers; dark: lighter surface + hairline, shadows near zero (craft.tinted-shadows)
  radius: panel 10 → inner fields 6 (pad 4) → keycaps 4; buttons 6; rows 6 (inset 4 in a list) (craft.concentric-radii) · hairlines 8–10% fg alpha
Craft values: tracking display (22–32px serif) -0.015em / caps labels 11px +0.06em; line-height display 1.15, UI 1.4, body 1.55; numbers tabular, counts muted next to labels (craft.number-setting)
Icons & imagery: Phosphor regular (one weight) from unpkg CDN; no images: records are text; people as two-letter monograms on a tone derived from the name
Identity motif: the keycap (a convention of the keyboard-driven trade): button hints (New issue C), menu items (status 1–6), panel action bar (S P A), empty states ("Press C to file one"), the status bar legend that tracks the selection, the palette rows. 6 placements, small scale.
Accent moment: triage count pill in the sidebar + the selected row's mark edge
Motion personality: balanced, fitted to the daily budget
  durations: instant 50 · micro 100 · short 150 · signature 400
  easing: enter cubic-bezier(0.05,0.7,0.1,1) (panel first open) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1) · snappy cubic-bezier(0.23,1,0.32,1)
  spring: none (no bounce on a daily tool)
  the one real transition: click a row → the panel sheet slides 16px in from the trailing edge with fade (150ms) and the row's key chip travels into the panel header via view transition when supported; keyboard-opened = instant
Signature detail: Triage clear: the count rolls 1 → 0 and a keycap-shaped check stamp settles (scale .96→1, 400ms, once a day)
Fingerprint check: default-sans pass (Source Sans 3 + Newsreader with stated reasons); cream-serif-terracotta: no (cool graphite canvas, teal mark, serif only on titles); mono-as-costume: no (keys/branches only); default-dashboard-shell: no KPI tiles; pass
