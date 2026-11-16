# Blueprint — Brindle

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; key screen built = `book-time`

Mental model (non-negotiable 10): "Bella needs her full groom, that's about two hours. I can drop her off before work on Thursday and get her back by lunch, with Sam or Priya, whoever's free." The owner thinks in **drop-off time → pick-up time on a day**, not in "slots × groomers". The time screen therefore lists drop-off times with the pick-up time beside each, and the groomer is a filter ("Either groomer" by default), not a column.

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Dog | name, breed, size, coat note | add · edit | belongs to owner; has many appointments | 1–3 |
| Service | name (Bath, Full groom, Nail trim), duration by size, price from | choose | — | 3 |
| Groomer | first name, specialty line | choose / "either" | has many appointments | 2 (Sam, Priya) |
| Appointment | dog, service, groomer, day, drop-off, pick-up, status | book · reschedule · cancel | dog + service + groomer | dozens/year |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Book a groom | Appointment (+Dog, Service, Groomer) | every 4–8 weeks | 5 (dog, service, groomer, time, confirm) |
| 2 | See / reschedule / cancel upcoming | Appointment | few times a year | 1 |
| 3 | Add / edit a dog | Dog | rare | 1 |

### Destinations & sitemap
```
Home (hub: next appointment + "Book a groom")
├─ Book (linear flow, no global nav inside)
│  ├─ 1 Dog
│  ├─ 2 Service
│  ├─ 3 Groomer
│  ├─ 4 Time        ← key screen
│  └─ 5 Review & book → Booked (signature moment)
├─ Appointment detail (reschedule · cancel)
└─ Dogs & account (secondary)
```

## 2. Navigation model — D1, D2
- **Model:** single hub + a linear stepper for booking.
- **Why:** one dominant task, rare use, phone-first [ia-nav.nav-model-by-count, flows-forms.one-thing-per-page]
- **Current location shown by:** step header "Step 4 of 5 · Time" plus a summary line of earlier picks (tap to change).
- **Responsive:** 375 is the design; ≥ 900px the flow sits in a centred column with the booking summary as a sticky side panel (same content as the phone summary chips).
- **Back behaviour:** back = previous step, picks kept; close (×) returns home and keeps the draft.
- **Search:** none (3 services, 2 groomers, ~60 times per fortnight).

## 3. Key flows

### F1 — Book a groom
- **Entry:** Home → "Book a groom" (or "Book again" on a past appointment, which pre-fills dog/service/groomer).
- **Happy path:**
  1. Dog — tap Bella → service step
  2. Service — tap Full groom (shows "about 2 h for a medium dog") → groomer step
  3. Groomer — "Either groomer" (default) or Sam / Priya → time step
  4. Time — pick a day on the date strip → pick a drop-off time (pick-up shown) → "Continue"
  5. Review — "Book Thursday 9:30" → Booked
- **Error paths:**
  - Step 4 times fail to load → inline error in the times area, date strip still usable, "Try again"; picks kept.
  - Step 4 one groomer's diary fails → partial: show the other groomer's times with a note.
  - Step 4 the chosen day is full → "Thursday is fully booked" + next free time as a one-tap shortcut + nearest day with space.
  - Step 5 time taken meanwhile → back on the time step with the conflict named and the nearest free times highlighted; dog/service/groomer kept.
- **Undo / confirm:** review step before booking (commitment) [usability.error-prevention]; after booking, free cancellation up to 24 h before — D5.
- **Exit:** Booked confirmation with drop-off/pick-up, "Add to calendar", "Done".

### F2 — Reschedule / cancel
- Home → appointment card → Reschedule (re-enters F1 at step 4 with picks) or Cancel (sheet naming the consequence; undo toast 8 s).

### F3 — First run
- Home empty: "No dogs yet. Add your dog to book their first groom." → Add dog → F1 step 2.

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| home | / | next appointment + start booking | Appointment | Book a groom | book-*, appt | few/yr | F1 F2 F3 |
| book-dog | /book/dog | choose dog | Dog | (tap a dog) | book-service, add-dog | few/yr | F1 |
| book-service | /book/service | choose service | Service | (tap a service) | book-groomer | few/yr | F1 |
| book-groomer | /book/groomer | choose groomer | Groomer | (tap) | book-time | few/yr | F1 |
| **book-time** | /book/time | choose day + drop-off time | Appointment | Continue | book-review | few/yr (most-opened step) | F1 F2 |
| book-review | /book/review | check and commit | Appointment | Book <day> <time> | booked, book-time | few/yr | F1 |
| booked | /book/done | confirmation (signature) | Appointment | Done | home | few/yr | F1 |
| appt | /appointments/:id | detail, reschedule, cancel | Appointment | Reschedule | book-time | rare | F2 |
| add-dog | /dogs/new | add a dog | Dog | Save dog | book-service | rare | F3 |

## 5. State matrix (key screen in full; others summarised)
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| book-time | (a) closed day (Sun/Mon): "Brindle is closed Sundays and Mondays" / pick another day · (b) fully booked day: "Thursday is full" + next free time button + waitlist-free shortcut to next day with space · (c) chosen groomer has nothing in 14 days: suggest "Either groomer" | skeleton of the time list (rows mirror final layout), date strip stays live; shown after 300ms, held ≥400ms | "Couldn't load Thursday's times. Your picks are saved." / Try again | one groomer's diary failed: other groomer's times shown + note "Priya's diary didn't load, try again"; stale-conflict after review: taken time struck through + nearest free highlighted | 20 times/day max, grouped Morning / Afternoon; long dog names wrap in the summary | n/a: any signed-in client can book; account-level problem handled at sign-in |
| home | first run: add your dog | skeleton card | inline retry | — | next + past appointments | n/a |
| book-review | n/a (needs picks) | button spinner "Booking…" | time taken → back to book-time with conflict; network → "Not booked yet" + retry, picks kept | — | — | n/a |

## 6. Cross-screen consistency rules
- Primary action: one full-width ink button at the bottom of the thumb zone (sticky above the safe area); label names the outcome ("Continue with 9:30", "Book Thursday 9:30").
- Choices are tappable rows with radio semantics, never dropdowns.
- Earlier picks shown as a summary line at the top of each step; tapping one jumps back to that step.
- Destructive: cancel lives on appointment detail only, styled apart, with undo toast.
- Feedback: inline for the times area, toast only for undo.
- Times shown with Intl, 12/24h by locale; durations as "about 2 h".

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Next step | forward: content slides in from the trailing edge 16px + fade | back reverses | 250ms enter / 180ms exit |
| Day change on date strip | times cross-fade, short lateral nudge in the direction of the day | mirrored | 200ms |
| Time selection | selection fill + check, press feedback | — | 120–150ms |
| Overlay (cancel sheet) | rises from bottom | falls | 300ms / 200ms |

- **Signature moment:** "Booked": the comb-teeth ruler on the time card fills tooth by tooth, then the appointment card settles — D6.
- **RTL:** mirror horizontal directions (i18n-ready).
- **Reduced motion:** spatial moves become opacity cross-fades; signature becomes a fade.

## 8. Decisions
- D1 — single hub + stepper
- D2 — booking as a 5-step linear flow, summary line as wayfinding
- D3 — time step lists drop-off times with pick-up beside them; groomer is a filter with "Either groomer" default
- D4 — date strip (14 days) + one day of times (superseded by D9: two-week grid)
- D5 — review step before commit; free cancel + undo after
- D6 — signature moment on "Booked"
