# Decision log — Docket

## D0 — Interview answered autonomously
- **Step:** interview
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Who answers the interview and approves brief/blueprint.
- **Chosen:** self-approved (autonomous); every answer marked brief / inferred / default in brief.md. Finish "raw-industrial" picked from the brief because the references option needs a person.
- **Why:** SKILL.md "Autonomous runs". [personality.raw-industrial] (brief: interview.personality.references)
- **Revisit if:** a person names references.

## D1 — Navigation model
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Options considered:** 1. Left rail of views + ⌘K — views always visible, palette for experts. 2. Top tabs (Triage/Mine/All) — compact, no room for saved views. 3. Palette only — minimal, hides destinations from newcomers.
- **Chosen:** 1
- **Why:** desktop-first, many times a day, ~7 views; experts on the keyboard want a search-first path too. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.search-vs-browse] (brief: context.device, context.frequency, jobs.top-tasks)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → views visible, commands discoverable through palette and kbd hints.
- **Revisit if:** the team grows past ~15 saved views.

## D2 — List grouped by status with a side panel
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Options considered:** 1. Rows grouped by status + right panel — mirrors "what's in progress / next". 2. Kanban board — spatial but low density, poor for keyboard. 3. Flat table with columns — mirrors the data model, not the mental model.
- **Chosen:** 1
- **Why:** brief names the list + side panel; status groups mirror how engineers talk; rows give density. [data.dense-tables, personality.dense-expert, usability.recognition-over-recall] (brief: content.type, purpose.expertise)
- **Revisit if:** the team starts planning sprints visually.

## D3 — Keyboard model
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Chosen:** single-key shortcuts (J/K/S/P/A/L/X/C/Z, 1–4) + ⌘K + G-chords, all shown in <kbd> next to their action and listed under ?; single-key shortcuts are skipped while typing in inputs and can be turned off in the shortcuts sheet.
- **Why:** "live on the keyboard"; WCAG 2.1.4 requires single-char shortcuts be off-able. [usability.keyboard-shortcuts, a11y.keyboard-complete] (brief)
- **Revisit if:** screen-reader users join the team (then default the single keys off).

## D4 — Undo over confirm
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Options considered:** 1. Optimistic + undo toast 8 s + Z. 2. Confirm dialogs on close/reassign. 
- **Chosen:** 1
- **Why:** every action is reversible; confirmations would tax a one-key workflow 50× a day; the trust risk is "unclear what happened", which the toast answers. [usability.user-control-undo, states.optimistic-feedback, usability.system-status] (brief: risks.failure, risks.trust)
- **Revisit if:** delete-forever is added.

## D5 — URL as state
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Chosen:** view, filters, selected issue in the query string (history.replaceState on keyboard moves, pushState on view change).
- **Why:** engineers paste issue links in chat. [ia-nav.url-as-state]
- **Revisit if:** n/a

## D6 — Phone adaptation
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Chosen:** view switcher at top, list full width, panel as full-screen sheet with Back; same keys irrelevant on phone, so status/priority/assignee are tappable fields (44px).
- **Why:** desktop primary, phone must still work. [layout.intrinsic-responsive, a11y.target-size] (brief: context.device)

## D7 — Expressive moments
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Chosen:** (1) Triage cleared (rare, once a day, emotionally the end of a chore); (2) first-paint count-up of the Triage count. Everything else 0–150ms.
- **Why:** daily keyboard tool → speed wins on routine paths; the daily "done" is the one moment people feel. [motion.one-signature-moment, motion.frequency-budget, motion.tension-delight-speed] (brief: context.frequency)
- **Tension resolved:** motion.tension-delight-speed → speed everywhere except triage cleared.

