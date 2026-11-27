# Design brief — Studio Ledger (finance overview for a 12-person design studio)

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full (greenfield, no brand: detect found no app code and no tokens)
scope: whole app; key screen = Overview dashboard

Sources: `brief` = the parent request's brief; `inferred (<source>)`; `default` = the bank's recommended option taken because the brief is silent.

## Purpose
- **One-liner:** The owner of a 12-person design studio opens it every Monday to see whether the studio has enough cash, who owes it money and how late, where money went, and whether the next payroll is covered. — [interview.purpose.one-liner] · brief
- **Primary user:** the studio owner (one person; a designer who runs the business, not an accountant). — [interview.purpose.audience] · brief ("the owner checks it")
- **Their words for the main thing:** "cash in the bank", "runway" (months), "unpaid invoices", "overdue", "spending", "payroll". Used verbatim in UI copy. · brief
- **Expertise:** mixed: learns it once, then reads it weekly. — [interview.purpose.expertise] · default
- **Success looks like:** the Monday read takes about a minute and needs no help or spreadsheet. — [interview.purpose.success] · default (tools option; fits "checks it every Monday")

## Context
- **Device:** laptop first; phone must still work. — [interview.context.device] · brief ("used on a laptop")
- **Frequency:** weekly, a fixed Monday routine; most-opened screen: Overview. — [interview.context.frequency] · brief ("every Monday")
- **Environment:** seated and focused, at the desk on Monday morning. — [interview.context.environment] · default
- **Session:** glance, under a minute or two, with drill-in when something is off. — [interview.context.session] · default (dashboard)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | See cash in the bank, and whether it is up or down | Account, Balance | weekly | [interview.jobs.top-tasks] brief |
| 2 | See months of runway | Runway (cash ÷ monthly spend) | weekly | brief |
| 3 | See unpaid invoices and how overdue they are; nudge late payers | Invoice, Client | weekly | brief |
| 4 | See spending by category | Category, Transaction | weekly | brief |
| 5 | See the next payroll: date, amount, whether cash covers it | Payroll run | weekly | brief |

- **First run:** an empty state that says what goes here and one action: connect the studio's bank account. — [interview.jobs.first-run] · default

## Content
- **Mostly:** numbers and charts, plus one short list (invoices). — [interview.content.type] · inferred (brief lists five figures)
- **Volume after a year:** dozens of open invoices at most; ~8 spending categories; 24 payroll runs. — [interview.content.volume] · default

## Personality
- **Calm ↔ energetic:** calm. — [interview.personality.calm-energetic] · default (serious work)
- **Serious ↔ playful:** serious and trustworthy: it is money. — [interview.personality.serious-playful] · default (money)
- **Dense ↔ airy:** airy-to-balanced: weekly use and a glance read favour clarity, but the five answers must fit one laptop screen. — [interview.personality.dense-airy] · default (airy for rare use), bounded by data.dashboard-summary-first
- **References:** none given. Recommended option needs a person ("I'll name some"), so took the next option, **pick a finish**: **editorial**, chosen from the brief: the reader is a design-studio owner with a print eye, and the Monday read is a weekly briefing, like the front page of a paper. **Anti-reference:** the generic SaaS dashboard (sidebar + 4 equal KPI tiles + area chart + table). — [interview.personality.references] · inferred (brief: "design studio", "every Monday")
- **In three words:** composed, frank, weekly.
- **Motion axis:** productive-to-balanced (weekly routine + serious), with one expressive moment on the first view of the week's key figure.

## Constraints
- **Brand:** none: create one from this brief. — [interview.constraints.brand] · default (detect found nothing)
- **Accessibility:** WCAG 2.2 AA. — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready; en-US, USD (agent's choice; the brief names no country). — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; the parent request fixes the output as one self-contained `index.html` (inline CSS/JS; Google Fonts and an icon CDN allowed). No installs. — [interview.constraints.platform-stack] · brief (request)

## Risks
- **Worst accidental action:** sending a payment reminder to a client by mistake (wrong invoice, or a client already in talks). The overview is otherwise read-only. → **undo**: the reminder is queued with an 8-second "Undo" before it leaves. — [interview.risks.failure] · inferred (brief: "unpaid invoices and how overdue they are" implies chasing them)
- **Trust breakers:** wrong or stale numbers. Every figure shows when the bank last synced; a failed sync says so and keeps the last good numbers labelled with their age. — [interview.risks.trust] · default (finance)

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed, with one delight | weekly routine, money, serious | Routine motion ≤ 250 ms; one expressive moment: the runway figure drawn on the first view of the week. |
| data.tension-density-clarity | clarity | weekly glance, owner not an accountant | Five answers above the fold at 1440×900; detail on demand (invoice list, category table). |
| craft.tension-restraint-liveliness | liveliness inside restraint | editorial finish risks the ink-on-paper house style | One motif from the studio/ledger world and one accent moment per section; the direction step must break ink-on-paper on a named axis. |
| usability.tension-guidance-expertise | guidance-light | the same person every week | Plain labels and inline explanations of runway; no onboarding tour. |

## Decided by agent
- interview.purpose.expertise — mixed — default when unsure [usability.tension-guidance-expertise]
- interview.purpose.success — quick unaided read — default for tools [flows-forms.primary-action-clarity]
- interview.context.environment — desk, focused — default
- interview.context.session — glance — default for dashboards [data.dashboard-summary-first]
- interview.jobs.first-run — empty state + "Connect bank account" — default [states.empty-state-teaches]
- interview.content.volume — dozens — default
- interview.personality.* — calm, serious, airy-balanced — defaults for money/weekly use [personality.calm, personality.serious-trustworthy]
- interview.personality.references — finish "editorial" picked from the brief (person-only option skipped)
- interview.constraints.* — no brand, AA, en-US/USD, single-file output
- interview.risks.failure — reminder sent by mistake → undo window — inferred
- interview.risks.trust — stale numbers — default

## Open questions
- Which bank and accounting tools the studio uses (sync source). The UI names "Operating checking ••4821" generically.
- Whether runway should count unpaid invoices. The screen shows both figures and labels each.
