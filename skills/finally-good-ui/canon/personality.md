# Personality

Scope: how a felt quality is produced from concrete parameters. Each card is a recipe of ranges (contrast steps on the 12-step role scale, spacing, type voice, radius, accent share, duration, easing, spring bounce 0-0.3), not a look to imitate. Blend two cards by interpolating their `produces` ranges along the brief's personality axes; never apply a named stock style.

### personality.calm

```yaml
id: personality.calm
domain: personality
principle: "Calm comes from low arousal: small contrast steps between surfaces, generous space, a warm readable type voice, one muted accent, and slow-settling motion with no bounce."
why: "Fewer strong contrasts and fewer moving things mean fewer claims on attention; the eye rests, and the few emphasised elements are found without searching."
sources: ["Albers, Interaction of Color", "Norman, Emotional Design (visceral level)", "IBM Carbon, Motion: productive and expressive"]
produces:
  contrast: "surfaces 1 step apart (steps 1-3); borders step 6; body text step 12, secondary step 11; no pure black or white"
  spacing: "8px base; section gaps 48-96px; line-height 1.5-1.7; max 1 primary task per view"
  type-voice: "humanist sans (open apertures read as gentle) or a transitional serif for headings; weights 400/500 only; scale ratio 1.125-1.2"
  accent: "one hue, OKLCH chroma 0.05-0.12, under 5% of the surface"
  radius: "8-12px, consistent"
  motion: "durations standard-medium (250-300ms); easing enter/move; spring bounce 0; no stagger after first load"
applies-when: "Wellbeing, finance-at-home, reading, long-session or anxiety-prone contexts; brief leans calm on calm-energetic."
not-when: "Time-critical monitoring where alerts must break through immediately."
decides: [tokens.color, tokens.space, tokens.font, tokens.radius, tokens.duration, motion.level]
tensions: [personality.energetic, personality.dense-expert, a11y.contrast-minimums, data.tension-density-clarity]
asked-by: [interview.personality.calm-energetic, interview.personality.references]
checks:
  measured: "Tokens: adjacent surface tokens differ by 0.02-0.05 OKLCH L; accent chroma 0.12 or less; duration tokens used 300ms or less with no bounce; screenshot accent share under 5%; text still passes 4.5:1."
  judged: "Does the screen feel quiet without feeling empty or washed out, and can you still find the primary action in two seconds?"
```

### personality.energetic

```yaml
id: personality.energetic
domain: personality
principle: "Energy comes from big jumps: strong value contrast, a saturated accent used boldly, heavy display type against compact body text, and quick motion that arrives fast and settles with a small overshoot."
why: "Large contrasts in value, size and timing create tension and momentum; fast-in, slightly springy motion reads as responsiveness and eagerness."
sources: ["Albers, Interaction of Color", "Thomas & Johnston, The Illusion of Life, timing and exaggeration", "Material 3, Motion: expressive and emphasized easing"]
produces:
  contrast: "surfaces jump 2-3 steps; hero/inverted bands on step 12; text step 12 on step 1"
  spacing: "tight inside groups (4-8px), large between sections (64-128px) for strong rhythm"
  type-voice: "grotesque or geometric sans with display weights 700-900 and tight tracking at large sizes; scale ratio 1.333-1.5"
  accent: "one dominant hue at OKLCH chroma 0.18-0.28, optionally a second complementary hue; up to 10-15% of the surface"
  radius: "commit to one extreme: 0-4px sharp or full pills"
  motion: "durations short-standard (150-250ms); easing snappy/enter-emphasized; spatial spring bounce 0.15-0.3; 30-50ms stagger on first load"
applies-when: "Consumer launch, fitness, creative, social, events; brief leans energetic."
not-when: "Frequent-use tools and high-stakes or grief/finance-stress contexts."
decides: [tokens.color, tokens.font, tokens.text, tokens.radius, tokens.easing, motion.level]
tensions: [personality.calm, color.accent-restraint, motion.frequency-budget, motion.tension-delight-speed]
asked-by: [interview.personality.calm-energetic, interview.personality.references]
checks:
  measured: "Tokens: display weight 700 or more; type scale ratio 1.33 or more; accent chroma 0.18 or more; spatial spring bounce 0.3 or less; routine durations still 300ms or less."
  judged: "Does the energy come from contrast and timing, or from adding more things? Is the page still readable after the first impression?"
```

