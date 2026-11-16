# Step 5: System (tokens + motion language)

Goal: turn the chosen direction (or the confirmed existing brand) into **one source of truth**, `.design/tokens.json`, and emit it into the stack's native format. After this step, no raw colour, size, duration or easing values are allowed in components.

## 1. Choose the starting point
| Situation | Start from |
|---|---|
| Existing brand confirmed in step 1 | `.design/tokens.json` from extraction; fill gaps only |
| Design tokens exported from Figma (variables, one file per mode), Tokens Studio, Terrazzo or Style Dictionary sources | `node "${CLAUDE_SKILL_DIR}/scripts/import-tokens.mjs" --in <light.json> [--dark <dark.json>]` (a Tokens Studio file with sets, or a `*.resolver.json`, needs only `--in`). Then fix the report: add the `missingRoles` as aliases of imported colours (`"background": {"$value": "{color.neutral-50}"}`), place or drop `unmapped` tokens, and treat `filledFromDefaults` groups as defaults to adjust. Fill gaps only; the imported values are the brand |
| Direction chosen in step 4 | The direction's spec (palette, type, motion personality) |
| Directions skipped, no brand | `tokens/default.tokens.json`, then adjust using the brief's personality cards |

## 2. Build the tokens (DTCG subset)
- **Contract:** W3C DTCG 2025.10, as in `tokens/default.tokens.json` + `default.tokens.dark.json` + `default.tokens.resolver.json`. Groups as in that file (`color`, `font`, `text`, `tracking`, `space`, `radius`, `shadow`, `duration`, `easing`; `GROUPS` in `scripts/lib/tokens.mjs` is authoritative); each token is `{"$type","$value","$description"?}`; `{color.primary}` aliases are allowed. `emit-tokens.mjs --help` lists the CSS variables emitted (`--color-*` … `--ease-*`).
- **Writing it:** it is easiest to draft `.design/tokens.json` with CSS strings (`"oklch(0.5 0.14 262)"`, `"0 1px 2px 0 oklch(…)"`) and each dark value in `$extensions.fgu.dark`. Then normalise once: `node "${CLAUDE_SKILL_DIR}/scripts/emit-tokens.mjs" --in .design/tokens.json --format dtcg --out-dir .design --force`. That rewrites `tokens.json` in the standard shape and adds `tokens.dark.json` and `tokens.resolver.json`. Every script keeps taking `--in .design/tokens.json` and finds the dark values through the resolver. To change a value later, edit the standard files directly (dark values live in `tokens.dark.json`).
- **Colour**
  - Semantic pairs, never raw hues in components: `background/foreground`, `card/card-foreground`, `primary/primary-foreground`, `muted/muted-foreground`, `accent/accent-foreground`, `destructive/destructive-foreground`, `border`, `input`, `ring`.
  - Add `success`, `warning` and `info` pairs if the blueprint has status UI (`data.status-encoding`).
  - `overlay` is the scrim behind dialogs and sheets (translucent in both themes); recipes use `var(--color-overlay)`, never a literal.
  - **Tonal scales** only when the stack wants them (Mantine, Prime, Chakra/Panda, Skeleton, Nuxt UI custom colours, Radix Themes, Fluent): `node "${CLAUDE_SKILL_DIR}/scripts/color-scale.mjs" "<primary>" --preset tailwind|mantine|radix|fluent [--format css --name primary]`. The seed lands exactly on its nearest step (Radix: step 9), so the scale and the semantic pair agree. Components still use the semantic roles.
  - **Chart series** `chart-1` … `chart-8` when the blueprint has charts (`data.chart-palette`): an ordered categorical set, designed separately for dark, never the status or brand colours. Start from the defaults' hue order, retune lightness and chroma to the theme, then run `node "${CLAUDE_SKILL_DIR}/scripts/check-palette.mjs" --in .design/tokens.json` until `ok` is true (3:1 on the background, colour-blind separation). They emit as `--color-chart-N` (shadcn: `--chart-N`).
  - **Custom roles are allowed.** Any colour name you add is emitted as `--color-<name>` in every format. Name it by role, not hue. The common one: when actions are ink on a near-neutral canvas (`craft.ink-and-accent`), `primary` is the ink and the identity colour that marks meaning (new, selected, the motif) gets its own role such as `mark` + `mark-foreground`. `accent` stays the hover/selected-row tint (shadcn sense), not a brand colour.
  - Generate from 3 inputs: **base** (neutral hue and temperature), **accent**, **contrast level** (`color.role-scale`, `color.contrast-by-construction`).
  - Neutrals take a slight tint of the accent hue.
  - Dark values are designed rather than inverted (`color.dark-mode-not-inverted`); they end up in `tokens.dark.json`.
