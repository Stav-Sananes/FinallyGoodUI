# Recipe: first-paint

**Intent:** the first time someone opens the app in a session, the main screen assembles in reading order instead of popping in all at once: the frame is already there, the headline fact arrives, then the content below it. It takes about half a second, runs once per session, and never hides content from someone who can't run it.

**Cards:** motion.purpose-only · motion.frequency-budget · motion.one-signature-moment · layout.hierarchy-by-weight · data.dashboard-summary-first · states.loading-perceived · motion.compositor-only · motion.reduced-motion

**When NOT to use:** navigation between screens (route-transition); returning to the screen in the same session; every screen of the app (only the landing screen); content that arrives later from the network (skeleton-to-content owns that); tools opened dozens of times a day (they appear at once; a cascade on every open is a tax).

**Tokens:** `--duration-long` (400, each part) · `--duration-instant` (50, step between parts) · `--ease-enter` · `--duration-hero` (600, ceiling for the whole cascade)

## Baseline
The shell (header, nav) never animates: it's the stage. Up to four parts below it carry an order index; each rises 20px and fades in, one short step after the previous. The whole sequence ends by 550ms (400 + 3 × 50).
```html
<html class="first-paint">
<main>
  <h1 class="fp" style="--fp: 0">Monday, 9 November</h1>
  <section class="fp" style="--fp: 1">…the key figure…</section>
  <section class="fp" style="--fp: 2">…supporting cards…</section>
  <section class="fp" style="--fp: 3">…the list…</section>
</main>
```
```css
.first-paint .fp {
  animation: fp-rise var(--duration-long) var(--ease-enter) both;
  animation-delay: calc(var(--fp, 0) * var(--duration-instant));
}
@keyframes fp-rise { from { opacity: 0; transform: translateY(20px); } }
@media (prefers-reduced-motion: reduce) {
  .first-paint .fp { animation-name: fp-fade; animation-delay: 0s; }
}
@keyframes fp-fade { from { opacity: 0; } }
```
Order follows importance and reading order (layout.hierarchy-by-weight): summary first, detail last. Animate sections, not every card in them; four steps is the maximum.

## Once per session, never blocking
Content is visible by default; the class that animates it is added before first paint only when it's the session's first view, so no-JS readers and crawlers see everything.
```html
<script>
  // inline in <head>, before the stylesheet paints
  try {
    if (!sessionStorage.getItem("fp-seen")) { document.documentElement.classList.add("first-paint"); sessionStorage.setItem("fp-seen", "1"); }
  } catch { /* storage blocked: skip the cascade */ }
</script>
```
`animation-fill-mode: both` (in the shorthand) holds each part hidden only for its own delay, at most 150ms.

## With data that loads
If the key figure comes from the network, the cascade plays on the skeletons (they are the layout), and the real values fade in over them via skeleton-to-content. Don't wait for the data to start the cascade, and don't run the cascade twice.

## React + Motion
Not needed. In a React app put the inline script in the document head (Next: `app/layout.tsx` `<script dangerouslySetInnerHTML>` before the stylesheet) and the `fp` class and `--fp` index on the sections.

## Vue / Svelte
Same: inline head script in `index.html` / `app.html`; static classes on the sections.

## A11y
- Content is in the DOM and readable from the start; the animation only changes opacity and position.
- Focus and the page title are never moved by the cascade.
- Under reduced motion the parts fade in together, no movement.

## Upgrade trigger
None. If the landing screen needs a staged story (onboarding, marketing), that is scroll-linked or a dedicated onboarding flow, not this.
