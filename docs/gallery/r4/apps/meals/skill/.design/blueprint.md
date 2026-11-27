# Blueprint: Supper Board
status: approved (self-approved, autonomous 2026-11-22)

## Objects
Dinner (name, minutes, serves, tags, ingredients[{name, qty, unit, aisle}]); Night (day, dinnerId, cook); Shopping line (derived: name, total qty, unit, aisle, from which dinners, ticked, have-at-home); Person (Maya, Daniel, Noa).

## Navigation (D1)
3 primary destinations (Week, Dinners, Shop), both-devices: top bar >=768px, bottom tab bar <768px, same order, current marked with aria-current. [ia-nav.visible-destinations, ia-nav.wayfinding-location]

## Flows
1. Plan the week. Week: tap "Add dinner" on an empty night -> Dialog "Pick a dinner" (search field, list) -> choose -> night shows dinner + cook chip -> toast. Errors: none to lose; search no-results state. Exit: all seven nights filled -> a completion line "Week's set. 14 things to buy in 5 aisles" linking to Shop.
2. Change a night: night menu (Swap dinner, Who cooks > Maya/Daniel/Noa, Remove) -> remove shows Undo toast (8s). 
3. Shop: Shop tab; Tabs "By aisle | By dinner"; aisle disclosures with tick toggles; "Have at home" switch per line hides it from the count; add own line via field (name+qty, validation). Exit: all ticked -> "All done" state.
4. First run / empty: cleared week -> Week empty state with "Start from last week's plan" and "Add a dinner"; Shop empty ("Nothing to buy yet").
5. Dinners: browse, filter by search, add own dinner (dialog with field set) -> appears in picker.

## Screens
| id | route (hash) | primary action | frequency |
|---|---|---|---|
| week | #/week | Add dinner / swap | weekly + daily |
| dinners | #/dinners | Add a dinner | weekly |
| shop | #/shop | Tick off a line | weekly |
| picker | dialog on week | Choose dinner | weekly |
| new-dinner | dialog on dinners | Save dinner | rare |

## State matrix
| screen | empty | loading | error | partial | full |
|---|---|---|---|---|---|
| week | cleared: teach + "Start from last week" / "Add dinner" | skeleton of 7 rows (first load of saved plan) | saved plan unreadable: say what is kept, "Try again" / "Start a fresh week" | some nights empty: dashed hang-tag slots | 7 nights + completion line |
| dinners | no dinners cannot happen (seeded); no-results for search: say so + clear search | skeleton cards | n/a: local data, shares the week's load error | n/a | 12 dinners |
| shop | no nights planned: "Plan a dinner first" link | skeleton lines | "Couldn't sync with the household" after Sync fails while offline: retry, list stays usable | some ticked: count "6 of 14" | all ticked: "All done" moment |
| picker | no-results | n/a | n/a | filtered | full list |
Error reachability: week load reads localStorage and fails when stored JSON is corrupt (real); Sync button on Shop fails when the browser is offline (navigator.onLine false) and otherwise succeeds.

## Cross-screen rules
Primary action top-right of the content (bottom on phone sticky only for Shop add). Labels above inputs. Destructive: undo toast, except "Clear week" (confirm dialog, specific consequence). Feedback via toast for undoable, inline for validation.

## Motion spatial map
Peers (tabs/destinations) cross-fade, instant on daily Week. Dialog scales/fades from its opener, <=250ms. Aisle disclosure grows in height (grid-rows trick). Expressive moments (max 2): week-complete tag swings on its string (once); All-done on Shop. Reduced motion drops transform.
