# Direction C: Day Book
Thesis: The studio's books, kept the way a bookkeeper keeps a day book: pale ledger-green paper, ink figures in a typed ledger face, the accountant's double rule under every total, and the runway laid out as ledger columns, one per month, until the money runs out (brief: "cash in the bank, months of runway"; subject: the ledger).
Axes: density=airy · contrast=standard · type=neutral grotesk (+ ledger mono for figures) · layout=stage · material=flat-hairline · motion=balanced  (rolls: density 1, contrast 2, type 1, layout 2→3, material 1, motion 2)
  re-roll log: layout rolled 2, clashing with B's rail+work; the only position satisfying "three different layouts" is 3 (stage): assigned, not re-rolled toward.
  differs from A on 4 axes (density, type, layout, motion); from B on 5 (density, contrast, type, layout, material).
  budget fit: balanced motion allowed 200–400 ms; the Overview is a weekly-routine screen, so routine motion stays ≤ 250 ms (tab cross-fade 150, toast 250, skeleton→content 250), and the 600 ms is spent once per session on the runway draw.
Personality recipe: serious-trustworthy 50% + calm 30% + editorial 20%
Tension resolutions:
  - craft.tension-restraint-liveliness → liveliness from the subject: tinted ledger canvas, green-ink primary, the double-rule motif; no effects.
  - data.tension-density-clarity → clarity (airy): weekly glance by a non-accountant; the stage holds one figure, detail sits below.
  - motion.tension-delight-speed → speed on routine; delight once (runway draw) [motion.one-signature-moment].
  - craft.identity-motif vs costume: ruled paper is the canvas tint and the table rules only; no notebook-page cards, no torn edges.
Palette (OKLCH, sources named):
  inputs: base hue 150 (ledger-paper green) · ink hue 163 (bookkeeper's green ink) · red ink 27 (ledger convention: red ink for what is owed/late) · contrast standard
  light: background oklch(0.952 0.024 150) [ledger paper] / sheet oklch(0.982 0.012 150) / foreground oklch(0.25 0.03 165) [green-black ink] / muted-foreground oklch(0.46 0.03 165) / primary oklch(0.40 0.085 163) [green ink] on oklch(0.985 0.012 150) / border oklch(0.40 0.06 160 / 0.22) [ledger rule] / destructive oklch(0.52 0.19 27) [red ink] / warning oklch(0.50 0.12 65) / info oklch(0.47 0.09 235)
  dark: background oklch(0.20 0.022 165) [ledger at night] / sheet oklch(0.24 0.026 165) / foreground oklch(0.93 0.02 155) / muted-foreground oklch(0.73 0.03 160) / primary oklch(0.78 0.11 160) on oklch(0.18 0.03 165) / border oklch(0.78 0.06 160 / 0.2) / destructive oklch(0.72 0.16 25) / warning oklch(0.80 0.13 75)
  check: fg/bg 14:1 light, 14.7:1 dark; muted 6.0:1 / 6.7:1; primary-fg/primary 8.5:1 / 9.8:1; red ink 5.9:1 / 6.1:1.
Type: Archivo (UI, headings; neutral grotesk, wdth axis for condensed column heads) + IBM Plex Mono (figures only: the typed ledger). why: column heads in a real ledger are condensed caps and the figures are typed; mono is for data that must align [typography.tabular-numbers, craft.number-setting]. Not Inter/Space Grotesk.
Layout concept: top bar → STAGE (≥ 40% of the first viewport): left, "Cash in the bank" with the two accounts; centre-right, the runway figure "5.5 months" at display size over a month-by-month ledger strip (Nov … May), the runway rule drawn from today to the run-out, a dashed extension for "with unpaid invoices collected", the run-out month closed with a double rule. Below the stage: wide "Who owes us" ledger (aging strip + rows, Send reminder per row) beside a narrower column with "Next payroll" and "Where October's money went" (ranked bars).
  composition: one focal stage across the full width, then a 2:1 split below; differs from A (single column) and B (rail beside work).
  focal point: the runway figure on the stage.
Material: flat-hairline. shadows: none on the page; the toast is the only raised layer (2 tinted layers, alpha 0.08/0.12 toward hue 165). dark: sheet lighter than canvas + hairline. radius: sections 10 → inner controls 6 → tags 4 (concentric). hairlines: ledger rule at 22% alpha of green ink.
Craft values: tracking display -0.03em / headings -0.01em / caps column heads +0.08em (Archivo wdth 75); line-height display 1.0; numbers: Plex Mono tnum, $ in muted ink same size, true minus, cents dropped above $1,000 on the overview.
Icons & imagery: Lucide via CDN (stroke 1.5, matches Archivo's stroke). images: none needed (figures are the content). people: client initials not needed; payroll shows head count.
Identity motif: the accountant's double rule (two hairlines under a total). Repeats in: under the cash total, closing the run-out month on the runway strip, under the payroll total, as the active-tab indicator, in the first-run empty state. (5 placements)
Accent moment: the runway rule in green ink and the run-out month's red-ink double rule; the "Covered" mark on payroll.
Motion personality: balanced (fitted to weekly budget)
  durations: micro 100 · short 150 · standard 250 · long 400 · hero 600
  easing: enter cubic-bezier(0,0,0,1) · enter-emphasized cubic-bezier(0.05,0.7,0.1,1) · exit cubic-bezier(0.3,0,1,1) · move cubic-bezier(0.2,0,0,1)
  spring: none (bounce 0: money)
  the one real transition: Send reminder → row cross-fades to "Reminder queued" and the toast rises 8 px from the bottom edge with Undo; Undo reverses both.
  expressive (once per session): runway rule uncovered from today to run-out (cover translates away, 600 ms, enter-emphasized); then the payroll "Covered" double-check fades and settles (400 ms).
Signature detail: the runway as ledger columns, one per month, closed with the double rule at the month the money runs out.
Fingerprint check: mono-as-costume → kept for figures only (brief: content is "numbers and charts"; card typography.tabular-numbers; rejected alternative: Archivo tnum figures, because the typed-ledger voice is the subject's own type choice). default-dashboard-shell → not matched (no sidebar, no KPI tile row). ink-on-paper → not matched (canvas chroma 0.024 green-tinted and a coloured green-ink primary). pass.
