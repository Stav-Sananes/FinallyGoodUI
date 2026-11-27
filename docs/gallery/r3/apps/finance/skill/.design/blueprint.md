# Blueprint — Studio Ledger

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16, self-confirmed)
scope: whole app; built in this run: Overview (key screen) plus light read-only views for Invoices, Spending and Payroll so the navigation is real.

**User's mental model (non-negotiable 10):** "It's Monday. We have $742k in the bank, that's about five and a half months if nobody pays us, four clients owe us $83k and are late, October's non-payroll spend was $33k, mostly freelancers and rent, and the $51k payroll on the 30th is covered." The screen reads in that order: money now → how long it lasts → who owes us → where it went → what leaves next. It does not mirror the data model (accounts table, invoices table, transactions table).

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Account | name, last 4 digits, balance, last synced | view; sync now | belongs to studio | 2 (operating, tax reserve) |
| Invoice | number, client, project, amount, due date, days overdue | view; send reminder (undo 8 s) | belongs to Client | dozens open |
| Client | name, contact | view (via invoice) | has many Invoices | ~15 |
| Spending category | name, last month total, change vs month before | view | has many transactions | 7 (+ payroll shown apart) |
| Payroll run | pay date, debit date, people, gross, employer taxes, benefits, total | view | debits Operating account | 2/month |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Cash in the bank | Account | weekly | 0 (on Overview) |
| 2 | Months of runway | Account, Category | weekly | 0 |
| 3 | Unpaid invoices + how overdue; chase one | Invoice | weekly | 0 to see, 1 to remind |
| 4 | Spending by category | Category | weekly | 0 |
| 5 | Next payroll + covered? | Payroll run | weekly | 0 |

### Destinations & sitemap
```
Overview (hub, key screen)
├─ Invoices        (all unpaid, sortable by days overdue)
├─ Spending        (categories, Oct vs Sep)
└─ Payroll         (next run breakdown + recent runs)
```
Settings, bank connections and accounting connections exist in the product but are out of scope for this build and are not shown (craft.nothing-dead).

## 2. Navigation model — D1
- **Model:** top bar with four labelled destinations, always visible.
- **Why:** 4 primary destinations, laptop-first, weekly fixed routine (counts as "daily" in the blueprint table): persistent visible nav. A top bar over a sidebar gives the dashboard the full laptop width and avoids the default-dashboard-shell. [ia-nav.nav-model-by-count, ia-nav.visible-destinations]
- **Current location shown by:** the active tab's ink underline + `aria-current="page"`, and the page title matching the label.
- **Responsive:** ≥ 768 px: one bar (studio mark · tabs · sync status · theme). < 768 px: the bar wraps to two rows, the tabs become a full-width row of four (all visible, no hamburger).
- **Back behaviour:** each destination is a hash route (`#overview`, `#invoices`, `#spending`, `#payroll`); browser back returns to the previous destination. [ia-nav.url-as-state]
- **Search:** none: dozens of items, browse is enough. [ia-nav.search-vs-browse]

## 3. Key flows

### F1 — Monday read (tasks 1, 2, 5)
- **Entry:** owner opens the app Monday morning.
- **Happy path:**
  1. Overview — loads → shows last-sync time, cash, runway (with and without unpaid invoices), next payroll and whether it is covered.
- **Error paths:**
  - Bank sync fails → banner "We couldn't reach your bank. These are Friday's numbers (Fri 4:10 PM)." + "Try again"; numbers stay, labelled with their age. [states.error-recovery]
- **Exit:** the owner knows the answer without scrolling at 1440×900.

### F2 — Chase a late invoice (task 3, risks.failure)
- **Entry:** Overview, "Unpaid invoices" section.
- **Happy path:**
  1. Overview — reads the aging strip (how much is 1–15, 16–30, 31–60 days late) and the list sorted by days overdue.
  2. Overview — clicks "Send reminder" on Brightwater Health's invoice → toast "Reminder to Brightwater Health queued · Undo" (8 s), row shows "Reminder queued".
  3. After 8 s → row shows "Reminded today".
- **Error paths:** send fails → row returns to "Send reminder", inline "Couldn't send. Try again." [states.optimistic-feedback]
- **Undo / confirm:** undo (8 s) — D5
- **Exit:** row state "Reminded today".

