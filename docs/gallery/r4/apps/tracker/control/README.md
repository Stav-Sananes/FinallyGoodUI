# Tracker (control)

Angular 21 (standalone components, signals, plain CSS) - the latest CLI (22) needs a newer Node than the installed 24.11, so the 21 LTS CLI was used.

Issue tracker for a six-person team, triaged entirely from the keyboard: j/k move, x/J/K select, s/p/a/l pick status/priority/assignee/label (number keys or arrows+Enter), m take, d done, e archive, u undo, c new, / search, 1-5 views, ? help.
12 realistic issues; changes persist in localStorage; undo stack; detail pane; skeleton loading, load-error with Retry (open with `?fail` to see it once), offline banner, empty states for every view and search, create-form validation.

Shortcuts: no backend (data is seeded, "load" is a simulated 900 ms delay); no routing; no unit tests; budgets raised for the single stylesheet.
Run: `npm install && npm start` (dev) or `npm run build`.
