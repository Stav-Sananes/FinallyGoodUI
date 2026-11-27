# Components

- [button](components/button/spec.md) — native `<button>`: primary, secondary, ghost, destructive; loading via `aria-busy`, disabled natively.
- [field](components/field/spec.md) — native control with label, hint and error tied by ids; validates on blur, error announced via a polite live region; no layout shift.
- [toggle](components/toggle/spec.md) — native `<input type="checkbox">`: checkbox and switch (`role="switch"`); checked, mixed, disabled, invalid; no layout shift.
- [disclosure](components/disclosure/spec.md) — native `<button aria-expanded aria-controls>` plus panel, single or multiple open, closed content `inert`; auto-height animation per the accordion recipe.
- [dialog](components/dialog/spec.md) — native `<dialog>` + `showModal()`: focus trap and Escape from the platform, named by its title, focus back to the opener; enter/exit per the dialog recipe.
- [menu](components/menu/spec.md) — menu button + native `popover` list: roving focus, typeahead, Escape returns focus to the trigger, `aria-disabled` items; keys per the menu pattern.
- [tabs](components/tabs/spec.md) — tablist of native buttons with panels: one tab stop, arrows/Home/End, selection follows focus, sliding indicator per the tabs recipe.
- [toast](components/toast/spec.md) — always-present `role="status"` region with plain toast elements: auto-dismiss that pauses on hover and focus, dismiss button, never focus-stealing; errors never the only signal.
- [select](components/select/spec.md) — native `<select>` or a combobox-style button with a native `popover` listbox, optionally searchable: arrows, Home/End, typeahead, Enter/Space, Escape; hidden value input for forms.
- [table](components/table/spec.md) — real `<table>` in a scroll region: sticky header, sortable columns (`aria-sort`, reported not performed), row selection with a select-all, loading and empty status rows.
- [tooltip](components/tooltip/spec.md) — `role="tooltip"` native popover for a labelled control: hover after a delay, keyboard focus at once, Escape/blur/leave dismiss, hoverable, never opens on touch, plain text only.
- [popover](components/popover/spec.md) — non-modal anchored panel (native `popover`): light dismiss, Escape, focus in and back, CSS anchor positioning with a script fallback, bound `open`.
- [record-row](components/record-row/spec.md) — one record as a list line (`<li>`): lead, title, meta, status, visible action; shape (notch, tab, perforated, ruled edge, cut or asymmetric corner) from the profile's record surface; never a lone "..." menu.
- [record-card](components/record-card/spec.md) — one record as a stand-alone piece (`<article>`): same parts, stacked; shaped by the same record surface (ticket, tag, stub, letter).

Style profile (`.design/component-style.json`: schema and how to derive it from the direction): `components/style-profile.md`.

Framework adapters (load the one that matches the project's stack, on demand): `components/adapters/{plain,react,vue,svelte,angular}.md`, and `components/adapters/light/{solid,lit}.md` for stacks the scaffold has no template for. Each says how props, state attributes, slots and the behaviour source (installed primitive, else the shared `<name>.behaviour.js`) map onto that framework.
