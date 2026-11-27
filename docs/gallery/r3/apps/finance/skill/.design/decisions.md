# Decision log — Studio Ledger

Autonomous run (no person answering). Approvals below are `self-approved (autonomous)`; every self-answered interview item is listed in `brief.md` → "Decided by agent".

## D0 — Approvals
- **Step:** interview, blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** brief confirmed and blueprint approved without a person.
- **Chosen:** self-approved (autonomous), per SKILL.md "Autonomous runs".

## D1 — Primary navigation model
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** how the owner moves between Overview, Invoices, Spending and Payroll.
- **Options considered:**
  1. Left sidebar: always visible / eats ~240 px of a laptop and is the default dashboard shell
  2. Top bar with 4 tabs: always visible, full width for the figures / less room if destinations grow past ~6
  3. Hub page only: minimal / hides destinations
- **Chosen:** 2
- **Why:** 4 destinations, laptop-first, a fixed weekly routine: they must stay visible and one click away, and the overview needs the width. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.wayfinding-location] (brief: interview.context.device, interview.context.frequency, interview.jobs.top-tasks)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → discoverability; four labels always shown, also at 375 px.
- **Revisit if:** destinations grow past 6.

## D2 — Overview as hub, summary first
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** what the home screen is.
- **Options considered:** 1. Overview answering all five questions above the fold / 2. Separate pages per question with a light home
- **Chosen:** 1
- **Why:** the Monday read is a glance; five answers with comparisons must fit 1440×900. [data.dashboard-summary-first, layout.hierarchy-by-weight] (brief: interview.context.session, interview.jobs.top-tasks)
- **Tension resolved:** data.tension-density-clarity → clarity, detail one click away.
- **Revisit if:** the owner starts using it daily for bookkeeping.

## D3 — Runway shown two ways
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** what "months of runway" means on screen.
- **Options considered:** 1. cash ÷ monthly spend only / 2. net-burn runway (assumes revenue) / 3. both cash-only and "if unpaid invoices are collected"
- **Chosen:** 3
- **Why:** a studio's revenue is lumpy; the owner's real question is "how long if nobody pays" and "how long if they do". Labelling both prevents a stale assumption. [usability.self-evident, writing.user-language] (brief: interview.risks.trust)
- **Revisit if:** the studio adds recurring retainer revenue.

## D4 — Payroll apart from spending
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** whether payroll is a spending category.
- **Chosen:** shown apart: next payroll gets its own section; the spending chart answers "where did the other $33k go?".
- **Why:** payroll is ~75% of spend and would flatten every other bar to a sliver; the brief names it as its own question. [data.chart-choice, data.data-ink] (brief: interview.jobs.top-tasks)

## D5 — Reminder: undo, not confirm
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** guard against sending a reminder by mistake.
- **Options considered:** 1. "Are you sure?" dialog / 2. queue with 8 s undo toast
- **Chosen:** 2
- **Why:** the send is reversible until it leaves; undo keeps the weekly chase fast and still catches slips. [usability.user-control-undo, states.optimistic-feedback] (brief: interview.risks.failure)

## D6 — Browse, no search
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** search.
- **Chosen:** none; dozens of invoices, sorted by days overdue. [ia-nav.search-vs-browse] (brief: interview.content.volume)

## D7 — States reachable by URL
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** how empty/loading/error/partial/no-permission are forced in a static single-file build with no API.
- **Chosen:** `?state=` query parameter plus real controls (Sync now, Try again, Connect bank account).
- **Why:** the build has no network calls to intercept; the flow walk needs a direct entry. [states.*] 

## D8 — Expressive moment: the runway drawn once
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** where the expressive motion budget goes.
- **Options considered:** 1. runway figure on first view of the week / 2. a celebration when an invoice is paid / 3. none
- **Chosen:** 1, plus the payroll "covered" mark settling right after it
- **Why:** the first view of the week's key figure is the one emotional moment of a weekly ritual; paid invoices arrive from the bank, not from an action in this app. [motion.one-signature-moment, motion.tension-delight-speed, motion.frequency-budget] (brief: interview.context.frequency)
- **Tension resolved:** motion.tension-delight-speed → speed everywhere else (≤ 250 ms), delight once per session.

