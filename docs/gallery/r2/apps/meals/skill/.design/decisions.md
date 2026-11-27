# Decision log — Supper

Self-answered interview (autonomous run): see brief.md "Decided by agent" and every `default` / `inferred` tag.
- Brief: self-approved (autonomous), 2026-11-16.
- Blueprint: self-approved (autonomous), 2026-11-16.

## D1 — Primary navigation model
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how people move between This week, Recipes and the List.
- **Options considered:** 1. bottom tabs + desktop rail: always visible / costs 64px at the bottom. 2. single hub with links: minimal / the list mid-shop is 2 taps away. 3. hamburger: hides the list.
- **Chosen:** 1
- **Why:** 3 destinations, phone-first; the list must be one tap away in the aisle. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, a11y.target-size] (brief: interview.context.device, interview.jobs.top-tasks)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → discoverability; only 3 labels.
- **Revisit if:** recipes become the main job.

## D2 — Home and its focal point
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** what owns the home screen.
- **Options considered:** 1. This week with Tonight as the largest block. 2. A dashboard (stats, suggestions). 3. Recipes grid.
- **Chosen:** 1
- **Why:** the mental model is "seven evenings"; on weekdays the question is "what's tonight?". [flows-forms.primary-action-clarity, layout.hierarchy-by-weight, data.dashboard-summary-first] (brief: interview.jobs.top-tasks)
- **Tension resolved:** none.
- **Revisit if:** households plan lunches too.

## D3 — Evenings as ruled rows
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** layout of the seven evenings.
- **Options considered:** 1. ruled rows like a written menu: scannable top-to-bottom, works at 375. 2. 7-column calendar: wide-only, names truncate. 3. card grid with photos: the generic recipe-app look (anti-reference).
- **Chosen:** 1
- **Why:** reads like the week reads (Mon→Sun), long dish names wrap, mirrors the user's model not a calendar grid. [craft.hairlines-before-boxes, layout.intrinsic-responsive, personality.editorial] (brief: interview.personality.references)
- **Tension resolved:** none.
- **Revisit if:** multiple meals per day.

## D4 — Undo over confirm
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** protection for clearing an evening or clearing ticked items.
- **Options considered:** 1. undo toast 8s. 2. confirm dialog.
- **Chosen:** 1
- **Why:** reversible, frequent, low stakes. [usability.user-control-undo, states.optimistic-feedback] (brief: interview.risks.failure)
- **Tension resolved:** none.
- **Revisit if:** sync makes undo impossible.

## D5 — List order = store aisle order, derived from the plan
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how the shopping list is organised.
- **Options considered:** 1. aisles in the household's store order, quantities merged across dinners. 2. by recipe. 3. alphabetical.
- **Chosen:** 1
- **Why:** brief says "one list grouped by supermarket aisle"; one walk through the shop. Each item shows which dinners need it so nothing is missing. [writing.user-language, usability.recognition-over-recall] (brief: interview.risks.trust)
- **Tension resolved:** none.
- **Revisit if:** households shop at several stores.

## D6 — Signature moment
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** the one expressive moment.
- **Options considered:** 1. week set (7 of 7 planned). 2. list finished. 3. none.
- **Chosen:** 1
- **Why:** rare (weekly), emotionally the end of the Sunday chore. [motion.one-signature-moment, motion.tension-delight-speed] (brief: interview.context.frequency)
- **Tension resolved:** motion.tension-delight-speed → delight once a week only.
- **Revisit if:** planning becomes daily.

## D7 Direction: A "Menu Board"
- **Step:** directions · **Date:** 2026-11-16 · **Status:** active
- Chosen: A, **chosen by agent** (autonomous, no subagents: only the picked direction was built, and it was built directly as the key-screen `index.html`). Reason: A is the only composition that serves both the weekly Sunday planning (all 7 evenings readable top to bottom at 375) and the evening glance (tonight first); it carries the brief's editorial finish. Rejected: B "Pass Rail": dense rail+work suits desktop Sunday planning but collapses awkwardly on phone, which is primary. C "Kitchen Counter": stage serves weekday glances but pushes the week (the key task) below the fold.
- Axes: density=balanced contrast=soft type=serif text layout=column material=flat-hairline motion=productive
- Palette/type/motion carried to system: near-neutral paper hue 85, ink primary, aubergine accent 345; Newsreader + Hanken Grotesk; productive durations 100–300, hero 500 for the signature only.
- Cards: personality.calm, personality.editorial, craft.ink-and-accent, craft.identity-motif, motion.one-signature-moment
- Files: .design/directions/a.spec.md (built as ../index.html)
- Fingerprint cream-serif-terracotta revised — brief: "editorial: cookbook print discipline" — card: personality.editorial — rejected alternative: tomato/terracotta accent on cream because it is the default "tasteful" costume; took near-neutral paper (chroma 0.004) + aubergine ink.

