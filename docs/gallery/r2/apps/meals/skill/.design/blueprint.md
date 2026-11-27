# Blueprint — Supper

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; build covers the key screen (This week) with its sheets and states

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Week | dates (Mon–Sun), evenings planned x/7 | view · move to next/prev | has 7 evenings | 1 current + history |
| Evening (dinner) | day, recipe or "night off", who's cooking, cook time | plan · swap · move · clear (undo) · mark night off | belongs to Week; points to Recipe | 7 per week |
| Recipe | name, total time, servings, tags (veg, quick), photo | view · cook · add to week | used by Evenings; has Ingredients | ~40–80 |
| Ingredient line | quantity + unit, name, aisle | — | belongs to Recipe; rolls up into Shopping list | ~8–14 per recipe |
| Shopping list | items grouped by aisle, x of y got | tick · untick · add extra · clear ticked (undo) | derived from the week's Evenings + extras | ~30–50 items |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Plan the week | Evening, Recipe | weekly | 2 (tap evening → pick recipe) |
| 2 | Open tonight's recipe | Evening, Recipe | most evenings | 1 (tonight is pinned at top) |
| 3 | Shop by aisle | Shopping list | 1–2×/week | 1 (tab) |
| 4 | Swap/move a dinner | Evening | ad hoc | 2 |

### Destinations & sitemap
```
This week (home, hub)
├─ Evening → Pick a dinner (sheet)
├─ Recipe (drill-in: ingredients + steps, "cooking mode")
Recipes
└─ Recipe
Shopping list (grouped by aisle)
Household (secondary: members, dietary notes, store aisle order)
```

