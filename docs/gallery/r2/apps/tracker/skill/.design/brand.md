# Brand — Tracker (from direction B "Punch list")

- Canvas: graphite neutrals, hue 255, chroma ≤ 0.006. Primary actions in ink. Mark (teal, hue 195) only for selection, focus, triage count and the keycap legend. [craft.ink-and-accent, color.accent-restraint]
- Type: Source Sans 3 (UI, 14px base, dense expert daily), Newsreader 600 (issue title, page-level moments, Triage clear), JetBrains Mono 500 (issue keys, branch names only).
- Material: soft-elevated. The list is flat on the canvas; the issue panel, menus, palette and dialog are raised (layered tinted shadows; dark = lighter surface + hairline).
- Radius: 4 keycaps/chips · 6 buttons/rows/inputs · 10 panel/menus/palette · 14 dialog.
- Motif: the keycap. Placements: New issue button hint, menu items, panel action bar, empty states, status-bar legend, palette rows.
- Icons: Phosphor regular, one weight, 16/18px.

## Motion
- **Spatial map:** opening an issue = the panel arrives from the trailing edge (forward); Esc/close = exits the same way. Destinations (Triage / My issues / All issues / views) are siblings: instant swap. Overlays (palette, dialog, menus) rise from their trigger or the top-centre and leave the same way.
- **Budget per screen type:** issue list: press feedback only; J/K, S/P/A, ⌘K and every keyboard-triggered change = 0ms. Pointer-opened panel/menus/palette: 150ms enter, 100ms exit. Toasts 150ms. Row leaving a group after a status change: 100ms fade. Nothing routine over 150ms.
- **Signature moment:** Triage clear (once a day): the triage count rolls to 0 and the keycap check stamp settles over 400ms. Class `.triage-signature`.
- **Reduced motion:** keep opacity and colour; drop translate and scale (panel and stamp fade only).
