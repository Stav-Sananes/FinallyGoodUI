# Step 1: Detect

Goal: know the stack, what design already exists and what the app already contains, before asking the user anything. **Every fact you detect is a question you don't have to ask.**

## 1. Stack profile
The profile is already injected at the top of SKILL.md. If it is missing or stale, run:
```
node "${CLAUDE_SKILL_DIR}/scripts/detect-stack.mjs" --root .
```
Note: `framework`, `styling.tailwind`, `components`, `animation`, `icons`, `devScript`, `testing`.
- `framework: unknown` with no `index.html` means a greenfield project. The stack is decided in the interview (`interview.constraints.platform-stack`).
- Never assume an icon library, component kit or animation library that isn't listed.

## 2. Project state
- If `.design/` exists, read `config.json`, then the rest of `.design/`. Resume from the first incomplete step (see SKILL.md routing).
- If it doesn't exist, create `.design/` and copy `templates/config.json` to `.design/config.json`.

## 3. Existing design system
If `designFiles` is non-empty or the app has real UI:
```
node "${CLAUDE_SKILL_DIR}/scripts/extract-tokens.mjs" --root .
```
Read the JSON:
- `tokens`: what is formally defined.
- `usage`: what is actually used, with counts.
- `drift`: values used 3 or more times that aren't tokens. These are candidate tokens or inconsistencies.
- `inferred`: guessed roles, e.g. "primary = oklch(…), used 142×".

Then:
1. Write `.design/brand.md` from `templates/brand.md`. Fill in only what the evidence supports and mark inferred roles `(inferred, N uses)`.
2. Show the user a short summary: **what was found, the inferred roles to confirm, and the top 3 drift issues.** Ask them to confirm or correct the inferred roles in one reply.
3. Once confirmed, run `extract-tokens.mjs --root . --write` to create `.design/tokens.json` (add `--force` only if the user agrees to overwrite).

An existing brand is **binding**. Later steps extend it and never replace it, unless the user asks for a redesign.

## 4. Existing app structure (skip for greenfield)
Map quickly, without reading every file:
- routes and pages (the router folder or router config)
- the layout/shell component and how navigation is rendered
- shared components (`components/`, `ui/`)
- how data is loaded, which matters for loading and error states

Write a 10–20 line "Existing app" section into `.design/brief.md`, or hold it for the interview.

## Output of this step
- The stack profile, noted.
- `.design/config.json`.
- `.design/brand.md` and `tokens.json` if a design system exists and is confirmed.
- A short list of facts that let the interview skip questions: platform, stack, brand, existing navigation.
