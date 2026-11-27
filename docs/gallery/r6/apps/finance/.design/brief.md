# Brief — Studio finance (autonomous run, directions: one, verify: browser)
Source line (verbatim): "Studio finance: the owner of a small design studio takes a Monday look at cash, runway, overdue invoices and payroll." Stack: React 19 + Vite + TypeScript.
Every answer is marked: brief | inferred (<source>) | default.

- **Product** (brief): a Monday view of a six-person design studio's money. One owner, no accountant on screen.
- **Audience** (inferred: "owner of a small design studio"): a designer-owner, not a finance person; reads a number and a picture faster than a table. Visual literacy high, patience for dashboards low.
- **Jobs** (brief): 1 how long does the cash last (runway), 2 who owes us and is late (overdue invoices), 3 can I make the next payroll (payroll). Cash is the frame for all three.
- **Frequency** (inferred: "Monday look"): weekly, 2-5 minutes, then closes. Read-first, one or two actions (nudge a client, mark paid, approve the run). Not a daily accounting tool.
- **Mental model** (inferred): "Money is a calendar: what lands which week, what leaves which week, and the line between them." Not the ledger's columns.
- **Personality** (inferred: studio owner, money anxiety on Mondays): calm and exact, with a designer's eye: crafted, printed, a little playful; never banking-blue sterile. Honest about bad news (overdue is shown plainly, not alarming).
- **Platform** (default): web, desktop first at 1440, phone at 390 (owner checks on the phone Monday on the train). Light and dark.
- **Constraints** (default): no CDN, fonts local; accessibility AA; sample data only (no real accounts), clearly a demo studio, "Marlow & Pike Studio".
- **Content** (inferred): GBP, UK dates, 14 invoices (4 overdue, 7 upcoming, 1 draft, 2 paid), six payroll lines, recurring costs (rent, running costs, VAT).
- **Out of scope**: bookkeeping entry, bank connection, tax advice. The runway counts only invoices already sent; pipeline is not counted and the screen says so.