### personality.serious-trustworthy

```yaml
id: personality.serious-trustworthy
domain: personality
principle: "Trust is produced by restraint and predictability: near-neutral surfaces, one deep institutional accent, high text contrast, a sober type voice, strict alignment, and motion that only confirms."
why: "People judge credibility quickly from visual polish and consistency; anything that looks improvised or showy suggests the product might be careless with their data or money."
sources: ["Stanford Guidelines for Web Credibility (Fogg et al.)", "Lidwell et al., Universal Principles of Design, Aesthetic-usability effect", "IBM Carbon, Motion: productive"]
produces:
  contrast: "neutrals OKLCH chroma 0.02 or less; body text aims for 7:1; surfaces 1-2 steps apart with visible borders (step 6-7)"
  spacing: "8px base, strict 4/8 grid, consistent gutters; medium density"
  type-voice: "neo-grotesque sans (neutral, invisible) or a transitional serif for headings (institutional authority); weights 400/600; scale ratio 1.2-1.25"
  accent: "one hue, mid-dark (L 0.40-0.55), chroma 0.08-0.15, used for actions and links only"
  radius: "2-6px"
  motion: "durations micro-standard (100-250ms); easing enter/exit/move; spring bounce 0; no signature flourish beyond a success confirmation"
applies-when: "Finance, health, legal, government, security, B2B admin; brief leans serious or names trust as a risk."
not-when: "Consumer entertainment where austerity would read as cold."
decides: [tokens.color, tokens.font, tokens.radius, tokens.duration, motion.level]
tensions: [personality.playful, motion.one-signature-moment]
asked-by: [interview.purpose.success, interview.personality.serious-playful, interview.risks.trust]
checks:
  measured: "Tokens: neutral chroma 0.02 or less; exactly one accent hue; bounce 0 everywhere; body text contrast 7:1 or more where feasible; probe finds no element misaligned off the 4px grid."
  judged: "Would a cautious user hand this screen their bank details? What single element undermines that?"
```

### personality.playful

```yaml
id: personality.playful
domain: personality
principle: "Play is produced by softness and surprise within rules: rounded shapes, a friendly geometric or rounded type voice, 2-3 accent hues, spatial motion with visible overshoot, and warm, informal copy, while legibility and contrast stay intact."
why: "Rounded forms and springy motion read as approachable and alive; keeping structure strict underneath stops play from becoming noise."
sources: ["Walter, Designing for Emotion", "Thomas & Johnston, The Illusion of Life, squash and stretch and follow-through", "Mailchimp Content Style Guide, voice and tone"]
produces:
  contrast: "surfaces 1-2 steps apart, tinted neutrals (chroma 0.01-0.03 toward the brand hue)"
  spacing: "generous: 8px base, component padding 12-20px, section gaps 48-80px"
  type-voice: "geometric sans with round terminals or a characterful humanist display; weights 500-800; scale ratio 1.25-1.333"
  accent: "2-3 hues at OKLCH chroma 0.12-0.22, one dominant; used in illustration and empty states as well as actions"
  radius: "12-24px or pill"
  motion: "durations standard-long (250-400ms) for rare moments, 150ms for routine; spatial spring bounce 0.2-0.3; effects never bounce; one signature moment"
applies-when: "Consumer, education, kids, creative and community products; brief leans playful on serious-playful."
not-when: "Error, payment and destructive flows, which switch to the serious parameters even inside a playful app."
decides: [tokens.color, tokens.radius, tokens.font, tokens.easing, motion.signature, copy.labels]
tensions: [personality.serious-trustworthy, motion.frequency-budget, color.accent-restraint, motion.tension-delight-speed]
asked-by: [interview.personality.serious-playful]
checks:
  measured: "Tokens: radius 12px or more; spring bounce between 0.2 and 0.3 on spatial transitions only; probe finds no bounce on opacity/colour; error and payment screens use bounce 0; text passes 4.5:1."
  judged: "Is the play in the details (shape, motion, voice) or in clutter? Does the error state stay kind and clear rather than cute?"
```

### personality.dense-expert

