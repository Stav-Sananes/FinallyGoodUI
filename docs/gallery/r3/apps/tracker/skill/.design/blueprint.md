# Blueprint — Docket

status: approved (self-approved, autonomous run)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; built in this run: the key screen (Issues list + side panel) with its overlays and states

Mental model (non-negotiable 10): *"Every morning there's a pile of new issues; I give each one a priority and an owner, then I work down my own column: what's mine, what's next."* The layout mirrors that: an inbox-like Triage queue and a list grouped by status (the way engineers say "in progress", "todo"), not a table of database columns.

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Issue | key (ING-214), title, priority P0–P3, status, assignee, labels, updated | create · view · edit status/priority/assignee/labels · comment · close (done / duplicate / won't fix) · copy link | belongs to Team; has many Comments; links to PRs (text) | hundreds open, ~1,500/yr |
| Comment / activity | author, time, body; system events ("Maren set P1") | add · edit own | belongs to Issue | ~5 per issue |
| View (saved filter) | name, filter set, count | open · save current filter | belongs to Team | ~6 |
| Member | name, initials, open count | assign | 6 people | 6 |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Triage new issues | Issue | daily | 1 (Triage view) |
| 2 | Work the filtered list | Issue, View | many/day | 0 (home) |
| 3 | Read/update selected issue in side panel | Issue, Comment | many/day | 1 (select row) |
| 4 | Command palette | all | many/day | 0 (⌘K anywhere) |
| 5 | File an issue | Issue | few/day | 1 (C) |

### Destinations & sitemap
```
Issues (home: list + side panel)          ← key screen
├─ Triage (view: status = Triage)
├─ My issues (view: assignee = me)
├─ All open (view)
├─ Saved views (Backlog P0–P1, Waiting on review, …)
│  └─ Issue (side panel, deep-linkable ?issue=ING-214)
├─ New issue (dialog)
├─ Command palette (overlay, ⌘K)
├─ Shortcuts sheet (overlay, ?)
└─ Settings (secondary: members, labels, keyboard)
```

## 2. Navigation model — D1
- **Model:** persistent left rail of views (Triage, My issues, All open, saved views) + command palette as the search-first path.
- **Why:** desktop-first, many times a day, 3 primary views + ~4 saved views (≈7) → sidebar with labels; experts + keyboard → palette for everything. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.search-vs-browse, usability.keyboard-shortcuts]
- **Current location shown by:** active rail item (hazard bar), view title + count in the toolbar, selected row mark, URL.
- **Responsive:** ≥1100px three panes (rail · list · panel); 768–1099 rail collapses to an icon strip with labels on focus/hover, panel overlays the list; <768 rail becomes a top view switcher (select), panel becomes a full-screen sheet with a Back control.
- **Back behaviour:** closing the panel (Esc) = back one step; URL holds view, filters, selected issue.
- **Search:** ⌘K palette (issues by key/title + all commands); / focuses the list filter.

## 3. Key flows

### F1 — Morning triage
- **Entry:** open Docket → G then T (or click Triage). Triage count shown in rail.
- **Happy path:**
  1. Triage view — first issue auto-selected, panel open → reads.
  2. Panel — presses 1–4 (priority) → row updates instantly, toast "ING-231 set to P1 · Undo (Z)".
  3. Panel — A → assignee menu at the field, types "ma" → Enter → Maren.
  4. Panel — S → status menu → Todo → issue leaves Triage; selection moves to the next issue.
  5. Last issue triaged → **Triage cleared** moment (expressive moment 1), "Triage clear. 9 issues sorted, 6 min." with the link "Go to my issues".
- **Error paths:** sync fails (offline / 500) → row rolls back, toast "Couldn't save P1 on ING-231. Retry (R)"; nothing else lost.
- **Undo / confirm:** every mutation is undoable from the toast for 8 s or with Z — D4.
- **Exit:** Triage cleared state, count 0 in the rail.

### F2 — Work the filtered list
- **Entry:** My issues (G M) or filter chips (F opens filter menu: status / priority / assignee / label).
- **Happy path:** J/K move selection → panel follows instantly → S changes status → issue moves group in place (FLIP, 150ms) → selection stays on the next row.
- **Error paths:** filter yields nothing → no-results empty with "Clear filters"; list load fails → list-scoped error with Retry, rail and panel stay.
- **Exit:** list reflects changes; URL encodes filters.

### F3 — Command palette
- ⌘K → type "assign maren" or "ING-2" → arrow/Enter → action runs on selected issue or jumps. Esc closes, focus returns. Empty query shows recent issues + top commands.

