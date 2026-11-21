# Round 4 briefs: four apps, four frameworks

Each brief is built twice: `skill/` follows the finally-good-ui skill (including its component flow), `control/` is one prompt with no skill. Same brief, same framework, same toolchain for both sides.

| App | Framework | Brief (one line, given verbatim to both sides) |
|---|---|---|
| finance | React 19 + Vite + TypeScript, with `radix-ui` installed on both sides | Studio finance: the owner of a small design studio takes a Monday look at cash, runway, overdue invoices and payroll. |
| booking | Svelte 5 + Vite | Salon booking: dog owners pick a time for a groom, on their phone. |
| tracker | Angular (latest stable CLI, standalone components) | Issue tracker: a six-person team triages its issue list from the keyboard. |
| meals | Vue 3 + Vite + TypeScript | Meal planner: a household of three plans the week's dinners and shops by aisle. |

Rules for both sides:
- A real, running app in that framework: dev server and `npm run build` must both work; no single-file shortcuts, no CDN scripts.
- Real domain content (names, numbers, dates, statuses), at least one realistic data set of 8-15 items, working interactions for the key flow, and every empty/loading/error state a user can reach.
- Output directory: `docs/gallery/r4/apps/<app>/<skill|control>/`. `node_modules/` and `dist/` are never committed.
- The skill side runs the skill in autonomous mode with `directions: one` and `verify: static` (no browser in the builder); the control side must not read or invoke the skill or any design skill.
