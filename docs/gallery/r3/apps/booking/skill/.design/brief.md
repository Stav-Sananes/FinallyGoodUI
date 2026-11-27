# Design brief — Brindle booking

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full (greenfield, no brand)
scope: whole app; key screen = choose a time slot for the chosen service

## Purpose
- **One-liner:** Dog owners book a grooming appointment at Brindle (two groomers) from their phone: pick dog, service, groomer, time. — [interview.purpose.one-liner] · brief
- **Primary user:** dog owners, existing Brindle clients with one or two dogs on file — [interview.purpose.audience] · brief ("Dog owners book on their phone")
- **Their words for the main thing:** "appointment", "drop-off", "pick-up", "groom", "nails", the dog's name. Not "slot", "resource", "service item".
- **Expertise:** mixed — first booking is new, then regulars every 4–8 weeks — [interview.purpose.expertise] · default
- **Success looks like:** owners finish a booking quickly without phoning the salon — [interview.purpose.success] · default (recommended for tools/utilities)

## Context
- **Device:** phone mainly; desktop must still work — [interview.context.device] · brief ("on their phone")
- **Frequency:** every 4–8 weeks per dog (≈ a few times a year to monthly); most-opened screen: choose a time — [interview.context.frequency] · inferred (grooming cadence for the brief's services); decided by motion.frequency-budget: rare use, room for expressive moments
- **Environment:** on the move, one hand, often with a dog in the other — [interview.context.environment] · default (recommended for phone-first consumer)
- **Session:** a focused task of a few minutes, often interrupted — [interview.context.session] · decided by agent (no option recommended; flows-forms.protect-unsaved-work + usability.system-status)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Book an appointment (dog → service → groomer → time → confirm) | Appointment, Dog, Service, Groomer | every 4–8 weeks | [interview.jobs.top-tasks] brief |
| 2 | See / reschedule / cancel an upcoming appointment | Appointment | once per booking | inferred (booking domain) |
| 3 | Keep dog details current (size, coat, notes for the groomer) | Dog | rare | inferred |

- **First run:** empty state + first action ("Add your dog") — [interview.jobs.first-run] · default

## Content
- **Mostly:** forms and choices (time slots, services) — [interview.content.type] · inferred
- **Volume:** dozens (a few dogs, a few appointments a year) — [interview.content.volume] · default

## Personality
- **Calm ↔ energetic:** balanced (calm by default, lift on key moments) — default: rare consumer use, so "calm when used often" does not apply
- **Serious ↔ playful:** friendly — warm but professional; it's a small business handling people's dogs — default
- **Dense ↔ airy:** airy — default (recommended for rare use)
- **References:** none available (autonomous). Finish chosen instead: **quiet-crafted**, warm — a two-person neighbourhood salon, not a chain. Anti-reference: generic SaaS booking widget (grey calendar grid + blue pill buttons). — [interview.personality.references] · decided by agent
- **In three words:** warm, unhurried, exact
- **Motion axis:** balanced (rare use, one-hand phone)

## Constraints
- **Brand:** none — create from this brief — [interview.constraints.brand] · brief (no brand given)
- **Accessibility:** WCAG 2.2 AA — default
- **Locales:** English only, i18n-ready — default
- **Stack & dependencies:** greenfield, single self-contained index.html (inline CSS/JS; web fonts + icon CDN allowed); no installs — [interview.constraints.platform-stack] · brief/autonomous

## Risks
- **Worst accidental action:** booking the wrong time/day or the wrong dog, or losing a slot someone else grabs meanwhile → review sheet before confirm + free cancel/reschedule afterwards — [interview.risks.failure] · inferred
- **Trust breakers:** unclear outcome (did it book?) and stale availability (slot gone at confirm) — [interview.risks.trust] · inferred

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | delight, budgeted | booking is rare (every 4–8 weeks) | routine taps ≤150 ms; up to 3 expressive moments (slot select, booked) |
| usability.tension-guidance-expertise | guidance | mixed, rare use | visible labels, one step per screen, defaults remembered from last visit |
| craft.tension-restraint-liveliness | liveliness with one motif | small, personal salon | one warm accent + grooming-comb motif |

## Decided by agent
- interview.context.frequency — every 4–8 weeks — inferred from grooming cadence [motion.frequency-budget]
- interview.context.session — focused few minutes, interruptible [flows-forms.protect-unsaved-work]
- interview.personality.references — finish "quiet-crafted" (recommended option needs a person) [personality.calm, craft.tension-restraint-liveliness]
- Groomer names, prices, hours, durations: realistic sample data (Brindle hours Tue–Sat 8:00–17:00; groomers Maya and Theo)

## Open questions
- Deposit/payment at booking: assumed pay at the salon (no payment step).
