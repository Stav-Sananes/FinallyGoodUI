# Direction C: Double Rule
Name: the accountant's double rule, the two lines drawn under a final total in a ledger.
Thesis: The Monday check is one question ("are we OK?"), so one figure answers it at stage size and the rest of the page reads like a ledger page beneath it: stark ink, hairline rules, nothing boxed. Brief: "checks it every Monday: cash in the bank, months of runway…".
Axes: density=airy · contrast=stark · type=expressive display + utility · layout=stage · material=flat-hairline · motion=productive  (rolls: density 1 · contrast 3 · type 3 · layout 3 · material 1 · motion 1; no re-rolls)
Personality recipe: serious-trustworthy 50% + calm 30% + editorial 20%; neutrals chroma ≤ 0.012, one ink-green mark hue, body text ≥ 7:1, bounce 0.
Tension resolutions:
  - data.tension-density-clarity → clarity: weekly decision at a glance by a non-accountant (brief §Context, §Purpose).
  - motion.tension-delight-speed → speed: routine motion ≤ 250 ms; the one expressive moment is Mark paid (money arrives), ≤ 500 ms.
  - craft.tension-restraint-liveliness → stark ink + one display face at stage size + the double-rule motif keep calm from going sterile.
  - layout.tension-consistency-emphasis → the stage is the single break from the ledger rhythm, tied to the top question.
Palette (OKLCH, roles):
  inputs: base hue 168 (cool paper with a trace of ledger green) · mark hue 165 · contrast target stark
  background oklch(0.985 0.004 165) / foreground oklch(0.19 0.012 170) / muted oklch(0.955 0.006 165) / muted-foreground oklch(0.45 0.012 170) / primary = ink oklch(0.19 0.012 170) / mark oklch(0.46 0.09 165) / border oklch(0.885 0.006 165) / destructive oklch(0.51 0.17 32) / warning oklch(0.52 0.11 68)
  dark: background oklch(0.17 0.008 170) / foreground oklch(0.95 0.006 165) / card oklch(0.21 0.009 170) / muted-foreground oklch(0.73 0.012 165) / primary oklch(0.95 0.006 165) / mark oklch(0.77 0.1 165) / border oklch(0.31 0.008 170) / destructive oklch(0.73 0.14 32) / warning oklch(0.8 0.12 75) — re-derived, surfaces lighten as they rise (color.dark-mode-not-inverted)
  check: fg/bg ≥ 7:1, muted-fg/bg ≥ 4.5:1, mark as text ≥ 4.5:1, primary-foreground/primary ≥ 4.5:1 (a11y.contrast-minimums) — verified with scripts/lib/contrast.mjs at the system step
Type: Bricolage Grotesque (display: the cash figure, section heads) + IBM Plex Sans (utility, tabular figures) from Google Fonts; fallbacks ui-sans-serif, system-ui, sans-serif.
  why: a design-studio owner reads type with a trained eye, so the one big figure gets a display face with character (Bricolage's optical sizes and ink traps at 96 px); everything that must be compared is set in a sober, institutional sans with true tabular figures. [typography.limited-families-weights, typography.tabular-numbers, personality.serious-trustworthy]
Layout concept: single hub. Thin top bar (studio, sync status, refresh, theme). Stage: the cash figure top-left at display size, double rule under it, the runway sentence beside/below, and the cash chart spanning the full content width underneath it as one unit (history solid, projection dashed to the zero line). Then a two-part strip: next payroll · money owed. Then "Invoices to chase" (ledger rows grouped by lateness). Then "Where the money went" (horizontal bars).
  composition: A = summary rail + working list; B = one reading column; C = one focal figure + chart owning the first viewport.
  focal point: the cash figure.
Material: flat-hairline (craft.material-restraint)
  shadows: none on the page; the reminder dialog and toast get one tinted two-layer shadow (they float) · dark mode: lighter surface + hairline border, no shadow (craft.tinted-shadows)
  radius: dialog 8 → inner fields 4; buttons 4; no cards (craft.concentric-radii) · hairlines: border token, 1 px (craft.hairlines-before-boxes)
Craft values: tracking display -0.035em / headings -0.015em / caps labels +0.06em; line-height display 1.0 (craft.tracking-by-size); numbers: tabular in lists, "$" set in muted ink at the same baseline, true minus (U+2212) for outflows (craft.number-setting)
Icons & imagery: Lucide via unpkg, stroke 1.5, 16/20 px; no imagery needed (a finance summary has no visual subject); clients shown as monogram initials (craft.real-imagery-and-icons)
Identity motif: the ledger double rule — repeats in: under the cash figure (stage), under the payroll total, under the "owed" total, as the chart's zero line, and in the cleared/empty states (craft.identity-motif)
Accent moment: the mark green spends itself on money arriving: the double rule under the cash figure and the "+$18,400" after Mark paid (craft.tension-restraint-liveliness)
Motion personality: productive
  durations: micro 100 ms · short 150 ms · standard 250 ms · medium 300 ms (chart morph) · hero 500 ms (signature only)
  easing: enter cubic-bezier(0,0,0,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1)
  spring: none (bounce 0)
  the one real transition: Mark paid → row is ruled through and collapses, cash rolls up, the double rule redraws under it (motion.one-signature-moment, motion.spatial-continuity)
Signature detail: the double rule drawn under a total, the accountant's mark for "this is the final figure", at its largest under the cash balance.
Fingerprint check: default-dashboard-shell → avoided (no sidebar, no KPI tile row, the chart is the runway answer, invoices are grouped ledger rows) · cream-serif-terracotta → avoided (cool paper, grotesque display, green mark) · chart-without-question → titles are findings · redundant-status-tags → lateness said once per group · result: pass
