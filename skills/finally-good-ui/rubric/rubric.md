# Rubric — 10 dimensions

Score every dimension separately, 1–5, against the anchors below. Never collapse into one overall score (per-dimension judging agrees with humans far more often than a single score).

**D** = measured (scripts: `check-static`, `probe.js`, `check-flows`, axe). **J** = judged (the `ui-reviewer` subagent, from screenshots + context). **D+J** = the measured part sets a **cap**; judgement can lower the score, never raise it above the cap.

- Dimensions 1–3 are scored by the main agent from measured data only.
- Dimensions 4–10 are scored by `ui-reviewer`. For 6, 7 and 9 it receives the cap and must respect it.
- A judge never overrides a measurement. If a screenshot looks fine but the probe reports a failure, the failure stands.

## Gate and pass

- **Gate (dimension 1):** zero high or medium findings whose card is `a11y.*` or `motion.reduced-motion`, in every context (both viewports, both themes, reduced motion) and every forced state. Advisory items (`focus-weak` = WCAG 2.4.13, AAA; APCA values) never fail the gate.
- **Pass:** gate passes **and** every dimension scores ≥ 4.
- A dimension that cannot be assessed (e.g. motion with no browser) is `n/a` with a reason. `n/a` is not a pass. Report it as unverified.

## Dimensions

### 1 · Accessibility — D (hard gate)
Cards: a11y.contrast-minimums · a11y.target-size · a11y.focus-visible · a11y.semantic-first · a11y.keyboard-complete · motion.reduced-motion · color.color-not-sole-signal
Measured: axe serious/critical, text contrast ≥ 4.5:1 (≥ 3:1 at ≥ 24px or ≥ 18.66px bold), targets ≥ 24px (WCAG 2.5.8 AA; 44px on touch is best practice, reported low), focus change on every stop, accessible names, alt, heading order, no spatial motion under `reduce`.
- 5 — no findings at all besides advisory ones.
- 4 — only low findings (touch targets 24–44px, heading skips, missing h1).
- 3 — medium findings in one context or state only. Gate fails.
- 2 — medium findings across contexts, or any high finding. Gate fails.
- 1 — several high findings (unnamed controls, invisible focus, contrast < 3:1). Gate fails.

### 2 · Layout integrity — D+J
Cards: layout.intrinsic-responsive · layout.grid-alignment · typography.measure · states.loading-perceived
Measured caps: `overflow-x` at any viewport → max 2 · `clipped-text` → max 3 · CLS > 0.1 → max 3 (> 0.25 → max 2) · `small-input-font` → max 3.
- 5 — nothing overflows, clips or shifts; 1440px uses its width on purpose (no stretched lines, no lonely narrow column).
- 4 — sound at both widths; a minor awkward wrap or gap.
- 3 — one clipped label, a visible shift, or a cramped breakpoint.
- 2 — horizontal scroll or overlapping elements in one context.
- 1 — broken at a primary viewport.

### 3 · Design-system adherence — D
Cards: layout.spacing-scale · color.role-scale · typography.type-scale · typography.limited-families-weights · usability.consistency-standards
Measured: `metrics.tokenCoverage.ratio` (needs tokens passed to the probe), static rules `hardcoded-color` / `off-scale-spacing`, `metrics.type` (distinct sizes, weights, families).
- 5 — coverage ≥ 0.95; ≤ 6 sizes, ≤ 3 weights, ≤ 2 families; no hard-coded colours.
- 4 — coverage ≥ 0.90, or one type limit exceeded by one.
- 3 — coverage ≥ 0.80, or scattered hard-coded values.
- 2 — coverage ≥ 0.60; tokens exist but are bypassed often.
- 1 — tokens absent or mostly ignored.

### 4 · Visual hierarchy — J
Cards: layout.hierarchy-by-weight · flows-forms.primary-action-clarity · layout.tension-consistency-emphasis · data.dashboard-summary-first · writing.front-load · ia-nav.wayfinding-location · ia-nav.visible-destinations · usability.self-evident
- 5 — one focal point per view; the primary action is found in under 2 seconds; secondary content recedes; you always know where you are.
- 4 — clear order; one element competes slightly.
- 3 — two or more things shout; primary action findable only on reading.
- 2 — flat: everything at the same weight, or the loudest element is not the most important.
- 1 — no discernible order; the user cannot tell what to do.

### 5 · Spacing and grouping — J
Cards: layout.proximity-grouping · layout.spacing-scale · layout.grid-alignment · data.tension-density-clarity
- 5 — space inside groups is visibly smaller than between groups; edges align; rhythm is even; density matches the brief.
- 4 — grouping reads correctly; one uneven gap or misaligned edge.
- 3 — some groups ambiguous (a label nearer the wrong field); ragged edges.
- 2 — uniform spacing everywhere, so nothing groups; or cramped to the point of misreading.
- 1 — layout reads as a pile.