## 2. Navigation model — D1
- **Model:** bottom tab bar on phone (This week · Recipes · List); on ≥ 1024px a left rail with the same three destinations in the same order, plus Household at the foot.
- **Why:** 3 primary destinations, phone-first, used several times a week [ia-nav.nav-model-by-count, ia-nav.visible-destinations, a11y.target-size]
- **Current location shown by:** active tab (filled icon + ink label), page title matching the label.
- **Responsive:** bottom tabs < 1024 → left rail ≥ 1024 (desktop also shows the week and the shopping-list preview side by side).
- **Back behaviour:** browser back closes sheets and returns from recipe to the week; hash reflects the view (#week, #recipe/<id>).
- **Search:** inside the "Pick a dinner" sheet only (dozens of recipes) [ia-nav.search-vs-browse].

## 3. Key flows

### F1 — Plan the week (Sunday)
- **Entry:** This week, Sunday; banner "Next week starts tomorrow" with week switcher.
- **Happy path:**
  1. This week — tap an unplanned evening ("Plan Wednesday") → Pick-a-dinner sheet rises from the bottom, suggestions first (not used in last 2 weeks), search field.
  2. Sheet — tap a recipe → sheet closes, evening fills in place (optimistic), list count updates "+6 items".
  3. Repeat; seventh evening planned → signature moment (week "set": the menu card is stamped "This week is set") and the list total.
- **Error paths:**
  - Step 2 save fails (offline) → evening rolls back visibly, inline message on that evening "Couldn't save Wednesday. Try again" with Retry; the pick is kept in the retry.
  - Step 1 recipes fail to load → sheet shows error with Retry; "Mark as night off" still works.
- **Undo / confirm:** clearing an evening → undo toast 8s — D4
- **Exit:** This week fully planned; status line "7 of 7 evenings planned · 38 items on the list".

### F2 — Cook tonight
- **Entry:** This week, any weekday evening; "Tonight" is the top, largest block.
- **Happy path:** 1. Tap "Cook tonight's dinner" → recipe drills in (forward). 2. Ingredients with quantities for 3, steps numbered, screen kept awake toggle. 3. Back → week.
- **Error paths:** recipe fails to load → in-place error in the recipe panel with Retry; the week stays.
- **Exit:** back on the week; tonight marked "Cooked" (optional tick).

### F3 — Shop by aisle
- **Entry:** List tab, or "38 items · open list" from the week.
- **Happy path:** 1. List grouped in the household's store order (Produce → Bakery → Dairy → Meat & fish → Pantry → Frozen). 2. Tick items; aisle collapses when done. 3. "Clear ticked" when home.
- **Error paths:** tick fails to sync → item stays ticked locally, aisle shows "Not synced yet" dot; retries on reconnect.
- **Undo / confirm:** untick by tapping again; "Clear ticked" → undo toast — D4.

### F0 — First run
- Empty week: seven evenings listed, each "Not planned", primary "Plan Monday", helper "Pick 7 dinners and your shopping list builds itself, sorted by aisle."

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| week | #week | see and plan this week's dinners | Evening | Plan next empty evening / Cook tonight's dinner | pick-sheet, recipe, list | several/week | F0 F1 F2 |
| pick-sheet | (sheet) | choose a dinner for one evening | Recipe | tap a recipe (choose) | week | weekly | F1 |
| recipe | #recipe/<id> | cook from it | Recipe | Start cooking (keep screen on) | week | most evenings | F2 |
| recipes | #recipes | browse the collection | Recipe | Add a recipe | recipe | rare | — |
| list | #list | shop by aisle | Item | tick items | week | 1–2×/week | F3 |
| household | #household | members, notes, aisle order | Household | Save | — | rare | — |

## 5. State matrix (key screen + its children built)
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| week | first-use: 7 "Not planned" evenings, "Plan Monday" / tap it. Cleared (all evenings removed) same + undo toast | skeleton of 7 evening rows (>300ms) | "Couldn't load this week" + what's kept (last synced copy shown if any) + Retry | 4 of 7 planned: progress "4 of 7", next empty evening is the primary action; offline: "Showing your last saved plan" banner | 7 planned; long recipe names wrap 2 lines; nights off allowed | n/a: household app, everyone in the household can edit (no roles) |
| pick-sheet | no-results: "No recipe matches 'lasagne'" + "Clear search" | skeleton rows | "Recipes didn't load" + Retry; night-off still available | — | ~60 recipes, search + suggestions | n/a |
| recipe | n/a (always has a recipe) | skeleton | inline error + Retry, back works | missing photo → labelled slot | long ingredient list scrolls | n/a |
| list | first-use: "Nothing to buy yet. Plan a dinner and its ingredients land here." | skeleton | error + Retry | not-synced dot | all ticked: "All done. Clear ticked?" | n/a |

## 6. Cross-screen consistency rules
- Primary action: one ink (near-black) button per screen, at the end of the focal block; on phone it's full-width in thumb reach.
- Evenings are rows on a ruled sheet (not cards); recipes in the sheet are rows with a small square photo.
- Destructive: "Clear evening", "Clear ticked" are quiet text actions; always undo toast, never confirm dialog.
- Feedback: inline on the affected evening for errors; toast for undo; status line under the week title for totals.
- Forms: labels above, validate on blur (only search + household notes here).
- Quantities: tabular figures, unit quieter than the number, scaled for 3 servings.

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Drill-in (week → recipe) | forward: enters from trailing edge 24px + fade | back reverses | 250ms |
| Sibling destinations (tabs) | cross-fade | same | 150ms |
| Overlay (pick-sheet) | rises from bottom (phone) / from its evening row as popover-sheet on desktop | exits down | 300ms in / 200ms out |
| Evening fill | new dinner fades + settles 4px | clear: fade out, row stays | 200ms |
| List tick | strike line draws, item dims | untick reverses | 150ms |

- **Signature moment:** seventh evening planned → the "menu card" is set: a pen-stroke underline draws under "This week is set" and the week's dinner names cascade once (D6).
- **RTL:** logical properties; horizontal drill mirrors.
- **Reduced motion:** spatial moves become opacity cross-fades; stroke draws instantly.

## 8. Decisions
- D1 — bottom tabs / left rail, three destinations
- D2 — This week is home; Tonight is its focal block
- D3 — evenings as ruled rows, not a 7-card grid
- D4 — undo toast over confirm for clear evening / clear ticked
- D5 — shopping list in store-aisle order, derived from the plan
- D6 — signature moment: week set
