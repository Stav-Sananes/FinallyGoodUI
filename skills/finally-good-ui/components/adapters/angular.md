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
