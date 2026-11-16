# Decision log — Tracker

## D0 — Autonomous run
- **Step:** interview · **Date:** 2026-11-16 · **Status:** active
- **Decision:** brief, blueprint and direction self-approved; no person available.
- **Chosen:** self-approved (autonomous). Self-answered: first-run, references→finish "quiet-crafted", risks.failure, risks.trust, calm, serious, dense, AA, en-only, stack.

## D1 — Primary navigation model
- **Step:** blueprint · **Date:** 2026-11-16 · **Status:** active
- **Decision:** how users move between Triage, My issues, All issues and saved views.
- **Options considered:** 1. persistent sidebar + palette — visible, keyboard-reachable / uses width; 2. top tabs — compact / no room for views; 3. palette only — fastest for experts / hides destinations.
- **Chosen:** 1
- **Why:** desktop-first, several times a day, 3 destinations + views; keyboard audience gets the palette on top. [ia-nav.nav-model-by-count, ia-nav.visible-destinations, usability.keyboard-shortcuts] (brief: interview.context.device, interview.context.frequency, interview.purpose.expertise)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → discoverability; the triage count must be seen every morning.
- **Revisit if:** phone becomes primary.

## D2 — Key screen composition
- **Step:** blueprint · **Status:** active
- **Decision:** list with selected issue open in a side panel (brief names it). List stays readable at ~58% width; panel 42%, min 380px.
- **Why:** keep the list in view while editing one issue so J/K triage needs no back-and-forth. [usability.recognition-over-recall, ia-nav.shallow-vs-deep] (brief: key screen)
- **Revisit if:** issues become long documents.

## D3 — Rows, dense
- **Step:** blueprint · **Status:** active
- **Decision:** issues as 36px rows, columns: priority glyph, key, title + labels, assignee monogram, updated.
- **Options:** cards (airy, slow to scan) / 44px rows (comfortable) / 36px rows (dense).
- **Chosen:** 36px rows. **Why:** experts compare dozens of issues daily. [data.dense-tables, personality.dense-expert] (brief: interview.purpose.expertise, interview.content.volume)
- **Tension resolved:** data.tension-density-clarity → density.

## D4 — Group by status
- **Step:** blueprint · **Status:** active
- **Decision:** All/My issues grouped by status (In progress, In review, Todo, Backlog, Done) with counts; status shown once per group header, not on each row.
- **Why:** status is how the team reads the list; avoids redundant tags. [data.status-encoding, layout.proximity-grouping] fingerprint redundant-status-tags avoided.

## D5 — Undo over confirm
- **Step:** blueprint · **Status:** active
- **Decision:** accept/decline/status/assignee/delete are optimistic with an Undo toast (Z); no "Are you sure?".
- **Why:** frequent, reversible actions affecting teammates; a confirm on every keypress breaks flow. [usability.user-control-undo, states.optimistic-feedback] (brief: interview.risks.failure, interview.risks.trust)

## D6 — URL as state
- **Step:** blueprint · **Status:** active
- **Decision:** ?view=…&status=…&priority=…&assignee=…&issue=ENG-142 via history.replaceState / pushState for issue open.
- **Why:** shareable "look at ENG-142" links; back closes panel. [ia-nav.url-as-state]

