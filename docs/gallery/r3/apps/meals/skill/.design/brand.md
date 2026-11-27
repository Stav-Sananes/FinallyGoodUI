# Brand — Sunday Table (direction C: Plates on the Table)

Source: `.design/directions/c.spec.md`; tokens in `.design/tokens.json` (+ dark, resolver).

- Canvas: tile-green glaze oklch(0.945 0.035 150); plate-white cards; cast-iron green-black ink.
- Primary: tomato oklch(0.56 0.2 30) (dark 0.68 0.17 32); `mark` = tomato as text; `success` = herb green.
- Type: Young Serif (display, 400) for tonight's dinner, page title, recipe title; Atkinson Hyperlegible 400/700 for everything else. Body 16px.
- Radius: stage 28 → buttons 14 (concentric, padding 14); rows 20; chips full. Shadows: two-layer, green-tinted; dark = lighter surface + hairline.
- Icons: Phosphor regular, 20/24.
- Motif: the rimmed plate (week row, empty nights, cook monogram, aisle progress, loading).

## Motion
- **Spatial map:** night row → recipe = forward (enters from trailing edge; desktop: right panel slides in), Back reverses. Tabs (This week / Recipes / Shopping list) = cross-fade 150ms. Pick-a-dinner sheet rises from the bottom (phone) and leaves the same way. Toasts rise 8px from bottom.
- **Budget per screen:** This week (opened most evenings): press feedback ≤ 100ms, row → recipe 300ms in / 200ms out, no entrance choreography after first load (a single 40ms-step stagger of the plate row on first load only). Pick sheet 300/200. Shopping list: tick = 150ms colour + strike; no movement of rows except a 250ms move when a ticked item settles to the aisle's end.
- **Expressive moments (2 of max 3):**
  1. **Week planned** — when the 7th night gets a dinner: the seven plates fill left to right with a small overshoot (600ms total, spring-like `linear()`), and the header says "Week planned". Once per week.
  2. **List count roll** — on each plan action the shopping-list count in the header counts to the new number (400ms, number-change recipe, with an opacity tint behind it). Short, tied to the "one list" promise.
- **Reduced motion:** translate/scale removed; plates fill and counts change with opacity cross-fades only.
