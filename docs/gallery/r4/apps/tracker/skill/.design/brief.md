# Design brief: Tracker (issue triage)
status: confirmed (self-approved, autonomous) · date: 2026-11-22 · depth: full · scope: whole app
Brief (verbatim): "Issue tracker: a six-person team triages its issue list from the keyboard."
Sources: `brief` = from the request, `inferred` = from the brief wording, `default` = question-bank recommendation.

## Purpose
- One-liner: six engineers/designers sort an incoming issue list (priority, owner, status) without touching the mouse, to clear the untriaged pile each morning. [interview.purpose.one-liner] · brief
- Primary user: a member of a six-person product team (Mara, Tomás, Priya, Jonas, Ana, Kofi). [interview.purpose.audience] · inferred (brief "six-person team")
- Their words: "issue", "triage", "priority", "assign", "untriaged", "cursor". Not "tickets". · inferred
- Expertise: expert, daily. [interview.purpose.expertise] · inferred ("from the keyboard")
- Success: untriaged count reaches 0 in one sitting; every issue has a priority and an owner. [interview.purpose.success] · default

## Context
- Device: desktop primary (keyboard); phone secondary (read-only fallback, buttons still work). · inferred
- Frequency: several times daily; most-opened screen: the Issues list. · inferred
- Environment: desk, focused, often a shared standup screen. Session: focused task, 5-20 minutes. · default

## Jobs
| # | Task | Objects | Frequency | Source |
|---|---|---|---|---|
| 1 | Move through the list, set priority | issue | very high | brief |
| 2 | Assign an owner | issue, person | very high | brief |
| 3 | Set status / close, undo a slip | issue | high | inferred |
| 4 | Find an issue by text, filter to Untriaged / Mine | issue | high | inferred |
| 5 | Add a new issue | issue | medium | default |
- First run: arrives with data (a seeded list of 12). [interview.jobs.first-run] · default

## Content
- Mostly records. Volume after a year: hundreds (view shows an open-first list; no pagination in prototype). · default

## Personality
- Calm 70 / energetic 30; serious 70 / playful 30; dense 80 / airy 20. · inferred (expert daily use)
- References: air-traffic flight strips in a strip bay (the subject's own world); anti-reference: Jira's grey-blue enterprise tables and the Linear-clone dark ink. · decided by agent
- In three words: quick, ordered, legible. Motion axis: productive (repeated actions <= 150ms).

## Constraints
- Brand: none. A11y: WCAG 2.2 AA. Locales: en, i18n-ready (Intl dates, logical properties).
- Stack: Angular 21 standalone, plain CSS, no new dependencies (autonomous: never install).

## Risks
- Worst accidental action: closing or reprioritising the wrong issue because the cursor moved. -> undo toast (10s) on every triage change; closing asks no confirm because undo exists. [interview.risks.failure] · inferred
- Trust breakers: stale data (show sync state), lost work (draft of new issue survives dialog close).

## Tensions resolved
| Tension | Wins | Because | Resolution |
|---|---|---|---|
| data.tension-density-clarity | density | expert, daily, keyboard | 14px body, 36px rows, clarity via strip tab + tabular ids |
| motion.tension-delight-speed | speed | frequency very high | repeated actions <= 150ms; one moment of delight: strip lifts when focused |
| usability.tension-power-vs-discoverability | discoverability for first minute | six people, not all daily | `?` opens a shortcut sheet; a key hint footer is always visible |

## Decided by agent
All answers above are self-answered (autonomous). Overrule in `decisions.md`.
