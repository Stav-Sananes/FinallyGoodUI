# Recipe: scroll-linked

**Intent:** a reading-progress bar, a sticky header that condenses, and content that settles in as it scrolls into view, all driven by the scroll position in CSS, on the compositor, with no JavaScript.

**Cards:** motion.purpose-only · motion.compositor-only · motion.reduced-motion · motion.frequency-budget · usability.system-status · states.loading-perceived

**When NOT to use:** reveal-on-scroll in working screens (dashboards, tables, settings, feeds): people return to them all day and content must be readable the moment it is on screen; decorative parallax; scroll hijacking or smooth-scroll libraries (users own their scroll speed); anything that moves layout (height, top, margin) instead of transform and opacity. Reveals belong on long-form, marketing and onboarding pages only.

**Tokens:** `--ease-enter` (reveals) · `--ease-linear` (progress, anything tied 1:1 to the scroll) · `--color-primary` (progress bar). Durations don't apply: on a scroll timeline the scroll distance is the duration.

Scroll-driven animations have been Baseline since 2026-10-27 (Chrome 115, Firefox 159, Safari 26). Wrap every rule in `@supports (animation-timeline: scroll())` so older browsers show the finished state.

## CSS baseline
Write `animation-timeline` after the `animation` shorthand: the shorthand resets it.
```css
@supports (animation-timeline: scroll()) {
  /* 1. reading progress: tied 1:1 to the page scroll */
  .reading-progress {
    position: fixed; inset: 0 0 auto; height: 3px;
    background: var(--color-primary);
    transform-origin: 0 50%;
    animation: progress-grow var(--ease-linear) both;
    animation-timeline: scroll(root block);
  }
  @keyframes progress-grow { from { transform: scaleX(0); } }

  /* 2. sticky header condenses over the first 120px of scroll */
  .app-header { position: sticky; top: 0; }
  .app-header__inner {
    animation: header-condense var(--ease-linear) both;
    animation-timeline: scroll(root block);
    animation-range: 0 120px;
  }
  .app-header__title {
    transform-origin: 0 50%;
    animation: title-shrink var(--ease-linear) both;
    animation-timeline: scroll(root block);
    animation-range: 0 120px;
  }
  @keyframes header-condense { to { box-shadow: 0 1px 0 var(--color-border); } }
  @keyframes title-shrink    { to { transform: scale(0.85); } }

  /* 3. reveal: settles in while entering the viewport, then stays put */
  .reveal {
    animation: reveal-in var(--ease-enter) both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 60%;
  }
  @keyframes reveal-in { from { opacity: 0; translate: 0 16px; } }
}

@media (prefers-reduced-motion: reduce) {
  .reveal, .app-header__title { animation: none; }  /* content simply present; title keeps its size */
}
```
- The progress bar and the header are direct feedback on the user's own scroll, so they stay under reduced motion; the reveal is decoration and goes.
- The condensed header must not change height: scale the title and add a shadow. Changing height shifts the page the user is scrolling.
- A scroller other than the page: `scroll(nearest block)`, or name it with `scroll-timeline: --list block` on the scroller and `animation-timeline: --list` on the child.
- Reveal ranges: `entry` is the element crossing the bottom edge; finish by `entry 60%` so it is settled long before it is read. Never animate content that is already in view on load.
- Tailwind v4: write these as plain CSS in the main stylesheet; arbitrary properties (`[animation-timeline:view()]`) work but hide the `@supports` guard.

## React / Vue / Svelte
Nothing framework-specific: add the classes. Use Motion `useScroll` + `useTransform` only when the scroll value has to reach JavaScript (a number counting up, a canvas), and keep it on `transform`/`opacity`.

## With a smooth-scroll library
If the stack profile's `animation` lists `lenis`, these timelines still work (Lenis scrolls the real page). Route anchor jumps through it: `lenis.scrollTo(target, { duration: sec("long"), easing: easeFn("move") })`. Don't add Lenis to a project that lacks it.

## A11y
- The progress bar is decorative (`aria-hidden="true"`); if progress matters (a long form), say it in text too.
- Reveals must never hide content from screen readers or keyboard focus: they only fade and nudge; `opacity` resets by `entry 60%`.

## Upgrade trigger
GSAP ScrollTrigger, only for pinning plus multi-step scrubbed timelines (a product tour, a storytelling page), and only if the project already ships GSAP or the brief asks for that page. Ask first with the reason and size cost.
