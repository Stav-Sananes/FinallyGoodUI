# Blueprint — Tracker

status: approved (self-approved, autonomous)
date: 2026-11-16
brief: .design/brief.md (2026-11-16)
scope: whole app; built screen = issue list + side panel (desktop key screen)

Mental model (non-negotiable 10): "Every morning I clear the triage pile, then I work down my list: what's on fire, what's mine, what's waiting on review. An issue is one line I can read in a glance; I open it beside the list, change one thing, and move to the next with J."

## 1. Information architecture

### Objects
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| Issue | key (ENG-142), priority, title, labels, assignee, status, age/updated | create · view · edit status/priority/assignee/labels · comment · accept/decline (triage) · delete (undo) | belongs to team ENG; has comments, activity, linked PR | hundreds (60–120 open) |
| Person | initials monogram, name, handle | assign, filter by | 6 members | 6 |
| View (saved filter) | name, count | open, save current filters | owns a filter | ~3–6 |
| Comment | author, time, text | add | belongs to issue | 0–20 per issue |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | Triage new issues | Issue | daily, morning | 1 (Triage in sidebar, G T) |
| 2 | Filter list by status/priority/assignee | Issue, View | many/day | 1 (F, or filter chips) |
| 3 | Open issue, change status/priority/assignee | Issue | many/day | 2 (row → panel → S/P/A) |
| 4 | File new issue | Issue | few/day | 1 (C) |
| 5 | Command palette | all | many/day | 1 (⌘K) |

### Destinations & sitemap
```
Triage                    (G T)  inbox of new, unsorted issues
My issues                 (G M)  assigned to me, grouped by status
All issues                (G A)  team list, grouped by status, filterable  ← key screen
  └─ Issue (side panel)          opens beside the list; URL ?issue=ENG-142
Views (sidebar group)            saved filters: "Urgent and high", "In review", "Unassigned"
Settings (secondary, not in this build: shown disabled "Not in this preview")
Command palette (overlay, ⌘K)    every action and destination
```

## 2. Navigation model — D1
- **Model:** persistent left sidebar (3 primary destinations + saved views group) + command palette
- **Why:** desktop-first, daily, 3 destinations + views → visible sidebar; keyboard-first audience → palette as the fast path [ia-nav.nav-model-by-count, ia-nav.visible-destinations, ia-nav.search-vs-browse, usability.keyboard-shortcuts]
- **Current location shown by:** active sidebar item (aria-current), page title matching label, count
- **Responsive:** ≥1024 sidebar + list + panel; 768–1023 sidebar collapses to icon rail, panel overlays list; <768 top bar with destination tabs, panel becomes full-screen detail with back
- **Back behaviour:** Esc closes panel; browser back closes panel (URL state)
- **Search:** command palette (⌘K) searches issues + actions; "/" focuses list filter

## 3. Key flows

### F1 — Morning triage
- **Entry:** sidebar Triage (count badge) or G T
- **Happy path:**
  1. Triage list — first issue auto-selected → panel shows report
  2. Panel — set priority (P / 1–4), assignee (A) → inline, optimistic
  3. Panel — Accept (Enter on "Accept to Todo", shortcut 1… no: shortcut `Y`) → issue leaves triage, next issue selected
  4. Or Decline (`N`) with optional reason / Mark duplicate
  5. Last one → "Triage clear" signature moment
- **Error paths:** save fails → row returns to triage, toast "Couldn't accept ENG-151. Retry" with retry; input kept
- **Undo / confirm:** undo toast (Z) for accept/decline — D5
- **Exit:** triage count 0, cleared empty state

### F2 — Work the filtered list
- **Entry:** All issues / My issues / a View
- **Happy path:** 1. press F or click filter chip → menu with status/priority/assignee → toggle → list updates instantly, URL updates. 2. J/K move selection, panel follows. 3. "Clear filters" resets.
- **Error:** no results → no-results empty state with "Clear filters"
- **Exit:** filtered list; counts per group

### F3 — Change an issue
- **Entry:** selected issue in panel
- **Happy path:** S → status menu (type to filter, Enter) → status changes optimistically, row moves group, toast "ENG-142 moved to In review · Undo"
- **Error:** sync fails → roll back, toast with retry
- **Exit:** row in new group, panel stays open

