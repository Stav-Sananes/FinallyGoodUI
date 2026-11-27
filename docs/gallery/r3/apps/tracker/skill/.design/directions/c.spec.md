# Direction C: Triage Tag
Name source: the brief's own verb. "Triage" comes from emergency medicine, where every patient gets a manila tag with a coloured tear-off strip (red immediate, yellow delayed, green minor) and a rubber-stamped disposition. A morning issue triage is the same act.
Thesis: Each issue is handled like a tagged case: a manila work surface, priority as a notched tag strip in triage colours, and a rubber stamp for the decision, so the daily chore of sorting new issues reads as one clear, physical act, while the rest of the day stays dense and fast.
Axes: density=3 dense · contrast=1 soft · type=3 expressive display + utility · layout=2 rail + work (bound by brief) · material=2 soft-elevated · motion=3 expressive (fitted to budget)
  rolls: density 1 → moved to 2 (brief hard constraint: experts + daily → dense; airy would contradict interview.personality.dense-airy) → clash with B on density → re-roll 3 · contrast 2 → re-rolled (C vs A only 3 diffs): 2,3,3,2,1 → 1 · material 2 · motion 3 (a spare re-roll of 2 was drawn by mistake and discarded; motion did not fail any rule) · type set to 3 by the subject (printed-form condensed grotesk) · layout bound by brief, not rolled.
Personality recipe: dense-expert 45% + raw-industrial 30% + calm 25%; ranges from their `produces` fields.
Tension resolutions:
  - data.tension-density-clarity → density (32px rows, 13px base); clarity kept by the tag strip giving every row the same left landmark (brief: purpose.expertise, context.frequency)
  - motion.tension-delight-speed → speed on every keyboard path (0ms); delight spent on the triage-cleared stamp only (brief: context.frequency; D7)
  - personality.calm vs personality.raw-industrial → soft surface steps and a warm manila substrate (calm), with exposed 1px structure, small 2–3px radii and mono micro-labels (raw)
  - craft.tension-restraint-liveliness → the manila canvas and triage colours give it a point of view without adding effects
Palette (OKLCH, roles):
  inputs: base hue 85 (manila card stock) · accent hue 28 (stamp red) · contrast soft (surfaces 0.02–0.04 L apart)
  light: background oklch(0.925 0.032 85) manila / surface-1 (list) oklch(0.945 0.026 87) / surface-2 (panel, popovers) oklch(0.965 0.018 88) / rail oklch(0.9 0.036 83)
         foreground oklch(0.25 0.035 260) carbon ink (blue-black form-printing ink) / muted-foreground oklch(0.45 0.03 255)
         primary oklch(0.27 0.04 260) ink (actions in ink) / primary-foreground oklch(0.965 0.018 88)
         mark (stamp red) oklch(0.52 0.18 28) — P0 strip, stamps, triage count, current-view bar
         ring/selection oklch(0.48 0.14 258) carbon blue; selected row fill = surface-2 + ring bar
         tag-p1 (delayed yellow) oklch(0.82 0.14 82) · tag-p2 (minor green) oklch(0.58 0.11 150) · tag-p3 (routine) oklch(0.7 0.02 85)
         border oklch(0.25 0.035 260 / 0.14)
  dark ("carbon copy"): background oklch(0.205 0.014 70) / surface-1 oklch(0.225 0.015 72) / surface-2 oklch(0.255 0.016 74) / rail oklch(0.185 0.012 70)
         foreground oklch(0.92 0.03 86) manila ink / muted-foreground oklch(0.74 0.025 84) / primary oklch(0.9 0.035 86) / primary-foreground oklch(0.21 0.015 70)
         mark oklch(0.68 0.16 30) / ring oklch(0.72 0.11 255) / tag-p1 oklch(0.8 0.13 82) / tag-p2 oklch(0.7 0.12 150) / tag-p3 oklch(0.55 0.02 80) / border oklch(0.92 0.03 86 / 0.12)
  check: fg/bg ≥ 7:1, muted/bg ≥ 4.5:1 on every surface, both themes (run lib/contrast.mjs)
