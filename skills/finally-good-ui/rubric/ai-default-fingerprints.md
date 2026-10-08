# The thoughtlessness test — generic-AI-look fingerprints

This is **not a ban list.** Each pattern below is what a model produces when nothing in the brief pushed it anywhere. It signals that a default was accepted instead of a decision being made. Any of them is allowed **if the brief justifies it**. The test is whether the choice can be traced to the brief, not whether it appears.

Used by: `modules/directions.md` (before showing directions), `agents/direction-builder.md`, `agents/ui-reviewer.md` (dimension 10).

## How to run it

1. Check the rendered screens (and code where noted) against every fingerprint.
2. For each match, look for a justification in `.design/decisions.md`. If there is none, write one or revise.
3. A justification must pass all three:
   - **Traceable:** it cites a specific line of `brief.md` (audience, personality answer, brand constraint, content type) and a canon card.
   - **Specific:** it would not be equally true of any other product. "Modern and clean" fails. "Brand guide mandates Inter; body set at 15px for dense tables (brief: constraints.brand, content.volume)" passes.
   - **Better than the alternative:** it names the alternative that was considered and why it lost.
   Format in `decisions.md`: `Fingerprint <id> kept — brief: "<quoted brief line>" — card: <id> — rejected alternative: <x> because <y>.`
4. Unjustified matches score against dimension 10: 1 low-weight → max 4; 2+ → max 3; the page reads as a template → max 2.
5. **Cluster cap.** Three or more matches from *Surface and material* on one screen (glass, glow, mesh/orb, grain, grid pattern, mono costume) read as trend-stacking even if each is justified: dimension 10 max 3 until the screen keeps one material (craft.material-restraint).
6. **Both failure directions count.** The noisy template and the *sterile default* below are equally generic. Fixing one by producing the other is not a fix.

`static:` names the `check-static` rule that detects an entry mechanically; run `node scripts/check-static.mjs --root <project>` and read the `low` findings too (the edit hook only surfaces high/medium).

## Fingerprints

Each entry: **detect** (V = visual, C = code) · **why it signals thoughtlessness** · card to reason from.

### Colour and surface
- **purple-blue-gradient-hero** — V: hero or CTA with a violet→blue (or indigo→pink) gradient. C: `from-purple-*`/`from-indigo-*` `to-blue-*`, `linear-gradient(… #8b5cf6 … #3b82f6 …)`. static: purple-blue-gradient. Why: it is the statistical average of SaaS landing pages, so it communicates "startup" and nothing about this product. Card: color.accent-restraint, personality.*.
- **cream-serif-terracotta** — V: warm off-white page (~`#F4F1EA`), a high-contrast serif display face, terracotta/rust accent. Why: the current default for "tasteful" or "editorial" output; it replaces a personality decision with a costume. Card: personality.calm, typography.limited-families-weights.
- **near-black-acid-accent** — V: `#0a0a0a`-ish background with one acid-green, lime or vermilion accent and mono type. Why: the default for "technical" or "bold"; interchangeable across dev tools. Card: color.role-scale, personality.energetic.
- **gradient-text-headline** — V: headline filled with a gradient. C: `bg-clip-text text-transparent`, `background-clip: text`. static: gradient-text. Why: emphasis by effect rather than by hierarchy; also often fails contrast at the ends. Card: layout.hierarchy-by-weight, a11y.contrast-minimums.
- **same-card-everywhere** — V: every container has the same large radius and the same soft shadow, whatever its role. C: one `rounded-xl shadow-lg` (or equivalent) repeated on all cards. Why: elevation and radius should encode role (surface, raised, overlay); uniformity means they encode nothing. Card: color.role-scale, usability.consistency-standards, craft.concentric-radii.

### Type
- **default-sans** — V/C: Inter, Space Grotesk, Geist or the system stack chosen with no stated reason. Why: the choice was never made. These faces are fine; unexplained, they signal the default. Card: typography.limited-families-weights, personality.*.
- **mono-as-costume** — V: monospace for headings, nav or body where there is no code or tabular data. Why: worn to look "technical"; mono is for data that must align. Card: typography.limited-families-weights, craft.number-setting.
- **mixed-family-emphasis** — V/C: one word of a sans headline set in a serif (often italic), or the reverse. Why: a current generated-UI tell that breaks the type voice; emphasis belongs to the same family's italic or weight. Card: craft.headline-discipline.
- **untracked-display** — V: large headlines at default letter-spacing and line-height ~1.5, small caps labels with no tracking. Why: type left at defaults. Card: craft.tracking-by-size.

