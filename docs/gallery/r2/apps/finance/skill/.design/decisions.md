# Decision log — Halden & Moss finance overview

Autonomous run: every approval below is `self-approved (autonomous)`; every self-answered interview item is listed in brief.md "Decided by agent".

## D0 — Approvals
- **Step:** interview, blueprint, directions
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** brief.md confirmed, blueprint.md approved, direction C chosen: self-approved (autonomous). No person answered; the brief from the parent request is the only user input.

## D1 — Navigation: single hub
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how the owner moves between cash, runway, invoices, spending and payroll.
- **Options considered:** 1. Single hub, everything on one screen, dialogs for actions — one glance, no clicks / long page. 2. Sidebar with 5 destinations — scales / turns a one-minute check into five pages, and it is the default dashboard shell. 3. Top tabs — compact / hides four answers behind tabs.
- **Chosen:** 1
- **Why:** one dominant weekly task with five questions that are read together. [ia-nav.nav-model-by-count, flows-forms.primary-action-clarity, data.dashboard-summary-first] (brief: interview.jobs.top-tasks, interview.context.session)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → minimal: nothing to discover, everything is shown.
- **Revisit if:** bookkeeping tasks (categorising transactions, issuing invoices) move into the app.

## D2 — Summary-first stage
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** what the eye hits first.
- **Options considered:** 1. Cash figure + runway chart as one stage — answers "are we OK?" in one look. 2. Four equal KPI tiles — fingerprint default-dashboard-shell, says all numbers are equal. 3. A sentence summary — clear / weaker focal point.
- **Chosen:** 1
- **Why:** cash and how long it lasts are the first two things the brief lists; one focal figure, then supporting facts. [data.dashboard-summary-first, layout.hierarchy-by-weight] (brief: interview.purpose.one-liner)
- **Tension resolved:** layout.tension-consistency-emphasis → emphasis for the stage only.
- **Revisit if:** the owner manages several bank accounts with separate runways.

## D3 — Runway formula and the "money owed" toggle
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** what "months of runway" means.
- **Options considered:** 1. Cash ÷ 3-month average spend, assuming no new income, with a toggle that adds money clients owe — conservative and honest. 2. Cash ÷ net burn (spend minus income) — larger, volatile, depends on forecasting income. 3. Single number, no toggle.
- **Chosen:** 1
- **Why:** trust breaker is wrong numbers; the conservative figure is the safe default, and the toggle answers the owner's real follow-up ("and if they pay?"). [flows-forms.sensible-defaults, usability.system-status] (brief: interview.risks.trust)
- **Revisit if:** the owner asks for runway on net burn.

## D4 — Invoices grouped by lateness, status said once
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how unpaid invoices and their lateness are shown.
- **Options considered:** 1. Ledger rows grouped Over 60 / 31–60 / 1–30 days late / due soon, group header carries the status, row shows "73 days late" as text. 2. Table with a status chip per row — fingerprint redundant-status-tags / generic-table-columns. 3. Aging bar chart — shows shape but not who to chase.
- **Chosen:** 1
- **Why:** the owner's question is "who do I chase", ordered by how late; status colour + icon + words once per group. [data.status-encoding, color.color-not-sole-signal, layout.tension-consistency-emphasis] (brief: "unpaid invoices and how overdue they are")
- **Revisit if:** open invoices reach the hundreds (then a sortable table + filters).

## D5 — Undo over confirm
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** friction on Send reminder and Mark paid.
- **Options considered:** 1. Reminder: a review dialog (the message itself is the review) + 10 s delayed send with Undo; Mark paid: instant with Undo. 2. "Are you sure?" dialogs on both. 3. No friction.
- **Chosen:** 1
- **Why:** a reminder leaves the studio and reaches a client, so the message is shown before sending and the send can be undone; Mark paid is internal and fully reversible. [usability.user-control-undo, usability.error-prevention] (brief: interview.risks.failure)
- **Revisit if:** reminders become automatic.

## D6 — Spending as sorted horizontal bars
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** chart for spending by category.
- **Options considered:** 1. Horizontal bars sorted by amount, direct labels, a tick for the monthly average — position on a common scale. 2. Donut — 8 slices, angle judgement, fails data.chart-choice. 3. Table only.
- **Chosen:** 1
- **Why:** the question is comparison ("what costs most, what's unusual"); the average tick shows what moved. [data.chart-choice, data.data-ink] (brief: "spending by category")
- **Revisit if:** the owner needs category trends over many months (small multiples).

## D7 — Signature moment: Mark paid
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** where the one expressive motion goes.
- **Options considered:** 1. Mark paid: the amount is ruled through, the row collapses, cash rolls up and the double rule redraws under it. 2. Page load choreography — paid every Monday, no meaning. 3. Reminder sent — outward action, should feel sober.
- **Chosen:** 1
- **Why:** money arriving is the emotionally significant, comparatively rare event on this screen. [motion.one-signature-moment, motion.tension-delight-speed] (brief: interview.context.frequency)
- **Revisit if:** payments are always matched automatically by the bank feed.

