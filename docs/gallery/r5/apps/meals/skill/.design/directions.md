# Directions (directions: one; no subagents; specs written, one built)
Shared content: Week of 23 Nov: Mon Lemon chicken traybake, Tue Mushroom risotto, Wed Taco night, Thu Dal and rice, Fri Pesto gnocchi, Sat Fish pie, Sun Roast squash. Cooks Maya, Daniel, Noa.
Rolls (density, contrast, type, layout, material, motion): B 3 1 2 1 2 3 -> re-rolled to meet B rule (stark, expressive, bezel, expressive); C 2 2 3 3 2 2.

## A: Kitchen Notebook (quiet, not built)
Thesis: a ruled notebook page; grounded on brief "weekly, mixed expertise". Axes balanced/standard/neutral/column/flat-hairline/productive. Composition: "tonight line -> seven ruled rows -> list link", one column. Fingerprint: ink-on-paper risk, would need a tinted canvas.

## B: Butcher's Block (bold, not built)
Thesis: stark ink on cut-paper red. Axes dense/stark/expressive display/rail+work/bezel/expressive. Composition: "left rail of people -> big week table".

## C: Greengrocer's Board (chosen, built)
Thesis: a household's week should feel like the price board outside a greengrocer: hand-lettered, tag-shaped, fresh-coloured and quick to read at arm's length.
Axes: density=balanced, contrast=standard, type=expressive display + utility, layout=stage, material=soft-elevated, motion=balanced fitted to the budget (rolls: 2 2 3 3 2 2). Differs from A on type, layout, material, motion (4/6).
Source of palette: lettuce-green canvas, beet-red primary (price-marker ink), carrot warning, bottle-green ink (greengrocer's apron and board). Source of type: Fraunces (soft, hand-lettered sign serif) + Figtree. Source of motif: the punched hang-tag.
Tension resolutions: motion.tension-delight-speed -> speed (weekly/daily glance); data.tension-density-clarity -> clarity (in-store use).
Palette: see tokens.json (light + designed dark: deep green board, tags lighter as they rise). fg/bg 14.3, muted-fg/muted 7.3, primary-fg/primary 7.8.
Layout: Week = stage: tonight's dinner owns the top ~45% of the first viewport as a large tag; the other six nights follow as rows. Eye path: tonight name -> cook -> week rows.
Material: tags are cream cards, layered tinted shadow (green-black hue), radii 14 outer / 6 inner, hairline borders.
Craft values: tracking display -0.02em, caps labels 0.06em; line-height display 1.1; numbers tabular, units muted.
Icons: Lucide-style inline SVG, stroke 1.75, hand-drawn in components (no library installed). Imagery: none needed: dinners are named, shown with a coloured initial tag; people as monograms.
Motif: punched hang-tag, repeats in day labels, aisle headings, completion badge, brand mark, empty slots.
Accent moment: carrot dot marking tonight; beet underline on the current nav.
Motion: balanced position fitted to weekly frequency: micro 100, short 150, standard 250 (dialog), hero 600 only for the completion tag swing. easing enter (0,0,0,1) exit (0.3,0,1,1).
Real transition: "Add dinner" opener -> dialog scales from 0.96 + fades; picked dinner then fills the night row (fade).
Signature detail: the completion tag swinging on its string when the seventh night is filled.
Fingerprint check: pass (no gradient text, no purple, no ink-on-paper: coloured primary and tinted canvas).