### Layout
- **everything-centered** — V: every section centre-aligned: headline, paragraph, buttons, cards. Why: centring removes the reading edge and flattens hierarchy; it is the zero-decision layout. Card: layout.grid-alignment, typography.measure.
- **uniform-bento** — V: a grid of equal-weight tiles, each with icon + title + blurb, sizes varied only for decoration. Why: a bento says "these are all equally important", which is almost never true. Card: layout.hierarchy-by-weight, data.dashboard-summary-first.
- **three-icon-feature-row** — V: three columns, each an icon in a tinted circle, a short bold title and two lines of copy. Why: the canonical filler section; it exists because the template has it, not because the user needs three facts at equal weight. Card: layout.hierarchy-by-weight, writing.front-load.
- **eyebrow-on-every-section** — V: small uppercase tracked label above every heading ("FEATURES", "HOW IT WORKS"). Why: a label repeated everywhere stops labelling. Includes the hero pill-with-dot above the H1 that repeats the headline. static: eyebrow-overuse (4+ in a file). Card: layout.tension-consistency-emphasis.
- **div-fake-screenshot** — V: a "product screenshot" drawn from grey bars and boxes, or a browser frame around nothing. Why: shows the absence of real content; the brief's content types should be used instead. Card: states.empty-state-teaches, writing.user-language.

### Motion and effects
- **fade-up-every-section** — V: each section fades and slides up as it scrolls in. C: a shared `whileInView`/`data-aos`/IntersectionObserver reveal on every block. Why: motion without a change to explain; it taxes readers on every visit. Card: motion.purpose-only, motion.frequency-budget.
- **ambient-backgrounds** — V: aurora blobs, meteors, beams, animated grids, particle fields. C: Aceternity/Magic-UI style components, infinite keyframes on background layers. Static versions count too: dot/grid background patterns and blurred colour orbs behind the hero. static: bg-pattern, blurred-orb. Why: decoration in the most expensive medium; competes with content and costs GPU. Card: motion.purpose-only, motion.compositor-only.
- **shimmer-border** — V: animated gradient or shine sweeping around buttons/cards. Why: borrowed urgency; when everything shimmers, nothing is primary. Card: motion.one-signature-moment, color.accent-restraint.

### Content
- **emoji-section-markers** — V: emoji used as bullets, section icons or headline prefixes. static: emoji-ui. Why: stands in for an icon system and a voice decision. Card: personality.*, writing.user-language.
- **fake-stats** — V: "99.9% uptime", "10k+ users", "4.9★", "SOC 2", "+12% this week" deltas on every KPI, testimonials with name and title, rows of customer logos, with no source in the brief. static: unsourced-claim. Why: invented trust signals; misleading in a real product. Card: writing.user-language, data.data-ink.
- **placeholder-names** — V: "Acme", "Jane Doe", "Lorem ipsum", "Product Name", `example.com` data, pravatar/randomuser faces, undraw illustrations. static: placeholder-content. Why: layouts tuned on fake content break on real content (length, volume, tone). Use the brief's content types and realistic volumes. Card: writing.user-language, states.partial-and-permission.

### App and dashboard templates
- **default-dashboard-shell** — V: sidebar + top bar + a row of 4 equal KPI tiles + one area chart + one table, whatever the domain. Why: the app-world equivalent of the landing template; it mirrors the component library, not the user's question (SKILL non-negotiable 10). Card: data.dashboard-summary-first, layout.hierarchy-by-weight.
- **filler-activity-feed** — V: "Sarah Chen updated a doc · 2h ago" rows with invented people. Why: makes an empty product look busy; tells the user nothing they asked for. Card: craft.honest-content.
- **generic-table-columns** — V: Name / Status / Date / Actions with a ⋯ menu on every row. Why: columns came from the component, not from what the user scans for; the one action they take most is hidden in a menu. Card: data.dense-tables, flows-forms.primary-action-clarity.
- **chart-without-question** — V: a chart titled "Overview", "Performance" or "Analytics". Why: a chart is an answer; its title should be the question or the finding ("Payments arrive 9 days late on average"). Card: data.chart-choice.
- **redundant-status-tags** — V: a caps chip ("OVERDUE", "EXPECTED", "DUE SOON") on every row of a group whose header already says it, or a badge repeating what a column shows. Why: a label repeated everywhere stops labelling and turns a list into chrome. Show status once (group header or column), mark only the exceptions. Card: layout.tension-consistency-emphasis, data.status-encoding.
- **box-in-box** — V: a card inside a card inside a panel, each with border and radius. Why: every box adds an edge; structure should come from space and hairlines. Card: craft.hairlines-before-boxes.
- **dead-controls** — V/C: links to `#`, buttons that do nothing, tabs that don't switch. Why: a finished look over nothing. static: dead-control, placeholder-code. Card: craft.nothing-dead.

