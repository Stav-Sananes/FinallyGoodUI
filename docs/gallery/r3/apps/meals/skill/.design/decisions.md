# Decision log — Sunday Table

Autonomous run: every approval below is `self-approved (autonomous)`.

## D0 — Brief and blueprint approval
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Approve brief and blueprint without a person.
- **Chosen:** self-approved (autonomous)
- **Why:** Parent agent's brief says no person will answer. (SKILL.md: Autonomous runs)
- **Revisit if:** a person reviews the brief.

## D1 — Home screen is "This week", tonight first
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** What the home screen leads with.
- **Options considered:**
  1. Week with tonight as focal card — serves both Sunday planning and weeknight cooking / two jobs on one screen
  2. Calendar grid of 7 columns — planner-like / unreadable at 375, mirrors the data model
  3. Separate "Today" home — fastest for cooking / Sunday planning pushed a tab away
- **Chosen:** 1
- **Why:** The brief names this screen as key and the most-opened; weeknight use is a glance for tonight. [layout.hierarchy-by-weight, flows-forms.primary-action-clarity, data.dashboard-summary-first] (brief: interview.context.frequency, interview.jobs.top-tasks)
- **Tension resolved:** none
- **Revisit if:** households plan daily instead of weekly.

## D2 — Navigation model
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** How people move between This week, Recipes, Shopping list.
- **Options considered:**
  1. Bottom tabs on phone, labelled rail on desktop — visible, thumb-reachable
  2. Single hub with links — fewer chrome / list is a weekly destination and deserves one tap
- **Chosen:** 1
- **Why:** 3 destinations, phone-first. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, a11y.target-size] (brief: interview.context.device, interview.jobs.top-tasks)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → discoverability; 3 labelled tabs are cheap.
- **Revisit if:** more than 5 destinations appear.

## D3 — Nights as rows, not a 7-column grid
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Layout of the seven nights.
- **Options considered:**
  1. Vertical list of nights (fridge list) — reads at 375, long names wrap
  2. 7-column calendar — scans across on desktop / breaks on phone
- **Chosen:** 1 (desktop puts the list beside the tonight card and a recipe panel)
- **Why:** Mirrors how a household says it ("Monday's pasta, Tuesday's tacos") and survives 375 px. [layout.intrinsic-responsive, writing.user-language] (brief: interview.context.device)
- **Tension resolved:** data.tension-density-clarity → clarity (kitchen glance).
- **Revisit if:** desktop becomes primary.

## D4 — Shopping list grouped by aisle in shop order
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** How the shopping list is ordered.
- **Options considered:**
  1. By aisle in walking order, quantities combined across dinners — one walk through the shop
  2. By recipe — easy to trace / you visit the meat aisle four times
- **Chosen:** 1, with "for Tue, Thu" under each item to keep the trace
- **Why:** The brief asks for aisle grouping; showing which dinners need an item protects trust when a dinner is swapped. [usability.recognition-over-recall, usability.system-status] (brief: interview.risks.trust)
- **Tension resolved:** none
- **Revisit if:** a household shops online by category.

## D5 — Undo over confirm
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Clearing a night and clearing ticked items.
- **Options considered:** 1. Undo toast 8 s 2. "Are you sure?" dialog
- **Chosen:** 1
- **Why:** Both are reversible and frequent enough that a dialog is friction. [usability.user-control-undo, states.optimistic-feedback] (brief: interview.risks.failure)
- **Tension resolved:** none
- **Revisit if:** actions start affecting shared data irreversibly.

## D6 — Search only where recipes are chosen
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Where search lives.
- **Options considered:** 1. Filter field in the picker and Recipes 2. Global search
- **Chosen:** 1
- **Why:** Dozens of recipes; the week has 7 rows and needs no search. [ia-nav.search-vs-browse] (brief: interview.content.volume)
- **Revisit if:** recipe count reaches hundreds.

## D7 — Expressive moments
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Where the motion budget is spent.
- **Options considered:** 1. Week-planned + list count roll 2. Animate every night entrance
- **Chosen:** 1
- **Why:** The week is finished once a week, a real moment; nights are opened most evenings so they stay quick. [motion.one-signature-moment, motion.frequency-budget, motion.tension-delight-speed] (brief: interview.context.frequency)
- **Tension resolved:** motion.tension-delight-speed → speed on weeknights, delight on Sunday completion.
- **Revisit if:** usage becomes daily planning.

