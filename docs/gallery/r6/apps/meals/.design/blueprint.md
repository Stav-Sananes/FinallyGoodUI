# Blueprint: Larder Board
Navigation (amended by the direction's Skeleton, see decisions D-2): a left spine of four places on desktop, a bottom bar on the phone. No top bar.

## Screens
| id | Screen | Route | Purpose |
|---|---|---|---|
| S1 | Plan (landing) | / | The week board (signature) with seven dinner lines; the aisle walk summary beside it |
| S2 | Recipes | /recipes?r=<id> | Twelve recipes as lines; the open one shows its ingredients by aisle and chalks onto a chosen night |
| S3 | Shop | /shop | The whole list in store-walking order, check off, add an item, hide what is in the pantry |
| S4 | Household | /household | Three people: name, food rules, usual seats, dinners cooked this week |

## Key flows
- F1 Plan the week (key): S1 open night -> "Chalk in" dialog (recipes with minutes and a note on who cannot eat what) -> pick -> line updates, headline count and the aisle walk update live -> toast with Undo.
- F2 Seats and cook: S1 tap a seat to take a person off a night (portions drop, list recomputes); tap the cook name to pass the pan.
- F3 Shop: S3 walk aisles in order, check items; add a missing item; hide pantry items.
- F4 Household rules: S4 set a food rule; S1 and S2 warn on conflicts.

## State matrix
| Screen | empty | loading | error | partial | full | no-permission |
|---|---|---|---|---|---|---|
| S1 | "Nothing chalked yet" with the chalk-in action on the first night (?state=empty or Clear week) | board ruled lines as skeleton (?state=loading) | "The board did not load" + Try again (?state=error) | two nights open (seed) | all seven chalked: headline says so | n/a (no accounts) |
| S2 | no recipe open: prompt to choose one | skeleton lines | same error as S1 | n/a | recipe open | n/a |
| S3 | "Nothing to buy: chalk in a dinner first" | skeleton aisles | error + Try again | some checked | all checked: "Basket done" line | n/a |
| S4 | n/a | skeleton | error | n/a | three people | n/a |

Forced states: `?state=empty|loading|error` on any route.
