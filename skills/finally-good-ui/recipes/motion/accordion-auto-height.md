# Recipe: accordion-auto-height

**Intent:** expand and collapse content of unknown height smoothly, so the user sees where the content came from and what moved.

**Cards:** ia-nav.progressive-disclosure · motion.spatial-continuity · motion.duration-by-distance · motion.compositor-only · motion.reduced-motion · a11y.keyboard-complete

**When NOT to use:** to hide primary content most users need (disclosure has a discoverability cost — ia-nav.tension-discoverability-minimalism); for very tall panels (> ~60vh) — snap open or navigate instead; inside virtualised lists.

**Tokens:** `--duration-standard` (250, open) · `--duration-short` (150, close) · `--ease-move` · `--ease-exit`

Height is a layout property. This is the one sanctioned exception to motion.compositor-only: keep it short, on small panels, and never on many elements at once. Mark it `/* fgu-allow: animate-layout-prop */` so the static check knows it's deliberate.

## CSS baseline A — native `<details>` (progressive)
Works everywhere; animates in Chromium (`interpolate-size`), opens instantly elsewhere.
```css
details.acc::details-content {
  opacity: 0;
  transition: opacity var(--duration-short) var(--ease-exit),
              content-visibility var(--duration-short) allow-discrete;
}
details.acc[open]::details-content { opacity: 1; transition-duration: var(--duration-standard); }

@supports (interpolate-size: allow-keywords) {
  details.acc { interpolate-size: allow-keywords; }
  details.acc::details-content {
    block-size: 0; overflow: clip;
    transition: block-size var(--duration-short) var(--ease-exit), /* fgu-allow: animate-layout-prop */
                opacity var(--duration-short) var(--ease-exit),
                content-visibility var(--duration-short) allow-discrete;
  }
  details.acc[open]::details-content {
    block-size: auto;
    transition-duration: var(--duration-standard);
    transition-timing-function: var(--ease-move);
  }
}
@media (prefers-reduced-motion: reduce) {
  details.acc::details-content { transition-property: opacity, content-visibility; }
}
```

## CSS baseline B — grid rows (all browsers, custom markup)
```html
<h3><button class="acc-trigger" aria-expanded="false" aria-controls="p-ship">Shipping</button></h3>
<div id="p-ship" class="acc-panel" role="region" aria-labelledby="…" inert><div class="acc-inner">…</div></div>
```
```css
.acc-panel {
  display: grid; grid-template-rows: 0fr; opacity: 0;
  transition: grid-template-rows var(--duration-short) var(--ease-exit), /* fgu-allow: animate-layout-prop */
              opacity var(--duration-short) var(--ease-exit);
}
.acc-panel.is-open {
  grid-template-rows: 1fr; opacity: 1;
  transition-duration: var(--duration-standard);
  transition-timing-function: var(--ease-move);
}
.acc-inner { overflow: hidden; min-block-size: 0; }
@media (prefers-reduced-motion: reduce) {
  .acc-panel { transition-property: opacity; }
}
```
```js
document.querySelectorAll('.acc-trigger').forEach(btn => btn.addEventListener('click', () => {
  const open = btn.getAttribute('aria-expanded') !== 'true';
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  btn.setAttribute('aria-expanded', String(open));
  panel.classList.toggle('is-open', open);
  panel.inert = !open;              // closed content is not focusable or read
}));
```
Chevron: rotate the icon with `transform: rotate(180deg)` keyed off `[aria-expanded="true"]`, same duration.

## React + Motion
Adds value when siblings below must also glide (Motion's `layout`) or heights change while open.
```tsx
<AnimatePresence initial={false}>
  {open && (
    <m.div
      key="panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } }}
      exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease: [0.3, 0, 1, 1] } }}
      style={{ overflow: "hidden" }}
    >{children}</m.div>
  )}
</AnimatePresence>
```
Under reduced motion pass `transition={{ duration: 0 }}` for height and keep opacity.

## Vue / Svelte
- Vue: `<Transition>` can't animate to `auto`; use baseline B with a class binding, or JS hooks (`@enter` measuring `el.scrollHeight`).
- Svelte: `transition:slide={{ duration: 250 }}` handles auto height (it animates height — same exception applies). Respect reduced motion via a `duration` of 0 from a `prefersReducedMotion` store.

## A11y
- Trigger is a `<button>` inside a heading; `aria-expanded` + `aria-controls`. Closed content must be `inert`/hidden, not just clipped.
- Don't auto-collapse other sections unless the brief asks for single-open; users compare.
- `Enter`/`Space` toggle (free with `<button>`/`<summary>`).

## Upgrade trigger
None. Suggest Motion only when many items reflow around the opening panel and the project already ships it.
