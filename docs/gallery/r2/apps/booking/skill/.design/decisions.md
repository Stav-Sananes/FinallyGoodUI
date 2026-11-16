# Decision log — Brindle

## D0 — Brief and blueprint approval
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Approve brief and blueprint.
- **Chosen:** self-approved (autonomous)
- **Why:** Autonomous run; every self-answered item is marked in brief.md.

## D1 — Navigation model
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** How owners move around the app.
- **Options considered:**
  1. Single hub + linear booking flow: one obvious action, no nav to learn / other tasks one tap deeper
  2. Bottom tabs (Home, Book, Dogs, Account): visible destinations / four tabs for an app opened a few times a year
- **Chosen:** 1
- **Why:** One dominant task (book), rare use, phone. [ia-nav.nav-model-by-count, flows-forms.primary-action-clarity] (brief: interview.jobs.top-tasks, interview.context.frequency)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → minimalism; secondary items are rare.
- **Revisit if:** owners start using it weekly (e.g. daycare check-ins added).

## D2 — Booking as five short steps
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** One long form or one-thing-per-page.
- **Options considered:**
  1. Five steps with "Step n of 5" and a tappable summary line: one decision per screen on a phone / more taps
  2. One scrolling form: fewer screens / long, one-handed scrolling with four pickers
- **Chosen:** 1
- **Why:** On the move, one hand, rare use: one question per screen with progress and a review step. [flows-forms.one-thing-per-page, ia-nav.wayfinding-location] (brief: interview.context.environment)
- **Tension resolved:** usability.tension-guidance-expertise → guidance, with "Book again" pre-filling for regulars.
- **Revisit if:** most bookings become "book again".

## D3 — Time step mirrors drop-off / pick-up, groomer as a filter
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** How times are presented on the key screen.
- **Options considered:**
  1. List of drop-off times, each with its pick-up time, grouped Morning/Afternoon; groomer switchable (Either / Sam / Priya) on the same screen
  2. Grid of start-time chips per groomer column: compact / mirrors the salon's diary, not the owner's question
- **Chosen:** 1
- **Why:** Owners plan around when they drop the dog off and get it back; the service length makes pick-up the real constraint. Keeping the groomer switch on-screen avoids a dead end when one groomer is full. [writing.user-language, usability.recognition-over-recall] (brief: mental model, interview.jobs.top-tasks)
- **Tension resolved:** data.tension-density-clarity → clarity (rows, not chips).
- **Revisit if:** services become under 30 minutes (chips would suffice).

## D4 — Date strip, not a month calendar
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** superseded by D9
- **Decision:** How the day is chosen.
- **Options considered:**
  1. Horizontal 14-day strip with "n free" per day, closed days marked
  2. Month calendar: overview / small targets at 375px, most days irrelevant
- **Chosen:** 1
- **Why:** Grooming is booked 1–2 weeks out; a strip keeps 44px targets and shows availability per day before tapping. [a11y.target-size, usability.recognition-over-recall] (brief: interview.context.device)
- **Revisit if:** salon opens bookings months ahead.

## D5 — Review before commit, undo after
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Confirm vs undo for booking.
- **Options considered:**
  1. Review step + free cancellation/undo
  2. One-tap book from time screen: faster / wrong dog or day goes unnoticed
- **Chosen:** 1
- **Why:** Booking commits a groomer's time; a summary before commitment prevents the brief's worst slip. [usability.error-prevention, usability.user-control-undo] (brief: interview.risks.failure)
- **Revisit if:** a deposit is added (then review becomes mandatory payment review).

## D6 — Signature moment: "Booked"
- **Step:** blueprint
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Where the one expressive motion goes.
- **Chosen:** Booking confirmed: the comb-teeth ruler fills and the appointment settles.
- **Why:** Rare, emotional, end of the flow. [motion.one-signature-moment, motion.tension-delight-speed] (brief: interview.personality.calm-energetic)
- **Tension resolved:** motion.tension-delight-speed → delight here only.
- **Revisit if:** never; move only if the flow changes.

