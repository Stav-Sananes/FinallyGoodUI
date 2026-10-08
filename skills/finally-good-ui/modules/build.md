# Step 6: Build

Goal: implement the approved blueprint in the project's own stack, screen by screen, with every state and transition. **The blueprint is the contract.** If you need to deviate, say why, update `blueprint.md`, and log it.

## Order (don't reorder)
1. **App shell and navigation.** Implement the navigation model the blueprint chose, with the current-location indicator (`ia-nav.wayfinding-location`), responsive behaviour at 375px, and skip link and landmarks (`a11y.semantic-first`). See `recipes/patterns/app-shell-nav.md`.
2. **Shared components.** List what the screens need, and **reuse existing components first** (from detect). Create only what is missing, using tokens only. Every interactive component gets hover, active, focus-visible and disabled states (`a11y.focus-visible`).
3. **Screens, in flow-priority order** (the blueprint's key flows first). Use real domain content and the data shapes from the brief. Primary action first in hierarchy (`flows-forms.primary-action-clarity`, `layout.hierarchy-by-weight`).
4. **Every state-matrix cell.** For each screen: empty, loading, error, partial, full, no-permission, as the blueprint specified. See `recipes/patterns/empty-state.md` and `form-validation.md`. **A screen isn't done until its row in the state matrix is done.**
5. **Transitions and motion.** Follow the spatial map and per-screen budget in `brand.md`. Add the signature moment last.
6. **Craft pass.** Structure being right is half the job; this pass is where "correct" becomes "premium". Open `canon/craft.md` and go through every screen with this list, fixing as you go:
   - **Type:** tracking and leading per size (`craft.tracking-by-size`); headlines ≤ 2 lines, `text-wrap: balance` on headings and `pretty` on paragraphs (`craft.headline-discipline`); numbers set with tabular figures, muted units and a true minus (`craft.number-setting`).
   - **Surfaces:** one material by role (`craft.material-restraint`); layered, tinted shadows and lighter surfaces in dark mode (`craft.tinted-shadows`); space, then hairlines, then boxes, and no box-in-box (`craft.hairlines-before-boxes`); concentric radii (`craft.concentric-radii`).
   - **Real things:** one icon family at one stroke width, real images, logos and initials, no drawn placeholders (`craft.real-imagery-and-icons`); content honest (`craft.honest-content`).
   - **Colour:** near-neutral canvas, ink primary actions, accent only where it means something (`craft.ink-and-accent`, unless the personality is playful/energetic).
   - **Identity:** the motif from `brand.md` appears in ≥ 3 places (`craft.identity-motif`); every screen has one focal point and at least one deliberate accent moment (`craft.tension-restraint-liveliness`).
   - **Alignment:** card actions share a bottom line, icons are optically centred (`craft.optical-alignment`); sections and screen types vary composition on purpose (`craft.composition-rhythm`).
   - **Copy:** no buzzwords, generic CTAs or em-dash cadence (`writing.plain-claims`).
   Then run `node scripts/check-static.mjs --root <project>` and fix or justify every finding, **including `low`** (the hook only shows high/medium; the low ones are the taste fingerprints). Log the motif placements and any kept fingerprint in `decisions.md`.

After each screen, Layer 1 (the hook) runs automatically. Fix what it reports before moving on.

## Recipes
Open `recipes/INDEX.md`, then only the recipes you need. Each recipe has a **CSS baseline** that works everywhere, plus framework versions.

Choose the implementation by stack profile:

| Need | Plain / any | React | Vue | Svelte |
|---|---|---|---|---|
| Enter/exit, hover, press, popover, dialog | CSS transitions + `@starting-style` | same (CSS) | `<Transition>` | `transition:` |
| List add/remove/reorder | FLIP via WAAPI | `motion` `layout` if installed, else FLIP | `<TransitionGroup>` | `animate:flip` |
| Route / shared element | View Transitions API (with fallback) | View Transitions; `motion` `layoutId` if installed | View Transitions | View Transitions / `crossfade` |
| Exit animations inside JS-controlled trees | — | `AnimatePresence` (needs `motion`) | `<Transition>` | `transition:` |
| Pinned scroll storytelling (marketing only) | GSAP ScrollTrigger (suggest) | same | same | same |

## Upgrade rule
Suggest a dependency only if all three hold:
1. The needed effect is in the blueprint or brand motion section.
2. The native or existing approach can't do it (exit animation of unmounting React trees, shared layout, gestures and drag, spring interruption, scroll pinning), **or** it would need more than about 30 lines of hand-written animation JS.
3. No existing library in the profile covers it.

Ask the user in one line, e.g. "The list-to-detail transition needs shared-element animation. Add `motion` (~5kb with LazyMotion)? Otherwise I'll use the View Transitions API with a crossfade fallback in Firefox." **Never add a second general-purpose animation library.**

## Code rules
- Tokens only: no hex, rgb, px spacing or ms literals in components (the hook flags them).
- Animate only `transform` and `opacity` (`motion.compositor-only`); never `transition: all`.
- Wrap spatial motion so reduced motion drops it (`motion.reduced-motion`). Gate hover motion with `(hover: hover) and (pointer: fine)`.
- Semantic HTML before ARIA; buttons are `<button>`; every input has a visible label (`flows-forms.labels-above`).
- Touch targets at least 24px, 44px on touch-first screens (`a11y.target-size`). Inputs at least 16px on mobile.
- Numbers in tables and dashboards use `font-variant-numeric: tabular-nums`.
- Copy follows the writing cards: the user's words, verb-first actions, and errors that say how to fix the problem.

## Completeness (no shortcuts)
Before saying a screen is done, count: regions in the blueprint for this screen, state-matrix cells for its row, and controls on it. Report "N of N" for each. Never leave `TODO`, stub handlers, `href="#"`, "the rest follows the same pattern", or one example standing in for several (`craft.nothing-dead`). If the work is too large for one pass, finish whole screens and say which remain, rather than thinning every screen.

## Done means
The screen and its whole state row are implemented (N of N), the craft pass is done, the Layer 1 findings are fixed, and it runs in the dev server without console errors. Then go to `modules/verify.md` for each finished flow; don't wait until the end.
