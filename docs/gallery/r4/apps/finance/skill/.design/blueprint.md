# Blueprint — Studio Monday
status: approved (self-approved, autonomous) 2026-11-22

## Mental model (non-negotiable 10)
"I need to know how many months we can pay everyone, then who owes us money that I can nudge." Layout follows that order: runway, then overdue, then payroll. Not accounts, ledgers, reports.

## IA and navigation (D1)
Three destinations, top-level, always visible in a header tab strip: **Monday** (hub), **Invoices**, **Payroll**. URL hash is state: `#/`, `#/invoices?tab=overdue`, `#/payroll`. Studio menu (right): Clear / Restore sample data, Refresh from bank. 3 destinations: a header strip, no sidebar (ia-nav.nav-model-by-count).

## Key flow (Monday look)
1. Open → skeleton (loading) → Monday: runway figure and bar.
2. Read "Overdue: 3 invoices, $31,200, oldest 41 days" card → "Chase all 3" (sends reminders, undo toast) or open Invoices → Overdue tab.
3. Row: "Remind" (undo toast) or "Mark paid" (dialog: amount received, date; validates; toast; runway recalculates).
4. Payroll glance: "Fri 27 Nov: $44,950, operating account left after: $16,450" → Payroll screen → "Approve pay run" (confirm dialog) → toast, status approved.
5. Toggle "Count overdue invoices as paid in 14 days" changes forecast and runway, shown beside the figure.

## Screens
| id | route | purpose | primary action | freq |
|---|---|---|---|---|
| monday | #/ | runway, overdue, payroll at a glance | Chase overdue | weekly |
| invoices | #/invoices | all invoices by tab: Overdue, Coming up, Paid, All | Add invoice | weekly |
| payroll | #/payroll | the 27 Nov run: people, amounts, cover | Approve pay run | monthly |
| add-invoice (dialog) | | client, project, amount, due date | Add invoice | weekly |
| mark-paid (dialog) | | amount received, date | Record payment | several/wk |
| approve-payroll (confirm dialog) | | confirm amount and cash left | Approve | monthly |

## State matrix
| screen | empty | loading | error | partial | full | no-permission |
|---|---|---|---|---|---|---|
| monday | cleared studio: "No money in the books yet" + Add first invoice + restore sample | skeleton of figure, bar, three cards | "Couldn't reach the bank feed. Showing nothing rather than stale numbers." Retry | stale: books-as-of line turns warning when older than 1 day (n/a in sample; shown if load is from cache) | designed default | n/a (single-owner app, no roles) |
| invoices | cleared: first-invoice prompt; tab empty: Overdue "Nothing overdue. Everyone has paid or is not due yet." ; Paid empty; no matches | skeleton rows | same bank error + retry | partial: some invoices reminded (marker) | 12 rows | n/a |
| payroll | no people: "Add your first person" is out of scope: shows "No pay run yet" with restore sample | skeleton rows | error + retry | approved state replaces the button with "Approved Thu 26 Nov" | 8 rows (6 staff, 2 freelancers) + cover bar | n/a |

## Cross-screen rules
Primary action top right of each screen. Row vs card: invoices and people are rows (hairlines); the three summary items are one rail, not tiles. Destructive/commitment actions use a confirm dialog; reversible ones use a toast with Undo. Money: tabular figures, true minus, muted currency. Feedback: toast for success, inline for form errors. Rail + work composition on desktop; stacked on phone.

## Motion spatial map
Peer destinations: instant swap with a short crossfade (daily-weekly use). Dialogs rise from the opener (scale + fade). Signature moments (max 3): (1) runway bar draws once per session on Monday, with the registration mark settling; (2) overdue-cleared: when the last overdue invoice is paid, the yellow marker highlight sweeps off the count; (3) payroll approved: the cover bar's tick stamps. Reduced motion: opacity only.