## D7 — Direction: C "Comb Teeth"
- **Step:** directions
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Which of three written directions to build.
- **Chosen:** C. chosen by agent: its stage composition makes the owner's own question (drop-off → pick-up on a day) the focal figure, the closest mirror of the brief's mental model (non-negotiable 10); A's single column puts the answer last; B's rail + board serves desktop comparison more than one-handed phone use. Only C was built (autonomous, no subagents). self-approved (autonomous).
- **Axes:** density=balanced · contrast=stark · type=expressive display + utility · layout=stage · material=flat-hairline · motion=balanced (rolls 2 3 3 3 1 2)
- **Palette/type/motion carried to system:** near-neutral canvas hue 80, ink actions, fawn mark hue 60–72; Bricolage Grotesque + Figtree; default durations, no springs.
- **Cards:** data.tension-density-clarity → clarity on stage; motion.tension-delight-speed → delight once; craft.tension-restraint-liveliness → one mark hue + comb motif.
- **Files:** .design/directions/c.spec.md, c.html

## D8 — System tokens
- **Step:** system
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Palette inputs, type, scale, radius, motion position.
- **Chosen:** base hue 80 chroma 0.003 (not cream), ink primary, custom roles `mark` (fill, darkened to L 0.64 so the comb span passes 3:1) and `mark-strong` (text 6:1); 16px body (consumer, phone); radius 2/8/12/20 concentric; no shadows; balanced motion defaults.
- **Why:** stark text for outdoor phone use [a11y.contrast-minimums, personality.serious-trustworthy]; fawn spent on meaning only [craft.ink-and-accent, color.accent-restraint]; flat-hairline from the spec [craft.material-restraint]. (brief: interview.context.environment, interview.personality.*)
- **Revisit if:** the salon supplies a brand colour.

## D9 — Two-week day grid instead of a scrolling strip
- **Step:** verify
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** How the 14 days sit on a 375px screen.
- **Options considered:**
  1. Horizontal scrolling strip (D4): compact / 9 of 14 days hidden off-screen, and the probe flagged their focus as off-canvas (r0–r3, 14 medium a11y.focus-visible findings at every 375 context)
  2. Two rows of seven, weekdays in fixed columns, free-time count under each date ("15", the word "free" dropped below 420px; full label stays in the accessible name)
- **Chosen:** 2
- **Why:** every bookable day visible at once beats remembering what is off-screen, and each weekday sits in the same column both weeks. [usability.recognition-over-recall, a11y.focus-visible, a11y.target-size] (brief: interview.context.device)
- **Tension resolved:** none.
- **Revisit if:** the booking window grows past two weeks.

## D10 — Motif placements and kept findings
- **Step:** build
- **Date:** 2026-11-16
- **Status:** active
- **Decision:** Where the comb-teeth motif repeats; which low findings stay.
- **Chosen:** Motif in 6 places: stage ruler (largest, with the fawn stay span), header step progress (5 teeth, current tooth fawn), mini comb on each time row (≥ 400px wide screens), loading skeleton (ghost teeth), empty/closed/full states (muted comb), booked signature (stay teeth fill). [craft.identity-motif]
- Kept low `anim-color` (4, flow walk): background-color crossfade on hover of ink buttons and choice rows, short (150ms) colour change on a small state, which motion.compositor-only allows; the probe itself labels it acceptable.
- Fingerprints checked: pill shapes only on the summary chips and groomer switch (small controls, craft.concentric-radii); caps labels used 5× as group labels for Day / Morning / Afternoon / Next groom, not as section eyebrows; no glass, glow, gradients, emoji, invented stats. Sample people (Maya, Sam, Priya) and dogs come from the brief's salon; no testimonials or ratings.
- Mini comb hidden below 400px so the row's pick-up time and groomer stay on two clean lines; the motif keeps 5 other placements on phones.