```yaml
id: personality.dense-expert
domain: personality
principle: "Expert density is produced by compact type and spacing, hairline structure instead of cards, accent only for selection, focus and status, tabular numerals, visible shortcuts, and near-zero motion on frequent actions."
why: "Experts use the tool for hours as a full-screen workspace; every saved scroll, click and millisecond compounds, and they learn the interface deeply enough not to need spacious guidance."
sources: ["Cooper et al., About Face, sovereign posture", "Tidwell et al., Designing Interfaces", "IBM Carbon, Motion: productive", "Few, Information Dashboard Design"]
produces:
  contrast: "surfaces 1 step apart; hairline borders at step 6; selection fill step 4-5; text step 12 primary, step 11 secondary"
  spacing: "4px base (4/8/12/16); row height 28-36px; panel padding 8-16px"
  type-voice: "neo-grotesque or humanist UI sans at 13-14px base, line-height 1.35-1.45; tabular numerals; monospace for IDs and code; scale ratio 1.125-1.2"
  accent: "selection, focus and status only; under 5% of surface"
  radius: "2-6px"
  motion: "instant-short (0-150ms); keyboard and repeated actions 0ms; no stagger; bounce 0"
applies-when: "Admin consoles, developer tools, trading, analytics, CRM and ops tools used daily; brief says expert and frequent."
not-when: "Occasional or first-time users, and touch-first mobile screens where targets must stay 44px."
decides: [tokens.space, tokens.text, tokens.font, tokens.duration, motion.level, component.table]
tensions: [personality.calm, data.tension-density-clarity, a11y.target-size, motion.tension-delight-speed]
asked-by: [interview.personality.dense-airy]
checks:
  measured: "Tokens: base text 13-14px; space scale on a 4px base; durations 150ms or less; probe: targets still 24x24 or more; numeric cells tabular-nums; shortcuts exposed via aria-keyshortcuts or visible hints."
  judged: "Can an expert complete the top task with the keyboard faster than before, and does the density ever hide which row is selected?"
```

### personality.luxurious

```yaml
id: personality.luxurious
domain: personality
principle: "Luxury is produced by unhurried space, soft deep surfaces, a few large confident type gestures, nested shapes made with care, and slow settling motion. Nothing competes; every surface looks machined."
why: "Expense is signalled by what was not crowded in: space that costs screen area, edges and light that took effort to get right, and motion that never rushes. Effects added on top (glow, gradients) cheapen it, because they are what cheap things use to look expensive."
sources: ["Norman, Emotional Design, visceral level", "Wathan & Schoger, Refactoring UI, 'Depth' and 'Personality'", "Apple Human Interface Guidelines, Materials", "taste-skill (Leonxlnx), soft-skill parameter set"]
produces:
  contrast: "surfaces 1 step apart; near-black (L 0.12-0.16) or warm off-white (L 0.97-0.985) canvas; hairlines as 5-10% alpha of the foreground"
  spacing: "8px base; section gaps 96-160px on desktop, about half on mobile; card padding 24-40px; content max-width 1100-1280px"
  type-voice: "geometric or neo-grotesque display at weights 400-600 with tracking -0.02 to -0.04em (size, not weight, carries hierarchy); or a high-contrast serif display if the brief earns it; body 16-17px, line-height 1.6"
  accent: "one hue, low-mid chroma (0.06-0.12), under 3% of surface, plus one deliberate accent moment per screen"
  radius: "soft and nested: containers 20-32px, inner elements concentric (outer minus padding), buttons pill or 10-14px"
  motion: "durations medium-long (300-500ms) on presentation surfaces, standard (200-250ms) on controls; easing cubic-bezier(0.32,0.72,0,1) or (0.16,1,0.3,1); bounce 0; press scale 0.98"
applies-when: "Consumer premium, fashion, hospitality, private banking, high-end creative tools; brief words like premium, refined, expensive, crafted."
not-when: "Dense daily tools where 96px+ gaps would waste the workspace; urgent or alert-driven contexts."
decides: [tokens.color, tokens.space, tokens.font, tokens.radius, tokens.shadow, tokens.duration, tokens.easing]
tensions: [personality.dense-expert, personality.energetic, motion.frequency-budget]
asked-by: [interview.personality.references]
checks:
  measured: "Tokens: section gap >= 96px at 1440; display weight <= 600 with negative tracking; radius tokens nested (inner = outer - padding); no glow, gradient text or more than one translucent layer (static rules)."
  judged: "Does it feel expensive because of what is left out, or because of what was added on?"
```

