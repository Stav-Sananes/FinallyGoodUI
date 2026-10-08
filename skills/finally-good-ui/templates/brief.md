# Design brief — <App or feature name>

<!-- Written by modules/interview.md. Every answer carries a source: user | inferred (<file>) | decided by agent (<why>). Keep the question id in brackets so later steps can trace it. Delete guidance comments when filling. -->

status: draft <!-- draft | confirmed -->
date: <yyyy-mm-dd>
depth: <full | brand | feature>
scope: <whole app | feature: name + entry points>

## Purpose
- **One-liner:** <who does what, to get what> — [interview.purpose.one-liner] · <source>
- **Primary user:** <one type; name secondary group if any> — [interview.purpose.audience] · <source>
- **Their words for the main thing:** <e.g. "jobs", not "tickets"> <!-- used verbatim in UI copy -->
- **Expertise:** <beginner | mixed | expert> — [interview.purpose.expertise] · <source>
- **Success looks like:** <measure> — [interview.purpose.success] · <source>

## Context
- **Device:** <primary; secondary> — [interview.context.device] · <source>
- **Frequency:** <daily+ | weekly | monthly | yearly | once>; most-opened screen: <screen> — [interview.context.frequency] · <source>
- **Environment:** <desk focused | on the move | stress | shared screen> — [interview.context.environment] · <source>
- **Session:** <glance | focused task | long | interrupted> — [interview.context.session] · <source>

## Jobs
<!-- Ranked. Frequency per task drives nav visibility and motion budget. -->
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | | | | [interview.jobs.top-tasks] |

- **First run:** <empty state + first action | sample data | setup flow | arrives with data> — [interview.jobs.first-run] · <source>

## Content
- **Mostly:** <records | numbers/charts | long text | media | forms> — [interview.content.type] · <source>
- **Volume after a year (heavy user):** <dozens | hundreds | thousands+> — [interview.content.volume] · <source>

## Personality
<!-- brand depth: write "from .design/brand.md" and summarise in one line. feature depth: inherited. -->
- **Calm ↔ energetic:** <position> — [interview.personality.calm-energetic] · <source>
- **Serious ↔ playful:** <position> — [interview.personality.serious-playful] · <source>
- **Dense ↔ airy:** <position> — [interview.personality.dense-airy] · <source>
- **References:** <app — quality liked>; **anti-reference:** <app — what to avoid> — [interview.personality.references]
- **In three words:** <word, word, word>
- **Motion axis:** <productive | balanced | expressive> <!-- derived: frequency + calm/energetic -->

## Constraints
- **Brand:** <extracted | supplied | logo only | none> — [interview.constraints.brand] · <source>
- **Accessibility:** <WCAG 2.2 AA | AA legal | AAA/specific needs> — [interview.constraints.a11y]
- **Locales:** <en only, i18n-ready | LTR multi | RTL | CJK> — [interview.constraints.locales]
- **Stack & dependencies:** <detected stack>; policy: <ask first | small libs ok | none | fresh> — [interview.constraints.platform-stack]

## Risks
- **Worst accidental action:** <what> → <undo | confirm> — [interview.risks.failure] · <source>
- **Trust breakers:** <stale data | unclear outcomes | unprofessional | privacy> — [interview.risks.trust] · <source>

## Tensions resolved
<!-- One line per tension or contradiction raised. The blueprint and directions resolve against these. -->
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | | | |

## Decided by agent
<!-- Every "you decide" or skipped item: question id — choice — rationale [cards]. -->
- 

## Open questions
<!-- Anything the user deferred; blueprint must not depend on these silently. -->
- 
