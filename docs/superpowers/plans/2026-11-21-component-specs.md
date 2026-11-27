# Component Specs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give finally-good-ui a framework-neutral component spec registry, a scaffolder that turns a spec into project-native code, and a conformance checker, then show the effect with four sample apps in four frameworks.

**Architecture:** Each component is `spec.md` + `spec.json` + a plain HTML/CSS/JS reference under `skills/finally-good-ui/components/<name>/`. `scaffold-component.mjs` reads a spec, the stack profile (`detect-stack.mjs`) and `.design/component-style.json`, and emits shared token-only CSS plus per-framework markup that calls either the project's own primitives or the shared behaviour module. `check-components.mjs` verifies the output against `spec.json`.

**Tech Stack:** Node >= 20 ES modules, `node:test`, no new runtime dependencies. Markdown for specs and adapters.

**Spec:** `docs/superpowers/specs/2026-11-21-component-specs-design.md`

## Global Constraints

- Node >= 20, ES modules, zero runtime dependencies in anything under `scripts/` (package `files` ships only `bin/`, `check-static.mjs`, `scripts/lib/`).
- `npm test` stays green; run it bare, never piped into `head`/`tail`/`grep` (zsh has no `pipefail`).
- Components use tokens only: no hex, px, or ms literals. Motion only `transform` and `opacity`, reduced motion respected.
- Style comes from `.design/component-style.json`, never from a spec. There is no neutral fallback profile.
- Behaviour source order per component: (1) project's installed primitives or kit, (2) shared plain behaviour module, (3) never a fresh per-framework rewrite.
- Never overwrite an existing project file without `--force`.
- New markdown must stay short: spec.md 60-80 lines, adapter files <= 80 lines. Skill instruction load must not grow for projects that never scaffold components.
- Local commits only; no push, no publish. Subagents run on Sonnet (`model: "sonnet"`).
- Shell is zsh: quote globs.

## Review Focus

1. Framework `html`/`unknown` → scaffold emits plain output and says so (exit 0); native frameworks (`expo`, `react-native`, `flutter`, `swiftui`, `compose`) → exit 2 with a message.
2. Target file already exists → skipped and reported; with `--force` replaced.
3. `.design/component-style.json` missing → exit 2 naming the file; invalid enum → exit 2 naming the field.
4. Adapter output re-implements a spec'd key (e.g. an `onKeyDown` for `Escape` in a Dialog) while a primitive or shared module owns it → `key-handler-reimplemented`.
5. A `parts` entry absent from the generated markup, or a state with no CSS → named in the finding, not a generic failure.

---

## File Structure

| Path | Responsibility |
|---|---|
| `skills/finally-good-ui/components/INDEX.md` | one line per component |
| `skills/finally-good-ui/components/<name>/{spec.md,spec.json,reference/}` | one component |
| `skills/finally-good-ui/components/adapters/{plain,react,vue,svelte,angular}.md`, `light/{solid,lit}.md` | framework mapping rules |
| `skills/finally-good-ui/scripts/lib/component-spec.mjs` | load + validate spec.json |
| `skills/finally-good-ui/scripts/lib/style-profile.mjs` | validate profile, produce CSS layer |
| `skills/finally-good-ui/scripts/lib/scaffold.mjs` | pure planner: spec + stack + profile → file list |
| `skills/finally-good-ui/scripts/scaffold-component.mjs` | CLI over the planner |
| `skills/finally-good-ui/scripts/check-components.mjs` | conformance CLI |
| `skills/finally-good-ui/scripts/test/component-*.test.mjs`, `test/fx/components/` | tests + fixtures |
| `skills/finally-good-ui/tokens/default.tokens.json` | add groups `border`, `ring`, `size`, `z` |
| `skills/finally-good-ui/modules/build.md`, `SKILL.md`, `scripts/lint-skill.mjs` | integration |
| `docs/gallery/r4/` | showcase apps, captures, blind page |

---

### Task 1: Token groups for components

**Files:** Modify `tokens/default.tokens.json`, `tokens/default.tokens.dark.json` if it mirrors groups, `scripts/emit-tokens.mjs` only if a new group is not emitted. Test: `scripts/test/component-tokens.test.mjs`.

**Interfaces:** Produces CSS variables `--border-width-hairline`, `--border-width-strong`, `--ring-width`, `--ring-offset`, `--size-control-sm`, `--size-control-md`, `--size-control-lg`, `--z-overlay`, `--z-toast` in `emit-tokens.mjs --format css` output. Consumed by every spec's `tokens` list.

