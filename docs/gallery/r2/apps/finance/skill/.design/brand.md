# Brand: Halden & Moss finance overview

Source: direction "Double Rule" (C) · Last updated: 2026-11-16 · tokens.json is the source of truth.

## Personality
Sober, legible, exact. serious-trustworthy 50% + calm 30% + editorial 20%: cool paper, stark ink, one ledger-green mark, a display face only for the one figure that matters.

## Colour
| Role | Light | Dark | Contrast on its surface | Use for |
|---|---|---|---|---|
| background / foreground | oklch(0.985 0.004 165) / oklch(0.19 0.012 170) | oklch(0.17 0.008 170) / oklch(0.95 0.006 165) | 17.7 / 16.5 | page, all text |
| card / card-foreground | oklch(0.995 0.002 165) | oklch(0.21 0.009 170) | ≥ 7.2 for muted text | dialog, toast only |
| primary / primary-foreground | ink / paper | paper / ink | 17.7 | the one primary action in a context |
| muted / muted-foreground | oklch(0.955 0.006 165) / oklch(0.45 0.012 170) | oklch(0.235 0.009 170) / oklch(0.73 0.012 165) | ≥ 6.5 | skeleton, expanded rows, secondary text |
| accent / accent-foreground | oklch(0.945 0.012 165) | oklch(0.26 0.014 165) | 6.3 for muted text | hover rows, selected segment |
| mark | oklch(0.46 0.09 165) | oklch(0.77 0.1 165) | 6.5 / 9.6 | double rule, money in, focus ring |
| destructive · warning | oklch(0.51 0.17 32) · oklch(0.52 0.11 68) | oklch(0.73 0.14 32) · oklch(0.8 0.12 75) | 6.0 · 5.4 / 7.6 · 10.1 | over 30 days late · 1–30 days late, sync problems |
| border · input · ring | oklch(0.885 0.006 165) · oklch(0.58 0.01 170) · mark | oklch(0.31 0.008 170) · oklch(0.55 0.01 170) · mark | input 4.1 / 4.0 (UI ≥ 3) | hairlines, fields, focus |

Rules: mark green only where money arrives or for the motif; status always colour + icon + words (color.color-not-sole-signal); no brand colour on buttons (ink).

## Type
| Role | Family | Size / line-height | Weight | Use |
|---|---|---|---|---|
| display | Bricolage Grotesque | 104 / 1.0, −0.035em (64 on phone) | 600 | the cash figure |
| heading | Bricolage Grotesque | 28 / 1.2, −0.015em | 600 | section heads |
| sub | IBM Plex Sans | 22 / 1.3 | 500 | strip figures |
| body | IBM Plex Sans | 16 / 1.55 | 400 | sentences, rows |
| small | IBM Plex Sans | 14 / 1.45 | 400/500 | meta, buttons |
| caps label | (not used: group headers set in sentence case, D10) | | | |
Pairing rationale: one display gesture with character for a design-studio owner, a sober sans with true tabular figures for everything compared. [typography.limited-families-weights, typography.tabular-numbers, craft.number-setting]

## Space · radius · elevation
Spacing scale: 4 8 12 16 20 24 32 40 48 64 80 96 · Radius: 4 controls, 8 dialog (inner fields 4) · Shadows: overlay only (dialog, toast), two tinted layers; dark = hairline.

## Motion
- Axis position: productive, because the screen is a weekly serious check and motion should only confirm.
- Durations: instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500 (hero only for the signature; long only for the cash roll).
- Easing roles: enter · enter-emphasized (signature rule draw) · exit · move · snappy · linear
- Spatial map: no drill-in; dialog rises 8 px from centre (sheet from the bottom edge under 640 px) and drops back; period switch moves bars in place; toasts rise from the bottom edge.
- Budget per screen type: overview — press feedback 50 ms, hovers 100 ms, reveals 250 ms, chart morph 300 ms, no load choreography beyond the first chart draw once per session.
- Signature moment: Mark paid → cash rolls up (400 ms) and the double rule redraws (500 ms, enter-emphasized). Why: money arriving is the meaningful event.
- Reduced motion: keep opacity and colour; drop translate and scale; the rule appears without drawing; figures jump to the final value.

## Motif
Ledger double rule: under the cash figure, under the payroll total, under the owed total, as the chart's zero line, in the empty and cleared states.
