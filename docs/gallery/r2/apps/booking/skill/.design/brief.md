# Design brief — Brindle (dog-grooming bookings)

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full
scope: whole app; key screen built: choose a time slot for the chosen service

Sources: `brief` = the parent agent's brief · `inferred (<source>)` · `default` = the question's recommended option, or the one whose stated condition fits this product.

## Purpose
- **One-liner:** Dog owners book a grooming visit at Brindle from their phone: pick the dog, the service, a groomer and a time. — [interview.purpose.one-liner] · brief
- **Primary user:** dog owners who are Brindle clients (one type). Secondary: the two groomers, who are not users of this app. — [interview.purpose.audience] · brief
- **Their words for the main thing:** "appointment", "groom", "bath", "nail trim", "drop-off", "pick-up"; dogs by name. Times as clock times ("9:30"), not "slots". — inferred (salon domain)
- **Expertise:** mixed: first booking is new, regulars rebook every 4–8 weeks — [interview.purpose.expertise] · default
- **Success looks like:** owners finish a booking quickly without calling the salon — [interview.purpose.success] · default (recommended for tools and utilities)

## Context
- **Device:** phone first; desktop must still work — [interview.context.device] · brief ("book on their phone")
- **Frequency:** a few times a year per dog (grooming every 4–8 weeks); most-opened screen: the time picker — [interview.context.frequency] · inferred (grooming cadence; option text names "booking")
- **Environment:** on the move, one hand (walking the dog, at work) — [interview.context.environment] · default (recommended for phone-first consumer apps)
- **Session:** focused task of a few minutes — [interview.context.session] · decided by agent (no option's condition fits better; a booking is a single short task) [flows-forms.one-thing-per-page]

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Book a grooming appointment (dog → service → groomer → time → confirm) | Appointment, Dog, Service, Groomer | every 4–8 weeks | [interview.jobs.top-tasks] · brief |
| 2 | See / reschedule / cancel an upcoming appointment | Appointment | a few times a year | inferred (booking domain) |
| 3 | Manage dogs (add a dog, coat/size notes) | Dog | rare | inferred (dog picker needs dogs) |

One dominant task (book). — [interview.jobs.top-tasks] · default ("there's one main thing")
- **First run:** empty state ("Add your first dog") then straight into booking — [interview.jobs.first-run] · default

## Content
- **Mostly:** forms and choices (times, services) — [interview.content.type] · inferred (brief)
- **Volume after a year (heavy user):** dozens of appointments, 1–3 dogs — [interview.content.volume] · default

## Personality
- **Calm ↔ energetic:** balanced: calm by default, a little lift on the moment the appointment is booked — [interview.personality.calm-energetic] · decided by agent: the recommended "calm" is conditioned on frequent use; this is rare use, which affords one expressive moment [motion.frequency-budget, motion.one-signature-moment]
- **Serious ↔ playful:** friendly: warm but still professional — [interview.personality.serious-playful] · decided by agent: the recommended "serious" is conditioned on money/health/data; a grooming salon is a consumer hobby-adjacent service [personality.playful (partial), writing.user-language]
- **Dense ↔ airy:** airy — [interview.personality.dense-airy] · default (recommended for beginners and rare use)
- **References:** the recommended option needs a person ("I'll name some"), so took the next: **pick a finish → quiet-crafted**, chosen from the brief: a small two-groomer salon is a craft trade (scissors, combs, a paper appointment book), and quiet-crafted steers away from the generic pet-app anti-reference (cartoon paws, candy colours, bouncing mascots). **Anti-reference:** generic pet-store app with paw-print confetti. — [interview.personality.references] · decided by agent (autonomous fallback)
- **In three words:** warm, unhurried, exact
- **Motion axis:** balanced (rare use; calm routine motion, one signature moment)

## Constraints
- **Brand:** none: create one from this brief (name "Brindle" only) — [interview.constraints.brand] · brief (greenfield, no assets)
- **Accessibility:** WCAG 2.2 AA — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready (Intl for dates/times) — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; deliverable is one self-contained `index.html` (inline CSS/JS; web fonts and icon CDN allowed). Policy: no installs. — [interview.constraints.platform-stack] · brief

## Risks
- **Worst accidental action:** booking the wrong time/dog/service, or a slot taken by someone else at the same moment → summary before confirm, then free cancel/undo; slot-taken conflict handled inline — [interview.risks.failure] · inferred (booking domain; nearest option "send, pay or publish something they didn't mean to")
- **Trust breakers:** unclear outcome (did it book?) and stale availability (time looked free but wasn't) — [interview.risks.trust] · inferred (booking domain)

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | delight, once | rare use (few times a year), emotional moment (dog's appointment) | calm 150–250ms routine motion; one signature on "booked" |
| data.tension-density-clarity | clarity | rare use, phone, one hand | airy rows, 48px+ time targets, one day at a time |
| usability.tension-guidance-expertise | guidance, layered | mixed: first-timers + regular rebookers | step flow with visible progress; earliest-available shortcut for regulars |
| craft.tension-restraint-liveliness | point of view | quiet-crafted finish, friendly | one ochre accent, one motif (comb teeth / appointment-book ruling), real dog names |

## Decided by agent
- interview.context.session — focused task — only plausible option for a booking
- interview.personality.calm-energetic — balanced — rare use [motion.frequency-budget]
- interview.personality.serious-playful — friendly — consumer salon [writing.user-language]
- interview.personality.references — finish "quiet-crafted" — autonomous fallback; brief = small craft salon [personality.calm, craft.identity-motif]

## Open questions
- Deposit / payment at booking: not in the brief; the build shows "Pay at pick-up" and no payment step.
- Salon hours: assumed Tue–Sat 8:00–17:00 (closed Sun–Mon), for sample data only.
