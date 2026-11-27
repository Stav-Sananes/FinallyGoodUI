# Decisions (autonomous run, all self-approved)
- D1 Brief, blueprint, direction: self-approved (autonomous). directions=one: only the chosen direction is built, no prototype page.
- D2 Direction "Tide Table", chosen by agent for distinctiveness: money is a water level. Waterline wavy rule is the motif (headings, gauge, empty states, runway chart); runway drawn as a tide gauge (staff with month marks) and a month-end tide curve with a dashed "dry dock" line at zero. Differs from ink-on-paper ledger house style and from a generic KPI-card dashboard (craft.identity-motif, personality.calm).
- D3 Navigation: top bar with 3 destinations (Monday, Invoices, Payroll) collapsing to bottom tab bar under 720px; hash routes. [ia-nav.wayfinding-location]
- D4 Layout: Monday = one headline sentence ("You can float 8.3 more months") then gauge + tide curve, overdue list, pay run card. Not a KPI-card grid. [layout.hierarchy-by-weight]
- D5 Type: Fraunces (display, figures) + Instrument Sans (UI), fontsource variable, self-hosted (system.md requires a chosen face to load; installing contradicts autonomous "never install" -> logged, see README friction).
- D6 Colour: sea-fog paper, deep tidal ink, teal primary, buoy red for overdue, brass for due soon. Designed dark (deep sea-night), not inverted. Contrast checked with scripts/lib/contrast.mjs (all text pairs >= 4.5, input border >= 3).
- D7 Motion: productive. Tide curve draws once per session, runway figure counts to value (<= 600ms, once); everything else = press feedback, dialog/toast per components. Reduced motion drops both.
- D8 Components: scaffold button, field, toggle, dialog, tabs, menu, toast, disclosure kept as emitted; app code only wraps them.
- D9 Undo over confirm for reversible acts (remind, mark paid, delete); confirm dialog only for approving the pay run. [flows-forms.undo-over-confirm]
