# Recipe: route-transition

**Intent:** page changes carry direction — drilling in moves forward, going back reverses, switching tabs crossfades — while the app shell stays still.

**Cards:** motion.spatial-continuity · ia-nav.wayfinding-location · motion.frequency-budget · motion.duration-by-distance · motion.compositor-only · motion.reduced-motion

**When NOT to use:** on routes users hop between constantly (dashboards with many tabs — crossfade ≤150ms or nothing); when data loading dominates (show skeleton-to-content instead; don't animate an empty page); for query-string/filter changes.

**Tokens:** `--duration-standard` (250, in) · `--duration-short` (150, out) · `--ease-enter` · `--ease-exit`

## CSS/JS baseline (View Transitions, directional)
Name only the content region so the shell (nav, header) is excluded from motion.
```css
main { view-transition-name: page; }

::view-transition-old(page) { animation: var(--duration-short) var(--ease-exit) both page-out; }
::view-transition-new(page) { animation: var(--duration-standard) var(--ease-enter) both page-in; }

html[data-nav="forward"] { --from: 16px;  --to: -16px; }
html[data-nav="back"]    { --from: -16px; --to: 16px; }
html[data-nav="lateral"] { --from: 0px;   --to: 0px; }   /* tabs: crossfade only */

@keyframes page-out { to   { opacity: 0; transform: translateX(var(--to, 0px)); } }
@keyframes page-in  { from { opacity: 0; transform: translateX(var(--from, 0px)); } }

@media (prefers-reduced-motion: reduce) {
  html { --from: 0px; --to: 0px; }  /* fade only */
}
```
```js
// SPA router hook: call with the new route's render function
export function navigate(render, direction /* 'forward' | 'back' | 'lateral' */) {
  document.documentElement.dataset.nav = direction;
  if (!document.startViewTransition) return render();
  document.startViewTransition(render);
}
// Decide direction from the blueprint's hierarchy: deeper = forward, shallower = back, siblings = lateral.
// popstate → 'back' unless history state says otherwise.
```
- Travel 16px, not a full-width slide: it signals direction without making the user wait for a panel.
- Multi-page apps: `@view-transition { navigation: auto; }` on both pages; set direction in a `pageswap`/`pagereveal` handler (Chromium, Safari). Firefox navigates without animation — fine.
- Custom properties inside view-transition keyframes resolve from `html` because the pseudo-elements hang off the root.

## React + Motion
- React Router v7: `<Link to="/p/42" viewTransition>` (also on `NavLink`/`navigate(to, { viewTransition: true })`), then the CSS above; set `data-nav` in the click handler or from the route depth.
- Next.js / other meta-frameworks: use their built-in view-transition support if the installed version has it; otherwise wrap `router.push` in `document.startViewTransition`.
- Motion alternative (interruptible, no snapshot): key the outlet by pathname.
```tsx
import { sec, ease } from "./motion-tokens"; // recipes/INDEX.md
const location = useLocation();
const outlet = useOutlet();               // freeze the old page during exit
<AnimatePresence mode="popLayout" initial={false}>
  <m.main key={location.pathname}
    initial={{ opacity: 0, x: reduce ? 0 : dir * 16 }}
    animate={{ opacity: 1, x: 0, transition: { duration: sec('standard'), ease: ease('enter') } }}
    exit={{ opacity: 0, x: reduce ? 0 : dir * -16, transition: { duration: sec('short'), ease: ease('exit') } }}>
    {outlet}
  </m.main>
</AnimatePresence>
```
(`dir` = 1 forward, -1 back, 0 lateral.)

## Vue / Svelte
- Vue Router: `<RouterView v-slot="{ Component, route }"><Transition :name="'page-' + dir" mode="out-in"><component :is="Component" :key="route.path" /></Transition></RouterView>`; compute `dir` in `router.afterEach` from route depth. Nuxt: `experimental.viewTransition: true` plus the CSS above.
- SvelteKit: `onNavigate` wrapper (see shared-element-view-transition); set `data-nav` from `nav.type === 'popstate' && nav.delta < 0 ? 'back' : …`.
- Astro: the built-in `<ClientRouter />` with `transition:animate` — map its directions onto these durations.

## A11y
- After navigation, move focus to the new page's `h1` (`tabindex="-1"`) or announce the title in a live region; update `document.title`.
- `aria-current="page"` on the active nav item.
- Never block input longer than the transition; ≤ 250ms in.

## Upgrade trigger
None for VT-capable stacks. Suggest Motion only when routes must be interruptible mid-transition (rapid tab switching on mobile) and the project already ships it.
