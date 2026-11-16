# Design brief — Studio finance overview (Halden & Moss)

<!-- Autonomous run: no person answered. Sources: brief = the parent request; inferred (<source>); default = the question bank's recommended option. -->

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full
scope: whole app, key screen built: the overview dashboard

## Purpose
- **One-liner:** Every Monday, the owner of a 12-person design studio sees how much cash the studio has, how long it lasts, who owes money and how late, where the money went, and whether the next payroll is covered. — [interview.purpose.one-liner] · brief
- **Primary user:** the studio owner (one person, not an accountant). — [interview.purpose.audience] · brief
- **Their words for the main thing:** "cash in the bank", "runway", "invoices", "overdue", "payroll", "spending". Used verbatim in UI copy.
- **Expertise:** mixed (not a finance professional, but the same check every week). — [interview.purpose.expertise] · default
- **Success looks like:** the Monday check takes under a minute and ends with a clear "who do I chase". — [interview.purpose.success] · default (task speed), with trust as the constraint (inferred: money)

## Context
- **Device:** laptop primary; phone must still work. — [interview.context.device] · brief ("used on a laptop")
- **Frequency:** weekly, a fixed Monday routine; most-opened screen: the overview. — [interview.context.frequency] · brief ("checks it every Monday")
- **Environment:** seated and focused, at a desk. — [interview.context.environment] · default
- **Session:** quick check, glance and go, then act on one or two invoices. — [interview.context.session] · default (recommended for dashboards)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | See cash in the bank and months of runway | Bank balance, monthly spend | weekly | [interview.jobs.top-tasks] brief |
| 2 | See unpaid invoices and how overdue they are; chase the late ones | Invoice, client | weekly | brief |
| 3 | Check the next payroll is covered | Payroll run | weekly (2× a month) | brief |
| 4 | See spending by category | Spending category, transaction | weekly | brief |

- **First run:** empty state that says what goes here and one action: connect the studio's bank account. — [interview.jobs.first-run] · default

## Content
- **Mostly:** numbers and charts, plus one short list of invoices. — [interview.content.type] · brief
- **Volume after a year (heavy user):** dozens of open invoices at most; hundreds of transactions summarised into ~8 categories. — [interview.content.volume] · default (dozens)

## Personality
- **Calm ↔ energetic:** calm. — [interview.personality.calm-energetic] · default (serious work, weekly)
- **Serious ↔ playful:** serious and trustworthy. — [interview.personality.serious-playful] · default (money involved)
- **Dense ↔ airy:** airy-to-balanced: decision at a glance, not monitoring. — [interview.personality.dense-airy] · decided by agent (data.tension-density-clarity: weekly, decision-at-a-glance → clarity)
- **References:** none (no person to name them). Took the next option, "pick a finish": **quiet-crafted, with a ledger's discipline** (the owner runs a design studio, so type and spacing are judged by a trained eye; money calls for sober). Anti-reference: the default SaaS dashboard (sidebar, four equal KPI tiles, area chart, table). — [interview.personality.references] · decided by agent
- **In three words:** sober, legible, exact
- **Motion axis:** productive-to-balanced (weekly, serious: motion confirms, one signature moment)

## Constraints
- **Brand:** none; create from this brief. — [interview.constraints.brand] · inferred (greenfield, no tokens found)
- **Accessibility:** WCAG 2.2 AA. — [interview.constraints.a11y] · default
- **Locales:** English (en-US, USD) only, i18n-ready (Intl for money and dates, logical CSS). — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; one self-contained `index.html` (inline CSS/JS, Google Fonts and an icon CDN allowed). Policy: no installs. — [interview.constraints.platform-stack] · brief (parent request)

## Risks
- **Worst accidental action:** sending a payment reminder to a client by mistake (it reaches a person outside the studio, and a wrong tone can hurt the relationship) → a review step with the message visible, then a 10-second send delay with Undo. Marking an invoice paid by mistake → Undo. — [interview.risks.failure] · inferred (the only outward action on this screen)
- **Trust breakers:** wrong or stale numbers. Show when the bank last synced, say plainly when a sync failed and what the numbers are based on. — [interview.risks.trust] · default (recommended for finance)

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed | weekly routine, serious money context | Routine motion ≤ 250 ms; the one expressive moment is marking an invoice paid (money arrives) |
| data.tension-density-clarity | clarity | weekly decision at a glance, owner not an accountant | One focal figure, few numbers, generous space; detail on request (expand a category, open a reminder) |
| craft.tension-restraint-liveliness | both, by construction | serious + calm risks the sterile default | One ink-green accent used for money and the motif; one display face for the big figures; ledger double rule as motif |
| usability.tension-guidance-expertise | intermediate | same check every week | Plain sentences explain the numbers ("enough for 3.2 months"), no onboarding tour |

## Decided by agent
- interview.purpose.expertise — mixed — default; the owner is not a bookkeeper [usability.tension-guidance-expertise]
- interview.purpose.success — task speed under a minute — default for tools [flows-forms.primary-action-clarity]
- interview.context.environment — desk, focused — default
- interview.context.session — glance — default for dashboards [data.dashboard-summary-first]
- interview.jobs.first-run — empty state + "Connect bank account" — default [states.empty-state-teaches]
- interview.content.volume — dozens — default
- interview.personality.calm-energetic — calm — default [personality.calm]
- interview.personality.serious-playful — serious — default, money [personality.serious-trustworthy]
- interview.personality.dense-airy — airy/balanced — [data.tension-density-clarity]
- interview.personality.references — finish: quiet-crafted with ledger discipline — [personality.calm, personality.serious-trustworthy]
- interview.constraints.a11y — AA — default
- interview.constraints.locales — en-US, USD — default
- interview.risks.failure — accidental reminder send → review + delayed send with Undo — [usability.user-control-undo, usability.error-prevention]
- interview.risks.trust — stale numbers → visible sync time and honest partial state — [usability.system-status, states.partial-and-permission]

## Open questions
- Studio name, bank and client names are sample data written for this example (no real studio supplied).
- Runway formula: cash ÷ average monthly net spend over the last 3 months. A person should confirm it matches how they think about runway.
