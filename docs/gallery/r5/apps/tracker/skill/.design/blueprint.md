# Blueprint: Sorting Office
Mental model: "A pile of letters lands in one tray. I pick each up, stamp how urgent it is, and drop it in the right person's pigeonhole." The layout mirrors that, not the issues table.

## Navigation
Single workspace, three peer views (tabs, state in URL `?view=`): Intake (untriaged), Mine, All. Search in URL `?q=`. No routing between pages; a dialog for New issue and Shortcuts. [ia-nav.url-as-state, ia-nav.wayfinding-location]

## Screen: Desk (the one screen)
Regions (5): header (wordmark, sync stamp, theme note) · view tabs + search + "show closed" toggle · the tray (list of issues, one lit) · the pigeonholes (six cells, one per teammate, with load counts; key digit shown) · the letter (selected issue detail with activity disclosure) · shortcut bar.
Flow 1 (key): j/k move; u/h/m/l/- set priority (urgent/high/medium/low/none); 1-6 sort into pigeonhole N; 0 back to intake; s step status; x close; z undo; c compose new; / search; r refresh; ? help; Enter focuses the letter. The cursor advances after an Intake item is fully sorted.
Flow 2: Compose dialog (title required, area optional) -> issue appears at top of intake with toast.
Flow 3: failed save -> rolled back, error toast with Retry. Offline makes saves/loads fail for real.

## State matrix (Desk)
| Region | loading | empty | error | partial | full |
|---|---|---|---|---|---|
| Tray | skeleton letters | "Intake clear" reward (hero moment) / "No match" for search | error panel + Retry (r) | -- | list |
| Pigeonholes | skeleton counts | zero counts | hidden with tray | -- | counts |
| Letter | skeleton | "Pick up a letter with j" | -- | unassigned/none shown as dashed | detail |
Forced for review: `?state=loading|error|empty`.

## Decisions
See decisions.md.
