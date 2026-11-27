# Direction C: Press Proof
Name: from a print studio's proof sheet (the sheet a printer pulls to check colour and register).
Thesis: the Monday look is a proof pull: one clear sheet, registration marks in the corners, a colour bar down the side; money checked for register before it goes to press on Friday.
Axes: density=balanced · contrast=stark · type=expressive · layout=rail+work · material=soft-elevated · motion=expressive (rolls 2,3,3,1,2,3; layout re-rolled 1→2 because A took column, rule "three different layouts")
Personality recipe: serious-trustworthy 40% + energetic 30% (colour only) + editorial 30% (display type); token ranges from their `produces`.
Tension resolutions:
  - motion.tension-delight-speed: speed on lists, delight once per visit (runway bar draw); weekly use, brief context.frequency.
  - data.tension-density-clarity: clarity wins (≈12 rows, glance first).
  - craft.tension-restraint-liveliness: liveliness: the yellow marker and magenta primary carry the point of view; hairlines carry restraint.
Palette (OKLCH):
  inputs: base hue 215 (cyan tracing canvas) · accent hue 355 (process magenta) · contrast target stark
  background oklch(0.962 0.024 215) / foreground oklch(0.2 0.035 265) / muted oklch(0.93 0.026 215) / primary oklch(0.5 0.21 355) / mark (process yellow) oklch(0.9 0.17 100) / cyan oklch(0.62 0.12 220) / destructive oklch(0.5 0.2 27)
  dark: deep ink-blue canvas oklch(0.2 0.035 255), cards lighter oklch(0.255 0.04 255), magenta lifted to oklch(0.74 0.17 350)
  check: fg/bg 16.3:1, muted-fg/bg 6.7:1, primary-fg/primary 6.4:1, primary on card 6.5:1 (all pass)
Type: Bricolage Grotesque (display, variable, optical-size character) + Hanken Grotesk (text, variable) with system fallbacks.
  why: the brief's "design studio" owner reads headings as a type specimen: Bricolage has ink-trap character at large size for the runway figure; Hanken is a plain, even text face for numbers (typography.limited-families-weights).
Layout concept: header (logo with registration mark, 3 tabs, Studio menu). Below, a 340px rail beside a work area. Rail (sticky): the runway figure (focal), colour-bar gauge, cash by account, "How it's worked out" disclosure. Work area: overdue list with Chase action, then payroll strip, then upcoming. Phone: rail stacks on top, then work. (layout.hierarchy-by-weight)
  composition: "giant runway figure in a sticky rail → overdue rows → payroll strip" differs from A's single column and B's centred stage.
  focal point: the runway figure in Bricolage at 72-96px.
Material: soft-elevated (craft.material-restraint)
  shadows: sm/md/lg layered, hue 265 tinted, alpha 0.06-0.2 · dark mode: lighter surfaces plus deeper shadows
  radius: cards 12 → inner controls 8 → chips 4 (concentric) · hairlines: 1px border token
Craft values: tracking display -0.03em / headings -0.015em / caps labels +0.06em; line-height display 1.0; numbers: tabular figures, muted "$" and "K" suffix, true minus (U+2212)
Icons & imagery: hand-set inline SVG, one family at stroke 1.75 (no library installed; D12); no photographs needed: a finance tool has no imagery, the real things are the numbers; people as initials monograms.
Identity motif: registration mark (circle + crosshair) — repeats in: logo, runway figure corner, empty states, toast icon; and the CMYK colour bar — repeats in: runway gauge, header underline, payroll cover bar.
Accent moment: the yellow marker highlight on the overdue count and oldest-invoice age.
Motion personality: expressive on one moment, productive elsewhere
  durations: micro 100 · standard 250 · hero 600 (bar draw once)
  easing: enter cubic-bezier(0,0,0,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1)
  spring: none (CSS only)
  the one real transition: "Mark paid" confirm → row leaves the Overdue list and the runway figure counts to its new value and the bar re-draws.
Signature detail: the runway gauge is a colour bar: segmented C/M/Y/K-ish chips, one per month, last filled chip shows the month cash runs out.
Fingerprint check: pass (no gradient hero, no default sans, no bento, no cream-serif; eyebrow labels limited to the rail). kept: "stark" contrast uses ink text on cyan canvas, justified by the proof-sheet motif.
