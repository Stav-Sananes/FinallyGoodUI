# Brand: Brindle

Source: direction C "Comb Teeth" (chosen by agent, autonomous) · Last updated: 2026-11-16

## Personality
Warm, unhurried, exact. Calm surfaces and stark text (outdoor phone use), a friendly hand-cut grotesque for the one big figure, one fawn mark hue taken from a brindle coat. [personality.calm, personality.playful (partial), personality.serious-trustworthy]

## Colour
| Role | Light | Dark | Contrast on its surface | Use for |
|---|---|---|---|---|
| background / foreground | oklch(0.988 0.003 80) / oklch(0.2 0.012 60) | oklch(0.17 0.008 60) / oklch(0.95 0.006 80) | 17.5 / 16.5 | page |
| card | oklch(1 0 0) | oklch(0.205 0.008 60) | — | sticky bar, sheet |
| primary / primary-foreground | ink oklch(0.22 0.014 55) | ink oklch(0.95 0.006 80) | ≥ 13 | the one main action per view |
| muted / muted-foreground | oklch(0.955 0.005 75) / oklch(0.47 0.012 60) | oklch(0.24 0.008 60) / oklch(0.74 0.01 70) | 6.0 / 7.1 | secondary text |
| accent | oklch(0.95 0.025 75) | oklch(0.27 0.03 65) | muted-fg 5.9 / 6.6 | selected time row |
| mark / mark-strong | oklch(0.64 0.14 60) fill (3.4:1) / oklch(0.5 0.11 55) text (6.0) | oklch(0.78 0.12 72) / oklch(0.82 0.11 72) | ≥ 3 / ≥ 4.5 | comb span, chosen tooth, fawn words |
| destructive | oklch(0.52 0.17 28) | oklch(0.72 0.15 28) | 5.8 / 6.8 | errors, cancel |
| border · input · ring | fg @ 12% · fg @ 30% · mark-strong | same roles | — | hairlines, fields, focus |

Rules: actions in ink, never fawn (craft.ink-and-accent); fawn only on the comb span, the chosen time's tooth and the booked teeth; status always with icon + words (color.color-not-sole-signal).

## Type
| Role | Family | Size / line-height | Weight | Use |
|---|---|---|---|---|
| display | Bricolage Grotesque | 60 / 1.0, -0.035em (clamp 48–72) | 600 | stage readout |
| title | Bricolage Grotesque | 28 / 1.15, -0.02em | 600 | step titles |
| body | Figtree | 16 / 1.5 | 400 / 600 | everything else; tabular figures for times |
| caps | Figtree | 12 / 1.4, +0.07em | 600 | Morning / Afternoon labels |
Pairing rationale: one voiced display for the single focal figure, an open humanist-geometric text face for outdoor legibility. [typography.limited-families-weights, craft.tracking-by-size]

## Space · radius · elevation
Spacing 4 8 12 16 20 24 32 48 64 · Radius tooth 2 / chip 8 / row 12 / panel 20 (concentric) · Shadows: none (flat-hairline); dark mode raises with lighter surfaces.

## Motion
- Axis position: balanced, because use is a few times a year (brief interview.context.frequency) and friendly.
- Durations: instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500 (unchanged defaults).
- Easing roles: enter · enter-emphasized · exit · move · snappy · linear.
- Spatial map: next step = forward from trailing edge 16px; back reverses; day change = times slide 24px in direction of travel; sheet rises from bottom.
- Budget per screen type: time step: press 50ms, selection glide 250ms, day swap 250ms; no entrance choreography after first paint. Booked: signature ≤ 500ms.
- Signature moment: Booked: the comb teeth for the dog's stay fill left to right (hero 500ms total), then the confirmation settles. Rare, emotional, end of task.
- Reduced motion: keep opacity and colour; drop translate and scale; teeth appear filled at once.
