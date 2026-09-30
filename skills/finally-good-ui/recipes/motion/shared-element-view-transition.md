# Recipe: shared-element-view-transition

**Intent:** list → detail where the tapped item (thumbnail, title, card) visibly becomes the detail header, so the user never loses their place.

**Cards:** motion.spatial-continuity · motion.one-signature-moment · ia-nav.wayfinding-location · motion.duration-by-distance · motion.easing-roles · motion.reduced-motion

**When NOT to use:** when the list and detail have no visual element in common; on master-detail layouts where both stay visible (just highlight the row); for every navigation in the app — reserve it as the signature moment (motion.one-signature-moment).

**Tokens:** `--duration-medium` (300, group) · `--duration-standard` (250, page in) · `--duration-short` (150, page out) · `--ease-move` · `--ease-enter` · `--ease-exit`

## CSS/JS baseline (same-document View Transitions — Baseline since Oct 2025)
```js
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function go(update, direction = 'forward') {
  document.documentElement.dataset.nav = direction;       // read by route-transition CSS
  if (!document.startViewTransition) return update();      // fallback: instant
  return document.startViewTransition(update);
}

// list → detail: name the source element only for this transition
function openDetail(id) {
  const src = document.querySelector(`[data-id="${CSS.escape(id)}"] .thumb`);
  src.style.viewTransitionName = 'hero';
  go(() => {
    src.style.viewTransitionName = '';
    renderDetail(id);   // the detail's header image has class .detail-hero
  }, 'forward');
}
function closeDetail(id) {
  const thumb = () => document.querySelector(`[data-id="${CSS.escape(id)}"] .thumb`);
  const t = go(() => { renderList(); thumb().style.viewTransitionName = 'hero'; }, 'back');
  Promise.resolve(t?.finished).finally(() => thumb()?.style.removeProperty('view-transition-name'));
}
```
```css
.detail-hero { view-transition-name: hero; }   /* only one element per name at a time */

::view-transition-group(hero) {
  animation-duration: var(--duration-medium);
  animation-timing-function: var(--ease-move);
}
::view-transition-old(root) { animation: var(--duration-short) var(--ease-exit) both vt-fade-out; }
::view-transition-new(root) { animation: var(--duration-standard) var(--ease-enter) both vt-fade-in; }
@keyframes vt-fade-out { to { opacity: 0; } }
@keyframes vt-fade-in { from { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) { animation: none; }  /* no travel; old/new images still crossfade */
}
```
- Names must be unique in each snapshot: assign `hero` to the tapped item only, never to every row.
- The page is non-interactive during the transition; keep it ≤ 300ms.
- Text that changes size (title → large header): give the title its own name (`hero-title`) and set `::view-transition-old/new(hero-title) { height: 100%; object-fit: none; object-position: left top; }` to avoid squashing.
- Multi-page apps: `@view-transition { navigation: auto; }` plus matching names on both pages enables cross-document transitions in Chromium and Safari; Firefox just navigates normally — acceptable progressive enhancement.
- Browser back: listen to `popstate` and call `closeDetail` inside `go(…, 'back')`.

## React + Motion
Inside one React tree, Motion `layoutId` is simpler and interruptible (VT is not):
```tsx
<LazyMotion features={domMax}>
  {selected
    ? <m.img layoutId={`thumb-${selected.id}`} src={selected.img} alt={selected.name} className="detail-hero"
             transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} />
    : items.map(it => <m.img key={it.id} layoutId={`thumb-${it.id}`} src={it.img} alt={it.name}
                             onClick={() => setSelected(it)} />)}
</LazyMotion>
```
With routers (unmounting pages), use VT: `document.startViewTransition(() => flushSync(() => navigate(to)))` (`flushSync` from `react-dom`), or the framework's built-in VT support if the stack has it.

## Vue / Svelte
- Vue: `document.startViewTransition(async () => { selected.value = id; await nextTick(); })`.
- SvelteKit: `onNavigate(nav => { if (!document.startViewTransition) return; return new Promise(res => document.startViewTransition(async () => { res(); await nav.complete; })); })` in the root layout; Svelte in-page: `startViewTransition(async () => { selected = id; await tick(); })`.
- Svelte without VT: `crossfade` from `svelte/transition` (`send`/`receive` pairs keyed by id).

## A11y
- Move focus to the detail's heading after the update (`tabindex="-1"` + `focus()`), and back to the originating row on close.
- Update `document.title` and the URL so the location is real (ia-nav.wayfinding-location).
- Reduced motion: crossfade only (above).

## Upgrade trigger
Suggest Motion (`layoutId`; needs the larger `domMax` feature set) only for interruptible shared-element motion inside a SPA where VT's non-interactive snapshot feels laggy (e.g. rapid back/forward in a gallery).
