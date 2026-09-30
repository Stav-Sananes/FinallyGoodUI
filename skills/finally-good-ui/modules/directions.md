# Module: directions (pipeline step 4)

Goal: three written, then built, directions for the **key screen**, each fully animated with one real transition. The user picks one or mixes. Output: `.design/directions/{a,b,c}.html`, `.design/directions/compare.html`, a decision entry in `.design/decisions.md`.

## 0. Gate
1. Read `.design/config.json`. If `"directions": "off"` → skip this module, log `directions: skipped (config)` in `decisions.md`, go to `system`.
2. Require an approved `.design/blueprint.md`. If missing, run `blueprint` first.
3. Show the cost warning (verbatim, then wait for an answer):

> Directions builds 3 full HTML prototypes in parallel subagents. Expect roughly 3–4× the tokens of one screen build and a few minutes. Proceed (recommended for new apps), build only 1 direction, or skip? To turn this step off permanently, set `"directions": "off"` in `.design/config.json`.

   - "1 direction" → write only the grounded standard (A), build it, skip the divergence rule.
   - "skip" → log it and continue to `system`.

## 1. Read inputs
- `.design/brief.md` — audience, jobs, personality, constraints, resolved tensions.
- `.design/blueprint.md` — key screen (the highest-priority flow's main screen), its state matrix row, the flow into and out of it.
- `.design/brand.md` + `.design/tokens.json` if present. With a brand: palette and type are **fixed inputs**; directions diverge on the other axes only (still ≥3 of 5 — density, layout, motion personality are enough).
- `canon/personality.md`, `canon/motion.md`, `canon/color.md`, `canon/typography.md` — the cards cited below.

Pick **real content** now: 5–12 concrete items from the brief's domain (names, numbers, dates, statuses) that every direction will use. Same content across A/B/C so the user compares design, not copy.

## 2. Assign axis positions
Five axes, each with three positions:

| Axis | 1 | 2 | 3 |
|---|---|---|---|
| density | airy | balanced | dense |
| contrast | soft (small lightness steps) | standard | stark (large steps, heavy ink) |
| type voice | neutral grotesk | humanist / serif text | expressive display + utility |
| layout structure | single column / centered | sidebar + content | split / asymmetric / canvas |
| motion personality | productive (100–200ms, no bounce) | balanced (150–300ms) | expressive (250–500ms, spatial springs may bounce) |

- **A — grounded standard.** Set each axis to the position the brief most directly implies (cite the brief line). This is the safe, conventional, well-executed option.
- **B and C — pushed.** Roll, don't choose. For each axis run:
  `node -e "console.log(1+Math.floor(Math.random()*3))"`
  Record the raw roll in the spec. Then enforce:
  - B and C each differ from A on **≥3 of 5** axes, and from each other on ≥3. Re-roll only the axes that fail; record re-rolls.
  - A roll that contradicts a **hard** brief constraint (e.g. a11y needs → stark contrast allowed, but "dense" for a first-time elderly audience is not) may be moved one step; log the reason. Taste is not a reason.
- Write the final 3×5 table into each spec and into `compare.html` chips.

## 3. Write the three specs
Write each into `.design/directions/<a|b|c>.spec.md` using this template:

```md
# Direction <A|B|C>: <Name>
Name: from the subject's world (a material, a place, a tool of the trade), never "Modern"/"Clean"/"Minimal".
Thesis: <one sentence: what this direction believes the product should feel like and why, tied to the brief>
Axes: density=<pos> · contrast=<pos> · type=<pos> · layout=<pos> · motion=<pos>  (rolls: <raw numbers or "grounded">)
Tension resolutions:
  - <tension card id>: <which side wins here and why> (e.g. data.tension-density-clarity → density; expert daily users, brief §context)
  - <≥2 entries; cite canon ids>
Palette (OKLCH, 4–6 roles):
  inputs: base hue <h> · accent hue <h> · contrast target <soft|standard|stark>
  background oklch(..) / foreground oklch(..) / muted oklch(..) / primary oklch(..) / accent|border oklch(..) (+ destructive if the screen has one)
  dark: same roles, re-derived (not inverted) — color.dark-mode-not-inverted
  check: fg/bg ≥ 4.5:1, primary-foreground/primary ≥ 4.5:1 (a11y.contrast-minimums)
Type: <display family> + <text family> (+ mono if data) from Google Fonts, fallbacks listed.
  why: <voice reason from the brief; cite typography.* card>
Layout concept: <grid, regions, where the primary action lives, what the eye hits first> (layout.hierarchy-by-weight)
Motion personality: <productive|balanced|expressive>
  durations: micro <n>ms · standard <n>ms · hero <n>ms (from §4 tokens)
  easing: enter cubic-bezier(..) · exit cubic-bezier(..) · move cubic-bezier(..)
  spring (if any): spatial {duration <s>, bounce <0–0.3>} · effects {bounce 0}
  the one real transition: <trigger control → what moves where> (motion.one-signature-moment, motion.spatial-continuity)
Signature detail: <one element that could only belong to THIS subject — e.g. a tide-chart progress bar for a sailing app>
Fingerprint check: <pass | matches: <id> → justified because <brief line> | revised: <what changed>>
```

Rules for the specs:
- Palette: derive, don't pick. Start from base hue (brief/brand), accent hue, and the contrast position. Soft = lightness steps ~4–6%; stark = ≥10% and near-black ink. Chroma of neutrals ≤ 0.02 unless the thesis needs tint.
- Type: any Google Fonts family. Do **not** default to Inter, Space Grotesk, Roboto, or a lone system stack — use one only if the spec's `why` names a brief reason (e.g. "must match existing product UI"). Max 2 families + optional mono (typography.limited-families-weights).
- Motion values come from the §4 tokens: durations `instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500`; easings `enter (0,0,0,1) · enter-emphasized (0.05,0.7,0.1,1) · exit (0.3,0,1,1) · move (0.2,0,0,1) · snappy (0.23,1,0.32,1)`. Exits = 60–75% of enter. Nothing routine over 300ms.
- A must still be *good*: grounded ≠ bland. Give it a signature detail too.

## 4. Fingerprint check (each spec)
Read `rubric/ai-default-fingerprints.md`. For every fingerprint the spec matches (palette, font, layout, gradient, card grid, copy, motion):
- Justify it from a quoted brief line, **or** revise the spec and note what changed.
- Two or more unjustified matches in one spec → rewrite that spec from the thesis down.
Record the result in the spec's `Fingerprint check` line.

## 5. Dispatch builders (parallel)
Send **one message with three Agent tool calls** (`subagent_type: "direction-builder"`), one per direction. If the Agent tool is unavailable, build A/B/C yourself sequentially following `agents/direction-builder.md`.

Each prompt must contain, inline (the subagent does not share your context):
1. The full spec text for that direction.
2. The key screen description from the blueprint: regions, components, primary action, the state to show (normally "full"), and the flow in/out.
3. The shared real-content list from §1.
4. Output path: `<project>/.design/directions/<a|b|c>.html` (absolute).
5. The path to `rubric/ai-default-fingerprints.md` (absolute) for its self-check.
6. This line: "Build ONE self-contained HTML file per agents/direction-builder.md. Report: path, fonts used, the transition implemented, fingerprint self-check result, anything you could not do."

Wait for all three. If one fails or returns without the file, retry that one once; then report the gap to the user.

## 6. Assemble the comparison page
1. Copy `templates/compare.html` → `.design/directions/compare.html`.
2. Replace every `{{PLACEHOLDER}}` (list is in the template's top comment) from the three specs. Escape `<`, `&`, `"` in values. Axis chips use the final table positions.
3. The page loads `a.html`, `b.html`, `c.html` from the same folder via `src`. If publishing through the Artifact tool (single file), inline each direction instead: set `data-srcdoc` placeholders per the template comment.
4. Verify: open it (browser pane / Playwright if available), confirm three frames render with no console errors, the theme toggle flips all three, replay works.

## 7. Present
- **Artifact tool available:** publish the inlined `compare.html` (private by default) and give the link.
- **Else a browser pane / preview tool:** open `file://…/.design/directions/compare.html`.
- **Else:** print the absolute path and tell the user to open it in a browser.

Then ask (one message, choices first):
> Which direction? **A** <name> · **B** <name> · **C** <name> · **Mix** (e.g. "B's layout + A's palette + C's motion") · **None** (tell me what's off).

- Mix: write a merged spec (take each named axis from its source; resolve conflicts, e.g. dense layout + airy spacing, by asking one follow-up). Rebuild only if the user asks to see it.
- None: ask what is wrong in one question with options (too loud / too plain / wrong mood / wrong structure), revise the spec(s), rebuild affected ones.

## 8. Record
Append to `.design/decisions.md`:
```md
## D-<n> Direction: <chosen name or "Mix: …">
- Chosen: <A|B|C|mix details>. Rejected: <others, one-line reason each from the user>.
- Axes: density=… contrast=… type=… layout=… motion=…
- Palette/type/motion carried to system: <summary>
- Cards: <tension resolutions and cards from the chosen spec>
- Files: .design/directions/<x>.spec.md, <x>.html
```
Keep the chosen spec file; it is the input to `system` (tokens + motion language).
