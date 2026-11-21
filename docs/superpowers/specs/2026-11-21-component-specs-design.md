# Component specs: one neutral spec, translated per project and framework

Date: 2026-11-21. Status: draft for approval. Branch: `library-integrations`.

## Intent and why

finally-good-ui designs whole apps, but its build step (`modules/build.md` step 2) only says "reuse existing components first, create only what is missing". When nothing exists, the model improvises each component from memory, in whatever framework the project uses. The result is inconsistent behaviour, patchy accessibility and the same generic look in every project.

The user wants the skill to carry a real component arsenal: components built from scratch, available in React, Vue, Svelte, Angular and plain HTML, shaped by each project's own design direction. The user chose approach C (below) because it works for any project and any framework without maintaining four libraries.

**Idea:** write each component once as a framework-neutral **spec** (behaviour, states, accessibility contract, tokens, motion). A plain HTML+CSS+JS **reference implementation** proves the spec in a real browser. Thin **framework adapters** translate it into idiomatic code for the project's stack, generated into the project on demand. The look comes from the project's chosen direction and tokens, never from a shared default style.

## Goals

1. A spec registry for a first batch of components, each short enough to load on demand.
2. One shared, token-only stylesheet per component that every framework version uses unchanged. Frameworks differ in markup and behaviour wiring only.
3. Adapters for plain, React, Vue, Svelte and Angular (Full tier). Solid and Lit/Web Components are Light tier: adapter notes only.
4. The build step generates components from specs when the project has none, uses the project's installed kit or headless primitives when it does, and never overwrites hand-written components.
5. Each generated component is verified: static conformance checks plus a browser probe on a generated component gallery page.
6. The look is derived from the chosen direction (radius, material, density, motif, motion), so two projects get visibly different components from the same spec.

## Non-goals

- No published npm component library (approach B).
- No attempt to out-feature shadcn, Base UI or Material. When a project already uses a kit, the skill themes and extends it.
- No native targets (React Native, Flutter, SwiftUI, Compose) in this project. Specs must not block them later (no DOM-only vocabulary in the behaviour contract).
- No new design tokens format. Specs consume the existing tokens (`tokens/`, `emit-tokens.mjs`).

## Anti-goals (would make this a failure even if it works)

- Output that looks the same across projects. A spec that hard-codes radius, shadow or colour treatment fails.
- Four diverging implementations of one behaviour. The browser-proven reference is the source of truth; adapters may not change behaviour.
- Context bloat. A full run must not read all specs; only the ones the blueprint needs. The skill's instruction load must not grow for projects that never use this.
- Silent overwrites of the user's own components.

## Constraints

- The skill is Markdown plus Node scripts (ES modules, Node >= 20, no runtime dependencies in the npm CLI half). `npm test` must stay green.
- Tokens only in components: no hex, px or ms literals (the existing hook flags them). Motion only on `transform` and `opacity`; reduced motion respected.
- Behaviour contracts follow WAI-ARIA APG; existing patterns in `recipes/patterns/` already encode some (menu/select/combobox keyboard table, command palette, data table).
- Framework detection exists (`scripts/detect-stack.mjs`: framework, components kit, primitives list). Adapters key off it.
- Local commits only; nothing pushed or published without the user.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| A | Generate per project, writing each component fresh per framework | Maximum fit, but behaviour and accessibility drift between frameworks and runs |
| B | Publish prebuilt libraries per framework (`fgu-react`, `fgu-vue`...) | Consistent, but heavy maintenance and a direct fight with shadcn and MUI |
| **C (chosen by the user)** | One neutral spec + browser-proven reference + thin adapters, generated into the project like A | Consistent behaviour, one stylesheet, any framework; costs an up-front spec format and adapter rules |

C keeps A's delivery (code lands in the user's project, themed by their direction) and B's consistency (one source of truth), without B's maintenance.

## Design

### Layout (new, inside `skills/finally-good-ui/`)

```
components/
  INDEX.md                  one line per component: name, shapes, when NOT to use
  <name>/
    spec.md                 the card: intent, anatomy, props, states, a11y contract, keyboard table, tokens, motion, content rules
    spec.json               machine-readable subset (see below)
    reference/              index.html, <name>.css, <name>.js : the proven plain implementation
  adapters/
    plain.md  react.md  vue.md  svelte.md  angular.md    framework mapping rules
    light/solid.md  light/lit.md
scripts/
  scaffold-component.mjs    spec + stack profile + tokens -> files in the project
  check-components.mjs      conformance check of generated components against spec.json
```

### Spec format

`spec.md` stays human-readable, like the existing patterns (about 60-80 lines). `spec.json` carries what scripts need:

- `name`, `shapes` (variants of the component), `props` (name, type, default), `events`, `slots`
- `states` (default, hover, active, focus-visible, disabled, loading, error... as applicable) and the state attribute each one is exposed as (`data-state`, `aria-*`)
- `a11y`: required role, required aria attributes, keyboard map, focus rules
- `tokens`: the token names the stylesheet may use
- `parts`: the elements and their `data-part` names, which the shared stylesheet targets

The stylesheet targets `data-part` and state attributes, never framework class names, so one CSS file serves every framework.

