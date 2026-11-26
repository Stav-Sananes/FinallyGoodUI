# Adapter: plain HTML

For a project with no framework, an unknown framework, or when the scaffold has no template for the stack (it then emits plain HTML, CSS and the shared behaviour script). Also the base the Solid and Lit adapters translate from.

## Props and events
- Props are attributes on the root element: `data-variant="primary"`, `type="button"`, `aria-label` for an icon-only control. No prop object, no re-render: change an attribute and the CSS reacts.
- Events are the native ones (`click` on a button). Never add a custom event for something the element already emits.

## State attributes
- Set the attribute named in `spec.json` `states` (`aria-busy="true"`, native `disabled`) with `setAttribute` / `removeAttribute`. Remove it rather than writing `"false"`.
- The CSS keys on these attributes only; do not add `.is-loading` style classes.

## Slots and children
- Each spec part is an element with `data-part="<part>"`; the root carries `data-part="root"`.
- A slot is the content of its part element: `default` is the label's text, `icon` is the icon part. Decorative parts (icon, spinner) get `aria-hidden="true"`. Keep an always-present part (the spinner) in the markup so state changes never shift layout.

## Behaviour source
1. If the project installs a framework-free primitive or kit, wire the spec's parts, states and tokens onto it. Rare: most plain projects have none.
2. Nothing installed: import the shared module `<name>.behaviour.js` and call `attach(root)`. It returns `detach()`. The scaffold writes it next to the component:
   `import { attach } from "./<name>.behaviour.js"; const detach = attach(document.getElementById("demo"));`
3. Never write a fresh rewrite of the behaviour. `attach` takes any ancestor of the controls and listens in the capture phase by delegation, so one call covers every instance inside it.

Checker: write no `keydown`/`keyup`/`keypress` listener for a key in `spec.a11y.keys` (the native element or `attach` already handles it). `check-components` reports `key-handler-reimplemented` otherwise.

## Motion
Rules and tokens: `recipes/INDEX.md`. Plain CSS transitions on `transform` and `opacity` with `var(--duration-*)` and `var(--ease-*)`, plus `@media (prefers-reduced-motion: reduce)`. Enter animations on inserted elements use `@starting-style`. For anything CSS cannot do, use the Web Animations API with durations from the generated motion-tokens module, never literals.

The scaffold writes the component's reference page re-pointed at the files next to it (`<name>.css`, `<name>.behaviour.js`): every part and state, `attach` called on the demo. Load your `tokens.css` before the stylesheet.
