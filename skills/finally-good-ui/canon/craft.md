# Craft

Scope: the finishing layer that separates "correct" from "premium". Covers how type is set at each size, how surfaces, edges, shadows and radii are made, real imagery and icons, the repeated motif that makes a product recognisable, composition rhythm, and the honesty of what is shown (nothing dead, nothing invented). These cards are applied after the structure is right, in the build's craft pass (`modules/build.md`), and read by `ui-reviewer` for dimension 10.

A premium look is not a style. It is the accumulation of many small decisions made on purpose. Every value below is a range to choose from with a reason, not a preset.

### craft.tracking-by-size
```yaml
id: craft.tracking-by-size
domain: craft
principle: "Set letter-spacing by size: tighten large type, leave body text alone, open up small caps. Display 48px and up -0.02 to -0.04em; headings 24-40px -0.01 to -0.02em; body 0; uppercase labels at 10-13px +0.04 to +0.1em. Line-height falls as size rises: display 1.0-1.1, headings 1.15-1.3, body 1.5-1.65."
why: "Fonts are spaced for reading sizes. Scaled up, the default gaps look loose and the word falls apart; scaled down in capitals, letters crowd. Correcting both is the single most visible sign that type was set by hand rather than left at defaults."
sources: ["Bringhurst, The Elements of Typographic Style, 2.1.6 (letterspace capitals) and 2.1.7 (don't letterspace lowercase at text sizes)", "Lupton, Thinking with Type, 'Tracking'", "Wathan & Schoger, Refactoring UI, 'Keep your line length in check', 'Baseline, not center' and letter-spacing", "taste-skill (Leonxlnx), typography rules"]
applies-when: "Every type token: the scale emitted by modules/system.md gets a tracking and leading value per step."
not-when: "Monospace data columns (keep 0 so digits align) and fonts whose display cut is already tightly spaced (check the rendered result, not the rule)."
decides: [tokens.text, tokens.font]
tensions: [typography.type-scale]
asked-by: []
checks:
  measured: "Probe metrics.type: every element with computed font-size >= 40px has letter-spacing < 0 and line-height <= 1.2; every uppercase element <= 14px has letter-spacing > 0."
  judged: "Does the largest headline read as one shape, and do small caps labels breathe?"
```

### craft.headline-discipline
```yaml
id: craft.headline-discipline
domain: craft
principle: "A headline is short and sits in at most two lines at desktop width (three on mobile): give it a wide container, balance the lines (text-wrap: balance), and carry emphasis with weight, size and colour inside one family. Body paragraphs use text-wrap: pretty so no line ends in a lonely word. Emphasis inside a headline is the same family's italic or weight, never a second family dropped in."
why: "Long headlines become paragraphs set large; ragged two-word last lines look accidental; mixing a serif word into a sans headline is a current generated-UI tell that breaks the type voice."
sources: ["Bringhurst, The Elements of Typographic Style, 2.4 (widows and orphans)", "Lupton, Thinking with Type, 'Hierarchy'", "CSS Text Module Level 4, text-wrap: balance / pretty", "taste-skill (Leonxlnx), hero and headline rules"]
applies-when: "Page titles, screen headers, empty-state titles, marketing headings."
not-when: "Data labels and table headers, which follow the data layout."
decides: [tokens.text, copy.headings, component.page-header]
tensions: [writing.front-load]
asked-by: []
checks:
  measured: "Probe: h1/h2 line count <= 2 at 1440 and <= 3 at 375; h1-h3 computed text-wrap is balance; no heading contains spans with a different font-family than the heading."
  judged: "Does every headline read in one glance, and does its last line carry real weight?"
```

