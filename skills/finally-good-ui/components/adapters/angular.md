# Adapter: Angular

The scaffold writes a standalone `<name>.component.ts` (selector `fgu-<name>`), `<name>.component.html` and `styleUrl: "./<name>.css"`.

## Props and events
- Props are `@Input()` fields in camelCase with the spec default (`@Input() variant = "primary"`).
- Events stay native: `(click)` on the host `<fgu-button>` works. Add an `@Output()` only for a spec'd custom event. Note the host is the custom element; the focusable root is the inner `<button data-part="root">`.

## State attributes
- Bind attributes, not properties: `[attr.aria-busy]="busy ? 'true' : null"`, booleans as `[attr.disabled]="disabled ? '' : null"`, values as `[attr.data-variant]="variant"`. `null` removes the attribute.

## Slots and children
- Default slot is `<ng-content />`; named slots project by attribute: `<ng-content select="[icon]" />`. Optional parts wrap the slot in their `data-part` span. Always-present parts (spinner) are always in the template; the CSS toggles them from the state attribute. Keep each `data-part` inside the component template.

## Behaviour source
1. Project already has the Angular CDK or another kit: use it where it has a primitive for the part (overlay, listbox, focus trap, a11y utilities) and wire the spec's parts, states and tokens onto it. The CDK has no button primitive, so Button is not wired to it: the scaffold uses the shared module.
2. Nothing installed: import `attach` from `./<name>.behaviour.js` and call it after the view exists, on the host element reference:
   `private readonly host = inject<ElementRef<HTMLElement>>(ElementRef); ngAfterViewInit() { this.detach = attach(this.host.nativeElement); } ngOnDestroy() { this.detach?.(); }`
3. Never write a directive that re-implements the keyboard or focus model.

Checker: no `(keydown...)`, `(keyup...)` or `@HostListener("keydown")` for a spec'd key.

## Motion
Rules: `recipes/INDEX.md`. Put the recipe's CSS in a class and bind it with `animate.enter="pop-in"` and `animate.leave="pop-out"`; Angular adds the class, waits for the CSS transition or animation, then removes the element. Never use `@angular/animations` (`trigger()`, `state()`): deprecated, removal planned for v23, and it cannot be mixed with `animate.enter`. Tokens only, reduced-motion block. A library only at the recipe's upgrade trigger, after asking.

## TypeScript and `.behaviour.js`
The component imports `attach` from `./<name>.behaviour.js`. A strict project (`allowJs` off, the Angular default) cannot type that import, so the scaffold writes `<name>.behaviour.d.ts` beside it in a TypeScript project; if you copy the script by hand, either keep the `.d.ts` or set `"allowJs": true` in `tsconfig.json` (and add the file to `include`).

## Generated files
Every component is written whole (`.component.ts` + `.component.html`, standalone, `ViewEncapsulation.None` because the css is scoped by `data-fgu`, host `display: contents`); `attach(host)` runs in `ngAfterViewInit` and is cleaned up in `ngOnDestroy`. Named slots are `<ng-content select="[slot=name]">`, so project them as `<span slot="icon">`. Angular cannot tell whether an optional slot was filled, so optional parts (button icon, dialog description and actions) always render; the css hides an empty icon. Scoped slots (tabs `panel`) are `TemplateRef` inputs. A component whose root fires non-bubbling events exposes them as outputs (`closed` on dialog, `dismissed` on toast). Router: `detect-stack` reports `@angular/router` as `angular-router`.

## Inputs and outputs
- Boolean and number inputs use `booleanAttribute` / `numberAttribute`, so a bare attribute works under strict templates (`<fgu-field required>`); array inputs are `readonly`. The field's `id` input is `controlId` (an `id` input would also set the host element's id). Two-way: `[(value)]` on field, `[(checked)]` on toggle, `[(open)]` on dialog, `[(selected)]` on tabs; toast `(dismissed)`. Field `multiline` renders a textarea.
- Compile check: `ngc` with `strictTemplates` over the generated files is part of `scripts/test/compile-scaffold.mjs`.