### F4 — First run
- No issues yet → empty list: "No issues yet. Issues your team files land here, newest first." + "New issue (C)" + "Import from CSV…" (honest secondary). Panel shows the shortcut cheat-sheet.

### F5 — Accidental close / reassign (risks.failure)
- X closes as done (or menu: duplicate / won't fix) → row leaves list, toast with Undo for 8 s, Z restores at the same index with selection. No confirm dialogs. — D4

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| issues | /?view=… | list grouped by status + filters | Issue | New issue | panel, palette, views | many/day | F1 F2 F4 F5 |
| issue-panel | /?view=…&issue=ING-214 | read/update one issue | Issue | Change status (S) | assignee/priority menus, comments | many/day | F1 F2 F5 |
| new-issue | dialog | file an issue | Issue | Create issue | issues | few/day | F4 |
| palette | overlay | jump/run anything | Command | Run highlighted | everything | many/day | F3 |
| shortcuts | overlay | learn keys | — | none (read-only) | — | rare | — |
| settings | /settings | members, labels | — | not built this run (out of scope; not linked) | — | rare | — |

## 5. State matrix
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| issues | first-use: teaches + New issue; no-results: names active filters + Clear filters; Triage cleared: the moment + "Go to my issues" | skeleton rows (layout-matched) after 300ms delay, min 400ms | list-scoped: "Couldn't load issues. Your filters are kept." + Retry; rail stays | stale: "Offline: showing issues as of 09:14" bar, edits queued | 200+ rows: groups collapse beyond 50 with "Show 34 more"; long titles truncate with full title in title attr | read-only guest: rows readable, mutating keys show "Only team members can change issues. Ask Priya (admin)." |
| issue-panel | nothing selected: shortcut primer | skeleton of fields/description | "Couldn't load ING-214." + Retry; list unaffected | missing fields render "No description" / "Unassigned", never undefined | long description scrolls inside panel; 40+ activity items collapse | fields shown read-only with lock note |
| new-issue | — | Create button "Creating…" spinner | inline: title required on blur; submit fail keeps input + message | — | — | n/a (only members see C) |
| palette | no match: "No issue or command matches 'xyz'." + "Create issue 'xyz'" | instant (local) | n/a: local data | — | top 8 results, grouped Issues / Commands | mutating commands hidden for guests |

## 6. Cross-screen consistency rules
- Primary action: "New issue" top of the list toolbar; in the panel, status is the primary control (first field).
- Issues are always rows, never cards; the panel is the only "detail" form.
- Destructive (close / won't fix) are undoable, styled as ordinary actions; no red buttons except error states.
- Feedback: optimistic in place + toast with Undo for mutations; inline for field errors; region-scoped banners for load errors.
- Every action shows its shortcut in <kbd> next to its label (menu, tooltip, palette).
- Keys: J/K move, Enter/O open, Esc close, S status, P priority (1–4 direct), A assign, L label, X close, C new, ⌘K palette, / filter, ? shortcuts, Z undo, G T / G M / G A views.
- IDs, keys, times in mono; everything else in the UI sans.

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Select row (keyboard) | panel content swaps instantly; selection mark moves 0ms | — | 0ms (keyboard, 100+/day) |
| Open panel (from no selection) | panel slides from trailing edge 8px + fade | exits same way | 150ms |
| Status change moves row between groups | FLIP move | — | 150ms move |
| Menus / popovers | from trigger, scale 0.97 + fade | reverse at 70% | 120ms |
| Palette / dialog | fade + scale 0.98 from centre-top | reverse | 150ms / 100ms exit |
| Toast | rises from bottom-left | falls | 150ms |

- **Expressive moments (≤3):** (1) Triage cleared — the triage queue counter runs down to 0 and the empty state "stamps" in (400ms) — D7. (2) First paint of the day: the rail count for Triage counts up once (400ms). Nothing else.
- **RTL:** n/a (en only), logical properties used anyway.
- **Reduced motion:** moves become opacity cross-fades; counters jump.

## 8. Decisions
- D1 — Left rail of views + ⌘K palette
- D2 — List grouped by status, rows not cards, panel to the right
- D3 — Keyboard model and visible shortcut hints
- D4 — Undo over confirm for every mutation
- D5 — URL holds view, filters, selected issue
- D6 — Phone: view select + full-screen panel sheet
- D7 — Expressive moments: triage cleared, first-paint triage count