## D7 — Signature moment
- **Step:** blueprint · **Status:** active
- **Decision:** "Triage clear": last triage issue accepted → triage count rolls to 0, a stamped check settles in the cleared state. Everything else ≤150ms or instant.
- **Why:** rare (once a day), emotionally meaningful end of the morning ritual. [motion.one-signature-moment, motion.frequency-budget, motion.tension-delight-speed] (brief: jobs #1)

## D8 Direction: B — Punch list
- **Step:** directions · **Date:** 2026-11-16 · **Status:** active
- Chosen: B, chosen by agent: soft-elevated panel makes "the open issue sits in front of the list" literal (the brief's key screen), humanist text + serif title is warmer over all-day sessions than A's flat grotesk, which sat closest to the sterile default (craft.tension-restraint-liveliness); C's 44px stark rows give up density the expert brief asks for (data.tension-density-clarity). Self-approved (autonomous). Only B built (no subagents).
- Rejected: A Shift log (risk of sterile default), C Signal board (too loose and loud for calm, dense, daily use).
- Axes: density=dense contrast=standard type=humanist/serif text layout=rail+work (brief-fixed, not rolled) material=soft-elevated motion=balanced fitted to the daily budget (≤150ms routine, 0ms keyboard).
- Rolls: B d3 c2 t2 m2 mo2; C d2 c3 t1 m2 mo1 → C failed ≥4 vs A, re-rolled type+motion → (2,1).
- Palette/type/motion carried to system: graphite neutrals hue 255, ink primary, teal mark hue 195; Newsreader + Source Sans 3 + JetBrains Mono; durations 50/100/150, signature 400.
- Cards: data.tension-density-clarity, motion.tension-delight-speed, craft.ink-and-accent, craft.identity-motif (keycap), motion.one-signature-moment
- Files: .design/directions/b.spec.md (built directly as index.html; no separate b.html, see D9)

## D9 — Direction prototype folded into the build
- **Step:** directions · **Status:** active
- **Decision:** the requested deliverable is one self-contained index.html of the key screen; a separate b.html prototype would be the same screen. Built B once, as index.html, and the fidelity check compares index.html with b.spec.md. compare.html not produced (one built direction).

## D10 — System tokens
- **Step:** system · **Date:** 2026-11-16 · **Status:** active
- Palette inputs: base hue 255 graphite (chroma ≤0.006), mark hue 195 teal, contrast standard; primary = ink [craft.ink-and-accent, color.role-scale, color.contrast-by-construction]. Every text role checked on canvas, sidebar, panel, muted and selected-row tint in both themes (76/84 ≥4.5:1 first pass; warning/success/urgent darkened to pass; warning on mark-tint 4.43 used only for glyphs, 3:1 UI rule) [a11y.contrast-minimums].
- Body 14px: dense expert daily (brief: expertise=expert, frequency=daily) [personality.dense-expert, data.tension-density-clarity]; inputs 16px [a11y.target-size].
- Radius 4/6/10/14 nested; shadows 2–3 layers tinted hue 255 [craft.concentric-radii, craft.tinted-shadows].
- Motion: productive durations from a balanced curve set; keyboard 0ms [motion.frequency-budget].
- Emitted as `css` (plain HTML stack), inlined in index.html.
- Fingerprint default-sans: not matched (Source Sans 3 chosen for humanist legibility at 13–14px; rejected Inter: no brief reason, reads as default).

## D11 — Build: recipes, motif, deviations
- **Step:** build · **Date:** 2026-11-16 · **Status:** active
- Recipes used: command-palette (⌘K dialog, ranking, fade only when pointer-opened, instant when keyboard-opened), menu-select-combobox + popover-from-trigger (status/priority/assignee/filter menus, scale .95→1 from trigger, 150ms, keyboard-opened = 0ms), dialog-enter-exit (new issue, shortcuts), toast-stack (undo toasts, max 3, newest on top), item-enter-exit (new issue row tint via opacity overlay; triage removals collapse instantly per the recipe's keyboard-triage rule), focus-after-delete (selection moves to next, else previous, else the empty state's button), skeleton-to-content (static skeleton, no shimmer), empty-state (first-use, cleared, no-results each distinct), success-moment + number-change (Triage clear stamp + count roll 1→0), button-press (.97, 50ms), app-shell-nav.
- Motif (keycap) placements: New issue button (C), menu option shortcuts (1–6, 0–4), panel action bar (Y/B/N, S/P/A), empty states (C, G M, G A), status-bar legend tracking the selected issue, palette rows and footer, shortcuts dialog. [craft.identity-motif]
- Accent moments: triage count pill (mark), selected row tint + 2px mark edge, triage bar tint. [craft.tension-restraint-liveliness]
- Deviation from b.spec.md: the row key chip does not travel into the panel via view transition; the one real transition is the panel arriving from the trailing edge (150ms, enter-emphasized) when opened by pointer. Page title set in Source Sans 600 18px, not Newsreader: the serif is reserved for the issue title and Triage clear so the open issue stays the focal point. [layout.hierarchy-by-weight]
- Status glyphs (rings filled by lifecycle stage) and priority bars are inline SVG data encodings, not hand-drawn icons; all icons are Phosphor regular. [data.status-encoding, craft.real-imagery-and-icons]
- Done group shown with the label "Done this week" instead of a collapsible toggle: a toggle button inside the listbox broke the listbox's allowed children. [a11y.semantic-first]
- Single-key shortcuts can be switched off in the shortcuts dialog (persisted locally). [usability.keyboard-shortcuts]

## D12 — Verify: kept low findings (justified)
- anim-long-duration on .stamp-g (signature-stamp, 400ms) and .roll-in (signature-roll-in, 400ms): the one signature moment, plays once per triage session, under the 500ms ceiling. [motion.one-signature-moment]
- off-token-spacing on .sidebar-foot (margin-block-start: auto) and #new-dialog (UA auto centring margin): computed auto margins, not authored spacing.
- anim-color on icon buttons and the sidebar search button: 100ms background-color hover crossfade, allowed for small state changes. [motion.compositor-only]
- small-target (touch, low): #single-keys switch 40×24 sits inside its <label>, which is the full-width target; branch copy button 39×44; stacked (older) toast buttons are scaled by the stack and partly covered by design.
- CLS root cause fixed in r6: the static shell painted before the script filled the nav, tabs and panel; the app now stays invisible until the first render (html[data-ready]).
- Font-swap shift limited with metric-adjusted local fallbacks (Source Sans fallback = Arial at 89%).
- Fingerprints: none matched unjustified. default-sans not matched (Source Sans 3 chosen for humanist legibility at 14px, D10). left-stripe-cards: the 2px mark edge appears only on the selected row (state, not decoration). mono-as-costume: mono only for issue keys and branch names (IDs that must align).
