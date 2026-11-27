# `.design/component-style.json` (the scaffold's style profile)

`scripts/scaffold-component.mjs` refuses to run without it: the look of a scaffolded component is decided here, from the chosen direction, never by a default. Write it by hand when the direction is locked, once per project, from the direction spec (`.design/directions/<x>.spec.md`, template in `modules/directions.md` section 3) or the brand file.

```json
{ "radius": "sharp", "material": "outlined", "density": "dense", "motion": "productive", "motif": "ruled ledger lines, one stamp-red rule under headings" }
```

| Field | Values | Derive it from |
|---|---|---|
| `radius` | `sharp` · `soft` · `round` | the `radius:` line of the direction's Material block (outer radius: up to 4px sharp, 6-12px soft, pill or 16px and up round) |
| `material` | `flat` · `layered` · `outlined` | the `material` axis: flat-hairline gives `flat` (no shadows; hairlines already come from the component CSS); soft-elevated gives `layered` (token shadows); bezel, textured or tonal gives `layered`, or `outlined` when the edge itself is the material (strong borders, no shadows) |
| `density` | `airy` · `balanced` · `dense` | the `density` axis, one to one |
| `motion` | `productive` · `balanced` · `expressive` | the `motion personality` axis, one to one |
| `motif` | non-empty string | the direction's `Identity motif:` line; written into the CSS as a comment only |

All five are required; `validateProfile` (scripts/lib/style-profile.mjs) names the field that is wrong.

## What it does and does not do
- It carries no colour, type or spacing values: those are tokens (`.design/tokens.json`). It only picks which tokens a component's parts use.
- It touches only the parts the component's `spec.json` `profile` names: `surface` (radius, border, shadow), `density` (min-height, padding-inline, gap), `interactive` (the transition). Every other part keeps what the reference CSS gives it. A field's surface is its control, a dialog's its root, a menu's its list; a toggle and a disclosure have no surface (their borders are the component's own).
- Every rule sits under the component's own `[data-fgu="<name>"]` scope, so two components never share a selector, and a profile rule only ever sets a value from `var(--token)`: no literal, no `none` reset on a border or padding.
- `material: outlined` needs `--border-width-strong` or `--border-width-hairline` in the component's `tokens`; `flat` removes a shadow only from non-control surfaces (a dialog, a menu), never a field's or checkbox's border.

After changing the file, re-run the scaffold: it refreshes every file it wrote and nobody edited (the marker `.fgu-component.json` keeps a hash of each), and skips, with `skipped: "exists"`, any file you changed, so a hand-rewritten component is never touched. `--force` overwrites everything it plans, edited files included (commit first). `scaffold-component.mjs --gallery` shows all eight components at once.
