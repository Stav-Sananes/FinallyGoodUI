# Module: blueprint

Goal: turn the confirmed brief into `.design/blueprint.md` — the app's structure before any pixels: what exists, how people move through it, and what every screen shows in every state. Nothing visual is decided here except the motion spatial map.

Inputs: `.design/brief.md` (must be `status: confirmed`; if not, run `modules/interview.md` first), the stack profile, existing routes/screens (in `feature` depth, the blueprint covers the feature and its entry points only). Canon: `ia-nav`, `flows-forms`, `states`, `usability`, `motion.spatial-continuity`. Output: `.design/blueprint.md` from `templates/blueprint.md`; decision records appended to `.design/decisions.md` from `templates/decisions.md`.

## 1. Inventory objects and tasks (IA)

1. List the **objects** users work with (nouns: Project, Invoice, Member). Use the user's words from the brief. [writing.user-language]
2. For each object: key attributes shown in lists, actions (create/view/edit/delete/share/…), relationships (belongs to, has many), expected volume (from `content.volume`).
3. List the **tasks** from `jobs.top-tasks`, ranked, each mapped to the object(s) it touches and its frequency.
4. Group into **destinations** (places a user navigates to). A destination usually = one object's collection, or one hub for a dominant task. Settings/account are secondary destinations.
5. Decide depth: keep top tasks within 2 steps of home; nest only where objects truly contain each other. [ia-nav.shallow-vs-deep]
6. In existing apps, map current routes to this inventory first; flag orphans and duplicates rather than silently restructuring.

## 2. Choose the navigation model

Count primary destinations (exclude settings, profile, help). Then apply, in order — the first matching row wins, and log a decision record. Frequency: `daily` = several times a day or week; `rare` = a few times a month or less (`context.frequency`).

| Primary destinations | Device (`context.device`) | Frequency / depth | Model | Cards |
|---|---|---|---|---|
| 1 dominant task | any | any | Single hub + contextual actions; secondary items in a menu | ia-nav.nav-model-by-count, flows-forms.primary-action-clarity |
| 2–5 | phone-first | any | Bottom tab bar, labels always visible | ia-nav.visible-destinations, a11y.target-size |
| 2–5 | desktop-first | daily | Persistent sidebar or top bar, always visible, current item marked | ia-nav.visible-destinations, ia-nav.wayfinding-location |
| 2–5 | desktop-first | rare | Top bar; hub page linking to sections | ia-nav.tension-discoverability-minimalism |
| 2–5 | both equally | any | One nav designed at both sizes: top bar or sidebar ≥ 1024px, bottom tab bar < 768px, same destinations in the same order; design 375 and 1440 together, neither is the squeeze | ia-nav.visible-destinations, layout.intrinsic-responsive |
| 6–12 | desktop-first | any | Sidebar with 2–4 labelled groups; collapsible for experts | ia-nav.nav-model-by-count, ia-nav.progressive-disclosure |
| 6–12 | phone-first | any | Merge/demote to ≤5 tabs + "More"; challenge the count first | ia-nav.tension-discoverability-minimalism |
| 6–12 | both equally | any | Grouped sidebar ≥ 1024px; the same top groups as ≤ 5 tabs + "More" on phone; challenge the count first | ia-nav.nav-model-by-count, ia-nav.tension-discoverability-minimalism |
| 12+ or volume in thousands | any | any | Search-first (command palette / global search) + grouped sidebar | ia-nav.search-vs-browse |
| linear process (setup, checkout, application) | any | rare | Stepper / wizard, no global nav inside the flow, visible progress | flows-forms.one-thing-per-page, usability.system-status |

Then specify: responsive adaptation (e.g. sidebar → bottom tabs or drawer at 375px), how the current location is shown, back behaviour, and where search lives if any. Never hide primary destinations behind a hamburger on desktop. [ia-nav.visible-destinations]

## 3. Write key flows

