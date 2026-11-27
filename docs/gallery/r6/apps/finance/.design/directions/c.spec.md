# Direction C: Wall Planner (BUILT; chosen by agent)
Name: from the studio's world, the pinned paper planner on the wall where weeks run across and every job is a slip of paper.
Thesis: money is a calendar. The owner should see cash as a line across 26 pinned weeks, with each invoice a slip landing in its due week and each payroll a vermilion stamp, so the one Monday question, "how long does this last and what is late", is answered by looking, then adjusting a slip.
Axes: density=balanced · contrast=standard (navy ink on pale cyanotype sheet, paper slips lighter) · type=expressive display + utility mono · layout=stage+object (roll 3; object-position 4 for the signature) · material=tonal (blueprint lines, paper slips with a thin lower edge) · motion=productive. Rolls: grounded by the subject, not rolled (single built direction); B and A written as contrasts: A column, B rail+work, C stage: three different layouts, materials flat/textured/tonal.
Personality recipe: precise 55% + crafted 30% + calm 15%; ranges from personality.* `produces`.
Tension resolutions:
  - data.tension-density-clarity: clarity wins on the stage (one figure, one line); density only in the ledgers; brief: weekly 2-5 minute glance, designer not accountant.
  - craft.tension-restraint-liveliness: restraint in colour (one vermilion mark reserved for late, payroll and the today line); liveliness in the motif and the scrubber.
Palette (OKLCH): base hue 228 (cyanotype) · accent hue 33 (riso vermilion) · contrast standard (strong ink).
  background oklch(0.925 0.052 228) / foreground oklch(0.24 0.07 255) / card oklch(0.985 0.014 95) paper / muted-fg oklch(0.4 0.06 252) / primary oklch(0.3 0.09 255) ink / mark oklch(0.47 0.2 33) / border oklch(0.62 0.07 235) blueprint line
  dark: blueprint at night: background oklch(0.2 0.06 255), card oklch(0.275 0.065 255), foreground oklch(0.94 0.03 215), primary oklch(0.9 0.07 210), mark oklch(0.74 0.17 48), re-derived, not inverted.
  check: fg/bg 11:1+, muted-fg/bg 7.4, mark on bg 5.7, primary-fg/primary 12.6 (scripts/lib/contrast.mjs)
Type: Bricolage Grotesque (display + text, variable, local via @fontsource-variable) + JetBrains Mono (figures, dates). why: Bricolage has ink-trap character at large sizes for the one big figure (typography voice from the brief "designer-owner"); mono for pound figures keeps columns of money aligned (craft.number-setting).
Concept mapping: planner sheet -> 26 week columns with the balance line across them (the stage) | pin / slide a slip -> scrub the date line and slide the "overdue lands in" what-if (a working control) | slip of paper -> invoice record: perforated tear-off edge after the invoice number (edge=perforated, corner=uniform, layered paper).
Skeleton: planner stage fills the first viewport (rail 72px | stage ~1368px x 480px: runway figure column 30% + 26-week chart 70%) -> below it overdue slips 62% | payroll stub 38% unlike each other (slips are perforated paper; the payroll is a ruled stub). The blueprint's top bar is replaced by the sheet's left margin rail (desktop) and bottom strip (phone). Amends blueprint shell: yes (see decisions D2).
Layout concept: eye hits the runway figure ("13 wks", display 144px) -> the line crossing zero -> the vermilion Today line -> overdue slips. Primary action lives on the slips ("Send nudge"). 
  composition: stage-over-ledgers; A is a letter column, B a rail and table.
  focal point: the runway figure and the point where the balance line dips under one payroll.
Material: tonal: sheet (canvas), paper slips (card) with a 1px lower edge and sm shadow; chart and stage are drawn on the sheet itself (no box). shadows: sm 1px 0.18 navy tint, md 2 layers · dark: slips lighter than the sheet (0.275 vs 0.2).
  radius: stage 0, slips 2px, panels/dialog 6px (outer) -> 2px controls (concentric) · hairlines: blueprint line at full chroma, not alpha.
Craft values: tracking display -0.045em, headings -0.02em, caps labels 0.06em; display lh 0.9; numbers: JetBrains Mono tabular-nums, pound sign and pence muted, true minus.
Icons & imagery: hand-drawn inline SVG set at stroke 1.75 (home-grid, slip, coin-stack) one family; no photos (data app: honest, none needed); clients as monograms.
Identity motif: registration cross + perforation dots; repeats in: stage corners, slip tear edge, section rules, toast edge, focus ring dot, empty states.
Accent moment: the vermilion Today line and its stamp "TODAY"; overdue amounts; payroll stamp on the chart.
Motion personality: productive. durations: micro 100 · standard 250 · hero 500ms. easing: enter cubic-bezier(0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1). spring: none.
  the one real transition: changing the what-if (or marking a slip paid) redraws the balance line by morphing (opacity/transform on line layers; the line crossfade) and the figure rolls (opacity swap).
  frequency fit: weekly 2-5 min screen; no entrance choreography, repeated actions <= 150ms.
Signature at scale: **Runway Planner**: a 26-week cash planner that is a working control (scrub dates by pointer or arrow keys, change when overdue invoices land, hover/keys read any day's balance, shows payroll stamps and incoming slips). First screen of /, >= 25% of 1440x900 (measured promise 0.40) and >= 40% of 375x667 (promise 0.50); `data-fgu-signature`.
Refuses: no equal-card grid of KPI tiles (cardCoverage) · no centred column (singleColumn) · no per-row "..." menu (rowRepeat).
Fingerprint check: predicted pass; avoids ink-on-paper (tinted cyan canvas, vermilion mark), avoids card grids; tonal material is not glass.
