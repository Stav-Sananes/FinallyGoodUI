# Adapter: Svelte (also SvelteKit)

Assumes Svelte 5 (runes, snippets): the scaffold writes `<Name>.svelte` with `$props()`, `{@render}` and `onclick`-style attributes. For Svelte 4, translate to `export let` and `<slot>` by hand.

## Props and events
- `let { variant = "primary", busy = false, icon, children, ...rest } = $props();` camelCase names, spec defaults. `{...rest}` goes last on the root.
- Events are plain attributes (`onclick`), passed through `rest`. No `createEventDispatcher`.

## State attributes
- `aria-busy={busy ? "true" : undefined}`; booleans bind directly; value props go to `data-variant={variant}`.
- With a primitive wired, the scaffold adds `onclickcapture` that stops the click while busy.

## Slots and children
- Default slot is the `children` snippet: `{@render children?.()}`. Named slots are snippet props: `{#if icon}<span data-part="icon" aria-hidden="true">{@render icon()}</span>{/if}`. Keep each `data-part`.

## Behaviour source
1. Project has a primitive library: wire the parts, states and tokens onto it. The scaffold knows Bits UI (`Button.Root` from `bits-ui`); Ark has a Svelte build and is wired by hand.
2. Nothing installed: import `attach` from `./<name>.behaviour.js` and apply it as an action on the root:
   `function behaviour(node) { const detach = attach(node); return { destroy: detach }; }` with `<button use:behaviour ...>`.
3. Never write a store or action that re-implements the keyboard or focus model.

Checker: no `onkeydown`, `onkeyup`, `on:keydown` for a spec'd key; the primitive or `attach` owns them.

## Motion
Rules: `recipes/INDEX.md`; Bits state hooks (`data-starting-style` / `data-ending-style`) in `recipes/motion/headless-primitive-motion.md`. Start from the CSS baseline (transform/opacity, tokens, reduced-motion). For mount and unmount use the built-in `transition:` / `in:` / `out:` and `animate:flip` for reorders, with durations from the generated motion-tokens, never literals; a `transition:` function must honour reduced motion. A library only at the recipe's upgrade trigger, after asking.

## Generated files
Every component is written whole (parts, props, slots, the `attach` call from the lifecycle); `check-components` fails an empty skeleton (`empty-skeleton`). Primitives are wired for the button only. In a TypeScript project `<name>.behaviour.d.ts` is written next to the script, so the `.js` import type-checks without `allowJs`. Pass listeners and attributes through the normal fallthrough (`$attrs` / `...rest`).

## Bindable props and TypeScript
- `field` (`value`), `toggle` (`checked`), `dialog` (`open`) and `tabs` (`selected`) are `$bindable`: `<Field bind:value={email} />`, `<Dialog bind:open>`. Callbacks: `onselectedchange(index)` on tabs, `ondismiss(id)` on toast.
- The script is TypeScript (`lang="ts"`, typed props) only when the project has TypeScript; a JavaScript project gets plain script without annotations. `field`'s `error` prop wins over the built-in validation message while it is non-empty (the behaviour writes into the same text node, never replaces it).

Round 6: `toast-store.ts` exports the `toasts` store with `pushToast(toast)` (returns the id) and `dismissToast(id)`: `<Toast toasts={$toasts} ondismiss={dismissToast} />`. Dialog `nativeValidation`, field `hideLabel`.

## Select, table, tooltip, popover
Bindable: `<Select bind:value>`, `<Table bind:sort bind:selected>` (you re-order `rows`), `<Popover bind:open>`. `Tooltip`: `delay`, `variant`, children = the control, snippet `content` = the text.