### 6 · Typography — D+J
Cards: typography.type-scale · typography.measure · typography.line-height · typography.limited-families-weights · typography.tabular-numbers
Measured caps (`metrics.type`): body size < 14px → max 3 · paragraph measure > 90ch or line-height < 1.3 → max 3 · > 8 sizes or > 4 weights → max 3.
- 5 — clear, deliberate scale; body comfortable to read; 45–80ch; numbers in data are tabular; type voice fits the brief.
- 4 — sound; one weak step or one long measure.
- 3 — too many near-identical sizes, or cramped/loose leading.
- 2 — hierarchy relies on colour or caps because the scale fails.
- 1 — hard to read.

### 7 · Colour and theming — D+J
Cards: color.role-scale · color.contrast-by-construction · color.accent-restraint · color.dark-mode-not-inverted · color.color-not-sole-signal · data.status-encoding
Measured caps: any contrast failure in one theme only → max 3 · hard-coded colours in static findings → max 4.
- 5 — colour has roles; accent marks what matters and little else; dark mode is designed (raised surfaces lighter, saturation adjusted), not inverted; status never relies on hue alone.
- 4 — sound; accent slightly overused or one theme a bit flat.
- 3 — decorative colour competes with meaning; dark mode is a naive inversion.
- 2 — accents everywhere, or a theme is broken in places.
- 1 — colour obstructs reading.

### 8 · States and feedback — J
Cards: states.empty-state-teaches · states.loading-perceived · states.error-recovery · states.partial-and-permission · states.optimistic-feedback · usability.system-status · usability.user-control-undo · usability.error-prevention · flows-forms.inline-validation-timing · writing.error-messages
Uses the forced-state screenshots (`<flow>.<state>-…png`) against the blueprint state matrix.
- 5 — every matrix cell rendered as designed; empty states teach the next step; errors say what happened and how to recover, keeping input; destructive actions confirm or undo; hover/active/disabled exist.
- 4 — all states present; one is plain but usable.
- 3 — a state falls back to a blank area, raw error text or an endless spinner.
- 2 — several states missing or broken.
- 1 — only the happy path exists.

### 9 · Motion quality — D+J
Cards: motion.purpose-only · motion.frequency-budget · motion.duration-by-distance · motion.easing-roles · motion.compositor-only · motion.spatial-continuity · motion.reduced-motion · motion.one-signature-moment · motion.tension-delight-speed
Input: `animations[]` per context plus static findings. Measured caps: `anim-non-compositor` high → max 2 · durations > 500ms on routine UI → max 3 · `anim-infinite-near-text` → max 3 · `ease-in-entrance` / `scale-from-zero` → max 3.
- 5 — every animation explains a change; durations and easings come from tokens and roles; spatial model is consistent (drill in forward, back reverses); one signature moment; frequent actions are nearly instant.
- 4 — sound; one animation is decorative or slightly long.
- 3 — motion on everything, or inconsistent directions.
- 2 — motion delays the user or breaks under reduced motion.
- 1 — janky, disorienting or blocking.

### 10 · Craft and brand fit — J
Cards: personality.* (the one(s) the brief chose) · motion.one-signature-moment · writing.user-language · writing.action-labels · layout.tension-consistency-emphasis
Also run the thoughtlessness test in `ai-default-fingerprints.md`.
- 5 — matches the chosen direction and brief personality; radii, shadows and icon style are consistent; copy is in the user's words; one specific detail shows it was made for this product; no unjustified fingerprints.
- 4 — fits; one inconsistency or one unjustified fingerprint of low weight.
- 3 — competent but interchangeable with any product; 2+ unjustified fingerprints.
- 2 — generic template look; placeholder copy or fake data.
- 1 — contradicts the brief.

## Finding format

One JSON object per finding. No finding without an element and a fix.
```json
{"id":"r1-04", "dimension":4, "source":"judged|measured", "severity":"high|medium|low",
 "screen":"home", "context":"375-light", "element":"button.cta-primary | 'hero, right column'",
 "card":"layout.hierarchy-by-weight", "evidence":"what is seen or measured, with values",
 "fix":"smallest concrete change (file/selector + property + value)", "screenshot":".design/reports/shots/<run>/…png"}
```
Severity: **high** blocks the task, fails the gate, or misleads. **medium** slows or confuses. **low** is polish.
Rank by: gate first → lowest-scoring dimension → severity → number of contexts affected.

## History (regression guard)

Every scored round appends to `.design/reports/history.json` (format in `modules/verify.md`). A region + dimension that passed (≥ 4) in an earlier round must not drop in a later one. If it does, the round is treated as worse: revert or fix before continuing.
