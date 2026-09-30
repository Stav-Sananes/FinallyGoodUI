# Layout

Scope: spatial structure. Covers the spacing system, grouping, alignment, responsive behaviour and visual hierarchy. These cards set `tokens.space` and the layout primitives the build uses.

### layout.spacing-scale
```yaml
id: layout.spacing-scale
domain: layout
principle: "Take every margin, gap and padding from one constrained scale on a 4 px base, for example 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Adjacent steps should differ by at least about 25%, so a change of step is visible. No one-off values."
why: "A small set of choices speeds decisions and produces rhythm. Near-identical values (14 vs 16) look like mistakes rather than intent. Steps that grow at larger sizes match how we perceive difference."
sources: ["Wathan & Schoger, Refactoring UI, 'Layout and Spacing' (establish a spacing and sizing system)", "Pickering & Bell, Every Layout, 'Modular scale'", "Material 3, Layout (4dp/8dp grid)"]
applies-when: "All spacing tokens and every component and layout."
not-when: "Optical corrections of 1–2 px (icon alignment, borders) are allowed if commented."
decides: [tokens.space, layout.density]
tensions: [layout.tension-consistency-emphasis]
asked-by: [interview.personality.dense-airy]
checks:
  measured: "Static rule off-scale-spacing flags margin, padding and gap values not in tokens.space. The probe samples computed spacing and flags values not on the scale (±1 px)."
  judged: "Does the spacing feel rhythmic, or are there near-equal gaps that look accidental?"
```

### layout.proximity-grouping
```yaml
id: layout.proximity-grouping
domain: layout
principle: "Space shows relationships. Space inside a group must be clearly smaller than the space between groups (about 2x or more), and a label sits closer to what it labels than to anything else. Reach for whitespace before borders, boxes or dividers."
why: "People read things that sit close together as belonging together before they read any content. Equal spacing everywhere flattens the structure, and extra boxes add noise that whitespace would avoid."
sources: ["Lidwell et al., Universal Principles of Design, 'Proximity' and 'Common Region'", "Yablonski, Laws of UX, 'Law of Proximity', 'Law of Common Region'", "Wathan & Schoger, Refactoring UI, 'Layout and Spacing' (avoid ambiguous spacing)"]
applies-when: "Forms (label, field and next field), cards, lists, settings sections and toolbars."
not-when: null
decides: [tokens.space, component.form-layout, component.card]
tensions: [data.tension-density-clarity]
asked-by: []
checks:
  measured: "For each label/field pair, the gap from label to its field is smaller than the gap from that field to the next label. Sibling sections are separated by at least 2x their internal gap."
  judged: "Blurred, does the screenshot still show the right groups, with no heading or label floating equidistant between two things?"
```

### layout.grid-alignment
```yaml
id: layout.grid-alignment
domain: layout
principle: "Align elements to a small number of shared edges and columns. Use a column grid (commonly 12 on desktop and 4 on mobile) or a few explicit tracks, and keep text left edges consistent. Every element should line up with something."
why: "Shared edges make a screen read as one ordered system and reduce the number of starting points the eye has to track. Near-misses of a few pixels look careless."
sources: ["Müller-Brockmann, Grid Systems in Graphic Design", "Lupton, Thinking with Type, 'Grid'", "Lidwell et al., Universal Principles of Design, 'Alignment'", "Material 3, Layout (columns and margins)"]
applies-when: "Page layouts, dashboards, forms and card grids."
not-when: "Deliberately free compositions (a hero illustration, a marketing moment) that break the grid on purpose, once per screen."
decides: [layout.grid, layout.shell]
tensions: [layout.intrinsic-responsive]
asked-by: [interview.content.type]
checks:
  measured: "Collect left x-coordinates of block-level text and controls in the main region. Flag clusters of distinct edges within 1–4 px of each other (near-miss alignment)."
  judged: "Drawing vertical lines on the screenshot, how many distinct left edges are there, and is each deliberate?"
```