### personality.editorial

```yaml
id: personality.editorial
domain: personality
principle: "An editorial feel is produced by print discipline: a paper-like canvas, ink-dark text, a serif or refined grotesk display with tight tracking, a strong typographic hierarchy instead of boxes, washed accent pairs for tags, and hairline rules."
why: "Readers trust what looks composed by an editor: hierarchy carried by type alone, generous measure and margins, and colour used like ink on paper. Cards and shadows read as software; rules and type read as publishing."
sources: ["Bringhurst, The Elements of Typographic Style", "Müller-Brockmann, Grid Systems in Graphic Design", "Lupton, Thinking with Type", "taste-skill (Leonxlnx), minimalist-skill parameter set"]
produces:
  contrast: "canvas warm or neutral off-white (L 0.97-0.99), ink L 0.18-0.25 (never pure black), muted text L 0.50-0.55; hairlines 1px at 6% alpha"
  spacing: "8px base; sections 96-128px; content measure 60-72ch; max-width 900-1050px for reading pages"
  type-voice: "serif or sharp grotesk display, tracking -0.02 to -0.04em, line-height 1.1; body sans or serif 16-18px at 1.6-1.7; mono only for metadata"
  accent: "tags and status as washed background/ink pairs (background chroma ~0.03, text chroma ~0.10); one ink accent for links"
  radius: "cards 8-12px, buttons 4-6px, tags pill"
  motion: "subtle: 8-12px rises over 400-600ms on first view only, stagger 60-80ms; controls 150-200ms; bounce 0"
applies-when: "Content-led products: knowledge bases, journals, reading apps, portfolios, documentation, newsletters."
not-when: "Dense operational dashboards; playful consumer apps."
decides: [tokens.color, tokens.font, tokens.text, tokens.radius, layout.grid]
tensions: [personality.energetic, personality.playful, craft.hairlines-before-boxes]
asked-by: [interview.personality.references]
checks:
  measured: "Tokens: no pure black ink; paragraph measure 60-75ch; at most 2 families plus mono; shadows absent or alpha <= 0.05."
  judged: "Would this look at home printed? Is the hierarchy readable with all colour removed?"
```

### personality.raw-industrial

```yaml
id: personality.raw-industrial
domain: personality
principle: "A raw, industrial feel is produced by exposed structure: zero radius, full-width rules and 1px grid gaps, one substrate (light paper or dark screen), heavy macro type against tiny mono labels, a single hazard accent, and no soft shadow or translucency."
why: "Showing the grid instead of hiding it reads as honest and confident; bimodal type (huge and tiny) creates tension without decoration. It fails the moment it is mixed with soft styles, because the honesty is the point."
sources: ["Müller-Brockmann, Grid Systems in Graphic Design", "Lupton, Graphic Design: The New Basics, 'Grid'", "taste-skill (Leonxlnx), brutalist-skill parameter set"]
produces:
  contrast: "one substrate: paper (L 0.94-0.96) with ink L 0.10-0.15, or dark (L 0.12-0.15) with ink L 0.90-0.93; stark steps"
  spacing: "bimodal: packed clusters (4-8px) against large empty fields (128px+); grids with 1px gaps over a contrasting parent"
  type-voice: "heavy grotesk macro type, clamp(3rem, 9vw, 12rem), tracking -0.03 to -0.06em, line-height 0.85-0.95, often uppercase; mono micro labels 10-13px, tracking +0.05 to +0.1em"
  accent: "one hazard hue at high chroma (0.20-0.26), used for one or two things per screen"
  radius: "0 everywhere"
  motion: "instant or stepped: 0-150ms, linear or steps(); no springs, no blur, no stagger"
applies-when: "Developer tools, creative studios, music, culture, brands whose brief asks for bold, honest, unpolished-on-purpose."
not-when: "Finance, health or any trust-first or anxious audience; long reading."
decides: [tokens.color, tokens.font, tokens.text, tokens.radius, tokens.shadow, tokens.duration]
tensions: [personality.calm, personality.luxurious, personality.serious-trustworthy]
asked-by: [interview.personality.references]
checks:
  measured: "Tokens: radius 0; shadow tokens none; one accent hue; display tracking <= -0.03em; macro/micro size ratio >= 6."
  judged: "Is the structure the decoration, or did soft styles creep back in?"
```
