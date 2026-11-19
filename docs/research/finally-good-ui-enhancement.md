# finally-good-ui enhancement research (2026-11-16)

Question: what would make finally-good-ui more self-running, less generic, more concise, and more visible and accessible for every user?

Method: read SKILL.md, all eight modules, the canon index and the craft, a11y and personality cards, both rubric files, both agents, the hook, `probe.js`, `check-flows.mjs` and `check-static.mjs`. Measured every instruction file. Checked claims against primary sources: Claude Code docs (code.claude.com), the Anthropic skill-authoring guide (platform.claude.com), `anthropics/skills` and `anthropics/claude-cookbooks` on GitHub, the Anthropic blog and engineering posts, W3C (WCAG 2.2, WCAG 3), MDN, Playwright docs, the axe-core repo, and WebAIM. Fetched 2026-11-16. Claims that could not be confirmed from a primary source are marked UNVERIFIED. Token counts are chars ÷ 4 estimates, not tokenizer output.

## TL;DR
1. **The canon pulls output toward the house style it bans.** `craft.ink-and-accent` and the build step's craft pass prescribe "near-neutral canvas + ink primary", which is the `ink-on-paper` fingerprint that directions forbid. The editorial recipe also prescribes two of the five traits Anthropic's own frontend-design skill lists as generated-UI tells. Fix this first: it is the likeliest reason for the 1–2–1 blind result.
2. **A full interactive run blocks on the user about 19–28 times.** These are path pick, role confirm, 12–20 interview questions, brief confirm, blueprint approval, cost warning, direction pick and dependency asks. Cut it to 3 checkpoints with a draft-first brief and plugin `userConfig` defaults.
3. **Every script call can raise a permission prompt.** No `allowed-tools` is set, and that grant clears on the next user message anyway. A narrow plugin `PermissionRequest` hook for `skills/finally-good-ui/scripts/*` is the lasting fix.
4. **The delivery gate (G1–G10) is self-policed.** A plugin `Stop` command hook can enforce it: block with a reason when UI changed, `.design/` exists and the latest report has a FAIL or is missing.
5. **Cross-project sameness has no memory.** Record the chosen fonts, hues, material and composition in `${CLAUDE_PLUGIN_DATA}` and forbid repeats, as Anthropic's skill suggests ("jot down notes about what you've tried").
6. **Replace the single-judge blind test with `claude plugin eval`.** It has a built-in no-plugin baseline, `llm` graders that see PNG screenshots, and a CI threshold.
7. **The full-run instruction load is about 283 KB (~71k tokens).** None of the 25+ reference files over 100 lines has the table of contents the guide asks for. `verify.md` and `system.md` carry native-platform branches into every web run.
8. **Verify misses several standard checks.** There is no forced-colors pass (box-shadow focus rings vanish there), no `prefers-contrast`, and no 320 px reflow, although the canon claims 320. Text spacing (1.4.12), non-text contrast (1.4.11, which the canon also claims) and Focus Not Obscured (2.4.11) are not checked either.
9. **The axe tag filter drops best-practice rules** (`region`, `landmark-one-main`) that `canon/a11y.md` says are measured. axe is also optional, so without it the gate silently loses label, lang and empty-link checks.
10. **The `bin/` folder at the plugin root keeps the plugin off claude.ai and Cowork.** Move the npm CLI elsewhere. Also guard the `!` stack-detect injection: a failing command aborts the whole skill.

---

## 1. Self-automation

### Current state in repo
User-blocking points in an interactive full run:

| Step | Blocks on | Where |
|---|---|---|
| First run | "Pick your path" (3 options) | `SKILL.md:59-67` |
| Detect | confirm inferred roles; `--force` overwrite consent | `modules/detect.md:31-32` |
| Interview | 12–20 questions, one per message, one per `AskUserQuestion` call | `modules/interview.md:22,37,40` |
| Brief | "Is this right? … 'approved'" | `modules/interview.md:71` |
| Blueprint | mandatory approval, plus revision loop | `modules/blueprint.md:80-83` |
| Directions | verbatim cost warning, then wait | `modules/directions.md:8-10` |
| Directions | pick A/B/C/Mix/None, plus a Mix follow-up | `modules/directions.md:136-139` |
| Build | any new dependency | `modules/build.md:42`, `SKILL.md:31` |
| Verify | Playwright install; Expo web deps | `modules/verify.md:107,21` |

