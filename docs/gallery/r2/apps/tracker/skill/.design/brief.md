# Design brief — Tracker (team issue tracker)

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full
scope: whole app; key screen = issue list with selected issue in a side panel (desktop)

## Purpose
- **One-liner:** A six-person engineering team triages new issues each morning and works through a filtered list of issues, from the keyboard. — [interview.purpose.one-liner] · brief
- **Primary user:** engineers on one six-person team (internal team members) — [interview.purpose.audience] · brief
- **Their words for the main thing:** "issues"; "triage"; status names Triage / Backlog / Todo / In progress / In review / Done — inferred (brief + engineering convention)
- **Expertise:** expert — "live on the keyboard" — [interview.purpose.expertise] · inferred (brief)
- **Success looks like:** users finish triage and pick their next issue quickly without help — [interview.purpose.success] · default (recommended for tools)

## Context
- **Device:** desktop/laptop mainly; phone must still work — [interview.context.device] · brief ("on a desktop") + default
- **Frequency:** several times a day; most-opened screen: issue list — [interview.context.frequency] · inferred (brief: every morning + working through the list)
- **Environment:** seated, focused, at a desk — [interview.context.environment] · default
- **Session:** a focused task of a few minutes (triage), plus quick checks during the day — [interview.context.session] · inferred (brief)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Triage new issues (accept to backlog/todo with priority + assignee, or decline/mark duplicate) | Issue | daily, morning | brief |
| 2 | Work through the list filtered by status, priority, assignee | Issue, filter | many times a day | brief |
| 3 | Open an issue and change status/priority/assignee | Issue | many times a day | brief |
| 4 | File a new issue | Issue | a few times a day | inferred |
| 5 | Jump anywhere / run any action from the command palette | all | many times a day | brief |

- **First run:** arrives with data (team already invited); empty states still designed — [interview.jobs.first-run] · decided by agent (six-person team is onboarded together; still design empty-state-teaches for each list)

## Content
- **Mostly:** lists/records of issues — [interview.content.type] · brief
- **Volume after a year:** hundreds (≈ 400–900 issues for six people; ~60–120 open at a time) — [interview.content.volume] · inferred (team size)

## Personality
- **Calm ↔ energetic:** calm — [interview.personality.calm-energetic] · default (used often, serious work)
- **Serious ↔ playful:** serious, with a dry, plain voice — [interview.personality.serious-playful] · default
- **Dense ↔ airy:** dense — [interview.personality.dense-airy] · skipped: expertise=expert + frequency=daily → dense (confirmed in one line)
- **References:** none available (autonomous); took "pick a finish" → **quiet-crafted** — [interview.personality.references] · decided by agent (recommended option needs a person; quiet-crafted fits calm + dense + all-day use)
- **In three words:** exact, quiet, quick
- **Motion axis:** productive

## Constraints
- **Brand:** none — create from this brief — [interview.constraints.brand] · inferred (greenfield, no tokens)
- **Accessibility:** WCAG 2.2 AA — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; single self-contained index.html (inline CSS/JS, web fonts + icon CDN allowed); policy: no installs — [interview.constraints.platform-stack] · brief (parent request)

## Risks
- **Worst accidental action:** change something that affects other people (reassign, close or delete a teammate's issue; bulk-move during triage) → undo toast, no confirm dialogs except delete — [interview.risks.failure] · decided by agent (team tool; edits are reversible)
- **Trust breakers:** unclear what happened after an action (did my status change save? did triage accept it?) — [interview.risks.trust] · decided by agent (keyboard actions are invisible without feedback)

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed | daily, keyboard-driven | no animation on keyboard row movement; ≤150ms feedback; one signature moment: "triage clear" when the morning queue hits zero |
| data.tension-density-clarity | density | experts, daily | 36px rows, compact type, hairline structure; clarity via grouping by status and strong selection |
| usability.tension-guidance-expertise | expertise | "live on the keyboard" | shortcuts everywhere, shown as keycaps next to actions so they stay learnable (recognition) |
| craft.tension-restraint-liveliness | balanced | calm + quiet-crafted risks sterile | one accent (selection/focus/triage), keycap motif, priority glyph as data, ink primary buttons |

## Decided by agent
- interview.jobs.first-run — arrives with data — team onboarded together [states.empty-state-teaches]
- interview.personality.references — finish: quiet-crafted — no person to name references [personality.calm, personality.dense-expert]
- interview.risks.failure — affects others → undo — [usability.user-control-undo]
- interview.risks.trust — unclear outcomes — [usability.system-status, states.optimistic-feedback]
- calm, serious, AA, en-only — recommended defaults

## Open questions
- None blocking. Integrations (Git branches, PR links) shown as read-only data only.
