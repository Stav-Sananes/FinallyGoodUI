# Brand — Brindle (created from brief, direction C "Brindle Coat")

- **Palette:** fawn canvas, chocolate ink and primary (a brindle coat); bandana teal `mark` for the chosen appointment only. Light + dark designed separately (tokens.json / tokens.dark.json). All text pairs ≥ 4.5:1 on canvas, card, muted and accent in both themes (checked with contrast.mjs).
- **Type:** Archivo, one family; width 125 / weight 700 for the drop-off figure and day headings (stamped-tag voice), width 100 for UI. Body 16px. Tabular figures for every time and price.
- **Shape:** stage 24 → rows 14 → chips 8; dog-tag monogram round.
- **Material:** soft-elevated, two tinted shadows (hue 45); dark mode = lighter surface + hairline.
- **Icons:** Phosphor, regular weight, 20px (16 small).
- **Motif:** the grooming comb (evenly spaced teeth): day comb, step progress, loading skeleton, full-day empty state, booked stub.

## Motion
- **Spatial map:** next step enters from the trailing edge, back reverses; day change slides laterally in date order (later day → content from the right); overlays (change-dog/service sheet) rise from the bottom and leave downward.
- **Budget per screen type:** booking screens are rare-use (every 4–8 weeks): press feedback 50–100 ms; day change 250 ms; row select 150–250 ms; nothing routine over 400 ms. No scroll reveals, no entrance stagger beyond first paint (≤ 6 items, 40 ms step).
- **Expressive moments (2 of max 3):**
  1. **Time chosen** (`.comb-signature`): the teal span draws along the day comb from the drop-off tooth to the ready tooth (scaleX, enter-emphasized, 500 ms) while the big figure rolls to the new time. Why: this is when the owner sees their day settle.
  2. **Booked** (`.booked-signature`): the comb stub's teeth fill left to right and the check lands (500 ms). Why: completion, the peak-end of the flow.
- **Reduced motion:** keep opacity and colour (span fades in, figure cross-fades), drop translate/scale; under 150 ms.