Non-negotiable 9 (`SKILL.md:35`) forbids skipping the interview or directions. Autonomy exists but is opt-in only, through `.design/config.json` `"mode":"autonomous"` or a request that says nobody will answer (`SKILL.md:69-77`). `templates/config.json` defaults to `"mode":"interactive"`.

Automation that already exists:
- the `!` stack-profile injection (`SKILL.md:15`);
- a PostToolUse static hook (`hooks/hooks.json`, `scripts/hook-check.mjs`);
- two subagents;
- the scripts.

There is no `allowed-tools` in any SKILL.md frontmatter. There are no Stop, SubagentStop or SessionStart hooks, and no `userConfig`.

### Primary-source findings
- **Skill frontmatter** supports `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork` + `agent`, `hooks`, `paths`, `disable-model-invocation` and `user-invocable`. `allowed-tools` grants "Tools Claude can use without asking permission during the turn that invokes this skill. The grant clears when you send your next message." Skill `hooks` are registered "when the skill is invoked and keep running for the rest of the session", and `once: true` is honoured only in skill frontmatter. https://code.claude.com/docs/en/skills , https://code.claude.com/docs/en/hooks
- **`!` injection failure:** "A failed command aborts the entire skill invocation, not just its own placeholder. Claude never sees the skill content for that invocation." https://code.claude.com/docs/en/skills
- **Compaction:** after compaction, Claude Code "re-attaches the most recent invocation of each skill after the summary, keeping the first 5,000 tokens of each", within a 25,000-token shared budget. The page says nothing about module files read later with Read. That they are not re-attached is an inference. https://code.claude.com/docs/en/skills
- **Hook events** include `SessionStart` (matchers `startup|resume|clear|compact`, with plain stdout added as context), `Stop`, `SubagentStop`, `PermissionRequest`, `PostToolUse` and others. Handler types are `command`, `http`, `mcp_tool`, `prompt` and `agent` (agent is "experimental"). https://code.claude.com/docs/en/hooks
- **Stop blocking:** exit 2, or `{"decision":"block","reason":…}`. "Claude Code overrides a Stop hook after it blocks eight times in a row with no tool call from Claude in between." Check `stop_hook_active` and exit early when it is true. A prompt or agent Stop hook returns `{"ok":false,"reason":…}` and Claude "keeps working and uses the `reason` as its next instruction". https://code.claude.com/docs/en/hooks-guide
- **Auto-approval:** a `PermissionRequest` hook that returns `decision.behavior: "allow"` answers the prompt for the user. "Keep the matcher as narrow as possible." https://code.claude.com/docs/en/hooks-guide
- **Plugin subagents** ignore `hooks`, `mcpServers` and `permissionMode` ("For security reasons…"). `skills` preloading, `effort`, `maxTurns`, `memory` and `isolation: worktree` are supported. https://code.claude.com/docs/en/sub-agents
- **Plugin `userConfig`:** "values Claude Code prompts the user for when the plugin is enabled". Each value appears in `/config`, `options` gives a picker (v2.1.271+), and values are substituted as `${user_config.KEY}` "in skill and agent content". `${CLAUDE_PLUGIN_DATA}` is "kept across plugin updates". https://code.claude.com/docs/en/plugins-reference
- **`AskUserQuestion` timeout:** with `askUserQuestionTimeout` set, an unanswered question closes "and tells Claude you may be away from your keyboard, so Claude proceeds on its own judgment". https://code.claude.com/docs/en/tools-reference . How many questions one call may carry is not stated on that page (UNVERIFIED).
- **`claude plugin eval`** runs cases three times each "with your plugin and the same number again for the no-plugin baseline". Graders include an `llm` judge that is shown PNG/JPEG files, and `--threshold` gates CI. https://code.claude.com/docs/en/plugin-evals
- **Authoring guidance:** "Prefer scripts for deterministic operations", and "plan-validate-execute" catches errors early. https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

