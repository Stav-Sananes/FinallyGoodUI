# Blueprint — Studio finance overview (Halden & Moss)

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app as one hub; the overview is the key screen and the only screen built

**Mental model (non-negotiable 10):** "We have $412k in the bank. With no new money that lasts about three months. Clients owe us $186k and $71k of it is late, so I chase Ostra and Pinecrest. Friday's $47.9k payroll is covered." The screen reads in that order: cash → how long it lasts → is payroll covered → who to chase → where the money went. It does not mirror the accounting tables (accounts, ledgers, AR aging report).

## 1. Information architecture

### Objects
| Object | Key attributes (shown) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Bank balance | amount, account, last synced | refresh | belongs to the studio | 1 account |
| Runway | months, run-out date, monthly spend | include/exclude money owed | derived from balance + spend | 1 |
| Invoice | client, number, project, amount, due date, days late, last reminder | send reminder, mark paid, undo | belongs to client | ~10 open, dozens a year |
| Payroll run | date, total, people, net pay vs taxes & benefits, cash left after | none (read-only) | belongs to the studio | 2 a month |
| Spending category | name, amount this period, monthly average, top items | expand to see top items | has transactions | 8 categories |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | See cash and runway | Bank balance, Runway | weekly | 0 (first thing on screen) |
| 2 | Chase a late invoice | Invoice | weekly | 2 (Send reminder → Send) |
| 3 | Check next payroll is covered | Payroll run | weekly | 0 |
| 4 | See spending by category | Spending category | weekly | 0; 1 to expand |
| 5 | Record a payment the bank hasn't matched | Invoice | a few times a month | 1 (Mark paid) |

### Destinations & sitemap
```
Overview (hub, the only destination)
├─ Send reminder (dialog; bottom sheet on phone)
└─ Connect bank (first-run, inline on the overview)
```

## 2. Navigation model — D1
- **Model:** single hub + contextual actions (no sidebar, no tabs).
- **Why:** one dominant task (the Monday check), all five questions answerable on one screen. [ia-nav.nav-model-by-count, flows-forms.primary-action-clarity]
- **Current location shown by:** the page title "Monday, November 16" and the studio name in the top bar.
- **Responsive:** one column under 900px; the stage figure and chart stack.
- **Back behaviour:** Escape or back closes the reminder dialog; nothing else navigates.
- **Search:** none (≈10 open invoices, 8 categories; browse is enough). [ia-nav.search-vs-browse]

## 3. Key flows

### F1 — Monday check (cash, runway, payroll)
- **Entry:** owner opens the overview on Monday.
- **Happy path:**
  1. Overview — reads cash and the runway sentence → nothing to do.
  2. Overview — toggles "Count money clients owe" → projection redraws, run-out date moves later.
  3. Overview — reads the payroll line ("Covered, $364,520 left after") → done.
- **Error paths:**
  - Bank sync failed → banner "Couldn't reach First Harbor Bank since 6:02 am. Showing Friday's balance." + Retry; numbers stay, marked as from Friday. [states.partial-and-permission]
  - Whole load failed → error panel with Retry; nothing blank. [states.error-recovery]
- **Exit:** stays on overview.

### F2 — Chase a late invoice (the risks.failure flow)
- **Entry:** Overview → "Invoices to chase", group "Over 60 days late".
- **Happy path:**
  1. Overview — Send reminder on a row → dialog opens from the button with the email prefilled (to, subject, editable message, invoice attached).
  2. Dialog — reads/edits the message → Send reminder.
  3. Dialog closes; toast "Reminder to Ostra Bikes goes out in 10 s · Undo"; row shows "Reminder queued", then "Reminded today".
- **Error paths:**
  - Message emptied → inline error under the field on blur: "Write a message, or close this to cancel." Send disabled until fixed is not used; Send validates. [flows-forms.inline-validation-timing]
  - Send fails after the delay (simulated by none in sample data) → toast "Couldn't send the reminder to Ostra Bikes. Try again." with Retry; message kept.