- [ ] **Step 1: Write the failing test.** `emits component token groups as CSS variables`: run `emit-tokens.mjs --in tokens/default.tokens.json --format css`, assert stdout contains each variable name above.
- [ ] **Step 2: Run** `node --test scripts/test/component-tokens.test.mjs` from the skill dir. Expected: FAIL (variables missing).
- [ ] **Step 3: Add the four groups** with values that satisfy the 44px touch target for `--size-control-lg` and a 2px+ ring; reuse the existing group format; change `emit-tokens.mjs` only if the groups don't emit.
- [ ] **Step 4: Run** the new test and `npm test`. Expected: PASS, 0 fail.
- [ ] **Step 5: Commit** `feat(tokens): border, ring, size and z groups for components`.

### Task 2: Spec schema and loader

**Files:** Create `scripts/lib/component-spec.mjs`, `scripts/test/component-spec.test.mjs`, `scripts/test/fx/components/spec-valid.json`, `spec-bad-*.json`.

**Interfaces:** Produces:
- `validateSpec(spec: unknown): { ok: boolean, errors: string[] }`
- `loadSpec(componentDir: string): Spec`, throws `Error` with the file path when invalid.
- `Spec = { name: string, shapes: string[], props: {name,type,default?}[], events: string[], slots: string[], states: {name,attribute}[], a11y: { role: string, aria: string[], keys: Record<string,string> }, tokens: string[], parts: string[], pattern?: string }`

- [ ] **Step 1: Write failing tests:** `accepts the valid fixture`; `rejects missing a11y.role` (error text contains `a11y.role`); `rejects a state whose attribute is empty`; `rejects a token not starting with "--"`; `rejects duplicate part names`.
- [ ] **Step 2: Run** `node --test scripts/test/component-spec.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `validateSpec` and `loadSpec` in `lib/component-spec.mjs`; hand-written checks, error strings are dotted paths.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(components): spec.json schema and loader`.

### Task 3: Style profile and CSS layer

**Files:** Create `scripts/lib/style-profile.mjs`, `scripts/test/component-style.test.mjs`, fixtures `test/fx/components/profile-quiet.json`, `profile-bold.json`.

**Interfaces:** Consumes `Spec` (Task 2). Produces:
- `validateProfile(p: unknown): { ok: boolean, errors: string[] }`; `Profile = { radius: "sharp"|"soft"|"round", material: "flat"|"layered"|"outlined", density: "airy"|"balanced"|"dense", motif: string, motion: "productive"|"balanced"|"expressive" }`
- `profileCss(profile: Profile, spec: Spec): string`: a CSS layer that targets `[data-part]` and state attributes from the spec, using only `var(--…)` from `spec.tokens`, with a `prefers-reduced-motion: reduce` block.

- [ ] **Step 1: Write failing tests:** `rejects an unknown radius value` (error names `radius`); `profileCss contains no hex, px or ms literals` (regex over the output, for both fixtures); `two different profiles give different CSS for the same spec` (assert inequality and that `material` changes the `box-shadow`/`border` declarations); `output has a reduced-motion block`.
- [ ] **Step 2: Run** `node --test scripts/test/component-style.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** both functions; map radius/material/density/motion to token references (for example density → `--size-control-*` and `--space-*` choices), never to literals.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(components): style profile and token-only CSS layer`.

### Task 4: Button spec and reference (tracer bullet)

**Files:** Create `components/INDEX.md`, `components/button/{spec.md,spec.json,reference/index.html,button.css,button.js}`. Test: `scripts/test/component-reference.test.mjs`.

**Interfaces:** Produces the first real spec fixture; `button.js` exports `attach(root: HTMLElement): () => void` (returns a detach function). Same signature for every later reference.

- [ ] **Step 1: Write failing test:** `every component spec.json under components/ validates` (loops directories, uses `loadSpec`); `every spec's parts appear as data-part in its reference/index.html`; `every spec's tokens exist in default.tokens.json emitted CSS`.
- [ ] **Step 2: Run** `node --test scripts/test/component-reference.test.mjs`. Expected: FAIL (no components dir).
- [ ] **Step 3: Write the Button spec** (shapes: primary, secondary, ghost, destructive; states: default, hover, active, focus-visible, disabled, loading as `aria-busy`), with `pattern` omitted; reference uses a real `<button>`, tokens only; spec.md follows the existing pattern-card shape (Intent, Cards, When NOT to use, Tokens, Keyboard, Markup).
- [ ] **Step 4: Run** the test file and `node scripts/lint-skill.mjs --strict`. Expected: PASS, no lint errors.
- [ ] **Step 5: Commit** `feat(components): button spec and reference`.

### Task 5: Scaffold planner and CLI