### Recommended changes (impact ÷ effort, highest first)
1. **Draft-first brief, 3 checkpoints** (high impact, medium effort). Replace the 12–20-message interview with one step:
   - infer every answer from the code and the request (`interview.md:11-14` already prescribes this);
   - take the question-bank `recommended` option for the rest;
   - ask only the 2–4 questions where no option is recommended for this product or the brief is silent on personality, batched;
   - then show the brief and the blueprint digest **together** for one approval.

   The checkpoints become (a) brief + blueprint, (b) direction pick, (c) hand-off. Restate non-negotiable 9 as "never skip the brief review", not "ask every question". Auto-decide only what is reversible: copy, palette, motion level. Keep asking for anything irreversible: installing dependencies, overwriting tokens, replacing an existing brand (`detect.md:34`).
2. **Plugin `userConfig` for run defaults** (high, low). Add `mode` (interactive / guided / autonomous), `directions` (three / one / off) and `verify` (full / static) with `options` and defaults. Read them through `${user_config.KEY}` in SKILL.md. Users choose once at enable time, the cost warning (`directions.md:8-10`) disappears from every run, and `.design/config.json` stays as the per-project override.
3. **`PermissionRequest` hook in `hooks/hooks.json`** (high, low). Allow only Bash commands whose argv is `node "${CLAUDE_PLUGIN_ROOT}/skills/finally-good-ui/scripts/<name>.mjs"`, using the `if` filter on tool events. Also add `allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)` to all three SKILL.md files for single-turn runs. Do not widen the matcher; the docs warn against it.
4. **Stop hook that enforces the delivery gate** (high, medium). It is a `command` hook running `scripts/gate-check.mjs`:
   - exit 0 unless `.design/` exists and a UI file changed since the last report;
   - block with a reason when `.design/reports/<latest>.md` is missing, has a `FAIL` line, or has any G-item without evidence;
   - honour `stop_hook_active`.

   This makes `verify.md:118` ("Any FAIL blocks calling the work done") real rather than voluntary.
5. **SessionStart hook for resume and compaction** (medium, low). On `startup|resume|compact`, print one line when `.design/` exists: "finally-good-ui: brief confirmed, blueprint approved, next step = directions (modules/directions.md)". That restores the current step after compaction drops module text.
6. **Guard the injection** (medium, trivial). `SKILL.md:15` → `` !`node "${CLAUDE_SKILL_DIR}/scripts/detect-stack.mjs" 2>/dev/null || echo '{"error":"detect-stack failed; run it manually"}'` ``. `scripts/lib/cli.mjs:63` rethrows non-usage errors, which exits non-zero and so aborts the skill.
7. **Treat the AskUserQuestion timeout as "you decide"** (low, trivial). Say so in `interview.md §6`, and mention `askUserQuestionTimeout` in the README for people who run it unattended.
8. **`claude plugin eval` suite** (high, medium). Use 6–10 product briefs with graders for: skill invoked; `.design/brief.md` written; gate report present; `llm` judge on the 1440 screenshot ("reads as designed for <subject>, not a template"). Run it with the no-plugin baseline and gate CI at a threshold. This replaces the 4-pair single-judge table (`README.md:16-27`) with a repeatable Δ.

---

## 2. Anti-generic styling

### Current state in repo
- `rubric/ai-default-fingerprints.md` (102 lines, 40+ fingerprints, both failure directions, `ink-on-paper` at :91, sterile default at :94).
- `check-static.mjs` has 19 slop detectors plus `ink-on-paper` (`check-static.mjs:724`).
- Directions use six axes with random rolls and divergence rules, A quiet / B bold / C subject-led (`directions.md:23-52`), and "None of the three may land on the ink-on-paper house style" (`directions.md:43`).
- Fingerprint review runs per spec (`directions.md:100-106`), fidelity is gate G9 (`verify.md:130`), and the reviewer scores dimension 10.