Type: Archivo (Google Fonts variable, wdth 62–125, wght 400–800) used at two widths: condensed 62–75 wdth / 700–800 for the display moments (view count, panel issue title, stamps) and normal width 400/600 for UI; JetBrains Mono 400/500 for issue keys, times, shortcut keys.
  why: Archivo's condensed cuts read like the printed headings on a tag or form; one family carries both voices (typography.limited-families-weights). Mono only for data engineers already read in mono (keys like ING-214, kbd) — not a costume.
Layout concept: left rail (views with counts) · centre list grouped by status (status header rows, 32px issue rows: tag strip · key · title · labels · assignee initials · updated) · right panel (issue key + stamp area, condensed title, field column Status / Priority / Assignee / Labels, description, activity, comment box). Primary action "New issue" in the list toolbar, ink-filled.
  composition: list toolbar oversized count ("Triage 9") → selected row → panel title. Same shell as A and B (bound); differs by its tag-strip row anatomy and the raised paper panel.
  focal point: the selected issue's condensed title in the panel; the view count is the one oversized figure.
Material: soft-elevated — the panel and popovers are raised paper: shadows 0 1px 0 oklch(0.25 0.035 260 / 0.06), 0 6px 18px -6px oklch(0.35 0.05 70 / 0.18) (warm-tinted); dark: lighter surface + hairline, no big shadow (craft.tinted-shadows)
  radius: panel 4 → inner fields 2; tags 2 with a notch; buttons 3; no pills (craft.concentric-radii) · hairlines: 1px ink at 14% (craft.hairlines-before-boxes)
Craft values: tracking display -0.02em (condensed), headings -0.01em, caps micro-labels +0.08em; line-height display 1.05; numbers tabular, counts in condensed 800 (craft.number-setting)
Icons & imagery: Phosphor (regular weight, CDN, pinned version); status as distinct shapes (circle-dashed, circle, circle-half, git-pull-request, check-circle, x-circle); people as initials monograms; no images (craft.real-imagery-and-icons)
Identity motif: the triage tag strip (a small notched strip in triage colour with "P0–P3" printed on it) — repeats in: (1) every issue row's priority marker, (2) the rail's Triage count badge, (3) the panel's priority field and header tag, (4) the priority menu options, (5) the Triage-cleared empty state (craft.identity-motif). The rubber stamp is its partner: closed issues get a stamped disposition (DONE / DUPLICATE / WON'T FIX) in the panel header.
Accent moment: stamp red on the Triage count and current-view bar; the stamp itself on triage cleared.
Motion personality: expressive curve, budget-fitted
  durations: instant 50 · micro 100 · short 150 · standard 250 · long 400 · hero 600 (stamp only)
  easing: enter (0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1) · snappy (0.23,1,0.32,1)
  spring: spatial stamp {duration 0.4s, bounce 0.25} (scale 1.08 → 0.98 → 1 + rotate -4°) · effects bounce 0
  keyboard selection, J/K, 1–4: 0ms; row group move FLIP 150ms; panel open 150ms from trailing edge; menus 120ms from trigger.
  the one real transition: pressing S → Todo on the last Triage issue (or the Done button) moves it out; the queue counter rolls to 0 and a "CLEARED" stamp lands on the empty state (motion.one-signature-moment)
Signature detail: the triage tag strip + rubber stamp disposition
Fingerprint check: cream-serif-terracotta — no serif, no terracotta; manila hue from the subject, ink is blue-black → pass. near-black-acid-accent — light substrate, dark mode warm carbon not #0a0a0a → pass. mono-as-costume — mono only on keys/kbd/times → pass. redundant-status-tags — status shown once in group headers, rows show only the tag strip → pass. ink-on-paper — canvas chroma 0.032 (> 0.025) and the motif owns a surface → pass.
