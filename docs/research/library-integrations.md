# Library integrations research (2026-11-14)

Question: which third-party libraries, platform features and distribution channels should finally-good-ui support next, to broaden its reach?

Method: five parallel research passes against primary sources (official docs, specs, source repos, npm registry API, GitHub API, web-features data). Adoption numbers: npm weekly downloads for 2026-11-07..13, GitHub stars fetched 2026-11-14. Every claim in Parts 1–5 carries its source URL; claims that could not be confirmed are marked UNVERIFIED. Raw data stayed in the session scratchpad and is not committed.

## Synthesis

### Verified defects in our own repo (found during research)
- `recipes/motion/popover-from-trigger.md:93` claims the Popover API moves focus into a `role="menu"` popover. It does not: no focus on open, no arrow keys, no typeahead (Part 5).
- `README.md:59` links `../README.md` and `../INSTALL.md`; neither exists.
- `tokens/default.tokens.json` is a "DTCG subset", not DTCG 2025.10: colours and shadows are CSS strings (spec: objects), `tracking.caps` uses `em` (spec: px/rem), dark values live in `$extensions.fgu.dark` (spec route: Resolver module) (Part 3).
- Tailwind v4 has no `--duration-*` theme namespace, so `--format tailwind4` produces no `duration-*` utilities (Part 1).
- Svelte `transition:` easing must be a function; our Svelte notes cannot pass token easings (Part 2).

### Landscape shifts we were not tracking
- shadcn/ui defaults to Base UI since July 2026; Radix and React Aria are options. `components.json` `style` prefix (`radix-`/`base-`/`aria-`) tells which animation attributes apply (Part 1).
- Vercel UI SDK (`@ui-sdk/core` + `@ui-sdk/{react,vue,svelte,solid,web}`, 0.1.0-beta, Apache-2.0): headless behaviors, no motion tokens; animates on `[data-starting-style]`/`[data-ending-style]` (Part 5).
- `@angular/animations` deprecated (removal v23) in favour of `animate.enter/leave` (Part 2).
- Dead/stalled: Joy UI, Pigment CSS, Polaris React, Park UI preset, Shoelace, Vaul, vaul-vue, Moti, Specify (shutting down) (Parts 1–4).
- Gemini CLI replaced by Antigravity CLI (reads AGENTS.md); Windsurf → Devin Desktop (Part 3).
- Scroll-driven animations Baseline since 2026-10-27; View Transitions types/classes Baseline; React 19.3 ships `<ViewTransition>` stable (Part 2).

### Shared prerequisites (unlock many integrations)
1. DTCG 2025.10 token model + resolver-based dark mode, backward-compatible reader.
2. OKLCH ramp generator (10–16 step scales) — needed by Mantine, Prime, Nuxt UI, Skeleton, Radix Themes, Fluent, Chakra palettes, Flutter/Compose.
3. motion-tokens helper: `cssEase()`, `easeFn()`, `bezierString()`, spring tokens (→ CSS `linear()`), reduced-motion variants.

### Roadmap (one integration per loop tick, each with tests + commit)
Tiers: **Full** = detect + emit format + extract where sensible + recipe/build notes + tests. **Light** = detect + build notes.

| # | Tick | Tier | Source |
|---|---|---|---|
| 0.1 | Fix popover recipe keyboard/focus model + `role=` widget-without-key-handler detector | Full | P5 |
| 0.2 | DTCG 2025.10 tokens + resolver dark mode + reader compat | Full | P3 |
| 0.3 | OKLCH ramp generator | Full | P1 |
| 0.4 | motion-tokens helper extensions + Tailwind v4 duration fix + Svelte easing | Full | P1, P2 |
| 1.1 | shadcn `--format shadcn` + `shadcn-registry`, base detection | Full | P1 |
| 1.2 | Headless kits detect (Base UI, React Aria, Reka, Bits, Ark, Kobalte, UI SDK) + `headless-primitive-motion` recipe | Full | P1, P2, P5 |
| 1.3 | MUI v9 refresh (drop Joy/Pigment) | Full | P1 |
| 1.4 | daisyUI v5 | Full | P1 |
| 1.5 | Chakra v3 + Panda v2 | Full | P1 |
| 1.6 | Mantine v9 | Full | P1 |
| 1.7 | Ant Design v6 | Full | P1 |
| 1.8 | Prime (Vue/NG/React) preset | Full | P1 |
| 1.9 | Angular Material M3 + Angular `animate.enter` recipe notes | Full | P1, P2 |
| 1.10 | Long tail detect: Vuetify, Nuxt UI, HeroUI, Skeleton, Flowbite, Preline, Fluent, Carbon, UnoCSS, StyleX, vanilla-extract | Light | P1 |
| 2.1 | Detect motion/interaction libs (anime.js, Rive, Lenis, Number Flow, Sonner, cmdk, Floating UI, dnd-kit, Embla) | Light | P2 |
| 2.2 | Recipes: react-view-transition, scroll-linked | Full | P2 |
| 2.3 | Recipes: menu/select/combobox keyboard, command-palette, tooltip timing | Full | P2, P5 |
| 2.4 | Recipes: drag-reorder, bottom-sheet, tabs indicator | Full | P2, P5 |
| 2.5 | Recipes: number-change, chat-log, inline-edit, focus-after-delete | Full | P2, P5 |
| 2.6 | Existing recipe upgrades (invoker commands, `::details-content`, `sibling-index()`) + `--format adapters` (Sonner/cmdk overrides) | Full | P2 |
| 3.1 | Chart tokens `--chart-1..N` + chart lib detect + canvas themes (ECharts/Chart.js) | Full | P3 |
| 3.2 | Font wiring (next/font, @nuxt/fonts, Fontsource) | Full | P3 |
| 3.3 | Icon detect + icon size/stroke tokens | Full | P3 |
| 3.4 | Forms/tables detect + AG Grid theme | Light | P3 |
| 3.5 | Web Interface Guidelines gaps: ~30 canon cards incl. new i18n domain + 6 more detectors | Full | P5 |
| 4.1 | `import-tokens.mjs` (Figma DTCG export, Tokens Studio, Terrazzo) | Full | P3 |
| 4.2 | Export to Style Dictionary / Terrazzo | Full | P3 |
| 4.3 | Rule-export refresh (Kiro, Cline, Devin, `--targets`; drop Gemini) | Full | P3 |
| 5.1 | Expo/RN: detect, NativeWind/Uniwind/gluestack/RNR via tailwind4/css, Reanimated 4 tokens, Expo-web verify | Full | P4 |
| 5.2 | Tamagui / Unistyles formats | Light | P4 |
| 5.3 | Flutter `ThemeData` + `ThemeExtension` emit | Full | P4 |
| 5.4 | SwiftUI `.colorset` emit | Full | P4 |
| 5.5 | Compose `Color.kt`/`Theme.kt` emit | Full | P4 |
| 5.6 | Tauri/Electron detect as web | Light | P4 |
| 6.1 | Standalone `npx finally-good-ui check` slop CLI with CI annotations | Full | P4 |
| 6.2 | Multi-agent install (`npx skills add`) | Full | P4, P5 |
| 6.3 | First-run onboarding (three paths) + README rewrite | Full | P5 |
| 6.4 | README visual showcase (before/after gallery from real runs) | Full | P4 |

### Loop order and progress
Chosen 2026-11-14: reach work first (0.1 first because it is a shipped accessibility bug). Gallery built by the loop; the npm CLI is built and dry-run packed, the user publishes. Commits stay local.

- [x] 0.1
- [x] 6.3
- [x] 6.1
- [x] 6.2
- [ ] 6.4
- [x] 0.5a
- [x] 0.5b
- [x] 0.5c
- [x] 0.2a
- [x] 0.2b
- [x] 0.3
- [x] 0.4
- [x] 1.1
- [x] 1.2
- [x] 1.3
- [x] 1.4
- [x] 1.5
- [x] 1.6
- [x] 1.7
- [x] 1.8
- [x] 1.9
- [x] 1.10
- [x] 2.1
- [x] 2.2
- [x] 2.3
- [x] 2.4
- [x] 2.5
- [x] 2.6
- [ ] 3.1
- [ ] 3.2
- [ ] 3.3
- [ ] 3.4
- [ ] 3.5
- [ ] 4.1
- [ ] 4.2
- [ ] 4.3
- [ ] 5.1
- [ ] 5.2
- [ ] 5.3
- [ ] 5.4
- [ ] 5.5
- [ ] 5.6

0.2 was split (user chose "read both, write standard"): **0.2a** read DTCG 2025.10 colour/shadow objects, resolvers and {aliases} everywhere, plus `emit-tokens --format dtcg`; **0.2b** write the standard shape by default (default tokens, extract --write, system module).

Ticks added 2026-11-14 from the four gallery runs (feedback below):
- **0.5a** check-static false positives: radiogroup around native radios, hash routes in single-file apps, long-duration on token definitions and the one signature moment, `:focus-within` focus rings, 1px screen-reader clip.
- **0.5b** tokens: `color-scheme` in emitted dark blocks, overlay/scrim and other roles recipes need, document custom roles and a brand-accent slot.
- **0.5c** unattended runs and verify robustness: an autonomous mode (interview, references fallback, approvals, deps), directions without subagents, free port + page-title check, `await` the probe, cached-Playwright fallback, shared-browser warning.