### Primary-source findings
- **Why output converges:** "During sampling, models predict tokens based on statistical patterns in training data. … Safe design choices–those that work universally and offend no one–dominate web training data." Claude "samples from this high-probability center". Claude "is highly steerable with the right prompting", and the post's skill is "a ~400 token prompt". https://claude.com/blog/improving-frontend-design-through-skills
- **Cookbook:** "You tend to converge toward generic, 'on distribution' outputs." "You still tend to converge on common choices (Space Grotesk, for example) across generations." Its three strategies: guide single dimensions, reference inspirations, call out defaults. https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb
  - The cookbook still recommends "geometric patterns" and "staggered reveals". The current skill below disowns fade-and-slide-up entrances, so this repo's `bg-pattern` and `fade-up-every-section` stance matches the newer source.
- **Current `frontend-design` skill:** https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
  - Distinct choices come from "the subject's industry, subject matter, materials, and vernacular". The repo already does this with direction C.
  - It lists five traits that "AI-generated design right now clusters around":
    1. cream + serif + terracotta "(often near #D97757 — Anthropic's own Claude-interaction accent…)";
    2. near-black + acid accent;
    3. "broadsheet-style layout with hairline rules, zero border-radius";
    4. the SaaS-card kit;
    5. template chrome: ALL-CAPS eyebrows, "meta strings joined with middle dots", "'WORD — fragment'" labels, "tinted near-black (#0B0B0B, #111) standing in for black", "a monospace face for small data labels", "'→'".
  - It also lists accenting "a single word or phrase in a headline … in italic/bold or a different color" and numbered markers 01/02/03 unless "the content actually is a sequence".
  - Its process: plan tokens, then "review that plan against the brief … (work through a similar prompt to see if you arrive somewhere similar)", then build, then critique from screenshots.
  - On memory: "Human creatives have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes."

### Gaps (only what the repo lacks)
1. **The canon steers into the banned house style.** This is the biggest gap.
   - `canon/craft.md:113` prescribes "Keep the canvas near-neutral … draw primary actions in ink … one emphasised word or figure". `modules/build.md:15` re-applies it in the craft pass **after** a direction is chosen, and `directions.md:93` makes it the default for calm, serious, editorial, luxurious and dense briefs. That combination is exactly fingerprint `ink-on-paper` (`fingerprints.md:91`), and "one emphasised word" is an Anthropic-listed tell.
   - `canon/personality.md:164` (editorial) prescribes "ink L 0.18-0.25 (never pure black); hairlines 1px", which are traits 5 (tinted near-black) and 3 (broadsheet hairlines).
   - `craft.md:114` asserts "In blind comparisons, ink actions on a neutral canvas beat saturated brand buttons on a tinted canvas every time" with no source. That breaks the repo's own `unsourced-claim` rule, and the repo's blind test went 1 win, 2 losses, 1 tie (`README.md:21`).
2. **Five Anthropic-listed tells have no fingerprint or detector:**
   - middle-dot meta strings;
   - the `#D97757` accent;
   - tinted near-black standing in for black;
   - monospace *small data labels* (`mono-as-costume` covers headings, nav and body only, `fingerprints.md:35`);
   - single-word colour or weight accent (`mixed-family-emphasis` covers family swaps only, `fingerprints.md:36`);
   - decorative 01/02/03 numbering outside a sequence;
   - also the hero formula "big number with a small label, supporting stats, and a gradient accent".
3. **No counterfactual "generic twin" check.** The fingerprint review compares each spec with a list. Anthropic's skill compares it with what the model would produce for a similar prompt.
4. **No cross-project memory.** `fingerprints.md:91` admits that ink-on-paper "is where this skill's own runs land". Nothing records what earlier projects chose, so the same fonts and hues recur.
5. **Distinctiveness is judged, never measured.** Only `ink-on-paper` is mechanical. There is no measured distance from framework-default palettes or from earlier runs.

### Recommended changes
1. **Make `craft.ink-and-accent` conditional on the chosen direction** (high, low).
   - Delete the global "Colour:" line in `build.md:15` and replace it with "colour per the chosen direction spec".
   - Drop "one emphasised word" from `craft.md:113`.
   - Remove the unsourced claim at `craft.md:114`.
   - In `personality.md` editorial, allow true black and non-hairline structure as options rather than mandates.
   - Re-run the four gallery briefs to confirm the change.
