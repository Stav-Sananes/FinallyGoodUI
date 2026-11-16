# Brand — Supper

Source: direction A "Menu Board" (.design/directions/a.spec.md), locked in tokens.json (+ tokens.dark.json, tokens.resolver.json).

- **Palette:** near-neutral paper (hue 85, chroma 0.004) · ink primary · aubergine `mark` (345) for meaning only: tonight, progress dots, the signature stroke, focus ring · washed `mark-wash` tag pairs · destructive and warning as text-capable roles.
- **Type:** Newsreader (dish names, headings, tonight's dish at 40px) + Hanken Grotesk (UI, labels, tabular quantities). Body 16px.
- **Material:** flat-hairline; only the pick sheet and toasts are raised (shadow-lg / shadow-md, tinted hue 60; dark: lighter surface + hairline).
- **Radius:** sheet 16 → buttons 8 → small controls 4 → tags pill; evening rows are ruled, not boxed.
- **Icons:** Phosphor regular (stroke ≈1.5), 20px and 16px.
- **Motif:** menu dotted leaders, in: evening rows (dish ··· cook time), the week progress (seven dots), recipe ingredients (ingredient ··· quantity), shopping list items (item ··· quantity), list summary in the margin (aisle ··· count).

## Motion
- **Spatial map:** week → recipe = forward (16px from the trailing edge + fade, 250ms in / 150ms out); back reverses. Tabs (This week · Recipes · List) = lateral cross-fade. Pick sheet rises from the bottom on phones (300ms snappy in, 150ms exit), centred dialog ≥640px (scale .97→1 + fade).
- **Budget per screen type:** This week (several times a week): press feedback ≤100ms, evening fill 250ms fade + 4px settle, no entrance choreography. List (in the aisle): tick draw 150ms, nothing else. Recipe (cooking): route transition only.
- **Signature moment:** the seventh evening planned → "This week is set" with an aubergine pen stroke drawn under it and the seven progress dots settling left to right, ≤500ms, once per week (settled on reload).
- **Reduced motion:** keep opacity and colour; drop translate/scale; the stroke appears drawn.