## D8 — System tokens
- **Step:** system · **Date:** 2026-11-16 · **Status:** active
- **Decision:** palette inputs, type pairing, scale, radius, motion position.
- **Chosen:** base hue 85 chroma 0.004 (paper), ink primary, `mark` aubergine oklch(0.45 0.13 345) / dark oklch(0.78 0.10 345); all text pairs checked with lib/contrast.mjs (fg 16.6:1, muted 6.3:1 on canvas and 5.8:1 on muted, mark 7.7:1; dark fg 15.2:1, muted 6.0:1 on accent, mark 8.9:1). Type scale 12/14/16/18/22/28/40. Radius 4/8/12/16/pill. Motion productive: micro 100, short 150, standard 250, medium 300; hero 500 only for the signature.
- **Why:** [craft.ink-and-accent, color.contrast-by-construction, color.dark-mode-not-inverted, typography.type-scale, personality.calm, motion.frequency-budget] (brief: interview.personality.*, interview.context.frequency)
- **Tension resolved:** craft.tension-restraint-liveliness → one mark colour + dotted-leader motif.
- **Revisit if:** a brand arrives.
- Note: `emit-tokens --format dtcg` turned a dark shadow value of `none` into `0 0 0 0 none` (invalid CSS); fixed by hand in tokens.dark.json (`transparent`).

## D9 — Build deviations and kept findings
- **Step:** build/verify · **Date:** 2026-11-16 · **Status:** active
- Pick sheet ≥640px is a centred dialog (bottom-sheet recipe's "When NOT to use"), not a popover from the row as the blueprint first said. Blueprint §7 superseded on this point. [motion.spatial-continuity]
- Household destination is not shown (out of scope for this build; craft.nothing-dead says out of scope = not shown).
- Phone evening rows (<560px) drop the dotted leader + time for planned dinners and show the time in the meta line: long dish names wrapped beside a leader read badly at 375. Empty rows keep the leader. [craft.identity-motif, layout.intrinsic-responsive]
- States are reachable through a labelled "Preview another state" select under the week (and `?state=loading|error|offline`); the empty state is real: next week. [states.empty-state-teaches]
- Motif placements (craft.identity-motif): evening rows (dish ··· cook time, desktop; empty rows everywhere), week progress (seven dots), recipe ingredients (ingredient ··· quantity), shopping-list items (item ··· quantity), margin note (aisle ··· count, ≥1280px).
- Kept probe findings (justified):
  - anim-non-compositor `display` on #pick-sheet: the bottom-sheet recipe's `display … allow-discrete` lets the native dialog animate out. [motion.compositor-only]
  - anim-non-compositor `stroke-dashoffset` on the signature stroke and the list tick: success-moment and control-states recipes; paint-only, ≤500ms / 150ms. [motion.one-signature-moment]
  - anim-long-duration 500ms on `signature-draw`: the one signature moment (hero token). [motion.frequency-budget]
  - anim-color on buttons/rows/check box: short colour crossfades, allowed. [motion.compositor-only]
  - off-token-spacing 537px (`.rail-foot` margin-block-start:auto) and 90px (dialog margin:auto centring): computed auto margins, not authored spacing. [layout.spacing-scale]
- Fingerprint cream-serif-terracotta: see D7 (revised to near-neutral paper + aubergine). Serif display kept — brief: "editorial: cookbook print discipline" — card: personality.editorial — rejected alternative: a grotesk-only UI, because dish names are the content and a menu sets them in a book face.
- Fingerprint eyebrow (caps labels "Tonight · …", "Shopping list", pick groups): used once per region as real labels, not above every section; check-static eyebrow-overuse not triggered.
