# Direction A: Shift log
Thesis: The tracker should read like an on-call shift log: flat paper, hairline rules, every line the same weight until it is selected, so a team that opens it 30 times a day sees only what changed.
Axes: density=dense · contrast=soft · type=neutral grotesk · layout=rail + work (fixed by brief: list + side panel) · material=flat-hairline · motion=productive  (rolls: grounded)
  grounding: dense ← "live on the keyboard", experts daily; soft ← calm default for all-day use; grotesk ← dense UI text; flat-hairline ← personality.dense-expert "hairline structure instead of cards"; productive ← daily (interview.context.frequency)
Personality recipe: dense-expert 70% + calm 30%
Tension resolutions:
  - data.tension-density-clarity → density (experts, daily, brief §context)
  - motion.tension-delight-speed → speed; only "Triage clear" may run 400ms
  - craft.tension-restraint-liveliness → one teal accent on selection + triage count, keycap motif
Palette (OKLCH): inputs: base hue 255 · accent hue 195 · contrast soft
  background oklch(0.985 0.002 255) / foreground oklch(0.24 0.01 255) / muted oklch(0.955 0.003 255) / muted-fg oklch(0.52 0.01 255) / primary = foreground (ink) / accent oklch(0.52 0.09 195) / border oklch(0.24 0.01 255 / 0.09) / destructive oklch(0.53 0.17 25)
  dark: background oklch(0.18 0.005 255) / foreground oklch(0.92 0.004 255) / muted-fg oklch(0.70 0.01 255) / accent oklch(0.74 0.08 195)
Type: IBM Plex Sans 400/500/600 + IBM Plex Mono for keys. why: engineering-tool neutrality, distinct from Inter; one family for display (24px page title only).
Layout concept: sidebar 224 · list (rows 32px) · panel 40% separated by a single hairline, same surface. Focal point: selected row + panel title.
  composition: list → hairline → panel on one flat sheet.
Material: flat-hairline; shadows none (only menus/palette get a 2-layer shadow); radius 4 controls / 6 overlays; hairlines 9% fg alpha
Craft values: tracking display -0.015em / caps labels +0.06em; numbers tabular; keys mono
Icons & imagery: Phosphor regular via CDN; people as initials monograms; no images needed (text records)
Identity motif: keycaps (the team lives on the keyboard) — repeats in: button hints, menu items, panel action bar, empty states, status bar
Accent moment: triage count + selected row edge
Motion personality: productive — micro 100 · short 150 · signature 400; easing enter (0,0,0,1) / exit (0.3,0,1,1); no springs
  the one real transition: row click → panel opens (fade + 12px from trailing edge, 150ms); keyboard J/K instant
Signature detail: keycap legend that tracks the selected issue
Fingerprint check: risk sterile-default (flat, soft, grotesk) → mitigated by motif + accent; default-sans: Plex justified (tool voice), kept