- **Check every text pair on every surface level** in both themes: each text role (`foreground`, `muted-foreground`, `primary` as text, status colours) on the canvas (`background`) **and** on every raised surface the blueprint uses: `card`, popover/menu, sheet/dialog, `muted` fills, selected/hover rows (`accent`). Dark-mode surfaces get lighter as they rise (`craft.tinted-shadows`), so a pair that passes on the canvas can fail on a popover.
  `node "${CLAUDE_SKILL_DIR}/scripts/lib/contrast.mjs" <fg> <bg>`
  Body text needs at least 4.5:1, large text and UI at least 3:1 (`a11y.contrast-minimums`). Fix the value, not the rule.
- **Type**
  - Families: at most 2 plus mono (`typography.limited-families-weights`).
  - **A chosen face must load.** Put it first in the font token's list, keep the system fallbacks after it, and say how it loads: `"$extensions": {"fgu": {"load": {"source": "google", "weights": "100 900"}}}` (a weight range = variable font; a list such as `[400, 600]` = static weights; `"source": "local"` with `"files": [{"path": "fonts/x.woff2", "weight": "100 900"}]` for licensed files). Prefer variable fonts. The emitted variable becomes `var(--font-<name>-loaded, "<Face> Variable", <Face>), <fallbacks>`, which works with every loader.
  - Scale: from the direction, or 12/14/16/18/20/24/30/36/48/60.
  - Body size follows density and audience: **16px** by default (consumer, mixed or beginner audiences, reading-heavy screens, phone-first, AAA/low-vision needs); **13–14px** only when the brief resolves to dense expert daily use (`personality.dense-expert`, `data.tension-density-clarity` → density). Either way, form inputs stay ≥ 16px on mobile (`a11y.target-size`) and no readable text goes below 12px.
  - Line-height 1.4–1.6 for body, tighter for display.
- **Icons**: `icon.sm` / `icon.md` / `icon.lg` are box sizes about 1.15–1.25× the text beside them (16 with 14px text, 20 with 16px, 24 standalone); `icon.stroke` follows the direction's weight (1.5 calm, editorial or luxurious; 2 default; up to 2.5 playful or raw) and should match the type's stroke weight. Wire them per the stack profile's `icons.api` (table in step 4). One set per app (`craft.real-imagery-and-icons`).
- **Space**: a 4-based scale (`layout.spacing-scale`).
- **Radius and shadow**: one radius family and one elevation system. Radius shows personality (tight means serious or dense; soft means friendly).
- **Motion**: see below.

## 3. Motion language
Start from the `duration` and `easing` groups in `tokens/default.tokens.json` (durations instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 600 ms; easings enter, enter-emphasized, exit, move, snappy, linear). Then set them from the brief:

| Brief says | Axis position | Adjust |
|---|---|---|
| Daily tool, experts, dense | productive | durations toward micro/short; easing `enter`/`move`; springs bounce 0; almost no ambient motion |
| Mixed / general consumer | balanced | defaults |
| Rare use, emotional, marketing, onboarding | expressive | allow `enter-emphasized`, `long` for hero moments, spatial springs bounce up to 0.2–0.3 |

Write a **Motion** section into `.design/brand.md` with:
- **Spatial map:** which navigations move forward (drill-in), which reverse (back), which crossfade (peer tabs) (`motion.spatial-continuity`).
- **Budget per screen type**, from frequency of use (`motion.frequency-budget`): e.g. "Inbox list: press feedback only. Onboarding: staggered entrance plus an expressive moment."
- **The expressive moments, at most three** (`motion.one-signature-moment`): where each is and why that place; each runs once per session or task, up to `--duration-hero`.
- **Reduced-motion policy:** keep opacity and colour, drop translation and scale (`motion.reduced-motion`).