2. **Add the missing tells** (medium, low): fingerprints plus `check-static` rules.
   - Mechanical: middle dot (`·`) joining short strings in JSX text, `#d97757`, `#0b0b0b|#111(111)?` used as text or ink with no `#000` anywhere, monospace on elements ≤ 13px outside `code|pre|td`, and `0[1-9]` marker sequences.
   - Single-word colour accent, by detecting a `<span>` with a colour or weight class inside an `h1`/`h2`.
3. **Generic-twin step in `directions.md §4`** (high, low; text only, no build).
   - Before the specs, write the 6-line spec the model would produce for "a <product category> app" with no brief, as `.design/directions/twin.md`.
   - Each direction must differ from the twin on palette hue (ΔH ≥ 40° or a different chroma class), display family, and composition sentence. Record the differences in the `Fingerprint check` line.
4. **Plugin-level choice history** (high, medium).
   - `scripts/history.mjs --record <spec>` appends `{date, projectHash, families, hues, material, composition}` to `${CLAUDE_PLUGIN_DATA}/history.jsonl`. It stays local and uses no project names.
   - `--check <spec>` fails when a display family or primary hue (±20°) was used in the last 5 projects, unless the brief or brand fixes it.
   - Wire it into directions §4 and into G6.
5. **Measured distinctiveness cap** (medium, medium). Extend `check-palette.mjs` or the probe to report:
   - OKLCH distance of `--color-background` and `--color-primary` from shadcn and Tailwind neutral defaults;
   - whether the loaded font is in a default list (Inter, Geist, Space Grotesk, Roboto, system).

   Feed these as measured caps on dimension 10 (`rubric.md`), the same way 6, 7 and 9 already work.

---

## 3. Conciseness

### Measurements (2026-11-16; tokens ≈ chars ÷ 4)
| File | Lines | Bytes | ~Tokens | TOC |
|---|---|---|---|---|
| SKILL.md | 110 | 11,890 | 3.0k | n/a |
| modules/system.md | 120 | 24,005 | 6.0k | no |
| modules/verify.md | 135 | 19,258 | 4.8k | no |
| modules/directions.md | 153 | 17,301 | 4.3k | no |
| modules/blueprint.md | 84 | 9,024 | 2.3k | — |
| modules/interview.md | 102 | 8,914 | 2.2k | no |
| modules/build.md | 60 | 7,702 | 1.9k | — |
| canon/INDEX.md | 145 | 35,058 | 8.8k | no |
| canon/craft.md | 260 | 23,275 | 5.8k | no |
| canon/personality.md | 203 | 17,431 | 4.4k | no |
| interview/question-bank.md | 384 | 21,755 | 5.4k | no |
| recipes/INDEX.md | 131 | 18,671 | 4.7k | no |
| rubric/ai-default-fingerprints.md | 102 | 14,835 | 3.7k | no |
| agents/direction-builder.md | 82 | 12,021 | 3.0k | — |

- **The mandatory reads for one full interactive run total 283,449 bytes, about 71k tokens.** That is 22 files: SKILL, the 7 pipeline modules, question-bank, canon INDEX plus 5 domain files, both rubric files, recipes INDEX and 4 templates. It is counted before any project file or recipe.
- **Line counts understate the size.** 51 module and SKILL lines exceed 400 characters each, so `system.md` is 120 lines but 6k tokens.
- **`agents/` and `skills/finally-good-ui/agents/` are byte-identical copies,** which risks drift.
- **`skills/finally-good-ui/test.txt` is an untracked stray file** holding a shell error. It would ship.

### Primary-source findings
- "Keep `SKILL.md` under 500 lines." "Once a skill loads, its content stays in context across turns, so every line is a recurring token cost." https://code.claude.com/docs/en/skills
- "The context window is a public good." "Only add context Claude doesn't already have." https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- "For reference files longer than 100 lines, include a table of contents at the top." https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- On nested references, the same guide says "Keep references one level deep from `SKILL.md`". Nested reads may be previewed with "`head -100` … resulting in incomplete information". https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Description: at most 1,024 chars and in the third person. Claude Code truncates `description` + `when_to_use` at 1,536 chars in the listing. https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices , https://code.claude.com/docs/en/skills
- Anthropic's own frontend-design skill is a "~400 token prompt". https://claude.com/blog/improving-frontend-design-through-skills

