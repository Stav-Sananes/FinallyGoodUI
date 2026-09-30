# Export: rules for other AI tools

Goal: give Cursor, Windsurf, Copilot and any AGENTS.md-aware agent the canon, the interview, the motion tokens and the rubric, so a team gets the same design reasoning whatever tool each person uses.

## Run
```
node "${CLAUDE_SKILL_DIR}/scripts/export-rules.mjs" --out .
```
It writes (showing a diff first if a file exists):
- `.cursor/rules/finally-good-ui.mdc`: globs for tsx, jsx, vue, svelte, html and css; `alwaysApply: false`
- `.windsurf/rules/finally-good-ui.md`
- `.github/instructions/finally-good-ui.instructions.md`: `applyTo` for the same globs
- `AGENTS.md`: a `## finally-good-ui` section, appended or replaced in place

If the project has `.design/`, the export also references `.design/brief.md`, `brand.md` and `tokens.json`, so other tools follow **this project's** decisions and not just the general canon.

## Tell the user
- Exported rules carry the reasoning, the checklist and the tokens. Hooks, subagents (the parallel direction builders and the independent reviewer) and the automatic browser verification **only run in Claude Code**.
- The static checker still works anywhere: `node <skill>/scripts/check-static.mjs --root .`
- Re-run export after the canon or tokens change.
