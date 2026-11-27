# Brief (autonomous; every answer self-answered, overrule any)
- Request (brief, verbatim): "Studio finance: the owner of a small design studio takes a Monday look at cash, runway, overdue invoices and payroll."
- Users: studio owner, one person, weekly (Monday), 5-10 min, desktop first, phone on the train (inferred from "Monday look").
- Task sentence (mental model): "How many months can the studio stay afloat, who owes us, and can I make Friday's pay run." Not the ledger columns.
- Key flow: Monday -> chase an overdue invoice (remind, or mark paid) -> runway recalculates -> approve the pay run.
- Personality: calm, seaworthy, plain-spoken; money is a water level. Dense enough to scan, not an accounting suite. (inferred)
- Content: made-up studio "Saltmarsh & Rook", 12 invoices, 8 people, 3 accounts, as of Mon 23 Nov 2026. Data in localStorage.
- Constraints: no CDN, React 19 + Vite + TS, radix-ui installed, light + dark, mobile-friendly, WCAG AA.

## Screens and states
| Screen | Empty | Loading | Error | Full |
|---|---|---|---|---|
| Monday | cleared books: "Nothing in the harbour yet" + restore sample | skeleton gauge/curve/rows (bank feed 900ms) | bank feed down: banner + retry, last known figures hidden | headline, gauge, curve, overdue, pay run |
| Invoices | no invoices | skeleton rows | feed error | tabs Open / Overdue / Paid, search, no-match state, add invoice dialog |
| Payroll | no people | skeleton | feed error | cover bar, people list, approve dialog, approved state |
