# Adapter: Solid (light)

The scaffold has no Solid template: it emits the plain HTML, CSS and `<name>.behaviour.js`. Translate the markup in `adapters/plain.md` by hand into a `.tsx` component.

## Props and events
- Take `props` whole, never destructure (it loses reactivity); use `splitProps(props, ["variant", "busy", "children", "icon"])` and spread the rest on the root. Defaults via `mergeProps({ variant: "primary" }, props)`.
- Events stay native (`onClick` in `rest`).

## State attributes
- `aria-busy={local.busy ? "true" : undefined}`; `disabled={local.disabled}`; `data-variant={local.variant}`. Same attributes as `spec.json` `states`.
- The shared `attach` swallows a click while `aria-busy="true"`, so no busy guard is written in the component.

## Slots and children
- Default slot is `props.children`; named slots are `JSX.Element` props (`icon`). Optional parts: `<Show when={local.icon}><span data-part="icon" aria-hidden="true">{local.icon}</span></Show>`. Keep each `data-part`.

## Behaviour source
1. Project has Kobalte or Ark (Solid build): wire the spec's parts, states and tokens onto it. The scaffold has no wiring for these yet, so do it by hand.
2. Nothing installed: copy `<name>.behaviour.js` and call it from `onMount`: `let el; onMount(() => { const detach = attach(el); onCleanup(detach); });` with `ref={el}` on the root.
3. Never write a fresh keyboard or focus model for Solid.

Checker: no `onKeyDown`/`on:keydown` for a spec'd key.

## Motion
Rules: `recipes/INDEX.md`; Kobalte state hook (`data-expanded`, exit by CSS animation) in `recipes/motion/headless-primitive-motion.md`. Use the CSS baseline (transform/opacity, `@starting-style`, tokens, reduced-motion). A library only at the recipe's upgrade trigger, after asking.
