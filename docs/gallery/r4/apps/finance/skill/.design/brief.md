# Design brief — Studio Monday (studio finance)

status: confirmed (self-approved, autonomous)
date: 2026-11-22
depth: full
scope: whole app

Autonomous run: every answer is marked `brief`, `inferred (source)` or `default`. Overrule any of them later.

## Purpose
- **One-liner:** The owner of a small design studio takes a Monday look at cash, runway, overdue invoices and payroll, to know by 9:15 whether the studio is safe this month and who to chase. — [purpose.one-liner] · brief
- **Primary user:** Studio owner (founder-designer, not an accountant); the bookkeeper sees the same screens secondarily. — [purpose.audience] · inferred (brief wording "the owner")
- **Their words for the main thing:** "runway", "overdue", "payroll", "chase", "paid". Not "AR", "receivables", "liabilities". — inferred (brief)
- **Expertise:** mixed (reads numbers daily, not a finance professional) — [purpose.expertise] · decided by agent (designer by trade)
- **Success looks like:** within 30 seconds the owner can say "runway is X months, payroll on the 27th is covered, I need to chase these 3 invoices", and has sent the reminders. — [purpose.success] · decided by agent

## Context
- **Device:** desktop primary (Monday morning at the desk); phone secondary (glance on the train) — [context.device] · decided by agent
- **Frequency:** weekly (Mondays) plus ad hoc when a payment lands; most-opened screen: Monday overview — [context.frequency] · brief ("Monday look")
- **Environment:** desk, focused, coffee, a little anxious — [context.environment] · inferred
- **Session:** glance first (under a minute), then a short focused task (chase, mark paid) — [context.session] · brief

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | See how long the money lasts (runway) | cash accounts, forecast | weekly | brief |
| 2 | Find overdue invoices and chase them | invoices | weekly | brief |
| 3 | Check payroll is covered and approve it | pay run, people | monthly | brief |
| 4 | Record a payment that landed | invoice | several per week | inferred |
| 5 | Add a new invoice | invoice | weekly | inferred |

- **First run:** arrives with data (sample studio) — [jobs.first-run] · decided by agent; "Clear sample data" in the Studio menu shows the empty states and a first action.

## Content
- **Mostly:** numbers and records (invoices, people) — [content.type] · inferred
- **Volume after a year (heavy user):** hundreds of invoices, under 15 people — [content.volume] · inferred

## Personality
- **Calm ↔ energetic:** calm with one lift: calm lists, energy only on the runway figure — [personality.calm-energetic] · decided by agent (money anxiety; weekly use)
- **Serious ↔ playful:** serious about money, with a designer's wit in copy and colour — · decided by agent
- **Dense ↔ airy:** balanced — [personality.dense-airy] · decided by agent (weekly glance, ~12 invoices)
- **References:** none named; anti-reference: grey banking dashboards with four equal KPI tiles — · decided by agent
- **In three words:** proofed, plain-spoken, bright
- **Motion axis:** balanced, expressive on one moment (weekly use allows a once-per-visit entrance)

## Constraints
- **Brand:** none (invented studio "Harbour & Pike") — [constraints.brand] · decided by agent
- **Accessibility:** WCAG 2.2 AA — [constraints.a11y] · default
- **Locales:** en-US only, Intl-formatted, logical properties — · default
- **Stack & dependencies:** React 19 + Vite + TypeScript, radix-ui installed; policy: none beyond the brief (see decisions D12) — · brief

## Risks
- **Worst accidental action:** approving payroll, or marking a wrong invoice paid → payroll approval confirms in a dialog with the amount; mark paid and reminders are undoable (toast) — [risks.failure] · decided by agent
- **Trust breakers:** stale data (show "books as of"), unclear forecast (show how runway is calculated), invented numbers — [risks.trust] · decided by agent

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed | weekly + anxious, glance first | calm lists; one signature moment: the runway bar draws once on first view |
| usability.tension-guidance-expertise | guidance on the forecast | mixed expertise; trust risk | a "How is runway worked out?" disclosure, closed by default |
| data.tension-density-clarity | clarity | ≈12 invoices, glance session | balanced density, one focal figure |

## Decided by agent
- Domain data (fictional studio, USD, as-of Monday 23 Nov 2026) — decided by agent; flagged as sample data in the footer.
- Fonts via @fontsource (self-hosted) — see decisions D12.

## Open questions
- Real bank/accounting connection (out of scope: sample data in the browser, saved in localStorage).
