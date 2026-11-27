# Decision log — Studio finance (autonomous run; every approval below is self-approved)

## D1 Brief and blueprint
- Brief and blueprint self-approved (autonomous). Answers inferred from the one-line request; marked in brief.md.

## D2 Direction: C Wall Planner (chosen by agent: distinctiveness)
- Chosen by agent: the only one of three whose whole first screen is the subject's artefact (a 26-week cash planner that is a working control). A is a letter column (the "top bar + centred column" the structure test rejects), B is a rail + sortable table (a dashboard with a sidebar). Unlike a generic finance app and unlike the ink-on-paper house style: tinted cyanotype canvas, vermilion mark, paper slips.
- Quiet direction A did not win: no brief line demands restraint (brief: calm and exact, with a designer's eye).
- Axes: density=balanced contrast=standard type=expressive layout=stage/object material=tonal motion=productive
- Skeleton: amends blueprint: top bar/centred column -> sheet rail + planner stage + ledgers, because Concept mapping row 1 (planner sheet -> 26-week stage).
- Files: .design/directions/c.spec.md (built as the app, no separate prototype html: `directions: one` builds the pick directly as the app's landing screen; see README friction).

## D3 System
- Tokens from c.spec.md via build script then `emit-tokens --format dtcg`; css and js emitted into src/styles. Contrast pairs checked with scripts/lib/contrast.mjs (all >= 4.5 on canvas, slip, selected, muted; dark likewise).
- `mark` (vermilion) is a custom role: overdue, payroll and the today line. `primary` is the navy ink for actions [craft.ink-and-accent adapted: ink actions on a tinted sheet, accent on meaning].

## D4 Motion
- Productive. Reduced motion drops the line morph and figure swap. Compositor-only: transform and opacity.