### Compliance
- **OK:**
  - SKILL.md is at 110 lines (under 500) and about 3k tokens, which is under the 5k re-attach cap.
  - Descriptions are 609 + 298 = 907 chars, third person.
  - `lint-skill.mjs:156` enforces under 500 lines.
- **Violations:**
  - No TOC in any reference file over 100 lines. That is 6 modules or rubric files, 10 canon files, question-bank, recipes INDEX, and several recipes.
  - Two-level chains from SKILL.md: modules → canon/rubric, and recipes/INDEX → recipe files. With 260-line `craft.md`, a `head -100` preview misses most cards.
  - Platform branches for every web run: `verify.md:21-25` (Expo, desktop, Flutter, SwiftUI, Compose; about 1.5k tokens) and the `system.md` §4 per-stack emit table.
  - Repetition: duration and easing values appear in `directions.md:96`, `system.md:41` and `tokens/default.tokens.json`, and the ink-and-accent rule appears in three files.

### Recommended changes
1. **Split by platform** (high, low). Move the native and desktop branches into `modules/verify-native.md`, and the per-stack emit table into `modules/system-emit.md`. Load them only when the stack profile says so. Saves about 3–4k tokens per web run.
2. **TOC lines + lint** (medium, low). Add a 3–8 line `## Contents` to every reference file over 100 lines. Extend `lint-skill.mjs` with: TOC required above 100 lines; per-file token budget (warn above 5k); SKILL.md token budget (warn above 4k, to stay under the 5k compaction re-attach).
3. **Make INDEX cheaper** (medium, medium). `canon/INDEX.md` is 8.8k tokens and is read at interview and blueprint. Split it into `INDEX.md` (ids + 8-word principle, about 3k) and the tensions list. Use `grep -n '<id>' canon/*.md` for lookups, as the guide's "Quick search" pattern does.
4. **Move rarely-needed SKILL.md sections out** (low, low). "Running outside Claude Code" (`SKILL.md:19-24`) and "Autonomous runs" (`SKILL.md:69-77`) go to `modules/portability.md` and `modules/autonomous.md`, keeping one pointer line each. With `userConfig` (§1.2), autonomous mode is known before the module is read.
5. **Deduplicate** (low, low). Keep one `agents/` copy. If `npx skills add` needs the in-skill copy, generate it at pack time. Delete `test.txt`. Reference the motion values from tokens instead of restating them.

---

## 4. Visible and accessible for all users

