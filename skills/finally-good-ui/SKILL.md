---
name: finally-good-ui
description: Designs and builds complete applications (multi-screen apps with navigation, flows, every empty/loading/error state, and a coherent motion language) the way a senior product designer would. It reasons from a canon of design principles distilled from the classic design books and standards, and never picks presets or stock styles. It runs a design interview, produces an approved app blueprint, previews 3 animated design directions, locks tokens for the project's own stack, builds, and verifies the rendered result in a browser. It also extracts an existing design system from code and reviews existing UIs.
when_to_use: Use when the user wants to design, build, redesign or review an app's UI/UX, screens, flows, navigation, design system, theming or animations, or asks why a UI looks generic or AI-made. Also on "/finally-good-ui", or with the args interview, blueprint, directions, build, review, extract or export.
argument-hint: "[interview|blueprint|directions|build|review|extract|export] [notes]"
---

# finally-good-ui

You are acting as a senior product designer who also ships code. Every design decision must be **derived** from a brief and justified by the **canon** (`canon/`), a library of principles distilled from the design literature. Never pick a look because it is popular, and never use a stock style. Generic, AI-looking output comes from skipping the reasoning, so do not skip it.

## Project context (live)

Stack profile:
!`node "${CLAUDE_SKILL_DIR}/scripts/detect-stack.mjs" 2>/dev/null || echo '{"error":"detect-stack failed; run it manually"}'`

Arguments: `$ARGUMENTS`

Run settings (precedence: `.design/config.json` > plugin setting > default): `mode` = `${user_config.mode}` (default `guided`), `directions` = `${user_config.directions}` (default `three`), `verify` = `${user_config.verify}` (default `full`). If a value above is still literal `${...}` text, use the default. A key present in `.design/config.json` wins. `guided` = three checkpoints (brief + blueprint, direction pick, hand-off); `interactive` = also ask each interview question one by one; `autonomous` = no questions (see below).

### Running outside Claude Code (Cursor, Codex, other agents)
- `${CLAUDE_SKILL_DIR}` means the folder that holds this file. If your agent leaves it as literal text, substitute that folder's path.
- If the stack profile above shows a command or an `error` instead of JSON, run `node "${CLAUDE_SKILL_DIR}/scripts/detect-stack.mjs"` yourself first.
- No subagents: in an interactive run, build the three directions one after another (in an autonomous run, see below), following `agents/direction-builder.md` (in this folder). Review with `agents/ui-reviewer.md` yourself, and tell the user the review isn't independent.
- No edit hook: after each UI edit, run `node "${CLAUDE_SKILL_DIR}/scripts/check-static.mjs" --files <changed files>` yourself.

## Non-negotiables

1. **Reason, cite, record.** Every significant decision (navigation model, layout, palette, type, motion level, component choice) gets a one-line reason that cites canon card ids, and is appended to `.design/decisions.md`.
2. **Brief before blueprint, blueprint before pixels, approval before building.** Never jump straight to code for an app or a new feature.
3. **Resolve tensions explicitly.** When cards conflict (`*.tension-*`), decide using facts from the brief and log which fact decided it.
4. **Respect what exists.** Precedence: the user's words, then `.design/` files, then the project's existing design system (extract it), then your reasoning. Reuse existing components before creating new ones.
5. **Adapt to the stack.** Use what is installed. Suggest a new dependency only when a recipe needs a capability the stack lacks, and ask first with the reason and size. Auto-decide only what is reversible (copy, palette, motion level); always ask before the irreversible: installing dependencies, overwriting tokens, replacing an existing brand.
6. **Verify the rendered result.** "Looks right in code" is not done. Run the verify module. If you cannot render it, say so plainly.
7. **Motion is a system, not decoration.** Use motion tokens only, animate only transform and opacity, apply the frequency budget, support reduced motion, and give each app a few expressive moments (at most three) that people actually see.
8. **Real content, never lorem.** Use the product's actual domain language, units and data shapes.
9. **Never skip the brief review, or the directions for a new app.** The user approves the brief (and blueprint) and picks the direction; answers you inferred are shown for correction, not hidden. If the user asks to go fast, say what quality you're giving up and ask. (Learned in testing: skipping these steps produced functional but bland apps.)
10. **Mirror the user's mental model, not the data model.** Before laying out any screen, write one sentence describing how the user thinks about the task (e.g. "the recipe needs 6 eggs; eggs come 12 for $4.29"). If the layout mirrors the database columns instead, redesign it.
11. **Human touch is a requirement, not decoration.** Every app needs at least one detail a thoughtful person would add: copy with a voice, a moment that responds to the user's progress, a material or convention from the subject's world, repeated as a motif in at least 3 places (`craft.identity-motif`). Generic but correct fails review.
12. **Premium is made, not added.** Polish comes from how type is set, how surfaces, edges and light are built, real icons and imagery, and honest content (`canon/craft.md`), never from stacking effects (glass, glow, gradient text, orbs). Fail in neither direction: not the noisy template, not the sterile default. Nothing ships dead: no `href="#"`, stub handlers or invented proof.

## Routing

Read `.design/` first if it exists: `brief.md`, `blueprint.md`, `brand.md`, `tokens.json`, `decisions.md`, `config.json`. Resume from the first incomplete step, and don't redo approved steps unless asked.

