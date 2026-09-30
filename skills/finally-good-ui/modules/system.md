# Step 5: System (tokens + motion language)

Goal: turn the chosen direction (or the confirmed existing brand) into **one source of truth**, `.design/tokens.json`, and emit it into the stack's native format. After this step, no raw colour, size, duration or easing values are allowed in components.

## 1. Choose the starting point
| Situation | Start from |
|---|---|
| Existing brand confirmed in step 1 | `.design/tokens.json` from extraction; fill gaps only |
| Direction chosen in step 4 | The direction's spec (palette, type, motion personality) |
| Directions skipped, no brand | `tokens/default.tokens.json`, then adjust using the brief's personality cards |

## 2. Build the tokens (contract: spec §5.5, DTCG subset)
- **Colour**
  - Semantic pairs, never raw hues in components: `background/foreground`, `card/card-foreground`, `primary/primary-foreground`, `muted/muted-foreground`, `accent/accent-foreground`, `destructive/destructive-foreground`, `border`, `input`, `ring`.
  - Add `success`, `warning` and `info` pairs if the blueprint has status UI (`data.status-encoding`).
  - Generate from 3 inputs: **base** (neutral hue and temperature), **accent**, **contrast level** (`color.role-scale`, `color.contrast-by-construction`).
  - Neutrals take a slight tint of the accent hue.
  - Dark values go in `$extensions.fgu.dark`, designed rather than inverted (`color.dark-mode-not-inverted`).
- **Check every text pair** in both themes:
  `node "${CLAUDE_SKILL_DIR}/scripts/lib/contrast.mjs" <fg> <bg>`
  Body text needs at least 4.5:1, large text and UI at least 3:1. Fix the value, not the rule.
- **Type**
  - Families: at most 2 plus mono (`typography.limited-families-weights`).
  - Scale: from the direction, or 12/14/16/18/20/24/30/36/48/60. Body at least 16px.
  - Line-height 1.4–1.6 for body, tighter for display.
- **Space**: a 4-based scale (`layout.spacing-scale`).
- **Radius and shadow**: one radius family and one elevation system. Radius shows personality (tight means serious or dense; soft means friendly).
- **Motion**: see below.

## 3. Motion language
Start from the duration and easing tokens (spec §4). Then set them from the brief:

| Brief says | Axis position | Adjust |
|---|---|---|
| Daily tool, experts, dense | productive | durations toward micro/short; easing `enter`/`move`; springs bounce 0; almost no ambient motion |
| Mixed / general consumer | balanced | defaults |
| Rare use, emotional, marketing, onboarding | expressive | allow `enter-emphasized`, `long` for hero moments, spatial springs bounce up to 0.2–0.3 |

Write a **Motion** section into `.design/brand.md` with:
- **Spatial map:** which navigations move forward (drill-in), which reverse (back), which crossfade (peer tabs) (`motion.spatial-continuity`).
- **Budget per screen type**, from frequency of use (`motion.frequency-budget`): e.g. "Inbox list: press feedback only. Onboarding: staggered entrance plus the signature moment."
- **The one signature moment** (`motion.one-signature-moment`): where it is and why that place.
- **Reduced-motion policy:** keep opacity and colour, drop translation and scale (`motion.reduced-motion`).

## 4. Emit to the stack
```
node "${CLAUDE_SKILL_DIR}/scripts/emit-tokens.mjs" --in .design/tokens.json --format <fmt>
```
| Stack profile | Format | Where it goes |
|---|---|---|
| Tailwind v4 | `tailwind4` | the main CSS entry (e.g. `app/globals.css`), replacing or merging the `@theme` block |
| Tailwind v3 | `css` + `tailwind3` | CSS variables in the global CSS, and `theme.extend` in `tailwind.config` |
| shadcn | `css` (+ tailwind format) | merge into the existing `:root` / `.dark` variables, keeping shadcn's names |
| MUI | `mui` | `theme.ts` via `createTheme` |
| Anything else / plain | `css` | `tokens.css`, imported first |

**Merge, never clobber.** Show the diff for the existing theme files and keep any unrelated variables.

## 5. Record
Append the decisions (palette inputs, type pairing, scale, radius, motion position) to `.design/decisions.md`, with card ids. Then continue to build.
