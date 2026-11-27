# Tailwag Grooming: salon booking (skill side)

Brief: "Salon booking: dog owners pick a time for a groom, on their phone."

- Framework: Svelte 5 + Vite (plain Svelte, JavaScript). Run `npm install && npm run dev` / `npm run build` (build verified, exit 0).
- Key flow: pick dog and groom (10 services, price and length by dog size) -> 7-day strip and slot grid sized to the groom's length -> review form -> appointment-card confirmation. Also: Visits (Upcoming/Past tabs, cancel with a consequence dialog, rebook).
- States reachable: slot skeleton, closed Sunday, "nothing fits" day, Saturday load failure (first load fails, retry works), offline banner and offline errors, field validation, slot lost at confirm (first 10:00 booking of a session), visits skeleton, no upcoming / no past visits, damaged saved list (corrupt `localStorage` key `tailwag.visits.v1`), cancel confirm, toasts.
- All data (salon, prices, hours, dogs, visits) is sample data.
- Run settings: `.design/config.json` = mode autonomous, directions one, verify static. Design files are in `.design/` (brief, blueprint, decisions, brand, directions/a|b|c specs, tokens, component-style.json).
- Not verified in a browser (verify: static, no browser in the builder). Layout, motion and the dev-server runtime paths were never seen rendered.

## Direction chosen: C, "Appointment Card" (chosen by agent)
Thesis: booking should feel like being handed a ticket with your dog's name on it: biscuit-coloured paper, a perforated tear line, a tennis-ball-green stamp when it is yours.
Why it is not generic: palette from the subject (coat biscuit canvas, bath-tile pool teal primary, tennis-ball mark colour), Bricolage Grotesque display with Figtree text, and a ticket-stub motif (dashed tear line with half-round notches) that owns surfaces on the day/time card, review ticket, confirmation, visit cards and (edge) summary rail. Not ink-on-paper: tinted canvas, coloured primary. A (quiet clipboard) and B (dense, stark "Spin Cycle") are written in `.design/directions/` and rejected (A near the sterile default; B dense for a one-handed interrupted audience). Axes for C: density airy, contrast soft, type neutral text + display moments, layout stage, material flat-hairline, motion expressive within budget (taps <=150ms, one 600ms stamp).

## Components
| Component | Source |
|---|---|
| button, field, toggle, dialog, tabs, toast | shared module (`scaffold-component.mjs`, no primitive library installed). The scaffolded `.svelte` skeletons were rewritten by hand into working components (see friction); behaviour (`*.behaviour.js`) and the CSS reference layers are the scaffold's, CSS then post-scoped by `data-fgu` |
| Choice (radio card/chip/day), Ticket, Icon, Monogram | hand-written (no spec covers radio groups, the motif, icons) |
| disclosure, menu | not needed |
No primitive library was installed or added.

## Checks
- `check-components.mjs`: ok, 0 findings (6 components). Not informative: it also passed on the unusable raw scaffold.
- `check-static.mjs`: 0 medium, 1 high, 1 low after fixes (first run: 6 high, 1 medium, 1 low).
  - fixed: `outline-none-no-focus` on `main:focus`; `role-no-keyboard` x4 on role="radiogroup" of button-cards (replaced by native radios in a `fieldset`, which gives arrows and one tab stop); `long-duration` shimmer (now `--duration-long`) and the 600ms stamp (renamed `.stamp-signature`, the marker the checker asks for).
  - unresolved, false positive: `role-no-keyboard` on the skill's own scaffolded `tabs.svelte` (`role="tablist"`): keyboard is supplied by `tabs.behaviour.js` through `use:behaviour`, which the checker doesn't follow.
  - kept, low: `autofocus` on the "Keep visit" button of the confirm dialog (the dialog spec says: autofocus the safe choice).

## Friction and bugs in the skill, its scripts and components
1. **Component CSS collides.** Every `<name>.css` uses unscoped `[data-part="root"]`, `[data-part="label"]`, bare `[data-part]` and the profile layer's `[data-part] {...}`. Two components in one app overwrite each other (button root styles hit dialog/tabs/toast roots, shared `label`/`control` parts). I wrote a postcss transform that prefixes each file with `[data-fgu="<name>"]` and a `:where(:not(foreign component))` guard so nested components don't inherit. The scaffold needs scoping built in (a root attribute or `@scope`).
2. **Svelte scaffold is a skeleton, not a component.** It renders every part empty (`<h2 data-part="title"></h2>`, an empty `<input>`), puts `label={label}` and `hint=` on a `<div>` as DOM attributes, has no `value`/`checked` binding, no id wiring, no slots for tabs/toast items. All six files needed rewriting. `check-components` still says ok.
3. **`attach(root)` vs where the scaffold applies it.** field/dialog behaviours wire their parts with `root.querySelectorAll('[data-part="root"]' | 'dialog')`, which never includes `root` itself, but the scaffolded Svelte applies `use:behaviour` to that same root: label `for`, `aria-describedby` and dialog `aria-labelledby` were never set. I wired ids in Svelte (`$props.id()`). Dialog openers outside the element are invisible to `attach(dialog)`; I attached it once to `document.body`.
4. **The style profile's `[data-part]` catch-all is wrong for `outlined` and `layered`.** `material: outlined` puts a 2px border and radius on every part (labels, hints, errors, spinner...); `layered` would shadow every part. I had to switch to `flat`, and `flat` then sets `border-style: none` on every part, which removes the field input border, checkbox border, tablist underline, secondary button and toast borders; I restored each in `app.css`. The profile should target the root part (and named surface parts) only. Also the profile only has radius/material/density/motion, so "flat-hairline" has no mapping (hairline controls are lost).
5. **`check-static` false positive** on the scaffolded `tabs.svelte` (see above); it could accept an `attach` import / `use:` action in the same file.
6. **Config vs autonomous text disagree.** `directions: one` means "build only A" (directions.md) but the autonomous rule and the task say "pick one on distinctiveness". I followed the task (wrote A/B/C specs, picked C). Also the axis rolling rule (type roll 1 = neutral grotesk) conflicts with "every direction gets a display voice"; resolved as neutral text + display moments, logged.
7. Smaller: `font` tokens: I wrote `"Figtree Variable"` first (the emit adds " Variable" itself, giving "Figtree Variable Variable"; the docs say to use the plain name but it is easy to miss); `emit-tokens --format js` produced a motion-tokens module I did not need (CSS animations used tokens directly) and deleted; `toast` default placement (bottom right, `inset: auto ... auto`) needs a phone override above a tab bar; the tabs spec has no place for a count badge or `aria-label` on the list (added as props).
8. `check-static` reports no `low` fingerprints for emoji/gradient but also cannot check Svelte `$props.id()`-style ids, so label wiring regressions (friction 3) are invisible to it; a browser or the axe-style flow walk would catch them. Not run (verify: static).