## D9 — Direction: C, Day Book
- **Step:** directions
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** which of three directions to build.
- **Options considered:**
  1. A Monday Paper — single reading column, editorial serif, flat hairline; closest to the ink-on-paper house style (breaks it only with a teal primary).
  2. B Ultramarine Rail — saturated rail of figures beside a work area; bold, but "rail + work" is the shape most finance dashboards already take.
  3. C Day Book — ledger-green paper, green-ink primary, typed ledger figures, double-rule motif, runway staged as ledger columns per month.
- **Chosen:** 3 — chosen by agent: C is the only one whose palette, figure type and motif come from the subject (the studio's books), its canvas is not a near-neutral paper, and its stage composition makes the owner's real question ("how many months?") the largest thing on screen. A generic finance dashboard has KPI tiles and an area chart; the ink-on-paper house style has a pale neutral page with near-black buttons; C has neither. No brief line demands restraint beyond "serious", which C keeps (bounce 0, standard contrast). [craft.identity-motif, craft.tension-restraint-liveliness, data.dashboard-summary-first]
- **Rejected:** A (quiet; nearest the house style), B (bold but conventional composition for finance).
- **Built:** only C (single agent, no subagents): A and B exist as specs only (`directions/a.spec.md`, `b.spec.md`). No compare page.
- **Axes:** density=airy · contrast=standard · type=neutral grotesk (+ ledger mono figures) · layout=stage · material=flat-hairline · motion=balanced (fitted to weekly budget)
- **Files:** .design/directions/c.spec.md; the build `index.html` is C's implementation.

## D10 — System tokens
- **Step:** system
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** palette inputs, type pairing, scale, radius, motion position.
- **Chosen:** base hue 150 (ledger paper), ink hue 163, red ink 27; Archivo + IBM Plex Mono; scale 12–88, body 16; radius 10/6/4 concentric; flat-hairline; motion balanced with routine ≤ 250 ms, bounce 0.
- **Why:** serious money context with calm weekly reading [personality.serious-trustworthy, personality.calm]; figures must align [typography.tabular-numbers, craft.number-setting]; one material [craft.material-restraint]. Contrast checked with contrast.mjs: ink 14.1:1 / 14.7:1, muted 6.0:1 / 7.6:1, primary text 7.9:1 / 8.5:1, red ink 5.3:1 / 6.1:1, amber 5.4:1, input border 4.2:1 / 4.7:1.
- **Note:** emit-tokens' font loader drops the Archivo `wdth` axis; the `<link>` was extended by hand to `Archivo:wdth,wght@62..125,400..700`.
- **Fingerprint mono-as-costume kept** — brief: "Mostly: numbers and charts" — card: typography.tabular-numbers — rejected alternative: Archivo tabular figures, because the typed-ledger voice is the subject's own and Plex Mono is used for figures only, never headings or nav.

## D11 — Build and verify notes
- **Step:** build, verify
- **Date:** 2026-11-16
- **Status:** active
- **Deviation from spec C:** the runway display figure is set in Archivo 600 with tabular digits, not Plex Mono: at 88 px the mono decimal point left a wide gap ("5 . 5") that read as broken. Figures inside sentences also use the text face; Plex Mono stays for columns and totals. [craft.number-setting, typography.tabular-numbers]
- **Shimmer removed:** the skeleton is static (r0 flagged 15 × infinite animation near text). [motion.purpose-only, states.loading-perceived]
- **Motif placements:** double rule under the cash total, closing the run-out on the runway strip (red ink), under the payroll lines before the total, under the current tab, on the first-run empty state, under "Total outside payroll" on Spending. [craft.identity-motif]
- **Low findings kept (runtime probe, r3):**
  - anim-long-duration × 3 — `.rule` draws in 600 ms: it is expressive moment 1 (D8), once per session, under `.runway-signature`.
  - anim-color × 6 — tab colour and row hover background cross-fade at 150 ms; colour cross-fades are allowed for small state changes. [motion.compositor-only]
  - off-token-color × 3 — aging-bar segments "not due" and "1–15 days" and the error-banner fill are `color-mix()` tints of token colours (muted-foreground, warning, destructive), not new values. [color.role-scale]
- **Fingerprint mono-as-costume:** kept, see D10.
- **States:** `?state=empty|loading|error|partial|denied|cleared|sendfail`; the flow walk forces them by URL (D7).
