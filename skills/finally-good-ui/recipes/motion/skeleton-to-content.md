# Recipe: skeleton-to-content

**Intent:** while data loads, show the page's real shape; when it arrives, fade content in on exactly the same footprint so nothing jumps.

**Cards:** states.loading-perceived · usability.system-status · motion.compositor-only · motion.reduced-motion · layout.intrinsic-responsive · states.error-recovery

**When NOT to use:** loads under ~300ms (skeleton flash is worse than nothing — delay it); actions the user triggered on one element (use an inline spinner/progress on that control — states.optimistic-feedback); when the layout is unknown (a generic grey block lies about the shape; use a centred progress indicator).

**Tokens:** `--duration-standard` (250, content in) · `--duration-short` (150, skeleton appear) · `--duration-medium` (300, delay before the skeleton shows) · `--ease-enter` · shimmer 1.2–1.6s `--ease-linear` (loop; exempt from the 500ms cap because it is ambient, not a transition) · `--color-muted`

## CSS baseline
```html
<section class="region" aria-busy="true" data-state="loading">
  <div class="skeleton" aria-hidden="true">
    <span class="sk sk-title"></span><span class="sk sk-line"></span><span class="sk sk-line" style="inline-size: 60%"></span>
  </div>
  <div class="content"><!-- rendered when data arrives --></div>
</section>
```
```css
.region { display: grid; }
.region > .skeleton, .region > .content { grid-area: 1 / 1; }  /* stack: same footprint, no shift */

.sk {
  display: block; position: relative; overflow: hidden;
  background: var(--color-muted); border-radius: var(--radius-sm);
  block-size: 1em; margin-block: 0.5em;
}
.sk-title { block-size: 1.5em; inline-size: 40%; }
.sk::after {                                    /* shimmer: transform only */
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.35), transparent);
  transform: translateX(-100%);
  animation: sk-shimmer 1.4s linear infinite;
}
[data-theme="dark"] .sk::after { background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.06), transparent); }
@keyframes sk-shimmer { to { transform: translateX(100%); } }

/* delay the skeleton so fast loads never flash it */
.region[data-state="loading"] .skeleton { animation: sk-appear var(--duration-short) var(--ease-enter) var(--duration-medium) both; }
@keyframes sk-appear { from { opacity: 0; } }

.region .content { opacity: 0; }
.region:not([data-state="loading"]) .skeleton { display: none; }   /* ready or error */
.region:not([data-state="loading"]) .content {
  opacity: 1;
  transition: opacity var(--duration-standard) var(--ease-enter);
}

@media (prefers-reduced-motion: reduce) {
  .sk::after { animation: none; display: none; }   /* static placeholder; fade-in stays */
}
```
```js
async function load(region, fetcher, render) {
  region.dataset.state = 'loading'; region.setAttribute('aria-busy', 'true');
  try {
    render(region.querySelector('.content'), await fetcher());
    region.dataset.state = 'ready';
  } catch (err) {
    renderError(region.querySelector('.content'), err, () => load(region, fetcher, render)); // message + Retry
    region.dataset.state = 'error';       // never leave the skeleton up
  } finally { region.removeAttribute('aria-busy'); }
}
```
- Skeleton geometry must match the real content (same line-heights, avatar size, row count up to the viewport). Measure it at 375 and 1440; CLS should be ~0.
- Gradient colours belong in tokens (`--color-skeleton-shine`) in real code.
- Stream in progressively where possible: each region has its own skeleton; don't block the page on the slowest query.

## React + Motion
Not needed. React: render the skeleton in `<Suspense fallback={<RegionSkeleton/>}>` or on `isPending`; give the content wrapper the `.content` fade class. Use `useDeferredValue`/transitions to keep old content visible on refetch instead of flashing skeletons again.

## Vue / Svelte
- Vue: `<Suspense>` with `#fallback`, or `v-if="pending"` + `<Transition name="fade">` on the content.
- Svelte: `{#await promise}<Skeleton/>{:then data}<div in:fade={{ duration: ms('standard') }}>…</div>{:catch e}<ErrorState {e}/>{/await}`.

## A11y
- `aria-busy="true"` on the updating region; skeleton blocks `aria-hidden="true"`. Announce completion only if the user is waiting on it ("12 invoices loaded") via a polite live region.
- Don't let focus land in the skeleton; keep interactive controls outside the loading region enabled where possible.

## Upgrade trigger
None.