### F4 — File an issue
- **Entry:** C anywhere, "New issue" button
- **Happy path:** dialog: title (required), description, priority, assignee (defaults: Triage, no priority) → ⌘Enter "Create issue" → row appears at top of Triage, toast with key
- **Error:** empty title → inline error on blur/submit; network fail → dialog stays with input, error inline
- **Exit:** new issue selected

### F5 — Delete (risks.failure)
- panel ⋯ → Delete issue → removed immediately with undo toast (10s); focus to next row [usability.user-control-undo]

## 4. Screen inventory
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| triage | ?view=triage | sort new issues | Issue | Accept | panel | daily | F1 |
| my-issues | ?view=mine | my work | Issue | New issue | panel | many/day | F2,F3 |
| all-issues | ?view=all | team list (key) | Issue | New issue | panel | many/day | F2,F3 |
| issue-panel | &issue=KEY | read + edit one issue | Issue | Change status | list | many/day | F1,F3,F5 |
| new-issue | dialog | file issue | Issue | Create issue | triage | few/day | F4 |
| palette | overlay | do anything | all | run command | all | many/day | all |
| shortcuts | overlay (?) | learn keys | — | none (read-only) | — | rare | — |

## 5. State matrix
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| triage | cleared: "Triage clear" + count of accepted today / C to file | skeleton rows (≥300ms delay) | "Couldn't load triage" + Retry, sidebar intact | offline: banner "Offline. Showing issues from 9:12. Changes will sync." | 6 new | n/a (all members triage) |
| all-issues | first-use: "No issues yet" + New issue; no-results: "No issues match Status: Done, Assignee: Noa" + Clear filters | skeleton rows mirroring groups | list area error + Retry; filters kept | offline banner; stale "Synced 4 min ago" | ~40 rows, 5 groups; long titles truncate with title attr | n/a |
| my-issues | cleared: "Nothing assigned to you" + browse All | skeleton | same as all | same | ~9 | n/a |
| issue-panel | nothing selected: "Select an issue. J and K move." | panel skeleton | "Couldn't load ENG-142" + Retry inside panel only | comments failed: inline note | full | restricted issue (label Security): "Only the security rota can see ENG-097. Ask Dana Okafor for access." |
| palette | no match: "No commands match 'xyz'" | n/a (local) | n/a (local) | n/a | grouped results | n/a |
| new-issue | — | button spinner "Creating…" | inline error, input kept | n/a | — | n/a |

## 6. Cross-screen consistency rules
- Primary action: ink button top-right of list header ("New issue  C"); panel primary = status control
- Issues are always rows (never cards); 36px row height
- Destructive: only Delete, in panel ⋯ menu, red text, undo toast instead of confirm
- Feedback: optimistic + toast with Undo for edits; inline for fields; banner for offline
- Every action shows its key as a keycap next to it (menu items, buttons, tooltips)
- Forms: labels above, validate on blur

## 7. Motion spatial map
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Open issue (list → panel) | panel slides in from trailing edge 16px + fade, first open only; switching issue: instant content swap | Esc: panel exits to trailing edge | 150ms / exit 100ms |
| J/K selection | none (instant) | — | 0 (keyboard, 100+/day) |
| Sibling destinations | instant swap, no animation | — | 0 |
| Overlay (palette, dialog) | scale .97→1 + fade from centre-top | reverse at 70% | 150ms / 100ms |
| Menu (status/priority/assignee) | scale .95→1 from trigger | fade | 150ms |
| Row moves group | item exit fade 100ms; arrival highlight wash fades | — | ≤150ms |
| Toast | rise from bottom 8px + fade | fade | 150ms |

- **Signature moment:** "Triage clear" — when the last triage issue is accepted, the triage count rolls to 0 and the cleared state draws the stamped check — D7
- **RTL:** n/a (en only); logical properties used anyway
- **Reduced motion:** spatial moves become opacity fades

## 8. Decisions
- D1 — sidebar + command palette
- D2 — key screen composition: list + side panel (fixed by brief)
- D3 — rows not cards, 36px dense
- D4 — status grouping in All issues
- D5 — undo over confirm
- D6 — URL holds view, filters, open issue
- D7 — signature moment: Triage clear