### F3 — Where did the money go (task 4)
- **Entry:** Overview spending section → "See all spending" or the Spending tab.
- **Happy path:** 1. Overview — reads ranked bars of October by category. 2. Spending — table of categories, October vs September, change.
- **Exit:** returns via tab or back.

### F4 — First run
- **Entry:** no bank connected.
- **Happy path:** Overview empty state → "Connect bank account" → (out of scope: bank picker) — in this build the button runs the sync and fills the overview, so the state is honest about what happens next.

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| overview | #overview | Monday answer: cash, runway, invoices, spending, payroll | Account | none (read-first); per-row "Send reminder" | invoices, spending, payroll | weekly | F1–F4 |
| invoices | #invoices | All unpaid invoices by days overdue | Invoice | Send reminder (per row) | overview | weekly | F2 |
| spending | #spending | Categories, Oct vs Sep | Category | none (read-only) | overview | weekly | F3 |
| payroll | #payroll | Next run breakdown + recent runs | Payroll run | none (read-only) | overview | weekly | F1 |
| toast | overlay | Undo a queued reminder | Invoice | Undo | — | rare | F2 |

## 5. State matrix
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| overview | first-use: "Connect your bank to see cash, runway and payroll here" + Connect bank account / cleared: "No unpaid invoices. Everyone has paid." in the invoice section | skeleton mirroring the five sections; "Syncing with your bank…" in the status; shown ≥ 400 ms | bank sync failed: banner + Try again, last good numbers labelled with their age | accounting tool failed: cash/runway/payroll shown, invoice section says "Invoices didn't load" + Try again (scoped) | 7 open invoices, 2 accounts, 7 categories; long client names truncate with title | bookkeeper role without balance access: cash/runway hidden with "Balances are visible to owners. Ask Maren Okafor for access."; invoices still shown |
| invoices | cleared: "No unpaid invoices." | skeleton rows | "Invoices didn't load" + Try again | n/a (single source) | 7 rows | n/a (owner) |
| spending | n/a (always has last month) | skeleton bars | inherits overview banner | n/a | 7 categories | n/a |
| payroll | n/a | skeleton | inherits overview banner | n/a | next run + 3 recent runs | n/a |

States are reachable by URL: `?state=empty|loading|error|partial|denied|cleared` (for the flow walk) and through real controls: "Sync now" (loading), the sync-failed banner's "Try again".

## 6. Cross-screen consistency rules
- Every figure sits with its comparison (vs last week, vs need, vs September). [data.dashboard-summary-first]
- Money is always tabular, right-aligned in columns, cents dropped above $1,000 on the overview, units quiet. [craft.number-setting]
- Overdue status: one vocabulary: on time (neutral), due soon (info), overdue (warning), 30+ days (danger), each colour + icon + words. Shown once per row, not repeated in group headers. [data.status-encoding]
- The only outbound action (Send reminder) is a quiet text button on its row; undo via toast. [usability.user-control-undo]
- Freshness: "Synced 7:42 AM" in the bar on every screen. [usability.system-status]
- Sentence case, verb-first labels. [writing.action-labels]

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Sibling destinations (tabs) | cross-fade, 150 ms, no slide | same | short |
| Overlay (toast) | rises 8 px from the bottom edge, 250 ms; exits 150 ms | exits down | standard |
| Skeleton → content | cross-fade 250 ms | — | standard |
| Row state change (reminder queued) | colour cross-fade 150 ms | same | short |

- **Expressive moments (≤ 3):** (1) the runway figure is drawn the first time the week's numbers appear: the runway rule fills from today to the month it runs out, 600 ms, once per session — D8. (2) The "covered" check on the next payroll settles in after the runway draw, 400 ms, once. 
- **RTL:** n/a (en only); layout uses logical properties.
- **Reduced motion:** the rule appears filled with an opacity fade; no scale or translate.

## 8. Decisions
- D1 — Top bar navigation, four destinations
- D2 — Overview is the hub; five answers above the fold
- D3 — Runway shown two ways (cash only / with unpaid invoices)
- D4 — Payroll shown apart from spending
- D5 — Reminder: undo window, no confirm dialog
- D6 — Browse, no search
- D7 — States reachable by URL for verification
- D8 — Expressive moment: runway drawn once per session
