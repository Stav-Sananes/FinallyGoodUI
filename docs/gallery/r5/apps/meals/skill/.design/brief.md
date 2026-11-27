# Design brief: Supper Board (meal planner)

status: confirmed (self-approved, autonomous 2026-11-22)
date: 2026-11-22
depth: full
scope: whole app

Source key: brief = the one-line request; inferred = from the request and stack; default = bank recommendation (decided by agent).

## Purpose
- **One-liner:** A household of three plans the week's dinners and shops by aisle. [purpose.one-liner] · brief
- **Primary user:** the household, three people who each cook some nights (Maya, Daniel, Noa in the sample data). One shared plan, no accounts. [purpose.audience] · inferred (brief: "a household of three")
- **Their words for the main thing:** "dinners", "the week", "shopping list", "aisle". Not "recipes", "tasks" or "items". [writing.user-language] · inferred
- **Expertise:** mixed, no training; the board must explain itself. [purpose.expertise] · default
- **Success looks like:** by Sunday evening seven nights have a dinner and a cook, and the list in the supermarket is in aisle order with nothing forgotten. [purpose.success] · inferred

## Context
- **Device:** both equally: plan on a laptop on Sunday, shop on a phone in the store. [context.device] · inferred (plan + shop are two settings)
- **Frequency:** weekly planning, daily glance at "tonight", one weekly shop; most-opened screen: Week. [context.frequency] · inferred
- **Environment:** shared kitchen counter, and a supermarket aisle one-handed. [context.environment] · inferred
- **Session:** planning = focused; shopping = interrupted. [context.session] · inferred

## Jobs
| # | Task | Object(s) | Frequency | Source |
|---|---|---|---|---|
| 1 | Put a dinner on each night and say who cooks | Night, Dinner | weekly | brief |
| 2 | Shop by aisle: see what to buy, tick it off | Shopping item, Aisle | weekly | brief |
| 3 | Find or add a dinner we already know | Dinner | weekly | inferred |
| 4 | Fix a change midweek (swap a night, undo a removal) | Night | several times a week | inferred |

- **First run:** arrives with a sample week (so the shop is never empty on day one) plus an empty-state path after "Clear week". [jobs.first-run] · default

## Content
- **Mostly:** records and short lists. [content.type] · inferred
- **Volume after a year:** dozens of dinners, hundreds of list lines. [content.volume] · inferred

## Personality
- **Calm / energetic:** calm routine screens, warmth on the shop screen. [personality.calm-energetic] · default
- **Serious / playful:** lightly playful, a household not a business. [personality.serious-playful] · decided by agent
- **Dense / airy:** balanced; list rows must be tappable in a store. [personality.dense-airy] · default
- **References:** a greengrocer's hand-lettered price board; anti-reference: the white-card recipe-app template.
- **In three words:** hand-lettered, fresh, practical
- **Motion axis:** productive with one expressive moment (the week completing).

## Constraints
- **Brand:** none; the subject (a greengrocer's stall) supplies palette and motif. [constraints.brand] · default
- **Accessibility:** WCAG 2.2 AA. [constraints.a11y] · default
- **Locales:** en only, i18n-ready (Intl dates, logical properties). [constraints.locales] · default
- **Stack & dependencies:** Vue 3 + Vite + TS, no kit installed; fonts self-hosted via fontsource (no CDN). [constraints.platform-stack] · brief

## Risks
- **Worst accidental action:** removing a night's dinner or clearing the week. Undo toast, no confirm dialog; "Clear week" asks to confirm because it removes seven nights at once. [risks.failure] · decided by agent [usability.user-control-undo]
- **Trust breakers:** a list that forgets an ingredient or shows stale amounts after a swap. The list is derived from the plan, never edited out of sync. [risks.trust] · decided by agent

## Tensions resolved
| Tension (card) | Wins here | Because | Resolution |
|---|---|---|---|
| motion.tension-delight-speed | speed | weekly + daily glance | feedback <=150ms; one 300ms moment |
| ia-nav.tension-discoverability-minimalism | discoverability | 3 destinations, mixed expertise | always-visible labelled nav |
| data.tension-density-clarity | clarity | in-store one-handed use | 44px rows, 16px text |

## Decided by agent
- purpose.audience, personality.*, risks.*, jobs.first-run: bank recommendations, shown above for overruling.

## Open questions
- none