### craft.number-setting
```yaml
id: craft.number-setting
domain: craft
principle: "Set numbers as carefully as words. Use tabular figures in columns and totals, right-align them, set currency symbols and units on the same baseline as the figure, quieter in colour or weight (never raised, superscript or more than about 15% smaller, which makes amounts look broken), keep decimals consistent within a column, use a true minus sign (U+2212) for negatives, and let the one number that matters on a screen be the largest thing on it."
why: "In money, data and measurement products, numbers are the content. Misaligned digits, mixed precision and units at full weight look like a spreadsheet export; a deliberately set figure is what reads as premium in finance and analytics products."
sources: ["Bringhurst, The Elements of Typographic Style, 3.2 (figures)", "Few, Information Dashboard Design, ch. 6", "Tufte, The Visual Display of Quantitative Information", "Wathan & Schoger, Refactoring UI, 'Emphasize by de-emphasizing'"]
applies-when: "Any screen showing amounts, counts, durations, measurements or KPIs."
not-when: "Numbers in running prose (keep proportional figures)."
decides: [tokens.font, component.stat, component.table, component.kpi-tile]
tensions: [typography.tabular-numbers, data.data-ink]
asked-by: []
checks:
  measured: "Probe: numeric table cells have font-variant-numeric containing tabular-nums and text-align right/end; negative values do not use a hyphen-minus."
  judged: "Is the most important number on the screen unmistakably the largest, and do currency symbols and units recede?"
```

### craft.concentric-radii
```yaml
id: craft.concentric-radii
domain: craft
principle: "Choose one shape system (sharp 0-4px, soft 8-16px, or pill for small controls only) and nest it concentrically: an inner radius equals the outer radius minus the padding between them. Larger containers get larger radii; small controls get smaller ones. Never put the same large radius on everything."
why: "Parallel curves look engineered; mismatched ones (a 16px card around a 16px button with 8px padding) look like a bulging corner. Radius that scales with size reads as one family; one radius everywhere encodes nothing."
sources: ["Apple Human Interface Guidelines, concentric corner radii", "Wathan & Schoger, Refactoring UI, 'Personality: border radius'", "taste-skill (Leonxlnx), double-bezel / nested radius rule"]
applies-when: "Cards containing buttons or images, grouped controls, sheets, dialogs, segmented controls, any nested rounded shapes."
not-when: "Sharp (0px) systems, where concentricity is automatic."
decides: [tokens.radius, component.card, component.button, component.dialog]
tensions: [personality.energetic, personality.calm]
asked-by: []
checks:
  measured: "Probe: for a rounded element whose rounded parent is within 16px of it on that corner, child radius <= parent radius - gap (+/- 2px); at most 5 distinct radius values across the page, not counting 0 and fully rounded (pills, avatars)."
  judged: "Do nested corners run parallel, and does radius grow with container size?"
```

### craft.tinted-shadows
```yaml
id: craft.tinted-shadows
domain: craft
principle: "Build elevation from two or three layered shadows (a tight contact shadow plus a wide soft one) with one light direction (from above), low alpha (0.04-0.12 each), tinted toward the background hue instead of pure black. Raised surfaces in light mode may add a 1px top inner highlight. In dark mode, show elevation with lighter surfaces and a hairline border, not bigger shadows."
why: "Real shadows are soft, layered and coloured by their surroundings; a single black blur reads as a default drop-shadow. Dark backgrounds swallow shadows, so lightness is what tells layers apart there."
sources: ["Wathan & Schoger, Refactoring UI, 'Depth' (two-part shadows)", "Material 3, Elevation (tonal surfaces)", "Josh W. Comeau, 'Designing Beautiful Shadows in CSS'", "taste-skill (Leonxlnx), diffusion shadows"]
applies-when: "Any raised surface: cards that are interactive, popovers, menus, dialogs, sticky bars."
not-when: "Flat-hairline systems that encode layers with borders only (then use no shadows at all, consistently)."
decides: [tokens.shadow, tokens.color]
tensions: [craft.hairlines-before-boxes]
asked-by: []
checks:
  measured: "Tokens: shadow tokens have 2+ layers, alpha <= 0.16 per layer, and a non-neutral or background-hue tint in light mode; dark theme surfaces get lighter with elevation (L increases 0.02-0.06 per level)."
  judged: "Does elevation look like light, and does it follow role (overlay > raised > flat) rather than decoration?"
```

### craft.hairlines-before-boxes
```yaml
id: craft.hairlines-before-boxes
domain: craft
principle: "Group with space first, a hairline second, and a filled box last. Hairlines are 1px at low contrast (an alpha of the foreground, roughly 6-12%) so they separate without drawing. Use dividers between groups, not under every row of a short list; never nest a card in a card in a card."
why: "Every box adds an edge the eye must parse. Premium interfaces feel calm because structure comes from alignment and spacing, with thin rules where space alone is ambiguous. Box-inside-box is the generated-dashboard signature."
sources: ["Wathan & Schoger, Refactoring UI, 'Use fewer borders'", "Müller-Brockmann, Grid Systems in Graphic Design", "Lidwell et al., Universal Principles of Design, 'Common region'"]
applies-when: "Lists, settings, sidebars, dashboards, forms, detail panes."
not-when: "Draggable or independently actionable objects that genuinely need to read as separate cards."
decides: [tokens.color, component.card, component.table, layout.density]
tensions: [layout.proximity-grouping, craft.tinted-shadows]
asked-by: []
checks:
  measured: "Probe: no element with background/border card styling nested 3 deep; border colours have contrast vs surface between 1.1:1 and 1.6:1 for dividers."
  judged: "Remove one box: does the grouping still read? If yes, the box was noise."
```