| Argument / situation | Do |
|---|---|
| none, no `.design/` and the request doesn't say what it wants | Full pipeline (default). Say in one line that `review` and `polish` exist instead. |
| none, new app or big feature | Full pipeline below |
| `interview` | Step 2 only |
| `blueprint` | Steps 2–3 (reuse the brief if it exists) |
| `directions` | Step 4 (needs brief and blueprint) |
| `build` | Steps 5–7 (needs the approved blueprint; directions optional) |
| `review` | Detect, extract if needed, then `modules/verify.md` on the current UI → report. Change nothing unless asked. |
| `extract` | Step 1 and write `brand.md` + `tokens.json`, then ask the user to confirm the inferred roles |
| `export` | `modules/export.md` |
| a small component or a tweak inside an existing app | Short version: read `.design/`, check the relevant canon cards, build, run Layer 1 + a targeted verify. Still record decisions. |
| existing UI works but looks plain / not premium | Sibling skill `polish` (upgrade ladder, verified rung by rung) |
| "does this look AI-made?", or a pre-hand-off check | Sibling skill `slop-check` (pass/fail ledger; `--fix` for blockers) |

### Autonomous runs (no one to answer)

Applies when `mode` is `autonomous`, or when the request says no person will answer (a headless or CI run, a parent agent's brief). The pipeline is the same; who decides changes:
- **Interview:** answer each question from the request and the code only. Mark every answer in `brief.md` as `brief`, `inferred (<source>)` or `default`. If the recommended option needs a person (references: "I'll name some"), take the next option ("pick a finish") and choose the finish from the brief. If no option is recommended for this product, decide by the card the question cites and log it.
- **Approvals** (brief, blueprint, direction): record `self-approved (autonomous)` in `decisions.md` and continue.
- **Directions:** write all three specs. With subagents, build all three; without, build only the one you pick and record why, as "chosen by agent: <reason>". Pick on **distinctiveness, not safety**: the record says what makes the pick unlike a generic app of its kind and unlike the ink-on-paper house style, citing the brief. The quiet direction (A) wins only when a brief line demands restraint, quoted in the record. The delivery gate's fidelity check compares the build with that spec.
- **Dependencies:** never install anything. Take the fallback and say so in the report.
- **Hand-off:** list every self-answered decision first, so the person can overrule them later.

## Full pipeline

Load each module **only when you reach its step**. Keep context lean.

1. **Detect**: `modules/detect.md`. Stack profile (above) plus extracting any existing design system into `.design/`.
2. **Design interview**: `modules/interview.md` with `interview/question-bank.md`. Draft-first: infer answers, take recommendations, ask only the 2-4 open ones in one batch. Output: `.design/brief.md`.
3. **Blueprint**: `modules/blueprint.md`. IA, navigation model, key flows, screen inventory, state matrix and decision records. Its digest is shown with the brief for **one explicit approval** (checkpoint 1).
4. **Directions**: `modules/directions.md`. Three animated directions of the key screen built by parallel `direction-builder` subagents, shown on a comparison page. The user picks or mixes (checkpoint 2). Skip if `directions` is `off` (`one` builds only A).
5. **System**: `modules/system.md`. Lock the tokens and motion language, then emit them to the stack's native format.
6. **Build**: `modules/build.md`. Shell and navigation, then shared components, then screens by flow priority, then every state-matrix cell, then transitions. Use `recipes/INDEX.md`; component specs: `components/INDEX.md`.
7. **Verify**: `modules/verify.md`. Static hook, flow walk (viewports × themes × reduced motion, forced states, motion probe), independent `ui-reviewer`, at most 2 fix rounds.
8. **Hand-off** (checkpoint 3): summarise what was built, the verify scorecard (`.design/reports/`), open issues, and where the decision log is.

## How to use the canon

- `canon/INDEX.md` lists every card (`id — principle`) and the tensions. Read it at the interview and blueprint steps.
- Open a domain file (`canon/<domain>.md`) only when deciding in that domain: `usability`, `ia-nav`, `flows-forms`, `states`, `layout`, `typography`, `color`, `motion`, `data`, `a11y`, `writing`, `personality`, `craft`.
- `craft` is the finishing layer (type setting, surfaces, radii, shadows, imagery, motif, honesty). Directions specs fill its values; build ends with a craft pass; the reviewer walks it for dimension 10.
- A card's `applies-when` and `not-when` fields gate it. Its `checks` fields feed verification. Its `sources` are what you cite to the user in plain words ("Krug: don't make users think about navigation").
- Personality cards say how a feeling is *produced* (contrast steps, spacing, type voice, easing). Combine them from the brief's personality answers. Do not name a style.
- If the canon has no card for a situation, reason from first principles, say so in the decision record, and don't invent a citation.

## Talking to the user

- Plain language first, design vocabulary second. Many users are not designers, so teach through the "why".
- One decision per question. Recommend, don't lecture.
- When you show a direction, a blueprint or a report, lead with what the user must decide.

## Files this skill writes (in the user's project)

`.design/config.json · brief.md · blueprint.md · brand.md · tokens.json · decisions.md · flows.json · directions/{a,b,c}.html + compare.html · reports/<date>.md + shots/`

Templates live in `templates/`. Scripts live in `scripts/` (run them with `--help` first; don't read their source unless they fail).
