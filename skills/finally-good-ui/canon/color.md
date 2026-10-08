# Color

Scope: how colour tokens are built, assigned to roles, kept legible in both themes, and kept from carrying meaning alone. Contrast thresholds live in `a11y.contrast-minimums`; this file is about constructing colour so those thresholds hold.

### color.role-scale

```yaml
id: color.role-scale
domain: color
principle: "Build each hue as a 12-step scale where every step has a fixed job (1-2 app backgrounds, 3-5 component fills and hover/active, 6-8 borders and focus, 9-10 solid fills, 11-12 text), and let components reference roles, never raw values."
why: "When a step means the same thing in every hue, swapping a brand hue or theme changes nothing structurally, and reviewers can spot a misused colour by its step alone."
sources: ["Radix Colors docs, Understanding the scale", "Material 3, Color roles", "Albers, Interaction of Color"]
applies-when: "Any project that defines or extracts colour tokens."
not-when: "Pure data-viz palettes (categorical series), which follow data.status-encoding and data.chart-choice instead."
decides: [tokens.color, component.button, component.input, component.card]
tensions: [color.accent-restraint, layout.tension-consistency-emphasis]
asked-by: [interview.constraints.brand]
checks:
  measured: "check-static rule hardcoded-color: no hex/rgb/hsl/oklch literals in component files outside the token source; every semantic pair in tokens.json maps to a scale step."
  judged: "Does any component use a scale step for a job other than its role (e.g. a border step used as text, a solid step used as a page background)?"
```

### color.contrast-by-construction

```yaml
id: color.contrast-by-construction
domain: color
principle: "Define scales in OKLCH with lightness as the controlled axis, so a fixed distance between steps yields a known contrast ratio; pick pairs by distance rather than eyeballing and re-testing."
why: "OKLCH lightness is close to perceptual, so equal L steps look equal across hues; tying level distance to contrast turns accessibility into a property of the system instead of a per-screen audit."
sources: ["Stripe blog, Designing accessible color systems (2019)", "Radix Colors docs, Understanding the scale", "WCAG 2.2 SC 1.4.3 and 1.4.11"]
applies-when: "Generating or adjusting any palette, theme, or brand hue."
not-when: "Locked brand colours that fail contrast; keep them for large marks and derive accessible text/solid steps beside them."
decides: [tokens.color]
tensions: [color.accent-restraint, personality.calm, personality.energetic]
asked-by: []
checks:
  measured: "Script: every token pair used as text/background meets 4.5:1 (3:1 for large text and non-text) in light and dark; all colour tokens are oklch() strings with chroma inside sRGB/P3 gamut."
  judged: "Were contrast pairs chosen by scale distance, or does the palette rely on one-off hand-tuned exceptions?"
```

### color.accent-restraint

```yaml
id: color.accent-restraint
domain: color
principle: "Reserve the accent hue for what the user should act on or notice: the primary action, the current selection, focus, and links. Everything else is built from neutrals. Restraint has a floor as well as a ceiling: every screen keeps at least one deliberate accent moment, because zero accent reads as an unfinished template (craft.tension-restraint-liveliness)."
why: "An isolated colour draws the eye only while it stays rare; once it decorates headers, icons and borders it stops signalling priority and the primary action disappears."
sources: ["Lidwell et al., Universal Principles of Design, Von Restorff effect", "Yablonski, Laws of UX, Von Restorff effect", "Wathan & Schoger, Refactoring UI"]
applies-when: "Every screen; strongest on dashboards and forms with one primary action."
not-when: "Marketing or playful surfaces where the brief deliberately uses colour as atmosphere (see personality.playful); the primary action must still be distinguishable."
decides: [tokens.color, component.button, component.link, component.nav]
tensions: [color.role-scale, personality.energetic, personality.playful, layout.tension-consistency-emphasis, craft.tension-restraint-liveliness]
asked-by: [interview.personality.calm-energetic]
checks:
  measured: "Probe: at most one element per viewport with background equal to --color-primary (solid step); accent-coloured pixels under ~10% of a screenshot for calm/serious/dense personalities."
  judged: "If you blur the screenshot, is the single most colourful thing the thing the user should do next?"
```

### color.dark-mode-not-inverted

```yaml
id: color.dark-mode-not-inverted
domain: color
principle: "Design dark mode as its own scale: near-black but not pure black base (OKLCH L about 0.13-0.22), surfaces that get lighter as they rise, accents lowered in chroma and raised in lightness, and every pair re-verified."
why: "Inverting a light palette flips elevation cues, makes saturated accents vibrate on dark grounds, and silently breaks contrast pairs tuned for white."
sources: ["Material Design, Dark theme guidance", "Apple HIG, Dark Mode", "Radix Colors docs, dark scales"]
applies-when: "Any app that ships a dark theme or follows prefers-color-scheme."
not-when: null
decides: [tokens.color, tokens.shadow]
tensions: [color.contrast-by-construction]
asked-by: []
checks:
  measured: "Script: every token has a $extensions.fgu.dark value; dark background L is above 0.1; elevated surface L exceeds base surface L; all text pairs pass 4.5:1 in dark. Probe runs at dark for both viewports."
  judged: "In dark mode, can you tell which layer sits above which without shadows, and does any accent glare or vibrate?"
```

### color.color-not-sole-signal

```yaml
id: color.color-not-sole-signal
domain: color
principle: "Never let hue alone carry meaning: pair status colour with an icon, text or shape, and make inline links distinguishable by underline or at least 3:1 contrast with surrounding text."
why: "About 1 in 12 men has a colour vision deficiency, and everyone loses hue in glare, grayscale printing or a low-quality display."
sources: ["WCAG 2.2 SC 1.4.1 Use of Color", "Pickering, Inclusive Design Patterns", "IBM Carbon, Status indicators pattern"]
applies-when: "Status badges, validation, charts, links, selected states, required markers."
not-when: null
decides: [component.badge, component.link, component.input, component.chart]
tensions: [data.data-ink, personality.calm]
asked-by: []
checks:
  measured: "Probe: status elements ([role=status], .badge, [data-status]) contain text or an icon with an accessible name; links inside paragraphs have text-decoration underline or 3:1 contrast vs body text; grayscale screenshot diff keeps states distinguishable."
  judged: "Convert the screen to grayscale: can you still tell error from success, selected from unselected, and link from text?"
```
