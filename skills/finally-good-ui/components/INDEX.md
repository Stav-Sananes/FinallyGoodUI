# Components

- [button](components/button/spec.md) — native `<button>`: primary, secondary, ghost, destructive; loading via `aria-busy`, disabled natively.
- [field](components/field/spec.md) — native control with label, hint and error tied by ids; validates on blur, error announced via a polite live region; no layout shift.
- [toggle](components/toggle/spec.md) — native `<input type="checkbox">`: checkbox and switch (`role="switch"`); checked, mixed, disabled, invalid; no layout shift.
- [disclosure](components/disclosure/spec.md) — native `<button aria-expanded aria-controls>` plus panel, single or multiple open, closed content `inert`; auto-height animation per the accordion recipe.

Framework adapters (load the one that matches the project's stack, on demand): `components/adapters/{plain,react,vue,svelte,angular}.md`, and `components/adapters/light/{solid,lit}.md` for stacks the scaffold has no template for. Each says how props, state attributes, slots and the behaviour source (installed primitive, else the shared `<name>.behaviour.js`) map onto that framework.
