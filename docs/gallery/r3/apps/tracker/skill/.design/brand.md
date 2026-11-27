# Brand: Docket

Source: direction C "Triage Tag" (.design/directions/c.spec.md) · Last updated: 2026-11-16

## Personality
Exact, quiet, keyboard-native. dense-expert 45% + raw-industrial 30% + calm 25%. Manila card stock and carbon ink from the triage tag; stamp red for meaning only.

## Colour (tokens.json is the source)
| Role | Light | Dark | Contrast | Use for |
|---|---|---|---|---|
| background / foreground | manila 0.925 0.032 85 / ink 0.25 0.035 260 | 0.205 0.014 70 / 0.92 0.03 86 | ≥ 11:1 | canvas, text |
| surface · rail · card | 0.945 · 0.90 · 0.965 | 0.225 · 0.185 · 0.255 | — | list · view rail · panel/popovers (rise lighter in dark) |
| primary / primary-fg | ink / manila | manila / carbon | 13:1 | New issue, Create, Comment |
| muted-foreground | 0.45 0.03 255 | 0.74 0.025 84 | ≥ 4.9:1 on every surface | secondary text |
| accent | carbon-blue wash 0.885 0.035 240 | 0.3 0.03 250 | text ≥ 5.2:1 | selected row |
| ring | carbon blue 0.48 0.14 258 | 0.74 0.11 255 | ≥ 4.7:1 | focus, selection bar |
| mark / mark-fg | stamp red 0.5 0.18 28 | 0.68 0.16 30 | 5.7:1 | P0 tag, stamps, Triage count, current view bar |
| warning · info · routine | P1 yellow · P2 green · P3 manila-grey | re-derived | ≥ 5:1 with their fg | priority tags only, always with "P1" text |

Rules: stamp red at most on P0 tags, the Triage count, the current-view bar and stamps. Status never by colour alone (shape icon + word). Actions in ink.

## Type
| Role | Family | Size / lh | Weight | Use |
|---|---|---|---|---|
| figure | Archivo wdth 68 | 40 / 1.0, -0.02em | 800 | the view count (one per screen) |
| title | Archivo wdth 72 | 24 / 1.15, -0.01em | 700 | panel issue title |
| body | Archivo | 13 / 1.45 | 400 | rows, fields |
| prose | Archivo | 14 / 1.6 | 400 | description, comments (max 68ch) |
| micro | JetBrains Mono | 11–12 / 1.3 | 400/500 | issue keys, times, kbd |
Pairing: one family at two widths + a mono for keys [typography.limited-families-weights, personality.dense-expert].

## Space · radius · elevation
4 8 12 16 24 32 48 64 · radius 2 (tags, inputs) / 3 (buttons) / 4 (panel, popovers) · shadow md on the panel and popovers only (warm-tinted), none on rows; dark: lighter surface + hairline.

## Motion
- Axis: productive with an expressive curve for one moment (brief: many times a day, keyboard).
- Durations: instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 600.
- Spatial map: selection = 0ms; panel enters from the trailing edge (150ms); phone panel = forward sheet from trailing edge (250ms), Back reverses; menus from trigger (150ms in / 100ms out); palette fade only (100ms); toasts rise from bottom (150ms).
- Budget: list & keyboard paths 0ms; routine feedback ≤ 150ms; status moves FLIP 150ms.
- Expressive moments (1 of max 3): **Triage cleared** — Triage count rolls to 0 and a CLEARED stamp lands on the empty queue (≤ 600ms, once per clearing).
- Close stamp in the panel (DONE / DUPLICATE / WON'T FIX) is routine: 150ms settle, no bounce.
- Reduced motion: opacity and colour stay; no translate/scale/rotate; counters jump.

## Motif
Triage tag strip (notched tag with hole, priority colour, "P0" printed): rows, rail Triage badge, panel header, priority field/menu, empty states. Partner: rubber-stamp disposition.
