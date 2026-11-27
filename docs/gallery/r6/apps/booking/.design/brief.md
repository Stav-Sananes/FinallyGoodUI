# Design brief: Pawprint (salon booking for dog grooming)
status: confirmed (self-approved, autonomous)
date: 2026-11-27
brief (verbatim): "Salon booking: dog owners pick a time for a groom, on their phone."

## Purpose
- One-liner: a dog owner picks a time for their dog's groom, on their phone. · brief
- Primary user: dog owner, non-expert, booking between other things. · inferred (brief: "dog owners")
- Their words: "groom", "slot", "drop-off", "pick-up", "Biscuit's groom" (dog's name leads). · inferred
- Expertise: beginner. · default
- Success: a time is booked in under 30 seconds with the right length for the dog and service. · inferred

## Context
- Device: phone first (brief), desktop secondary. · brief
- Frequency: every 4-8 weeks; most-opened screen: Book. · inferred (grooming cycle)
- Environment: on the move, one thumb, interrupted. · inferred
- Session: short focused task. · inferred

## Jobs
| # | Task | Objects | Frequency |
|---|---|---|---|
| 1 | Pick a time that fits the groom's length | day, groomer, time slot, service, dog | each visit |
| 2 | Confirm and get the ticket | booking | each visit |
| 3 | See or cancel upcoming visits | visit | occasional |
| 4 | Compare services and prices | service | rare |
- First run: arrives with a pre-selected dog (Biscuit) and service so the tape is live at once; empty Visits state teaches the first action. · decided

## Content
- Mostly: records (services, visits) plus one live schedule. Volume: dozens. · inferred

## Personality
- Calm <-> energetic: warm, a little playful. Serious <-> playful: playful but not childish. Dense <-> airy: balanced.
- In three words: scrubbed, warm, tidy.
- Motion axis: balanced (rolled expressive for the one transition only; fitted to budget: a booking screen is used every few weeks, entrance choreography allowed once, repeated actions <=150ms).

## Constraints
- Brand: none, invented ("Pawprint"). Accessibility: WCAG 2.2 AA. Locales: en-GB, Intl formats. Stack: Svelte 5 + Vite, no dependencies beyond self-hosted fonts.
