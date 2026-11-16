# Design brief — Supper (weekly dinner planner)

status: confirmed (self-approved, autonomous)
date: 2026-11-16
depth: full (greenfield, no brand)
scope: whole app; key screen built: this week's dinner plan

Sources: `brief` = parent brief · `inferred (<source>)` · `default` = skill's recommended option (no person to answer).

**Mental model (non-negotiable 10):** "This week is seven evenings. Each evening gets one dinner (or a night off), and everything those dinners need becomes one trip through the supermarket, walked aisle by aisle."

## Purpose
- **One-liner:** A household of three plans the week's dinners on Sunday, cooks from the recipe on the night, and shops from one list sorted by supermarket aisle. — [interview.purpose.one-liner] · brief
- **Primary user:** the household's Sunday planner (one of three adults/teens sharing it); the other two read the plan and the list. — [interview.purpose.audience] · brief + inferred (household of three)
- **Their words for the main thing:** "dinner", "this week", "the plan", "recipe", "shopping list", "aisle". Not "meal slot", "entry", "SKU".
- **Expertise:** mixed: first week is new, then a weekly routine. — [interview.purpose.expertise] · default
- **Success looks like:** the Sunday plan is done in a few minutes and nobody goes back to the shop mid-week. — [interview.purpose.success] · default (task speed) + brief (one list)

## Context
- **Device:** phone mainly (cooking in the kitchen, shopping in the aisles); desktop/laptop must work for Sunday planning. — [interview.context.device] · inferred (brief: cooking + supermarket are phone-in-hand)
- **Frequency:** a few times a week: plan Sunday, recipe most evenings, list on shop day. Most-opened screen: this week's plan. — [interview.context.frequency] · inferred (brief)
- **Environment:** Sunday: seated on the sofa. Evenings: phone propped on a counter, hands busy. Shop: on the move, one hand. — [interview.context.environment] · inferred (brief)
- **Session:** Sunday = focused task of a few minutes; weekdays = glance (what's tonight?). — [interview.context.session] · inferred (brief)

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Plan the week's dinners (fill seven evenings) | Week, Dinner, Recipe | weekly (Sunday) | [interview.jobs.top-tasks] · brief |
| 2 | See tonight's dinner and open its recipe while cooking | Dinner, Recipe | most evenings | brief |
| 3 | Shop from one list grouped by aisle | Shopping list, Item | 1–2× a week | brief |
| 4 | Swap/move a dinner when plans change | Dinner | ad hoc | inferred (households re-plan mid-week) |

- **First run:** empty week with seven named evenings and one action ("Plan Monday"), plus suggestions from recipes. — [interview.jobs.first-run] · default

## Content
- **Mostly:** records (dinners, recipes, ingredients) with a little imagery. — [interview.content.type] · default
- **Volume after a year:** dozens of recipes (~40–80), 7 dinners a week. — [interview.content.volume] · default

## Personality
- **Calm ↔ energetic:** calm, with one lift when the week is fully planned. — [interview.personality.calm-energetic] · default (calm; used several times a week)
- **Serious ↔ playful:** friendly: warm, informal copy, never cute. — [interview.personality.serious-playful] · decided by agent (no option recommended for a household tool; personality.playful vs personality.serious-trustworthy: no money/health stakes, but a shared family tool must stay legible: friendly)
- **Dense ↔ airy:** balanced: a week of seven evenings fits one screen. — [interview.personality.dense-airy] · decided by agent (neither "beginners/rare" nor "experts/daily" applies) [data.tension-density-clarity]
- **References:** recommended option needs a person → took "pick a finish": **editorial** (cookbook print discipline: paper canvas, serif display, hairline rules, washed tag pairs). Anti-reference: the generic recipe-app card grid with full-bleed food photos and orange gradients. — [interview.personality.references] · default (next option)
- **In three words:** warm, unhurried, exact
- **Motion axis:** productive leaning balanced (few-times-a-week + calm)

## Constraints
- **Brand:** none, create from this brief. — [interview.constraints.brand] · inferred (greenfield)
- **Accessibility:** WCAG 2.2 AA. — [interview.constraints.a11y] · default
- **Locales:** English only, i18n-ready (Intl dates, logical properties). — [interview.constraints.locales] · default
- **Stack & dependencies:** greenfield; a single self-contained `index.html` (vanilla HTML/CSS/JS, Google Fonts + one icon CDN allowed). Policy: no installs. — [interview.constraints.platform-stack] · brief (parent run) + default

## Risks
- **Worst accidental action:** clearing a planned dinner or ticking off/removing list items by mistake mid-shop → undo toast, never "Are you sure?". — [interview.risks.failure] · default
- **Trust breakers:** the shopping list missing something a planned dinner needs (wrong data), and not knowing whether a change saved. — [interview.risks.trust] · decided by agent (brief: "one shopping list" is the promise) [usability.system-status]

## Tensions resolved
| Tension (card) | Wins here | Because (brief facts) | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed, with one delight | plan screen opened several times a week | quiet ≤200ms motion everywhere; one signature moment when the seventh evening is planned |
| data.tension-density-clarity | clarity | glanced at from a counter while cooking | balanced density, tonight's dinner the largest thing on screen |
| craft.tension-restraint-liveliness | liveliness by one motif | editorial finish risks the sterile default | one accent (tomato-red ink), one kitchen motif, real dish photos |

## Decided by agent
- interview.personality.serious-playful — friendly — no stakes, shared household tool [personality.playful, personality.serious-trustworthy]
- interview.personality.dense-airy — balanced — seven evenings fit one screen [data.tension-density-clarity]
- interview.personality.references — "pick a finish": editorial — recipes are a print tradition (cookbooks) [personality.editorial]
- interview.risks.trust — wrong list data + unclear saves [usability.system-status, states.optimistic-feedback]

## Open questions
- Household member names, dietary needs: used sample names (Noa, Eli, Maya) and one vegetarian preference as realistic content.
