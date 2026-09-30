# Pattern: app-shell-nav

**Intent:** a persistent frame (nav + header + content) that always shows where you are, where you can go, and adapts from phone to desktop.

**Cards:** ia-nav.visible-destinations · ia-nav.nav-model-by-count · ia-nav.wayfinding-location · ia-nav.shallow-vs-deep · layout.intrinsic-responsive · a11y.keyboard-complete · motion.spatial-continuity

**When NOT to use:** single-task tools and landing pages (a header is enough); immersive flows (checkout, onboarding, editors) — hide the shell and give one clear exit.

**Tokens:** `--space-*` · `--color-background/foreground/muted/border/accent` · `--duration-short` · `--duration-standard` · `--ease-enter` · `--ease-exit`

## Structure
Choose the model from the blueprint's destination count (ia-nav.nav-model-by-count):
| Top-level destinations | Desktop | Mobile (< 768px) |
|---|---|---|
| 2–5 | top bar or sidebar | bottom tab bar |
| 6–9 | sidebar (grouped) | bottom bar with 4 + "More", or drawer |
| 10+ / user-created (projects, channels) | sidebar with sections + search | drawer + search |

- Regions: skip link → `header` (product, search, account) → `nav` → `main`. One `h1` per page in `main`.
- Location: active item has `aria-current="page"` plus a non-colour cue (weight, indicator bar) — color.color-not-sole-signal. Deep pages add breadcrumbs or a back button with the parent's name.
- Keep destinations visible; don't hide primary nav behind a hamburger on desktop (ia-nav.visible-destinations).

## States
| State | Shell behaviour |
|---|---|
| loading (first) | render the shell immediately; skeleton only inside `main` |
| empty (new account) | shell complete; nav items all present; `main` shows the first-run empty state |
| error (a section fails) | shell stays usable; the error lives in `main` with retry |
| partial | nav badges/counters may be missing — hide the badge, never show "NaN"/"0" guesses |
| no-permission | hide destinations the role can never access; show-but-disable (with reason) ones they could request |
| offline | slim banner under the header; don't block navigation to cached pages |

## CSS baseline
```html
<a class="skip" href="#main">Skip to content</a>
<div class="shell">
  <header class="shell-header">…</header>
  <nav class="shell-nav" aria-label="Primary"><ul>
    <li><a href="/inbox" aria-current="page">Inbox</a></li><li><a href="/reports">Reports</a></li>
  </ul></nav>
  <main id="main" tabindex="-1">…</main>
</div>
```
```css
.shell {
  min-block-size: 100dvh;
  display: grid;
  grid-template: "header" auto "main" 1fr "nav" auto / 1fr;          /* mobile: bottom tabs */
}
.shell-header { grid-area: header; position: sticky; top: 0; z-index: 10; background: var(--color-background); border-block-end: 1px solid var(--color-border); }
.shell-nav    { grid-area: nav; position: sticky; bottom: 0; background: var(--color-background); border-block-start: 1px solid var(--color-border); padding-block-end: env(safe-area-inset-bottom); }
.shell-nav ul { display: flex; justify-content: space-around; margin: 0; padding: 0; list-style: none; }
.shell-nav a  { display: grid; place-items: center; min-block-size: 48px; min-inline-size: 48px; padding-inline: var(--space-2); color: var(--color-muted-foreground); text-decoration: none; }
.shell-nav a[aria-current="page"] { color: var(--color-foreground); font-weight: 600; }
main { grid-area: main; min-inline-size: 0; padding: var(--space-4); }

@media (min-width: 768px) {
  .shell { grid-template: "nav header" auto "nav main" 1fr / 240px 1fr; }
  .shell-nav { position: sticky; top: 0; block-size: 100dvh; border-block-start: 0; border-inline-end: 1px solid var(--color-border); overflow-y: auto; }
  .shell-nav ul { flex-direction: column; justify-content: start; gap: var(--space-1); padding: var(--space-3); }
  .shell-nav a { place-items: center start; min-block-size: 36px; padding-inline: var(--space-3); border-radius: var(--radius-sm); }
  .shell-nav a[aria-current="page"] { background: var(--color-accent); }
}
@media (hover: hover) and (pointer: fine) {
  .shell-nav a:hover { color: var(--color-foreground); }
}
.skip { position: absolute; transform: translateY(-200%); }
.skip:focus { transform: none; z-index: 100; }
```
- Page-to-page motion: route-transition (only `main` animates; the shell never moves).
- Collapsible sidebar: toggle `grid-template-columns` instantly or cross-fade labels; don't animate width on every toggle.

## React + Motion
Not needed for the shell. Optional: a sliding active indicator with `layoutId="nav-indicator"` (needs `domMax`) — only if motion personality is balanced/expressive.

## Vue / Svelte
- Vue: shell in `App.vue`/Nuxt `layouts/default.vue`; `RouterLink` sets `aria-current="page"` automatically on exact-active.
- SvelteKit: shell in `+layout.svelte`; `aria-current={page.url.pathname === href ? 'page' : undefined}` (`page` from `$app/state`).

## A11y
- Skip link first in tab order; landmarks labelled; nav reachable in ≤ 2 tabs after the skip link.
- Bottom-bar targets ≥ 48px with visible labels (icons alone fail recognition — usability.recognition-over-recall).
- After route change, focus `main` (or its `h1`) and update `document.title`.

## Upgrade trigger
None. Suggest a headless menu/drawer component only if the stack lacks one and the mobile drawer needs focus trapping (or use `<dialog>`).
