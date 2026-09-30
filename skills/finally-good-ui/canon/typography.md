# Typography

Scope: readable, ordered text. Covers line length, the size scale, families and weights, leading and numerals. These cards set `tokens.text` and `tokens.font`.

### typography.measure
```yaml
id: typography.measure
domain: typography
principle: "Keep running text to 45–75 characters per line, with about 66 as the target for body copy. Cap text containers with max-width in ch (about 60–70ch), not with page width. Narrow columns (captions, sidebars) can drop to about 30–40."
why: "Long lines make the return sweep to the next line error-prone. Short lines break phrases and force constant eye jumps. Both slow reading and reduce comprehension."
sources: ["Bringhurst, The Elements of Typographic Style, §2.1.2 (comfortable measure)", "Wathan & Schoger, Refactoring UI, 'Designing Text' (keep line length in check)", "Pickering & Bell, Every Layout, 'Axioms' (measure)", "WCAG 2.2, SC 1.4.8 Visual Presentation (80-character limit, AAA)"]
applies-when: "Paragraphs, descriptions, docs, articles, long form help and empty-state copy."
not-when: "Tables, labels, nav items and single-line UI strings."
decides: [tokens.text, layout.grid, component.prose]
tensions: [layout.intrinsic-responsive, data.tension-density-clarity]
asked-by: [interview.context.session, interview.content.type]
checks:
  measured: "For p and li elements rendering 2 or more lines, content-box width divided by the width of '0' at that font (ch) is between 45 and 75. Warn above 80."
  judged: "Does any paragraph run edge-to-edge on a wide screen, or wrap every few words in a narrow card?"
```

### typography.type-scale
```yaml
id: typography.type-scale
domain: typography
principle: "Choose all font sizes from one predefined scale of about 6–9 steps. Use a ratio of about 1.125–1.25 for dense product UI and 1.25–1.333 or more for editorial or expressive work, or a hand-tuned set such as 12, 14, 16, 18, 20, 24, 30, 36, 48. Body text is 16 px or more on the web, and each step is used for one role."
why: "A scale makes size carry meaning (this is a heading, this is metadata) and removes guesswork between near-identical sizes. The ratio sets the voice. Tight ratios feel calm and dense, and wide ones feel dramatic."
sources: ["Bringhurst, The Elements of Typographic Style, §3.1.1 (compose with a scale)", "Wathan & Schoger, Refactoring UI, 'Designing Text' (establish a type scale)", "Pickering & Bell, Every Layout, 'Modular scale'", "Material 3, Typography (type scale roles)"]
applies-when: "Defining tokens.text, and for every heading, body, label and caption."
not-when: "Display text in a single hero may use a fluid clamp() size outside the scale if it is logged as the emphasis break."
decides: [tokens.text]
tensions: [layout.tension-consistency-emphasis, personality.dense-expert]
asked-by: []
checks:
  measured: "Collect distinct computed font-size values across all screens. Flag more than 9, any value not in tokens.text, and body text under 16 px (under 14 px for dense UI chrome)."
  judged: "Does each size map to one clear role, and are there two sizes so close that their difference reads as a mistake?"
```

### typography.limited-families-weights
```yaml
id: typography.limited-families-weights
domain: typography
principle: "Use one typeface family for UI, or two at most (for example, a display face for headings and a text face for body), plus a monospace only if code or data needs it. Use 2–3 weights, typically regular 400, medium 500 or semibold 600, and bold 700. Each weight has a role."
why: "Every added family or weight adds another voice and another download. Contrast comes from a few well-separated weights, not from many close ones. A text face must be built for small sizes, with open apertures, a generous x-height and hinting."
sources: ["Lupton, Thinking with Type, 'Letter' (type families and pairing)", "Wathan & Schoger, Refactoring UI, 'Designing Text' (use good fonts, weights)", "Bringhurst, The Elements of Typographic Style, ch.6 Choosing & Combining Type"]
applies-when: "Choosing tokens.font and defining weight usage for headings, labels and emphasis."
not-when: "Brand guidelines that mandate a set of faces. Follow the brand, but still limit the weights used."
decides: [tokens.font, tokens.text]
tensions: [personality.playful, personality.serious-trustworthy]
asked-by: [interview.constraints.brand]
checks:
  measured: "Distinct computed font-family stacks (first family) are 3 or fewer. Distinct font-weight values are 4 or fewer. Every loaded font file is actually used on at least one screen."
  judged: "Does the type voice match the brief's personality, and is each weight used for a consistent purpose?"
```

### typography.line-height
```yaml
id: typography.line-height
domain: typography
principle: "Set leading in proportion to size and measure. Body text gets about 1.45–1.6, UI labels and short lines about 1.3–1.4, and large headings about 1.05–1.25. Longer lines need more leading and larger sizes need less. Layouts must survive users raising it to 1.5."
why: "Enough leading helps the eye find the next line, especially on long measures, but big text with body leading falls apart into separate lines. Readers with low vision or dyslexia often override spacing, so fixed-height boxes must not clip."
sources: ["Bringhurst, The Elements of Typographic Style, §2.2.1 (choose leading for face, text and measure)", "Wathan & Schoger, Refactoring UI, 'Designing Text' (line-height is proportional)", "Lupton, Thinking with Type, 'Text' (leading)", "WCAG 2.2, SC 1.4.12 Text Spacing"]
applies-when: "Defining tokens.text (each size carries its own line-height) and all text components."
not-when: null
decides: [tokens.text]
tensions: [typography.measure]
asked-by: [interview.constraints.locales]
checks:
  measured: "Computed line-height divided by font-size is between 1.4 and 1.7 for text of 18 px or less in paragraphs, and between 1.0 and 1.3 for text of 32 px or more. With WCAG 1.4.12 spacing overrides injected, no text is clipped or overlapping."
  judged: "Do multi-line headings hold together as one unit, and do paragraphs read without lines crowding or drifting apart?"
```

### typography.tabular-numbers
```yaml
id: typography.tabular-numbers
domain: typography
principle: "Use tabular (fixed-width) figures wherever numbers are compared or update in place, such as tables, prices, totals, timers, counters and chart axes. Right-align numeric columns so the place values line up. Keep proportional figures in running text."
why: "Proportional digits change width, so columns stop aligning and live values jitter as they change. Tabular figures make magnitudes comparable at a glance."
sources: ["Vercel, Web Interface Guidelines (tabular numbers for comparisons)", "Bringhurst, The Elements of Typographic Style, ch.3 (figures)", "Lupton, Thinking with Type, 'Letter' (lining and non-lining numerals)"]
applies-when: "Numeric table cells, metrics, prices, timers, counters and anything animated or updated live."
not-when: "Numbers inside prose, where proportional or oldstyle figures read better."
decides: [tokens.font, component.table, component.stat]
tensions: [data.dense-tables]
asked-by: []
checks:
  measured: "Elements with numeric-only text in td, th, [data-stat] or aria-live regions have computed font-variant-numeric containing tabular-nums. Numeric td are right-aligned."
  judged: "In tables and live counters, do the digits line up and stay still while the values change?"
```
