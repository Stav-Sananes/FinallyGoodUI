---
name: polish
description: Use when an existing, working UI looks plain, generic, unfinished, "AI-made" or not premium enough and the user wants it elevated without a full redesign, or asks to make a screen, page or app look more premium, stylish, refined, expensive or crafted. Also after a finally-good-ui build whose craft score (rubric dimension 10) is below 4.
argument-hint: "[preserve | elevate | overhaul] [screen, route or path]"
---

# polish

Turns a correct interface into a premium one by a sequence of small, verified upgrades, ordered by impact against risk. It changes how things are made (type setting, surfaces, edges, imagery, motif, copy), not what the product is (routes, flows, data, labels people rely on).

`FGU` = `${CLAUDE_SKILL_DIR}/../finally-good-ui`. The values come from `FGU/canon/craft.md`, `FGU/canon/personality.md`, `FGU/canon/typography.md` and `FGU/canon/color.md`. Read `craft.md` in full before step 3; open the others for the cards you apply.

## Modes

| Mode | Use when | May change |
|---|---|---|
| `preserve` | brand and layout are approved; it just looks unfinished | type setting, surfaces, shadows, radii, states, icons, copy tells |
| `elevate` (default) | the look is generic but the structure works | the above + palette roles, font pairing, spacing scale, composition within screens, motif |
| `overhaul` | the user says the look is wrong | the above + layout families per screen; still never routes or flows |

If the mode is not given and the user's words don't decide it, ask once, recommending `elevate`.

## Never change silently
URLs and routes, navigation labels, form field names and order (autofill and analytics depend on them), the logo's shape and wordmark (recolouring it to the new ink or accent token is fine), legal copy, analytics ids and event names, public component APIs. If an upgrade needs one of these, ask. Behaviour is out of scope too, including prototype-only devices such as an auto-playing demo: report them, don't remove them.

## Steps

1. **Context.** Read `.design/` if it exists (`brief.md`, `brand.md`, `tokens.json`, `decisions.md`); the brief's personality decides every value below. Without a brief, ask three questions, one at a time: who uses it and how often; three words for how it should feel; one product they admire and one they don't. Record answers in `.design/brief.md` (create `.design/` if missing).
2. **Baseline.** Render the target screens at 375 and 1440, light and dark (any browser tool; with none, say so and work from code with lower confidence). Save the shots as round `p0`. Run the `slop-check` skill on the target and keep its ledger.
3. **Audit against craft.** For each screen, note each `craft.*` card it misses, with the element and the value seen (e.g. "h1 48px, letter-spacing 0, line-height 1.5"). Also read its current personality: palette, type voice, density, contrast, material, composition, motion.
4. **Decide the target look before touching code.** Polishing the current look in small steps produces a reskin nobody notices; in testing, a careful rung-by-rung polish lost to a bold one-move restyle in every blind comparison ("the original with a font swap"). So first write a **target look** in `.design/decisions.md`, in the shape of a direction spec (`FGU/modules/directions.md` §3): personality blend (from the brief and its references, using the `produces` ranges of `personality.*`, including `luxurious`, `editorial`, `raw-industrial`), palette roles in OKLCH, type pairing with tracking per size, material, motif, accent moment, focal point.
   - **Two-second test (`elevate`, `overhaul`):** the target must differ from the current screen visibly enough that a stranger shown both would tell them apart in two seconds. **A hue swap is not a new look**: the difference must come from at least two of type voice, canvas and material, not from recolouring. If the current palette or font is a framework default with no brief reason (stock blue primary, blue-grey or brand-tinted canvas, Inter/Public Sans/system UI), it is replaced, not tuned. `preserve` keeps palette and fonts and skips this test.
   - **The levers that read as premium, strongest first** (in blind tests these decided every comparison):
     1. **A display type voice with character** for the few large moments (screen statement, key figure): a high-contrast serif, a refined grotesk with tight tracking, or a distinctive display cut, chosen from the brief's three words and references. A neutral UI sans at medium weight everywhere is the sterile default.
     2. **A near-neutral canvas** (warm or cool paper, chroma ≤ 0.015) and raised surfaces one step apart, instead of a canvas tinted with the brand hue.
     3. **Ink actions:** the primary button in near-black (near-white in dark) or the foreground colour; the accent hue reserved for meaning (money in, the current item, one emphasised word or figure). A saturated brand-colour button on a brand-tinted page reads as a theme template (`craft.ink-and-accent`).
     4. Material and edges from the craft cards; the motif kept small.
   - **Clichés:** check the target against the fingerprints file. A fashionable device (for example serif display with one italic word on warm paper) is allowed when the brief's words or references point there and it is executed with craft; say so in `decisions.md`. Do not avoid a strong voice only because it is fashionable: a safe default loses to a well-made trope every time. What is never allowed: effects standing in for craft (glass, glow, gradients, orbs).
   - The brief's references are evidence: a reference to a premium product (a bank, a pro tool) tells you which qualities to take (palette restraint, type precision, material), never the look to copy.
