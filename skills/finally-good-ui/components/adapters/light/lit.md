# Adapter: Lit (light)

The scaffold has no Lit template: it emits plain HTML, CSS and `<name>.behaviour.js`. Translate `adapters/plain.md` into a `LitElement`.

## Props and events
- Props are reactive properties: `@property({ type: String }) variant = "primary"; @property({ type: Boolean, reflect: true }) busy = false;` with the spec defaults.
- Events stay native; dispatch a `CustomEvent` only for a spec'd one.

## State attributes
- Render the attributes from `spec.json` `states` on the inner root: `aria-busy=${this.busy ? "true" : nothing}` (`nothing` from `lit`), `?disabled=${this.disabled}`, `data-variant=${this.variant}`.

## Slots and children
- Render into the light DOM so the shared CSS and `attach` apply unchanged: `createRenderRoot() { return this; }`. Light DOM has no `<slot>`: take named parts as properties or children templates, and keep each `data-part`. Using shadow DOM instead means the CSS must be adopted into it and `attach` called on the shadow root; avoid unless the spec needs encapsulation.

## Behaviour source
1. No primitive library fits Lit: there is none to wire. Use the shared module.
2. Copy `<name>.behaviour.js` and call it once rendered: `firstUpdated() { this.detach = attach(this); } disconnectedCallback() { super.disconnectedCallback(); this.detach?.(); }`.
3. Never write a fresh keyboard or focus model for Lit.

Checker: no `@keydown`/`@keyup` template bindings or `addEventListener("keydown")` for a spec'd key.

## Motion
Rules: `recipes/INDEX.md`. Use the CSS baseline only (transform/opacity, `@starting-style`, tokens, reduced-motion). Take durations in JS from the generated motion-tokens, never literals. A library only at the recipe's upgrade trigger, after asking.
