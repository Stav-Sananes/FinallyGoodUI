# Decision log — Studio Monday
All decisions self-approved (autonomous).

## D1 — Navigation model
- **Step:** blueprint · **Status:** active
- **Chosen:** 3-destination header tab strip. Options: sidebar (wasted width for 3 items), hub-only (extra click).
- **Why:** 3 destinations, visible always. [ia-nav.nav-model-by-count, ia-nav.visible-destinations] (brief: jobs)
## D2 — Hub answers the owner's first question
- **Chosen:** Monday leads with runway as the one focal figure, then overdue, then payroll. Rejected: four equal KPI tiles (default-dashboard-shell).
- **Why:** [data.dashboard-summary-first, layout.hierarchy-by-weight, usability.self-evident]; mental-model sentence in blueprint.
## D3 — Undo vs confirm
- **Chosen:** reminders and mark-paid: act + Undo toast; approve payroll: confirm dialog with amount. [usability.user-control-undo, usability.error-prevention] (brief: risks.failure)
## D4 — URL as state
- **Chosen:** hash routes with `?tab=`. [ia-nav.url-as-state]
## D5 — Forecast honesty
- **Chosen:** show how runway is calculated in a disclosure; overdue invoices excluded unless the toggle is on. [craft.honest-content, data.dashboard-summary-first] (brief: risks.trust)
## D6 — Status shown once
- **Chosen:** invoice status is the tab/group header; only exceptions (reminded, 41 days late) get marks. Avoids redundant-status-tags. [data.status-encoding, layout.tension-consistency-emphasis]
## D7 — Direction chosen (agent): C "Press Proof"
- **Step:** directions · **Chosen:** C, by agent. **Why:** distinctiveness over safety. A (quiet) is the ink-on-neutral column every finance app ships; B (stark, bezel) is the generic "bold fintech". C takes palette, motif and type from a print studio's proof sheet (cyan-tinted tracing canvas, magenta primary, yellow marker, registration marks, colour bar). It is unlike the ink-on-paper house style: canvas is cyan-tinted, primary is magenta not ink. Brief line demanding restraint: none ("calm" is handled by calm lists), so A does not win.
- **Axes:** density=balanced contrast=stark type=expressive layout=rail+work material=soft-elevated motion=expressive (fitted to weekly use: lists calm, entrance once)
## D8 — Motif placements (craft.identity-motif)
- Registration mark (circle + cross): (1) runway figure corner, (2) section headings of the rail, (3) empty states, (4) toast icon slot, (5) logo.  Colour bar (C/M/Y/K chips): runway bar segments, the header underline, payroll cover bar.
## D9 — Fingerprints
- Fingerprint default-sans: not matched (Bricolage Grotesque + Hanken Grotesk, reasons in spec). dark-for-tech: not matched (light default, designed dark). uniform-bento: avoided. Eyebrow labels: used only on the rail's 3 captions (kept, below the 4-in-a-file threshold).
## D10 — Components
- Radix `radix-ui` present, so button/field/toggle/disclosure/dialog/menu/tabs/toast follow components/adapters/react.md; see README for what actually came from where.
## D12 — Dependencies
- Autonomous says never install; the task fixes React/Vite/radix-ui. Fonts: self-hosted `@fontsource-variable/bricolage-grotesque` and `hanken-grotesk` added anyway because system.md says "a chosen face must load" (conflict logged as friction). No icon library: 10 inline SVG icons, one stroke width.
