# Blueprint: Tracker
status: self-approved (autonomous)

## 1. Information architecture
Mental model sentence: "I stand at the bay with a rack of strips; the lit one is mine to decide, then I step to the next."
- Issues (the app): queue views as tabs: Untriaged · Mine · All. One screen, one detail dialog.
- Objects: issue {id, title, priority (urgent/high/normal/low/none), assignee, status (open/in progress/closed), reporter, age, area}.

## 2. Navigation model: D1
- Model: single screen, top bar + tabs for queue views (3 destinations, daily use; ia-nav.nav-model-by-count). No sidebar.
- Location: active tab + page heading with count. URL holds tab and search (`?q=&view=`) (ia-nav.url-as-state).
- Responsive: tabs scroll horizontally on phone; keys hint footer hides under 640px; strips reflow to two lines.
- Back: browser back changes tab; dialogs close on Escape.
- Search: per collection, `/` focuses it.

## 3. Key flow: triage from the keyboard
- Entry: Untriaged tab (default). Cursor sits on the first strip.
- Happy path: `j/k` move cursor -> `1-4` set priority (urgent..low) -> `a` opens assignee menu, arrows+Enter or a letter -> `s` cycles status / `x` closes -> cursor advances to next untriaged -> repeat. `Enter` opens the issue; `n` new issue; `/` search; `u` or Ctrl+Z undo; `?` shortcuts.
- Error paths: save fails when offline -> change rolls back, error toast with Retry; list load fails -> error panel with Retry.
- Undo: toast with Undo for 10s on every change (D2: undo beats confirm for fast flows).
- Exit: Untriaged empty -> "Bay clear" empty state.

## 4. Screen inventory
1. Issues (list + tabs + search + footer hints). 2. Issue dialog (detail, edit title, priority, assignee, status). 3. New issue dialog (field validation). 4. Shortcuts dialog. 5. Toasts. 6. Assignee/priority menu (menu component).

## 5. State matrix (Issues screen)
| Cell | Where | Built |
|---|---|---|
| loading | skeleton strips on first load and on `r` refresh | yes |
| empty: Untriaged cleared | "Bay clear" | yes |
| empty: Mine, nothing assigned | "Nothing on your board" | yes |
| empty: search/filter no match | "No strip matches" + clear | yes |
| error: load failed | panel + Retry | yes |
| error: save failed | rollback + toast Retry | yes |
| partial: some untriaged | normal | yes |
| full | 12 issues | yes |
| no-permission | n/a (single team) | n/a |
Forced states for review: `?state=loading|error|empty`.

## 6. Consistency rules
Priority always = tab colour + word; ids in mono tabular; assignee as initials monogram; verbs first in actions.

## 7. Motion spatial map
Tabs crossfade (peer). Dialog scales from 96% + fade (100-150ms). Cursor strip lifts 2px and gets the amber ring. Signature moment: when the last untriaged strip is cleared, the rack's tabs sweep once and "Bay clear" settles in (hero token, once). Reduced motion: opacity only.