5. **Upgrade ladder.** Build toward the target top to bottom. One rung = one diff (outside git: save a copy of the files per rung, e.g. `.design/rungs/<n>-<name>/`), changed **in tokens first** and components second. After each rung re-render once (the widths and themes from step 2) and check it moved toward the target without breaking anything; judge the **cumulative** result against the original, not each rung against the last.
   1. **Type setting** (highest impact, lowest risk): tracking and leading by size; headline length and wrapping; number setting; the target font pairing (`elevate`+). Cards: craft.tracking-by-size, craft.headline-discipline, craft.number-setting, typography.*.
   2. **Colour roles:** the target palette: neutrals carrying a slight hue of the brand, one accent with both a ceiling and a floor, dark mode re-derived (raised = lighter). Cards: color.*, craft.tension-restraint-liveliness.
   3. **Surfaces and edges:** one material by role; layered tinted shadows; hairlines before boxes, remove box-in-box; concentric radii, radius grows with size. Cards: craft.material-restraint, craft.tinted-shadows, craft.hairlines-before-boxes, craft.concentric-radii.
   4. **Interaction states:** hover (pointer devices only), press (scale 0.97-0.98 or 1px down), focus-visible ring, disabled; motion from tokens. Recipes: `FGU/recipes/motion/button-press.md`.
   5. **Real things:** one icon family at one stroke width; real images, logos and initials instead of drawn placeholders; honest content. Card: craft.real-imagery-and-icons, craft.honest-content.
   6. **Space and composition:** spacing on the scale; group by space; optical alignment of card actions; vary layout families between sections or screen types (`overhaul`: change them). Cards: layout.*, craft.optical-alignment, craft.composition-rhythm.
   7. **Identity:** if the current UI wears a motif as a costume (every card shaped like a ticket, page, folder), shrink it to an accent first. Choose one motif from the product's subject and place it in 3 to 6 places, never as the style of every divider; one signature motion moment if the brief allows. Cards: craft.identity-motif, motion.one-signature-moment.
   8. **Copy tells:** fix what `slop-check` flagged (`writing.plain-claims`, `writing.action-labels`); if it flagged nothing, record "no copy tells" and skip the rung. Labels that users rely on stay (see "Never change silently").
6. **Verify.** Run `slop-check` again: zero blockers, taste items fixed or justified. A blocker whose fix falls under "Never change silently" (for example a dead nav link that needs a new route) is not fixed by you: list it first in the report as a decision for the user, with the fix you propose (e.g. "route Invoices to /invoices, or hide it until that screen exists"). If the `ui-reviewer` agent is available, run it in pairwise mode on `p0` vs final for each screen, twice with the order swapped (finally-good-ui `modules/verify.md` §6); a screen where the original wins either order, or where the reviewer calls the gap `small` in `elevate`/`overhaul`, has not been polished enough: go back to step 4 and make the target bolder, then rebuild.
7. **Report.** Lead with before/after screenshot paths, then the rungs applied (each with its card id), what was reverted and why, and what was left for the user to decide (anything in "Never change silently").

## Common mistakes

| Mistake | Instead |
|---|---|
| Adding effects (glass, glow, gradients, blobs) to look premium | Premium comes from setting: type, edges, light, restraint. Effects are the template |
| Polishing by deleting until it is empty | The sterile default fails too; add the accent moment, motif and focal point |
| Changing components one by one | Change tokens; let components inherit |
| Many rungs in one diff | One rung per diff, verified; otherwise you cannot tell which change hurt |
| Tuning the existing palette and font in small steps | Decide the target look first; replace framework defaults instead of refining them |
| Recolouring and calling it a new look | Change type voice, canvas and action colour; a hue swap is not premium |
| Avoiding every fashionable device and landing on a safe grotesk | Choose the voice the brief earns; justify a trope rather than retreat to the default |
| Skipping the render | Most craft misses are only visible in pixels |
| Restyling labels and routes for "consistency" | Ask first; users and analytics depend on them |