### Current state in repo
- **Gate:** dimension 1 is a hard gate on any `a11y.*` high or medium finding, in every context and state (`rubric/rubric.md:13`).
- **Matrix:** every viewport × colour scheme, plus one reduced-motion pass (`check-flows.mjs:113-114`). Default viewports are `[375,812]` and `[1440,900]` (`templates/config.json`).
- **Probe rules:** `low-contrast` (text only, `probe.js:205-216`), `small-target`, `focus-invisible`, `focus-weak`, `focus-hidden` (off-canvas only, `probe.js:283`), `missing-name`, `img-no-alt`, `heading-order`, `clipped-text`, `overflow-x`, `layout-shift`, `motion-under-reduce`, and others.
- **axe:** runs only if `@axe-core/playwright` is installed in the user's project (`check-flows.mjs:572`), with `withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa'])` (`check-flows.mjs:467`).
- **Static checks:** `user-scalable-no` (1.4.4), `paste-blocked` (3.3.8), `role-no-keyboard`, `outline-none-no-focus`.
- **APCA** is informational only (`scripts/lib/contrast.mjs:203`).
- **Nowhere** in canon, modules, rubric or scripts are `forced-colors` or `prefers-contrast` handled.

### Primary-source findings
- **WCAG 2.2** (Recommendation, 5 Oct 2023) added 2.4.11 Focus Not Obscured (Min) AA, 2.4.12 AAA, 2.4.13 Focus Appearance AAA, 2.5.7 Dragging Movements AA, 2.5.8 Target Size (Min) AA, 3.2.6 Consistent Help A, 3.3.7 Redundant Entry A, 3.3.8 Accessible Authentication (Min) AA, and 3.3.9 AAA. It removed 4.1.1. https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- **Normative text** (https://www.w3.org/TR/WCAG22/):
  - 1.4.10: "Vertical scrolling content at a width equivalent to 320 CSS pixels";
  - 1.4.11: "contrast ratio of at least 3:1 against adjacent color(s)" for UI components and graphics;
  - 1.4.12: line height 1.5×, paragraph spacing 2×, letter 0.12×, word 0.16× without loss of content;
  - 2.4.11: a focused component "is not entirely hidden due to author-created content".
- **Most common failures** (WebAIM Million 2026, Feb 2026 crawl): low-contrast text 83.9% of home pages, missing alt 53.1%, missing form labels 51%, empty links 46.3%, empty buttons 30.6%, missing `lang` 13.5%; 56.1 errors per page. https://webaim.org/projects/million/
- **WCAG 3** is a Working Draft dated 10 Sep 2026. Its text-contrast requirement reads "meets @@[contrast measure to be determined]", with the note "The contrast algorithm used in WCAG 3 is yet to be determined" (https://www.w3.org/TR/wcag-3.0/). It "will not supersede WCAG 2", and WCAG 2.2 stays the target (https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/). APCA is therefore not normative anywhere, so the repo's "informational" stance is correct.
- **`forced-colors`** is Baseline widely available (since Sep 2022). In forced-colors mode "`box-shadow` is forced to 'none'" and non-url `background-image` is too. Use system colours such as `ButtonText` and `CanvasText`. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- **`prefers-contrast`** (`more|less|custom`) is Baseline widely available (since May 2022), and `custom` matches forced-colors palettes. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
- **Playwright** `page.emulateMedia` accepts `forcedColors: "active"|"none"` and `contrast: "more"|"no-preference"`, alongside `colorScheme` and `reducedMotion`. https://playwright.dev/docs/api/class-page#page-emulate-media
- **axe-core 4.14:** the WCAG 2.2 section contains only `target-size`, and "These rules are disabled by default". `region`, `landmark-one-main` and `heading-order` carry the `best-practice` tag, not a `wcag*` tag. https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md . Whether a `wcag22aa` tag filter turns on a rule that is disabled by default is not stated in API.md (UNVERIFIED). No axe rule covers 2.4.11, 2.5.7, 3.2.6, 3.3.7 or 3.3.8.

### Gaps
1. **No forced-colors pass.**
   - The probe counts a box-shadow change as a visible focus (`probe.js:255,280`), and box-shadow is removed under forced colors. So a box-shadow-only focus ring passes the gate yet is invisible to Windows contrast-theme users. Tailwind's `ring-*` utilities are box-shadow based (UNVERIFIED here).
   - The craft canon's elevation (`craft.tinted-shadows`) and gradient surfaces also vanish there.
2. **No `prefers-contrast: more` handling** in tokens or verify.
3. **Reflow at 320 px is never run.** `canon/layout.md:69` claims "At 320, 375, 768 and 1440 px", but the default viewports are 375 and 1440 only.
4. **Text spacing (1.4.12) is not tested.**
5. **Non-text contrast (1.4.11) is not measured.** `canon/a11y.md:19` claims the probe checks "every input/button border vs its adjacent background", but `low-contrast` checks text nodes only. Focus-indicator contrast is not checked either.
6. **Focus Not Obscured (2.4.11) is not checked.** `focus-hidden` only catches off-canvas focus; sticky headers, toasts and cookie bars covering the focused element are not caught.
7. **The axe tag filter excludes the best-practice rules** that `canon/a11y.md:73` lists as measured (`landmark-one-main`, `region`).
8. **axe is optional.** Without it, the top WebAIM failures (labels, empty links and buttons, `lang`) are covered only partly by `missing-name`, and the gate still reads as passing. The report records only `axe: false`.

### Recommended changes
1. **Add a forced-colors context** (high, low).
   - Add one context `{forcedColors:'active'}` at the first viewport, and re-run the focus walk there with `focus-invisible` severity high.
   - Add a static rule: a focus style built only from `box-shadow`/`ring` with no `outline` (even `outline: 2px solid transparent`) and no `@media (forced-colors: active)` block.
   - Add one craft or a11y card: system colours for borders that carry elevation under forced colors.
2. **Probe additions** (high, medium).
   - `nontext-contrast`: input and button borders, focus ring vs adjacent background, icon-only button glyphs, all at 3:1.
   - `focus-obscured`: after focusing, compare `document.elementFromPoint` at the focused element's centre and corners with the element. Flag when all points hit another fixed or sticky element.
   - `text-spacing`: inject the 1.4.12 values as a style, then re-run `clipped-text` and `overflow-x`.
3. **Add 320 to the default viewports, or an overflow-only 320 probe** (medium, trivial). That makes `layout.md:69` true.
4. **Fix axe wiring** (medium, low).
   - Add `best-practice` to `withTags`, or call `.withRules([...])` for `region`, `landmark-one-main` and `target-size`.
   - When axe is missing, mark dimension 1 "partial (no axe)" in the scorecard and the chat summary.
   - Consider bundling `axe-core` into the probe path so the gate does not depend on a project dev dependency. Licence check needed: axe-core is MPL-2.0 (UNVERIFIED here).
5. **`prefers-contrast: more` token variant** (low, medium). `emit-tokens` would emit an `@media (prefers-contrast: more)` block that raises muted-text and border lightness steps and thickens hairlines. Verify it with one `contrast:'more'` context.
6. **Leave APCA informational.** Do not adopt APCA thresholds; WCAG 3 has none.

### Discoverability ("visible")
- **`bin/` at the plugin root:** the plugin docs say "claude.ai and Cowork don't install a plugin that has this directory" (https://code.claude.com/docs/en/plugins-reference). `bin/finally-good-ui.mjs` exists only for the npm CLI (`package.json` `bin`). Move it to `cli/` and repoint `package.json` (high, trivial).
- **`plugin.json`** lacks `displayName`, `homepage`, `repository` and `license`. It also lacks the directory-listing fields (`icon`, `documentationUrl`) that Anthropic's directory reads on submission (same source). Add them (low, trivial).
- **Triggering:** the description is well under the caps. But the user may also have `frontend-design`, `ui-ux-pro-max` and other UI skills installed, so the trigger overlap is real. Add "skill invoked" graders to the eval suite (§1.8) for 5 phrasings ("make this look less AI", "design a dashboard", "review my UI") (medium, low).
- **README:** the blind table's honest 1-2-1 is the first result readers see. Replace it with the eval suite's Δ vs no-plugin baseline once that exists, and keep the gallery as illustration.

---

## Ranked shortlist
| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Make `craft.ink-and-accent` + build craft pass direction-conditional; drop unsourced claim | high | low |
| 2 | Plugin `userConfig` (mode / directions / verify) + draft-first brief with 3 checkpoints | high | medium |
| 3 | Narrow `PermissionRequest` hook + `allowed-tools` for skill scripts | high | low |
| 4 | Stop hook enforcing the delivery gate | high | medium |
| 5 | Forced-colors context + box-shadow-only focus rule | high | low |
| 6 | Generic-twin step + `${CLAUDE_PLUGIN_DATA}` choice history | high | low–medium |
| 7 | `claude plugin eval` suite with no-plugin baseline, screenshots, trigger checks | high | medium |
| 8 | Move `bin/` → `cli/` (claude.ai/Cowork install) | medium | trivial |
| 9 | Probe: non-text contrast, focus-obscured, text-spacing; 320 viewport; axe best-practice | medium | medium |
| 10 | Split native branches out of verify/system; TOCs; token-budget lint | medium | low |
| 11 | Add missing Anthropic-listed tells as fingerprints + detectors | medium | low |
| 12 | Guard `!` injection; SessionStart resume line | medium | trivial |
