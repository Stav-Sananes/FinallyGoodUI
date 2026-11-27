# Blueprint — Brindle booking

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; key screen built in this run = `book-time`

**Mental model (non-negotiable 10):** "Biscuit needs a full groom; I drop her off before work and pick her up when she's ready." Owners think in **drop-off and pick-up around their day**, with a groomer they like — not in 15-minute resource slots. So every time shows drop-off *and* ready-by, grouped by part of the day, and "any groomer" is the default with names attached to each time.

## 1. Information architecture

### Objects
| Object | Key attributes | Actions | Relationships | Volume |
|---|---|---|---|---|
| Dog | name, breed, size, coat, notes for groomer | add · edit | belongs to owner | 1–3 |
| Service | name (Bath & tidy, Full groom, Nail trim), duration by size, price from | choose | — | 3 |
| Groomer | name, short line, working days | choose · "any" | — | 2 |
| Appointment | dog, service, groomer, drop-off, ready-by, price | book · view · reschedule · cancel | dog, service, groomer | dozens/yr |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Book | Appointment | 4–8 weeks | 4 (dog → service → time+groomer → review) |
| 2 | Reschedule / cancel | Appointment | rare | 2 |
| 3 | Update dog details | Dog | rare | 2 |

### Destinations & sitemap
```
Home (hub: next appointment + "Book a groom")
├─ Book (linear flow, no global nav)
│  ├─ 1 Dog
│  ├─ 2 Service
│  ├─ 3 Time (+ groomer filter)   ← key screen
│  └─ 4 Review → Booked
├─ Appointment detail (reschedule / cancel)
└─ Your dogs (secondary)
```

## 2. Navigation model — D1
- **Model:** single hub + linear booking flow (stepper, no global nav inside)
- **Why:** one dominant task on a phone, used rarely [ia-nav.nav-model-by-count, flows-forms.one-thing-per-page]
- **Current location shown by:** step label "Step 3 of 4 · Time" + summary chips of earlier choices (tap to change)
- **Responsive:** same flow at 1440, centered column ≤ 960px with the summary as a side rail
- **Back behaviour:** back = previous step, choices kept
- **Search:** none (dozens of items)

## 3. Key flows

### F1 — Book a groom
- **Entry:** Home → "Book a groom" (dog and last service pre-selected from the previous visit)
- **Happy path:**
  1. Dog — tap Biscuit → service step
  2. Service — tap Full groom (duration shown for Biscuit's size) → time step
  3. Time — pick a day in the week strip → times for that day appear grouped Morning / Midday; optional groomer filter; tap 9:30 → slot expands to show drop-off 9:30, ready ~11:45, with Maya; sticky bar "Review booking"
  4. Review — check details, add a note → "Book appointment" → spinner (pessimistic)
  5. Booked — confirmation, add to calendar
- **Error paths:**
  - Step 3 times fail to load → inline error in the time area, week strip kept, "Try again"
  - Step 3 day fully booked → no-results empty: "Saturday is full." + next open day button + "Join waitlist"
  - Step 4 slot taken meanwhile (conflict) → back to step 3 with the slot struck and a note "9:30 was just taken. Here are the nearest times." choice kept for everything else
  - Step 4 network fail → "Not booked yet" error, retry, nothing lost
- **Undo / confirm:** review step before booking (commitment), free cancel up to 24 h before — D3
- **Exit:** Booked screen

### F2 — Reschedule/cancel: Home → appointment → Reschedule (reopens Time step with current slot marked) or Cancel (confirm sheet naming date/dog; free up to 24 h) — D3
### F3 — First run: Home empty → "Add your dog" (name, breed, size) → Book

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| home | / | next appointment, start booking | Appointment | Book a groom | book-dog, appt | 4–8 wk | F1 F2 F3 |
| book-dog | /book/dog | choose dog | Dog | Continue | book-service | rare | F1 |
| book-service | /book/service | choose service | Service | Continue | book-time | rare | F1 |
| **book-time** | /book/time | choose day, time, groomer | Appointment | Review booking | book-review | rare | F1 F2 |
| book-review | /book/review | check & commit | Appointment | Book appointment | booked, book-time | rare | F1 |
| booked | /book/done | confirmation | Appointment | Add to calendar | home | rare | F1 |
| appt | /appointments/:id | detail | Appointment | Reschedule | book-time | rare | F2 |
| dogs | /dogs | dog profiles | Dog | Add a dog | — | rare | F3 |

## 5. State matrix (key screen in full; others summarised)
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| book-time | no-results: day full → next open day + waitlist; closed day (Sun/Mon) shown disabled with "Closed" | skeleton of slot rows ≥300 ms (delayed indicator) | inline in times area, week strip kept, Try again | groomer filter leaves few times → "Theo has 1 time; Any groomer shows 6"; stale: slot taken at review → struck + note | 3 parts of day, up to ~10 times; long groomer names wrap | n/a: public availability, signed-in owner |
| home | first-use: "Add your dog" | skeleton card | inline retry | — | next appt card | n/a |
| book-review | n/a | button spinner | conflict → back to time; network → retry | — | summary | n/a |
| others | per F1–F3 | skeleton | inline retry | — | — | n/a |

## 6. Cross-screen consistency rules
- Primary action: one, full-width, sticky at the bottom on phone (thumb zone), labelled with the outcome
- Choices are large rows (≥ 56 px), never dropdowns, for ≤ 10 options
- Earlier choices shown as a summary line at the top; tapping one jumps back to that step
- Destructive (cancel) styled apart, confirm sheet names the dog and date
- Feedback: inline for availability, toast only for background results
- Times always shown as drop-off + "ready ~" pick-up

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Next step | forward, enters from trailing edge | back reverses | 300 ms |
| Day change (week strip) | lateral cross-slide in date order | mirrored | 250 ms |
| Select time | the slot expands in place to reveal pick-up + groomer | collapse | 250 ms |
| Overlay (sheet) | from bottom | exits down | 350/240 ms |

- **Expressive moments (≤3):** (1) choosing a time: the drop-off → ready-by comb bar draws across the day; (2) Booked confirmation — D4
- **RTL:** n/a (English only), logical properties used anyway
- **Reduced motion:** spatial moves become opacity cross-fades

## 8. Decisions
- D1 — single hub + linear booking flow
- D2 — times shown as drop-off + ready-by, grouped by part of day; "any groomer" default
- D3 — review step before booking, free cancel instead of confirm dialogs elsewhere
- D4 — expressive moments: time selection and booked
