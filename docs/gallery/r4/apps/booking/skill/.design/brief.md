# Design brief: Tailwag Grooming booking

status: confirmed (self-approved, autonomous)
date: 2026-11-22
depth: full
scope: whole app

## Purpose
- **One-liner:** Dog owners pick a time for a groom, on their phone. [purpose.one-liner] · brief
- **Primary user:** a dog owner booking for a dog they know well; secondary: the same owner rebooking or cancelling. [purpose.audience] · inferred (brief)
- **Their words for the main thing:** "groom", "slot"/"time", "my dog" by name (Biscuit, Juno), "visit". Not "appointment resource". [writing.user-language]
- **Expertise:** mixed, no jargon about coats beyond what owners say. [purpose.expertise] · decided by agent
- **Success looks like:** time to a confirmed slot under a minute, no surprise price or length. [purpose.success] · decided by agent

## Context
- **Device:** phone first (390px), one thumb; desktop must also read well. [context.device] · brief
- **Frequency:** every 6-8 weeks; most-opened screen: pick a time. [context.frequency] · decided by agent
- **Environment:** on the sofa or in the park queue; interrupted. [context.environment] · inferred
- **Session:** focused task of 1-3 minutes, interrupted. [context.session] · inferred

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Book a groom: dog + service + day + time | Dog, Service, Slot, Visit | every 6-8 weeks | brief |
| 2 | Rebook the same groom from a past visit | Visit | every visit | decided by agent |
| 3 | See or cancel an upcoming visit | Visit | occasionally | decided by agent |

- **First run:** arrives with two saved dogs from the sample household; a no-visits state exists after cancelling all. [jobs.first-run] · decided by agent

## Content
- **Mostly:** records (services, slots, visits) and a short form. [content.type]
- **Volume after a year:** dozens (6-9 visits/year, 10 services, ~12 slots/day). [content.volume]

## Personality
- **Calm ↔ energetic:** warm, slightly playful; energy only at the confirm moment. [personality.calm-energetic]
- **Serious ↔ playful:** playful in copy and motif, serious about price, time and cancel terms. [personality.serious-playful]
- **Dense ↔ airy:** airy (thumbs, glanceable). [personality.dense-airy]
- **References:** none given; anti-reference: generic salon template with a pastel gradient hero. [personality.references] · default
- **In three words:** warm, tidy, waggy
- **Motion axis:** balanced to expressive; routine taps stay ≤150ms, one stamp moment.

## Constraints
- **Brand:** none supplied; the name "Tailwag Grooming" is invented for the sample. [constraints.brand]
- **Accessibility:** WCAG 2.2 AA. [constraints.a11y] · default
- **Locales:** en-GB, Intl formats (GBP, 24h-free "9:30am"), logical CSS. [constraints.locales]
- **Stack & dependencies:** Svelte 5 + Vite; fontsource fonts only (self-hosted); no UI kit. [constraints.platform-stack]

## Risks
- **Worst accidental action:** cancelling a visit inside the 24h window (fee) → confirm dialog with the consequence. [risks.failure]
- **Trust breakers:** a slot that vanishes at confirm; a price or length that differs from what was promised. [risks.trust]

## Tensions resolved
| Tension | Wins here | Because | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed on routine taps | monthly use, interrupted sessions | one expressive stamp on confirm only |
| ia-nav.tension-discoverability-minimalism | minimalism | only 2 destinations (Book, Visits) | bottom tabs on phone, hidden inside the 3-step flow |
| usability.tension-guidance-expertise | guidance | owners are not pros | slot list shows why a time is missing (too short a gap) |

## Decided by agent
- Every answer above marked "decided by agent"/"inferred"; no question was answered by a person.

## Open questions
- Real salon name, hours and prices (sample values used).