- **Undo / confirm:** review step (the dialog) + 10 s Undo window. — D5
- **Exit:** back on overview, row marked "Reminded today".

### F3 — Record a payment (signature moment)
- **Entry:** Overview → invoice row → Mark paid.
- **Happy path:**
  1. Row amount is ruled through, row leaves the list, group total and "owed" total drop.
  2. Cash figure rolls up by the amount; the ledger double rule redraws under it (signature). Runway sentence updates.
  3. Toast "INV-0371 marked paid, $18,400 added to cash · Undo".
- **Undo:** Undo restores the row, totals and cash. — D5
- **Exit:** overview; when the last late invoice is paid, the group shows the cleared state "Nobody is late paying you."

### F4 — Spending by category
- **Entry:** Overview → "Where the money went".
- **Happy path:** switch October / November so far → bars move to new lengths; expand a category → top items appear beneath it.
- **Exit:** collapse.

### F5 — First run
- **Entry:** new account, no bank connected.
- **Happy path:** empty overview says what will appear and offers "Connect bank account" → loading skeleton → full overview.
- **Error:** connection fails → message + Try again (not reachable in sample data; same component as F1 error).

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| overview | `/` (`?state=`, `?period=`) | Answer the Monday questions | Bank balance | none at page level (read first); per-row Send reminder | reminder dialog | weekly | F1–F5 |
| reminder | dialog over overview | Review and send a payment reminder | Invoice | Send reminder | back to overview | weekly | F2 |

## 5. State matrix
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| overview | First-use: "Connect your bank to see cash, runway and payroll" + Connect bank account. Cleared invoices: "Nobody is late paying you" under the invoices heading / nothing to do. No spending yet in period: "No spending recorded for November yet." | Skeleton mirroring stage, strip, invoices, spending; shown after 300 ms, kept ≥ 400 ms | "We couldn't load your numbers. Nothing has changed in your bank; this is on our side." + Try again | Bank sync failed: banner + figures marked "as of Fri 5:40 pm"; invoices still live | 10 open invoices across 4 groups; long client names wrap; amounts to 6 figures | n/a: single-owner account; only the owner can sign in (a bookkeeper role is out of scope) |
| reminder | n/a (always has an invoice) | Send button working state | Inline field error; send failure toast with Retry | n/a | Prefilled message | n/a |

## 6. Cross-screen consistency rules
- Money: USD via Intl, tabular figures, whole dollars in summaries, cents only in the reminder.
- Status is said once: group headers carry lateness; rows show days late as text, never a repeated chip.
- Ink buttons for the one primary action in a context; quiet text buttons for secondary; nothing destructive on this screen.
- Feedback: toast with Undo for reminders and payments; banner for sync problems; inline for fields.
- Dates: "Fri, Nov 20" in UI; relative only for "Reminded today".

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Open reminder dialog | rises 8 px + fades from centre (sheet from bottom on phone) | exits faster, same path | standard 250 / exit 150 |
| Spending period switch | bars move to new lengths in place; indicator slides | same | medium 300 |
| Runway toggle | projection line morphs, date crossfades | same | medium 300 |
| Category expand | content reveals beneath its row | collapses up | standard 250 |
| Mark paid | row rule-through, row collapses; cash rolls | Undo re-inserts | short 150 + standard 250 |
| Toast | rises from bottom edge | drops away | standard 250 / 150 |

- **Signature moment:** Mark paid → the cash figure rolls to its new value and the ledger double rule redraws under it (≤ 500 ms). — D7
- **RTL:** logical properties; n/a for en-US.
- **Reduced motion:** spatial moves become opacity crossfades; the double rule appears without drawing.

## 8. Decisions
- D1 — Single hub, no sidebar
- D2 — Summary-first stage: cash + runway as one focal unit
- D3 — Runway = cash ÷ 3-month average spend, with a "count money owed" toggle
- D4 — Invoices grouped by lateness, status said once
- D5 — Reminder: review dialog + 10 s Undo; Mark paid: Undo
- D6 — Spending as sorted horizontal bars with a monthly-average tick
- D7 — Signature moment: Mark paid