### craft.ink-and-accent
```yaml
id: craft.ink-and-accent
domain: craft
principle: "Keep the canvas near-neutral (warm or cool paper, chroma 0.015 or less) and draw primary actions in ink: near-black on light, near-white on dark, or the foreground colour. Spend the accent hue on meaning only: the current item, money in or out, one emphasised word or figure, a status. Tinting the page with the brand hue and filling every button with it turns a palette into a theme."
why: "Premium products read as confident because colour is scarce and therefore meaningful; ink actions are unmistakable without shouting. A brand-tinted canvas plus brand-filled buttons is the default output of theme generators, which is why it reads as a template. In blind comparisons, ink actions on a neutral canvas beat saturated brand buttons on a tinted canvas every time."
sources: ["Albers, Interaction of Color", "Lidwell et al., Universal Principles of Design, 'Von Restorff effect'", "Wathan & Schoger, Refactoring UI, 'Color: you need more colors than you think' and 'Emphasize by de-emphasizing'"]
applies-when: "Calm, serious, editorial, luxurious and dense-expert personalities; any product whose brief asks for premium or trustworthy."
not-when: "Playful or energetic briefs where colour is the voice (personality.playful, personality.energetic), and brand books that mandate a coloured primary."
decides: [tokens.color, component.button, component.link]
tensions: [color.accent-restraint, personality.playful, personality.energetic]
asked-by: []
checks:
  measured: "Tokens: background chroma <= 0.015; primary button background is the foreground/ink role or its chroma <= 0.03, unless the personality is playful/energetic or a brand rule says otherwise."
  judged: "Blur the screenshot: is colour where meaning is, and nowhere else?"
```

### craft.material-restraint
```yaml
id: craft.material-restraint
domain: craft
principle: "Pick one surface material for the product and apply it by role: flat-hairline, soft-elevated, bezel (an outer shell with an inner core and concentric radius), or textured (a fixed grain layer at opacity 0.02-0.04). Translucent blur belongs only to layers that float over moving content (sticky nav, sheet, popover). Glow, gradients and patterns are allowed once, where they mean something."
why: "Glass, glow, mesh, grain, grid patterns and orbs stacked together are the clearest visual tell of generated UI; each is a trend, and a cluster of trends reads as no decision at all. One material, used consistently, reads as a product with a point of view."
sources: ["Apple Human Interface Guidelines, Materials (vibrancy only for overlays)", "Lidwell et al., Universal Principles of Design, 'Signal-to-noise ratio'", "antislop (miqdadbadjuber/anti-slop), R-07, R-10, R-13 purpose gates", "taste-skill (Leonxlnx), surface recipes"]
applies-when: "Choosing tokens.shadow, backgrounds and overlay styling; every direction spec's material axis."
not-when: "A brand book that mandates a material; follow it."
decides: [tokens.shadow, tokens.color, component.card, component.nav, component.dialog]
tensions: [craft.tension-restraint-liveliness]
asked-by: []
checks:
  measured: "Static rules glass-overuse, colored-glow, bg-pattern, blurred-orb; probe: backdrop-filter only on position fixed/sticky or overlay elements; any grain layer is position fixed with pointer-events none."
  judged: "Can you name the material in two words, and is it the same on every screen?"
```

