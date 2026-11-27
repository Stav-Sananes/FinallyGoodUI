# Adapter: React (also Next)

The scaffold writes `<Name>.tsx` (or `.jsx`) with `import "./<name>.css"`, and `<name>.behaviour.js` when no primitive is wired.

## Props and events
- Spec props become camelCase destructured props with the spec default (`variant = "primary"`); the rest goes to `...rest`, spread last on the root. Type it as the props plus `Omit<ComponentPropsWithoutRef<"button">, ...>` so native props and `onClick` pass through.
- Events stay native (`onClick`). Do not wrap them in `onPress` aliases.

## State attributes
- A state prop sets its attribute: `aria-busy={busy ? "true" : undefined}`, boolean attributes pass the boolean (`disabled={disabled}`). Value props go to `data-*` (`data-variant`).
- With a primitive wired, the scaffold adds `onClickCapture` that stops a click while `busy`; the control stays focusable.

## Slots and children
- Default slot is `children`; named slots are `ReactNode` props in camelCase (`icon`). Optional parts render only when passed (`{icon ? <span data-part="icon" aria-hidden="true">{icon}</span> : null}`). Always-present parts (spinner) always render; the CSS toggles their opacity from the state attribute, so the control keeps its width.
- Every spec part keeps its `data-part`.

## Behaviour source
1. Project already has a primitive library: wire the spec's parts, states and tokens onto it. The scaffold knows Radix (`Primitive` from `@radix-ui/react-primitive`; the unified `radix-ui` package has no `Primitive` export, so with only that installed the scaffold uses the shared script) and Ark (`ark` from `@ark-ui/react/factory`), which wrap any tag; Base UI (`Button` from `@base-ui/react/button`), React Aria (`Button` from `react-aria-components`) and Headless UI (`Button` from `@headlessui/react`), which are button-only. Other libraries: wire by hand the same way.
2. Nothing installed (or the primitive does not fit the tag; primitives are wired for the button only, every other component always uses the shared script): import `attach` from `./<name>.behaviour.js` and call it from an effect on the root ref: `useEffect(() => (ref.current ? attach(ref.current) : undefined), [])`. `attach` returns the cleanup.
3. Never rewrite the behaviour as a custom hook of your own.

Checker: no `onKeyDown`/`onKeyUp` for a spec'd key (Enter, Space, Escape, arrows); the primitive or `attach` owns them.

## Motion
Rules: `recipes/INDEX.md`; per-library state hooks: `recipes/motion/headless-primitive-motion.md`. Baseline is CSS: transitions on `transform`/`opacity`, `@starting-style` for enter, tokens only, reduced-motion block. Reach for `motion` (`motion/react`, `LazyMotion` + `m`) only at the recipe's upgrade trigger, after asking, with `sec()`/`ease()` from the generated motion-tokens. In a view transition project use `recipes/motion/react-view-transition.md`.

## Generated files
Every component is written whole: parts, props, slots and the `attach` effect (`useEffect(() => attach(ref.current), [])`); the scaffold never leaves an empty skeleton, and `check-components` fails one (`empty-skeleton`). In a TypeScript project `<name>.behaviour.d.ts` is written next to the script, so the `.js` import type-checks without `allowJs`. `ref`, `attach` and the programmatic API (`open` on dialog) are generated; pass native props through `...rest`.

## Controlled values and callbacks
- `field` and `toggle` spread their native props on the input: control them as usual with `value` + `onChange` (or `defaultValue`, `defaultChecked`). The `checked` prop is the initial state (`defaultChecked`).
- `dialog`: `open` plus `onOpenChange(false)` when it closes (Escape, close button, form submit); the native `onClose` still passes through. `tabs`: `selected` plus `onSelectedChange(index)`. `toast`: `onDismiss(id)` then remove the toast. The menu trigger uses React 19's `popoverTarget`.
- `field` takes `multiline` (+ `rows`) for a textarea; its `error` prop wins over the built-in validation message while it is non-empty.

Round 6: `toast-store.tsx` holds `ToastProvider` (renders the region, owns the list) and `useToast()` (`push(toast)` returns the id, `dismiss(id)`). Toast `onAction(id)` and `onDismiss(id)` both get the id. Toggle: pass `checked` + `onChange` to control it, or `defaultChecked` to leave it uncontrolled. Dialog's form is `noValidate` unless `nativeValidation`; field `hideLabel`.