### layout.intrinsic-responsive
```yaml
id: layout.intrinsic-responsive
domain: layout
principle: "Build layouts that adapt to their container's content and space (flex-wrap, grid auto-fit with minmax, clamp(), container queries, max-width in ch) rather than to device breakpoints alone. Content must reflow with no horizontal scroll down to 320 CSS px."
why: "Components land in slots of unknown width, such as sidebars, modals and split panes. Intrinsic rules hold up everywhere, while breakpoint-only layouts break in between. Reflow is also an accessibility requirement."
sources: ["Pickering & Bell, Every Layout (Sidebar, Switcher, Cluster layouts)", "WCAG 2.2, SC 1.4.10 Reflow", "Material 3, Layout (window size classes)"]
applies-when: "Every page shell and reusable component."
not-when: "Data tables and canvases may scroll horizontally inside their own container, never the page."
decides: [layout.shell, layout.grid, component.card]
tensions: [layout.grid-alignment]
asked-by: [interview.context.device, interview.constraints.locales]
checks:
  measured: "At 320, 375, 768 and 1440 px, document.scrollingElement.scrollWidth is no wider than the viewport width (metrics.overflowX is false). No element is clipped by overflow:hidden with truncated interactive content."
  judged: "At the in-between width (about 900 px), does the layout still look designed, not squeezed?"
```

### layout.hierarchy-by-weight
```yaml
id: layout.hierarchy-by-weight
domain: layout
principle: "Rank every element as primary, secondary or tertiary, and express the rank mainly through weight, colour contrast and space, not size alone. De-emphasise supporting content (lighter colour, smaller weight) instead of shouting the important part. Each screen gets one focal point."
why: "When everything is loud nothing is. Size-only hierarchy forces headings to be huge, whereas contrast and weight differences give clear order at modest sizes."
sources: ["Wathan & Schoger, Refactoring UI, 'Hierarchy is Everything'", "Lidwell et al., Universal Principles of Design, 'Hierarchy'", "Krug, Don't Make Me Think (3rd ed.), ch.3 Billboard Design 101 (visual hierarchy)"]
applies-when: "Every screen, card, list row and header."
not-when: null
decides: [tokens.text, tokens.font, component.card, component.page-header]
tensions: [layout.tension-consistency-emphasis, color.accent-restraint]
asked-by: [interview.purpose.one-liner, interview.personality.references]
checks:
  measured: "Per viewport, count elements at the largest font-size and at the strongest weight plus accent colour. Flag if more than one competes for top rank in the main region."
  judged: "Squint at the screenshot. Is the first thing you see the thing the brief says matters most, and is the second thing the right one?"
```

### layout.tension-consistency-emphasis
```yaml
id: layout.tension-consistency-emphasis
domain: layout
principle: "Consistency (same spacing, components and treatment everywhere) builds learnability and calm. Emphasis (breaking the pattern for one element) creates focus and memorability. Every break must be rare, deliberate and tied to a named priority."
why: "Consistency wins across navigation, forms, tables and anything repeated, where predictability is the value. Emphasis wins for the single primary action, the key metric, a first-run moment or the product's signature detail. One break per screen draws the eye, while several cancel each other and read as inconsistency."
sources: ["Lidwell et al., Universal Principles of Design, 'Consistency' and 'Von Restorff Effect'", "Yablonski, Laws of UX, 'Von Restorff Effect'", "Nielsen, 10 Usability Heuristics, #4 Consistency and standards"]
applies-when: "Deciding whether a hero, a CTA, a metric or a signature element may deviate from tokens and component rules."
not-when: null
decides: [component.button, tokens.space, layout.grid, motion.level]
tensions: [usability.consistency-standards, layout.hierarchy-by-weight, motion.one-signature-moment]
resolve-by: [jobs.top-tasks, personality.calm-energetic, constraints.brand]
asked-by: []
checks:
  measured: "Count elements with styles outside the token set or component variants per screen. Flag more than 1 unexplained deviation."
  judged: "Is each visual break on this screen tied to a top task or signature moment named in the brief, and is there at most one per screen?"
```