### Surface and material
- **glass-everywhere** — V: frosted translucent panels on nav, cards and modals alike. C: `backdrop-filter`/`backdrop-blur` on 3+ surfaces. Why: when everything is frosted, nothing sits in front. static: glass-overuse. Card: craft.material-restraint.
- **glow-everywhere** — V: coloured halos around buttons, cards or icons. C: `box-shadow: 0 0 40px <hue>`, `shadow-violet-500/50`. Why: glow is a pointer; used as decoration it points nowhere. static: colored-glow. Card: craft.material-restraint.
- **pill-everything** — V: inputs, cards, badges and buttons all fully rounded. Why: radius stops telling element types apart. Card: craft.concentric-radii.
- **default-black-shadow** — V: one grey-black blur under every raised thing; heavy shadows in dark mode. Why: an unedited `shadow-lg`; real light is layered and tinted. Card: craft.tinted-shadows.
- **dark-for-tech** — V: dark theme as the only or default theme with no brief reason. Why: a trend standing in for a decision. Card: color.dark-mode-not-inverted, personality.*.
- **left-stripe-cards** — V: a thick coloured left border on cards or callouts that carry no state. Why: the cheapest way to look "designed". Card: color.accent-restraint.

### Imagery and icons
- **hand-drawn-svg-and-shapes** — V: product images, avatars or illustrations replaced by geometric blobs, gradient rectangles or hand-drawn SVG. Why: says "nothing real here". Card: craft.real-imagery-and-icons.
- **ai-icon-vocabulary** — V/C: sparkles, wand, rocket, zap, gem, robot as feature icons. static: ai-icon. Card: craft.real-imagery-and-icons.
- **mixed-icon-families** — V: icons with different stroke widths, fills or corner styles on one screen. Card: craft.real-imagery-and-icons.
- **fake-terminal** — V: macOS traffic-light dots framing a fake window or terminal. static: fake-terminal. Card: craft.real-imagery-and-icons.
- **arrow-on-every-button** — V: `→`/`↗` appended to most buttons and links. Why: once it is a pattern, the arrow means nothing. Card: writing.action-labels.
- **decorative-live-dot** — V: a small pulsing dot marking nothing live. static: decorative-pulse. Card: motion.purpose-only.

### Landing-page templates
- **template-section-sequence** — V: hero → logo bar → 3 features → numbered "how it works" 1-2-3 → testimonials → 3-tier pricing with a "Most popular" middle → FAQ → 4-column footer. Each part may be fine; the sequence is the template. Why: sections exist because templates have them. Card: craft.composition-rhythm.
- **same-section-template** — V: every section is centred title + subtitle + identical card grid; sections differ only by background colour. Card: craft.composition-rhythm.
- **generic-faq** — V: "Is my data secure? Can I cancel anytime?" with no relation to the product. Card: writing.user-language.

### Copy
- **buzzword-copy** — V: unlock, elevate, seamless, empower, supercharge, next-level, "the future of". static: buzzword. Card: writing.plain-claims.
- **generic-cta** — V: Get started, Learn more, Explore, Discover. static: generic-cta. Card: writing.action-labels.
- **generated-cadence** — V: em dashes in UI copy; "not just X, it's Y"; runs of fragments ("No setup. No limits."); lists of exactly three everywhere. static: em-dash-copy. Card: writing.plain-claims.

### The sterile default (the other failure)
- **sterile-default** — V: near-white page, thin grey borders, 6-8px radius everywhere, a default sans, no accent anywhere, no motif, no focal point, every section the same weight. Why: what you get by deleting the slop above without adding a point of view. Clean and correct, and just as interchangeable. Card: craft.tension-restraint-liveliness, craft.identity-motif.

## Reviewer output for this test

```json
{"fingerprints":[{"id":"gradient-text-headline","where":"h1.hero-title (home, 1440-light)","justified":false,
  "justification":null,"suggest":"solid foreground at display weight; carry emphasis with size and position"}]}
```
A fingerprint marked `justified:true` must quote the `decisions.md` entry. Do not accept a justification that fails any of the three tests above.
