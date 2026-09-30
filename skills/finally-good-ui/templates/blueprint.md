# Blueprint — <App or feature name>

<!-- Written by modules/blueprint.md from .design/brief.md. Decisions referenced as D<n> live in .design/decisions.md. Delete guidance comments when filling. -->

status: draft <!-- draft | approved -->
date: <yyyy-mm-dd>
brief: .design/brief.md (<date confirmed>)
scope: <whole app | feature + entry points>

## 1. Information architecture

### Objects
<!-- Nouns in the user's words. Volume from content.volume. -->
| Object | Key attributes (shown in lists) | Actions | Relationships | Volume |
|---|---|---|---|---|
| | | create · view · edit · delete | belongs to <X> | |

### Tasks
| # | Task | Objects | Frequency | Max steps from home |
|---|---|---|---|---|
| 1 | | | | |

### Destinations & sitemap
<!-- Primary destinations first; secondary (settings, account, help) marked. Indent = nesting. -->
```
Home (hub)
├─ <Destination>
│  └─ <Detail>
└─ Settings (secondary)
```

## 2. Navigation model — D<n>
- **Model:** <single hub | bottom tabs | sidebar | top bar | grouped sidebar + search | stepper>
- **Why:** <destination count, device, frequency> [card ids]
- **Current location shown by:** <active item, title, breadcrumb>
- **Responsive:** <e.g. sidebar ≥1024 → bottom tabs <768>
- **Back behaviour:** <browser back = up one level; modals close on back>
- **Search:** <none | global | per-collection>

## 3. Key flows
<!-- Top 3 tasks + first-run + the risks.failure flow. Steps: Screen — user action → system response. -->

### F1 — <task name>
- **Entry:** <where / trigger>
- **Happy path:**
  1. <screen> — <action> → <response>
- **Error paths:**
  - Step <n> fails (<cause>) → <what user sees> → <recovery; input kept>
- **Undo / confirm:** <which step, which mechanism> — D<n>
- **Exit:** <landing screen + success signal>

## 4. Screen inventory
<!-- Exactly one primary action per screen, or "none (read-only)". Frequency sets its motion budget. -->
| id | Route | Purpose | Primary object | Primary action | Links to | Frequency | Flows |
|---|---|---|---|---|---|---|---|
| | | | | | | | F1 |

## 5. State matrix
<!-- Every screen × every state: what the user sees / next action. n/a needs a reason. Empty: split first-use, cleared, no-results where they apply. -->
| Screen | Empty | Loading | Error | Partial | Full | No-permission |
|---|---|---|---|---|---|---|
| <id> | <sees> / <next> | skeleton · spinner · optimistic | <sees> / <next> | <sees> / <next> | <heavy-volume note> | <sees> / <who grants> |

## 6. Cross-screen consistency rules
<!-- 5–10 rules every screen follows. -->
- Primary action position: 
- Lists vs cards per object: 
- Destructive actions: 
- Feedback: inline for fields, toast for background results, banner for page-level 
- Forms: labels above, validate on blur, errors next to the field 

## 7. Motion spatial map
<!-- One model of space for the whole app. Budgets from frequency. -->
| Transition | Direction / effect | Reverse | Budget |
|---|---|---|---|
| Drill-in (list → detail) | forward (from trailing edge / scale from source) | back reverses exactly | |
| Sibling destinations | cross-fade or lateral in tab order | mirrored | |
| Overlay (modal / sheet / drawer) | from its anchor | exits the way it came | |

- **Signature moment:** <event + screen> — D<n>
- **RTL:** <mirror horizontal directions | n/a>
- **Reduced motion:** spatial moves become opacity cross-fades

## 8. Decisions
<!-- Index only; full records in .design/decisions.md. -->
- D<n> — <one-line summary>
