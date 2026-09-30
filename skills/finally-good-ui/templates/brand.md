# Brand: <product name>

<!-- Readable view of .design/tokens.json plus usage rules. tokens.json is the source of truth; keep both in sync.
     Mark anything guessed from code as (inferred, N uses) until the user confirms it. -->

Source: <extracted from code | direction "<name>" | defaults adjusted by brief>  ·  Last updated: <date>

## Personality
<!-- 2–3 lines from brief personality answers, and which personality cards produce it. -->

## Colour
| Role | Light | Dark | Contrast on its surface | Use for |
|---|---|---|---|---|
| background / foreground | | | | page |
| card / card-foreground | | | | raised surfaces |
| primary / primary-foreground | | | | the one main action per view |
| muted / muted-foreground | | | | secondary text, quiet surfaces |
| accent / accent-foreground | | | | hover and selection |
| destructive / destructive-foreground | | | | irreversible actions |
| border · input · ring | | | | lines, fields, focus ring |

Rules: <!-- e.g. accent at most once per view; status colours never carry meaning alone (color.color-not-sole-signal) -->

## Type
| Role | Family | Size / line-height | Weight | Use |
|---|---|---|---|---|
Pairing rationale: <!-- card ids -->

## Space · radius · elevation
Spacing scale: <!-- e.g. 4 8 12 16 24 32 48 64 -->  ·  Radius: <!-- sm/md/lg values and personality reason -->  ·  Shadows: <!-- levels and when -->

## Motion
- Axis position: <productive | balanced | expressive>, because <brief fact>
- Durations: instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500 (adjusted: …)
- Easing roles: enter · enter-emphasized · exit · move · snappy · linear
- Spatial map: <!-- drill-in → forward; back → reverse; peer tabs → crossfade -->
- Budget per screen type: <!-- screen type → allowed motion -->
- Signature moment: <!-- where + why -->
- Reduced motion: keep opacity and colour; drop translate and scale.

## Drift found (from extraction)
<!-- values used often but not tokenised, and the decision taken for each -->