### craft.real-imagery-and-icons
```yaml
id: craft.real-imagery-and-icons
domain: craft
principle: "Show the product's real things. Use real images when the subject is visual (supplied assets, the user's own uploads in sample data, or an honestly labelled image slot), real logos, and initials or monograms for people without photos. Use one icon family at one stroke width and size grid, chosen for the personality, and pick icons that name the action; never draw ad-hoc icons by hand, and never use emoji as icons."
why: "Hand-drawn SVG blobs, grey placeholder boxes, fake terminal windows and the sparkle/rocket/wand vocabulary all say 'there is nothing real here'. A consistent icon family and honest imagery make a screen look shipped."
sources: ["Apple Human Interface Guidelines, SF Symbols (consistent weight and scale)", "Material 3, Icons", "Cooper et al., About Face, 'Visual interface design: icons'", "taste-skill (Leonxlnx), imagery and icon rules", "antislop (miqdadbadjuber/anti-slop), R-04, R-22, R-23"]
applies-when: "Every screen with icons, avatars, product images, logos or illustrations."
not-when: "Brand-supplied custom icon sets (use them, consistently)."
decides: [component.icon-button, component.empty-state, component.nav]
tensions: [writing.user-language]
asked-by: []
checks:
  measured: "Static rules ai-icon, emoji-ui, fake-terminal, placeholder-content (stock services); probe: all icon SVGs share one stroke-width and one of at most two sizes per context."
  judged: "Would a real user recognise their own data, faces and logos here, or does it look like a mock?"
```

### craft.identity-motif
```yaml
id: craft.identity-motif
domain: craft
principle: "Give the product one motif taken from its subject (a material, a tool, a convention of the trade) and repeat it at small scale on every screen: in a progress element, a divider, an empty state, a number treatment, a transition. A motif is repeated; a one-off flourish is not a motif. A motif is an accent, not a container or a divider style: 3 to 6 deliberate placements, not every rule on the page; blown up into the shape of every card (ticket stubs, notebook pages, folders) it becomes a skeuomorphic costume and reads as a gimmick."
why: "Repetition is what makes something recognisable. A single signature detail on one screen is forgotten; the same quiet gesture in five places reads as identity, which is the difference between a template and a product."
sources: ["Lidwell et al., Universal Principles of Design, 'Consistency' and 'Iconic representation'", "Norman, Emotional Design, reflective level", "antislop (miqdadbadjuber/anti-slop), liveliness levers: identity motif"]
applies-when: "Every app and every direction spec (the spec names the motif and where it repeats)."
not-when: "Embedded widgets that must take the host product's identity."
decides: [motion.signature, component.empty-state, component.progress]
tensions: [usability.consistency-standards, craft.tension-restraint-liveliness]
asked-by: []
checks:
  measured: "decisions.md names the motif and lists at least 3 places it appears; the reviewer confirms each place in screenshots."
  judged: "Cover the logo: would you still know which product this is from one screenshot?"
```

### craft.optical-alignment
```yaml
id: craft.optical-alignment
domain: craft
principle: "Align what the eye sees, not the box model. Pin card actions to a shared bottom line across a row, start parallel lists at the same y, give buttons slightly more space below text than above when the font sits high, nudge play/arrow icons toward their visual centre, and hang punctuation and bullets outside the text edge in large type."
why: "Mathematically centred shapes often look off; optical corrections are invisible when done and quietly wrong when skipped. They are a large share of what people perceive as polish."
sources: ["Bringhurst, The Elements of Typographic Style, 4.1 (optical alignment)", "Wathan & Schoger, Refactoring UI, 'Baseline, not center'", "Lupton, Thinking with Type, 'Alignment'"]
applies-when: "Card rows, pricing or plan comparisons, icon buttons, large headings with quotes or bullets."
not-when: null
decides: [component.card, component.button, component.icon-button]
tensions: [layout.spacing-scale]
asked-by: []
checks:
  measured: "Probe: buttons in sibling cards of one row share the same bottom y (+/- 2px)."
  judged: "Squint: does anything look like it is sitting slightly wrong?"
```