## D8 — Direction: C, Double Rule (chosen by agent)
- **Step:** directions · **Date:** 2026-11-16 · **Status:** active
- Chosen: C. Rejected: A Ledger Book (rail + table reads closest to the default dashboard shell, the anti-reference), B Monday Statement (a 720 px column wastes the laptop width the brief names and pushes invoices and spending far below the fold).
- Chosen by agent: no subagents, so only one direction was built. C answers the Monday question with one focal figure, which data.dashboard-summary-first and the glance session favour; airy + stark suits a weekly decision by a non-accountant (data.tension-density-clarity → clarity) while staying serious.
- Axes: density=airy contrast=stark type=expressive display + utility layout=stage material=flat-hairline motion=productive
- Palette/type/motion carried to system: cool paper hue 165, ink primary, ledger-green mark; Bricolage Grotesque + IBM Plex Sans; durations 100/150/250/300, hero 500 for the signature only, bounce 0.
- Cards: data.tension-density-clarity, motion.tension-delight-speed, craft.tension-restraint-liveliness, layout.tension-consistency-emphasis
- Files: .design/directions/c.spec.md. The direction prototype is the build itself (`index.html`): with one key screen and no subagents, building a separate `c.html` would have duplicated it. No compare.html (one direction built).

## D9 — Tokens and motion language
- **Step:** system · **Date:** 2026-11-16 · **Status:** active
- **Decision:** palette inputs, type pairing, scale, radius, motion position.
- **Chosen:** base hue 165 at chroma ≤ 0.012 (craft.ink-and-accent); `primary` = ink; custom role `mark` for the ledger green (money in, the motif, focus ring); destructive (hue 32) and warning (hue 68) are text-capable for lateness; chart-1 petrol blue for cash and bars, chart-2 ochre for the "if clients pay" projection (check-palette ok). All text pairs ≥ 4.5:1 on background, card, muted and accent in both themes (fg/bg 17.7 light, 16.5 dark; muted-fg ≥ 6.3). Body 16 px (mixed audience), display 104 px for the cash figure only. Radius 4/8, no cards. Shadow only on floating layers (dialog, toast); dark mode uses a hairline instead. Motion: productive; nothing routine over 300 ms; hero 500 only on the signature. [color.role-scale, color.dark-mode-not-inverted, a11y.contrast-minimums, typography.type-scale, craft.material-restraint, motion.frequency-budget]
- **Fingerprint default-sans** not matched: IBM Plex Sans is chosen for true tabular figures and an institutional voice (personality.serious-trustworthy), Bricolage for the one display moment.

## D10 — Build deviations and kept findings
- **Step:** build / verify · **Date:** 2026-11-16 · **Status:** active
- **Row exit and accordion without height animation.** The item-enter-exit and accordion-auto-height recipes animate `grid-template-rows`; the flow-walk probe flags that as a high `anim-non-compositor`. Replaced with opacity + translate exits plus a FLIP (`transform`) glide of the rows below, and an opacity/translate reveal for category details. [motion.compositor-only]
- **Skeleton without a pulse.** An infinite pulse is flagged `anim-infinite-near-text`; a finite one is flagged `anim-long-duration`. The skeleton is static and fades in after 300 ms. [states.loading-perceived, motion.purpose-only]
- **Kept: dialog `display`/`overlay` allow-discrete transition** (probe: medium `anim-non-compositor` on #reminder). It is the dialog-enter-exit recipe's baseline; `display` is discrete, nothing lays out over time. Removing it cuts the exit fade. [motion.compositor-only]
- **Kept: 500 ms WAAPI on #cash-rule** (probe: low `anim-long-duration`). It is the signature moment (D7), uses `--duration-hero` and `--ease-enter-emphasized`, runs once per Mark paid, and is skipped under reduced motion. [motion.one-signature-moment]
- **Kept: colour crossfades** (9 low `anim-color`) on theme buttons, tabs and button hovers, ≤ 100 ms. [motion.compositor-only allows colour crossfades on small state changes]
- **Sample-states bar in the footer.** Not product UI: a labelled gallery control that makes the loading, sync-failed, error, first-run and cleared states reachable (also via `?state=`). Fingerprint check: not a fake control; every button switches state.
- **Motif placements (craft.identity-motif):** double rule under the cash figure (mark green), under the payroll total, under the owed total, as the chart's $0 line, in the first-run panel and the "Nobody is late paying you" state; first-run list bullets are small double rules. Six placements.
- **Caps labels dropped.** brand.md planned caps labels for group headers; built in sentence case to avoid the eyebrow pattern (fingerprint eyebrow-on-every-section). Tracking token kept, unused.
- **Fingerprint review (self, not independent):** default-dashboard-shell not matched (no sidebar, no KPI tile row; the chart answers the runway question); chart-without-question not matched (section titles and the spending finding are statements); redundant-status-tags not matched (lateness once per group header, days-late as text in rows); default-sans not matched (D9); sterile-default not matched (display face, mark accent, motif).
