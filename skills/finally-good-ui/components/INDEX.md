# Components

- [button](components/button/spec.md) — native `<button>`: primary, secondary, ghost, destructive; loading via `aria-busy`, disabled natively.

Framework adapters (load the one that matches the project's stack, on demand): `components/adapters/{plain,react,vue,svelte,angular}.md`, and `components/adapters/light/{solid,lit}.md` for stacks the scaffold has no template for. Each says how props, state attributes, slots and the behaviour source (installed primitive, else the shared `<name>.behaviour.js`) map onto that framework.