### Gallery-run feedback (verbatim notes, 2026-11-14)
#### meals (skill run) feedback
1. dead-control flags hash routes (#week) in single-file apps; accept #/ routes or explain.
2. long-duration flags token definitions in :root (default tokens long 400 / hero 500) — flag usage, not definition.
3. verify assumes screenshots writable into project; MCP writes only to its workspace. http.server served stale index.html (cache-bust note).
4. no headless/self-confirm mode for no-user runs (interview confirm, blueprint approval, "ask first" deps).
5. editorial cookbook brief lands on cream-serif-terracotta fingerprint; no guidance on staying editorial without it.
6. layout axis single value; phone vs desktop composition slot missing in spec template.
7. tokens: no overlay/backdrop color token (dialog recipe uses literal); emit css lacks color-scheme property.
8. config.theme can't express "media + toggle".
9. probe small-target checks <input> not its wrapping label.
10. unclear whether non-motion timers (undo window, fetch delay) count as duration literals; toast recipe uses 5000.
11. SKILL.md "outside Claude Code" says build all 3 directions sequentially vs task (specs only) — wording conflict.
12. check-flows token coverage never computed when playwright missing.
#### booking (skill run) feedback
1. interview recommendations skew to frequent/serious apps; "you decide" sometimes has no recommended option (frequency, calm vs energetic) for consumer apps.
2. references question has no unattended answer; say what to do without a user.
3. directions step assumes subagents + compare page + user wait; "specs only, pick one" unsupported; record format expects user rejection reasons.
4. cream-serif-terracotta fingerprint pulls against brand derivation (brand name implies warm palette).
5. verify assumes check-flows+playwright in project; MCP fallback shares ONE browser across parallel agents (got another agent's app); writes .playwright-mcp into repo. verify.md §7a should warn; cached playwright-core w/ pinned headless shell worked.
6. role-no-keyboard FALSE POSITIVE: role=radiogroup wrapping native radios (native radios handle arrows).
7. long-duration can't tell signature moment from routine motion; always one medium needing justification.
8. build.md says Layer 1 runs automatically after each screen; not outside plugin.
9. emit-tokens dark block: needs color-scheme; can't carry extra tokens like scrim.
#### finance (skill run) feedback
1. verify needs node playwright; accept python playwright / cached browser path.
2. verify docs suggest port 4173; say pick a free/random port (parallel agents collided).
3. blueprint nav table frequency rows miss "weekly".
4. build step 1 (shell + nav) vs craft.nothing-dead on single-screen builds; need rule.
5. references question: no "you decide" default.
6. tokens contract: no brand-accent slot (accent = hover tint, shadcn sense); docs don't say custom roles allowed; needed overlay + skeleton-shine tokens (recipes use literals).
7. motion-literal rule: no exception for business timers (undo window, simulated fetch).
8. direction re-roll rules can loop (8 rerolls when one value passes).
9. probe CLS catches JS-rendered pages after blocking CDN script; build.md note.
10. interview needs autonomous mode.
#### tracker (skill run) feedback
1. references question needs no-user fallback.
2. directions: brief fixes composition but module requires 3 different layouts -> deadlock; say what to do.
3. directions w/o subagents: no prototype, G9 fidelity check has nothing to compare.
4. verify main blocker: check-flows needs project playwright; MCP shared browser + repo-only saves; port 4173 collisions; fall back to cached playwright browser; pick free port, check page title.
5. probe call is async; say "await window.__fguProbe(...)" in verify §7a.
6. outline-none-no-focus false positive: focus ring on wrapper via :focus-within.
7. tokens: no slot for motif colour / backdrop; say custom roles fine.
8. verify still says spawn ui-reviewer w/o non-interactive note; check-static flags 1px sr-only clip as off-scale.

Avoid (Part 4): "N stacks supported" tables without emit/verify behind them, and theme/style catalogs (contradict the no-presets canon).

---


# Part 1

## Research 1: web component kits and styling/theming systems for finally-good-ui

Fetched 2026-11-14. Weekly downloads are from `https://api.npmjs.org/downloads/point/last-week/<pkg>` for the window **2026-11-07 → 2026-11-13**. Stars, last push, archived flag and licence are from `gh api repos/<owner>/<repo>` at **2026-11-14 15:57 UTC**. Latest versions, release dates, the first release of the current major, and npm deprecation notices are from `https://registry.npmjs.org/<pkg>`. Raw data: `data/npm.json`, `data/gh.tsv`, `data/registry.tsv` next to this file.

### What finally-good-ui supports today (read from the repo, unchanged)

- `skills/finally-good-ui/scripts/detect-stack.mjs`: `components` is a single value, checked in this order: `components.json` → shadcn, `@mui/material|@mui/joy` → mui, `@chakra-ui/react` → chakra, `@mantine/core` → mantine, any `@radix-ui/*` → radix, any `@headlessui/*` → headlessui. Styling covers Tailwind v3 and v4, CSS modules, Sass, emotion and styled-components. It doesn't detect the primitive library behind shadcn, or Panda, UnoCSS, StyleX or vanilla-extract.
- `scripts/emit-tokens.mjs`: the formats are `css`, `tailwind4`, `tailwind3`, `mui`, `json` and `js`. Only `mui` targets a kit; it emits `palette`, `colorSchemes.light/dark`, `typography`, `shape` and `transitions`.
- `tokens/default.tokens.json`: a DTCG subset with **semantic colour pairs only** (background/foreground, card, primary, muted, accent, destructive, success, warning, border, input, ring). It has no tonal scales (50–950). Dark values sit in `$extensions.fgu.dark`, and motion is in `duration` and `easing`.
- `modules/system.md` §4: shadcn gets `css` merged into its own `:root`/`.dark` names (by hand), MUI gets `mui`, and everything else gets plain `css`.
- `scripts/extract-tokens.mjs`: reads CSS custom properties (including unprefixed colour vars such as shadcn's), Tailwind v3 config by regex, `*.tokens.json`, and MUI palette mains. The `isDarkCtx` regex knows `.dark`, `data-theme=dark`, `data-mode=dark`, `.theme-dark` and `prefers-color-scheme`.

### Ranked summary

dl/wk = npm downloads for 2026-11-07..13 on the package named. ★ = GitHub stars on 2026-11-14.

| # | Library | Framework | dl/wk (pkg) | ★ | Theming entry point | finally-good-ui integration | Effort | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | **shadcn/ui** (+ shadcn-vue, shadcn-svelte, Spartan) | React (+Vue, Svelte, Angular ports) | 18.27M (`shadcn`), 0.31M (`shadcn-svelte`), 0.12M (`shadcn-vue`), 0.12M (`@spartan-ng/brain`; `@spartan-ng/cli` 0.08M) | 128,174 | Unprefixed CSS vars in `:root`/`.dark` + `@theme inline` map; `registry:theme` item `cssVars.{theme,light,dark}` | New `--format shadcn` (shadcn names + `@theme inline`) and `--format shadcn-registry` (installable with `npx shadcn add`); detect the base (`radix-`/`base-`/`aria-` style prefix) | S | **5** |
| 2 | **Base UI** | React | 30.28M (`@base-ui/react`) + 1.24M (old name) | 11,412 | None: unstyled; `className`, `data-starting-style`/`data-ending-style` | Detect it; add a motion recipe for its transition attributes using `--duration-*`/`--ease-*` | S | **5** |
| 3 | **Material UI v9** | React | 13.82M (`@mui/material`) | 99,344 | `createTheme({ cssVariables: { colorSchemeSelector }, colorSchemes, typography, shape, transitions })` | Already emitted; update for v9 (`cssVariables`, selector config), detect the version, drop Joy/Pigment | S | **4** |
| 4 | **React Aria Components** | React | 9.12M (`react-aria-components`), 16.66M (`react-aria`) | 16,036 | None: unstyled; `data-entering`/`data-exiting`, render props | Detect it; add a motion recipe; it is also shadcn's `aria` base and the base of HeroUI v3 | S | **4** |
| 5 | **Ant Design v6** | React | 4.91M (`antd`) | 100,203 | `<ConfigProvider theme={{ token, components, algorithm, cssVar }}>`, with `motionDuration*`/`motionEase*` tokens | `--format antd` (seed and map tokens incl. motion; dark = second token set + `darkAlgorithm`) | M | **4** |
| 6 | **Chakra UI v3** | React | 2.15M (`@chakra-ui/react`) | 40,726 | `createSystem(defaultConfig, defineConfig({ theme: { tokens, semanticTokens } }))`; `{ base, _dark }`; has `durations` and `easings` | `--format chakra` (tokens + semanticTokens). Shares code with Panda | M | **4** |
| 7 | **Mantine v9** | React | 3.62M (`@mantine/core`) | 31,943 | `createTheme({ colors (10-shade tuples), primaryColor, fontFamily, headings, radius, spacing, fontSizes, lineHeights, shadows })` + `cssVariablesResolver` | `--format mantine` (needs a 10-shade ramp generator) | M | **4** |
| 8 | **Angular Material (M3)** | Angular | 3.14M (`@angular/material`) | 25,046 | Sass `@include mat.theme((color, typography, density), $overrides: (...))`; `--mat-sys-*` vars; `light-dark()` | `--format angular-material` (SCSS with `$overrides` as `light-dark()` pairs) | M | **4** |
| 9 | **daisyUI v5** | Tailwind plugin (any framework) | 1.38M | 42,837 | `@plugin "daisyui/theme" { name; default; prefersdark; color-scheme; --color-base-100 … --radius-field … }` | `--format daisyui` (two theme blocks, light and dark) | S | **4** |
| 10 | **PrimeVue / PrimeNG / PrimeReact** (styled mode) | Vue, Angular, React | 1.05M + 0.88M + 0.40M; `@primeuix/themes` 1.19M | 14,451 / 12,482 / 8,312 | `definePreset(Aura, { semantic: { primary: {50…950}, colorScheme: { light, dark } } })` + `options.darkModeSelector` | `--format prime` (one emitter covers 3 frameworks; needs a 50–950 ramp) | M | **4** |
| 11 | **Vuetify 4** | Vue | 1.32M | 41,040 | `createVuetify({ theme: { defaultTheme, themes: { x: { dark, colors, variables } } } })`; `--v-theme-*` as RGB triplets | `--format vuetify` (hex colours + `variables`) | S | **3** |
| 12 | **Nuxt UI v4** | Vue/Nuxt | 1.04M (`@nuxt/ui`) | 7,075 | `--ui-*` CSS vars on `:root`/`.dark` + `app.config.ts ui.colors` + `@theme static` 50–950 scales | `--format nuxt-ui` (CSS vars; scale export if custom hue) | S–M | **3** |
| 13 | **Headless primitives**: Reka UI, Bits UI, Ark UI, Kobalte, Melt, Ariakit | Vue / Svelte / multi / Solid / Svelte / React | Reka 2.98M (+ radix-vue 2.65M), Bits 1.75M, Ark-React 1.47M, Ariakit 2.33M, Melt 0.18M, Kobalte 5,785,796 (very high for 1.9k★; likely pulled in transitively by other packages, UNVERIFIED) | 6,957 / 3,664 / 5,469 / 8,635 / 4,199 / 1,888 | None: data attributes only | Detect them; one shared table "primitive → state/animation attributes" feeding the motion recipes | S | **3** |
| 14 | **HeroUI v3** | React | 0.97M (`@heroui/styles`), 1.25M (`@heroui/react`) | 31,208 | CSS vars (`--accent`, `--surface`, `--field-*`, `--radius`) + `@theme inline`; `[data-theme]` themes | `--format heroui` (close to shadcn; reuse its mapping) | S | **3** |
| 15 | **Panda CSS v2** | Framework-agnostic (React, Vue, Solid, Svelte…) | 0.86M (`@pandacss/dev`) | 6,253 | `panda.config.ts` `defineConfig({ theme: { extend: { tokens, semanticTokens } } })` | `--format panda` (same shape as Chakra) | S (after Chakra) | **3** |
| 16 | **UnoCSS (preset-wind4)** | Agnostic | 0.79M (`unocss`) | 18,988 | `uno.config.ts` `presetWind4` theme keys (`colors`, `font`, `text`, `radius`, `ease`, `shadow`…) | `--format unocss` (theme object) + detect `uno.config.*` | S | **3** |
| 17 | **Bootstrap 5.3** (+ react-bootstrap) | Agnostic / React | 7.47M (`bootstrap`), 1.60M (`react-bootstrap`) | 175,060 | `--bs-*` CSS vars, `[data-bs-theme=dark]`, Sass `$theme-colors` | `--format bootstrap` (CSS vars, optional SCSS map) | M | **3** |
| 18 | **StyleX** | React (agnostic compiler) | 2.24M | 10,495 | `stylex.defineVars({ k: { default, '@media (prefers-color-scheme: dark)': … } })` in `*.stylex.ts` | `--format stylex` | S | **3** |
| 19 | **Element Plus** | Vue | 0.79M | 27,850 | `:root { --el-color-primary }`, `html.dark` + `element-plus/theme-chalk/dark/css-vars.css`; SCSS `@forward … with ($colors…)` | `--format element-plus` | S | **3** |
| 20 | **Flowbite v4** | Tailwind plugin (+ React/Vue/Svelte ports) | 0.78M (`flowbite`) | 9,385 | Tailwind v4 `@theme` vars (`--color-brand*`, `--color-fg-brand*`, `--font-*`) + theme imports | `--format flowbite` | S | **2** |
| 21 | **Registries**: Magic UI, Aceternity, coss ui (ex-Origin UI) | React (shadcn ecosystem) | n/a (copy-in) | 23,269 / UNVERIFIED / 10,856 | Inherit shadcn vars; Magic UI/Aceternity use Motion | Read `components.json` `registries`; route their Motion props through `motion-tokens.js` | S | **3** |
| 22 | **vanilla-extract** | Agnostic | 3.28M (`@vanilla-extract/css`, mostly transitive?) | 10,448 | `createGlobalTheme`/`createThemeContract`/`createTheme` in `*.css.ts` | `--format vanilla-extract` | S | **2** |
| 23 | **Fluent UI v9** | React | 0.61M | 20,405 | `createLightTheme/createDarkTheme(BrandVariants 10…160)` + overrides; `durationNormal`, `curveEasyEase` | `--format fluent` (needs a 16-stop ramp) | M | **2** |
| 24 | **Radix Themes** | React | 1.54M | 8,851 | `<Theme accentColor grayColor radius scaling>`; override `--accent-1…12`, `--radius-*`, `--default-font-family` | `--format radix-themes` (12-step scale override) | M | **2** |
| 25 | **Naive UI** | Vue | 0.19M | 18,608 | `<n-config-provider :theme-overrides>` `common: { primaryColor, borderRadius, fontFamily, cubicBezierEaseInOut … }` | `--format naive` | S | **2** |
| 26 | **Quasar** | Vue | 0.52M | 27,204 | `--q-primary` … brand colours; `framework.config.brand`; `setCssVar` | `--format quasar` (8 brand colours) | S | **2** |
| 27 | **Skeleton v5** | Svelte, React | 0.11M | 6,090 | Theme CSS file: `--color-{primary…surface}-{50…950}`, `--radius-base`, `--spacing`; `[data-theme]` | `--format skeleton` (needs a ramp) | M | **2** |
| 28 | **Carbon** | React (+WC) | 0.17M (`@carbon/react`) | 9,624 | Sass `@use '@carbon/styles/scss/theme' with (...)`; `--cds-*` | `--format carbon` (SCSS token overrides) | M | **1** |
| 29 | **Preline 5** | Tailwind plugin | 0.08M | 6,525 | `theme.css`: `--primary`, `--background`, `--layer`, `--navbar*` … on `:root`/`.dark` | Detect only; maybe later | S | **1** |
| 30 | **Primer** | React | 0.08M (`@primer/react`) | 3,935 | `@primer/primitives` CSS (`[data-color-mode][data-light-theme]`) | None (GitHub-internal fit) | — | **1** |
| — | **Dropped**: Joy UI (on hold), Pigment CSS (alpha, on hold), Polaris React (deprecated, repo archived), NextUI (renamed HeroUI), Park UI (preset stale since 2024-11), `@melt-ui/svelte` (superseded by `melt`) | | | | | | | **0** |

#### Three cross-cutting findings (these matter more than any one emitter)

1. **A tonal-ramp generator unlocks about seven emitters.** Mantine (10 shades), Prime (50–950), Nuxt UI custom colours (50–950), Skeleton (50–950), Radix Themes (12 steps), Fluent (16 brand stops) and Chakra/Panda palettes all want a scale, not a semantic pair. Our tokens hold pairs only. One `lib/ramp.mjs` (OKLCH lightness ramp from the `primary` seed, with contrast checks via `lib/contrast.mjs`) is the shared prerequisite. Build it once; every M-effort emitter above then becomes S.
2. **Motion attributes split three ways by primitive library, and shadcn now ships all three.** Radix uses `data-state="open|closed"` (keyframes). Base UI and Bits UI use `data-starting-style`/`data-ending-style` (transitions). React Aria uses `data-entering`/`data-exiting`. Ark/Zag and Reka use `data-state`. Since **July 2026 shadcn defaults to Base UI** and offers `-b radix` and `--base aria` ([Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default), [React Aria](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)). Today's `components: "shadcn"` therefore no longer tells the build step which attributes to animate. The `components.json` `style` enum encodes it: `radix-*`, `base-*` or `aria-*` ([schema](https://ui.shadcn.com/schema.json)).
3. **Dark-mode selectors vary by kit, and extract/check-flows only know a few.** The variants are `[data-bs-theme=dark]` (Bootstrap), `html.dark` (Element Plus), `[data-color-mode]` (Primer), `.cds--g100`-style zones (Carbon; class name UNVERIFIED), Prime's `darkModeSelector` option, Angular Material's `light-dark()` + `color-scheme`, Vuetify's runtime theme name, and the `data-mantine-color-scheme` attribute (UNVERIFIED in docs fetched). `extract-tokens.mjs isDarkCtx` should learn at least `data-bs-theme` and `light-dark()`.

---

### 1. shadcn/ui (React) + its ports: shadcn-vue, shadcn-svelte, Spartan (Angular)

- **What:** an open-code component distribution and CLI, not an npm component library. MIT. Active: CLI `shadcn@4.23.0`, released 2026-10-27; v4 major first released 2026-03-06 ([npm](https://registry.npmjs.org/shadcn), [CLI v4 changelog entry](https://ui.shadcn.com/docs/changelog)).
- **Adoption:** `shadcn` 18,266,041/wk. `radix-ui` 28.4M/wk and `@radix-ui/react-dialog` 94.4M/wk show Radix-based usage. 128,174★ ([shadcn-ui/ui](https://github.com/shadcn-ui/ui)). Ports: shadcn-svelte 313,613/wk, 9,259★ ([repo](https://github.com/huntabyte/shadcn-svelte)); shadcn-vue 122,414/wk, 10,812★ ([repo](https://github.com/unovue/shadcn-vue)); `@spartan-ng/brain` 124,692/wk, 2,993★ ([repo](https://github.com/spartan-ng/spartan)).
- **Big 2026 change (verified):** "New projects now use Base UI by default. Radix is still fully supported." Choose Radix with `pnpm dlx shadcn init -b radix` ([source](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)). "React Aria is now a first-class component base in shadcn/ui", via `shadcn init --base aria` ([source](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)). New styles are Vega, Nova, Maia, Lyra, Mira, Luma, Rhea and Sera. `components.json` `style` enum: `default`, `new-york`, `radix-{vega…rhea}`, `base-{…}`, `aria-{…}` ([schema.json](https://ui.shadcn.com/schema.json)). Presets are short codes or `https://ui.shadcn.com/create?preset=<code>` and encode style, base colour, theme, radius, fonts and icon library ([preset commands](https://ui.shadcn.com/docs/changelog/2026-04-preset-commands)).
- **Detection:** `components.json` (already detected). Add: `style` prefix → base library (`radix`/`base`/`aria`); `tailwind.css` → the CSS file to write; `tailwind.config` empty means Tailwind v4 ([components.json docs](https://ui.shadcn.com/docs/components-json)); `registries` → third-party registries in use (Magic UI etc.). Vue: `shadcn-vue` + `reka-ui`. Svelte: `bits-ui` + `components.json`. Angular: `@spartan-ng/brain`/`@spartan-ng/cli`.
- **Theming entry:** unprefixed vars in `:root` and `.dark`: `--radius, --background, --foreground, --card(-foreground), --popover(-foreground), --primary(-foreground), --secondary(-foreground), --muted(-foreground), --accent(-foreground), --destructive, --border, --input, --ring, --chart-1..5, --sidebar*`. Values in oklch, e.g. `--primary: oklch(0.205 0 0);`. Mapped with `@theme inline { --color-background: var(--background); … --radius-sm: calc(var(--radius) * 0.6); }`. Dark uses `@custom-variant dark (&:is(.dark *));` ([theming](https://ui.shadcn.com/docs/theming)). shadcn-vue and shadcn-svelte use the same token names, `:root`/`.dark` and `@theme inline` ([shadcn-vue theming](https://www.shadcn-vue.com/docs/theming), [shadcn-svelte theming source](https://github.com/huntabyte/shadcn-svelte/blob/main/docs/content/theming.md)). Spartan does the same in `styles.css` ([spartan theming](https://www.spartan.ng/documentation/theming)).
- **Registry theme item (key opportunity):** `registry-item.json` has `type: "registry:theme"` and `cssVars: { theme: {...} /* @theme, TW4 only */, light: {...}, dark: {...} }`, "merged with the project's css variables" ([registry-item schema](https://ui.shadcn.com/schema/registry-item.json)). So finally-good-ui can emit a theme file the user installs with the shadcn CLI (`npx shadcn add ./fgu-theme.json`; local-file support per [changelog](https://ui.shadcn.com/docs/changelog), "Local File Support", July 2025). The CLI does the merge; we don't hand-merge CSS.
- **Motion:** the theming page defines no motion tokens. The scaffold imports `shadcn/tailwind.css`, but the page doesn't say what that file contains (UNVERIFIED).
- **Integration:**
  - `detect-stack`: add `shadcnBase: "radix"|"base"|"aria"` from the `style` prefix (`new-york`/`default` count as radix) and `shadcnCss` from `tailwind.css`.
  - `emit-tokens --format shadcn`: our names minus the `--color-` prefix in `:root`/`.dark`, plus the `@theme inline` map; `--radius` from `radius.md`; motion keeps our `--duration-*`/`--ease-*`. Add `--format shadcn-registry` for the `registry:theme` JSON.
  - The `success`/`warning`/`info` pairs aren't in shadcn's base set; add them with `@theme inline` entries.
  - The build module needs a table of state attributes per base (finding 2).
  - `extract-tokens` already reads unprefixed colour vars. Add a `--radius` → `radius.md` alias.
  - Effort **S**. Priority **5**: biggest audience, our token names already match shadcn's, and one emitter serves React, Vue, Svelte and Angular.

### 2. Base UI (React)

- **What:** unstyled, accessible React primitives from the MUI/Radix/Floating UI people. MIT. v1 major first released 2025-12-11; latest `@base-ui/react@1.9.0` on 2026-10-09. The old package `@base-ui-components/react` is deprecated: "Package was renamed to @base-ui/react" ([npm](https://registry.npmjs.org/@base-ui/react), [old npm](https://registry.npmjs.org/@base-ui-components/react)).
- **Adoption:** 30,276,609/wk (`@base-ui/react`) plus 1,244,206/wk on the old name. 11,412★ ([mui/base-ui](https://github.com/mui/base-ui)). The download count far exceeds the star count, almost certainly because shadcn defaults to it.
- **Detection:** `@base-ui/react`, `@base-ui-components/react`.
- **Theming entry:** none. "Base UI components are unstyled, don't bundle CSS." Style it with `className` (a string, or a function of state), state data attributes, and exposed CSS vars such as `--available-height`, `--anchor-width` and `--transform-origin` ([styling](https://base-ui.com/react/handbook/styling)).
- **Motion:** "`[data-starting-style]` corresponds to the initial style to transition from. `[data-ending-style]` corresponds to the final style to transition to." "Transitions are recommended over CSS animations, because a transition can be smoothly cancelled midway." Motion integrates through the `render` prop; `keepMounted` / `AnimatePresence` handle exits ([animation](https://base-ui.com/react/handbook/animation)).
- **Integration:**
  - `detect-stack`: `primitives: ["base-ui"]`. Make it a list, separate from `components`.
  - No emitter needed.
  - Build/recipes: a popover/dialog/menu recipe variant `[data-starting-style],[data-ending-style]{opacity:0; transform: scale(.96)}` with `transition: opacity var(--duration-standard) var(--ease-enter), transform …`, transform-origin from `--transform-origin`. This also fits our "CSS transitions + `@starting-style`" default.
  - Effort **S**. Priority **5**.

### 3. Material UI v9 (+ Joy UI, Pigment CSS)

- **What:** Google Material Design for React. MIT. "Introducing Material UI and MUI X v9", 2026-04-08 ([blog](https://mui.com/blog/)). Latest `@mui/material@9.5.0` on 2026-10-09; first 9.x release on 2026-04-07 ([npm](https://registry.npmjs.org/@mui/material)).
- **Adoption:** 13,815,731/wk (`@mui/material`); 99,344★ ([repo](https://github.com/mui/material-ui)).
- **Theming entry:** `createTheme({ cssVariables: { colorSchemeSelector: 'class' | 'data' | '.theme-%s', cssVarPrefix }, colorSchemes: { light: true, dark: true } })`. `class` emits `.light{}`/`.dark{}`, `data` emits `[data-light]`/`[data-dark]`, and the default prefix is `--mui` ([CSS theme variables config](https://mui.com/material-ui/customization/css-theme-variables/configuration/)). Motion: `theme.transitions.duration.{shortest, shorter, short, standard, complex, enteringScreen, leavingScreen}` and `theme.transitions.easing.{easeInOut, easeOut, easeIn, sharp}` ([transitions doc source](https://github.com/mui/material-ui/blob/master/docs/data/material/customization/transitions/transitions.md)). Our `mui` emitter already maps these.
- **v9 breaking changes relevant to us:** system props were removed from Box, Grid, Stack and Typography; use `sx`. Deprecated classes used as `styleOverrides` keys move to `variants` ([upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)). Whether Emotion is still the default engine is UNVERIFIED (truncated page).
- **Joy UI:** "Joy UI is in beta and development is currently on hold." "When starting a new project from scratch, we recommend Material UI over Joy UI" ([Joy docs, now on v7.mui.com](https://v7.mui.com/joy-ui/getting-started/)). `@mui/joy@5.0.0-beta.52`, last published 2025-03-18 ([npm](https://registry.npmjs.org/@mui/joy)). Downloads: 147,489/wk. **Drop it**: keep the detection alias but don't build for Joy.
- **Pigment CSS:** "Alpha phase, currently, on hold" ([repo](https://github.com/mui/pigment-css)). `@pigment-css/react@0.0.31`, 2026-05-22, 77,228/wk ([npm](https://registry.npmjs.org/@pigment-css/react)). 1,120★. **Drop it.**
- **Integration:**
  - `detect-stack`: record `componentsVersion` (major from `@mui/material`), and stop folding `@mui/joy` into `mui`.
  - `emit-tokens --format mui`: add `cssVariables: { colorSchemeSelector: <from .design/config.json theme> }` so the class or attribute matches the project's dark-mode mechanism. Add `info` mapping (already present) and `shape`.
  - Recipe note: use `sx`, not system props, in v9.
  - `extract-tokens` already reads palette mains. Extend it to `colorSchemes.dark.palette`.
  - Effort **S**. Priority **4**: it's already supported; this keeps it correct.

### 4. React Aria Components / React Spectrum (Adobe)

- **What:** hooks (`react-aria`) and unstyled components (`react-aria-components`); Spectrum 2 (`@react-spectrum/s2`) is Adobe's styled design system. Apache-2.0. `react-aria-components@1.22.1` released 2026-10-09; `@react-spectrum/s2@1.8.2` released 2026-10-15, with its 1.x major first released 2025-12-16 ([npm RAC](https://registry.npmjs.org/react-aria-components), [npm S2](https://registry.npmjs.org/@react-spectrum/s2)).
- **Adoption:** RAC 9,122,712/wk; react-aria 16,657,066/wk; `@adobe/react-spectrum` 2,158,222/wk; S2 34,423/wk. 16,036★ ([repo](https://github.com/adobe/react-spectrum)).
- **Theming entry:** none for RAC. Default classes are "react-aria-ComponentName". States are exposed as data attributes (`data-hovered`, `data-pressed`). `className`/`style` accept functions of state. There is a Tailwind plugin, `tailwindcss-react-aria-components`. Animation: "data-entering represents the starting state of the entry animation", and `data-exiting` the end of the exit ([styling](https://react-aria.adobe.com/styling)).
- **Detection:** `react-aria-components`, `react-aria`, `tailwindcss-react-aria-components`; `@react-spectrum/s2` / `@adobe/react-spectrum` count as a styled kit (not worth an emitter).
- **Integration:**
  - `detect-stack` primitives `react-aria`.
  - Recipe rows for `[data-entering]`/`[data-exiting]`.
  - It's also shadcn `aria-*` styles and HeroUI v3's base.
  - Effort **S**. Priority **4**.

### 5. Ant Design v6

- **What:** enterprise React kit (Ant Group). MIT. `antd@6.7.0` released 2026-11-04; 6.x first released 2025-11-21 ([npm](https://registry.npmjs.org/antd)).
- **Adoption:** 4,914,288/wk; 100,203★ ([repo](https://github.com/ant-design/ant-design)).
- **Detection:** `antd`, `@ant-design/cssinjs`, `@ant-design/nextjs-registry` (the last one is UNVERIFIED as a signal).
- **Theming entry:** `<ConfigProvider theme={{ token, components, algorithm }}>`. Seed tokens include `colorPrimary`, `borderRadius`, `fontFamily`, `fontSize`, `motion` (false disables), `motionBase`, `motionUnit` and `motionEase{InOut, Out, InBack, OutBack, InOutCirc, OutCirc, InQuint, OutQuint}`. `motionDurationFast/Mid/Slow` are **map** tokens. Dark mode is `algorithm: theme.darkAlgorithm` (combinable, e.g. `[darkAlgorithm, compactAlgorithm]`). `cssVar: { prefix: 'ant', key }`. `zeroRuntime` (6.0+) requires importing `antd/dist/antd.css` ([customize theme](https://ant.design/docs/react/customize-theme)).
- **Fit gap:** antd derives the dark theme algorithmically from seeds, but our tokens carry *designed* dark values. Emit two token sets and switch `{ algorithm: darkAlgorithm, token: darkTokens }` on the theme state.
- **Integration:**
  - `--format antd`: a JSON `{ light: { token }, dark: { token, algorithm: "dark" } }`. Map primary/success/warning/destructive/info → `colorPrimary/colorSuccess/colorWarning/colorError/colorInfo`, background/foreground → `colorBgBase/colorTextBase`, border → `colorBorder` (UNVERIFIED name), radius.md → `borderRadius`, font.sans → `fontFamily`, text.base → `fontSize`, durations → `motionDurationFast/Mid/Slow` as `"0.1s"`, easing → `motionEaseInOut/Out`.
  - `extract-tokens`: regex-read `token: {…}` in a ConfigProvider.
  - Effort **M**. Priority **4**: huge adoption (especially in Asia/enterprise) and the tokens cover motion.

### 6. Chakra UI v3

- **What:** a React kit built on Ark UI/Zag with a Panda-style token engine. MIT. 3.x first released 2024-10-22; `@chakra-ui/react@3.38.0` on 2026-11-03 ([npm](https://registry.npmjs.org/@chakra-ui/react)).
- **Adoption:** 2,152,813/wk; 40,726★ ([repo](https://github.com/chakra-ui/chakra-ui)).
- **Theming entry (verbatim):**
  ```ts
  import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
  const config = defineConfig({ theme: { tokens: { colors: { primary: { value: "#0FEE0F" } }, fonts: { body: { value: "system-ui, sans-serif" } } } } })
  export const system = createSystem(defaultConfig, config)
  ```
  Token types include colors, gradients, sizes, spacing, fonts, fontSizes, fontWeights, letterSpacings, lineHeights, radii, borders, borderWidths, shadows, **easings** (string or `[0.4, 0, 0.2, 1]` array), opacity, zIndex, **durations** and animations ([tokens doc source](https://github.com/chakra-ui/chakra-ui/blob/main/apps/www/content/docs/theming/tokens.mdx)). Semantic tokens: `value: { base: "{colors.red}", _dark: "{colors.darkred}" }` ([semantic tokens](https://chakra-ui.com/docs/theming/semantic-tokens)). Typegen: `npx @chakra-ui/cli typegen ./theme.ts` ([overview](https://chakra-ui.com/docs/theming/customization/overview)).
- **Fit:** excellent. It has first-class duration and easing tokens, our cubic-bezier arrays pass straight through, and semantic tokens carry designed dark values.
- **Integration:**
  - `--format chakra`: a TS module with `tokens` (fonts, fontSizes, letterSpacings, radii, spacing, shadows, durations, easings) and `semanticTokens.colors.{bg, fg, …}` with `{ base, _dark }`. Map our names onto Chakra's semantic names (`bg`, `fg`, `border`, `colorPalette`; exact default semantic names UNVERIFIED).
  - `extract-tokens`: parse `defineConfig` by regex.
  - Effort **M**. Priority **4**.

### 7. Mantine v9

- **What:** a full React kit. MIT. "March 31st, 2026" (9.0.0); requires "React 19.2+". `defaultRadius` changed from sm to md; new `fontWeights` with medium=600 ([9.0 changelog](https://mantine.dev/changelog/9-0-0/)). Latest `@mantine/core@9.8.0`, 2026-11-09 ([npm](https://registry.npmjs.org/@mantine/core)).
- **Adoption:** 3,620,237/wk (`@mantine/core`; `@mantine/hooks` 4,013,341); 31,943★ ([repo](https://github.com/mantinedev/mantine)).
- **Theming entry:** `createTheme({ primaryColor, defaultRadius, colors /* key → array of at least 10 strings */, primaryShade /* 0–9 or {light, dark} */, fontFamily, headings, radius, spacing, fontSizes, lineHeights, fontWeights, shadows, breakpoints, other, components })` passed to `<MantineProvider theme>`. The only motion setting is `respectReducedMotion` ([theme object](https://mantine.dev/theming/theme-object/)). Generated vars include `--mantine-color-body`, `--mantine-color-text`, `--mantine-primary-color-filled`, `--mantine-radius-md` and `--mantine-spacing-md`. `cssVariablesResolver` returns `{ variables, light, dark }` ([CSS variables](https://mantine.dev/styles/css-variables/)).
- **Fit gap:** `primaryColor` must be a key into `colors` ("hex/rgb/hsl values are not supported"), and those colours need 10 shades. That needs the ramp generator. Designed dark surfaces go through `cssVariablesResolver.dark` (`--mantine-color-body` etc.), and motion stays as our CSS vars.
- **Integration:**
  - `--format mantine`: a TS module exporting `theme` (createTheme input, with a generated `brand` 10-tuple) and `resolver` (cssVariablesResolver with light/dark for body, text, border and our motion vars).
  - `extract-tokens`: read `createTheme({...})` by regex.
  - Effort **M**. Priority **4**.

### 8. Angular Material (Material 3 tokens) + Spartan

- **What:** Google's Angular components. MIT. `@angular/material@22.2.7` released 2026-11-11; the v22 major first released 2026-06-03 ([npm](https://registry.npmjs.org/@angular/material)). 3,138,227/wk (`@angular/cdk` 5,488,727/wk). 25,046★ ([angular/components](https://github.com/angular/components)).
- **Theming entry (verbatim):**
  ```scss
  @use '@angular/material' as mat;
  html {
    color-scheme: light dark;
    @include mat.theme((color: mat.$violet-palette, typography: Roboto, density: 0), $overrides: (primary-container: orange));
  }
  ```
  System vars include `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-primary-container` and `--mat-sys-body-large`. Dark mode comes from `light-dark()` + `color-scheme`. `mat.theme-overrides((…))` redefines system tokens. Custom palettes come from `ng generate @angular/material:theme-color` ([theming guide source](https://github.com/angular/components/blob/main/guides/theming.md)). No motion system tokens appear in the theming guide.
- **Integration:**
  - `--format angular-material`: SCSS `mat.theme((color: mat.$azure-palette, typography: (plain-family: …), density: 0), $overrides: (primary: light-dark(<l>, <d>), on-primary: …, surface: …, on-surface: …, outline: <input>, outline-variant: <border>, error: …))`. Override token names are M3 system tokens (only `primary-container` verified; the others are UNVERIFIED but follow the `--mat-sys-*` names).
  - Motion stays as our CSS vars.
  - Detect `@angular/material`. Spartan is handled as shadcn.
  - Effort **M**. Priority **4**: it's our only real Angular path.

### 9. daisyUI v5

- **What:** a Tailwind CSS plugin of component classes. MIT. 5.x first released 2025-02-28; `daisyui@5.8.0` on 2026-11-12 ([npm](https://registry.npmjs.org/daisyui)). 1,383,266/wk; 42,837★ ([repo](https://github.com/saadeghi/daisyui)).
- **Detection:** the `daisyui` dep, or `@plugin "daisyui"` in CSS.
- **Theming entry:** `@plugin "daisyui/theme" { name: "x"; default: true; prefersdark: false; color-scheme: light; … }`. Colours: `--color-base-100/200/300`, `--color-base-content`, `--color-{primary,secondary,accent,neutral,info,success,warning,error}` and `-content`. Shape: `--radius-selector`, `--radius-field`, `--radius-box`, `--size-selector`, `--size-field`, `--border`, `--depth`, `--noise`. Switching: `data-theme='THEME_NAME'`. **No motion tokens** ([themes](https://daisyui.com/docs/themes/)).
- **Integration:**
  - `--format daisyui`: two theme blocks, `fgu-light` (default) and `fgu-dark` (prefersdark). Mapping: background → base-100, card → base-200 (or base-100), muted → base-300, foreground → base-content, primary/-foreground → primary/-content, destructive → error, radius.md → radius-field, radius.lg → radius-box.
  - Motion stays in `@theme` as our vars. Set `.design/config.json` `theme` to `{attribute: "data-theme"}`.
  - Effort **S**. Priority **4**.

### 10. PrimeVue / PrimeNG / PrimeReact (styled + unstyled)

- **What:** one vendor's kits for Vue, Angular and React, sharing the `@primeuix` theming engine. MIT (PrimeNG's licence shows NOASSERTION on GitHub). All three moved to a new major on 2026-07-15: `primevue@5.0.5`, `primeng@22.1.5`, `primereact@11.2.3`, `@primeuix/themes@3.1.1` ([npm primevue](https://registry.npmjs.org/primevue), [primeng](https://registry.npmjs.org/primeng), [primereact](https://registry.npmjs.org/primereact)). `@primevue/themes` still has 235,775/wk (older setups).
- **Adoption:** primevue 1,054,535/wk, primeng 879,571/wk, primereact 398,545/wk, `@primeuix/themes` 1,186,160/wk. Stars: 14,451 / 12,482 / 8,312.
- **Theming entry:** three tiers: "primitive, semantic and component". `definePreset` customises a built-in preset ("Aura, Material, Lara and Nora"), imported from `@primeuix/themes/aura`. Options: `prefix` (default `p`), `darkModeSelector` (default `system` → `prefers-color-scheme`), `cssLayer`. The "colorScheme token group is a special variable to define tokens based on the color scheme." "In unstyled mode the built-in CSS classes are not included" ([styled mode](https://primevue.dev/theming/styled/)). The exact semantic shape (`semantic.primary.{50…950}`, `semantic.colorScheme.light/dark.surface…`) is UNVERIFIED from the page text; check against `@primeuix/themes` source before implementing.
- **Integration:**
  - `--format prime`: an ES module with `definePreset(Aura, { semantic: { primary: <ramp>, colorScheme: { light: {...}, dark: {...} } } })` plus `options: { darkModeSelector: '.dark' }` matching config. One emitter serves three frameworks.
  - Detect `primevue|primeng|primereact` + `@primeuix/themes`.
  - Unstyled mode + Tailwind = treat as headless.
  - Effort **M** (ramp + shape check). Priority **4**.

### 11. Vuetify 4

- **What:** a Material Design Vue kit. MIT (GitHub shows NOASSERTION). 4.x first released 2026-02-23; `vuetify@4.3.3` on 2026-11-09 ([npm](https://registry.npmjs.org/vuetify)). 1,322,295/wk; 41,040★ ([repo](https://github.com/vuetifyjs/vuetify)).
- **Theming entry (verbatim excerpt):** `createVuetify({ theme: { defaultTheme: 'myCustomLightTheme', themes: { myCustomLightTheme: { dark: false, colors: { background, surface, 'surface-bright', 'surface-light', 'surface-variant', 'on-surface-variant', primary, 'primary-darken-1', secondary, error, info, success, warning }, variables: { 'border-color', 'border-opacity', 'high-emphasis-opacity', … } } } } })`. `defaultTheme: 'system'` follows `prefers-color-scheme`. "Custom properties for colors are a list of `red, green, blue`", used as `rgb(var(--v-theme-something))` ([theme doc source](https://github.com/vuetifyjs/vuetify/blob/master/packages/docs/src/pages/en/features/theme.md)). No motion tokens are in the theme.
- **Integration:**
  - `--format vuetify`: a JS object with `fguLight`/`fguDark` (hex via `toHex`; `on-*` from our `-foreground` pairs; `border-color` from border), `defaultTheme: 'system'`.
  - Recipe note: custom CSS must use `rgb(var(--v-theme-x))`.
  - Effort **S**. Priority **3**.

### 12. Nuxt UI v4

- **What:** Nuxt's official kit (Reka UI + Tailwind v4), also usable in plain Vue through the `@nuxt/ui/vite` plugin. MIT. 4.x first released 2025-09-23; `@nuxt/ui@4.12.0` on 2026-10-15 ([npm](https://registry.npmjs.org/@nuxt/ui)). Downloads 1,040,015/wk; 7,075★ ([repo](https://github.com/nuxt/ui)).
- **Theming entry:** CSS vars `--ui-primary, --ui-secondary, --ui-success, --ui-info, --ui-warning, --ui-error`; text `--ui-text-{dimmed, muted, toned, highlighted, inverted}`, `--ui-text`; bg `--ui-bg{-muted, -elevated, -accented, -inverted}`; border `--ui-border{-muted, -accented, -inverted}`; `--ui-radius`, `--ui-container`, `--ui-header-height`, `--ui-chart-1..6`. Light values on `:root`, dark on `.dark` ([CSS variables](https://ui.nuxt.com/docs/getting-started/theme/css-variables)). Colour aliases are set in `app.config.ts` `ui.colors` (`primary: 'blue'`, `neutral: 'zinc'`). Custom colours need all shades 50–950 in `@theme static`. `--ease-out` drives enter/exit animations ([design system](https://ui.nuxt.com/docs/getting-started/theme/design-system)).
- **Integration:**
  - `--format nuxt-ui`: `:root`/`.dark` `--ui-*` assignments from our pairs (bg ← background, bg-elevated ← card, bg-muted ← muted, text ← foreground, text-muted ← muted-foreground, border ← border, primary ← primary, error ← destructive, radius ← radius.md), plus `@theme static { --ease-out: … }` from our `enter` easing.
  - Optional: ramp → `--color-brand-50…950` + `app.config.ts` `ui.colors.primary: 'brand'`.
  - Detect `@nuxt/ui`.
  - Effort **S–M**. Priority **3**.

### 13. Headless primitives: Reka UI, Bits UI, Ark UI, Kobalte, Melt, Ariakit (and Headless UI)

All unstyled. finally-good-ui integrates them through detection plus motion-attribute recipes, not emitters.

| Lib | Framework | Version / date | dl/wk | ★ | State/animation hooks (cited) |
|---|---|---|---|---|---|
| Reka UI (ex radix-vue) | Vue | 2.11.0, 2026-10-05 ([npm](https://registry.npmjs.org/reka-ui)) | 2,977,130 (+ radix-vue 2,653,500) | 6,957 | `data-state="open"`; `class` passes through; teleported parts need `:deep()` ([styling](https://reka-ui.com/docs/guides/styling)) |
| Bits UI | Svelte 5 | 2.21.0, 2026-11-11 ([npm](https://registry.npmjs.org/bits-ui)) | 1,746,044 | 3,664 | `data-[component]-[part]`, `data-state`, `--bits-select-anchor-width`, `--bits-accordion-content-height`, **`data-starting-style`/`data-ending-style`** ([styling](https://bits-ui.com/docs/styling)) |
| Ark UI | React, Solid, Vue, Svelte | `@ark-ui/react@5.40.0`, 2026-10-29 ([npm](https://registry.npmjs.org/@ark-ui/react)) | React 1,469,572; Svelte 29,413; Vue/Solid Vue 41,535; Solid 94,864 | 5,469 | `data-scope`/`data-part`/`data-state`, `--layer-index`, `--z-index` ([styling](https://ark-ui.com/docs/guides/styling)) |
| Kobalte | Solid | 0.13.14, 2026-09-07 ([npm](https://registry.npmjs.org/@kobalte/core)) | 5,785,796 (very high for 1.9k★; likely pulled in transitively by other packages, UNVERIFIED) | 1,888 | `data-expanded`, `data-disabled`; Tailwind v4 needs no plugin ([styling](https://kobalte.dev/docs/core/overview/styling)) |
| Melt (next-gen, `melt`) | Svelte 5 | 0.44.0, 2026-01-04 ([npm](https://registry.npmjs.org/melt)) | 15,616 (old `@melt-ui/svelte` 175,553, last published 2025-03-28) | 332 (next-gen) / 4,199 | status label not stated on [site](https://next.melt-ui.com/) (UNVERIFIED) |
| Ariakit | React | 0.4.43, 2026-11-08 ([npm](https://registry.npmjs.org/@ariakit/react)) | 2,327,719 | 8,635 | not fetched (UNVERIFIED) |
| Headless UI (already detected) | React/Vue | [repo](https://github.com/tailwindlabs/headlessui) last push 2026-04-13 | React 9,645,647; Vue 3,174,332 | 28,828 | slowing activity, so keep detection and don't invest |

- **Integration:** `detect-stack` should get `primitives: []`, one entry per lib found, so "shadcn + Base UI" or "Nuxt UI + Reka" are both visible. `recipes/INDEX.md` should get one table: primitive → enter/exit attributes → CSS pattern using `--duration-*`/`--ease-*`. Effort **S** in total. Priority **3**.

### 14. HeroUI v3 (ex-NextUI)

- **What:** a React kit, now "A ground-up rewrite for React and React Native", with "Tailwind CSS v4, React Aria, compound component architecture, CSS-first theming with OKLCH tokens". v3.0.0 shipped in March 2026 ([releases](https://heroui.com/docs/react/releases)). Apache-2.0 ([repo](https://github.com/heroui-inc/heroui), 31,208★). `@nextui-org/react` is deprecated: "Please use @heroui/react instead" ([npm](https://registry.npmjs.org/@nextui-org/react)). `@heroui/react@3.2.7`, 2026-10-28.
- **Adoption:** `@heroui/styles` 971,164/wk; `@heroui/react` 1,245,055/wk; `@heroui/theme` (v2) 466,242/wk; `@nextui-org/react` 124,544/wk still.
- **Theming entry:** `@import "@heroui/styles";`. Vars: `--background`, `--foreground`, `--surface(-foreground)`, `--overlay(-foreground)`, `--accent(-foreground)`, `--success`, `--warning`, `--danger`, `--default`, `--muted`, `--border`, `--separator`, `--focus`, `--link`, `--field-*`, `--radius`, `--spacing`, `--border-width`. These are mapped through `@theme inline`. Dark: `<html class="dark" data-theme="dark">`. Custom themes use `[data-theme="ocean"]` / `[data-theme="ocean-dark"]` blocks in `@layer base`. Motion: `--ease-smooth`, `--ease-out-fluid`, `--ease-{in,out,in-out}-{quad…expo,circ}`, `--animate-*` and `--skeleton-animation` ([theming](https://heroui.com/docs/react/getting-started/theming)).
- **Integration:**
  - `--format heroui`: shadcn-like mapping (accent ← primary, surface ← card, overlay ← popover/card, danger ← destructive, focus ← ring, field-border ← input), with our easing set onto `--ease-out-fluid`/`--ease-smooth`.
  - Detect `@heroui/react|@heroui/styles` (v3) vs `@heroui/theme` (v2, Tailwind plugin, UNVERIFIED shape).
  - Effort **S**. Priority **3**.

### 15. Panda CSS v2 (+ Park UI)

- **What:** a build-time CSS-in-JS with tokens/recipes, from the Chakra team. MIT. **v2** first released 2026-09-29; `@pandacss/dev@2.5.0`, 2026-11-02 ([npm](https://registry.npmjs.org/@pandacss/dev)). 863,740/wk; 6,253★ ([repo](https://github.com/chakra-ui/panda)).
- **Detection:** `@pandacss/dev`, `panda.config.{ts,mjs,js}`, `styled-system/` output dir.
- **Theming entry:** `defineConfig({ theme: { extend: { tokens: { colors, fonts… }, semanticTokens: { colors: { danger: { value: { base: '{colors.red}', _dark: '{colors.darkred}' } } } } } } })`. "Every token becomes a CSS variable, named from its path": `--colors-red`, `--colors-danger` ([tokens](https://panda-css.com/docs/theming/tokens)). The full category list (durations/easings) is on a separate page, not fetched (UNVERIFIED; Chakra's equivalent has both).
- **Park UI:** "Beautifully designed components built with Ark UI and Panda CSS", "Park UI × Chakra — It's official!" ([park-ui.com](https://park-ui.com/)). `@park-ui/panda-preset@0.43.1`, last published **2024-11-22** ([npm](https://registry.npmjs.org/@park-ui/panda-preset)), still 34,650/wk; repo last push 2026-04-10 ([repo](https://github.com/chakra-ui/park-ui), 2,384★). **Drop** as a separate target.
- **Integration:** `--format panda`, which shares the token-tree builder with `chakra`. Effort **S** after Chakra. Priority **3**.

### 16. UnoCSS (preset-wind4)

- **What:** an atomic CSS engine. MIT. `unocss@66.13.0`, 2026-11-13 ([npm](https://registry.npmjs.org/unocss)). 785,104/wk; `@unocss/preset-wind4` 690,954/wk; 18,988★ ([repo](https://github.com/unocss/unocss)).
- **Detection:** `unocss`, `uno.config.{ts,js}`, `@unocss/*`.
- **Theming entry:** `defineConfig({ presets: [presetWind4({ preflights: { theme: { mode: 'on-demand' } } })], theme: {...} })`. Wind4 renames: `fontFamily→font`, `borderRadius→radius`, `easing→ease`, `breakpoints→breakpoint`, `boxShadow→shadow`; sizes unify to `spacing`; font sizes go under `text`. Theme vars are emitted as CSS vars, e.g. `--spacing`, `--font-sans`, `--colors-black`. "The generated key names may not be exactly the same as Tailwind4" ([wind4](https://unocss.dev/presets/wind4), [theme](https://unocss.dev/config/theme)). Dark mode config isn't documented on those pages (UNVERIFIED).
- **Integration:** `--format unocss`: a `theme` object referencing our CSS vars (`colors: { primary: 'var(--color-primary)' }`, `radius`, `ease`, `font`, `text`). Use it with `--format css`, the same pattern as `tailwind3`. Effort **S**. Priority **3**.

### 17. Bootstrap 5.3 (+ react-bootstrap)

- **What:** the classic CSS framework. MIT. `bootstrap@5.3.9`, 2026-11-11 ([npm](https://registry.npmjs.org/bootstrap)); react-bootstrap 2.10.10, last published 2025-05-11 ([npm](https://registry.npmjs.org/react-bootstrap)).
- **Adoption:** 7,466,059/wk; react-bootstrap 1,597,912/wk; 175,060★ ([repo](https://github.com/twbs/bootstrap)), the most-starred project in this list.
- **Theming entry:** `<html data-bs-theme="dark">`. Vars include `--bs-body-color(-rgb)`, `--bs-body-bg(-rgb)`, `--bs-emphasis-color`, `--bs-secondary-color`, `--bs-secondary-bg`, `--bs-tertiary-bg`, `--bs-border-color`, `--bs-heading-color` and `--bs-link-color`. Custom modes are `[data-bs-theme="blue"] { --bs-body-color: …; --bs-body-bg: … }`. Sass `$color-mode-type: data | media-query`. New theme colours also need `$theme-colors-text`, `-bg-subtle`, `-border-subtle` (and `-dark`) maps ([color modes](https://getbootstrap.com/docs/5.3/customize/color-modes/)). `--bs-primary` was not on that page (UNVERIFIED as a runtime override; it's generated from Sass `$theme-colors`).
- **Integration:**
  - `--format bootstrap`: CSS `:root{--bs-body-bg…}` + `[data-bs-theme=dark]{…}` (runtime), plus an optional `_fgu-variables.scss` (`$primary`, `$border-radius`, `$font-family-sans-serif`, `$transition-base`) for Sass builds.
  - `extract-tokens`: add `data-bs-theme=dark` to `isDarkCtx` and strip the `--bs-` prefix.
  - Effort **M**. Priority **3**: enormous install base, but it's mostly legacy or marketing sites rather than new apps.

### 18. StyleX

- **What:** Meta's compile-time atomic CSS-in-JS. MIT. `@stylexjs/stylex@0.19.2`, 2026-11-12 ([npm](https://registry.npmjs.org/@stylexjs/stylex)). 2,240,470/wk; 10,495★ ([meta/stylex](https://github.com/facebook/stylex)).
- **Theming entry (verbatim):** `const DARK = '@media (prefers-color-scheme: dark)'; export const colors = stylex.defineVars({ primaryText: { default: 'black', [DARK]: 'white' }, … })`. Must live in `*.stylex.{js,mjs,cjs,ts,tsx,jsx}` ([defining variables](https://stylexjs.com/docs/learn/theming/defining-variables/)). Themes come from `stylex.createTheme` (separate page, UNVERIFIED shape).
- **Integration:** `--format stylex` → `tokens.stylex.ts` with `colors`, `space`, `radius`, `motion` (durations as strings, easings as `cubic-bezier()`) via `defineVars`; dark values under the media key. A class-based dark mode needs `createTheme` (UNVERIFIED). Detect `@stylexjs/stylex`. Effort **S**. Priority **3**.

### 19. Element Plus

- **What:** a Vue 3 enterprise kit. MIT. `element-plus@2.14.8`, 2026-11-06 ([npm](https://registry.npmjs.org/element-plus)). 790,629/wk; 27,850★ ([repo](https://github.com/element-plus/element-plus)).
- **Theming entry:** CSS `:root { --el-color-primary: green; }`, or SCSS `@forward 'element-plus/theme-chalk/src/common/var.scss' with ($colors: ('primary': ('base': green)))` ([theming](https://element-plus.org/en-US/guide/theming)). Dark: `import 'element-plus/theme-chalk/dark/css-vars.css'` and override under `html.dark { --el-bg-color: … }` ([dark-mode doc source](https://github.com/element-plus/element-plus/blob/dev/docs/en-US/guide/dark-mode.md)).
- **Integration:** `--format element-plus`: `:root{--el-color-primary, --el-color-success, --el-color-warning, --el-color-danger, --el-color-info, --el-bg-color, --el-text-color-primary, --el-border-color, --el-border-radius-base, --el-font-family}` + `html.dark{…}`. Only `--el-color-primary` and `--el-bg-color` were verified; the others are UNVERIFIED. Element derives `-light-3…9` shades with SCSS, so the CSS-only override leaves hover shades stale and needs the SCSS path or explicit shade vars. Effort **S**. Priority **3**.

### 20. Flowbite v4 (+ flowbite-react/vue/svelte)

- **What:** Tailwind component classes + JS, with framework ports. MIT. `flowbite@4.0.2`, 2026-05-13; 4.x first released 2025-11-12 ([npm](https://registry.npmjs.org/flowbite)). 781,861/wk; flowbite-react 180,124 (0.12.17, 2026-02-09); flowbite-svelte 102,527; flowbite-vue 18,414. 9,385★ ([repo](https://github.com/themesberg/flowbite)).
- **Theming entry:** import one theme (`flowbite/src/themes/{default,minimal,enterprise,playful,mono}`), then set Tailwind v4 `@theme` vars: `--color-brand`, `--color-brand-{softer,soft,medium,strong}`, `--color-fg-brand(-subtle|-strong)`, `--font-sans`, `--font-body`, `--font-mono`, `--spacing-*` ([theming](https://flowbite.com/docs/customize/theming/)). The full variable list and the dark mechanism are on other pages (UNVERIFIED).
- **Integration:** `--format flowbite` (brand vars from primary). Effort **S**. Priority **2**.

### 21. Registries: Magic UI, Aceternity UI, coss ui (formerly Origin UI)

- **Magic UI:** "We have the exact same installation process as shadcn/ui"; `pnpm dlx shadcn@latest add @magicui/globe` ([install](https://magicui.design/docs/installation)). 23,269★ ([repo](https://github.com/magicuidesign/magicui)). Uses Motion (UNVERIFIED on that page).
- **Aceternity UI:** installed "with the shadcn CLI or let your AI agent do it"; templates are "Next.js 15, Tailwind CSS v4 and Motion for react powered" ([install](https://ui.aceternity.com/docs/install-tailwindcss)). No public repo found (stars UNVERIFIED).
- **coss ui:** "powered by Base UI and styled with Tailwind CSS" ([coss.com/ui](https://coss.com/ui)). The GitHub repo `origin-space/originui` now redirects to `cosscom/ui`, 10,856★ (gh API, 2026-11-14), so it's the Origin UI successor.
- **Integration:** read `components.json` `registries` (and `@magicui/…` imports) in `detect-stack`. The build module should note that these components animate with Motion and hard-coded numbers, so the craft pass must re-point `transition={{ duration, ease }}` to `sec()`/`ease()` from `motion-tokens.js`. `check-static` already flags ms literals. Effort **S**. Priority **3**: cheap, and these registries are what "AI-made" UIs are built from.

### 22. vanilla-extract

- **What:** zero-runtime TypeScript CSS. MIT. `@vanilla-extract/css@1.21.3`, 2026-10-08 ([npm](https://registry.npmjs.org/@vanilla-extract/css)). 3,280,684/wk (much of it likely transitive, via libraries that use it internally; UNVERIFIED); 10,448★ ([repo](https://github.com/vanilla-extract-css/vanilla-extract)).
- **Theming entry:** `export const [themeClass, vars] = createTheme({…})`, `export const vars = createThemeContract({…})`, `createTheme(vars, {…})` for other themes, in `*.css.ts` files ([theming](https://vanilla-extract.style/documentation/theming/)). A `createGlobalTheme` example isn't on that page (UNVERIFIED usage).
- **Integration:** `--format vanilla-extract` → `theme.css.ts` with a contract + light/dark `createGlobalTheme(':root' / '.dark', vars, …)`. Effort **S**. Priority **2**.

### 23. Fluent UI v9 (Microsoft)

- **What:** Microsoft's React design system. MIT (GitHub shows NOASSERTION). `@fluentui/react-components@9.75.2`, 2026-11-10 ([npm](https://registry.npmjs.org/@fluentui/react-components)). 611,979/wk; 20,405★ ([repo](https://github.com/microsoft/fluentui)).
- **Theming entry (from the package types):** `createLightTheme(brand: BrandVariants): Theme`, `createDarkTheme(brand)`, `webLightTheme`. `type Brands = 10 | 20 | … | 160` (16 stops). Token names include `borderRadius{None,Small,Medium,Large,XLarge,Circular}`, `fontFamily{Base,Monospace,Numeric}`, `duration{UltraFast,Faster,Fast,Normal,Gentle,Slow,Slower,UltraSlow}` and `curve{AccelerateMax/Mid/Min, DecelerateMax/Mid/Min, EasyEase, EasyEaseMax, Linear}` ([@fluentui/tokens d.ts](https://unpkg.com/@fluentui/tokens@latest/dist/index.d.ts)). Applied with `<FluentProvider theme>` (the docs Storybook couldn't be fetched as text, so the provider usage is UNVERIFIED from docs).
- **Integration:** `--format fluent`: generate the 16-stop brand ramp, `createLightTheme(brand)`, then spread overrides `{ ...theme, durationNormal: '250ms', curveDecelerateMid: 'cubic-bezier(…)', borderRadiusMedium, fontFamilyBase }`. This is a good motion fit. Effort **M**. Priority **2**.

### 24. Radix Themes

- **What:** a styled React kit on Radix primitives. MIT. `@radix-ui/themes@3.3.0`, released **2026-01-31**; repo last push 2026-04-11 ([npm](https://registry.npmjs.org/@radix-ui/themes), [repo](https://github.com/radix-ui/themes), 8,851★). 1,542,407/wk. Activity is slowing.
- **Theming entry:** `<Theme accentColor="mint" grayColor="gray" panelBackground="solid" scaling="100%" radius="full">` ([theme overview](https://www.radix-ui.com/themes/docs/theme/overview)). The token CSS defines `--accent-9`, `--gray-12`, `--color-background`, `--color-panel-solid`, `--default-font-family`, `--heading-font-family`, `--radius-1…6`, `--radius-factor`, `--space-1…9`, `--font-size-1…9`, `--letter-spacing-1…9` and `--shadow-1…6`, under `.light`/`.dark` classes ([tokens/base.css](https://unpkg.com/@radix-ui/themes/tokens/base.css)).
- **Integration:** `--format radix-themes`: a 12-step accent/gray override (needs the ramp in Radix's 12-step semantics), plus `--default-font-family`. Effort **M**. Priority **2**.

### 25. Naive UI

- Vue 3, MIT. `naive-ui@2.45.3`, 2026-08-27 ([npm](https://registry.npmjs.org/naive-ui)). 194,587/wk; 18,608★ ([repo](https://github.com/tusen-ai/naive-ui)).
- **Theming:** `themeOverrides` on `n-config-provider`. The docs URL returned 404, so the API name is from memory and UNVERIFIED. The common vars in source are `fontFamily`, `fontFamilyMono`, `cubicBezierEaseInOut: "cubic-bezier(.4, 0, .2, 1)"`, `cubicBezierEaseOut`, `cubicBezierEaseIn`, `borderRadius`, `fontSize*`, `lineHeight`, `primaryColor`, `bodyColor`, `textColor1`, `borderColor` ([`_common` source via unpkg](https://unpkg.com/naive-ui/es/_styles/common/_common.mjs), [light.mjs](https://unpkg.com/naive-ui/es/_styles/common/light.mjs)).
- **Integration:** `--format naive` (`{ common: {...} }` light/dark; easings fit). Effort **S**. Priority **2**.

### 26. Quasar

- Vue, MIT. `quasar@2.35.4`, 2026-11-12 ([npm](https://registry.npmjs.org/quasar)). 522,334/wk; 27,204★ ([repo](https://github.com/quasarframework/quasar)).
- **Theming:** 8 brand colours (`primary, secondary, accent, dark, positive, negative, info, warning`) → `--q-${name}`; `setCssVar('primary', '#33F')`; `framework.config.brand` in `quasar.config.js`; Sass `$primary` ([color palette](https://quasar.dev/style/color-palette)).
- **Integration:** `--format quasar` (brand object + `--q-*` CSS). It has no surface/dark tokens, so the dark canvas needs our CSS vars on `body.body--dark` (UNVERIFIED class). Effort **S**. Priority **2**.

### 27. Skeleton v5

- Svelte and React, MIT. `@skeletonlabs/skeleton@5.0.4`, 2026-11-08; v5 first released 2026-07-17 ([npm](https://registry.npmjs.org/@skeletonlabs/skeleton)). Downloads 105,655/wk; 6,090★ ([repo](https://github.com/skeletonlabs/skeleton)).
- **Theming:** theme CSS files imported after `@skeletonlabs/skeleton` and activated with `<html data-theme="cerberus">` ([themes doc source](https://github.com/skeletonlabs/skeleton/blob/main/sites/skeleton.dev/src/content/docs/design/themes.mdx)). Properties: `--color-{primary…surface}-{50…950}`, `--color-*-contrast-*`, `--color-root-bg-light/dark`, `--typo-{base,heading,anchor}–…`, `--radius-base`, `--radius-container`, `--default-border-width`, `--spacing`. Pairings use `light-dark()` ([core API](https://www.skeleton.dev/docs/svelte/get-started/core-api)).
- **Integration:** `--format skeleton` (needs the ramp). Effort **M**. Priority **2**.

### 28. Carbon (IBM)

- React + web components, Apache-2.0. `@carbon/react@1.120.0`, 2026-11-04 ([npm](https://registry.npmjs.org/@carbon/react)). 167,098/wk (`@carbon/styles` 199,244); 9,624★ ([repo](https://github.com/carbon-design-system/carbon)).
- **Theming:** four themes, white, gray 10, gray 90 and gray 100, configured "by configuring the sass module using `with`" ([themes/code](https://carbondesignsystem.com/elements/themes/code/)). The runtime vars are `--cds-background`, `--cds-text-primary`, `--cds-layer-01`, `--cds-interactive`, `--cds-focus`, `--cds-border-subtle-01`… ([@carbon/styles CSS](https://unpkg.com/@carbon/styles/css/styles.css)). Motion is Sass-only: `$ease-in: cubic-bezier(0.25, 0, 1, 1)`, `$ease-out`, `$standard-easing`, and `@forward '@carbon/motion'` ([_motion.scss](https://unpkg.com/@carbon/styles/scss/_motion.scss)).
- **Integration:** low ROI. Carbon users adopt IBM's design language by intent, which conflicts with our "design from the brief" premise. Detect only. Priority **1**.

### 29. Preline 5

- Tailwind plugin + JS. Licence NOASSERTION on GitHub. `preline@5.1.0`, 2026-11-11; v5 first released 2026-08-21 ([npm](https://registry.npmjs.org/preline)). 77,700/wk; 6,525★ ([repo](https://github.com/htmlstreamofficial/preline)).
- **Theming:** `theme.css` with `@theme`/`@theme inline` and `:root`/`.dark` blocks defining `--background(-1,-2)`, `--foreground`, `--primary…`, `--muted(-foreground)`, `--layer(-hover…)`, `--border`, `--card*`, `--navbar*`, `--dropdown*` and `--chart-*` ([theme.css](https://unpkg.com/preline/theme.css)). The docs page URL guessed 404'd.
- Detect only for now. Priority **1**.

### 30. Primer (GitHub)

- `@primer/react@38.46.0`, 2026-11-14 ([npm](https://registry.npmjs.org/@primer/react)); 77,440/wk; 3,935★. `@primer/primitives@11.10.0` CSS uses `[data-color-mode="light"][data-light-theme="light"]` selectors, `--bgColor-success-emphasis`, `--base-duration-{0…1000}` and `--base-easing-ease` ([light.css](https://unpkg.com/@primer/primitives/dist/css/functional/themes/light.css), [motion.css](https://unpkg.com/@primer/primitives/dist/css/base/motion/motion.css)). Theming docs describe `ThemeProvider` with `colorMode` `day|night|auto` ([theming](https://primer.style/product/getting-started/react/theming/)). Niche outside GitHub. Priority **1**.

### Dropped / dead (verified)

- **Polaris React:** npm says "Polaris React is deprecated and no longer maintained. For building Shopify admin experiences, use Polaris web components" ([npm](https://registry.npmjs.org/@shopify/polaris)). The repo is archived (`Shopify/polaris-react-archive`, `archived: true`). It still has 416,361/wk (legacy).
- **NextUI:** deprecated in favour of `@heroui/react` ([npm](https://registry.npmjs.org/@nextui-org/react)).
- **Joy UI**, **Pigment CSS:** on hold (see §3).
- **Park UI preset:** last published 2024-11-22 (see §15).
- **Shoelace:** repo archived (`shoelace-style/shoelace`, `archived: true`); the successor is Web Awesome, `@awesome.me/webawesome@3.14.0`, 186,941/wk, 1,399★. Web components are out of this scope.
- **Out of scope but noticed:** Tamagui `@tamagui/core@3.3.3` (v3 2026-10-10, 368,723/wk, 14,310★) is cross-platform and belongs to the native/mobile research. Taiga UI (Angular, 40,962/wk), ng-zorro-antd (Angular antd, 179,695/wk; it could reuse the antd token mapping), Arco (120,457/wk), Semi (27,734/wk) and Vant (mobile Vue, 106,218/wk) are regional or niche.

### Suggested implementation order

1. Shared groundwork:
   - `detect-stack`: `primitives[]`, `shadcnBase`, `componentsVersion`, and detection of `panda.config.*`, `uno.config.*`, `*.stylex.*` and `*.css.ts`.
   - Make `components` able to hold more than one kit, or add `kits[]`.
   - `lib/ramp.mjs`.
   - The primitive → motion-attribute recipe table.
2. `--format shadcn` and `--format shadcn-registry` (S). This also covers shadcn-vue, shadcn-svelte and Spartan.
3. Refresh `--format mui` for v9 (S).
4. `--format daisyui`, `vuetify`, `heroui` and `nuxt-ui` (S each; CSS/JS objects mapped from our pairs).
5. `--format chakra` + `panda` (shared builder), `antd`, `mantine` and `prime` (M; ramp-dependent ones after `ramp.mjs`).
6. `--format angular-material`.
7. Long tail on demand: unocss, stylex, element-plus, bootstrap, vanilla-extract, fluent, radix-themes, naive, quasar, skeleton, flowbite.

---

# Part 2

## Research 2: motion and interaction libraries, plus native platform features, for finally-good-ui

Fetched 2026-11-14. npm downloads cover the week 2026-11-07 to 2026-11-13 (`https://api.npmjs.org/downloads/point/last-week/<pkg>`). Versions and dates come from `https://registry.npmjs.org/<pkg>`. Stars come from `gh api repos/<owner>/<repo>` (`https://api.github.com/repos/<owner>/<repo>`). Baseline status comes from the **web-features 3.46.0** data.json (`https://registry.npmjs.org/web-features/-/web-features-3.46.0.tgz`, rendered at `https://webstatus.dev/features/<id>`). Definitions are at https://web.dev/baseline: "Newly available" means supported in all core browsers; "Widely available" means 30 months after that.

Repo state I confirmed:
- `skills/finally-good-ui/scripts/detect-stack.mjs` detects these animation libraries: `motion`, `framer-motion`, `motion-v`, `@vueuse/motion`, `gsap`, `@react-spring/*`, `react-spring`, `@formkit/auto-animate`, `lottie-web`, `lottie-react`, `@lottiefiles/*`. Component kits it detects: shadcn, mui, chakra, mantine, radix, headlessui. It does **not** detect Base UI, Reka, Bits UI, Ark or React Aria, and it detects no interaction-primitive libraries at all.
- The `--format js` helper exports `ms()`, `sec()`, `ease()` (returns a cubic-bezier array), `durations` and `easings`. It has no CSS-string easing, no JS easing function, no spring tokens and no reduced-motion helper.
- Recipes reference Sonner, vue-sonner, svelte-sonner, Floating UI, dnd-kit, SortableJS, Motion `Reorder`, TanStack Table and TanStack Virtual, and the Radix `forceMount` pattern.

---

### 1. Ranked summary

Effort: S is under a day of recipe or helper work, M is 1–3 days, L is more. Priority: 1 means do first.

| # | Library / feature | Reach (npm/wk · ★) | Fit with our motion language | Token mapping | Reduced motion built in? | Integration | Effort | Prio |
|---|---|---|---|---|---|---|---|---|
| 1 | **View Transitions** (native, same-document + `view-transition-class` + types) plus **React 19.3 `<ViewTransition>`** and router integrations (Next, Astro, SvelteKit, Nuxt, Angular) | Native. React 19.3.1 exports `ViewTransition`. Same-document VT Baseline 2025-10-14 | Core: spatial continuity and the signature moment | CSS vars directly (`animation: var(--duration-*) var(--ease-*)`) | No (React says so explicitly). Astro: yes | Upgrade `route-transition` and `shared-element-view-transition`. New recipe `react-view-transition`. Detect React ≥19.3 / Astro `ClientRouter` | M | **1** |
| 2 | **Radix / Base UI / Reka / Bits / Ark / React Aria state attributes** (`data-state`, `data-starting-style`/`data-ending-style`, `data-entering`/`data-exiting`) | @radix-ui/react-dialog 94.4M · @base-ui/react 30.3M · reka-ui 3.0M · bits-ui 1.7M · @ark-ui/react 1.5M · react-aria-components 9.1M | Every overlay a recipe animates in these stacks goes through them | CSS vars directly | No. The CSS must add it | New recipe `headless-primitive-motion`. Extend detect `components` | M | **1** |
| 3 | **Motion** (`motion/react`, `motion` JS, `motion-v`) | framer-motion 68.1M + motion 34.4M + motion-v 1.18M · ★35.1k | Already first-class | `sec()`, `ease()` array. **Spring tokens missing** | Yes: `MotionConfig reducedMotion="user"` | Add spring tokens and a `MotionConfig` setup snippet. Add motion-v snippets to Vue sections | S | **1** |
| 4 | **Sonner family** (sonner, vue-sonner, svelte-sonner) | 58.5M · 3.16M · 0.91M · ★13.2k | Toast is our most-used "system status" surface | Hard-coded `400ms ease` in CSS, so a token-bridge CSS override is needed | Yes (kills all transitions) | Token-bridge CSS in `toast-stack`. Detect | S | **1** |
| 5 | **Popover API + invoker commands + `@starting-style` + `transition-behavior`** (native) | Popover Baseline 2025-01-27 · invokers 2025-12-12 · @starting-style 2024-08-06 | Already our CSS baseline | CSS vars | Via our media query | Upgrade `popover-from-trigger` and `dialog-enter-exit` to `command`/`commandfor` (no JS) | S | **1** |
| 6 | **dnd-kit** (classic `@dnd-kit/core`/`sortable` and new `@dnd-kit/react`/`vue`/`svelte`/`solid` 0.5.x) | core 42.8M · sortable 41.3M · react 2.9M · ★17.8k | Drag-reorder is the `list-reorder-flip` upgrade trigger | `transition: {duration: ms, easing: 'cubic-bezier(...)'}` needs a **CSS-string easing** helper | New package: yes (duration→0) | New recipe `drag-reorder`. Detect | M | **2** |
| 7 | **GSAP 3.15** (now free, all plugins) | 8.19M · @gsap/react 1.6M · ★30.6k | Signature moments and scroll storytelling. Not routine UI | seconds (`sec()`) + `CustomEase.create(name, "x1,y1,x2,y2")` | No: `gsap.matchMedia()` pattern | Token mapping and reduced-motion pattern. New recipe `signature-timeline`. Detect exists | M | **2** |
| 8 | **Scroll-driven animations** (native) | Baseline **2026-10-27** (Firefox 159) | Scroll progress, sticky-header condense, reveal | CSS vars (duration is ignored on a scroll timeline; easing applies) | Via our media query | New recipe `scroll-linked`. Replaces GSAP ScrollTrigger for simple cases | M | **2** |
| 9 | **Number Flow** (React/Vue/Svelte/JS) | number-flow 3.39M · @number-flow/react 3.11M · ★7.8k | KPI and counter changes in dashboards | `EffectTiming` `{duration: ms, easing: CSS string}` | Yes (`respectMotionPreference` defaults to true) | New recipe `number-change` | S | **2** |
| 10 | **cmdk** (React) | 47.8M · ★13.1k | Command palette: frequency budget means near-instant | `--cmdk-list-height` CSS var + our tokens | No | New recipe `command-palette` | S | **2** |
| 11 | **Floating UI** | @floating-ui/dom 140M · react 34.0M · vue 7.4M · ★32.8k | Positioning for `popover-from-trigger` | `useTransitionStyles({duration: ms or {open, close}})`, easing via CSS | No | Add a mapping to `popover-from-trigger`. Detect | S | **2** |
| 12 | **Drawer / bottom sheet** (Vaul is **unmaintained**; Base UI Drawer, Reka Drawer, vaul-svelte, native `<dialog>`) | vaul 31.8M · vaul-vue 1.1M (deprecated in favour of Reka Drawer) | Mobile sheets: easing `snappy`, duration `medium` | Vaul hard-codes `0.5s cubic-bezier(0.32,0.72,0,1)` | Unknown / no | New recipe `bottom-sheet`. Do not recommend Vaul for new work | M | **2** |
| 13 | **Angular `animate.enter` / `animate.leave`** (`@angular/animations` deprecated since v20.2, intent to remove in v23) | @angular/animations 5.14M · @angular/core 8.19M | Angular is an unserved stack | CSS classes, so CSS vars directly | Via our media query | Add Angular notes to every recipe. Flag legacy `trigger()` | S | **2** |
| 14 | **AutoAnimate** | 2.28M · ★14.0k | Zero-config FLIP for lists | `{duration: ms, easing: CSS string}` | Yes (opt-out flag) | Mention as the vanilla/Vue/Svelte/Angular path in `list-reorder-flip` | S | 3 |
| 15 | **CSS anchor positioning** (native) | **Not Baseline** (Chromium + Safari 26/27, no Firefox) | Popover placement and origin | n/a | n/a | Keep it as progressive enhancement in `popover-from-trigger` with a Floating UI fallback | S | 3 |
| 16 | **`linear()` easing** (native, Baseline **widely** 2026-06-11) | Native | Lets spring tokens be CSS | Emit springs as `linear(...)` | n/a | Emitter: spring → `linear()` | S | 3 (pairs with #3) |
| 17 | **`sibling-index()` / `sibling-count()`** (native, Baseline 2026-08-18) | Native | Stagger without `--i` | `calc(sibling-index() * var(--stagger))` | n/a | Upgrade `list-stagger-enter` | S | 3 |
| 18 | **`::details-content` + `interpolate-size`** | details-content Baseline 2025-09-16 · interpolate-size Chromium only | Accordion | CSS vars | n/a | Small update to `accordion-auto-height` | S | 3 |
| 19 | **Lottie / dotLottie / Rive** | lottie-web 9.9M · dotlottie-web 2.3M · @rive-app/canvas 1.5M · ★32.4k/0.9k/1.0k | Illustrations in empty and success states only | Own timelines. Only playback speed maps | Not found in any of the three repos | New recipe `illustrated-moment` (static frame under reduce). Detect Rive | M | 3 |
| 20 | **anime.js v4** | 1.11M · **★74.6k** (most-starred here) | Alternative to GSAP for timelines | ms + `cubicBezier(x1,y1,x2,y2)` | Not documented | Detect plus a mapping table row | S | 3 |
| 21 | **React Spring** | @react-spring/web 6.63M · ★29.3k | Physics. Detect exists | `duration` ms + `easing` **function** | `useReducedMotion()` sets `skipAnimation` | Mapping row (needs `easeFn`) | S | 3 |
| 22 | **TanStack Virtual** | virtual-core 50.8M · react 43.2M · ★7.2k | Turns motion off for virtualised rows | n/a | n/a | Already in `data-table`. Add a "no FLIP on virtual rows" rule | S | 3 |
| 23 | **Embla Carousel** (8.6.0; v9 RC) | embla-carousel 29.7M · ★8.5k | Carousels | `duration` is **not ms**: physics value 20–60 | Via `breakpoints` media query | New recipe `carousel` (low prio for apps) | S | 4 |
| 24 | **react-day-picker** (10.0.2, `animate` since 9.6) | 48.8M · ★6.9k | Date pickers in forms | `--rdp-animation_duration` / `--rdp-animation_timing` CSS vars | No | Token bridge in `form-validation` or a new `date-field` | S | 4 |
| 25 | **Pragmatic DnD** (Atlassian) | 2.95M · ★12.8k | Kanban/tree DnD, any framework | No animation in core. The `flourish` package has a post-move flash | n/a | Mention in `drag-reorder` as the large-board option | S | 4 |
| 26 | **SortableJS** | 5.48M · ★31.2k | Vanilla/Vue drag | `animation: ms`, `easing: "cubic-bezier(...)"` string | No | Mapping row in `drag-reorder` | S | 4 |
| 27 | **Svelte / Vue / Solid built-ins** | svelte 9.6M · vue 24.8M · solid-transition-group 5.4M | Already used in recipes (Svelte, Vue) | Svelte `easing` is a **function**, so `easeFn` is needed | Svelte: no (WAAPI ignores CSS media) | Fix Svelte snippets to pass `easing: easeFn()`. Solid notes | S | 3 |
| 28 | **Lenis** | 2.74M · ★17.3k | Smooth-scroll hijack is off-canon for apps | `duration` in **seconds** + `easing` function | Yes (default on) | Detect so scroll recipes call `lenis.scrollTo`. No recipe | S | 4 |
| 29 | **input-otp** · **react-resizable-panels** · **react-use-measure** | 27.7M · 32.0M · 11.7M | No animation APIs worth mapping | n/a | n/a | Mention only | S | 5 |
| 30 | **Swup / Barba** · **Theatre.js** | 58k · 10.8k · 39.8k (wk) | MPA page swaps (superseded by cross-document VT) · dev tooling, public repo idle | CSS / n/a | Unknown | Skip. Point MPAs to cross-document VT | – | 5 |

---

### 2. Proposed new recipes

| Recipe (path) | Intent | Library / native feature |
|---|---|---|
| `motion/react-view-transition` | Route, Suspense-reveal and shared-element motion in React 19.3 / Next App Router using `<ViewTransition>` + `addTransitionType`, wired to our tokens | React `ViewTransition`, native VT types + `view-transition-class` |
| `motion/headless-primitive-motion` | One token-driven CSS layer for overlay enter/exit across Radix (`data-state`), Base UI (`data-starting-style`/`data-ending-style`), React Aria (`data-entering`/`data-exiting`), Reka/Bits/Ark | Radix, Base UI, React Aria, Reka, Bits, Ark |
| `motion/drag-reorder` | Drag to reorder with keyboard support, drop settle animation and token timing; library chosen by stack | dnd-kit (new and classic), SortableJS, Pragmatic DnD, Motion `Reorder` |
| `motion/scroll-linked` | Scroll progress bar, condensing sticky header, reveal-on-view, all on the compositor with no JS | Native scroll-driven animations. GSAP ScrollTrigger is the upgrade trigger |
| `motion/number-change` | Animate changing numbers (KPIs, counters, prices) so the change reads, with tabular figures | Number Flow. CSS `@property` counter as the fallback |
| `motion/bottom-sheet` | Mobile sheet/drawer with drag-to-dismiss, snap points and a `snappy` ease | Base UI Drawer / Reka Drawer / native `<dialog>` + CSS. Vaul is legacy |
| `patterns/command-palette` | ⌘K palette: instant open (frequency budget), height glide via `--cmdk-list-height`, empty/loading states | cmdk (React). Vue/Svelte via Reka/Bits combobox |
| `motion/signature-timeline` | The one orchestrated signature moment (onboarding hero, success) as a token-driven timeline | GSAP timeline / anime.js v4 / Motion `animate()` sequences |
| `motion/illustrated-moment` | Lottie/Rive illustration in empty or success states, static frame under reduced motion, lazy-loaded | dotLottie, lottie-web, Rive |
| `patterns/carousel` (low prio) | Swipeable carousel with snap and reduced-motion jump | Native scroll-snap first. Embla is the upgrade |
| (upgrade) `motion/list-stagger-enter` | Replace the per-item `--i` with `sibling-index()` | Native, Baseline 2026-08-18 |
| (upgrade) `motion/popover-from-trigger`, `dialog-enter-exit` | `command`/`commandfor` invokers, `closedby="any"` as an enhancement, anchor positioning with fallback | Native |
| (upgrade) `motion/accordion-auto-height` | Animate `::details-content` (Baseline) together with `interpolate-size` | Native |

#### Changes to the motion-tokens helper (`emit-tokens --format js`)

1. **`cssEase(name)`** returns `"cubic-bezier(0.2, 0, 0, 1)"`. Needed by dnd-kit `transition.easing`, SortableJS `easing`, AutoAnimate `easing`, Number Flow `*Timing.easing`, the WAAPI `easing`, and anime.js `waapi.animate` `ease`.
2. **`easeFn(name)`** returns a `(t) => number` cubic-bezier solver (about 25 lines inlined into the generated file). Needed by Svelte `transition:` `easing`, React Spring `config.easing`, Lenis `easing`, and Vue/Solid JS hooks.
3. **`bezierString(name)`** returns `"0.2,0,0,1"` for GSAP `CustomEase.create("fgu-move", bezierString("move"))`. The alternative is `gsapEase(name)`, which registers lazily when `CustomEase` is present.
4. **Spring token group** (new `spring` group in tokens.json, e.g. `snappy: {visualDuration: 0.3, bounce: 0}`). `spring(name)` returns Motion's `{type:"spring", visualDuration, bounce}`. `--format css` emits `--spring-*` as a `linear()` string (`linear()` is Baseline widely available, so a CSS fallback is safe).
5. **`reduced()`** returns a boolean (`matchMedia('(prefers-reduced-motion: reduce)')`) and **`msMotion(name)` / `secMotion(name)`** return 0 under reduce. This replaces the hand-rolled `reduce()` lambdas in `list-reorder-flip` and `shared-element-view-transition`.
6. Optional: **`--format adapters`** emits library token-bridge CSS (Sonner, react-day-picker, Vaul/Drawer, cmdk) and is applied only when detect-stack finds the library.

#### Changes to `detect-stack.mjs`

- `animation[]`: add `animejs`, `@rive-app/*` → `rive`, `lenis`, `@number-flow/*` + `number-flow` → `number-flow`, `@theatre/core`. Split `@lottiefiles/dotlottie-*` → `dotlottie`.
- New `interaction[]`: `sonner`/`vue-sonner`/`svelte-sonner` → `sonner`; `vaul`/`vaul-vue`/`vaul-svelte` → `vaul` (flag it as unmaintained); `cmdk`/`cmdk-sv` → `cmdk`; `@floating-ui/*` → `floating-ui`; `@dnd-kit/core` → `dnd-kit` (classic); `@dnd-kit/react|vue|svelte|solid|dom` → `dnd-kit-next`; `@atlaskit/pragmatic-drag-and-drop` → `pragmatic-dnd`; `sortablejs`/`vuedraggable` → `sortablejs`; `embla-carousel*` → `embla`; `@tanstack/*-virtual` → `tanstack-virtual`; `react-day-picker`; `input-otp`; `react-resizable-panels`.
- `components`: add `base-ui` (`@base-ui/react`, plus legacy `@base-ui-components/react`), `reka` (`reka-ui`), `bits` (`bits-ui`), `ark` (`@ark-ui/*`), `react-aria` (`react-aria-components`). These decide which state attributes the headless-primitive recipe targets.
- New `viewTransitions` capability: `react` ≥19.3 (exports `ViewTransition`); `astro` (ClientRouter); `@sveltejs/kit` (`onNavigate`); `@angular/router` (`withViewTransitions`, UNVERIFIED in this pass); `nuxt` (experimental flag, UNVERIFIED in this pass).
- Angular: flag `@angular/animations` as deprecated so recipes emit `animate.enter`/`animate.leave`.

---

### 3. Native platform features

All statuses come from web-features 3.46.0 data.json (see header). Versions are given as chrome / firefox / safari.

| Feature (web-features id) | Status | Low date | Support | What it does for our recipes |
|---|---|---|---|---|
| `view-transitions` (same-document, incl. `startViewTransition({types})`, `pagereveal`/`pageswap`, `match-element`) | **Baseline newly** | 2025-10-14 | 111 / 144 / 18 | `route-transition` and `shared-element-view-transition` can drop the "Firefox: fine" caveat for same-document. `view-transition-name: match-element` removes per-item naming in `list-reorder-flip`'s VT variant |
| `view-transition-class` | **Baseline newly** | 2025-10-14 | 125 / 144 / 18.2 | Style a group of named elements once (`::view-transition-group(.card)`). Upgrade both VT recipes |
| `active-view-transition` (`ViewTransitionTypeSet`, `:active-view-transition-type()`) | **Baseline newly** | 2026-01-13 | 125 / 147 / 18.2 | Direction (forward/back) via types instead of a `data-nav` attribute in `route-transition` |
| `cross-document-view-transitions` (`@view-transition`) | **Not Baseline** | – | 126 / – / 18.2 | MPA route transitions as progressive enhancement. This replaces Swup/Barba |
| `view-transitions-element-scoped` (`element.startViewTransition`) | Not Baseline | – | Chrome 147 only | Future: scoped transitions without freezing the page. Watch |
| `scroll-driven-animations` | **Baseline newly** | **2026-10-27** | 115 / 159 / 26 | New `scroll-linked` recipe. Replaces GSAP ScrollTrigger and IntersectionObserver for reveal/progress |
| `scroll-triggered-animations` (`timeline-trigger`) | Not Baseline | – | Chrome 146 | Future "play once when in view". Watch |
| `anchor-positioning` | **Not Baseline** | – | Chrome (core since 125; the newest sub-features push web-features to 157) / – / Safari 26–27 | `popover-from-trigger` positioning. Keep Floating UI as the fallback |
| `starting-style` | **Baseline newly** | 2024-08-06 | 117 / 129 / 17.5 | Already used (dialog, popover, toast, settings save bar) |
| `transition-behavior` (`allow-discrete`) | **Baseline newly** | 2024-08-06 | 117 / 129 / 17.4 | Exit animations for `display`/`overlay`. Already implied by our popover/dialog CSS |
| `popover` | **Baseline newly** | 2025-01-27 | 116 / 125 / 17 (iOS 18.3) | Already used |
| `popover-hint` | Not Baseline | – | 151 / 153 / – | Tooltip layering. Later |
| `invoker-commands` (`command`, `commandfor`) | **Baseline newly** | 2025-12-12 | 135 / 144 / 26.2 | JS-free open/close for `dialog-enter-exit` (`command="show-modal"`) and popover |
| `interest-invokers` (`interestfor`) | Not Baseline | – | Chrome 149 | Hover/focus tooltips without JS. Watch |
| `dialog-closedby` | **Not Baseline** | – | 134 / 141 / – | Light dismiss for `<dialog>` as an enhancement. Keep the JS backdrop-click fallback |
| `requestclose` (`dialog.requestClose()`) | **Baseline newly** | 2025-05-27 | 134 / 139 / 18.4 | Cancelable close, so "unsaved changes?" can run before the exit animation |
| `linear-easing` (`linear()`) | **Baseline widely** | high 2026-06-11 | 113 / 112 / 17.2 | Spring and bounce tokens as CSS (see helper change 4) |
| `interpolate-size` / `calc-size` | **Not Baseline** (Chromium 129 only); MDN: "Limited availability", "Experimental" (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size) | – | 129 / – / – | Already guarded with `@supports` in `accordion-auto-height` |
| `details-content` (`::details-content`) | **Baseline newly** | 2025-09-16 | 131 / 143 / 18.4 | Accordion: animate `::details-content` `content-visibility` + `block-size` with `allow-discrete` |
| `details-name` (exclusive accordion) | **Baseline newly** | 2024-09-03 | 120 / 130 / 17.2 | Mention in the accordion recipe |
| `sibling-count` (`sibling-index()`, `sibling-count()`) | **Baseline newly** | 2026-08-18 | 138 / 154 / 26.2 | `list-stagger-enter`: `transition-delay: calc(min(sibling-index(), 8) * 40ms)` |
| `scrollend` | **Baseline newly** | 2025-12-12 | 114 / 109 / 26.2 | Carousel and snap-settle hooks |
| `web-animations` | **Baseline widely** | 2020 | – | Our vanilla FLIP code |
| `prefers-reduced-motion` | **Baseline widely** | 2020 | – | – |
| `customizable-select` (`appearance: base-select`) | Not Baseline | – | 135 / – / 27 | Future select animation. Watch |

Framework integrations with View Transitions:
- **React 19.3**: `ViewTransition` and `addTransitionType` are exported from the published `react@19.3.1` production build (verified by grepping https://unpkg.com/react@19.3.1/cjs/react.production.js; latest is 19.3.1, published 2026-10-14 per https://registry.npmjs.org/react). The props are `name`, plus `enter`/`exit`/`update`/`share`/`default` taking `"auto" | "none" | className | {[type]: …}`. React says: "React doesn't automatically disable animations for this case. We recommend always using the `@media (prefers-reduced-motion)` media query" (https://react.dev/reference/react/ViewTransition).
- **Next.js App Router**: "View transitions work in the App Router with no configuration. React 19.3 includes the `<ViewTransition>` component and `addTransitionType`". `<Link transitionTypes={['nav-forward']}>` (https://nextjs.org/docs/app/guides/view-transitions). That page also promotes a Vercel agent skill, `vercel-react-view-transitions`. This is a **direct competitor**. Our edge is that we run on tokens and follow a motion canon (frequency budget, exit at 60–75% of enter), where theirs hard-codes `150ms ease-in`.
- **Astro**: `<ClientRouter />` with `transition:animate="fade|slide|none|initial"` and `fade({ duration: "0.4s" })`. Reduced motion is handled automatically (https://docs.astro.build/en/guides/view-transitions/). Token mapping: `fade({ duration: \`${ms('long')}ms\` })` or CSS on the `::view-transition-*` pseudo-elements.
- **SvelteKit** `onNavigate` is already used in our recipes. Angular `withViewTransitions` and Nuxt `experimental.viewTransition`: UNVERIFIED in this pass.

---

### 4. Per-library sections: Part A, animation and motion

#### 4.1 Motion (motion.dev): React, JS, Vue
- **What/status:** `motion` 14.14.0 and `framer-motion` 14.14.0, both 2026-11-13, MIT. `motion-v` (Vue) 2.12.0, 2026-11-10, MIT. `@vueuse/motion` 3.0.3, 2025-03-10 (stale). Sources: https://registry.npmjs.org/motion, https://registry.npmjs.org/motion-v, https://registry.npmjs.org/@vueuse/motion
- **Adoption:** framer-motion 68,124,317/wk; motion 34,374,451/wk; motion-v 1,182,330/wk; @vueuse/motion 360,275/wk. ★ motiondivision/motion 35,144, motion-vue 2,229, vueuse/motion 2,768 (2026-11-14).
- **Detection:** already in place (`motion`, `framer-motion`, `motion-v`, `@vueuse/motion`).
- **Token mapping** (https://motion.dev/docs/react-transitions): `delay` is "(in seconds)" and the duration default is `0.3`, so durations are in seconds (`sec()`). `ease` takes named strings, "An array of four numbers to define a cubic bezier curve" (`ease()` already returns this), or a function. Springs: `transition={{ type: "spring", bounce: 0.25 }}`, where `visualDuration` "set in seconds" overrides `duration`, and "`bounce` and `duration` will be overridden if `stiffness`, `damping` or `mass` are set". CSS generation: `element.style.transition = "all " + spring(0.5)` (https://motion.dev/docs/spring).
- **Reduced motion:** built in. `<MotionConfig reducedMotion="user">` makes "all motion components ... automatically disable transform and layout animations while preserving ... opacity and backgroundColor". `useReducedMotion()` returns a boolean (https://motion.dev/docs/react-accessibility).
- **Integration:** (a) recipes should recommend one `<MotionConfig reducedMotion="user">` at the root. This removes many `reduce ? … : …` branches. (b) add spring tokens and `spring(name)`. (c) add `motion-v` snippets to the Vue notes, since it has 3× the downloads of `@vueuse/motion`. **S, P1.**

#### 4.2 GSAP 3.15 (free, including plugins)
- **What/status:** `gsap` 3.15.1, 2026-11-04. License string: "Standard 'no charge' license: https://gsap.com/standard-license" (https://registry.npmjs.org/gsap). `@gsap/react` 2.1.2, 2025-01-15.
- **Free incl. plugins: VERIFIED.** "GSAP is now 100% free for all users, thanks to Webflow's support" (https://gsap.com/pricing/). The license FAQ says it "can be used in commercial projects at no charge", including the formerly members-only plugins (SplitText, MorphSVG) (https://gsap.com/standard-license).
- **License caveat:** "Prohibited Uses" means "any implementation and/or use of GSAP Products in tools that allow users to build visual animations without code" that "competes with Webflow's", and these require "prior written consent" (https://gsap.com/standard-license). finally-good-ui writes code into the user's own project and does not bundle GSAP, so this probably does not apply, but that reading is a legal interpretation and is UNVERIFIED. Rule: never vendor GSAP into the plugin or into its direction prototypes. Only add it to a user project that already depends on it, or with the user's consent.
- **Adoption:** gsap 8,194,450/wk; @gsap/react 1,604,246/wk. ★ greensock/GSAP 30,620.
- **Detection:** `gsap` is already detected. Add `@gsap/react`.
- **Token mapping:** duration "The duration of the animation (in seconds). Default: `0.5`" (https://gsap.com/docs/v3/GSAP/Tween), so use `sec()`. Easing comes from cubic-bezier via CustomEase: `CustomEase.create("easeName", ".17,.67,.83,.67")` (https://gsap.com/docs/v3/Eases/CustomEase/). This needs `bezierString()`.
- **Reduced motion:** not automatic. The documented pattern is `gsap.matchMedia()` with a `reduceMotion: "(prefers-reduced-motion: reduce)"` condition and `duration: reduceMotion ? 0 : 2` (https://gsap.com/docs/v3/GSAP/gsap.matchMedia()).
- **Integration:** a mapping table row; a `signature-timeline` recipe (timeline = the signature moment); a ScrollTrigger mention as the upgrade trigger in `scroll-linked`. **M, P2.**

#### 4.3 anime.js v4
- **Status:** `animejs` 4.5.0, 2026-06-22, MIT. 1,108,032/wk. **★ 74,641**, the most-starred repo in this set (juliangarnier/anime).
- **Detection:** `animejs` (not detected today).
- **Token mapping:** "Defines the duration in milliseconds" (https://animejs.com/documentation/animation/tween-parameters/duration), so use `ms()`. Easing: `import { animate, cubicBezier } from 'animejs'; animate(target, { x: 100, ease: cubicBezier(0, 0, 0.58, 1) })`. With WAAPI: `ease: 'cubic-bezier(0, 0, 0.58, 1)'` (https://animejs.com/documentation/easings/cubic-bezier-easing). So `cubicBezier(...ease("move"))` works with the existing helper. The engine supports a `timeUnit` setting of seconds or milliseconds (https://animejs.com/documentation/engine/engine-parameters/).
- **Reduced motion:** not documented on the engine page (same URL), so treat it as absent and guard with `reduced()`.
- **Integration:** detect it plus a mapping row. Offer it as the MIT alternative for `signature-timeline`. **S, P3.**

#### 4.4 React Spring
- **Status:** `@react-spring/web` 10.1.2, 2026-06-24, MIT, 6,627,005/wk. `react-spring` 10.0.4, 1,298,187/wk. ★ 29,283.
- **Token mapping:** source `packages/core/src/AnimationConfig.ts`: "Animation length in number of milliseconds" (`duration?: number`); "`easing`: The animation curve. Only used when `duration` is defined." It is typed `EasingFunction`, so it needs `easeFn()`. https://github.com/pmndrs/react-spring/blob/main/packages/core/src/AnimationConfig.ts
- **Reduced motion:** `useReducedMotion()` in `packages/shared/src/hooks/useReducedMotion.ts` calls `assign({ skipAnimation: e.matches })` (https://github.com/pmndrs/react-spring/blob/main/packages/shared/src/hooks/useReducedMotion.ts).
- **Integration:** a mapping row. Recommend calling `useReducedMotion()` once at the root. **S, P3.**

#### 4.5 AutoAnimate
- **Status:** `@formkit/auto-animate` 0.10.2, 2026-11-06, MIT, 2,279,140/wk, ★ 13,968. Adapters for React, Vue (directive and composable), Preact, Solid, Svelte action, Angular and Marko (https://auto-animate.formkit.com/).
- **Token mapping** (source `src/index.ts`): `duration: number` "in milliseconds"; `easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | ({} & string)`, passed to `el.animate()`, so a CSS string such as `cssEase("move")` works. Default `{ duration: 250, easing: "ease-in-out" }`. Note that add and remove use hard-coded `"ease-in"`/`"ease-out"` and add runs at `duration * 1.5` (https://github.com/formkit/auto-animate/blob/master/src/index.ts). UNVERIFIED: whether the branch is `master` or `main`; the code itself was read through the GitHub API.
- **Reduced motion:** built in. It checks `matchMedia("(prefers-reduced-motion: reduce)")`, and `disrespectUserMotionPreference` is the opt-out flag (same file).
- **Integration:** offer it as the zero-code path in `list-reorder-flip` for Vue, Svelte, Angular and Solid. **S, P3.**

#### 4.6 Lottie / dotLottie
- **Status:** `lottie-web` 5.13.0, 2025-05-21, last push 2025-09-01, 9,924,340/wk, ★ 32,414. `lottie-react` 3.1.2, 4,475,027/wk. `@lottiefiles/dotlottie-web` 0.83.2, 2026-11-12, 2,316,290/wk, ★ 945. `@lottiefiles/dotlottie-react` 0.22.2, 1,904,487/wk. All MIT. Sources: registry and GitHub API.
- **Token mapping:** none. Playback runs on its own timeline. Only `speed` and segment selection are adjustable.
- **Reduced motion:** a GitHub code search for `prefers-reduced-motion` in airbnb/lottie-web and LottieFiles/dotlottie-web returned nothing (code search can miss files, so treat as UNVERIFIED-absent). The recipe must show a static frame (`autoplay: false`, go to the final frame) under reduce.
- **Integration:** keep the existing detection and add the `illustrated-moment` recipe. Prefer dotLottie (active) over lottie-web (last push 2025-09). **M, P3.**

#### 4.7 Rive
- **Status:** `@rive-app/canvas` 2.50.0, 2026-11-09, MIT, 1,522,424/wk. `@rive-app/react-canvas` 4.39.0, 1,214,985/wk. `@rive-app/react-webgl2` 714,078/wk. ★ rive-wasm 1,022, rive-react 1,189. "The runtime is open source" (https://rive.app/docs/runtimes/web/web-js). The editor's licensing is not stated there, so UNVERIFIED.
- **Reduced motion:** not found by repo code search (UNVERIFIED-absent). State machines can take a "reduced" input, which is our responsibility to wire.
- **Detection:** `@rive-app/*` (missing today). Integration: share `illustrated-moment`. **M, P3.**

#### 4.8 Theatre.js
- `@theatre/core` 0.7.2, 2024-05-19, Apache-2.0. `@theatre/studio` is AGPL-3.0. 39,840/wk. README: "We have _temporarily_ moved development to a private repo". Last public push 2024-08-14 (https://github.com/theatre-js/theatre). This is a timeline editor for WebGL and motion graphics, which falls outside app UI. **Skip, P5.**

#### 4.9 Svelte built-ins
- svelte 5.57.3, 2026-10-26, 9,567,430/wk. Transition params are `delay`, `duration` (ms, e.g. `{ duration: 2000 }` "over two seconds") and `easing?: (t: number) => number`, which is a **function**. Our `ease()` arrays will not work there. "Transitions are driven by the Web Animations API rather than by CSS", so a global reduced-motion media query does not affect them. Use `prefersReducedMotion` from `svelte/motion` (https://svelte.dev/docs/svelte/transition).
- **Integration:** recipes currently pass only `duration: ms(...)`. Add `easing: easeFn('enter')` and the `prefersReducedMotion.current ? 0 : ms(...)` guard. **S, P3.**

#### 4.10 Vue `<Transition>` / `<TransitionGroup>`
- vue 3.5.45, 2026-11-05, 24,808,637/wk. `:duration` is "(in milliseconds)" and can be `{ enter: 500, leave: 800 }`. JS hooks `@enter(el, done)` plus `:css="false"`. The page gives no reduced-motion guidance (https://vuejs.org/guide/built-ins/transition.html). The CSS classes take our CSS vars directly, so the current recipes are fine. Add `motion-v` for spring and layout cases. **S.**

#### 4.11 Angular animations
- **`@angular/animations` is DEPRECATED.** The npm deprecation message reads: "@angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead." (https://registry.npmjs.org/@angular/animations/latest, field `deprecated`). `trigger()` is "deprecated since v20.2 … Intent to remove in v23" (https://angular.dev/api/animations/trigger). Current version: 22.2.6, 2026-11-12. 5,140,038/wk.
- **New API:** `<div animate.enter="enter-animation">` with `.enter-animation { animation: slide-fade 1s; }`. "When the animation completes, Angular removes the class". `animate.leave="leaving"` waits for the CSS transition. "You cannot use legacy animations alongside `animate.enter` and `animate.leave` within the same component" (https://angular.dev/guide/animations).
- **Token mapping:** CSS classes, so `var(--duration-*) var(--ease-*)` works directly. Reduced motion comes from our media query.
- **Integration:** add an "Angular" line to each recipe's framework notes. detect-stack already finds `angular`. If it finds `@angular/animations`, recipes should migrate rather than extend it. **S, P2.** This is cheap reach into an unserved stack.

#### 4.12 Solid (`solid-transition-group`)
- 0.3.0, 2025-01-29, MIT. 5,395,062/wk; that number is surprisingly high and probably transitive (UNVERIFIED cause). ★ 299. The API mirrors Vue: `name="slide-fade"` generates `.slide-fade-enter-active` and similar classes; `onEnter(el, done)`; `TransitionGroup` with `moveClass` (https://github.com/solidjs-community/solid-transition-group). CSS vars apply directly. **S, P4.**

#### 4.13 Lenis
- `lenis` 1.3.27, 2026-10-15, MIT, 2,738,508/wk, ★ 17,263. `@studio-freight/lenis` is the legacy name (153,358/wk). Options: `duration` "(in seconds)" default `1.2`; `easing` is a `function`; `lerp` default `0.1`; `respectReducedMotion` default `true` ("smoothing is disabled … programmatic scrolls … jump instantly") (https://github.com/darkroomengineering/lenis#reduced-motion).
- **Fit:** scroll hijacking conflicts with app-UI canon. Detect it only so that `scroll-linked` and anchor scrolls call `lenis.scrollTo(target, { duration: sec('long'), easing: easeFn('move') })`. **S, P4.**

#### 4.14 Barba / Swup
- `@barba/core` 2.10.3, 2024-08-12, 10,755/wk, ★ 12,997. `swup` 4.10.0, 2026-09-03, 57,965/wk, ★ 5,252. Swup "will wait for CSS animations, JS animations, and native View Transitions before updating the page" (https://swup.js.org/getting-started/how-it-works/). For MPAs, recommend cross-document VT instead. **Skip, P5.**

#### 4.15 Number Flow
- `number-flow` 0.6.2, 2026-07-18, MIT, 3,385,469/wk. `@number-flow/react` 3,110,449; `@number-flow/vue` 83,464; `@number-flow/svelte` 137,928. ★ 7,809. "An animated number component for React, Vue, Svelte, and TS/JS" (https://github.com/barvian/number-flow).
- **Token mapping:** `transformTiming={{ duration: 750, easing: 'linear(...)' }}`, `spinTiming` (falls back to transformTiming), `opacityTiming={{ duration: 350, easing: 'ease-out' }}`. These are WAAPI `EffectTiming` objects, so duration is in ms and easing is a CSS string: use `{ duration: ms('long'), easing: cssEase('move') }` (https://number-flow.barvian.me/).
- **Reduced motion:** `respectMotionPreference` defaults to `true` (same page).
- **Integration:** a `number-change` recipe for KPI cards and the `data-table` live cells (pair with `typography.tabular-numbers`). **S, P2.**

#### 4.16 react-use-measure
- 2.1.7, 2025-01-30, 11,686,294/wk, ★ 988. A ResizeObserver hook used for animating to a measured height with Motion. Mention it in `accordion-auto-height`'s React + Motion section only. **P5.**

---

### 5. Per-library sections: Part B, interaction primitives

#### 5.1 Sonner / vue-sonner / svelte-sonner
- `sonner` 2.0.8, 2026-08-09, MIT, **58,507,026/wk**, ★ 13,216. `vue-sonner` 2.0.9, 2025-10-01, 3,155,613/wk, ★ 1,476. `svelte-sonner` 1.2.3, 2026-11-02, 911,126/wk, ★ 1,302.
- **Animation internals** (https://github.com/emilkowalski/sonner/blob/main/src/styles.css): `transition: transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms`, with state on `[data-sonner-toast][data-mounted='true']`, `[data-removed]`, `[data-swipe-out]`, `[data-expanded]`. Constants in `src/index.tsx`: `TOAST_LIFETIME = 4000`, `TIME_BEFORE_UNMOUNT = 200`, `SWIPE_THRESHOLD = 45`. The docs styling page exposes no duration or easing API (https://sonner.emilkowal.ski/styling).
- **Reduced motion:** built in: `@media (prefers-reduced-motion) { [data-sonner-toast] … { transition: none !important; animation: none !important; } }` (styles.css line ~708). This also kills opacity, which is stricter than our canon (we keep fades). Acceptable.
- **Token bridge** (proposed; specificity and ordering are UNVERIFIED until tested): `[data-sonner-toast] { transition-duration: var(--duration-long), var(--duration-long), var(--duration-long), var(--duration-short); transition-timing-function: var(--ease-move); }`. 400ms equals our `long`, which our canon reserves for rare moments. Consider `medium` for toasts.
- **Integration:** detect it; put the bridge in `toast-stack`; vue-sonner and svelte-sonner are ports, so check their CSS selectors separately (UNVERIFIED). **S, P1.**

#### 5.2 Vaul (drawer)
- `vaul` 1.1.2, **2024-12-14**, 31,777,323/wk, ★ 8,737. The README says: "**This repo is unmaintained.** I might come back to it at some point, but not in the near future." (https://github.com/emilkowalski/vaul)
- `vaul-vue` 0.4.1 (1,109,527/wk): "**This package is no longer maintained.** Reka UI now ships a full Drawer component that supersedes Vaul Vue" (https://github.com/unovue/vaul-vue). `vaul-svelte` 0.3.2, 2024-06-29, 357,626/wk, last push 2025-03.
- Hard-coded motion: `transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)` (https://github.com/emilkowalski/vaul/blob/main/src/style.css).
- **Alternatives that exist in source:** Base UI `packages/react/src/drawer` (https://github.com/mui/base-ui/tree/master/packages/react/src/drawer) and Reka `Drawer` (https://github.com/unovue/reka-ui/tree/v2/packages/core/src/Drawer). Branch names are UNVERIFIED; the directories were listed through the GitHub API.
- **Integration:** a `bottom-sheet` recipe built on native `<dialog>` + `@starting-style` + pointer drag, with Base UI or Reka Drawer as the upgrade. Detect `vaul` and warn that it is unmaintained. **M, P2.**

#### 5.3 cmdk
- `cmdk` 1.1.1, 2025-03-14, MIT, 47,810,252/wk, ★ 13,147 (repo moved pacocoursey/cmdk → dip/cmdk). "Animate height using the `--cmdk-list-height` CSS variable": `height: var(--cmdk-list-height)` (https://github.com/dip/cmdk#list-cmdk-list). Svelte port `cmdk-sv` 0.0.19 (82,759/wk); Vue `vue-command-palette` is stale (2023).
- **Token mapping:** `transition: height var(--duration-short) var(--ease-move)`, under `motion.frequency-budget`: open is instant or `micro`.
- **Reduced motion:** none (no animation). **S, P2.** New `command-palette` recipe.

#### 5.4 Floating UI
- `@floating-ui/dom` 1.8.0, 2026-07-11, 140,034,241/wk. `@floating-ui/react` 0.27.20, 33,959,973/wk. `@floating-ui/vue` 2.0.1, 7,409,200/wk. ★ 32,811.
- **Token mapping:** `useTransitionStyles({ duration: number | {open, close}, initial, open, close, common })`. "Specifies the length of the transition in ms", default `250`. `useTransitionStatus` returns `'unmounted' | 'initial' | 'open' | 'close'` for `data-status` CSS (https://floating-ui.com/docs/useTransition). Map it as `duration: { open: ms('standard'), close: ms('short') }`, with `common: { transitionTimingFunction: cssEase('enter') }` (UNVERIFIED that `common` accepts a timing function; it accepts styles).
- **Reduced motion:** not handled (same page). Pass `duration: 0` and keep opacity.
- **Integration:** add a mapping to `popover-from-trigger`; detect `@floating-ui/*`. **S, P2.**

#### 5.5 dnd-kit (classic and new)
- Classic: `@dnd-kit/core` 6.3.1, **2024-12-05**, 42,824,541/wk. `@dnd-kit/sortable` 10.0.0, 41,264,015/wk.
- New: `@dnd-kit/react`, `/dom`, `/vue`, `/svelte`, `/solid`, all 0.5.3, 2026-10-31. react 2,916,776/wk; dom 3,237,415/wk. ★ 17,795. The README now lists React, Vue, Svelte and SolidJS adapters (https://github.com/clauderic/dnd-kit). The new line is pre-1.0.
- **Token mapping (new):** `useSortable({ transition: { duration, easing, idle } })`. "The duration of the transition in milliseconds" (https://dndkit.com/react/hooks/use-sortable). Source default: `{ duration: 250, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', idle: false }` (https://github.com/clauderic/dnd-kit/blob/main/packages/dom/src/sortable/sortable.ts). So use `{ duration: ms('standard'), easing: cssEase('snappy') }`.
- **Reduced motion (new):** built in: `prefersReducedMotion(getWindow(element)) ? {...transition, duration: 0} : transition` (same file, about line 322). For classic, UNVERIFIED in this pass; assume it is absent and guard ourselves.
- **Integration:** the `drag-reorder` recipe. Detect classic and new separately. Use the new adapters for Vue, Svelte and Solid. **M, P2.**

#### 5.6 Pragmatic drag and drop
- `@atlaskit/pragmatic-drag-and-drop` 4.0.0, 2026-09-24, Apache-2.0, 2,945,656/wk, ★ 12,795. "can be used with any view layer" and powers Trello, Jira and Confluence (https://github.com/atlassian/pragmatic-drag-and-drop). There is no motion in core. `@atlaskit/pragmatic-drag-and-drop-flourish` 3.2.5 provides `trigger-post-move-flash`; `react-drop-indicator` 4.3.0 provides drop lines (https://registry.npmjs.org/@atlaskit/pragmatic-drag-and-drop-flourish).
- **Integration:** mention it in `drag-reorder` for large boards and trees. The post-move flash fits our "highlight, don't move" rule for big lists. **S, P4.**

#### 5.7 SortableJS
- `sortablejs` 1.15.7, 2026-02-11, 5,477,220/wk, ★ 31,212. `vuedraggable` 2.24.3 (2020, Vue 2), 1,999,443/wk. vue.draggable.next was last pushed 2023.
- **Token mapping:** `animation: 150, // ms` and `easing: "cubic-bezier(1, 0, 0, 1)"` (https://github.com/SortableJS/Sortable#options). Use `animation: msMotion('standard'), easing: cssEase('move')`.
- **Reduced motion:** none found in the README. **S, P4.**

#### 5.8 Embla Carousel
- `embla-carousel` 8.6.0, 2025-04-04, 29,683,948/wk; react 27,342,050; vue 1,180,289; svelte 194,068. ★ 8,473. v9.0.0-rc04 2026-10-08 (https://api.github.com/repos/davidjerleke/embla-carousel/releases).
- **Token mapping:** `duration: number`, default `25`. "Duration is not in milliseconds because Embla uses an attraction physics simulation", recommended range 20–60 (https://www.embla-carousel.com/docs/api/options). It does not map to our tokens; document the fixed value.
- **Reduced motion:** via breakpoints: `'(prefers-reduced-motion: reduce)': { duration: 0 }` (same page). **S, P4.**

#### 5.9 react-resizable-panels
- 4.23.0, **2026-11-14**, 32,026,078/wk, ★ 5,481. No animation API was found in this pass (UNVERIFIED). Code search found no `prefers-reduced-motion`. Mention it in app-shell for split views only. **P5.**

#### 5.10 TanStack Virtual
- `@tanstack/virtual-core` 3.19.11, 2026-11-03, 50,808,909/wk; react-virtual 43,181,999; vue-virtual 6,047,375; svelte-virtual 194,803. ★ 7,198. There is no animation. Recipe rule: no FLIP or stagger on virtualised rows (already in `list-reorder-flip`'s "when NOT"). Detect it so the `motion.*` checks skip those lists. **S, P3.**

#### 5.11 Radix Primitives
- `@radix-ui/react-dialog` 1.3.1, 2026-10-12, 94,407,541/wk; ★ radix-ui/primitives 19,498. Animation: `.DialogContent[data-state="open"] { animation: fadeIn 300ms ease-out; }`. "the Radix Primitives will suspend unmount while your animation plays out". `forceMount` lets JS libraries take over (https://www.radix-ui.com/primitives/docs/guides/animation).
- **Token mapping:** use CSS keyframes with `var(--duration-*) var(--ease-*)` on `[data-state=open|closed]`. Exit uses `--ease-exit` and the shorter duration. Positioned content exposes transform-origin variables (e.g. `--radix-popover-content-transform-origin`), which the guide page doesn't mention, so UNVERIFIED here. **P1** (in `headless-primitive-motion`).

#### 5.12 Base UI
- `@base-ui/react` 1.9.0, 2026-10-09, 30,276,609/wk (the legacy name `@base-ui-components/react` 1.0.0-rc.0 has 1,244,206/wk). ★ mui/base-ui 11,412. Components include `drawer`, `toast`, `otp-field`, `popover`, `dialog` and more (repo `packages/react/src` listing).
- **Animation** (https://base-ui.com/react/handbook/animation): `&[data-starting-style], &[data-ending-style] { opacity: 0; transform: scale(0.9); }` for transitions (they recommend these because they can be cancelled midway); `[data-open]`/`[data-closed]` for keyframes. Motion integration works through the `render` prop + `AnimatePresence` + `keepMounted`. If the animation isn't detected, use `eventDetails.preventUnmountOnClose()` + `actionsRef.current.unmount()`.
- **Integration:** this is the attribute model closest to our `@starting-style` baseline, so the same mental model applies. Add `base-ui` to detect `components`. **P1.**

#### 5.13 React Aria Components
- `react-aria-components` 1.22.1, 2026-10-09, 9,122,712/wk, Apache-2.0. CSS: `&[data-entering], &[data-exiting] { transform: var(--origin); opacity: 0; }` with `transition: transform 200ms, opacity 200ms`. Render props `isEntering`/`isExiting` (https://react-aria.adobe.com/Popover). **P1** (same recipe).

#### 5.14 Reka UI / Bits UI / Ark UI
- `reka-ui` 2.11.0, 2026-10-05, 2,977,130/wk, ★ 6,957. Has `Presence`, `Drawer`, `Toast` (repo `packages/core/src` listing). `bits-ui` 2.21.0, 2026-11-11, 1,746,044/wk, ★ 3,664. `@ark-ui/react` 5.40.0, 1,469,572/wk; `@ark-ui/vue` 41,535/wk; ★ 5,469.
- Their exact state attribute names were not verified in this pass. Reka, as a Radix port, likely uses `data-state` (UNVERIFIED); Ark/Zag likely uses `data-state` (UNVERIFIED). The recipe must confirm them before shipping. **P1/P2.**

#### 5.15 input-otp
- 1.5.0, 2026-08-18, 27,695,358/wk, ★ 3,274. No motion API (caret blink is CSS). Base UI has `otp-field`; Reka has `PinInput`. Mention it in `form-validation`. **P5.**

#### 5.16 react-day-picker
- 10.0.2, 2026-09-30, 48,832,006/wk, ★ 6,868. `animate?: boolean`, "Animate navigating between months. @since 9.6.0" (package `dist/esm/types/props.d.ts`). CSS: `--rdp-animation_duration: 0.3s; --rdp-animation_timing: cubic-bezier(0.4, 0, 0.2, 1);` (package `src/style.css`, https://registry.npmjs.org/react-day-picker).
- **Token bridge:** `.rdp-root { --rdp-animation_duration: var(--duration-medium); --rdp-animation_timing: var(--ease-move); }`.
- **Reduced motion:** none. Grep for `prefers-reduced-motion` in the package found nothing; positive control: the same grep pass matched `animation_duration`. So the bridge must add `@media (prefers-reduced-motion: reduce) { .rdp-root { --rdp-animation_duration: 0s; } }`. **S, P4.**

---

### 6. Observations that affect strategy

1. **Distribution:** the libraries with the most stars are anime.js (74.6k), Motion (35.1k), Floating UI (32.8k), lottie-web (32.4k), SortableJS (31.2k), GSAP (30.6k) and React Spring (29.3k). Each "works with X" line in the README is a discovery hook. A cheap broad win is the **mapping table plus detection** for all of them (helper changes 1–3 cover nearly every library's easing format).
2. **Three easing formats cover everything:** a cubic-bezier array (Motion), a CSS string (WAAPI, dnd-kit, SortableJS, AutoAnimate, Number Flow, anime.js waapi), and a JS function (Svelte, React Spring, Lenis), plus GSAP's CustomEase string. Units split between **ms** (anime.js, React Spring, AutoAnimate, dnd-kit, SortableJS, Floating UI, Number Flow, Vue, Svelte) and **seconds** (Motion, GSAP, Lenis). Embla is unitless physics.
3. **Native has caught up:** VT types and classes, scroll-driven animations, invokers, `sibling-index()` and `linear()` are all Baseline as of Oct–Nov 2026. That supports the plugin's "CSS baseline first" stance and is a marketing point ("zero-dependency motion that is Baseline 2026").
4. **Competitor:** Vercel publishes a `vercel-react-view-transitions` agent skill from the Next.js docs. A token- and canon-driven `react-view-transition` recipe sets us apart from it.
5. **Do not recommend Vaul** (unmaintained) or `@angular/animations` (deprecated) in new output. Both are high-download traps an agent would otherwise pick.

---

# Part 3

## Research 3: tokens standards, charts, icons, fonts, forms/tables, agent-rule targets

Fetched 2026-11-14. npm figures are `api.npmjs.org/downloads/point/last-week/<pkg>` (window 2026-11-07..2026-11-13); versions/dates/licences from `registry.npmjs.org/<pkg>`; stars from `gh api repos/<owner>/<repo>`. Raw pulls are in `scratchpad/r3/` (npm.txt, dl2.txt, dl3.txt, gh.txt).
"UNVERIFIED" = I could not confirm it from a primary source in this session.

### 0. Ranked summary (what to build first)

| # | Integration | Why (reach) | Effort | Prio |
|---|---|---|---|---|
| 1 | **Make `tokens.json` real DTCG 2025.10** (colour objects, shadow objects, no `em` dimensions, alias `{ref}` resolution, reverse-domain `$extensions`, light/dark via a `.resolver.json`) and make `lib/tokens.mjs` read them | Every import/export path below depends on it. Today a 2025.10 colour object prints `[object Object]` (tested) | M | 1 |
| 2 | **Chart palette tokens + CSS-var chart theming**: emit `--chart-1..N` (shadcn convention) from a `chart` group, detect Recharts / shadcn chart / Tremor / Unovis / LayerChart / Plot / visx | Recharts 65.7M/wk, shadcn/ui 128k stars; SVG libs take `var(--x)` directly | S–M | 1 |
| 3 | **Font wiring**: detect `next/font`, `@nuxt/fonts`, `@fontsource(-variable)/*`; emit the loader snippet + map its CSS var into `--font-sans` (`@theme inline`) | next 92.9M/wk; @fontsource-variable/inter 11.5M/wk; today we only emit system stacks | S–M | 1 |
| 4 | **Icon detection + icon tokens** (size/stroke tied to type scale) emitted as CSS on `.lucide`-style classes or provider props (LucideProvider, Phosphor IconContext, SolarProvider, Hugeicons `strokeWidth`, Tabler `stroke`, Material Symbols `wght/opsz`) | lucide-react 134M/wk; missing from detection: Radix Icons 7.8M, Hugeicons 1.9M, Remix 1.4M, Iconify 1.6M, unplugin-icons 1.0M, lucide-vue/svelte | S | 2 |
| 5 | **Export targets refresh**: add Kiro `.kiro/steering/`, Cline `.clinerules/`, `.devin/rules/` (Windsurf's successor); keep AGENTS.md as the hub; add `--targets` to avoid duplicate loading | AGENTS.md read by Codex, Amp, Zed, Junie, Cursor, Copilot agent, Devin/Windsurf, Cline, Kiro, Gemini/Antigravity | S | 2 |
| 6 | **Import**: `import-tokens.mjs` normaliser for DTCG files from Figma native export, Tokens Studio (DTCG mode), Terrazzo `tz import` output | Figma native DTCG import/export is on Professional+ plans; REST Variables API is Enterprise-only | M | 2 |
| 7 | **Canvas chart theme adapters**: JS module of *resolved* colours/fonts for ECharts (`registerTheme`/`setTheme`), Chart.js `defaults`, AG Charts theme `palette`/`params`, uPlot, Nivo `theme` | echarts 10.6M/wk (67.7k★), chart.js 16.4M/wk (67.8k★), ag-charts 2.5M/wk; canvas cannot read `var()` | M | 2 |
| 8 | **Export to Style Dictionary / Terrazzo**: write a spec-clean `design.tokens.json` + `design.resolver.json` + starter `terrazzo.config.ts` / `sd.config.mjs` | style-dictionary 2.8M/wk, Terrazzo 234k/wk; free once #1 lands | S | 3 |
| 9 | **Grid theming from tokens**: AG Grid `themeQuartz.withParams({accentColor:'var(--color-primary)'…})`, MUI X via existing `--format mui`, TanStack Table detection in recipes | ag-grid 5.5M/wk, @mui/x-data-grid 4.2M/wk, @tanstack/react-table 36M/wk | S | 3 |
| 10 | **Form-lib detection + recipe adapters**: RHF, TanStack Form, Conform, VeeValidate, Superforms (+ Zod/Valibot/ArkType via Standard Schema) | RHF 63M/wk, zod 457M/wk, @tanstack/react-form 7.2M/wk | S–M | 3 |
| — | Figma Variables REST API direct pull | Enterprise plan + Full seat only | M | 4 |
| — | Supernova | SaaS; SDK 17k/wk | — | 5 |
| — | Specify | **Shutting down 2025-11-15** per its own blog | — | skip |
| — | GEMINI.md target | Gemini CLI replaced by Antigravity CLI (2026-06-18), which reads AGENTS.md | S | 5 |

#### DTCG compliance verdict for `skills/finally-good-ui/tokens/default.tokens.json`

**Not DTCG 2025.10 compliant. It is a "DTCG-shaped subset."** Checked against Format 2025.10 + Color 2025.10 (both 2025-10-28, "Candidate Recommendation… considered stable": https://www.designtokens.org/tr/2025.10/format/, https://www.designtokens.org/tr/2025.10/color/).

| Rule | Our file | Verdict |
|---|---|---|
| Colour `$value` = object `{colorSpace, components[], alpha?, hex?}`; `oklch` is a listed colorSpace (Color §4.1–4.2) | 19 tokens use CSS strings `"oklch(0.5 0.14 262)"` | **Fail** |
| Shadow `$value` = object or array of objects `{color, offsetX, offsetY, blur, spread, inset?}` (Format §shadow) | 3 tokens use CSS strings | **Fail** |
| Dimension `{value, unit}`, unit "may only be" `px` or `rem` (Format §dimension) | `tracking.caps` uses `unit: "em"` (11 em occurrences; 10 sit inside `$extensions`, which is allowed) | **Fail** (1 token) |
| Duration `{value, unit: "ms"\|"s"}` | ms objects | Pass |
| cubicBezier 4-number array | yes | Pass |
| fontFamily string or array of strings | arrays | Pass |
| `$extensions` keys: vendor-specific, "reverse domain name notation is recommended" | `"fgu"` | Pass (SHOULD not met) |
| Modes/themes | dark values in `$extensions.fgu.dark` | Non-standard. The standard path is the Resolver module 2025.10 (`sets` + `modifiers.theme.contexts.{light,dark}`, `*.resolver.json`): https://www.designtokens.org/tr/2025.10/resolver/ |
| Line-height/letter-spacing | in `$extensions.fgu` on dimension tokens | Allowed. A spec-native alternative is a `typography` composite (lineHeight = number multiplier) |
| Alias references `{group.token}` | not used; **`lib/tokens.mjs` cannot resolve them**, and `cssValue("color", {colorSpace…})` returns `"[object Object]"` (ran it) | Importing any real DTCG file would break emit |

---

### 1. Design-token standards and tooling

#### 1.1 W3C DTCG format (Design Tokens Community Group)
- **Status/version**: Format Module 2025.10, Color Module 2025.10, Resolver Module 2025.10, all dated 28 Oct 2025, "published as a Candidate Recommendation… considered stable"; a Community Group report, not a W3C Standard. https://www.designtokens.org/tr/2025.10/format/ · https://www.designtokens.org/tr/2025.10/color/ · https://www.designtokens.org/tr/2025.10/resolver/
- **Repo**: design-tokens/community-group, 2,174★ (licence NOASSERTION). https://github.com/design-tokens/community-group
- **`$type` list** (Format 2025.10): color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, plus composites strokeStyle, border, transition, shadow, gradient, typography. Font style, percentage and file are "still to be documented" (§8.8, non-normative).
- **Value-shape changes that matter to us**:
  - color → object: `{"colorSpace":"oklch","components":[0.5,0.14,262],"alpha":1,"hex":"#3b5bdb"}`; components may be `"none"`; 14 colour spaces, including srgb, hsl, oklch, oklab, display-p3. (Color §4.1–4.2)
  - dimension → `{"value":16,"unit":"px"}` with unit px|rem only, and the unit is required even for 0.
  - duration → `{"value":250,"unit":"ms"}` (ms|s).
  - typography.lineHeight is a number multiplier (issue 102 still open).
  - Resolver example (verbatim shape):
    ```json
    {"$schema":"https://www.designtokens.org/schemas/2025.10/resolver.json","version":"2025.10",
     "sets":{"base":{"sources":[{"$ref":"base.json"}]}},
     "modifiers":{"theme":{"contexts":{"light":[{"$ref":"themes/light.json"}],"dark":[{"$ref":"themes/dark.json"}]},"default":"light"}},
     "resolutionOrder":[{"$ref":"#/sets/base"},{"$ref":"#/modifiers/theme"}]}
    ```
- **Integration**: (a) migrate `default.tokens.json` + `extract-tokens.mjs` output to colour objects (with `hex` fallback, which we can already compute via `lib/contrast.mjs toHex`), shadow objects and rem tracking (or move tracking into `$extensions`). (b) teach `lib/tokens.mjs` to accept both string and object colours and to resolve `{a.b}` aliases. (c) write dark as `themes/dark.json` + `design.resolver.json`, keeping `$extensions` dark as a read-compat fallback. (d) rename the extension key to reverse-domain, e.g. `io.github.<owner>.fgu` (the exact key is ours to choose). **Effort M, Priority 1.**

#### 1.2 Style Dictionary
- Apache-2.0; v5.8.0 (2026-11-03); 2,839,106 dl/wk; 4,883★. https://registry.npmjs.org/style-dictionary · https://github.com/style-dictionary/style-dictionary
- DTCG: "first-class support for the DTCG format" since v4, but "the latest format 2025.10 does not have full support yet… a work in progress in v5." It ships a v3→DTCG converter that renames keys but "does not refactor type values." https://styledictionary.com/info/dtcg/
- v5 breaking changes: references must target tokens, not groups; reference syntax is fixed to the DTCG braces; Node ≥ 22. https://styledictionary.com/versions/v5/migration/
- Detection: `style-dictionary` dep; `config.json|sd.config.(js|mjs|ts)`, `tokens/**/*.json`.
- Where tokens enter: source globs in the SD config (`source: ["tokens/**/*.json"]`).
- **Integration**: "export to Style Dictionary" = write our DTCG file to `tokens/` and a minimal `sd.config.mjs` with css/js platforms. Caveat: SD may not parse 2025.10 colour objects yet, so also offer `--dtcg-compat=sd` that writes `hex`-string colours. When SD is detected, `detect-stack` should flag `tokensPipeline: "style-dictionary"` so build edits the source tokens rather than the generated CSS. **Effort S, Priority 3.**

#### 1.3 Terrazzo (formerly Cobalt UI)
- MIT; @terrazzo/cli 2.10.0 (2026-10-21), 233,927 dl/wk (@terrazzo/parser 256k); 491★. The old @cobalt-ui/cli gets 383 dl/wk (last release 2024-11). https://registry.npmjs.org/@terrazzo/cli · https://github.com/terrazzoapp/terrazzo
- Claims to be "the only tool that supports the full DTCG format." Config is `terrazzo.config.ts` (`npx tz init`). Plugins: CSS, Sass, JS/TS, CSS-in-JS, Swift, Tailwind, Vanilla Extract. https://terrazzo.app/docs/
- Figma import via the REST API: `npx tz import <figma-url> --output my-ds.resolver.json`, using `FIGMA_ACCESS_TOKEN`; "Variables require an Enterprise plan." https://terrazzo.app/docs/guides/import-from-figma/
- The Cobalt UI → Terrazzo rename is not stated on the fetched page (UNVERIFIED there). The npm data (Cobalt dormant, same author org) is consistent with it.
- Detection: `@terrazzo/cli`, `terrazzo.config.*`, `*.resolver.json`.
- **Integration**: best "export" target, because it is resolver-aware: write `design.resolver.json` + `terrazzo.config.ts` (plugin-css + plugin-tailwind). Also accept a `*.resolver.json` as `--in` for emit (import). **Effort S after #1, Priority 2–3.**

#### 1.4 Tokens Studio for Figma
- MIT plugin repo, 1,630★; @tokens-studio/sd-transforms 2.0.3 (2025-12-10), 271,775 dl/wk. https://github.com/tokens-studio/figma-plugin · https://registry.npmjs.org/@tokens-studio/sd-transforms
- Two storage formats: "Legacy" and "W3C DTCG" (`$value/$type/$description`), selectable per local file or sync provider; Git branches can differ. https://docs.tokens-studio.com/manage-settings/token-format
- `$themes.json` / `$metadata.json` multi-file layout: UNVERIFIED (not on the fetched page).
- Detection: `@tokens-studio/sd-transforms` dep; `tokens/$themes.json`, `tokens/$metadata.json`; JSON with `value/type` (legacy) or `$value/$type`.
- **Integration**: the importer accepts both legacy (`value`, `type: "color"|"spacing"|"borderRadius"…`) and DTCG modes and maps Tokens Studio types to ours; theme files map to the resolver. **Effort M (legacy type map), Priority 2.**

#### 1.5 Figma Variables (native + REST)
- **Native JSON import/export** (help centre): import requires DTCG JSON, "Each imported file becomes a separate mode"; export via "Export mode"/"Export modes"; plans Professional, Education, Organization, Government, Enterprise. Type constraints on import: Color = **HSL and sRGB only**; Dimension = **px only**; fontFamily = **single name, arrays not supported**; Duration = **seconds only**; Number → Boolean via `$extensions` `com.figma.type: "boolean"`; String accepted. https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables
- **REST API**: GET local, GET published and POST variables need an **Enterprise plan**; GET needs scope `file_variables:read`, POST needs `file_variables:write` and a Full seat. https://developers.figma.com/docs/rest-api/variables/ . Types: `resolvedType` ∈ BOOLEAN | FLOAT | STRING | COLOR; `valuesByMode`; `VariableAlias {type:"VARIABLE_ALIAS", id}`; collections carry `modes` + `defaultModeId`; `codeSyntax` per WEB/ANDROID/iOS; `scopes` (e.g. FONT_SIZE, CORNER_RADIUS, TEXT_FILL). https://developers.figma.com/docs/rest-api/variables-types/ . Spec repo figma/rest-api-spec, 221★.
- **Integration**:
  - "Import from Figma" (recommended path) = the user exports modes to JSON in Figma (Pro+), then `import-tokens.mjs --in light.json --mode-file dark.json`, merged into our tokens + resolver.
  - "Export to Figma" = `emit-tokens --format figma`, one file per mode, with colours converted oklch→srgb (keep the OKLCH original in `$extensions`), durations ms→s, fontFamily array→first name, rem→px.
  - Direct REST pull: optional, Enterprise-only, P4.
  - **Effort M, Priority 2.**

#### 1.6 Specify
- @specifyapp/cli 1.2.0 (2023-12-07), 1,735 dl/wk, UNLICENSED. https://registry.npmjs.org/@specifyapp/cli
- The site banner links "Saying Goodbye: The End of Specify"; the post gives the sunset date as Nov 15th. https://specifyapp.com/ · https://specifyapp.com/blog/the-end-of-specify (date via search snippet; the year is inferred as 2025 from the 2023 last CLI release. UNVERIFIED).
- **Skip.**

#### 1.7 Supernova
- @supernovaio/sdk 2.6.0 (2026-11-11), MIT, 17,123 dl/wk. https://registry.npmjs.org/@supernovaio/sdk
- Feature/DTCG details: UNVERIFIED (the docs page returned no content).
- SaaS-gated, low dev reach. **Priority 5.**

---

### 2. Charts / data-viz

**The key split**: SVG/DOM renderers accept `var(--token)` strings directly, so emitting CSS vars is enough. Canvas renderers (ECharts, Chart.js, AG Charts, uPlot, Nivo canvas variants) need *resolved* values, so we must ship a small runtime that reads `getComputedStyle` and re-themes on dark-mode change. Our `--format js` already does this for motion (`ms()/ease()` read live vars). Extend it with `chartPalette()`, `color(name)` and `font(name)`.

New token group (all charts): `chart.1..8` (categorical, CVD-checked), plus optional `chart.seq-*`/`chart.div-*`, `chart.grid`, `chart.axis`. Emit as `--chart-1..N` to match shadcn. Canon: extend `data.md` with a palette card (≤ 6–8 hues, ordered, distinguishable under CVD, light/dark designed separately).

| Library | Licence · latest (date) | dl/wk | ★ | Renderer | Where tokens enter |
|---|---|---|---|---|---|
| Recharts | MIT · 3.10.1 (2026-07-25) | 65,732,825 | 27,712 | SVG | Props such as `fill`/`stroke` take any CSS colour string, incl. `var()` (shadcn uses `fill="var(--color-desktop)"`) |
| shadcn/ui chart | MIT (repo) | n/a (copy-in) | 128,174 | Recharts v3 | `--chart-1..` in `globals.css` `:root` / `.dark`; `ChartConfig` `color: "var(--chart-1)"` or `theme: {light, dark}`; used as `var(--color-KEY)` |
| Tremor | Apache-2.0 · @tremor/react 3.18.7 (2025-01-13) | 532,874 | 3,701 | Recharts | Now copy-paste ("Copy and paste the code"); colours = names in `chartColors` in `chartUtils.ts` → Tailwind classes via `getColorClassName` |
| visx | MIT · @visx/visx 4.0.0 (2026-06-11) | 146,911 | 21,109 | SVG | `buildChartTheme({backgroundColor, colors: string[], gridColor, gridColorDark, svgLabelSmall…, tickLength})` |
| Nivo | MIT · @nivo/core 0.99.0 (2025-05-23) | 1,980,757 | 14,139 | SVG/HTML/Canvas | `theme` object (partial, merged with default); sizes are unitless; CSS-var support not documented (UNVERIFIED; fails on canvas) |
| ECharts | Apache-2.0 · 6.1.0 (2026-05-19) | 10,595,233 | 67,722 | Canvas/SVG | `echarts.registerTheme(name, obj)` + `init(dom, name)`; v6: theme rebuilt on internal design tokens, dynamic `chart.setTheme(...)` for dark mode |
| vue-echarts | MIT · 8.3.2 (2026-10-09) | 754,900 | 10,747 | (ECharts) | `theme` prop (same theme objects) — UNVERIFIED prop name |
| echarts-for-react | MIT · 3.0.6 (2026-01-21) | 2,119,798 | — | (ECharts) | `theme` prop — UNVERIFIED |
| Chart.js | MIT · 4.6.1 (2026-10-22) | 16,426,124 | 67,793 | Canvas | `Chart.defaults.color / borderColor / backgroundColor`; formats: hex/rgb/hsl/CanvasPattern/Gradient (no `var()` documented) |
| react-chartjs-2 | MIT · 5.3.1 | 5,697,677 | — | (Chart.js) | same |
| Observable Plot | ISC · 0.6.19 (2026-11-05) | 1,473,021 | 5,427 | SVG | `style` option (string/object); marks and axes default to `currentColor`; `className` for the stylesheet; system-ui font by default |
| D3 | ISC · 7.9.2 (2026-11-03) | 33,088,267 | 113,918 | SVG/Canvas | Whatever you set; `var()` works on SVG attrs/styles |
| AG Charts | MIT (community) · 14.3.0 (2026-11-04) | 2,527,630 (community); react: rate-limited | 490 | Canvas | `theme: {baseTheme:'ag-default', palette:{fills, strokes}, params:{fontFamily, foregroundColor, backgroundColor, accentColor}, overrides}`; built-in `'ag-default-dark'`; colour refs can blend `ontoColor: 'var(--brand)'` |
| uPlot | MIT · 1.6.32 (2025-03-14) | 1,018,431 | 10,639 | Canvas | Series `stroke/fill/width/dash` "map directly to Canvas API" `strokeStyle/fillStyle` (resolved values needed) |
| Victory | MIT · 38.1.0 (2026-11-12) | 753,153 | 11,247 | SVG | `theme` prop; `VictoryTheme.clean/material/grayscale`; custom theme object keyed by element; palette arrays |
| Unovis | Apache-2.0 · @unovis/ts 1.8.1 (2026-11-10) | 372,107 | 2,870 | SVG/Canvas | CSS vars: `--vis-color0..`, `--vis-dark-color0..`, `--vis-font-family`; dark via `theme-dark` class on html/body |
| LayerChart (Svelte) | MIT · 2.10.1 (2026-11-12) | 436,939 | 1,371 | SVG/Canvas | 2.0: default styles overridable via `@layer`, `:where(.lc-*)` and CSS variables; Tailwind 4 optional; literal CSS colours pass through (release notes) |

Sources:
- Recharts / shadcn: https://ui.shadcn.com/docs/components/chart
- Tremor: https://www.tremor.so/docs/visualizations/area-chart
- visx: https://github.com/airbnb/visx/blob/master/packages/visx-xychart/src/theme/buildChartTheme.ts
- Nivo: https://nivo.rocks/guides/theming/
- ECharts: https://echarts.apache.org/handbook/en/concepts/style/ · https://echarts.apache.org/handbook/en/basics/release-note/v6-feature/
- Chart.js: https://www.chartjs.org/docs/latest/general/colors.html
- Plot: https://github.com/observablehq/plot/blob/main/docs/features/plots.md
- AG Charts: https://www.ag-grid.com/charts/javascript/themes/
- uPlot: https://github.com/leeoniya/uPlot/blob/master/docs/README.md
- Victory: https://nearform.com/open-source/victory/docs/api/victory-theme
- Unovis: https://unovis.dev/docs/guides/theming
- LayerChart: https://www.layerchart.com/docs/releases/layerchart-2.0.0
- npm/★: see the method note at the top.

**Detection signals**: deps `recharts`, `@tremor/react`, `@visx/*`, `@nivo/*`, `echarts`, `echarts-for-react`, `vue-echarts`, `chart.js`, `react-chartjs-2`, `vue-chartjs`, `@observablehq/plot`, `d3`, `ag-charts-*`, `uplot`, `victory`, `@unovis/*`, `layerchart`. shadcn chart = `components.json` + `components/ui/chart.tsx`. Tremor Raw = `lib/chartUtils.ts`.

**Integration**:
- (#2) Add `charts: [...]` to `detect-stack`; add a `chart` token group; emit `--chart-N` in css/tailwind4 (Tailwind 4 also exposes them as utilities). Add a recipe `recipes/patterns/chart.md` with per-library snippets (Recharts/shadcn, Unovis, LayerChart, Plot, visx). Add `check-static` probes for chart colours that are hard-coded hex. **S–M, P1.**
- (#7) `--format js` gains `chartTheme(lib)` that returns an ECharts theme, Chart.js defaults, an AG Charts theme or a Nivo theme from resolved vars, plus `onThemeChange(cb)` (matchMedia + class observer) to call `setTheme`/`update`. **M, P2.**

---

### 3. Icons

| Set | Pkg (latest, date) | dl/wk | ★ | Sizing/stroke API (where tokens enter) |
|---|---|---|---|---|
| Lucide | lucide-react 1.73.0 (2026-11-14), ISC | 133,985,812 (+ lucide 2.5M, lucide-vue-next 1.56M, @lucide/svelte 1.47M) | 25,757 | Props `size`, `strokeWidth`, `absoluteStrokeWidth`, `nonScalingStroke`; context defaults `size=24`, `strokeWidth=2` (source). Global: `<LucideProvider color size strokeWidth>` or CSS `.lucide{width;height;stroke-width}` |
| Tabler | @tabler/icons-react 3.52.0 (2026-11-14), MIT | 5,306,724 (@tabler/icons 6.1M) | 22,658 | `size` (24), `color` (currentColor), `stroke` (2) |
| Heroicons | @heroicons/react 2.2.0 (2024-11-18), MIT | 6,292,818 | 23,910 | Fixed sets: 24 outline, 24 solid, 20 solid, 16 solid (`@heroicons/react/24/outline`…); size via class |
| Phosphor | @phosphor-icons/react 2.1.10 (2025-05-22), MIT | 7,673,614 | 7,809 (homepage repo) | `size`, `color`, `weight` thin\|light\|regular\|bold\|fill\|duotone, `mirrored`; `IconContext.Provider`; `/ssr` import ignores context |
| Radix Icons | @radix-ui/react-icons 1.3.2 (2024-11-14), MIT | 7,783,123 | 2,708 | 15×15 grid ("A crisp set of 15×15 icons") |
| Iconify | @iconify/react 6.0.4 (2026-11-01) 1.58M; @iconify/vue 1.73M; @iconify/tailwind4 1.2.3 (dl rate-limited) | — | 6,402 | Web component/components, 300k+ icons; Tailwind 4 plugin; inline SVG `width="1em" height="1em"` → scales with font-size |
| unplugin-icons | 24.0.0 (2026-09-11), MIT | 977,441 | 4,962 | On-demand components from Iconify sets; style via `font-size`/`color` |
| Material Symbols | material-symbols 0.49.0 (2026-11-12), Apache-2.0 | 676,176 (+ @material-symbols/svg-400 287k) | google/material-design-icons 54,298 | Variable font axes FILL 0..1, wght 100..700, GRAD -50..200, opsz 20..48 |
| Remix Icon | @remixicon/react 4.9.0 (2026-01-29), "Remix Icon License 1.0" (remixicon pkg Apache-2.0) | 1,436,088 (+ remixicon 217,896) | 8,459 | `size`, `color` (fill); Line/Fill variants (`RiHeartFill`); 24 grid |
| Hugeicons | @hugeicons/react 1.1.10 (2026-08-21) + @hugeicons/core-free-icons 4.4.0, MIT | 1,903,872 / 1,883,799 | hugeicons/hugeicons 1,231 | `<HugeiconsIcon icon size color strokeWidth(1.5) absoluteStrokeWidth primaryColor secondaryColor>`; free = Stroke Rounded 6k+; Pro 10 styles |
| Solar | @solar-icons/react 2.6.0 (2026-11-13), MIT (community port) | 76,867 | 480-Design/Solar-Icon-Set 391; saoudi-h/solar-icons 288 | 6 styles (Bold, Broken, Linear, Outline, BoldDuotone, LineDuotone) via import path; `<SolarProvider size color strokeWidth>` |
| react-icons | 5.7.0 (2026-06-30), MIT | 11,448,063 | 12,700 | Aggregator; `IconContext.Provider` — UNVERIFIED this session |

Sources:
- Lucide: https://lucide.dev/guide/react/advanced/global-styling · https://github.com/lucide-icons/lucide/blob/main/packages/lucide-react/src/Icon.ts
- Tabler: https://github.com/tabler/tabler-icons/tree/main/packages/icons-react
- Heroicons: https://github.com/tailwindlabs/heroicons
- Phosphor: https://github.com/phosphor-icons/react
- Radix Icons: https://github.com/radix-ui/icons
- Iconify: https://iconify.design/docs/usage/
- unplugin-icons, Hugeicons, Solar, Remix: their npm READMEs (`registry.npmjs.org/<pkg>`)
- Material Symbols: https://developers.google.com/fonts/docs/material_symbols

**Gaps in `detect-stack.mjs`**:
- It returns a single icon string, with lucide winning first.
- Missing: Radix Icons, Iconify (`@iconify/*`, `@iconify-json/*`), unplugin-icons (`~icons/` imports), Material Symbols (`material-symbols`, `@material-symbols/*`, `@material-design-icons/*`), Remix (`@remixicon/*`, `remixicon`), Hugeicons (`@hugeicons/*`, `hugeicons-react`), Solar (`@solar-icons/*`, `@iconify-json/solar`), and Phosphor Vue (covered by prefix).
- Change to `icons: {lib, variantApi: "stroke"|"weight"|"fixed-grid"|"font-axes"}`.

**Tie to type scale (proposal)**:
- Add tokens `icon.size.sm|md|lg` = the line-height of `text.sm|base|lg` (e.g. 14×1.5 → 20 px (21 rounded down), 16×1.5 → 24 px). This aligns icons with text boxes.
- Add `icon.stroke` (1.5 or 2 by personality), with `absoluteStrokeWidth`/`nonScalingStroke` on for sizes < 20 so small icons don't get hairline strokes.
- Emit by library:
  - Lucide: CSS on `.lucide`, or a `LucideProvider` snippet.
  - Phosphor: IconContext `weight` mapped from the brand (light ↔ stroke 1.5, regular ↔ 2).
  - Tabler: `stroke`.
  - Hugeicons/Solar: `strokeWidth`.
  - Heroicons/Radix: choose a grid (24/20/16, or 15) per size step instead of a stroke.
  - Material Symbols: `font-variation-settings: 'wght' <text weight>, 'opsz' <px size clamped 20..48>, 'GRAD' -25 in dark` (the GRAD-in-dark tweak is UNVERIFIED as official guidance).
- **Effort S, Priority 2.**

---

### 4. Fonts

| Tool | Facts | Where tokens enter |
|---|---|---|
| **Fontsource** | @fontsource/inter 5.3.0 (2026-07-19), OFL-1.1, 7,150,950 dl/wk; @fontsource-variable/inter 11,539,627 dl/wk; repo 6,283★ | `npm i @fontsource-variable/inter` + `import "@fontsource-variable/inter"`. Axis files `/wght.css`, `/opsz.css`, `/full.css`, but "multiple imports of different axes are not supported". Family name pattern `"<Name> Variable"` (shown for Nunito Sans; Inter by analogy, UNVERIFIED) https://fontsource.org/docs/getting-started/variable |
| **next/font** | Built into next 16.4.6 (2026-11-09), 92,890,722 dl/wk, 143,513★; docs lastUpdated 2026-09-24 | `Inter({subsets:['latin'], display:'swap', variable:'--font-inter'})` on `<html className={inter.variable}>`, then `@theme inline { --font-sans: var(--font-inter); }`. "We recommend using variable fonts"; for variable fonts weight isn't needed; `axes: ['slnt']`; `adjustFontFallback` default true (google) / 'Arial' (local); self-hosted at build, "No requests are sent to Google by the browser." https://nextjs.org/docs/app/api-reference/components/font |
| **@nuxt/fonts** | 1.2.0 (2026-10-25), MIT, 1,359,684 dl/wk, 612★ | Zero-config: reads `font-family` in your CSS; providers `local, google, googleicons, bunny, fontshare, fontsource, npm, adobe`; generates fallback metrics; default weights `400 700`; downloads at build. https://nuxt.com/modules/fonts |
| unplugin-fonts | 2.1.0 (2026-10-24), MIT, 214,733 dl/wk | Vite/other bundlers (secondary) |
| Google Fonts variable | Material Symbols example of the CSS2 axis syntax `family=…:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200` https://developers.google.com/fonts/docs/material_symbols | |

**How the plugin should wire the chosen typeface** (by framework from `detect-stack`):
- Next → generate `app/fonts.ts` with `next/font/google` or `next/font/local` + `variable: '--font-sans'`, and make `emit-tokens` write `--font-sans: var(--font-sans-loaded), <fallback stack>`. Note that the loader variable name must differ from the token var, otherwise it is circular.
- Nuxt → just emit the CSS `font-family`; @nuxt/fonts resolves it. Add the module if absent.
- Vite/SvelteKit/Astro/Vue → `@fontsource-variable/<slug>` import in the entry file + family `"<Name> Variable"`.
- Plain HTML → `<link>` to Google Fonts CSS2 with `display=swap` and the exact axis ranges used.
- In every case, `font.*` tokens keep the system fallback list. Add a `$extensions` `{source:"google"|"fontsource"|"local", axes:[…], weights:"100 900"}` so emit knows how to load the font.
- Detection: deps `next` (next/font is in core, so also grep `from 'next/font`), `@nuxt/fonts`, `@fontsource/*`, `@fontsource-variable/*`, `unplugin-fonts`, `fonts.googleapis.com` in html/css.
- **Effort S–M, Priority 1** (fonts are the most visible "not generic" lever; the token emit currently outputs only system stacks).

---

### 5. Forms, validation, tables

| Lib | Licence · latest (date) | dl/wk | ★ | Notes / where tokens or recipes enter |
|---|---|---|---|---|
| React Hook Form | MIT · 7.92.0 (2026-11-11) | 63,064,521 (+ @hookform/resolvers 50.4M) | 44,920 | Recipe already names `mode:"onTouched"`; add a resolver snippet |
| TanStack Form | MIT · @tanstack/form-core 1.33.5; @tanstack/react-form 7,197,981 | 7.2M | 6,768 | Adapters React, Vue, Angular, Solid, Svelte, Lit; "natively supports all libraries following the Standard Schema specification" (Zod, Valibot, ArkType, Effect): `validators:{onChange: userSchema}` https://tanstack.com/form/latest/docs/framework/react/guides/validation |
| Conform | MIT · @conform-to/react 1.21.3 (2026-10-31) | 436,305 | 2,588 | Progressive enhancement, server actions (Remix, Next, React Router); `parseWithZod/Valibot/Yup`; "Built-in accessibility helpers" https://conform.guide/ |
| Formik | Apache-2.0 · 2.4.9 (2025-11-10) | 5,951,488 | 34,299 | Still published; README has no maintenance statement (status UNVERIFIED); ~1 release/yr. Detect, but don't recommend |
| Zod | MIT · 4.6.7 (2026-10-12) | 456,795,275 | 44,324 | Standard Schema |
| Valibot | MIT · 1.5.0 (2026-09-09) | 32,673,793 | 9,069 (open-circle/valibot) | Standard Schema |
| ArkType | MIT · 2.2.9 (2026-10-20) | 3,073,260 | 7,894 | Standard Schema |
| @standard-schema/spec | MIT · 1.1.0 | 197,959,910 | 3,672 | https://standardschema.dev/ (the site doesn't list implementers; the TanStack page above does) |
| VeeValidate | MIT · 4.15.1 (2025-06-07) | 1,482,410 | 11,260 | Vue |
| sveltekit-superforms | MIT · 3.1.0 (2026-10-29) | 411,385 | 2,784 | SvelteKit |
| TanStack Table | MIT · @tanstack/react-table 9.3.1 (2026-10-12) | 36,103,158 | 28,573 | Headless (recipe already recommends); v9 is now latest |
| AG Grid | MIT (community) · 36.3.0 (2026-11-04) | 5,478,699 (ag-grid-react 4.1M) | 15,688 | `themeQuartz.withParams({accentColor:'var(--color-primary)', spacing:12})`; params are CSS vars `--ag-*`; colour params accept `var(--myColorVar)` https://www.ag-grid.com/react-data-grid/theming-parameters/ |
| MUI X DataGrid | MIT · 9.18.0 (2026-11-13) | 4,243,869 | 5,879 | Uses MUI `createTheme` (`theme.palette.background.default` etc.) + `@mui/x-data-grid/themeAugmentation` https://github.com/mui/mui-x/blob/master/docs/data/data-grid/style/style.md |

**Integration**:
- `detect-stack` gains `forms: {lib, schema}` and `tables: lib`.
- `form-validation.md` gets per-lib adapter blocks (RHF+resolver, TanStack Form `validators`, Conform `getInputProps`, VeeValidate, Superforms) that all render the same ARIA markup.
- `data-table.md` gets an AG Grid block, generated by a new `emit-tokens --format ag-grid` → `themeQuartz.withParams({accentColor:'var(--color-primary)', backgroundColor:'var(--color-background)', foregroundColor:'var(--color-foreground)', borderColor:'var(--color-border)', fontFamily:'var(--font-sans)', spacing:<space.2>, borderRadius:<radius.md>})`. Param names beyond accentColor/spacing are UNVERIFIED, so check the theming-api reference.
- MUI X is covered by `--format mui`.
- **Forms S–M, P3; Tables S, P3.**

---

### 6. Agent rule targets for `export`

| Tool | Official files today | Source |
|---|---|---|
| Cursor | `.cursor/rules/**/*.mdc` ("Project rules must use the `.mdc` extension"; `.md` there is ignored). Frontmatter `description`, `globs`, `alwaysApply`; types Always Apply / Apply Intelligently / Apply to Specific Files / Apply Manually; keep < 500 lines. Also root + nested `AGENTS.md` | https://cursor.com/docs/context/rules |
| Windsurf → **Devin Desktop** (Cognition) | Preferred `.devin/rules/*.md` + `.devin/global_rules.md`. Legacy `.windsurf/rules/*.md`, `.windsurf/global_rules.md`, `.windsurfrules` still imported. Frontmatter `trigger: always_on\|model_decision\|glob\|manual` (+ `agent`) with `globs`, `description`. **Also reads `.cursor/rules/*.mdc` and `AGENTS.md`/`AGENT.md`/`CLAUDE.md`**. No char limit documented (our 12,000-char Windsurf cap is now UNVERIFIED) | https://docs.devin.ai/desktop/cascade/memories · https://docs.devin.ai/cli/extensibility/rules.md |
| GitHub Copilot | `.github/copilot-instructions.md`; `.github/instructions/**/NAME.instructions.md` with `applyTo: "**/*.ts,**/*.tsx"` and optional `excludeAgent: "code-review"\|"cloud-agent"`; nearest `AGENTS.md`, or root `CLAUDE.md`/`GEMINI.md` | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions |
| Cline | `.clinerules/` or `.cline/rules/` (md); conditional frontmatter `paths: [globs]`; also reads `.cursorrules`, `.windsurfrules`, `AGENTS.md`; global `~/Documents/Cline/Rules` | https://docs.cline.bot/features/cline-rules |
| Zed | **First match only**, in order: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | https://zed.dev/docs/ai/instructions |
| Gemini CLI → **Antigravity CLI** | `GEMINI.md` (global `~/.gemini/GEMINI.md`, workspace + parents, JIT subdirs; `@file.md` imports; `context.fileName` can add AGENTS.md). The Gemini CLI page says it "was replaced by Antigravity CLI on June 18, 2026". Antigravity enforces `GEMINI.md` **and** `AGENTS.md`; project skills moved `.gemini/skills/` → `.agents/skills/` | https://geminicli.com/docs/cli/gemini-md/ · https://antigravity.google/docs/cli/gcli-migration/ |
| Codex | `AGENTS.override.md` > `AGENTS.md` per directory, concatenated root→cwd; global `~/.codex/AGENTS.md`; cap `project_doc_max_bytes` = 32 KiB; `project_doc_fallback_filenames` | https://learn.chatgpt.com/docs/agent-configuration/agents-md |
| AGENTS.md standard | "stewarded by the Agentic AI Foundation under the Linux Foundation"; lists Codex, Jules, Factory, Aider, goose, opencode, Zed, Warp, VS Code, Devin, Junie, Amp, Cursor, RooCode, Gemini CLI, Kilo Code, Copilot coding agent, Windsurf, Augment and others; nearest file wins. agentsmd/agents.md 25,490★ | https://agents.md/ |
| Kiro | `.kiro/steering/*.md`, frontmatter `inclusion: always\|fileMatch\|manual\|auto` (+ `fileMatchPattern`, `name`/`description` for auto); global `~/.kiro/steering/`; `AGENTS.md` supported and always included | https://kiro.dev/docs/steering/ |
| Junie | Order: `.junie/AGENTS.md` (used exclusively if present) → root `AGENTS.md` + `.junie/playbook.md` + `.junie/rules/*.md` → legacy `.junie/guidelines.md`/`guidelines/`; global `~/.junie/AGENTS.md` | https://junie.jetbrains.com/docs/guidelines-and-memory.html |
| Amp | `AGENTS.md` in cwd/workspace roots + parents up to $HOME, subtree files lazily; falls back to `AGENT.md` or `CLAUDE.md`; personal `~/.config/amp/AGENTS.md`; `globs` frontmatter on @-mentioned files | https://ampcode.com/docs/customize/agents-md |

**Assessment of the current `export-rules.mjs`**:
- Cursor `.mdc` + frontmatter: correct.
- Copilot `.github/instructions/*.instructions.md` + `applyTo`: correct.
- AGENTS.md section with markers: correct, and it is the hub that covers Codex, Amp, Zed, Junie (when there is no `.junie/AGENTS.md`), Kiro, Cline, Devin, Antigravity and Copilot agent.
- Windsurf: still works via the legacy import. **Duplicate-load risk**: Devin reads `.cursor/rules/*.mdc` *and* `.windsurf/rules/*.md` *and* `AGENTS.md`, so it could load our canon three times. Copilot reads both `.instructions.md` and AGENTS.md. Cline reads AGENTS.md and `.clinerules`.
- Zed: uses AGENTS.md only if no `.rules`/`.cursorrules`/`.windsurfrules`/`.clinerules`/`.github/copilot-instructions.md` exists.

**Recommendations (#5)**:
- Add `--targets cursor,copilot,agents,kiro,cline,devin` with defaults detected from existing dirs.
- Make AGENTS.md the full body. Make the scoped files (Cursor `.mdc`, Copilot `.instructions.md`, Kiro `inclusion: fileMatch`, Cline `paths:`) short pointers plus glob-scoped checklists, so a double load costs little.
- Write `.devin/rules/` instead of `.windsurf/rules/` when `.devin/` exists.
- Re-verify the 12k cap or drop it.
- Skip GEMINI.md (Antigravity reads AGENTS.md).
- Mention Junie's exclusivity: if `.junie/AGENTS.md` exists, add the section there.
- **Effort S, Priority 2.**

---

# Part 4

## Research 4: native/cross-platform targets + competitor landscape

Fetched 2026-11-14 (UTC). Sources: npm downloads API (window 2026-11-07..13), GitHub REST API (`gh api repos/<o>/<r>`), pub.dev score API, official docs, and READMEs fetched via `gh api repos/<o>/<r>/readme`.
npm's API rate-limited part of the run (Cloudflare 1015), so a few packages have no number and are marked "n/a".
`gh api repos/Stav-Sananes/finally-good-ui` returned 404 (private or unpublished), so our own star count is UNVERIFIED.

Baseline (from repo): finally-good-ui emits `css | tailwind4 | tailwind3 | mui | json | js` (`skills/finally-good-ui/scripts/emit-tokens.mjs --help`). `detect-stack.mjs` knows only web frameworks (next/nuxt/sveltekit/astro/angular/solid/vue/svelte/react). Verification runs through Playwright in a browser.

---

### TL;DR

1. **React Native / Expo is worth adding, and cheaply.** The leading RN styling layers now read Tailwind v4 / CSS variables (Uniwind; NativeWind v5 RC; gluestack v5; react-native-reusables), so the existing `tailwind4`/`css` emitters cover about 80% of what is needed. Expo web (react-native-web) lets the current Playwright verify run as an *approximation*. Native-fidelity checks can go through `agent-device` (CLI + MCP) or the Expo MCP's local automation tools.
2. **Flutter / SwiftUI / Compose: emit only, at first.** The token emitters are small (Dart `ThemeData` + `ThemeExtension`; `.colorset` JSON; Kotlin `Color.kt`/`Theme.kt`). The build-and-verify loop is heavy (Xcode, Gradle, golden tests) and the official vendor plugins (Xcode, Flutter, Expo, Android skills) already own it.
3. **Tauri/Electron are web.** Detect them and treat them as web, plus desktop canon (window chrome, menus, keyboard). Low cost.
4. **Material Color Utilities is useful as an optional tonal-ramp and contrast generator** (HCT tone = guaranteed contrast steps). Don't adopt Material scheme *roles*, which import the "Material look".
5. **The stars go to visual proof plus a crisp anti-slop promise plus one-line multi-agent install**, not to stack breadth. The 4 design skills with more than 100k stars all lead with before/after images or a gallery, and all install into Cursor/Codex as well as Claude Code. finally-good-ui's README has no images and only a Claude Code install path.

---

### Table A: native/cross-platform targets

| Target | Adoption (fetched 2026-11-14) | How tokens enter | Emit format we'd add | Verification without a browser | Verdict |
|---|---|---|---|---|---|
| **Expo + Expo Router** | expo 16.47M/wk, expo-router 11.39M/wk, react-native 21.0M/wk (npm); expo/expo 53,540★ | via the styling layer below | (none of its own) | Expo web (`npx expo start --web`, react-native-web 10.46M/wk) for Playwright; Expo MCP local `automation_take_screenshot`/`automation_tap`/`automation_find_view` (SDK 54+, iOS sim only on macOS) | **Add (tier 1)** |
| **NativeWind v4 (stable) / v5 (RC)** | nativewind 2.56M/wk; 8,126★ | v4: `tailwind.config.js` colors as `rgb(var(--x) / <alpha-value>)`, runtime override via `vars()`; v5 = Tailwind v4 + `react-native-css` | v4 = existing `tailwind3` + a `vars()` theme map; v5 = existing `tailwind4` | Expo web / device | **Add** |
| **Uniwind** | uniwind 1.47M/wk; 1,753★ (created 2025-07-29) | Tailwind v4 bindings, build-time, themes + dark mode | existing `tailwind4` (+ theme blocks) | same | **Add** (fastest-growing) |
| **react-native-reusables** (shadcn for RN) | @rn-primitives/slot 817k/wk; 8,732★ | shadcn-style CSS vars over NativeWind/Uniwind | existing `css` + `tailwind4` | same | **Add** (natural "shadcn for mobile" story) |
| **gluestack-ui v5** | @gluestack-ui/core 138k/wk; 5,358★ | NativeWind v5 / Tailwind v4, copy-paste | existing `tailwind4` | same | Add (falls out of NativeWind) |
| **Tamagui** | tamagui 283k/wk, @tamagui/core 369k/wk; 14,310★ | `createTokens` (size/space/radius/zIndex/color) + `themes` (with sub-themes) in `createTamagui`; recommends `@tamagui/config/v6` defaults | new `tamagui` TS emitter (moderate) | same | Tier 2 |
| **Unistyles v3** | react-native-unistyles 410k/wk; 2,975★ | `StyleSheet.configure({themes, breakpoints, settings})` before any `create`; requires RN 0.85+ New Arch, Nitro, no Expo Go | new `unistyles` TS emitter (small: a plain theme object) | same | Tier 2 (cheap emitter) |
| **React Native Paper** | 606,895/wk; 14,504★ | MD3 theme via `PaperProvider` | MD3 role mapping (reuse the `mui` logic) | same | Tier 2 |
| **Reanimated 4** (motion) | react-native-reanimated 13.75M/wk; react-native-worklets 13.19M/wk; 11,070★ | CSS animations (`animationName` keyframes + `animationDuration`) and CSS transitions (`transitionProperty` + `transitionDuration`); New Arch only | RN variant of the `js` motion-token module (ms numbers + `Easing.bezier`) | n/a | **Add** (motion tokens map 1:1) |
| Moti | 347k/wk; 4,550★, **last push 2025-03-11** | n/a | none | n/a | Skip (stale) |
| **Flutter** | flutter/flutter 181,263★; flex_color_scheme 3,243 likes, dynamic_color 638 likes, flutter_animate 4,259 likes, google_fonts 6,490 likes (pub.dev) | `ThemeData(colorScheme: ColorScheme.fromSeed(...), textTheme: ...)`; custom tokens via `ThemeExtension` (`copyWith`, `lerp`) | new `flutter` Dart emitter | golden tests (`matchesGoldenFile`, `flutter test --update-goldens`; Ahem font by default, platform font drift); `flutter build web` + Playwright | Tier 2: emit + golden-verify |
| **SwiftUI** | (no package metric) | Asset catalog Color Set (Any/Dark) → `Color("Name")` / generated `Color(.name)` | new `.xcassets/*.colorset/Contents.json` + Swift type/spacing constants | official **Xcode** plugin in the Claude marketplace ("render SwiftUI previews, drive simulators"); swift-snapshot-testing 4,395★; `xcrun simctl` | Emit only |
| **Jetpack Compose** | (no package metric) | `MaterialTheme(colorScheme, typography, shapes)`, `lightColorScheme`/`darkColorScheme`, `dynamic*ColorScheme` (Android 12+), Theme Builder exports `Color.kt`/`Theme.kt` | new `compose` Kotlin emitter | Compose Preview Screenshot Testing (`@PreviewTest`, `validateDebugScreenshotTest`, host-side, experimental; standalone plugin no longer maintained → AGP 9.5 test suites); Paparazzi 2,640★; Roborazzi 1,082★; `android studio render-compose-preview` | Emit only |
| **Tauri / Electron** | tauri 112,902★; electron 123,900★ | it's web | existing | existing Playwright | **Detect as web** + desktop canon |
| **Style Dictionary** (multi-platform emit) | style-dictionary 2.84M/wk; 4,883★ | DTCG-ish token JSON → predefined formats: `ios-swift/*`, `android/resources`, `compose/object`, `flutter/class.dart`, `css/variables`, `javascript/esm` | optional bridge: write DTCG `tokens.json`, let SD emit | n/a | Consider *instead of* writing 3 native emitters |
| **Material Color Utilities** | @material/material-color-utilities 716,786/wk; 2,303★; Dart `material_color_utilities` 11.46M downloads/30d | HCT, tonal palettes, schemes, contrast, quantize/score from image, temperature; TS/Dart/Java/Swift/C++/Kotlin | (generator, not an emitter) | n/a | Optional palette generator |

#### Verification devices for agents

| Tool | Adoption | What it gives the verify step |
|---|---|---|
| **agent-device** (Callstack) | 682,584/wk npm; 5,392★ (created 2026-01-30) | CLI + stdio MCP + Node API; iOS/Android/HarmonyOS sims, emulators and devices, plus web; accessibility-tree snapshots with refs, `press`/`fill`/`--settle` diffs, `screenshot`. This is the closest analogue to our Playwright flow walk. |
| **Expo MCP** | (remote server; `expo-mcp` pkg) | Local: `automation_take_screenshot`, `automation_tap`, `automation_find_view`, `expo_router_sitemap`, `open_devtools`; needs SDK 54+ and a dev server with `EXPO_UNSTABLE_MCP_SERVER=1`. Cloud simulators are billed. |
| **Maestro** | 16,404★ | YAML E2E flows for mobile and web (repo description); a fit for "walk the real flows". |
| **Xcode plugin** (official Claude marketplace) | n/a | Build/run/test schemes, render SwiftUI previews, drive simulators (`xcrun agent plugin path`). |

---

### Table B: competitors (AI design skills/plugins/MCPs)

Stars and created_at from the GitHub API on 2026-11-14. "★/day" = stars ÷ days since creation (lifetime average, not current velocity).

| Repo | ★ | Created | ★/day | Stacks / scope | Headline claim / notable features |
|---|---|---|---|---|---|
| anthropics/skills (`frontend-design`) | 194,450 | 2025-09-22 | 465 | web (stack-agnostic prose) | "design lead at a design studio… distinct visual identity"; ground in subject matter; type per Bringhurst. Also in the official marketplace as plugin `frontend-design`. skills.sh: 1.1M installs |
| nextlevelbuilder/ui-ux-pro-max-skill | 149,380 | 2025-11-30 | 428 | **22 stacks** incl. SwiftUI, React Native, Flutter, Jetpack Compose, JavaFX, WPF, WinUI… | Badges "192 reasoning rules", "80 searchable UI styles"; 192 palettes, 74 font pairings, BM25 search; design-system generator; `uipro init --ai claude/cursor/windsurf/codex/gemini`; paid Premium tier; 9 README languages. npm cli 25,621/wk |
| Leonxlnx/taste-skill | 115,443 | 2026-02-19 | 431 | web (React/Vue/Svelte/Astro/Tailwind, static) | "build professional company websites at the figma.com and x.ai level"; dealt palettes, fonts and hero layouts; real Wikimedia photos; browser checker + finish gate; image gallery; `npx skills add`, Claude + Codex plugins; desktop app TasteCode; sponsors |
| pbakaus/impeccable | 110,011 | 2025-11-16 | 303 | web; works with **19 agents** | "design vocabulary for your coding agent"; before/after image pair; **24 verb commands** (bolder, quieter, distill, colorize, typeset, animate, delight, overdrive, critique, audit, polish, harden…); **62 deterministic detector rules**, `npx impeccable detect <dir|url> --github`; edit hook; **live mode** (pick an element in the browser, hot-swap variants); `PRODUCT.md`/`DESIGN.md` |
| emilkowalski/skill | 56,837 | 2026-03-16 | 234 | web + **`animate-expo` (RN/Expo)** | Motion-first skills from a well-known author (Vercel/Linear); animate, review-animations, choreograph, remove-animations |
| Nutlope/hallmark (Together AI) | 54,826 | 2026-04-27 | 273 | web | "refuses to look AI-generated"; **50 themes** with screenshots; tiered gates (Floor/Reflex/Finish); real-browser lint; 755 licensed photos; redesign/audit; fresh-context reviewer |
| alchaincyf/huashu-design | 29,481 | 2026-04-19 | 141 | web, **app prototypes**, PPTX, animation, infographics | Chinese-first; 6 thumbnails → 3 directions; 84 styles; app prototypes shown as phone boards |
| heydamir/unslop | 15,895 | 2026-10-29 | **993** | Next/React/Vue/Svelte/Tailwind/HTML, live URL | audit → direction → passes; **story video** of the screen unslopping itself, made for social posting; optional image-gen via MCP |
| GLips/Figma-Context-MCP (Framelink) | 16,206 | 2025-02-13 | 25 | any framework | Figma data → one-shot implementation. figma-developer-mcp 146,164/wk |
| google-labs-code/stitch-skills | 8,820 | 2026-01-16 | 29 | Stitch MCP | Google Stitch design plugins for Codex/Claude |
| 21st-dev/magic-mcp | 6,518 | 2025-02-19 | 10 | React/Tailwind | "like v0 in your Cursor"; now the 21st MCP (HTTP, API key; AI generation is a paid tier); search 10k+ components. @21st-dev/magic 13,440/wk |
| expo/skills (official) | 4,151 | 2025-11-30 | 12 | Expo/RN | Incl. `expo-design-system` (token theme incl. motion, drift audits), `expo-native-ui`, `expo-animation`, `expo-ui` (SwiftUI/Compose components); in the official Claude marketplace |
| twostraws/SwiftUI-Agent-Skill | 6,557 | 2026-03-05 | 26 | SwiftUI | API, design, performance and a11y guidance |
| flutter/skills (official) | 3,179 | 2026-02-25 | 12 | Flutter | widget previews, widget/integration tests via MCP |
| oil-oil/oil-ui | 3,340 | 2026-09-30 | 74 | web + apps | Directions compared side by side, "squint" test, screenshot verify, fresh reviewer; most similar to our pipeline |
| vercel-labs/web-interface-guidelines | 1,176 | 2025-09-10 | 3 | web | Rules list; shipped as skill `web-design-guidelines` in vercel-labs/agent-skills (34,055★), 861.8K skills.sh installs |
| superdesigndev/superdesign-skill | 1,007 | 2026-01-21 | 3 | web, canvas | In the official Claude marketplace; SaaS-backed canvas |
| storybookjs/mcp | 271 (moved into the storybook monorepo in v10.6) | 2025-08-21 | n/a | any Storybook | @storybook/addon-mcp 3.40M/wk, @storybook/mcp 2.45M/wk; Claude Code + Codex plugin |
| shadcn MCP | (part of shadcn-ui/ui, 128,174★; `shadcn` 18.27M/wk) | n/a | n/a | shadcn registries | Browse/search/install from any registry, incl. third-party and private registries (`components.json`) |
| Figma MCP (official) | figma/mcp-server-guide 2,186★; @figma/code-connect 1.87M/wk | n/a | n/a | any | Remote server; design context (variables, components, layout); **write to canvas**; live UI capture → Figma layers; Code Connect; in the official Claude marketplace (`figma`) |
| draftbit/mobile-taste-skill | **11** | 2026-07-02 | 0 | RN/Expo + NativeWind | "anti-slop for React Native/Expo"; nav plan, design system, review, redesign |
| v0 (Vercel) | n/a (closed product) | n/a | n/a | React/Next/shadcn | UNVERIFIED: no public repo to measure |

**skills.sh install leaderboard** (fetched 2026-11-14): frontend-design 1.1M; `ui-taste` (uizze) 1.1M; web-design-guidelines 861.8K; design-taste-frontend 776.6K; ui-ux-pro-max 451.5K; emil-design-eng 447.7K; **ios-design (uizze) 419.2K**; impeccable 407.6K; vercel-react-native-skills 277.2K; `design-mobile-apps` (sleekdotdesign, SaaS-gated) 1.4M despite only 35★ on designed-by-ai/skills. So install counts and stars diverge sharply, and installs look gameable. Treat installs as a weak signal.

---

### Detail: part A, native targets

#### React Native / Expo (recommend: tier 1)

- **Token entry is converging on Tailwind v4 / CSS variables:**
  - NativeWind v4 (stable) maps Tailwind colors to CSS variables and overrides them at runtime with `vars()`.
  - NativeWind v5 "is a release candidate using Tailwind CSS v4 and react-native-css", "not intended for production use".
  - Uniwind: "full Tailwind v4 support", build-time, themes and dark mode.
  - gluestack v5 is "NativeWind v5 / Tailwind v4" and "Expo Router first".
  - react-native-reusables: "shadcn/ui to React Native… with Nativewind/Uniwind".
  - Consequence: our `tailwind4` + `css` emitters already produce most of the input. What's new is a detect branch (`react-native`/`expo` → styling layer), a theme-switch map (NativeWind `vars()` / Uniwind themes), and no-DOM rules in check-static.
- **Non-Tailwind layers need small TS emitters:**
  - Tamagui `createTokens` + `themes`.
  - Unistyles `StyleSheet.configure({themes, breakpoints})` (RN 0.85+, New Arch, no Expo Go).
  - Paper MD3 theme.
  - Each is under a page of code reusing `lib/tokens.mjs`.
- **Motion:**
  - Reanimated 4 CSS animations/transitions mirror CSS `animation-*`/`transition-*`, so duration/easing tokens map directly.
  - Reanimated 4 needs the New Architecture and `react-native-worklets`.
  - Emit an RN flavour of the `js` motion module (numbers in ms, `Easing.bezier(...)`), and keep the "transform + opacity only" rule. It holds on native too (UI-thread animation).
  - Moti is unmaintained (last push 2025-03-11) and should not be recommended.
- **Verify, in increasing fidelity:**
  1. **Expo web**: install `react-dom react-native-web @expo/metro-runtime`, `npx expo start --web`, then the existing Playwright walk.
     - Caveat: RNW renders DOM, not native views. Fonts, shadows (iOS vs Android elevation), safe areas, native tabs and sheets differ. Report it as "web approximation".
  2. **agent-device** (CLI/MCP): a11y-tree snapshot + `press`/`fill` + `screenshot` on iOS sim / Android emulator. This maps almost 1:1 onto our flow-walk script, and its snapshot is the accessibility tree, which feeds our a11y checks.
  3. **Expo MCP local tools**: screenshots and taps by testID (SDK 54+, iOS sim only on macOS hosts).
  4. **Maestro** for durable flow files.
- **Canon delta:** platform conventions such as touch targets (≥44px mobile, per vercel guidelines), safe areas, native tab bars vs. drawers, sheets, back gesture, haptics, Dynamic Type/font scale, and dark mode via `useColorScheme`. UNVERIFIED: the exact HIG/Material numbers. Cite Apple HIG and m3.material.io when writing the cards.
- **Competition here is thin on quality and stars:**
  - mobile-taste-skill has 11★.
  - emil's `animate-expo` covers motion only.
  - Expo's own `expo-design-system` covers tokens and drift audits but no interview, blueprint, directions or reviewer.
  - Demand exists: ios-design 419K installs and vercel-react-native-skills 277K on skills.sh.

#### Flutter (tier 2)

- Emit a `ThemeData` with `ColorScheme` (light/dark), `TextTheme`, and a `ThemeExtension` for non-Material tokens: spacing, radii, motion durations/curves (`lerp` gives animated theme switches for free).
- Verify browser-free with golden tests (`matchesGoldenFile`, `--update-goldens`). Goldens drift across OS and font, so regenerate them on the target platform. `flutter build web` + Playwright works as an approximation.
- The official flutter/skills (3,179★) already covers widget previews and tests, so don't duplicate it. Hand off to it.
- pub.dev: flex_color_scheme (3,243 likes) is the community theming tool, and Material-roles-centric.

#### SwiftUI / Compose (emit only)

- **SwiftUI:** write `Assets.xcassets/<Name>.colorset/Contents.json` (Any + Dark appearances) plus a Swift file of spacing/radius/type/motion constants. The Apple-doc wording is UNVERIFIED (Apple's doc pages returned 404 or an empty body via WebFetch); the colorset JSON format is well known. Verification belongs to the official Xcode plugin (previews, simulators) and swift-snapshot-testing.
- **Compose:** emit `Color.kt` + `Theme.kt` + `Type.kt` + `Shape.kt` in the shape Material Theme Builder exports. Verify via Compose Preview Screenshot Testing (experimental; standalone plugin no longer maintained → AGP 9.5 test suites), Paparazzi or Roborazzi (JVM, no emulator), or `android studio render-compose-preview`.
- **Cheaper alternative:** emit DTCG JSON and document a Style Dictionary config (`ios-swift/class.swift`, `compose/object`, `flutter/class.dart`). This gets three platforms for about one script, at the cost of a dependency the user installs.

#### Tauri / Electron

Both are web front-ends, so the existing pipeline applies. Add detection (`@tauri-apps/api`, `electron`) plus a few desktop canon cards: title bar and window chrome, native menus, keyboard shortcuts, density, no hover-only affordances for touch-capable laptops. Low effort; it widens the reach claim.

#### Material Color Utilities (palette generation)

- Gives HCT (CAM16 hue/chroma + L* tone), tonal palettes, scheme builders, contrast tools, image quantize/score, and temperature (analogous/complementary). TS package: 716,786/wk.
- **Useful:** tone is L*-based, so tone deltas give predictable contrast. That makes it a principled way to build neutral and accent ramps that pass contrast in light *and* dark, and to derive a palette from a brand image (quantize + score). This fits our "derive, don't preset" stance.
- **Risk:** `Scheme*` role maps produce the recognizable Material You look. Use palettes and tone only, not the scheme roles, unless the target *is* Material (Compose, Flutter, Paper).
- Dependency: the TS library is pure JS. Make it an optional dep, or have the script fall back to the existing OKLCH logic.

---

### Detail: part B, what the top ones do that we don't

#### Gap list (finally-good-ui vs. competitors)

1. **Visual proof in the README.** The top performers all show it: impeccable's before/after pair, taste's photo gallery, hallmark's 50 theme screenshots, unslop's frame-by-frame webp and story video, huashu's app boards. Ours has none.
2. **Multi-agent install.**
   - impeccable: 19 agents via `npx impeccable install`.
   - ui-ux-pro-max: `uipro init --ai cursor|codex|gemini…`.
   - taste, emil, superdesign, twostraws: `npx skills add`.
   - We have a Claude Code marketplace install plus an `export` of rules. No `npx skills add` path, no Codex plugin.
3. **Standalone detector / CI.** impeccable ships `npx impeccable detect <dir|url> --json --github` with exit codes and GitHub annotations. Our 19 slop detectors live inside `check-static.mjs` and are only reachable through the plugin.
4. **Verb commands for iteration.** impeccable has 24 single-purpose verbs (bolder/quieter/distill/typeset/animate/harden/onboard…). We have `polish` and `slop-check`.
5. **Live in-browser variant picking.** impeccable's live mode (Vite/Next/SvelteKit/Astro/Nuxt).
6. **Real imagery.** taste bundles Wikimedia photos; hallmark has 755 licensed photos; unslop does optional image generation. We only have a craft card telling the agent to use real imagery.
7. **Shareable output.** unslop's "story video" is made for posting on X. Its 993★/day suggests shareable demos drive growth.
8. **Mobile and native stacks.** ui-ux-pro-max lists 22 stacks (guidelines only); emil has `animate-expo`; Expo has `expo-design-system`. We are web-only.
9. **Design-tool bridges.** Figma MCP (official, in the Claude marketplace) and Framelink (16.2k★) bring Figma variables into code. We don't ingest Figma variables or emit to Figma. `extract` covers code only.
10. **Component registries.** The shadcn MCP installs from any registry, including private ones, and 21st serves 10k+ components. We don't publish a registry or point build recipes at registries.
11. **A website/docs site.** tasteskill.dev, impeccable.style, usehallmark.com, uupm.cc, aiforui.dev, ui.oiloil.org. We have README only.
12. **Translations.** ui-ux-pro-max ships 9 languages; huashu is Chinese-first; oil-ui has EN/ZH/JA.

#### Things we already have that most of them lack

These are worth leading with:
- an interview → blueprint (IA, flows, state matrix) → 3 animated directions loop; only oil-ui and huashu do directions;
- multi-screen app scope, not landing pages (taste, hallmark and frontend-design are page-centric);
- stack-native token emit (Tailwind v3/v4, MUI, CSS vars, JS motion);
- a motion system as tokens;
- a cited decision log;
- an independent reviewer subagent (hallmark and oil-ui have one too).

#### What earns stars (observed)

- **Author reach and a brand.** Together AI (hallmark), pbakaus (impeccable), Emil Kowalski, and Anthropic all have it. Not replicable, but launch assets can borrow it: before/after posts and videos.
- **A visual, falsifiable promise.** "refuses to look AI-generated", "company websites at the figma.com and x.ai level", "Stop shipping AI-slop UI". Big numbers as badges also work ("192 reasoning rules", "80 styles", "62 rules").
- **One-line install everywhere.**
- Stack-breadth claims help ui-ux-pro-max's listing, but its stack support is guideline rows searched by BM25, not emit or verify. That is **star-bait**.
- Pure-quality mobile skills without distribution don't move: mobile-taste-skill has 11★, callstack agent-skills 1,708★.

---

### Synthesis: star-bait vs. real value

| Idea | Effort | Real value | Star pull | Call |
|---|---|---|---|---|
| Before/after gallery + 10-s "redesign" video in README; landing page | S | low technically, high for trust | **High** | Do first |
| `npx skills add` / Codex plugin / Cursor install path | S | medium | **High** | Do |
| Standalone `npx finally-good-ui check <dir|url> --github` (slop detector + contrast) | M | high (CI) | Medium-high | Do |
| **Expo/RN target**: detect + NativeWind/Uniwind/reusables via `tailwind4`; RN motion tokens; Expo-web verify + agent-device native verify; mobile canon cards | M | **High** (a gap: no strong design-judgment skill for RN) | Medium-high ("now designs mobile apps" headline) | Do |
| Tauri/Electron detection + desktop canon | S | medium | Low-medium | Do (cheap) |
| Figma variables ↔ tokens.json bridge (via the official Figma MCP when present) | M | high for teams | Medium | Next |
| HCT palette generator (Material Color Utilities, tones only) | S-M | medium-high (contrast-safe ramps, from-image palettes) | Low | Next |
| Flutter emit (ThemeData + ThemeExtension) + golden-test recipe | M | medium | Medium | Later |
| SwiftUI colorset / Compose theme emit (or Style Dictionary bridge) | S-M | medium | Medium ("iOS + Android" checkbox) | Later, emit only |
| Full native build+verify for SwiftUI/Compose | L | medium (vendor plugins own it) | Low | Skip |
| "N stacks supported" table of guideline rows | S | **low** | Medium | Star-bait; avoid unless backed by emit+verify |
| Theme/style catalogs (50 themes, 80 styles) | M | contradicts the canon ("never presets") | High | Don't; show *derived* outputs instead |
| Verb commands (bolder/quieter/harden…) as thin entry points to existing modules | S | medium (discoverability) | Medium | Consider |

---

### Source URLs

- npm downloads: `https://api.npmjs.org/downloads/point/last-week/<pkg>` (e.g. https://api.npmjs.org/downloads/point/last-week/nativewind)
- pub.dev: `https://pub.dev/api/packages/<pkg>/score`
- GitHub: `https://api.github.com/repos/<owner>/<repo>` for every ★/created_at above
- NativeWind v4 themes: https://www.nativewind.dev/docs/guides/themes ; v5 RC: https://www.nativewind.dev/v5
- Uniwind: https://docs.uniwind.dev/ ; https://github.com/uni-stack/uniwind
- Unistyles v3 config: https://www.unistyl.es/v3/start/configuration ; requirements: https://github.com/jpudysz/react-native-unistyles
- Tamagui config: https://tamagui.dev/docs/core/configuration
- gluestack v5: https://github.com/gluestack/gluestack-ui
- react-native-reusables: https://github.com/founded-labs/react-native-reusables
- RN Paper: https://github.com/callstack/react-native-paper
- Reanimated 4: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/ ; CSS animations: https://docs.swmansion.com/react-native-reanimated/docs/css-animations/animation-name/ ; CSS transitions: https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/transition-property/
- Moti: https://github.com/nandorojo/moti (pushed_at 2025-03-11)
- Expo web: https://docs.expo.dev/workflow/web/ ; Expo MCP: https://docs.expo.dev/eas/ai/mcp/ ; expo/skills: https://github.com/expo/skills
- agent-device: https://github.com/callstack/agent-device ; Maestro: https://github.com/mobile-dev-inc/maestro
- Flutter theming: https://docs.flutter.dev/cookbook/design/themes ; ThemeExtension: https://api.flutter.dev/flutter/material/ThemeExtension-class.html ; goldens: https://api.flutter.dev/flutter/flutter_test/matchesGoldenFile.html ; flutter/skills: https://github.com/flutter/skills
- Compose M3: https://developer.android.com/develop/ui/compose/designsystems/material3 ; screenshot testing: https://developer.android.com/studio/preview/compose-screenshot-testing ; Paparazzi https://github.com/cashapp/paparazzi ; Roborazzi https://github.com/takahirom/roborazzi
- SwiftUI asset colors: UNVERIFIED (Apple doc fetch failed); swift-snapshot-testing https://github.com/pointfreeco/swift-snapshot-testing ; Xcode plugin: https://github.com/anthropics/claude-plugins-official (marketplace.json entry `xcode`)
- Style Dictionary formats: https://styledictionary.com/reference/hooks/formats/predefined/
- Material Color Utilities: https://github.com/material-foundation/material-color-utilities
- Competitor READMEs: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill , https://github.com/Leonxlnx/taste-skill , https://github.com/pbakaus/impeccable , https://github.com/Nutlope/hallmark , https://github.com/emilkowalski/skill , https://github.com/heydamir/unslop , https://github.com/alchaincyf/huashu-design , https://github.com/oil-oil/oil-ui , https://github.com/draftbit/mobile-taste-skill , https://github.com/superdesigndev/superdesign-skill , https://github.com/google-labs-code/stitch-skills , https://github.com/21st-dev/magic-mcp , https://github.com/GLips/Figma-Context-MCP , https://github.com/storybookjs/mcp , https://github.com/vercel-labs/web-interface-guidelines , https://github.com/anthropics/skills/tree/main/skills/frontend-design , https://github.com/twostraws/SwiftUI-Agent-Skill
- shadcn MCP: https://ui.shadcn.com/docs/mcp ; Figma MCP: https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server
- Official Claude marketplace: https://github.com/anthropics/claude-plugins-official (`.claude-plugin/marketplace.json`: 317 plugins incl. frontend-design, figma, expo, xcode, superdesign)
- skills.sh leaderboard: https://skills.sh/ ; Sleek skill: https://github.com/designed-by-ai/skills

---

# Part 5

## Research 5: Vercel UI SDK, agent-skills, Web Interface Guidelines vs finally-good-ui

Date: 2026-11-14. Primary sources only. Clones in `scratchpad/vercel-ui-src/` (not executed).

Source pins (cite as `<repo>@<sha>:<path>`):
- **UI** = `vercel-labs/ui@220c1a0d7278872286a620a8e4ee4210ca46f9bd` (HEAD 2026-11-14)
- **AS** = `vercel-labs/agent-skills@1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`
- **WIG** = `vercel-labs/web-interface-guidelines@434b7f91364665f2f733b310ec54809bf8f37937`
- **FGU** = `Stav-Sananes/finally-good-ui@b7e3bec` (local, branch skill-fixes-from-examples)

---

### 1. Summary

- **Names.** The packages are **`@ui-sdk/core`** plus one adapter: **`@ui-sdk/react`, `@ui-sdk/vue`, `@ui-sdk/svelte`, `@ui-sdk/solid`, `@ui-sdk/web`**. `@vercel/ui` and `@vercel/ui-sdk` don't exist on npm (registry returns 404, checked 2026-11-14). The unscoped `ui-sdk` is an unrelated name, unpublished in 2016. Version **0.1.0-beta.2** is on the `beta` dist-tag, and npm `latest` still points to 0.1.0-beta.1. License Apache-2.0, with **no NOTICE file**. Docs at https://ui-sdk.dev.
- **Traction** (2026-11-14): 4,334 GitHub stars and 122 forks (`gh api repos/vercel-labs/ui`). The repo was created 2026-10-26 and npm published on 2026-11-12. npm downloads for the week of 11-07 to 11-13 (about 2 days after publish): core 33,348, react 27,926, web 2,047, vue 1,064, svelte 900, solid 561. The skills.sh index shows **1,233 installs** of `vercel-labs/ui/ui-sdk`. For comparison, `web-design-guidelines` shows **860,939**.
- **What it is.** It's a headless **behavior layer**, not a style system. The core is TypeScript with no framework (`definePrimitive` + slots + `create*` behaviors). Adapters only render. State is exposed as `data-slot` plus `data-*` state attributes and CSS variables. Components "render no styles of their own". An optional `web.css` reads `--ui-*` tokens and **contains no motion tokens or entry/exit animations**. Motion is left entirely to the user, through `data-starting-style` / `data-ending-style` and `--transform-origin`. **That gap is exactly where our motion tokens and recipes fit.**
- **Scale.** 55 shipped components (React docs pages) and about 120 exported helpers across 13 behavior families. The landing page claims "We built 50+ behaviors" (https://ui-sdk.dev/, fetched 2026-11-14).
- **Its skill** is a 56-line SKILL.md with a `references/` folder of 7 files. The pattern: read the **version-matched docs that ship in node_modules** (`docs/llms.txt`), "Pick your path" (use components, or build one), then two steps every path ends with (agent-ready, tests), a short list of hard rules, and a "When you're done" checklist that reports commands and exit codes.
- **Biggest takeaways for us:**
  1. Our recipes cover **motion and page patterns**. UI SDK covers **keyboard, focus and ARIA behavior**. The two barely overlap, so there's a large gap on our side in composite widgets (menu, select, combobox, command palette, tabs, tooltip, drawer, tree, slider, date and number inputs).
  2. **Real bug in our recipe.** `recipes/motion/popover-from-trigger.md` puts `role="menu"` on a plain `[popover]` and claims "the Popover API … handle[s]" moving focus into the menu. The Popover API doesn't move focus on open unless something inside has `autofocus` ([HTML spec, popover focusing steps](https://html.spec.whatwg.org/multipage/popover.html#popover-focusing-steps)). It also doesn't provide the arrow keys or typeahead that `role="menu"` requires ([APG Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)). UI SDK's skill names this exact smell: "A `div` with `role="listbox"`, `"menu"` … is almost always a bug" (UI:packages/core/skills/ui-sdk/SKILL.md).
  3. **WIG** has about 30 rules that are absent or only partial in our canon: punctuation and typography, i18n and `Intl`, hydration, overscroll, tooltip timing, minimum loading time, scroll restoration, URL-as-view-state, drag hygiene, autofocus, and more. Our **sentence case** conflicts with WIG's **Title Case** on purpose, so keep ours.
  4. **Onboarding ideas worth copying.** A one-line `npx skills add …`, a "Copy Prompt" setup prompt, a "The person needs to → Use" table, a reassuring README tone ("you don't need to learn how to write this. Your agents will."), and light/dark hero art. **Our README has two broken install links** (`../README.md`, `INSTALL.md`; no INSTALL.md exists at repo root).

---

### 2. Gap table: UI SDK behaviors and components vs finally-good-ui

Legend: **C** = covered, **P** = partial, **M** = missing. "Ours" = FGU path. "Pri" = priority for a new FGU recipe (H/M/L) by how often app UIs need it.

#### 2a. Components (UI:apps/docs/content/docs/react/components/*.mdx)

| UI SDK component | What it handles (a11y / interaction) | Ours | Status | Pri |
|---|---|---|---|---|
| Button | loading state, stays reachable when disabled (`aria-disabled` while focused) | recipes/motion/button-press.md (press + loading) | P (no `aria-disabled` vs `disabled` rule; grep found 0 hits) | M |
| Dialog / Alert Dialog | focus trap, return, inert, nested modals, confirm value | recipes/motion/dialog-enter-exit.md | C (nested modal stacking only in upgrade trigger) | — |
| Drawer | drag, **snap points**, fling velocity, keyboard handle (arrows/Home/End), reduced motion fades instead of sliding, iOS edge-swipe | mentions "sheet" in canon/ia-nav, canon/motion; no recipe | M | **H** |
| Popover | placement, `--transform-origin`, `--anchor-width`, `--available-height`, dismissal | recipes/motion/popover-from-trigger.md | P (motion C; **menu a11y wrong**, see §1) | **H (fix)** |
| Menu / Menubar / context menu | roving focus, typeahead, submenus, right-click | only `role="menu"` hint in popover recipe | M | **H** |
| Select / Listbox | popup list, typeahead, multi-select, form `name` | none (native `<select>` in form recipe) | M | **H** |
| Combobox / Autocomplete | search plus choose, async options, highlight | none | M | **H** |
| Command | command palette: search, run, nested pages | canon/ia-nav.md + canon/motion.md mention it; no recipe | P | **H** |
| Trigger Menu / Token Input | @, / and # mentions at the caret; tokens mixed with text | none | M | M (AI/chat apps) |
| Tooltip | **600 ms delay, group-instant (`data-instant`), focus opens at once**, one open at a time | canon/ia-nav "icon-only buttons have … a tooltip"; popover recipe notes "show on focus" | P (no timing rule) | **H** |
| Hover Card | link preview on hover or focus, keeps navigation | none | M | L |
| Navigation Menu | site nav panels, motion waits on animations | recipes/patterns/app-shell-nav.md (app nav) | P | L |
| Tabs / Segmented Control | roving focus, arrow keys; indicator **slides** to the choice | tabs in app-shell, route-transition; segmented only in craft | P (no keyboard or indicator recipe) | **H** |
| Toolbar | one tab stop, arrow keys | canon/ia-nav mentions toolbars | M (behavior) | M |
| Accordion / Collapsible | height animation, `hidden="until-found"` find-in-page | recipes/motion/accordion-auto-height.md | P (no find-in-page) | L |
| Tree | hierarchy, expand, checked tri-state, reorder | none | M | M |
| Checkbox / Radio / Switch | indeterminate, arrow keys in radio group, forms | settings-page, data-table (indeterminate) | P | L |
| Field / Label / Input / Textarea / Password | label/description/error wiring, auto-grow, show/hide | recipes/patterns/form-validation.md, canon/flows-forms | C/P (auto-grow, password reveal missing) | M |
| Number Input | step, hold-to-repeat, locale format (money `step=0.01`) | none | M | M |
| OTP Input | paste, autofill, native validation | canon/usability (`one-time-code` autocomplete) | P | M |
| Date Input / Date Picker / Calendar / Time Input | segment typing in locale order, ranges, grid keys | none | M | M |
| Slider / Rating / Color Picker | thumbs, keys, 2-D area, preview-before-commit | none | M | L |
| File Input | choose, drop or paste; validate; form submit | none | M | M |
| Image Cropper | move/resize selection, pan/zoom | none | M | L |
| Avatar | image with fallback while loading or failed | canon/craft.real-imagery-and-icons (initials) | P | L |
| Progress / Meter | determinate vs indeterminate; reduced-motion still fill | canon/states.loading-perceived | P | L |
| Toast | timed dismiss, **pause on hover, focus and hidden page**, swipe, priority announcements, 4-visible queue | recipes/motion/toast-stack.md | C (swipe deferred to Sonner) | — |
| Pagination | buttons, links or router | data-table recipe | C | — |
| Carousel | native scroll, rotation pause rules, polite live region only when not rotating | none | M | L |
| Resizable | panels resize and collapse, keyboard, saved layout | none | M | M (dashboards, IDEs) |
| Scroll Area | styled scrollbars, edge indicators, **follow-to-end** | none | M | M |
| Timeline / Waterfall | ordered events with arrow keys; trace bars | none | M | L |
| Preferences | color scheme / pointer kind → data attributes, **no flash** (`preferencesScript`) | canon/color dark-mode; verify forces themes | P (no theme-toggle/no-FOUC recipe) | M |
| Separator | role, orientation | canon/craft.hairlines-before-boxes | C | — |

#### 2b. Core behaviors (UI:apps/docs/content/docs/core/behaviors/index.mdx)

| Behavior family (helpers) | What it handles | Ours | Status | Pri |
|---|---|---|---|---|
| Focus: `createRovingFocus`, `createGridFocus`, `spatialMove`, `createTypeahead` | one tab stop, arrows, grids, type-to-jump | canon/a11y.keyboard-complete (principle only) | P | **H** (one shared "keyboard model" recipe) |
| `createFocusRecovery`, `keepFocus` | where focus goes when the focused item is removed or moved | none (grep 0) | M | **H** (delete row, close toast, remove chip) |
| `inputHints` | right on-screen keyboard and autofill per field | canon/usability (type/inputmode/autocomplete) | C | — |
| Text: `createInputHistory`, `isComposing`, `fuzzyScore`, `matchSegments` | ArrowUp history in chat; IME-safe Enter; fuzzy rank plus highlight | none | M | M (chat/AI apps, command palette) |
| Selection: `createSelection` (shift/ctrl ranges), `createLasso`, `createCellRange` + copy/paste | file-manager selection, marquee, spreadsheet ranges | data-table (row checkbox) | P | M |
| Drag and drop: `createReorder`, `createTreeReorder`, `createTransfer`, `createAutoScroll`, `reorderMessage` | reorder **with keyboard plus announcements**, kanban transfer, edge auto-scroll | recipes/motion/list-reorder-flip.md (FLIP only; drag → dnd-kit, "keyboard must be supported") | P | M |
| Direct manipulation: `createMove`, `createResize`, `createSwipeActions`, `bindHold`, `bindRepeat`, `createSpans` | 2-D move and resize, swipe-to-reveal row actions, press-and-hold, repeat | none | M | M (swipe actions on mobile lists) |
| Lists: `createVirtualizer`, `createStickToBottom`, `bindScrollPicker`, `createInlineEdit` | virtual rows; chat/log follows its end and keeps place when scrolled up; wheel pickers; rename in place | data-table upgrade trigger (TanStack Virtual above ~500 rows) | M/P | **H** (stick-to-bottom, inline edit) |
| Trees: `createTreeCollection`, `treeCheckedStates` | parent/child lookup, tri-state | none | M | L |
| Motion: `bindPanel`, `animateIn`/`animateOut`, `hiddenAttrs`/`bindFindable`; gesture: `createVelocityTracker`, `projectDistance`, `solveSpring`, `rubberBand` | presence (stay mounted until exit), height panels, find-in-page, fling and rubber-band physics | recipes (CSS `@starting-style`, Motion `AnimatePresence`) | P (no gesture physics recipe) | M (drawer/sheet) |
| Popups: `createPopup`, `popup*` slots, `position`, `bindLayer`, `bindPersistentLayer` | open, position, dismiss, layering, nested modals | popover and dialog recipes | P | (covered by fixing menu) |
| Preferences/Storage: `createColorScheme`, `preferencesScript`, `createPointerKind` | theme choice without flash; finger vs mouse | none | M | M |
| Platform: `announce`, `prepareAnnouncements`, `isRTL`, `matchesShortcut`, `formatShortcut`, `ariaKeyshortcuts` | live announcements; RTL; platform-correct shortcut display (⌘ vs Ctrl) | toast/settings live regions; RTL only in interview/blueprint | P | M (shortcut display) |
| Mobile: `bindViewport`, `bindAvoidKeyboard` | keep a bar above the on-screen keyboard | none | M | M (chat composer, mobile forms) |
| Changes: `createUndoStack`, change `details.reason/source/cancel()` | undo/redo; why a change happened | canon/usability.user-control-undo (principle) | P | L |
| Canvas: `createViewport`, `createConnect` | pan/zoom, node connections with keyboard | none | M | L |
| Agents: `createAgent`, `agentTools`, `registerTools` (WebMCP), `data-agent-confirm/secret/hidden` | an agent operates the UI via component APIs; a person confirms risky steps | none | M | L (optional card, see §3e) |

---

### 3. Recommendations

#### (a) New finally-good-ui recipes (in our own words, citing UI SDK as reference)

Ordered by value. Each keeps our format: intent, cards, when NOT, tokens, CSS/native baseline first, a11y, upgrade trigger.

1. **Fix `motion/popover-from-trigger.md` now.** Remove `role="menu"` from the CSS baseline, or add the keyboard contract it requires. Rewrite the a11y line: the Popover API gives light-dismiss and Escape, and returns focus on close, but **doesn't** move focus in on open (use `autofocus` on the first item, or JS) and adds **no arrow keys or typeahead**. Point to the new menu recipe.
2. **`patterns/menu-select-combobox.md`** (one recipe, three shapes). Covers roving focus vs `aria-activedescendant`, typeahead, focus in and out, Escape ownership, and selection-follows-focus vs Space-to-select (taken from UI:packages/core/skills/ui-sdk/references/create-component.md "Write the spec before any code"). Baseline: native `<select>` (plus customizable `<select>` where supported) and `<datalist>`. Upgrade trigger: the installed headless library, else ui-sdk / Radix / Headless UI / Bits UI / Reka.
3. **`patterns/command-palette.md`**. Fuzzy rank, highlighted matched segments, nested pages, `⌘K` shown per platform (`formatShortcut`), empty and no-result states. The canon already references command palettes.
4. **`motion/tooltip-group.md`**. First-hover delay (UI SDK default 600 ms; WIG says to delay the first tooltip and show later ones in the group with no delay). Keyboard focus opens at once. Peers open instantly and **skip their animation** (`data-instant`). One open at a time. Opacity-only motion under the `micro` token. Sources: UI:apps/docs/content/docs/react/components/tooltip.mdx §"Delay and Grouping"; WIG:README.md "Tooltip timing".
5. **`motion/segmented-indicator.md`** (tabs + segmented control). Arrow-key roving with one tab stop. The indicator slides with `transform` from the old to the new choice (FLIP or anchor positioning), with instant opacity under reduced motion.
6. **`motion/sheet-drag-snap.md`** (drawer / bottom sheet). Snap points, fling velocity projection, rubber band past the edge, a handle **button** with arrow, Home and End keys (a gesture alternative), `overscroll-behavior: contain`, and a fade instead of a slide under reduced motion (UI:…/components/drawer.mdx). Upgrade trigger: Vaul-class library or ui-sdk Drawer.
7. **`patterns/chat-log-stick-to-bottom.md`**. Follow new content only while the reader is at the end, keep their place when they scroll up, show a "jump to latest" affordance, ArrowUp input history, IME-safe Enter (`isComposing`), ⌘/Ctrl+Enter in a textarea (WIG), and the composer kept above the on-screen keyboard (`bindAvoidKeyboard` idea). Very common in AI apps; we have nothing for it.
8. **`patterns/focus-after-removal.md`** (or a section added to data-table, toast and empty-state). When the focused row, chip or toast is removed, move focus to the next item, else the previous, else the container or trigger, and announce the change.
9. **`patterns/inline-edit.md`**. Rename in place: Enter commits, Escape cancels, blur commits (state the choice), optimistic update with rollback (states.optimistic-feedback).
10. **Extend `list-reorder-flip.md`** with a keyboard reorder contract (pick up with Space, move with arrows, drop with Space, cancel with Escape) and announcements, modelled on `createReorder`/`reorderMessage`. Add WIG's drag hygiene: `user-select: none` and `inert` on the dragged copy.
11. **`patterns/swipe-row-actions.md`** (mobile lists). Reveal on swipe, a full-swipe threshold, and **always a visible button or menu alternative** (WCAG 2.5.7; WIG "Gestures have alternatives").
12. **`patterns/theme-preference.md`**. Light/dark/system toggle with no flash on first paint (inline pre-paint script or cookie-read on the server), `color-scheme`, `<meta name="theme-color">`. Idea from `createColorScheme` + `preferencesScript`.
13. Lower priority: file-drop input, number input (hold-to-repeat, locale format), date and time segment inputs, resizable panels, tree.

**License obligations (Apache-2.0, UI:LICENSE §4):**
- **Restating behaviour in our own words, with a citation** (e.g. "tooltip groups open instantly after the first"), copies no expression. Cite UI SDK as a reference, as the README already does for other practitioners. (Not legal advice. Whether a fact or idea can be copyrighted wasn't verified here.)
- **Copying or adapting their text or code** (doc sentences, CSS snippets, test code) creates a Derivative Work. We must (a) ship a copy of Apache-2.0 with it, (b) mark the modified files as changed, and (c) keep their copyright and attribution notices. (d) The NOTICE clause doesn't apply: there is **no NOTICE file** (checked repo root and packages/core). Simplest path: write everything fresh, add "Reference: UI SDK docs (Apache-2.0), ui-sdk.dev" under each recipe's sources, and add a line to the README Sources list.
- **WIG is MIT** (WIG:LICENSE, "Copyright (c) 2025 Vercel Labs"). Quoting it verbatim needs the MIT notice kept. agent-skills README says "MIT", but the GitHub API reports no license file (`license: null`), so attribution would rest on the README statement alone. Re-express rules in our own words, as already done for antislop and taste-skill.

#### (b) Detect `@ui-sdk/*` and prefer it at upgrade triggers?

**Detect: yes. Prefer by default: no, not while it's in beta.**
- `scripts/detect-stack.mjs` component detection (lines ~88-94) knows shadcn, mui, chakra, mantine, radix and headlessui. Add `else if (hasPrefix("@ui-sdk/")) components = "ui-sdk"`, and record which adapter is present (react/vue/svelte/solid/web). Exact names: `@ui-sdk/core`, `@ui-sdk/react`, `@ui-sdk/vue`, `@ui-sdk/svelte`, `@ui-sdk/solid`, `@ui-sdk/web` (npm registry). Don't detect `@vercel/ui`: it doesn't exist.
- **When it's installed**, follow our existing rule 4 ("Respect what exists"):
  - use its components for behavior;
  - **never hand-roll `role=` widgets it ships**, which mirrors their rule;
  - if `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md` or an installed `ui-sdk` skill exists, defer behavior questions to it;
  - our job becomes the **design layer**: tokens, motion, states, craft.
- **Motion integration for each recipe** (an "ui-sdk" adapter note, like the Radix notes):
  - enter/exit go on `[data-slot="x"][data-starting-style]` / `[data-ending-style]` with `transition: opacity var(--duration-short) var(--ease-enter), transform …`;
  - `transform-origin: var(--transform-origin)`;
  - skip the transition when `[data-instant]` is set;
  - leave Drawer's `translate` alone (their docs say the component owns it);
  - in Tailwind, use `data-starting-style:` / `data-ending-style:` variants.
  
  Sources: UI:apps/docs/content/docs/react/styling-and-animation.mdx; UI:…/tooltip.mdx; UI:…/drawer.mdx.
- **Token bridge** (`emit-tokens --format ui-sdk`): map our roles onto `--ui-background/-foreground/-muted/-muted-foreground/-border/-input/-primary/-primary-foreground/-destructive/-ring/-ring-border/-overlay/-shadow/-radius/-spacing/-font-*` (UI:packages/core/skills/ui-sdk/references/styles.md). Their `--ui-spacing` defaults to `0.25rem`, the same 4 px base as our layout.spacing-scale. Emit `@layer ui-sdk;` at the top of the global CSS, which their skill requires. `web.css` has **no** duration or easing tokens (only two transitions; grep of UI:packages/core/src/web.css), so our motion tokens fill that gap directly.
- **At upgrade triggers when it's absent**, list ui-sdk as **one candidate**, strongest where Radix doesn't reach: Vue, Svelte, Solid or Web Components projects, or advanced behaviors (drawer snap, tree reorder, combobox, date segments, canvas). Always state the caveats:
  - **beta** (0.1.0-beta.2; npm `latest` = beta.1);
  - peers: React ≥ 19, Svelte ≥ 5.33, Vue ≥ 3.5 (Nuxt peers are optional), Solid ≥ 2.0.0-rc.14 (UI:packages/*/package.json);
  - size per entry, gzip, measured standalone so not additive: popover 31.9 KB, select 47.6 KB, combobox 50.7 KB, dialog 30.0 KB, toast 23.4 KB, tabs 18.3 KB, switch 12.9 KB (UI:size-budget.json; the units are gzip bytes per UI:scripts/size.mjs).

  This fits our "ask first with reason and size" rule.

#### (c) Skill-UX ideas to adopt (make finally-good-ui more welcoming)

1. **Fix the broken install links first.** README.md "See the [repository README](../README.md) and [INSTALL.md](../INSTALL.md)" points outside the repo, and there's no INSTALL.md (FGU root listing).
2. **One-line install via the skills CLI.** UI SDK: `npx skills add vercel-labs/ui --skill ui-sdk`, with `skills.sh.json` `{"paths":["./packages/core/skills"]}` pointing the CLI at a non-default folder (UI:skills.sh.json). Ours lives in `./skills/`. Test `npx skills add Stav-Sananes/finally-good-ui --list` (UNVERIFIED whether the CLI finds `./skills/*` without a skills.sh.json). Then list it next to the `claude plugin` install, so Cursor, Codex and other agents can use it. Caveat: our hook (`hooks/hooks.json`) and agents only work as a Claude Code plugin, so say what is lost.
3. **"Copy Prompt" setup.** ui-sdk.dev has a "Copy Prompt" button (landing page). The prompt installs packages, **adds a pointer note to AGENTS.md**, and adds the skill (UI:apps/docs/content/shared/setup-prompt/react.mdx). We could ship a paste-ready prompt in the README: "Set up finally-good-ui in this project: run detect, create `.design/config.json`, add a note to AGENTS.md/CLAUDE.md pointing at `.design/`, install Playwright + axe if missing (ask first)." Our `export` module already writes rules for other agents, so wire that in.
4. **Reassuring framing.** Their README says: "Don't worry, you don't need to learn how to write this. Your agents will. And we made them really good at it." (UI:README.md). Our README opens with philosophy and inventory counts ("88 canon cards", "19 detectors"). Lead instead with a 3-line "what you'll get in your first 10 minutes", one GIF or screenshot of the 3-direction compare page, and the three commands. Move the inventory lower.
5. **Example prompts.** Their skills doc teaches users how to ask: "Mention the skill, your framework, and the interaction you want", with a concrete 3-line prompt (UI:apps/docs/content/docs/agents/skills.mdx). Add 4–5 example asks to the README: new app, review my UI, polish this screen, is this AI-looking, extract my design system.
6. **"The person needs to → Use" table.** UI:…/references/build-interface.md maps jobs to components. Turn our recipes/INDEX "Pick by situation" into a full job-to-recipe table at the top. It's welcoming for non-designers and good for agent routing.
7. **A first-run choice instead of a cold start.** When `/finally-good-ui` runs with no `.design/` and no args, show "Pick your path" in 3 lines (new app / review an existing UI / polish a screen), each with its time cost, before the interview starts. This mirrors their numbered "Pick your path" plus "Every path ends the same way" (UI:…/SKILL.md).
8. **"When you're done" report contract.** Their hand-off rule: "Report each command you ran with its exit code, anything you couldn't check, and anything the docs or types got wrong" (UI:…/SKILL.md). Add the exit codes and the "couldn't check" list to our Hand-off step 8.
9. **Light and dark hero art.** Use `<picture>` with `prefers-color-scheme` SVGs (UI:README.md, assets/behaviors-{light,dark}.svg). A before/after gallery is already on our roadmap; make it the hero.
10. **A no-install path.** They serve `web.js` + `web.css` plus one-file docs (`/web.md`) for pages with no build step, like Artifacts. Our directions are already self-contained HTML. Advertise that `directions` works with no project at all, as a zero-setup taste test.
11. **Keep SKILL.md short and push detail into references.** Theirs is 56 lines with 7 references. Ours is 84 lines plus modules, so we're already close; keep it that way.

#### (d) WIG / web-design-guidelines rules not in our canon

How the skill works: `web-design-guidelines` (AS:skills/web-design-guidelines/SKILL.md) is a thin skill that **fetches `command.md` fresh from GitHub at review time** and outputs terse `file:line` findings. Rule text: WIG:command.md (the review checklist) and WIG:README.md (the long form). Coverage was checked by grepping FGU canon/, recipes/, modules/ and scripts/ (§5).

| WIG rule | FGU status | Proposed home |
|---|---|---|
| `…` not `...`; follow-up menu items end with `…` ("Rename…"); loading labels end with `…` | Recipes use "Saving…" but no canon rule; no detector | writing.* new card "typographic-punctuation" + check-static detector (`...` in JSX text) |
| Curly quotes; non-breaking spaces (`10&nbsp;MB`, `⌘&nbsp;K`) | M | same card |
| Numerals for counts ("8 deployments") | M | writing |
| `Intl.DateTimeFormat` / `Intl.NumberFormat`, no hardcoded formats; language from `Accept-Language`/`navigator.languages`, not IP; `translate="no"` on brand names and code | **M (no i18n canon at all)** | new `writing.locale-formats` or an `i18n` domain; detector for hardcoded date format strings |
| Locale-aware shortcuts, platform symbols (⌘ vs Ctrl) | M | usability (expert shortcuts card) |
| Hydration-safe inputs; guard date/time hydration mismatch; `suppressHydrationWarning` sparingly | M | build module / React notes |
| Tooltip timing (delay first, peers instant) | M | new tooltip recipe (§3a.4) |
| Minimum loading-state duration: show-delay ~150–300 ms **and min visible ~300–500 ms** | P (states.loading-perceived has the delay, not the minimum visible time) | amend states.loading-perceived |
| URL as state: filters, tabs, pagination, expanded panels deep-linked | P (ia-nav.wayfinding covers location URLs, not view state) | amend ia-nav.wayfinding-location or new card |
| Scroll position restored on Back/Forward | M | ia-nav / route-transition recipe |
| Warn before navigation with unsaved changes | P (settings-page recipe only) | flows-forms card |
| `overscroll-behavior: contain` in modals/drawers; desktop rubber-band `none` under `(pointer: fine)` | M | dialog recipe + sheet recipe |
| `touch-action: manipulation`; intentional `-webkit-tap-highlight-color` | P (button-press recipe only) | a11y.target-size or craft |
| Safe areas `env(safe-area-inset-*)` for full-bleed | P (app-shell recipe only) | layout card |
| Forms: `spellCheck={false}` on emails/codes/usernames; trim values; Enter submits / ⌘Enter in textarea; accept free text then validate; allow incomplete submit to surface errors; password-manager and 2FA paste; `autocomplete="off"` on non-auth fields | P (type/inputmode/autocomplete/paste covered in canon/usability; the rest missing) | flows-forms new card "input-ergonomics" |
| Checkbox/radio: label and control share one hit target, no dead zones | M | a11y.target-size |
| Autofocus only on desktop with a single primary input; rarely on mobile | M | flows-forms |
| Clean drag: disable text selection, `inert` on the dragged element | M | list-reorder recipe |
| Gestures have tap/click and keyboard alternatives (WCAG 2.5.7) | P (a11y.keyboard-complete judged mentions drag/hover) | make it a measured check |
| SVG animation: transform on `<g>` with `transform-box: fill-box; transform-origin: center` | M | motion.compositor-only note |
| Correct `transform-origin` | C (popover recipe, canon/motion) | — |
| Never `transition: all`; transform/opacity; reduced motion; interruptible; CSS > WAAPI > JS | C (canon/motion + check-static `no-transition-all`) | — |
| Autoplay >5 s needs pause/stop/hide | P (motion.reduced-motion cites WCAG 2.2.2 only as a source) | make it a principle and check |
| `scroll-margin-top` on anchored headings; skip link | P (skip link C; scroll-margin M) | a11y |
| `<img>` explicit width/height; lazy below the fold; `fetchpriority` above the fold | P (layout-shift ideas in states/skeleton; no image rule) | craft.real-imagery or a perf card |
| Virtualize large lists (WIG: >50 items) | P (data-table: TanStack Virtual above ~500 rows); thresholds differ | keep ours, but cite the WIG threshold as the lower bound |
| `preconnect`; preload critical fonts with `font-display: swap` | M | typography / build module |
| Native `<select>` explicit bg/color (Windows dark mode) | M | color.dark-mode-not-inverted check |
| `color-scheme` on `<html>`; `theme-color` meta matches background | P (color-scheme C; theme-color only exempted in check-static, not checked) | add a detector |
| Text containers handle long content (`truncate`, `line-clamp`, `min-w-0` on flex children); short/average/very-long UGC | P (states card checks overflow with stripped fixtures) | add "very long" fixtures to verify |
| Balance contrast in lockups (icon stroke weight vs text weight) | P (craft.real-imagery: one stroke width) | craft |
| Test with "Show scroll bars: Always"; ultra-wide at 50% zoom | M | verify module viewports |
| Hover/active/focus states increase contrast over rest | P | a11y / craft |
| Inline help first, tooltips last | P | ia-nav.progressive-disclosure |
| **Title Case for headings/buttons** | **Conflicts** with writing.action-labels "sentence case" | keep ours; log as a deliberate tension (NN/g, GOV.UK, Material use sentence case) |
| "Second person; avoid first person"; active voice | P (writing cards) | — |

Also from WIG, possible new **check-static detectors** (none of these exist among our 25 section ids):
- `...` in JSX/HTML text
- `onPaste` + `preventDefault` (canon mentions it; no detector)
- `<div|span onClick>` without role and key handling
- `<img>` without width/height
- `autoFocus`
- hardcoded `toLocaleDateString()` without a locale, or format strings like `MM/DD`
- `role="menu|listbox|tablist|slider|switch|tree"` on a non-native element with no keydown handler (UI SDK's rule, and it would have caught our own recipe)

Also from AS:
- `react-view-transitions` (AS:skills/react-view-transitions/SKILL.md) has a priority order: shared element, then Suspense reveal, then list identity, then enter/exit, then route. It also says to use no directional slides for lateral (tab-to-tab) navigation. Our route-transition and shared-element recipes could cite it for React ≥ 19 `<ViewTransition>`.
- `react-best-practices` (AS:skills/react-best-practices/rules/, 70 rule files) is performance-focused. The UI-relevant rules are `rendering-content-visibility`, `rendering-animate-svg-wrapper` and `rendering-hydration-no-flicker`. Out of scope beyond a citation.

#### (e) Optional: "agent-ready UI" card

UI SDK's novel idea: controls named for people are also named for agents, and the UI marks steps that need a person (UI:…/references/agent-ready.md). Its markers are `data-agent-confirm="<consequence sentence>"` on destructive or paying actions, `data-agent-secret`, and `data-agent-hidden`, with an agent test that snapshots every control and checks it has a unique label. A library-independent version of the useful part fits our canon as a check:
- every control has a **unique, verb-first accessible name**, so "Delete" vs "Delete project" collisions are flagged (their rule);
- destructive actions say their consequence in one sentence.

Only adopt the `data-agent-*` attributes when ui-sdk is present.

---

### 4. Details

#### 4.1 Packages, versions, numbers
- npm registry (`https://registry.npmjs.org/@ui-sdk%2F<pkg>`): all six packages have dist-tags `{latest: 0.1.0-beta.1, beta: 0.1.0-beta.2}`, were created 2026-11-12T17:05–17:06Z, and are licensed Apache-2.0.
- Weekly downloads (`https://api.npmjs.org/downloads/point/last-week/@ui-sdk%2F<pkg>`, 2026-11-07 to 11-13): core 33,348 · react 27,926 · web 2,047 · vue 1,064 · svelte 900 · solid 561.
- GitHub (`gh api repos/vercel-labs/ui`): stars 4,334, forks 122, created 2026-10-26, homepage https://ui-sdk.dev. Topics: accessibility, agent, aria, behaviors, headless, mcp, react, solid, svelte, vue, web-components, webmcp.
- `gh api repos/vercel-labs/agent-skills`: 34,055 stars, license null (README says MIT). `gh api repos/vercel-labs/web-interface-guidelines`: 1,176 stars, MIT.
- skills.sh search API (`https://skills.sh/api/search?q=…`): `vercel-labs/ui/ui-sdk` 1,233 installs; `vercel-labs/agent-skills/web-design-guidelines` 860,939 installs; no listing for finally-good-ui.
- Changelog UI:packages/core/CHANGELOG.md: beta.1 "Initial release". beta.2 fixes nested-modal inertness and cookie preference reads.
- Package exports (UI:packages/*/package.json): a per-component entry for each component (`@ui-sdk/react/select`, …); "There's no root import from a framework package" (SKILL.md). The React adapter also exports `./agent`, `./observe`, `./history`, `./gesture`, `./preferences`, `./primitive`.

#### 4.2 Behavior API shape (for §3b)
- **Primitive** (UI:README.md; UI:…/references/create-component.md): `definePrimitive({ name, state, api, slots, agent })`. Slots declare `attrs` (pure ARIA/`data-*`, server-safe), `press`, `on`, `bind` (DOM work with cleanup), `present`, and `role` on the slot, typed so roles must declare `focus`/`press`/`keys`. Changes go through `createChange(context)` with a **reason** from a shared vocabulary.
- **Rendering**: `createParts(primitive, { input: "input", clear: "button" })` from `@ui-sdk/<fw>/primitive` returns `Root` + parts, with the same parts in all five frameworks. Web components use `@ui-sdk/web` `createParts` with tag names and `wrappedChild`/`wrappedButton`. Adapters "only render: no key handlers, focus moves, ARIA or `data-slot`".
- **State API**: `defaultValue` or `value` + `onValueChange(value, details)`, where `details` has `{ reason, source: keyboard|mouse|agent…, cancel() }` (UI:…/references/build-interface.md §3).
- **Styling**: `data-slot` names (`switch`, `switch-thumb`) and state attributes (`data-open`, `data-pressed`, `data-disabled`, `data-side="top"`, `data-highlighted`, `data-checked`, `data-instant`, `data-swiping`). CSS vars include `--anchor-width`, `--available-height`, `--transform-origin`, `--toast-swipe-x/y` and `--panel-height`. "Never inline styles for state, and never generated ids" (SKILL.md).
- **Animation contract** (UI:apps/docs/content/docs/react/styling-and-animation.mdx): "Popup content gets `data-starting-style` before it enters and `data-ending-style` while it exits. The content stays mounted until its exit transition or animation finishes." Their example uses literal `duration-150` and `scale-96`; we'd swap in tokens. `keepMounted` exists for animation libraries that manage their own presence.
- **Motion helpers** (UI:apps/docs/content/docs/core/behaviors/motion.mdx): "Motion here follows state … Someone who prefers reduced motion gets the end at once." Also: "To slide items into new places, use CSS, View Transitions or a motion library", so FLIP/layout motion is explicitly left to us. Gesture math: `@ui-sdk/core/gesture` (`createVelocityTracker`, `projectDistance`, `solveSpring`, `rubberBand`, `sectorOf`).
- **CSS layer**: behavior CSS is injected in `@layer ui-sdk`; apps must declare `@layer ui-sdk;` first. CSP nonce via `<meta property="csp-nonce">`.
- **web.css tokens** (UI:packages/core/src/web.css lines 1–41): oklch neutrals via `light-dark()`, `--ui-radius: 0`, `--ui-spacing: 0.25rem`, `--ui-font-size: 0.8125rem`. No duration or easing variables.

#### 4.3 The installed SKILL.md (UI:packages/core/skills/ui-sdk/SKILL.md, 56 lines)
Structure:
1. Frontmatter description: "Use whenever a project has @ui-sdk/* installed or the user mentions ui-sdk."
2. A one-paragraph identity.
3. **Read first**: version-matched docs in `node_modules/@ui-sdk/<framework>/docs/llms.txt`. "Read only the pages your task needs … Don't read the whole `docs/` folder; it's large." `core.md` is "over 300 KB", so search it by heading. "Don't read compiled JavaScript in `dist/*.js` … when they don't answer, write a small test that tries it."
4. **Pick your path** (1 use components → build-interface.md; 2 build one → create-component.md). "Every path ends the same way: 3. Make it agent-ready … 4. Test it."
5. **Rules for every path**: 11 bullets (import from entries, one shape, default or controlled, name every control, style from state, declare the layer, check color 4.5:1 and 3:1, key by id, RTL needs no provider, comments are rare, don't hand-roll what we ship).
6. **When you're done**: typecheck (with a tsconfig `files: []` gotcha), tests, a comment purge, and "Report each command you ran with its exit code, anything you couldn't check, and anything the docs or types got wrong or left out."

References (7): build-interface.md (187 lines), create-component.md (88), agent-ready.md (136), testing.md (172; includes "Break it on purpose" mutation check and real-browser contrast), patterns.md (246; tested snippets), styles.md (66), web-components.md (78).

What makes it pleasant:
- tiny entry file and pick-a-path routing;
- docs pinned to the installed version;
- concrete gotchas ("for money, `step={0.01}`");
- a job→component table;
- a verifiable finish line (an agent test that every control is named).

Also in the repo but internal, not installed (`metadata.internal: true`): `.agents/skills/ui-sdk-unslop` is a code-slop remover. It deletes narrating comments, sales words ("Robust", "seamless", "simply", "leverage"…) and defensive checks for impossible cases. It's close in spirit to our slop-check, but for code rather than UI.

#### 4.4 Onboarding surfaces
- README (UI:README.md): beta badge text, a light/dark `<picture>` hero ("An environment selector split into three behaviors: createPopup, createSelection and createTypeahead"), install, the skill line, one example shown in all 5 frameworks.
- Landing page (https://ui-sdk.dev/, fetched 2026-11-14): a "/wait-what" narrative. "Say we give an agent a Select component … what if, instead, we gave it the pieces that make up a Select?" Then an animated breakdown into 3 behaviors, "We built 50+ behaviors for your agents", "How do I use behaviors to build components? You don't. Ask your agent.", a live component gallery, and **Read the Docs / Copy Prompt** buttons.
- Root `llms.txt` (https://ui-sdk.dev/llms.txt) routes agents by task: build, render, operate.

#### 4.5 Coverage evidence (FGU greps, 2026-11-14, b7e3bec)
Zero hits across canon/ recipes/ modules/ scripts/ rubric/ templates/ tokens/ interview/ for: `curly`, `nbsp|non-breaking`, `spellcheck`, `scroll restor…`, `overscroll`, `Intl.`, `translate="no"`, `hydration`, `transform-box`, `scroll-margin`, `virtualiz`, `preconnect|preload`, `autofocus`, `dead zone`, `typeahead`, `aria-disabled`, `focus recovery`, `carousel`, `slider`, `date picker`, `hover card`, `menubar`, `file input`, `find-in-page|until-found`, `visualViewport|on-screen keyboard`, `long press`, `lasso`. Positive control: the same loop found `prefers-reduced-motion` in 20 files and `transition: all` in 9, so the grep works.

check-static detector ids (FGU scripts/check-static.mjs; 25 section ids including the `motion` header): motion, no-transition-all, animate-layout-prop, long-duration, ease-in-entrance, scale-from-zero, hardcoded-color, off-scale-spacing, outline-none-no-focus, img-no-alt, user-scalable-no, dead-control, placeholder-code, placeholder-content, gradient-text, purple-blue-gradient, glass, colored-glow, bg-pattern, blurred-orb, fake-terminal, ai-icon, decorative-pulse, eyebrow-overuse, viewport-100vh.

#### 4.6 UNVERIFIED / caveats
- "50+ behaviors" is a marketing figure from the landing page. My count is about 120 exported helpers in the behaviors index (UI:…/core/behaviors/index.mdx), of which about 50 are `create*`/`bind*` behaviors proper.
- Download numbers cover about 2 days after publish, so they aren't a steady-state weekly rate.
- Whether `npx skills add Stav-Sananes/finally-good-ui` works without a `skills.sh.json` wasn't tested.
- Per-entry size numbers are standalone gzip minus a bare app. Shared core means two entries cost less than their sum; the overlap wasn't measured.
- The legal reading of Apache-2.0 §4 for "ideas vs expression" is not legal advice.
- vercel.com/design/guidelines returned HTTP 200 but wasn't parsed. Rules were taken from the WIG repo, which the web-design-guidelines skill itself fetches (`raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`).

---
