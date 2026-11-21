# Direction C: Appointment Card (led by the subject)  <- CHOSEN
Name: from the salon front desk's appointment card.
Thesis: booking should feel like being handed a ticket with your dog's name on it: warm paper, a perforated edge, a tennis-ball-green stamp when it is yours.
Axes: density=airy · contrast=soft · type=neutral text (Figtree) + characterful display (Bricolage Grotesque) for 2 large moments · layout=stage · material=flat-hairline · motion=expressive  (rolls: density 1, contrast 1, type 1, layout 3, material 1, motion 3; none re-rolled; C vs A differs on density, contrast, layout, material, motion = 5; vs B differs on density, contrast, layout, material = 4)
Personality recipe: warm 50% + playful 30% + tidy/utilitarian 20%.
Tension resolutions:
  - motion.tension-delight-speed: speed wins for taps (≤150ms), delight spent on the single stamp (brief: interrupted, monthly).
  - data.tension-density-clarity: clarity (airy) because a one-handed owner glances (brief: on their phone).
  - craft.tension-restraint-liveliness: liveliness through one tennis-ball accent used for "yours" (selected slot, stamp, focus accent), restraint elsewhere.
Palette (OKLCH): base hue 85 (biscuit) · accent hue 118 (tennis) · primary hue 200 (pool) · contrast soft-standard
  background oklch(0.93 0.04 88) / foreground oklch(0.26 0.04 50) / muted oklch(0.89 0.04 85) / primary oklch(0.42 0.085 200) / mark oklch(0.90 0.17 118) / border oklch(0.80 0.04 80) / destructive oklch(0.50 0.17 28)
  dark: bath-tile slate teal oklch(0.22 0.03 215), re-derived not inverted.
  check: all text pairs measured with scripts/lib/contrast.mjs (see decisions).
  sources: coat colour (biscuit), bath tile (pool teal), tennis ball (mark).
Type: Bricolage Grotesque (display) + Figtree (text); fontsource self-hosted. why: friendly with character, not tied to a template [typography.expressive-display].
Layout concept (stage): the day+time ticket owns the first viewport on step 2: a big card with the 7-day strip on top, a perforation line, and the slot grid below; summary stub at its foot. Phone: single column. Desktop: ticket centred ≤ 720px with the service summary rail on the right at ≥1024px.
  composition: ticket as focal object, summary rail beside on desktop.
  focal point: the slot grid, with the selected slot in tennis green.
Material: flat-hairline: 1px borders, space; no shadows except the dialog and toast (elevation tokens). Radius 14 outer / 10 inner / 6 chips (concentric).
Craft values: tracking display -0.02em / headings -0.01em / caps labels 0.06em; line-height display 1.05; numbers tabular, units muted.
Icons & imagery: inline stroke SVG, 1.75 stroke (hand-set paw/clock/calendar glyphs, one family); no photos: dogs as initial monograms in coat-coloured discs. 
Identity motif: ticket stub: repeats in slot summary, review summary, confirmation ticket, visit cards, dialog edge.
Accent moment: tennis-ball green on selected slot, stamp, and the active tab pip.
Motion personality: expressive within budget (taps 100-150ms; stamp hero 600ms once).
  the one real transition: tap a slot -> its summary stub slides up from the grid into the ticket foot; confirm -> the stamp lands.
Signature detail: perforated tear line with half-round notches at both ends of every ticket.
Fingerprint check: not ink-on-paper (tinted biscuit canvas, teal primary, tennis mark); no gradient text/glow; pass.
Chosen by agent: C. Distinct from a generic salon app (pastel gradient hero) and from the ink-on-paper house style: coloured primary on a tinted canvas with a subject motif that owns surfaces. Config says `directions: one` which would build A; the parent brief overrode: pick one with reasons.