### Derivation from the direction

The chosen direction spec (`.design/directions/`) and `brand.md` supply a small **component style profile**: radius scale, material (flat, layered, outlined), density, motif placement, motion personality. `scaffold-component.mjs` writes these as token overrides plus a `components.css` layer. The spec never states them. Distinctiveness is checked by comparing two projects' generated CSS in tests.

### Adapters

Each adapter file answers the same five questions for its framework: how props and events map, how state attributes are bound, how slots/children work, where behaviour lives (hook, composable, rune, directive), and how motion recipes attach (`animate.enter` for Angular, `<Transition>` for Vue, `transition:` for Svelte, CSS `@starting-style` baseline for the rest). Adapters forbid changing the keyboard map, roles or state attribute names.

When the stack profile lists `primitives` (Radix, Base UI, React Aria, Reka, Bits, Ark, Kobalte) or a kit, the adapter wires the spec's parts and states onto that primitive instead of hand-rolling behaviour, and only adds styling and motion.

### Build-step integration

`build.md` step 2 changes to: list needed components from the blueprint, then for each: (1) project already has it: reuse; (2) kit/primitives installed: wire per adapter; (3) otherwise scaffold from the spec. Scaffolding asks before writing into a path that has a file, and records each generated component in `decisions.md`.

### Verification

- `check-components.mjs`: required role and aria present, every state in the spec has styling, no literals, parts present.
- A generated `.design/components.html` gallery (plain reference) is walked by the existing browser probe (focus, keyboard map, contrast, reduced motion).
- Tests in `scripts/test/`: spec.json schema, scaffold output per framework against fixtures, conformance pass/fail fixtures, and a distinctness test across two direction profiles.

## First batch (my call)

Button, Field (text input with label, hint, error), Toggle (checkbox and switch), Dialog, Menu (popover menu), Tabs, Toast, Disclosure (accordion). Existing patterns (data table, command palette, combobox) stay as patterns and can be promoted to specs later. Rationale: these cover most apps, exercise every adapter concern (focus management, overlays, live regions, exit animation) and each has a clear APG contract.

## Calls I made (flagged for review)

- Browser-proven plain reference as the source of truth, not a TypeScript IR or a code generator for every framework. The first generator is a structure scaffolder; behaviour comes from the reference and adapter rules, with the model translating. A full transpiler is out of scope.
- Angular, Vue and Svelte in the Full tier because the library roadmap already covers their kits; Solid and Lit are Light.
- 8 components for v1; more are added one spec at a time.
- Specs live inside the skill (not a separate package) so they ship with the plugin.

## Settled after the builder check (my calls unless marked)

- **Scaffold output is deterministic where it can be.** `scaffold-component.mjs` emits: the shared CSS, token overrides, per-framework markup skeleton from `parts`, props/types, and the call into the behaviour module. Snapshot tests cover exactly that. Behaviour is not re-written per framework (see next point).
- **Behaviour follows the project's own stack (user decision, 2026-11-21).** The user's point: the skill must fit the framework and libraries the project already uses, not impose its own. Order of behaviour source, per component: (1) the project's installed primitives or kit (Radix, Base UI, React Aria, Reka, Bits, Ark, Kobalte, Angular CDK, Headless UI, or a styled kit): wire the spec's parts, states and tokens onto it, framework-native; (2) nothing installed: the shared plain behaviour module from the reference `<name>.js` (focus trap, keys, typeahead, live regions), attached from a ref/effect/directive; (3) never a fresh hand-written rewrite per framework. The spec's keyboard map and roles are the acceptance test for all three sources, so a project's own library is checked against the same contract.
- **Two-sided verification.** The skill checks automatically: static conformance, plus the existing browser walk against the project's running dev server (keyboard map, focus, contrast, reduced motion), which tests whatever source (1) or (2) produced. The user reviews the generated component gallery and the brief's component list before build. A failing contract is reported with the library named, not silently patched.
- **Direction input.** The direction spec already carries a parseable 3x6 axis table (density, contrast, type voice, layout, material, motion). The model derives `.design/component-style.json` (small fixed schema: radius scale, material, density, motif, motion personality) from the chosen spec and `brand.md`; the script reads only that file. Test fixtures are two such JSON files. The directions step does not change.
- **Tokens.** Current groups: color, font, text, tracking, space, radius, shadow, icon, duration, easing. Missing for components: border width, focus ring, control size, z-index. Adding these as new additive groups is allowed; the format itself does not change. Reference CSS may not fall back to literals.
- **Overlap with existing patterns.** `recipes/patterns/*` stay canonical for keyboard tables and markup. A component spec links to its pattern and adds parts, states, props and tokens; it does not copy the table.
- **No direction yet.** Scaffolding needs `component-style.json`. With `directions` off or in autonomous mode, the profile comes from the brief and blueprint by picking the axis positions the brief most directly implies (the "quiet" rule in `directions.md`), then breaking the ink-on-paper house style on one named axis. There is no neutral fallback profile.

## Left to the builder

File-level script design, the exact `spec.json` schema, naming of the style-profile fields, reference implementation details, test fixture design, and the order in which components are built.
