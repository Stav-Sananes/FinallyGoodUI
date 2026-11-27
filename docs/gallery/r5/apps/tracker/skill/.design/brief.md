# Design brief: Sorting Office (issue tracker)
status: self-approved (autonomous) · date: 2026-11-26 · depth: full · scope: whole app
Source legend: brief = the request; inferred = from the brief's words; default = agent decision.

## Purpose
- One-liner: a six-person team triages its issue list from the keyboard. [brief]
- Primary user: one of six teammates who triages the shared intake every morning. [inferred (six-person team)]
- Their words: "issue", "triage", "sort", "hand to". Domain nouns kept: issue, priority, assignee, area. [inferred]
- Expertise: expert, daily. [inferred (triage from the keyboard)]
- Success: intake cleared (every open issue has a priority and an owner) without touching the mouse. [inferred]
## Context
- Device: desktop, keyboard primary; phone usable but secondary. [inferred]
- Frequency: daily+; most-opened screen: Intake (the untriaged list). [inferred]
- Environment: desk, focused; Session: focused task, interrupted. [inferred]
## Jobs
| # | Task | Frequency |
|---|---|---|
| 1 | Move through intake, set priority, hand to a teammate | many times a day |
| 2 | Undo a slip | several a day |
| 3 | Find an issue (search) | daily |
| 4 | Log a new issue | daily |
| 5 | Review what each person is carrying | daily |
- First run: arrives with data. Empty state when intake is clear is a reward moment. [default]
## Content
- Mostly records; volume after a year: hundreds (view = open work; closed sink). [inferred]
## Personality
- Calm vs energetic: calm, brisk. Serious vs playful: serious with one wry voice line. Dense. [inferred]
- Three words: sorted, inked, quick. Motion axis: productive.
## Constraints
- Brand: none. A11y: WCAG 2.2 AA. Locales: en, logical properties. Stack: Angular 21 standalone, plain CSS, no new UI deps (self-hosted Fontsource fonts only). [brief + default]
## Risks
- Worst accidental action: wrong priority/owner or close -> every change is undoable (u / z) and toasts say what changed. Failed saves roll back with Retry.
- Trust breakers: silent failed save; stale data (synced-at stamp shown).
## Tensions resolved
| Tension | Wins | Because |
|---|---|---|
| data.tension-density-clarity | density | expert daily use, six people |
| motion.tension-delight-speed | speed | repeated actions <=150ms; one hero moment (Intake clear) |
## Decided by agent
- Directions: one (config). Chosen direction C "Sorting Office", subject-led.
