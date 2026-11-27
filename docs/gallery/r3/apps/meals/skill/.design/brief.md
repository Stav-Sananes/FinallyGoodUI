# Design brief — Sunday Table (weekly dinner planner)

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full
scope: whole app; key screen built: this week's dinner plan

Sources: `brief` = the parent request; `inferred (<source>)`; `default` = the skill's recommended option.

## Purpose
- **One-liner:** A household of three plans the week's dinners on Sunday, cooks from the recipe on the night, and shops from one list grouped by supermarket aisle. — [interview.purpose.one-liner] · brief
- **Primary user:** the household member who does the Sunday plan (one planner); the other two read the plan and may cook. — [interview.purpose.audience] · inferred (brief: "a household of three")
- **Their words for the main thing:** "dinner", "the week", "recipe", "shopping list", "aisle" — never "meal slot", "entity", "SKU". — inferred (brief)
- **Expertise:** mixed: beginners the first Sunday, regulars after a month. — [interview.purpose.expertise] · default
- **Success looks like:** the Sunday plan done in about 10 minutes, and nothing forgotten at the shop. — [interview.purpose.success] · default (task finished quickly without help)

## Context
- **Device:** phone mainly (kitchen counter, supermarket); desktop/tablet must still work for the Sunday sit-down. — [interview.context.device] · default (consumer, personal, household)
- **Frequency:** several times a week: once on Sunday to plan, then most evenings to see tonight's dinner and open its recipe. Most-opened screen: this week's plan. — [interview.context.frequency] · inferred (brief)
- **Environment:** Sunday: seated, on the sofa. Weeknights: standing in the kitchen, hands busy or wet, glancing. — [interview.context.environment] · inferred (brief: "open a recipe while cooking")
- **Session:** Sunday = focused task of a few minutes; weeknights = glance and go. — [interview.context.session] · inferred (brief)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Plan this week's dinners (fill seven nights) | Week, Dinner, Recipe | weekly (Sunday) | [interview.jobs.top-tasks] · brief |
| 2 | See tonight's dinner and open its recipe while cooking | Dinner, Recipe | most evenings | brief |
| 3 | Shop from one list grouped by supermarket aisle | Shopping list, Ingredient, Aisle | weekly | brief |
| 4 | Browse/save recipes to plan from | Recipe | weekly | inferred (planning needs a source) |

- **First run:** an empty week that shows seven nights and one action to plan the first dinner. — [interview.jobs.first-run] · default

## Content
- **Mostly:** records (dinners, recipes, ingredients) with food photography slots. — [interview.content.type] · default
- **Volume after a year (heavy user):** dozens of recipes; one week of seven dinners at a time; list of ~30–50 items. — [interview.content.volume] · default

## Personality
- **Calm ↔ energetic:** calm by default. — [interview.personality.calm-energetic] · default (used several times a week)
- **Serious ↔ playful:** friendly: warm but practical. — [interview.personality.serious-playful] · decided by agent (no money/health risk, so "serious" condition does not fit; household tool → friendly) [personality.calm, writing.user-language]
- **Dense ↔ airy:** balanced. — [interview.personality.dense-airy] · decided by agent (neither "beginners/rare" nor "experts/daily data work" fits)
- **References:** none (no person to name them). Took the next option: **pick a finish** → **quiet-crafted**, chosen from the brief's subject (a home kitchen). Anti-reference: the generic recipe-app look (full-bleed food photo cards, orange CTA, emoji). — [interview.personality.references] · default (next option)
- **In three words:** warm, practical, homely
- **Motion axis:** productive leaning balanced (weekly planning ritual + glance use in the kitchen)

## Constraints
- **Brand:** none — create from this brief. — [interview.constraints.brand] · inferred (greenfield, no tokens)
- **Accessibility:** WCAG 2.2 AA. — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready (Intl for dates). — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; one self-contained `index.html` (inline CSS/JS, web fonts and icon CDN allowed); policy: nothing installed. — [interview.constraints.platform-stack] · brief (parent request)

## Risks
- **Worst accidental action:** removing a planned dinner or clearing the ticked shopping list → undo toast, no confirm dialog. — [interview.risks.failure] · default (lose their work)
- **Trust breakers:** a wrong list: an ingredient missing or counted twice after swapping a dinner; so the list must visibly follow the plan. — [interview.risks.trust] · inferred (brief: "one shopping list")

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed on weeknights, delight on Sunday | weeknight glance use vs a once-a-week planning ritual | routine motion ≤200ms; expressive budget spent on "week planned" and the list rolling up |
| usability.tension-guidance-expertise | intermediate | mixed expertise | empty nights teach inline; no onboarding flow |
| data.tension-density-clarity | clarity | glanced at from a kitchen counter | 7 nights on one screen, large tonight card, ingredient counts as quiet secondary text |
| craft.tension-restraint-liveliness | liveliness via one motif | calm + friendly | one kitchen motif + one accent moment per screen |

## Decided by agent
- interview.personality.serious-playful — friendly — no high-stakes data; a household tool [personality.calm, writing.user-language]
- interview.personality.dense-airy — balanced — no condition fits; glance use argues against dense [data.tension-density-clarity]
- interview.personality.references — finish "quiet-crafted" — no person can name references; a home kitchen is quiet and made by hand [personality.calm]

## Open questions
- Which supermarket's aisle order (the list uses a typical UK/US large-store order; editable later).