## D8 Direction: C — Triage Tag
- **Step:** directions · **Date:** 2026-11-16 · **Status:** active
- Chosen: C, chosen by agent: the only direction whose palette, motif and signature come from the brief's own verb ("triage"): a manila work surface, priority as a triage-colour tag strip, a rubber-stamp disposition. Unlike a generic issue tracker (violet accent, near-black, soft cards) and unlike the ink-on-paper house style (canvas chroma 0.032, motif owns the row's left edge). No brief line demands restraint, so A (quiet) did not win; B's full-height orange rail is louder than an all-day tool earns (personality.calm, brief: context.frequency).
- Rejected: A Drafting Film — correct but closest to the sterile default; B Safety Orange — colour volume fights a screen on all day.
- Built: only C (no subagents in this run). A and B exist as specs only; compare.html not assembled because two of its three frames would be empty. C was built straight into the final `index.html` instead of a separate `.design/directions/c.html` prototype; the fidelity check compares index.html with c.spec.md.
- Axes: density=3 contrast=1 type=3 layout=2 material=2 motion=3 (budget-fitted)
- Palette/type/motion carried to system: manila/carbon-ink/stamp-red + triage tag colours; Archivo two widths + JetBrains Mono; 0ms keyboard, ≤150ms routine, one 400–600ms stamp.
- Cards: data.tension-density-clarity → density; motion.tension-delight-speed → speed except the stamp; craft.identity-motif; craft.ink-and-accent.
- Files: .design/directions/c.spec.md (a.spec.md, b.spec.md kept for the record)

## D9 — Expressive moments revised
- **Step:** system · **Date:** 2026-11-16 · **Status:** active (supersedes the second moment of D7)
- **Decision:** keep only "Triage cleared"; drop the first-paint count-up of the Triage count.
- **Why:** recipes/motion/number-change says not to count up from zero on first render ("don't count up from zero to look busy"); one moment the team actually earns daily is enough. [motion.one-signature-moment, motion.purpose-only]
- D7 status: superseded by D9 for moment (2).

## D10 — Tokens and type
- **Step:** system · **Date:** 2026-11-16 · **Status:** active
- **Decision:** palette from spec C (mark L raised 0.52 → 0.50 and P2 green 0.58 → 0.62 after contrast checks: mark on rail was 4.48:1, P2 text on tag 4.4:1). Archivo at two widths + JetBrains Mono; 13px body for dense expert use; radius 2/3/4.
- **Why:** [a11y.contrast-minimums, typography.limited-families-weights, personality.dense-expert, craft.concentric-radii] (brief: purpose.expertise, personality.dense-airy)

## D11 — Build notes
- **Step:** build · **Date:** 2026-11-16 · **Status:** active
- **Motif placements (craft.identity-motif, 5):** row priority tag (every row), rail Triage count tag, panel header tag + Priority field, priority menu/filter options and palette issue rows, empty states (first-use and Triage cleared, tag on its string). Partner stamp: CLEARED (expressive moment) and DONE / DUPLICATE / WON'T FIX in the panel header.
- **Preview-state control:** states are reachable from the rail footer "Preview state" menu, the palette ("Preview: …") and `?state=` (loading, error, issue-error, offline, guest, empty, fail). A gallery affordance, labelled as such; a shipped app would drop it.
- **Toasts grouped per issue:** r1 showed three toasts per triaged issue; consecutive changes to one issue now read as one sentence ("ING-231 set to P1, assigned to Jun Okada") and its Undo reverts all of them; Z undoes one step. [usability.system-status, usability.user-control-undo]
- **Type tightened after r5:** sizes 12/13/14/16/24/40, weights 400/600/800 (rubric dim 3); avatar initials condensed 400 so they stop competing with titles.
- **Kept low findings (G5):** `off-token-spacing` on `.rail-foot` (margin-block-start: auto pins the footer), `#new-dialog` / `#keys-dialog` (UA auto margins centring a modal `<dialog>`): computed layout, not authored spacing. `anim-color` on chips and the palette trigger: 100ms background crossfade on hover, allowed by motion.compositor-only for small state changes.
- **Fingerprints kept:** `mono-as-costume` checked: mono only on issue keys, times, kbd and code spans (data engineers read in mono) — Fingerprint mono-as-costume not matched. `left-stripe-cards` checked: the 3px bars mark the selected row and current view (state), not decoration. No glass, glow, gradient text, orbs.