**Files:** Create `scripts/lib/scaffold.mjs`, `scripts/scaffold-component.mjs`, `scripts/test/component-scaffold.test.mjs`, fixtures `test/fx/components/projects/{react-radix,vue-reka,svelte-bits,angular-cdk,plain}/` (each a `package.json` plus `.design/component-style.json`).

**Interfaces:** Consumes `loadSpec`, `profileCss`, `validateProfile`, and `detect-stack` output. Produces:
- `planScaffold(input: { spec: Spec, stack: StackProfile, profile: Profile, root: string, force: boolean }): { files: {path: string, content: string, skipped?: "exists"}[], source: "primitives:<name>" | "shared", notes: string[] }`; pure, no disk writes.
- CLI: `scaffold-component.mjs --name <component> [--root <dir>] [--framework <name>] [--force] [--dry-run]`; prints `{tool:"scaffold-component", source, files:[{path,skipped?}], notes}`; exit 2 on usage errors.
- Output files: `<components dir>/<name>/<name>.css` (the profile CSS), one framework file (`.tsx`, `.vue`, `.svelte`, `.component.ts`+`.html`, or `.html`), and `<name>.behaviour.js` (copy of the reference script) only when `source` is `shared`.

- [ ] **Step 1: Write failing tests** (one per Review Focus 1-3): `react project with radix → source primitives:radix and no behaviour.js`; `plain project → source shared, behaviour.js present`; `vue, svelte, angular fixtures each emit their file extension`; `native framework exits 2`; `existing target is skipped, --force replaces it`; `missing component-style.json exits 2 naming the file`; `output is byte-identical on a second run` (determinism).
- [ ] **Step 2: Run** `node --test scripts/test/component-scaffold.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `planScaffold`** with one small template function per framework, keyed by `stack.framework`; primitives selection reads `stack.primitives[0]`; components directory is `src/components/fgu` unless `stack` indicates `components.json` (use its aliases) . Then the CLI via `runCli` from `lib/cli.mjs`.
- [ ] **Step 4: Run** the test file and `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(components): scaffold-component CLI and planner`.

### Task 6: Conformance checker

**Files:** Create `scripts/check-components.mjs`, `scripts/test/component-check.test.mjs`, fixtures `test/fx/components/generated-ok/`, `generated-bad-*/`.

**Interfaces:** Consumes `loadSpec`. Produces CLI `check-components.mjs --root <dir>` printing `{tool:"check-components", ok: boolean, findings:{file:string, rule:string, message:string}[]}`; rules: `role-missing`, `aria-missing`, `part-missing`, `state-unstyled`, `literal`, `key-handler-reimplemented`. Exit 1 only with `--strict` and findings.

- [ ] **Step 1: Write failing tests,** one fixture per rule, each asserting the rule id and that the message names the part, state or key (Review Focus 4 and 5), plus `generated-ok produces ok:true`, plus a positive control: the output of Task 5's scaffold for the plain fixture passes.
- [ ] **Step 2: Run** `node --test scripts/test/component-check.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** with regex scans over the generated files; `key-handler-reimplemented` fires on key handlers for keys listed in `spec.a11y.keys` when `source` is not hand-owned (read from a `.fgu-component.json` marker the scaffold writes next to the files: add that file to Task 5's output and test).
- [ ] **Step 4: Run** the test file and `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(components): check-components conformance checker`.

### Task 7: Adapters

**Files:** Create `components/adapters/{plain,react,vue,svelte,angular}.md`, `components/adapters/light/{solid,lit}.md`. Test: extend `component-reference.test.mjs`.

**Interfaces:** Each adapter has the same five headings: `Props and events`, `State attributes`, `Slots and children`, `Behaviour source`, `Motion`. `Behaviour source` states the order from Global Constraints and names the primitives for that framework (React: Radix, Base UI, React Aria; Vue: Reka; Svelte: Bits; Angular: CDK; also Headless UI where relevant). `Motion` points to `recipes/INDEX.md` (Angular uses `animate.enter`/`animate.leave`, never `@angular/animations`).

- [ ] **Step 1: Write failing test:** `every adapter has the five headings and is <= 80 lines`.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Write the seven files.**
- [ ] **Step 4: Run** the test and `node scripts/lint-skill.mjs --strict`. Expected: PASS.
- [ ] **Step 5: Commit** `docs(components): framework adapters`.

### Task 8: Remaining components

**Files:** Create `components/{field,toggle,dialog,menu,tabs,toast,disclosure}/` each with the Task 4 file set; update `components/INDEX.md`.

**Interfaces:** Same as Task 4. `menu` and `tabs` and `dialog` reference their pattern or recipe in `spec.json` `pattern` and do not copy its keyboard table into `spec.md`: `menu` → `recipes/patterns/menu-select-combobox.md`, `dialog` → `recipes/motion/dialog-enter-exit.md`, `toast` → `recipes/motion/toast-stack.md`, `tabs` → `recipes/motion/tabs-indicator.md`.

- [ ] **Step 1: Test already exists** (Task 4 loops every directory). Run it first to confirm it still passes with 1 component. Add `components/INDEX.md lists every component directory` as a failing test.
- [ ] **Step 2: Run** `node --test scripts/test/component-reference.test.mjs`. Expected: FAIL (index lacks entries once directories exist; add directories one at a time).
- [ ] **Step 3: Write each component** (spec.md, spec.json, reference with `attach`), one commit per component; parallelizable across subagents.
- [ ] **Step 4: Run** `npm test` and `node scripts/lint-skill.mjs --strict`. Expected: PASS.
- [ ] **Step 5: Commit** per component, `feat(components): <name> spec and reference`.

### Task 9: Gallery generator, build integration, lint

**Files:** Modify `scripts/scaffold-component.mjs` (add `--gallery`), `modules/build.md` (step 2), `SKILL.md` (one line), `scripts/lint-skill.mjs` (validate `components/`). Test: `component-gallery.test.mjs`.

**Interfaces:** `scaffold-component.mjs --gallery --root <dir>` writes `.design/components.html` containing every reference rendered with the profile CSS; the existing probe can open it as a static file.

- [ ] **Step 1: Write failing tests:** `--gallery writes .design/components.html containing each component's data-part markup`; `lint-skill flags a component directory without spec.json`; `build.md step 2 mentions scaffold-component and the three-source order` (string assertion).
- [ ] **Step 2: Run** `node --test scripts/test/component-gallery.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** the gallery flag, rewrite build.md step 2 to: reuse existing, else primitives/kit via adapter, else scaffold from spec; net line count must not grow; add one SKILL.md line pointing at `components/INDEX.md`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(components): gallery, build-step integration, lint`.

### Task 10: Showcase apps in four frameworks

**Files:** Create `docs/gallery/r4/apps/<app>/{skill,control}/` for four apps, one framework each: React (Vite), Svelte (SvelteKit or Vite), Angular, Vue (Vite). Four different product domains and directions; reuse briefs from `docs/gallery/r3/` where they fit and add one new domain. Reuse `docs/gallery/capture.mjs` and `interactions.mjs`.

**Interfaces:** `skill/` is built by following `SKILL.md` including the new component flow; `control/` is the same brief with no skill, one prompt. Each app has a `README` stating framework, brief, direction chosen, which components came from a primitive library vs the shared module.

- [ ] **Step 1: Write the four briefs** (domain, audience, key screen, framework) into `docs/gallery/r4/briefs.md`; each framework appears once; at least one app uses a project primitive library and one has none.
- [ ] **Step 2: Build all eight apps** with Sonnet subagents (one per app and variant); each skill build must run `scaffold-component.mjs`, `check-components.mjs` and `check-static.mjs` and record the results in its README.
- [ ] **Step 3: Verify each app builds and runs:** `npm run build` (or the framework equivalent) exits 0 in every directory.
- [ ] **Step 4: Commit** `docs(gallery): round-4 builds`.

### Task 11: Capture and judge

**Files:** Create `docs/gallery/r4/captures/`, `docs/gallery/r4/.mapping.json`, a blind compare page (Artifact), `docs/gallery/r4/RESULTS.md`.

**Interfaces:** Captures follow the r2/r3 naming (`<app>-<skill|control>-<desktop-dark|desktop-light|phone>`).

- [ ] **Step 1: Capture** all eight apps at three viewports with `capture.mjs`; confirm every image exists and is non-trivial in size.
- [ ] **Step 2: Publish a blind A/B page** (variant order randomised per app, mapping in `.mapping.json`) as a private Artifact and send the link to the user.
- [ ] **Step 3: Record the user's picks** in `RESULTS.md` with the mapping, the check-components and check-static results per skill build, and a plain statement of whether the skill won, tied or lost per app.
- [ ] **Step 4: Commit** `docs(gallery): round-4 captures and results`.

---

## Self-review

- **Spec coverage:** layout (Tasks 4, 7, 8), spec format (2), style derivation (3), adapters (7), build integration (9), verification (6, 9), first batch (4, 8), tokens (1), existing-pattern links (8), no-direction behaviour (Global Constraints + Task 5 missing-profile test), user's showcase request (10, 11).
- **Types:** `Spec`, `Profile`, `planScaffold` and `attach` signatures are defined once (Tasks 2-5) and reused by name in Tasks 6-9.
- **Proportion:** the plan lists signatures, tests and values and leaves bodies to the implementer.
- **Open for the executor:** exact token values, CSS content, template text, and the Angular/Svelte project setup for Task 10.
