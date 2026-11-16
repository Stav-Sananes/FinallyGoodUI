# Blueprint — Sunday Table

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; key screen `week` is built

Mental model (non-negotiable 10): "Tuesday is chicken tacos; tacos need 500 g chicken thighs, and chicken lives in the meat aisle, next to the beef for Thursday's ragù." The plan is a week of nights, not a table of meals; the list is a walk through the shop, not a table of ingredients.

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Week | Mon–Sun dates, nights planned (n/7) | view · move to next/previous week | has 7 Nights | 1 current, past weeks kept |
| Night (dinner) | weekday, recipe, who cooks, time, servings (3) | plan · swap · move to another night · clear (undo) · mark "eating out" | belongs to Week, points to Recipe | 7 per week |
| Recipe | name, photo, time, servings, ingredients by aisle | view · cook · add to a night | has many Ingredients | dozens |
| Ingredient | name, quantity + unit, aisle | — (derived) | belongs to Recipe | 5–12 per recipe |
| Shopping list item | name, combined quantity, aisle, which dinners need it, ticked | tick · untick · add extra item · clear ticked (undo) | derived from planned Nights + extras | 30–50 |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Plan the week | Week, Night, Recipe | weekly | 2 (tap empty night → pick recipe) |
| 2 | Cook tonight's dinner | Night, Recipe | most evenings | 1 (tap tonight → recipe) |
| 3 | Shop by aisle | Shopping list | weekly | 1 (tab) |
| 4 | Browse recipes | Recipe | weekly | 1 (tab) |

### Destinations & sitemap
```
This week (home)
├─ Recipe (cooking view)        ← tap a planned night
└─ Pick a dinner (sheet)        ← tap an empty night / Swap
Recipes
└─ Recipe
Shopping list
```

## 2. Navigation model — D2
- **Model:** bottom tab bar on phone (This week · Recipes · Shopping list); the same three as a left rail with labels at ≥ 1024px.
- **Why:** 3 destinations, phone-first. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, a11y.target-size]
- **Current location shown by:** active tab (ink + accent dot) and page title matching the tab label.
- **Responsive:** tab bar < 1024 → labelled rail ≥ 1024; same order.
- **Back behaviour:** recipe and sheet close on Back / Escape; hash reflects the open recipe (`#recipe/<id>`).
- **Search:** in the Pick-a-dinner sheet and Recipes only (dozens of recipes: filter field, not global search). [ia-nav.search-vs-browse]

## 3. Key flows

### F1 — Plan the week (Sunday)
- **Entry:** This week, Sunday, some nights empty.
- **Happy path:**
  1. This week — tap an empty night ("Plan Wednesday") → Pick-a-dinner sheet rises from the night.
  2. Sheet — search or tap a recipe (recent favourites first) → night fills, sheet closes, list count updates ("+6 items").
  3. Repeat; when the 7th night is filled → "Week planned" moment, list ready.
- **Error paths:** save fails (offline) → night shows the dinner with "Not saved · Retry" inline; nothing lost.
- **Undo / confirm:** clearing a night → undo toast 8 s — D5.
- **Exit:** a full week; header reads "7 of 7 planned"; shopping list shows its item count.

### F2 — Cook tonight
- **Entry:** This week, any evening.
- **Happy path:** 1. Tonight card is the focal point → tap "Open recipe". 2. Recipe — ingredients for 3, steps with large text; screen stays awake (Wake Lock where supported).
- **Error paths:** recipe fails to load → message in the recipe panel with Retry; the plan behind is untouched.
- **Exit:** Back to the week.

### F3 — Shop by aisle
- **Entry:** Shopping list tab.
- **Happy path:** 1. Items grouped by aisle in shop order, each with combined quantity. 2. Tap to tick → moves to the aisle's bottom, struck through; aisle collapses when done. 3. "Clear ticked" → undo toast.
- **Error paths:** offline → banner "Offline: ticks are saved on this phone and sync later".
- **Exit:** "All aisles done" empty state.

### F0 — First run
- Empty week: seven nights with day names and "Plan Monday"-style prompts; one primary action "Plan this week" that opens the sheet on the first empty night.

### FR — Clear or swap a dinner (risks.failure)
- Night menu → "Clear night" → night empties, toast "Wednesday cleared · Undo" (8 s), list recomputed; Undo restores dinner and list.

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| week | `#week` | this week's dinners, tonight first | Week/Night | "Start cooking" (tonight planned) · else "Plan tonight" / "Plan Monday" (D10) | recipe, pick, list | most evenings | F0 F1 F2 FR |
| pick | sheet over week | choose a recipe for a night | Recipe | Add to <night> | week | weekly | F1 |
| recipe | `#recipe/<id>` | cook from it | Recipe | none (read-only, cooking) | week | most evenings | F2 |
| recipes | `#recipes` | browse saved recipes | Recipe | Add to a night | recipe, pick | weekly | — |
| list | `#list` | shop by aisle | List item | Tick items | week | weekly | F3 |

## 5. State matrix
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| week | first-use: 7 empty nights, "Plan this week" / tap a night. Cleared night: "Nothing planned" + Plan | skeleton of 7 night rows (>300 ms) | "Couldn't load this week" + Retry; nav still works | some nights unsaved: inline "Not saved · Retry" per night; offline banner | 7 nights, long recipe names wrap to 2 lines | n/a: one household, all members edit (no roles) |
| pick | no-results: "No recipe called 'x'" + clear search | inline list skeleton | "Recipes didn't load" + Retry, sheet stays open | — | dozens, filter field | n/a |
| recipe | n/a (always has content) | skeleton of ingredient list | inline error + Retry; Back works | photo missing → labelled slot | long steps scroll | n/a |
| recipes | first-use: "No recipes saved yet" | card skeleton | Retry | — | dozens | n/a |
| list | no dinners planned: "Your list fills as you plan dinners" + go to week; all ticked: "All aisles done" | skeleton | Retry | offline: ticks local | 50 items, 8 aisles | n/a |

## 6. Cross-screen consistency rules
- Primary action: one ink button per screen, bottom of the tonight card on week; in sheets, the tapped row is the action.
- Nights are rows (a week reads top to bottom like a fridge list), recipes are cards with photo slots.
- Destructive: clear night / clear ticked are quiet text actions with undo; never red buttons.
- Feedback: toast for undoable results; inline for per-night save errors; banner for offline.
- Dates via Intl; servings default 3 (household).

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Night → recipe (drill-in) | panel enters from trailing edge (desktop: right panel) | exits to trailing edge | 300 ms / 220 ms |
| Tabs | cross-fade | cross-fade | 150 ms |
| Pick sheet | rises from bottom (phone) / pops from the night (desktop) | back down | 320 ms / 220 ms |
| Night filled | content cross-fades in + ingredient chip count ticks | — | 200 ms |

- **Expressive moments (≤3):** (1) "Week planned": the seven-night strip fills left to right once when the 7th dinner lands (Sunday, once a week). (2) the shopping-list count rolls up as a dinner is added (each plan action, short). — D7
- **RTL:** n/a (en only), logical properties used anyway.
- **Reduced motion:** spatial moves become opacity cross-fades.

## 8. Decisions
- D1 — key screen = This week, tonight first
- D2 — bottom tabs / labelled rail
- D3 — nights as rows, not a 7-column grid
- D4 — list grouped by aisle in shop order
- D5 — undo over confirm
- D6 — search only inside picker & recipes
- D7 — expressive moments
