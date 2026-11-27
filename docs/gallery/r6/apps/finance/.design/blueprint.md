# Blueprint — Studio finance (self-approved, autonomous)

## Navigation model
Three destinations, equal weight, visited in one order on a Monday: **Monday** (/) -> **Invoices** (/invoices) -> **Payroll** (/payroll). Model: persistent rail on desktop (the sheet's margin), bottom tab strip on a phone. Current location marked by an ink bar and `aria-current` (ia-nav.wayfinding-location). The direction's Skeleton replaces a generic top bar with the planner stage (D2).

## Key flows
- **F1 Monday glance** (primary): open -> read runway + cash on the planner -> scrub weeks to see a date's balance -> change what-if for overdue invoices -> see runway move.
- **F2 Chase an overdue invoice**: Monday overdue slip -> "Send nudge" -> dialog with editable note -> send -> toast "Nudge sent to Harbour & Pine" -> slip shows "Nudged 30 Nov" (action becomes "Nudge again"). Alternatively "Mark paid" -> balance and runway update, toast with Undo.
- **F3 Approve payroll**: Payroll screen -> check six lines and cover -> "Approve run" -> confirm dialog (irreversible) -> status "Approved, pays Thu 24 Dec".

## Screen inventory
1. **Monday** regions: planner stage (figure column: runway + cash; chart; scrub readout; what-if control), overdue slips, next payroll stub. 
2. **Invoices**: filter tabs (All, Overdue, Upcoming, Paid) in URL, search field, record rows with visible actions, nudge dialog.
3. **Payroll**: next run summary with cover, table of six people, approve action, past runs strip.

## State matrix
| Screen | empty | loading | error | partial | full | no-permission |
|---|---|---|---|---|---|---|
| Monday | no invoices sent: planner shows recurring costs only, copy says so | planner skeleton line + figure placeholders | "Couldn't load the books" + Retry | n/a | default | n/a (single owner) |
| Invoices | filter has no matches / nothing overdue ("Nothing overdue. A quiet Monday.") | skeleton rows | error banner + Retry | filter active | default | n/a |
| Payroll | n/a (always six lines) | skeleton table | error + Retry | run approved: lines locked | default | n/a |
Forced via `?state=empty|loading|error` on every route.

## Decisions
- D1 Concept: money as a calendar (wall planner), not a dashboard of cards [layout.hierarchy-by-weight, usability.mental-model].
