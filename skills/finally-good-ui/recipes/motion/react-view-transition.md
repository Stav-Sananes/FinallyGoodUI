# Recipe: react-view-transition

**Intent:** in React 19.3+ (and the Next.js App Router), page changes, loading reveals and list-to-detail morphs animate through React's `<ViewTransition>` component, timed by the project's tokens, with direction carried by transition types.

**Cards:** motion.spatial-continuity · motion.frequency-budget · motion.duration-by-distance · motion.easing-roles · motion.one-signature-moment · motion.reduced-motion · ia-nav.wayfinding-location

**When NOT to use:** React below 19.3 or a non-DOM target (use route-transition / shared-element-view-transition with `document.startViewTransition`); updates that must be interruptible mid-flight (Motion `layoutId`, see shared-element-view-transition); plain `setState` updates, which don't trigger it anyway; tab-to-tab switches that happen many times a minute (no animation, or the crossfade below at `--duration-short`).

**Tokens:** `--duration-standard` (250, enter) · `--duration-short` (150, exit; also the enter delay) · `--duration-medium` (300, morph) · `--ease-enter` · `--ease-exit` · `--ease-move`

The stack profile's `viewTransitions` is `"react"` when this recipe applies.

## How React's version works
- `<ViewTransition>` animates only inside a Transition: `startTransition`, `<Suspense>` reveals, `useDeferredValue`. Next.js navigations are already Transitions.
- React calls `document.startViewTransition` itself. Never call it yourself in a React app.
- Each prop (`enter`, `exit`, `update`, `share`, `default`) takes `"auto"`, `"none"`, a class name, or an object keyed by transition type (`{ "nav-forward": "slide-forward", default: "none" }`). React adds that class as a `view-transition-class`; style it with `::view-transition-old(.cls)` / `::view-transition-new(.cls)` / `::view-transition-group(.cls)`. Don't style by `view-transition-name`.
- Put `default="none"` on every `<ViewTransition>` and list only the triggers you want. Otherwise every boundary crossfades on every unrelated transition.
- It must sit **above any DOM node** of its subtree to get enter/exit. Put route wrappers in each `page.tsx`, not in a layout: layouts persist, so enter/exit never fire there.
- `name` is for shared elements only. One mounted element per name in the whole app. A pair forms only when both sides are in the viewport.
- React skips popstate: the browser back button gets no animation. Fine: it is what users expect from back.

## Pick the pattern (most valuable first; at most three expressive moments per app)
| The person needs to… | Pattern | Props |
|---|---|---|
| follow a list item into its detail | shared element | same `name` on both sides, `share="morph" default="none"` |
| see loaded content replace its skeleton | Suspense reveal | fallback: `exit="reveal-out" default="none"`; content: `enter="reveal-in" default="none"` |
| know they went deeper or came back | directional route | `enter`/`exit` keyed by `nav-forward` / `nav-back`, `default="none"` |
| see same-place, different content (tabs, filters) | crossfade | `key={slug} name="…" share="auto" enter="auto" default="none"`; never a slide |

## Components
```tsx
import { Suspense, ViewTransition } from "react";

const DIRECTIONAL = { "nav-forward": "slide-forward", "nav-back": "slide-back", default: "none" } as const;

export function RoutePage({ children }: { children: React.ReactNode }) {
  return <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">{children}</ViewTransition>;
}

// list item and detail header share one name
<ViewTransition name={`item-${item.id}`} share="morph" default="none">
  <img src={item.thumb} alt="" />
</ViewTransition>

// skeleton hands over to content
<Suspense fallback={<ViewTransition exit="reveal-out" default="none"><DetailSkeleton /></ViewTransition>}>
  <ViewTransition enter="reveal-in" default="none"><Detail id={id} /></ViewTransition>
</Suspense>
```
Direction comes from the blueprint's hierarchy (deeper = forward, shallower = back, siblings = lateral = no type):
- Next.js: `<Link href={href} transitionTypes={["nav-forward"]}>`, or `router.push(href, { transitionTypes: ["nav-back"] })`.
- Any other router that navigates inside `startTransition`: `startTransition(() => { addTransitionType("nav-forward"); navigate(href); })`. Don't also turn on the router's own view-transition option: that calls `startViewTransition` a second time.

## CSS (tokens, exit shorter than enter, 16px of travel)
```css
::view-transition { pointer-events: none; }  /* clicks during the transition reach the live page */

:root { --vt-travel: 16px; }
::view-transition-old(.slide-forward) { --vt-to: calc(-1 * var(--vt-travel)); }
::view-transition-new(.slide-forward) { --vt-from: var(--vt-travel); }
::view-transition-old(.slide-back)    { --vt-to: var(--vt-travel); }
::view-transition-new(.slide-back)    { --vt-from: calc(-1 * var(--vt-travel)); }

::view-transition-old(.slide-forward), ::view-transition-old(.slide-back) {
  animation: vt-out var(--duration-short) var(--ease-exit) both;
}
::view-transition-new(.slide-forward), ::view-transition-new(.slide-back) {
  animation: vt-in var(--duration-standard) var(--ease-enter) var(--duration-short) both;
}
@keyframes vt-out { to   { opacity: 0; translate: var(--vt-to, 0) 0; } }
@keyframes vt-in  { from { opacity: 0; translate: var(--vt-from, 0) 0; } }

/* Suspense reveal: vertical, smaller travel */
::view-transition-old(.reveal-out) { animation: vt-out-y var(--duration-short) var(--ease-exit) both; }
::view-transition-new(.reveal-in)  { animation: vt-in-y var(--duration-standard) var(--ease-enter) var(--duration-short) both; }
@keyframes vt-out-y { to   { opacity: 0; translate: 0 calc(var(--vt-travel) / 2); } }
@keyframes vt-in-y  { from { opacity: 0; translate: 0 calc(var(--vt-travel) / 2); } }

/* shared element: the group moves, the image pair crossfades */
::view-transition-group(.morph) { animation-duration: var(--duration-medium); animation-timing-function: var(--ease-move); }

/* the shell stays still */
.app-header { view-transition-name: app-header; }
::view-transition-group(app-header) { animation: none; z-index: 1; }
::view-transition-old(app-header) { display: none; }
::view-transition-new(app-header) { animation: none; }

@media (prefers-reduced-motion: reduce) {
  :root { --vt-travel: 0px; }  /* keep the fades, drop the travel */
  ::view-transition-group(.morph) { animation-duration: 0s; }
}
```
The header rule names the header element directly, the one place a name is the right selector: it opts that element out.

## JS hooks
Only for something CSS can't express (measured distances, per-type timing). Return the cleanup so an interrupted transition cancels:
```tsx
import { ms, cssEase, msMotion } from "./motion-tokens"; // recipes/INDEX.md
<ViewTransition default="none" enter="auto" onEnter={(instance) => {
  const a = instance.new.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms("standard"), easing: cssEase("enter") });
  return () => a.cancel();
}}>
```
Use `msMotion()` instead of `ms()` for any keyframes that move.

## A11y
- Move focus to the new page's `h1` (`tabindex="-1"`) after a route change, or announce the title in a live region. Update `document.title`.
- `aria-current="page"` on the active nav item.
- React does not reduce motion for you: the media query above is required.

## Upgrade trigger
None. This is React's built-in path. Use Motion `layoutId` only when a morph has to be interruptible (rapid back-and-forth on mobile) and the project already ships Motion.