## D8 Direction: C — Plates on the Table
- **Step:** directions
- **Date:** 2026-11-16
- **Status:** active
- Chosen: C, chosen by agent: the only direction whose palette, motif and composition come from a dinner table (tile-green glaze, tomato, the rimmed plate as progress), so it is unlike a generic recipe app (photo cards, orange CTA) and unlike the ink-on-paper house style; its stage puts tonight's dinner first, which serves the weeknight job ("open a recipe while cooking"). No brief line demands restraint, so A (quiet) did not win. B rejected: dense rail + bezel suits a desktop work tool, but the brief is a phone in a kitchen.
- Built: only C (no subagents in this run; autonomous rule). A and B exist as specs only.
- Axes: density=airy contrast=stark type=humanist/serif text layout=stage material=soft-elevated motion=expressive (fitted to budget)
- Palette/type/motion carried to system: tile-green canvas h150, tomato primary h30, herb green for done; Young Serif + Atkinson Hyperlegible; skill duration/easing tokens, plates fill 600ms signature.
- Cards: motion.tension-delight-speed, data.tension-density-clarity, craft.identity-motif, craft.tension-restraint-liveliness
- Files: .design/directions/c.spec.md (+ a.spec.md, b.spec.md); build copy at .design/directions/c.html
- Fingerprint cream-serif-terracotta considered — brief: "open a recipe while cooking" (kitchen) — card: personality.playful — rejected alternative: a cream canvas with terracotta because it is the generic "tasteful" costume; kept a serif display only as a low-contrast menu-board face on a tile-green canvas.

## D9 — Tokens and motion language
- **Step:** system
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Lock palette, type, radius, motion from direction C.
- **Chosen:** tile-green h150 canvas, tomato h30 primary, herb success; Young Serif + Atkinson Hyperlegible; radius 28/20/14/8; motion = skill defaults with hero 600 only for "week planned".
- **Why:** contrast checked on every surface level, both themes: body ≥ 11:1, muted ≥ 5.6:1 light / ≥ 6.5:1 dark, tomato text ≥ 5.1:1, primary-foreground on primary 5.0:1 light / 6.1:1 dark. [a11y.contrast-minimums, color.dark-mode-not-inverted, motion.frequency-budget, craft.concentric-radii] (brief: interview.context.frequency, interview.context.environment)
- **Tension resolved:** craft.ink-and-accent not-when (friendly lean) → coloured primary; accent spent on tonight, the primary action and the list count only.
- **Revisit if:** a person asks for an ink-primary calmer version.
- **Motif:** the rimmed plate; places: week plate row, empty-night plate, cook monogram plate, aisle progress ring, loading plates. [craft.identity-motif]

## D10 — Build deviations and kept findings
- **Step:** build / verify
- **Date:** 2026-11-16
- **Status:** active
- **Primary action on the key screen:** "Start cooking" when tonight is planned; "Plan tonight" or "Plan Monday" otherwise. Empty nights keep a quiet text action. Supersedes the blueprint's "plan next empty night" line, which would have put two strong buttons on a weeknight. [flows-forms.primary-action-clarity] (brief: interview.context.frequency)
- **Motif placements (craft.identity-motif):** (1) week plate row (filled / empty / eating-out / tonight-rimmed / waiting-to-sync), (2) empty-night rows and empty states (week, list, recipes), (3) cook monograms on a tiny plate, (4) the stage's large plate holding tonight's minutes, (5) shopping-list aisle progress rings, (6) brand mark in the rail.
- **Accent moments:** tomato rim on tonight's plate, tonight label, the list count; tomato fill only on the one primary button.
- **Kept static/probe findings:**
  - `anim-non-compositor` on `#picker` display: `display … allow-discrete` is what lets the native `<dialog>` play its exit (bottom-sheet recipe); nothing moves through layout. [motion.compositor-only]
  - `anim-non-compositor` on the checkbox tick `stroke-dashoffset`: paint-only on a 24 px SVG, 150 ms (control-states recipe). [motion.compositor-only]
  - `anim-color` (10): row/press background crossfades of 100 ms, allowed by motion.compositor-only.
  - `small-target` on the second toast's Undo (59×42): measured while scaled 0.95 behind the newest toast; at rest it is 44 px.
  - `off-token-spacing` 90 px on `#picker`: computed `margin: auto` centring the desktop dialog, not a spacing value.
- **Fingerprints considered:** cream-serif-terracotta → not matched (tile-green canvas, saturated tomato, low-contrast Young Serif), see D8. ink-on-paper → not matched (canvas chroma 0.035 green, tomato primary). default-sans → Atkinson Hyperlegible kept — brief: "open a recipe while cooking" — card: typography.limited-families-weights — rejected alternative: a neutral grotesk because legibility at arm's length (slashed zero, open shapes) is the job here.
- **Stack fallbacks (autonomous):** nothing installed. Playwright borrowed from another local project via NODE_PATH for the flow walk; no axe (not available). Reviewer subagent skipped by instruction.
