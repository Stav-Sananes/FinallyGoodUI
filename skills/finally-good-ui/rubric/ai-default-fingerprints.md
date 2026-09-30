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

## Fingerprints

Each entry: **detect** (V = visual, C = code) · **why it signals thoughtlessness** · card to reason from.

### Colour and surface
- **purple-blue-gradient-hero** — V: hero or CTA with a violet→blue (or indigo→pink) gradient. C: `from-purple-*`/`from-indigo-*` `to-blue-*`, `linear-gradient(… #8b5cf6 … #3b82f6 …)`. Why: it is the statistical average of SaaS landing pages, so it communicates "startup" and nothing about this product. Card: color.accent-restraint, personality.*.
- **cream-serif-terracotta** — V: warm off-white page (~`#F4F1EA`), a high-contrast serif display face, terracotta/rust accent. Why: the current default for "tasteful" or "editorial" output; it replaces a personality decision with a costume. Card: personality.calm, typography.limited-families-weights.
- **near-black-acid-accent** — V: `#0a0a0a`-ish background with one acid-green, lime or vermilion accent and mono type. Why: the default for "technical" or "bold"; interchangeable across dev tools. Card: color.role-scale, personality.energetic.
- **gradient-text-headline** — V: headline filled with a gradient. C: `bg-clip-text text-transparent`, `background-clip: text`. Why: emphasis by effect rather than by hierarchy; also often fails contrast at the ends. Card: layout.hierarchy-by-weight, a11y.contrast-minimums.
- **same-card-everywhere** — V: every container has the same large radius and the same soft shadow, whatever its role. C: one `rounded-xl shadow-lg` (or equivalent) repeated on all cards. Why: elevation and radius should encode role (surface, raised, overlay); uniformity means they encode nothing. Card: color.role-scale, usability.consistency-standards.

### Type
- **default-sans** — V/C: Inter, Space Grotesk, Geist or the system stack chosen with no stated reason. Why: the choice was never made. These faces are fine; unexplained, they signal the default. Card: typography.limited-families-weights, personality.*.

### Layout
- **everything-centered** — V: every section centre-aligned: headline, paragraph, buttons, cards. Why: centring removes the reading edge and flattens hierarchy; it is the zero-decision layout. Card: layout.grid-alignment, typography.measure.
- **uniform-bento** — V: a grid of equal-weight tiles, each with icon + title + blurb, sizes varied only for decoration. Why: a bento says "these are all equally important", which is almost never true. Card: layout.hierarchy-by-weight, data.dashboard-summary-first.
- **three-icon-feature-row** — V: three columns, each an icon in a tinted circle, a short bold title and two lines of copy. Why: the canonical filler section; it exists because the template has it, not because the user needs three facts at equal weight. Card: layout.hierarchy-by-weight, writing.front-load.
- **eyebrow-on-every-section** — V: small uppercase tracked label above every heading ("FEATURES", "HOW IT WORKS"). Why: a label repeated everywhere stops labelling. Card: layout.tension-consistency-emphasis.
- **div-fake-screenshot** — V: a "product screenshot" drawn from grey bars and boxes, or a browser frame around nothing. Why: shows the absence of real content; the brief's content types should be used instead. Card: states.empty-state-teaches, writing.user-language.

### Motion and effects
- **fade-up-every-section** — V: each section fades and slides up as it scrolls in. C: a shared `whileInView`/`data-aos`/IntersectionObserver reveal on every block. Why: motion without a change to explain; it taxes readers on every visit. Card: motion.purpose-only, motion.frequency-budget.
- **ambient-backgrounds** — V: aurora blobs, meteors, beams, animated grids, particle fields. C: Aceternity/Magic-UI style components, infinite keyframes on background layers. Why: decoration in the most expensive medium; competes with content and costs GPU. Card: motion.purpose-only, motion.compositor-only.
- **shimmer-border** — V: animated gradient or shine sweeping around buttons/cards. Why: borrowed urgency; when everything shimmers, nothing is primary. Card: motion.one-signature-moment, color.accent-restraint.

### Content
- **emoji-section-markers** — V: emoji used as bullets, section icons or headline prefixes. Why: stands in for an icon system and a voice decision. Card: personality.*, writing.user-language.
- **fake-stats** — V: "99.9% uptime", "10k+ users", "4.9★" with no source in the brief. Why: invented trust signals; misleading in a real product. Card: writing.user-language, data.data-ink.
- **placeholder-names** — V: "Acme", "Jane Doe", "Lorem ipsum", "Product Name", `example.com` data. Why: layouts tuned on fake content break on real content (length, volume, tone). Use the brief's content types and realistic volumes. Card: writing.user-language, states.partial-and-permission.

## Reviewer output for this test

```json
{"fingerprints":[{"id":"gradient-text-headline","where":"h1.hero-title (home, 1440-light)","justified":false,
  "justification":null,"suggest":"solid foreground at display weight; carry emphasis with size and position"}]}
```
A fingerprint marked `justified:true` must quote the `decisions.md` entry. Do not accept a justification that fails any of the three tests above.