## 4. Emit to the stack
```
node "${CLAUDE_SKILL_DIR}/scripts/emit-tokens.mjs" --in .design/tokens.json --format <fmt>
```
| Stack profile | Format | Where it goes |
|---|---|---|
| Tailwind v4 | `tailwind4` | the main CSS entry (e.g. `app/globals.css`), replacing or merging the `@theme` block |
| Tailwind v3 | `css` + `tailwind3` | CSS variables in the global CSS, and `theme.extend` in `tailwind.config` |
| shadcn (any port: shadcn-vue, shadcn-svelte, Spartan; Tailwind v4) | `shadcn-registry`, or `shadcn` | Preferred: save the registry output as `finally-good-ui-theme.json` and run `npx shadcn add ./finally-good-ui-theme.json`; the shadcn CLI merges the variables into the file named by `components.json` `tailwind.css`. Or paste `shadcn` output there, replacing its `:root`, `.dark` and `@theme` blocks. Either way shadcn's own names stay (`--primary`, `--radius`…), and `popover`/`secondary`/`sidebar` fall back to `card`/`muted` unless you define them. The stack profile's `shadcn.base` (`radix`, `base`, `aria`) says which state attributes animate. |
| daisyUI v5 (`components: "daisyui"`) | `daisyui` | the main CSS after `@plugin "daisyui"`: two themes, `fgu-light` (default) and `fgu-dark` (follows the OS). For a manual toggle set `data-theme="fgu-dark"` on `<html>` and set `.design/config.json` `theme` to `{"attribute": "data-theme"}`. daisyUI's `accent` is a brand colour: define a `mark` role if `primary` is ink |
| Chakra UI v3 (`components: "chakra"`) | `chakra` | `src/theme.ts`, passed as `<ChakraProvider value={system}>`. Semantic colours carry `{base, _dark}`; Chakra's `bg`/`fg`/`border` point at our roles; use `colorPalette="brand"` for primary-coloured components (the brand palette is a scale built from `primary`) |
| Panda CSS v2 (`styling.panda`) | `panda` | a preset file added to `panda.config` `presets` after `@pandacss/preset-base`; same theme as Chakra |
| Mantine v9 (`components: "mantine"`) | `mantine` | `src/theme.ts`, used as `<MantineProvider theme={theme} cssVariablesResolver={resolver}>`. The brand palette is 10 hex shades built from `primary` (Mantine's colour helpers need hex); `primaryShade` points at the shades nearest our light and dark primary. Mantine's body/text/border variables and ours (`--color-*`) come from the resolver per scheme |
| Ant Design v6 (`components: "antd"`) | `antd` | `src/theme.ts`; `<ConfigProvider theme={themeFor(isDark, theme)}>` with `theme` from `antd`. antd normally derives dark mode by algorithm; ours passes the designed dark values on top of `darkAlgorithm`, so both themes stay ours. Seeds are hex, sizes px numbers, durations seconds |
| PrimeVue / PrimeNG / PrimeReact styled mode (`components: "primevue"` etc.) | `prime` | `src/theme/preset.ts`, registered as `theme: { preset: FguPreset, options: { darkModeSelector } }` (set the selector to the app's toggle: `.dark`, or `system`). One file serves all three. Unstyled mode + Tailwind: treat Prime as a primitive library and use `tailwind4` |
| Angular Material (`components: "angular-material"`) | `angular-material` | the global `styles.scss`: one `mat.theme` call whose `$overrides` set M3 system colours with `light-dark()`, so `color-scheme` switches themes (`.dark`/`.light` force one). Our variables sit on `:root` for custom components |
| shadcn on Tailwind v3 | `css` + `tailwind3` | merge into the existing `:root` / `.dark` variables, keeping shadcn's names |
| MUI (`components: "mui"`; `joy` is on hold upstream, so build Joy projects the same way) | `mui` with `--mui-scheme` matching the app's theme toggle (`media` default, `class`, `data`, or a selector) | `theme.ts` via `createTheme`. The output turns on CSS theme variables (`cssVariables`), so light and dark both come from the same theme. From v9 (`componentsVersion` ≥ 9) Box, Stack, Grid and Typography no longer take system props: style with `sx` |
| Stack profile `tokensPipeline` set (Terrazzo or Style Dictionary already builds the tokens), or the team asks for one | `terrazzo` or `style-dictionary` (matching `tokensPipeline.tool`), plus `--tailwind` when `styling.tailwind` is `v4`; writes files, prints no stylesheet | The token sources go to `--out-dir` (default `tokens/`) and `terrazzo.config.mjs` / `sd.config.mjs` to the project root; install the packages the report's `install` lists and add its `build` command to the build. The pipeline then writes the CSS (`css` in the report: import it first, dark file after light) with the same variables as `css`/`tailwind4`. From then on the pipeline sources are the token set: pass `--in tokens/tokens.json` to every script and never hand-edit the generated CSS. If the project already has a config, keep it and point its sources at ours instead of adding a second one |
| React Native, `native.styling: "uniwind"` (also react-native-reusables and gluestack on Uniwind) | `uniwind` | `global.css` after `@import 'tailwindcss'; @import 'uniwind';`. Colours sit in `@variant light` / `@variant dark` (Uniwind follows the device; `Uniwind.setTheme()` overrides), sizes in `@theme`. Values are literal: sRGB hex/rgba (React Native has no OKLCH), px, and each text step's line-height and letter-spacing in px |
| React Native, `native.styling: "nativewind"` (v4, also react-native-reusables on it) | `nativewind` | the `:root` / `.dark:root` variables into `global.css` (outside `@layer base`), `theme.extend` merged into `tailwind.config.js` with `darkMode: "class"`; colours are `R G B` channels so `bg-primary/90` works. NativeWind follows the device; `colorScheme.set()` overrides. `nativewind-v5` is a release candidate: tell the user and use `uniwind` or v4 until it is stable |
| React Native, `native.styling: "tamagui"` | `tamagui` | `tamagui.config.ts` (Tamagui 3): the `@tamagui/config/v6` defaults with our space and radius tokens, and our colours in the `light` / `dark` themes under Tamagui's keys (`background`, `border-color`, `color`…) and our role names (`$primary`, `$card`). Sub-themes keep Tamagui's values; Tamagui 1.x/2.x need camelCase keys (`backgroundHover`) |
| React Native, `native.styling: "unistyles"` | `unistyles` | `unistyles.ts` (Unistyles 3), imported once before any `StyleSheet.create`: typed `light` / `dark` themes (`colors`, `shadow`, `space`, `radius`, `text`, `duration`) following the device |
| React Native with plain `StyleSheet` | `unistyles` as the model, or `json` | a `theme.ts` exporting the two theme objects from the `unistyles` output, picked with `useColorScheme()`; components read `theme.colors.primary`, never literals |
| React Native with `animation` containing `reanimated` | `rn-motion` (in addition) | `src/theme/motion-tokens.ts`: `duration`, `ease` (Reanimated 4 CSS transitions), `easing` (`withTiming`), `timing()` and `transition()`; pass `useReducedMotion()` to `transition()`. `moti-unmaintained`: animate with Reanimated directly. Fonts on native load with `expo-font`; register each loaded face under its first family name |
| Flutter (`framework: "flutter"`) | `flutter` | `lib/theme/app_theme.dart`; `MaterialApp(theme: AppTheme.light, darkTheme: AppTheme.dark, themeMode: ThemeMode.system)`. Our roles fill the Material 3 `ColorScheme` (surface tint off, so surfaces keep our colours instead of Material's primary wash); `Theme.of(context).extension<AppColors>()!` has the rest (success, warning, chart…); `AppSpace`, `AppRadius`, `AppMotion` are constants, and `AppMotion.duration(context, …)` returns zero for movement under reduced motion. A loaded font is registered in `pubspec.yaml` (or `google_fonts`) under its family name. Components read these, never `Colors.*` or literal numbers |
| SwiftUI (`framework: "swiftui"`) | `swiftui --out-dir <app target folder>` (writes files) | `DesignTokens.xcassets` (a colour set per role under the `Tokens` namespace, light + dark appearance, sRGB) and `DesignTokens.swift`; add both to the target. Views read `Palette.primary`, `Space.s4`, `Radius.md`, `.textStep(.lg)` (scales with Dynamic Type) and `Motion.animation(.move, Motion.standard, reduceMotion:)` with `@Environment(\.accessibilityReduceMotion)`; never `Color.blue` or literal numbers. Shadows aren't exported (SwiftUI takes one shadow per modifier): use `.shadow(color: Palette.foreground.opacity(0.08), radius: 8, y: 4)` sparingly |
| Jetpack Compose (`framework: "compose"`) | `compose --out-dir <app>/src/main/java/<package path>/ui/theme --package <package>.ui.theme` (writes files) | `Color.kt`, `Type.kt`, `Theme.kt`, `Tokens.kt`, the files Material Theme Builder exports. Wrap the app in `AppTheme { }` (follows the system dark setting); our roles fill the Material 3 `ColorScheme` (surface tint off, no dynamic wallpaper colour: the palette is the design); `AppTheme.extendedColors` has the rest; `Spacing.s4`, `Radius.md`, `Motion.spec(Motion.standard, Motion.move, rememberReducedMotion())`. A loaded font goes under `res/font` and into `AppFontFamily` |
| Anything else / plain | `css` | `tokens.css`, imported first |
| Stack profile `interaction` lists `sonner`, `cmdk`, `react-day-picker` or `vaul-unmaintained` | `adapters --libs <those names>` (in addition) | `motion-adapters.css`, imported once: those libraries hard-code their motion, and this makes them use `--duration-*`/`--ease-*` |
| Stack profile `charts` lists a canvas library (`echarts`, `chartjs`, `ag-charts`, `uplot`, Nivo canvas components) | `chart-theme` (in addition) | `src/lib/chart-theme.js`; see recipes/patterns/chart.md. SVG chart libraries use `var(--color-chart-N)` directly |
| Any font token has `$extensions.fgu.load` | `fonts --loader <stack profile fonts.loader>` (in addition) | `next`: `app/fonts.ts` + the classes on `<html>` (next/font self-hosts and sizes the fallback); `nuxt`: the `fonts` block in `nuxt.config.ts`; `fontsource`: the `npm install` line and imports in the app entry (self-hosted, no third-party request); `google`: the `<link>` tags in `<head>` (plain HTML only; it sends visitors' IPs to Google) |
| Stack profile `tables: "ag-grid"` | `ag-grid` (in addition) | `src/lib/grid-theme.ts`, passed as the grid's `theme`; its parameters are our variables, so dark mode follows |
| Any stack that animates from JS (Motion, WAAPI, Svelte/Vue transitions) | `js` (in addition) | `motion-tokens.js` next to the components; re-emit whenever `tokens.json` changes |

**Kits and engines detected but with no format of their own yet.** Emit `css` (our `--color-*` variables on `:root`/`.dark`), then point the kit's own variables at ours in its theme file, so `tokens.json` stays the one source. Use `json` when the kit needs literal values, and `color-scale.mjs` when it needs a tonal scale.
| Stack profile | How to wire it |
|---|---|
| `vuetify` | `createVuetify({ theme: { defaultTheme: 'system', themes: { fguLight: { dark: false, colors }, fguDark: { dark: true, colors } } } })`. Vuetify parses colours itself, so give it hex values (the `hex` of each colour in `tokens.json`): `background`, `surface` ← card, `primary`, `error` ← destructive, `success`, `warning`, and `on-*` from the `-foreground` pairs |
| `nuxt-ui` | in the main CSS, `:root { --ui-primary: var(--color-primary); --ui-bg: var(--color-background); --ui-bg-elevated: var(--color-card); --ui-bg-muted: var(--color-muted); --ui-text: var(--color-foreground); --ui-text-muted: var(--color-muted-foreground); --ui-border: var(--color-border); --ui-error: var(--color-destructive); --ui-radius: var(--radius-md); }` (and the same under `.dark`), plus `@theme static { --ease-out: var(--ease-enter); }`, which drives its enter/exit animations |
| `heroui` (v3, `componentsVersion` ≥ 3) | the shadcn mapping under HeroUI's names: `--accent` ← primary, `--surface` ← card, `--overlay` ← card, `--danger` ← destructive, `--focus` ← ring, `--field-border` ← input, `--ease-out-fluid` ← our enter easing. v2 is a Tailwind plugin (`heroui({ themes })`): pass the `json` values there |
| `skeleton` | a theme CSS file activated by `data-theme`: `--color-primary-50…950` from `color-scale.mjs <primary> --name primary --format css` (repeat for each role it uses), `--radius-base` ← radius.md |
| `flowbite` | after the Flowbite theme import, `@theme { --color-brand: var(--color-primary); --color-fg-brand: var(--color-primary); }`, plus the `tailwind4` output for everything else |
| `preline` | its `theme.css` names (`--primary`, `--background`, `--foreground`, `--muted`, `--border`, `--card`, `--layer`) on `:root`/`.dark` pointed at ours |
| `fluent` | `createLightTheme(brand)` / `createDarkTheme(brand)` with a 16-stop brand from `color-scale.mjs <primary> --preset fluent`, then spread our `durationNormal`, `curveDecelerateMid`, `borderRadiusMedium` and `fontFamilyBase` over it |
| `carbon` | adopted for IBM's design language, so don't restyle it: keep its themes and use our tokens only for screens Carbon doesn't cover |
| `styling.unocss` | `css`, then `theme: { colors: { primary: 'var(--color-primary)', … }, radius, ease, font }` in `uno.config` (preset-wind4 names: `radius`, `ease`, `font`, `text`) |
| `styling.stylex` | one `tokens.stylex.ts` with `stylex.defineVars` per group, values from `json`; dark values under the `'@media (prefers-color-scheme: dark)'` key |
| `styling.vanillaExtract` | `createGlobalTheme(':root', vars, light)` and `createGlobalTheme('.dark', vars, dark)` in `theme.css.ts`, values from `json` |

**Icons** (stack profile `icons`: `{lib, package, api}`); the variables come from `css` / `tailwind4`:
| `icons.api` | Libraries | Wiring |
|---|---|---|
| `stroke` | lucide, tabler, hugeicons, solar | Lucide and Tabler in global CSS: `svg.lucide, svg.tabler-icon { width: var(--icon-md); height: var(--icon-md); stroke-width: var(--icon-stroke); }` plus `.icon-sm`/`.icon-lg` classes for the other sizes (CSS beats their `size` props, so size icons by class from then on). Hugeicons and Solar: pass `strokeWidth` with the token's number through `SolarProvider` or one wrapper component |
| `weight` | phosphor | `<IconContext.Provider value={{ weight }}>` with weight from the stroke token: ≤ 1.25 `thin`, 1.5 `light`, 2 `regular`, ≥ 2.5 `bold`; size by CSS on the icon's class or `size="1.25em"` |
| `fixed-grid` | heroicons, radix-icons, remix | drawn per size, so pick the drawing nearest the token: Heroicons `24/outline` at `icon.lg`, `20/solid` at `icon.md`, `16/solid` at `icon.sm`; Radix Icons at 15px only (off-grid sizes blur); Remix scales freely. No stroke control: keep the set's own weight in mind when choosing it |
| `font-axes` | material-symbols | `.material-symbols-outlined { font-size: var(--icon-md); font-variation-settings: "wght" W, "opsz" P; }` with W = 300 / 400 / 500 for stroke 1.5 / 2 / 2.5 and P = the icon size clamped to 20–48 |
| `em` | iconify, unplugin-icons, react-icons | they size to `1em`: set `font-size: var(--icon-md)` on the icon or its wrapper; stroke follows the chosen icon set |
Tailwind v4: `size-(--icon-md)` sizes an icon from the token.

If dark mode is applied by attribute, class or localStorage rather than `prefers-color-scheme`, or the app is dark by default, replace `"theme": "media"` in `.design/config.json` with an object saying how (see `check-flows.mjs --help`, e.g. `{"attribute": "data-theme", "storage": "theme", "default": "dark"}`) so the flow walk renders both schemes for real.

**Merge, never clobber.** Show the diff for the existing theme files and keep any unrelated variables.

## 5. Record
Append the decisions (palette inputs, type pairing, scale, radius, motion position) to `.design/decisions.md`, with card ids. Then continue to build.
