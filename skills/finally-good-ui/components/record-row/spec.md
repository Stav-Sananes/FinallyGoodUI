# Component: record-row

**Intent:** one record of the product's world as a line of a list, with a lead (the tag, stub or day), a title, meta, a status and one visible action, whose shape (edge, corner, radius, material) comes from the direction's "world unit -> record shape" line through the style profile's `record` surface, so a list is not the same bordered card with an avatar and a "..." button.

**Cards:** craft.composition-rhythm · craft.identity-motif · layout.hierarchy-by-weight · a11y.semantic-first · a11y.target-size · color.color-not-sole-signal · usability.system-status

**When NOT to use:** tabular data to compare across columns (table); an action list that the record does not own (menu); content that is only a heading and text (plain markup); a record with three or more secondary actions that cannot be shown (add a menu to the `action` part, not instead of it).

**Tokens:** `--color-card` · `--color-foreground` · `--color-muted-foreground` · `--color-border` · `--color-primary` (current marker, tab edge) · `--color-accent` / `--color-accent-foreground` (current) · `--radius-*` · `--shadow-sm|md` · `--border-width-hairline|strong` · `--size-control-sm|md|lg` · `--space-1..4` · `--text-xs|sm` · `--duration-short` · `--ease-move`. The full list is `tokens` in `spec.json`; a style profile only emits a variable listed there.

## Shapes
| Shape | Use for |
|---|---|
| default | a list of records, one per line |
| compact | dense lists (`data-variant="compact"`): less padding, the control-md height |

The look of the record is not a variant: the profile's `surfaces.record` gives it `edge` (square, notch, tab, perforated, ruled) and `corner` (uniform, cut, asymmetric); see `components/style-profile.md`.

## Parts and slots
| Part (`data-part`) | Role |
|---|---|
| `root` | the `<li>`; carries `data-variant` and `aria-current` for the current record |
| `lead` | slot `lead`: the world's marker (a day tag, a ticket number, a stamp); the part a perforated edge tears off |
| `title` | the default slot: what the record is; names the record (`aria-labelledby`) |
| `meta` | slot `meta`: one muted line (time, place, who); describes the record |
| `status` | slot `status`: state in words, never colour alone |
| `action` | slot `action`: the record's one or two visible actions (real buttons or links); never a lone "..." menu |

Slots a record does not use are not rendered. Empty `meta` or `status` leave no gap.

## States
| State | How it shows | Attribute / selector |
|---|---|---|
| default | the profile's record surface | none |
| current | accent fill and a primary edge on the inline start, not colour alone | `aria-current="true"` on the root |

Only `current` has an attribute, so it is the only entry in `states` in `spec.json`.

## Keyboard
No key handling: the record is not interactive itself. Tab reaches the buttons or links in `action` (and any link in the title) in reading order. `attach` only names the record: `aria-labelledby` its title, `aria-describedby` its meta and status.

## Motion
`background-color` only, `--duration-short` with `--ease-move`, for the current state. Under `prefers-reduced-motion` there is no transition.

## Markup
```html
<li data-fgu="record-row" data-part="root" data-variant="default" aria-current="true">
  <span data-part="lead">MON</span>
  <span data-part="title">Roast squash and farro</span>
  <span data-part="meta">40 min, serves 3</span>
  <span data-part="status">Maya cooks</span>
  <span data-part="action"><button type="button">Swap dinner</button></span>
</li>
```

## Reference
`reference/index.html`, `record-row.css`, `record-row.js` (`attach(root): detach`). The CSS is the plain ruled baseline; the profile layer gives it the record surface of the direction.

## Scaffold API
Props `variant`, `current`; slots `lead`, `default` (the title), `meta`, `status`, `action`. Wrap rows in a native `<ul>`/`<ol>`; cards need no wrapper. Shape the record in `.design/component-style.json` `surfaces.record`, from the direction spec's "Concept mapping" unit row (a tag is `notch`, a ticket or stub is `perforated`, a ledger line is `ruled`, a case slot is `tab`).
