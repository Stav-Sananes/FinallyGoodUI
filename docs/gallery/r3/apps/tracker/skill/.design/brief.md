# Design brief — Docket (issue tracker)

status: confirmed (self-approved, autonomous run)
date: 2026-11-16
depth: full (greenfield: no routes, no brand, no tokens)
scope: whole app; key screen = issue list with the selected issue open in a side panel (desktop)

Sources: `brief` = the parent agent's brief · `inferred (<source>)` · `default` = the question bank's recommended option.

## Purpose
- **One-liner:** A six-person engineering team triages new issues every morning and works through a list filtered by status, priority and assignee, from the keyboard. — [interview.purpose.one-liner] · brief
- **Primary user:** internal team, six engineers who both file and fix issues — [interview.purpose.audience] · brief
- **Their words for the main thing:** "issues" (not tickets), "triage", "backlog", "in progress", "P0–P3", "assignee", issue keys like `ING-214` — inferred (brief + engineering convention)
- **Expertise:** expert — [interview.purpose.expertise] · inferred (brief: "engineering team", "live on the keyboard")
- **Success looks like:** the morning triage is done in minutes and anyone finds "what's mine, what's next" without the mouse — [interview.purpose.success] · default (task speed)

## Context
- **Device:** desktop primary; phone must still work (read and quick status change) — [interview.context.device] · brief ("on a desktop") + default
- **Frequency:** several times a day; most-opened screen: the issue list with side panel — [interview.context.frequency] · inferred (brief: "every morning", "work through a list")
- **Environment:** seated and focused at a desk — [interview.context.environment] · default
- **Session:** a focused 10–20 minute triage each morning, then many short glances all day — [interview.context.session] · inferred (brief: morning triage + working list)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Triage new issues: set priority, assignee and status, or close as duplicate / won't fix | Issue | daily, ~5–15 issues | [interview.jobs.top-tasks] · brief |
| 2 | Work the list filtered by status, priority, assignee ("mine, in progress") | Issue, View | many times a day | brief |
| 3 | Read and update the selected issue in a side panel without leaving the list | Issue, Comment | many times a day | brief |
| 4 | Jump anywhere / run any action from a command palette (⌘K) | Command | many times a day | brief |
| 5 | File a new issue | Issue | few a day | inferred |

- **First run:** empty state that says what goes here and one action (create the first issue / import) — [interview.jobs.first-run] · default

## Content
- **Mostly:** lists of records (issues) — [interview.content.type] · brief
- **Volume after a year (heavy user):** hundreds open, ~1,500 total — [interview.content.volume] · inferred (6 engineers × ~5 issues/week)

## Personality
- **Calm ↔ energetic:** calm — [interview.personality.calm-energetic] · default (used many times a day)
- **Serious ↔ playful:** serious, plain, a little dry (engineer voice) — [interview.personality.serious-playful] · default
- **Dense ↔ airy:** dense — [interview.personality.dense-airy] · skipped by rule (experts + daily → dense)
- **References:** none (no person to name them). Recommended option needs a person → took "pick a finish": **raw-industrial**, chosen from the brief: an engineering tool whose users live in terminals and editors; personality.raw-industrial applies-when "developer tools". Tempered by calm + dense-expert (see Tensions). **Anti-reference:** the generic issue-tracker look (violet accent on near-black, soft cards, avatar soup). — [interview.personality.references] · brief-derived finish
- **In three words:** exact, quiet, keyboard-native
- **Motion axis:** productive (daily + calm + keyboard)

## Constraints
- **Brand:** none, create one from this brief — [interview.constraints.brand] · inferred (greenfield)
- **Accessibility:** WCAG 2.2 AA — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; the deliverable is one self-contained `index.html` (inline CSS/JS; web fonts and icon CDN allowed); policy: no installs — [interview.constraints.platform-stack] · brief

## Risks
- **Worst accidental action:** a keyboard shortcut changes something that affects teammates (closes, reassigns or re-prioritises an issue) without the person noticing → undo toast on every mutation, no confirm dialogs — [interview.risks.failure] · decided by card (usability.user-control-undo; brief: keyboard-heavy)
- **Trust breakers:** unclear what happened after an action (a one-key shortcut acts silently), then stale data — [interview.risks.trust] · decided by card (usability.system-status; recommended option "stale numbers" is for dashboards/finance)

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed | daily, keyboard-driven, experts | 0ms on keyboard actions and list moves; ≤150ms feedback; expressive motion only for triage cleared and the selection handoff |
| data.tension-density-clarity | density | experts, many times a day, hundreds of issues | 32px rows, 13px base, hairlines; clarity kept with strong selected-row and focus marks |
| personality.calm vs personality.raw-industrial | blend | finish chosen for developer tool; calm because on screen all day | keep raw structure (0–2px radius, exposed 1px grid, mono micro-labels, one hazard accent) but drop macro type to one oversized figure per screen and keep surfaces 1 step apart |
| usability.tension-guidance-expertise | expertise, layered | engineers; new hire may join | shortcuts visible next to every action (kbd hints) and a ? sheet; nothing hidden only behind keys |

## Decided by agent
- interview.purpose.success — task speed — default for tools [flows-forms.primary-action-clarity]
- interview.context.environment — desk, focused — default [a11y.target-size]
- interview.jobs.first-run — empty state + one action — default [states.empty-state-teaches]
- interview.personality.calm-energetic — calm — default for frequent use [personality.calm]
- interview.personality.serious-playful — serious — default [personality.serious-trustworthy]
- interview.personality.references — finish "raw-industrial" (recommended option needs a person) [personality.raw-industrial]
- interview.constraints.a11y — AA — default
- interview.constraints.locales — en, i18n-ready — default
- interview.risks.failure / risks.trust — decided by card as above

## Open questions
- Real integration (Git, CI) is out of scope; the build shows linked PRs as plain text data only.