One flow per top task (at least the top 3), plus first-run, plus the flow behind `risks.failure`. For each:
- **Entry:** where users start and what triggered them.
- **Happy path:** numbered steps, each `Screen — user action → system response`.
- **Error paths:** at least one per step that can fail (validation, network, permission, conflict) — what the user sees and how they recover without losing input. [states.error-recovery, writing.error-messages]
- **Exit:** where they land and what confirms success. [usability.system-status]
- **Undo/confirm:** for destructive or irreversible steps, choose undo (preferred) or confirm with specific consequences. [usability.user-control-undo]

Keep flows short: count steps; if the top task exceeds ~5 steps, look for defaults and merges. [flows-forms.sensible-defaults]

## 4. Inventory screens

Table of every screen/view: id (kebab), route, purpose (one line), primary object, the one primary action, destinations it links to, frequency (drives motion budget), and the flows it appears in. Include modals, drawers and sheets as screens if they carry a task. Every screen must have exactly one primary action or explicitly none (read-only). [flows-forms.primary-action-clarity]

## 5. Build the state matrix

For every screen × {empty, loading, error, partial, full, no-permission}, write **what the user sees** and **their next action**. Mark `n/a` only with a reason (e.g. a static page has no loading state).
- **empty** — first-use vs cleared vs no-results are different; write each that applies. Teach and offer the first action. [states.empty-state-teaches]
- **loading** — skeleton matching the layout for content; inline spinner for actions; optimistic update where safe. Say which. [states.loading-perceived, states.optimistic-feedback]
- **error** — plain-language cause, what's preserved, a retry or alternative. [states.error-recovery]
- **partial** — some data failed or is still arriving, stale data, pagination, offline. [states.partial-and-permission]
- **full** — the designed default; note the heavy-volume case (overflow, long names, 1000 rows).
- **no-permission** — explain why and who can grant access; never a blank screen. [states.partial-and-permission]

This matrix is the checklist the build step implements and the verify step forces.

## 6. Cross-screen rules and motion spatial map

**Consistency rules** (5–10 lines): where the primary action sits, list-row vs card choice per object, how destructive actions look, title/breadcrumb pattern, form layout (labels above), toast vs inline feedback. [usability.consistency-standards, flows-forms.labels-above]

**Motion spatial map** — one mental model of space for the whole app: [motion.spatial-continuity, motion.frequency-budget]
- Hierarchy is depth: drill-in (list → detail) moves forward (enters from the trailing edge or scales up from the source); back reverses exactly.
- Siblings (tabs, top-level destinations) are lateral: cross-fade or short slide in tab order; no depth change. On daily-use destinations prefer instant or cross-fade.
- Overlays (modal, sheet, drawer) come from their anchor (sheet from bottom, drawer from its side, popover from trigger) and leave the same way.
- RTL locales mirror horizontal directions.
- Name the one signature motion moment and which screen/event owns it. [motion.one-signature-moment]
- Per-screen motion budget from frequency: daily screens ≤150ms feedback, no entrance choreography.

## 7. Record decisions

Write a decision record (format in `templates/decisions.md`) for every choice where a reasonable designer could choose otherwise — at minimum: nav model, top-level destinations, the hub/home screen, each undo-vs-confirm choice, search vs browse, the spatial model, and each tension resolved. Cite card ids in **Why**; name the brief fact that decided it. Append to `.design/decisions.md`; the blueprint links to them by number (D1, D2…).

## 8. Present and get approval

Approval is mandatory; do not start directions or build without it.
1. Present a digest, not the file: IA in ≤8 lines, nav model + one-line why, a text sitemap, the top flow as steps, the screen count, and the 3–5 decisions most likely to be disputed. Point to `.design/blueprint.md` for the full state matrix.
2. Ask: "Approve the blueprint, or tell me what to change." Ask one focused question if a decision was close ("Sidebar or top bar was close — you'll have 6 sections; sidebar recommended.").
3. **Revisions:** apply the change, then trace its ripple — a changed destination alters nav model, flows, screen inventory, state rows and spatial map. Update all affected sections; mark superseded decision records `Superseded by Dn` (never delete them) and add new ones. If a revision contradicts the brief, name the conflict and ask whether the brief changes too. Show only what changed and ask again.
4. On approval, set `status: approved` and the date in the blueprint header.