### craft.composition-rhythm
```yaml
id: craft.composition-rhythm
domain: craft
principle: "Vary composition on purpose. Across a page, no two adjacent sections share a layout family, and long pages use at least three families (split, full-bleed, list, grid, single statement). Across an app, each screen type has its own composition while sharing the shell. Give each screen one second-read moment: an oversized figure, a material switch, a side note, an asymmetric bleed. On mobile, collapse to one column without rotations or overlaps."
why: "Uniform rhythm (centred title, subtitle, card grid, repeat) is the template signature; the eye stops reading after the second identical block. Deliberate variation keeps attention and tells the user what kind of content each part is."
sources: ["Müller-Brockmann, Grid Systems in Graphic Design", "Lupton, Graphic Design: The New Basics, 'Rhythm and balance'", "antislop (miqdadbadjuber/anti-slop), RHYTHM dial", "taste-skill (Leonxlnx), DESIGN_VARIANCE"]
applies-when: "Landing, onboarding and any long-scroll page; the set of screens in an app."
not-when: "Dense tools where every screen intentionally shares one layout for speed (then vary within the screen: summary, list, detail)."
decides: [layout.grid, blueprint.screens]
tensions: [layout.tension-consistency-emphasis, usability.consistency-standards]
asked-by: []
checks:
  measured: "Reviewer lists each section's layout family in order; flag two adjacent repeats or fewer than three families on a page of 6+ sections."
  judged: "Scroll fast: can you tell where one section ends and the next begins without reading?"
```

### craft.nothing-dead
```yaml
id: craft.nothing-dead
domain: craft
principle: "Every visible control does what its label says: links go to real destinations, buttons have real handlers, menus open, toggles toggle. Nothing ships with TODO markers, stub handlers, empty href, or sections left as 'the rest follows the same pattern'. If something is out of scope, it is not shown."
why: "A finished look over dead controls is worse than an unfinished look: it breaks trust on the first click. Generated UI often stops at the appearance of completeness."
sources: ["Nielsen, 10 Usability Heuristics, #1 visibility of system status and #5 error prevention", "Krug, Don't Make Me Think, 'Clickable things look clickable'", "antislop (miqdadbadjuber/anti-slop), R-26 and R-35", "taste-skill (Leonxlnx), output-skill completeness rules"]
applies-when: "Every build, every direction prototype, every review."
not-when: null
decides: [component.button, component.link, component.nav]
tensions: []
asked-by: []
checks:
  measured: "Static rules dead-control, placeholder-code; flow walk clicks every interactive element on the key screen and records what changed (delivery gate ledger)."
  judged: "Click everything: did anything do nothing?"
```

### craft.honest-content
```yaml
id: craft.honest-content
domain: craft
principle: "Show only what is true or clearly sample data from the brief's domain. No invented metrics, testimonials, customer logos, compliance badges, ratings or growth deltas; no stock faces, lorem ipsum or placeholder brands. When real content is missing, use the brief's realistic examples or an honestly labelled slot."
why: "Invented proof misleads real users and, during design, hides how the layout behaves with real lengths and volumes. Fake trust signals are also the most recognisable marker of a template."
sources: ["Fogg et al., Stanford Guidelines for Web Credibility", "Cooper et al., About Face, 'Design with real data'", "antislop (miqdadbadjuber/anti-slop), R-17, R-18, R-36, R-38"]
applies-when: "Every screen, prototype and sample data set."
not-when: "Claims the brief supplies with a source; record the source in decisions.md."
decides: [copy.headings, component.stat, component.kpi-tile]
tensions: [writing.user-language]
asked-by: []
checks:
  measured: "Static rules unsourced-claim, placeholder-content."
  judged: "Could the company stand behind every number, name and claim on this screen?"
```

### craft.tension-restraint-liveliness
```yaml
id: craft.tension-restraint-liveliness
domain: craft
principle: "Removing defaults leaves a void. Restraint without a point of view produces the sterile default (near-white page, thin grey borders, small radius, default font, no accent, no motif), which is as generic as the noisy one. Resolve by adding exactly what the brief earns: one deliberate accent moment per screen, one motif, one focal point, real contrast in size and weight."
why: "Generated output fails in two directions: decoration everywhere, or a clean page with nothing to look at. Both mean no decision was made; the second is harder to spot because it looks tidy."
sources: ["Norman, Emotional Design, visceral level", "Lidwell et al., Universal Principles of Design, 'Aesthetic-usability effect'", "antislop (miqdadbadjuber/anti-slop), Liveliness toolkit"]
applies-when: "Every direction and every craft pass; especially calm, serious and dense-expert personalities."
not-when: null
decides: [tokens.color, motion.signature, layout.density]
tensions: [craft.material-restraint, color.accent-restraint, personality.calm, personality.serious-trustworthy]
asked-by: []
checks:
  measured: "Screenshot accent share > 0 on every screen (at least one accent moment); a focal element at least 1.6x the next-largest text size exists per screen."
  judged: "Is there anything on this screen you would remember tomorrow? Is there anything you would remove?"
```
