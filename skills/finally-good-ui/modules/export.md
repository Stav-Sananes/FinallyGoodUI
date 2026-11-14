# Export: rules for other AI tools

Goal: give Cursor, Devin Desktop (formerly Windsurf), Copilot, Kiro, Cline and any AGENTS.md-aware agent (Codex, Amp, Zed, Junie, Antigravity / Gemini CLI, opencode) the canon, the interview, the motion tokens and the rubric, so a team gets the same design reasoning whatever tool each person uses.

## Run
```
node "${CLAUDE_SKILL_DIR}/scripts/export-rules.mjs" --out .
```
It writes every target by default (showing a diff first if a file exists); `--targets cursor,copilot,…` limits it to the tools the team uses. Each file carries the full rules, so each tool works on its own:
- `cursor`: `.cursor/rules/finally-good-ui.mdc`, globs for tsx, jsx, vue, svelte, html and css; `alwaysApply: false`
- `devin` (alias `windsurf`): `.devin/rules/finally-good-ui.md` when the project has `.devin/`, else `.windsurf/rules/finally-good-ui.md` (compacted to Windsurf's 12,000-character limit)
- `copilot`: `.github/instructions/finally-good-ui.instructions.md`, `applyTo` for the same globs
- `kiro`: `.kiro/steering/finally-good-ui.md`, `inclusion: fileMatch` for the same globs
- `cline`: `.clinerules/finally-good-ui.md` with `paths` (`.cline/rules/` when `.clinerules` is an old single file, which is left alone)
- `agents`: a `## finally-good-ui` section in `AGENTS.md`, appended or replaced in place; also in `.junie/AGENTS.md` when it exists, because Junie then reads only that file

Several tools read both their own file and `AGENTS.md`, so the rules can load twice there; that is the price of each file standing alone. Pass `--targets` to skip tools nobody uses. There is no `GEMINI.md` target: Antigravity, which replaced Gemini CLI, reads `AGENTS.md`.

If the project has `.design/`, the export also references `.design/brief.md`, `brand.md` and `tokens.json`, so other tools follow **this project's** decisions and not just the general canon.

## Tell the user
- Exported rules carry the reasoning, the checklist and the tokens. Hooks, subagents (the parallel direction builders and the independent reviewer) and the automatic browser verification **only run in Claude Code**.
- The static checker still works anywhere: `node <skill>/scripts/check-static.mjs --root .`
- Re-run export after the canon or tokens change.
