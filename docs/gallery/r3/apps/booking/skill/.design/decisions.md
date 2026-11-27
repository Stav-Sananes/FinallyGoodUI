# Decision log — Brindle booking

## D0 — Brief and blueprint approval
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** approve brief and blueprint
- **Chosen:** self-approved (autonomous)
- **Why:** autonomous run per SKILL.md; every self-answered item is marked in brief.md "Decided by agent".

## D1 — Navigation model
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how owners move through the app
- **Options considered:** 1. single hub + linear booking flow — one obvious path / secondary items one tap deeper; 2. bottom tabs (Home, Appointments, Dogs) — visible / 3 tabs for an app opened every 6 weeks is chrome; 3. one long booking page — fewer screens / overwhelming on a phone
- **Chosen:** 1
- **Why:** booking dominates; phone-first, rare use favours one-thing-per-page with visible progress. [ia-nav.nav-model-by-count, flows-forms.one-thing-per-page, usability.system-status] (brief: interview.jobs.top-tasks, interview.context.device, interview.context.frequency)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → minimalism; Dogs/Appointments reachable from the hub.
- **Revisit if:** owners book several dogs weekly (daycare).

## D2 — Time presentation on the key screen
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how to show available times
- **Options considered:** 1. grid of start times (calendar widget) — compact / hides when the dog is ready, data-model view; 2. rows grouped Morning/Midday/Afternoon, each with drop-off and ready-by, groomer names, "any groomer" default — mirrors the owner's day; 3. timeline per groomer — exact / makes owner think like a scheduler
- **Chosen:** 2
- **Why:** owners plan around drop-off and pick-up, and most don't mind who grooms. [usability.recognition-over-recall, writing.user-language, flows-forms.sensible-defaults] (brief: mental model, interview.purpose.audience)
- **Revisit if:** owners strongly prefer one groomer (then default the filter to last groomer).

## D3 — Undo vs confirm for booking/cancel
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** friction around committing
- **Options considered:** 1. review step + free cancel — clear commitment, reversible; 2. one-tap book with undo toast — fast / salon may have already confirmed; 3. confirm dialog — redundant with review
- **Chosen:** 1
- **Why:** booking commits the salon's time; a check-your-answers step prevents wrong dog/day, while cancellation stays free up to 24 h. [usability.error-prevention, flows-forms.one-thing-per-page, usability.user-control-undo] (brief: interview.risks.failure)
- **Revisit if:** deposits are added.

## D4 — Expressive moments
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** where the expressive motion budget goes
- **Options considered:** 1. time selection + booked confirmation; 2. booked only — safest / the key screen stays mute; 3. every step transition — too many
- **Chosen:** 1
- **Why:** booking is rare (every 4–8 weeks) so delight is affordable; the moment the owner sees their day settle (drop-off → ready) is the emotional core; booked is the completion. [motion.one-signature-moment, motion.tension-delight-speed] (brief: interview.context.frequency)
- **Revisit if:** usage becomes weekly.

## D5 Direction: C — Brindle Coat
- **Step:** directions · **Date:** 2026-11-16 · **Status:** active
- Chosen: C, chosen by agent (autonomous, no subagents: only C built). Rejected: A Appointment Card — well-made but a list-in-a-column that any booking app could wear; B Grooming Table — bold, but its orange rail and display type borrow energy the brief never asked for ("small dog-grooming salon with two groomers").
- Why C: it is the only one whose palette, motif and focal figure come from the subject. The salon's name is a coat pattern, so fawn + chocolate stripes; the grooming comb becomes the day ruler; and the big figure is "drop off 9:30 → ready ~11:45", the owner's mental model (blueprint), not a grid of start times. Unlike a generic booking widget (grey calendar + blue pills) and unlike the ink-on-paper house style (its canvas is a tinted fawn, chroma 0.045). No brief line demands restraint, so A did not win.
- Axes: density=2 contrast=3 type=1 layout=3 material=2 motion=3
- Carried to system: fawn/chocolate/teal palette (light + dark re-derived), Archivo widths 100/125, durations 100–500, comb draw signature.
- Cards: craft.identity-motif, craft.tension-restraint-liveliness, motion.one-signature-moment, layout.hierarchy-by-weight
- Files: .design/directions/c.spec.md, c.html (a.spec.md, b.spec.md written, not built)

## D6 — System tokens
- **Step:** system · **Date:** 2026-11-16 · **Status:** active
- **Decision:** lock palette, type, shape, motion from direction C
- **Chosen:** palette inputs base hue 72 (fawn), ink hue 45 (chocolate), mark hue 205 (bandana teal), stark contrast; Archivo single family (wdth 100/125); 16px body; radius 8/14/24; durations 50–500 ms with hero 500 for the two signature moments; easing defaults.
- **Why:** personality balanced/friendly/airy with rare use → expressive moments allowed, routine short. [color.contrast-by-construction, color.dark-mode-not-inverted, typography.limited-families-weights, craft.concentric-radii, motion.frequency-budget, motion.one-signature-moment] (brief: interview.personality.*, interview.context.frequency)
- **Tension resolved:** craft.tension-restraint-liveliness → liveliness via canvas tint + motif; accent kept to the chosen appointment (color.accent-restraint).
- **Revisit if:** the salon supplies a brand.

## D7 — Build notes: motif placements, kept findings, deviations
- **Step:** build/verify · **Date:** 2026-11-16 · **Status:** active
- **Motif (grooming comb), 5 placements** [craft.identity-motif]: (1) the day comb in the stage, one tooth per quarter hour, booked teeth faded; (2) step progress in the top bar (4 teeth, current one teal); (3) loading skeleton rows (comb teeth instead of grey bars); (4) full-day empty state (a comb with every tooth taken); (5) booked stub (teal teeth fill left to right).
- **Expressive moments used (2 of max 3)** [motion.one-signature-moment]: `.comb-signature` (first time pick per task: teal visit span grows from the drop-off tooth, 500 ms enter-emphasized); `.booked-signature` (stub teeth stagger 40 ms, ring + tick, "Booked" rises; all inside 500 ms).
- **Kept low findings (G5):**
  - probe `anim-long-duration #combSpan` 500 ms > 400 ms — kept: it is expressive moment 1 (class comb-signature), once per task, under the 600 ms ceiling. [motion.frequency-budget]
  - probe `anim-color` on segmented control text and slot/secondary button backgrounds (100–150 ms) — kept: colour crossfades for small state changes are allowed by motion.compositor-only.
  - probe `off-token-spacing #sheet 193px` — kept: it is `margin-block-start: auto` that pins the native dialog to the bottom on phones, not a spacing value.
- **Fixed during verify:** selected full day number contrast 1.61:1 → primary-foreground; slot border-color transition removed (compositor-only); tick switched from stroke-dashoffset draw to transform/opacity; sheet height held while review → booked swaps (CLS 0.239 → 0); seg buttons and skip link to 44 px; UA button padding removed; colliding comb pins merged into one range label; week counts refresh after a conflict; conflict suggests the nearest earlier and later time.
- **Deviations from the blueprint:** "Back" opens the service choice as a sheet (steps 1, 2 and 4 are sheets in this single-file build, not separate screens). Week-strip counts come from local data and stay visible while a day's times load or fail.
- **Fingerprints:** none unjustified. Tinted fawn canvas (chroma 0.045) so not ink-on-paper; Archivo justified in D5/brand.md; no glass, glow, gradient text, emoji or invented stats. Phone number 0161 496 0732 and mobile 07700 900 418 are Ofcom drama-reserved sample numbers.
