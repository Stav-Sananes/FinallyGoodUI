# Tracker (skill side, round 4)

Brief: "Issue tracker: a six-person team triages its issue list from the keyboard."
Framework: Angular 21.2 (CLI 21.2.30, standalone components, plain CSS, no SSR, no added dependencies).
Run: `npm install && npm start` (dev) or `npm run build`. Review states: `?state=loading|error|empty`; going offline makes loads and saves fail for real. Search and tab live in the URL (`?q=&view=`).

## Direction: Strip Bay
Triage is an air-traffic controller's job: a rack of paper strips, each with a priority-coloured tab, one lit strip at a time, hands on the keys. Sage-teal canvas (not near-neutral paper), warm strip paper, signal-blue action, amber cursor ring; Barlow Condensed / Barlow / IBM Plex Mono; rail + work layout; dense; balanced motion with repeats <= 150ms and one hero moment ("Bay clear"). Specs for A (Ledger Column) and B (Spotlight) are in `.design/directions/specs.md`; C chosen by agent for distinctiveness. Prototype pages skipped (no subagents). All decisions: `.design/decisions.md`.

Keys: j/k move, 1-4 priority, 0 clear, a assign (menu), s status, x close, u undo, Enter open, n new, / search, r refresh, ? help.

## Component sources
- Primitive library: none. Detect reported `primitives: []`; Angular CDK is not installed in a fresh CLI project and I did not add it (autonomous: never install).
- Shared module (scaffolded from the spec registry, `.design/component-style.json` = sharp / outlined / dense / balanced / "strip tab"): button, field, menu, dialog, tabs, toast. Behaviour is the shared `*.behaviour.js` for all six.
- Hand-written: the strip rack rows, rail summary, histogram, skeleton, empty/error states, shortcut sheet content, the domain/state/data layers (Issue rules, keymap, store, in-memory gateway, toast store).
- Not used: toggle, disclosure (no need).

## Checks
- check-components: ok, 0 findings (6 components).
- check-static: final 2 high, 0 medium, 1 low, all justified.
  - `role-no-keyboard` x2 (menu.component.html role=menu, tabs.component.html role=tablist): false positives; the arrow/Home/End/typeahead keys come from `menu.behaviour.js` / `tabs.behaviour.js`, which the rule does not see (it reads templates only).
  - `autofocus` low: the New issue title field, inside an opened dialog (the rule's own exception).
  - Fixed on the way: `div-onclick` (row click replaced by focusin), `long-duration` (hero marked `signature`), `eyebrow-overuse` (2 caps labels dropped).
- Token contrast: 34 text/surface pairs, light and dark, all >= 4.5:1 (scratch script over scripts/lib/contrast.mjs).
- Build: `npm install && npm run build` ok. Runtime smoke (one quick Playwright run, beyond verify=static): j/2/a/arrows/Enter flow, cursor advance, undo toast, offline rollback + error toast, `n` focuses the title field, no console errors.

## Friction and bugs in the skill (honest list)
1. Node/CLI mismatch: `@angular/cli@latest` (22.x) needs Node >= 24.15; machine has 24.11, so I used CLI 21. Not the skill's fault, but "latest stable" in the brief is not always runnable.
2. detect-stack: `router: null` although `@angular/router` is installed (Angular router not recognised).
3. The Angular scaffold output is a static skeleton: menu has one empty trigger/item, tabs one tab, toast one empty toast, field a fixed `<input>` with a junk `[attr.label]/hint/error` binding (it sets attributes, not text), button has no `dialogOpen`. Every component had to be rewritten into a data-driven template; the adapter doc does not say the scaffold is a skeleton or how to make lists (items, tabs, toasts) data-driven.
4. Scaffolded menu uses `<span data-part="list">` (spec says a div; span needs display fixes).
5. TS: strict Angular fails with TS7016 on `./x.behaviour.js` imports. Needs `"allowJs": true` (or a .d.ts); the angular adapter does not mention it.
6. Angular default component-style budget (8kB error) is exceeded by a normal screen CSS; not skill-related but hit it.
7. Dialog behaviour finds openers only among descendants of the attach root, and the Angular scaffold attaches to the component host, so `data-dialog-open` buttons elsewhere do nothing. I attach to an app scope element (`[data-fgu-scope]`). Also focus-return calls `opener.focus()` on the opener element: on `<fgu-button data-dialog-open>` that is the non-focusable host, so I had to add a `dialogOpen` input that puts the attribute on the inner button.
8. Tabs: indicator is horizontal only (`--indicator-x` + scale), although the behaviour supports `aria-orientation="vertical"`; no programmatic select, so an Angular-driven selection change does not move the indicator or panels (I mirror with attribute bindings and a MutationObserver to read selection back).
9. Menu: no public "open from a shortcut" path; I call `list.showPopover()` and rely on the toggle handler to focus the first item. Menu cannot start on the current item.
10. Dialog scaffold has no autofocus guidance: first focusable is the close button, not the form field; I added `autofocus` on the field (check-static `autofocus` low then flags it).
11. Field validates only on focusout; a submit of an untouched field needs a synthetic `focusout` (done in `validate()`).
12. check-static false positives: `role-no-keyboard` on shared-behaviour components; no way to mark them. `eyebrow-overuse` counts any uppercase style, including data labels.
13. The autonomous flow is long: brief, blueprint, direction specs, tokens (DTCG normalise step, resolver hand-edit: copying the default resolver needed its `$ref` names changed by hand), none of which has a script to scaffold the `.design/` files.
14. `components/` `--gallery` and `component-style.json` worked well; the style profile needs `outlined` material to get hairlines, and there is no way to set the tab-edge motif beyond a string comment.
