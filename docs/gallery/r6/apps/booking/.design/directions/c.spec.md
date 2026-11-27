# Direction C: Bathhouse
Thesis: booking a groom should feel like reading the salon's day on a bath-tile wall: you see where the groomers are busy, drop a towel the length of your dog's groom into a gap, and it fits or it doesn't (brief: dog owners, phone, pick a time).
Axes: density=2 balanced · contrast=2 standard · type=1 neutral grotesk (Bricolage has a character display cut) · layout=1 column · material=2 soft-elevated · motion=3 expressive  (rolls: 2,2,1,2,3,1; no re-roll needed since only one direction is built)
Personality recipe: warm 50% + playful 30% + tidy 20%
Tension resolutions:
  - layout.tension-consistency-emphasis: emphasis wins on the tape (one bold surface), consistency everywhere else; brief: one job per screen.
  - usability.tension-guidance-expertise: guidance wins, a first-time owner sees the tape pre-armed with Biscuit and a service (brief: beginner).
Palette (OKLCH):
  inputs: base hue 195 · accent hue 40 · contrast standard
  background oklch(0.9 0.055 190) tile aqua / foreground oklch(0.25 0.05 220) pine ink / muted oklch(0.84 0.045 195) / primary oklch(0.38 0.09 220) deep sea / border oklch(0.68 0.06 200) / card oklch(0.975 0.015 95) towel white / towel oklch(0.74 0.15 38) coral / destructive oklch(0.5 0.19 27)
  dark: bg oklch(0.2 0.035 215) · card oklch(0.27 0.04 212) · fg oklch(0.94 0.02 190) · primary oklch(0.82 0.1 195) · towel oklch(0.78 0.14 40)
  check: fg/bg and primary-foreground/primary >= 4.5:1 (scripts/lib/contrast.mjs)
Type: Bricolage Grotesque (display, variable, 600-800) + Hanken Grotesk (text), self-hosted with @fontsource-variable, fallbacks system.
  why: a grotesk with a wobble in the display cut reads friendly and a little dog-eared; Hanken stays quiet under it (typography.limited-families-weights).
Concept mapping (3 rows): the groomer's day on the salon wall -> a vertical time tape with a lane per groomer, booked blocks hatched like clipped fur | placing a towel over a dog on the table -> a towel-block the exact length of the groom that you tap into a gap and it slides there, or it won't fit | a dog's hang-tag on the kennel -> each visit/service record is a tag with a bitten corner (record edge: notch, sharp radius)
Skeleton: phone: day tabs (12%) -> tape fills the rest (55-60% of the first viewport, towel block in it) -> docked ticket bar with the one primary action -> tab bar. Desktop 1440: left-aligned 780px tape column (header, pickers, tape) with a sticky groom-ticket margin on the right (answer and Book button). Replaces blueprint shell on desktop (log D4).
Layout concept: eye hits the towel block on the tape, then the open gaps, then the ticket. Primary action lives in the ticket (docked bottom on phone).
  composition: tape-first, ticket in the margin
  focal point: the towel block
Material: soft-elevated (craft.material-restraint)
  shadows: 2 layers, alpha 0.08/0.12, tinted pine (hue 220) · dark: surfaces get lighter as they rise, shadows near-black tinted
  radius: control full (pill) / panel 16px / record sharp 2px with bitten corner (craft.concentric-radii) · hairlines: pine at 25%
Craft values: tracking display -0.02em / headings -0.01em / caps labels 0.08em; line-height display 1.05; numbers: tabular figures, muted units ("h", "min") (craft.number-setting)
Icons & imagery: no icon font; inline SVG (paw, scissors, tub, clock) drawn at stroke 1.75 in one family style; people/dogs as monogram discs (initial on tile colour); images: none needed because the tape is the picture.
Identity motif: towel stripe (two parallel coral bands, 3px each) — repeats in: the towel block, the ticket's perforation, the active tab indicator, empty-state rule.
Accent moment: the coral towel block, and the confirmed ticket's stamp.
Motion personality: expressive for the one transition, balanced elsewhere
  durations: micro 100ms · standard 250ms · hero 400ms (frequency-budgeted: placement is repeated, so the towel moves at --duration-medium 300ms; hero 600 only for the ticket stamp, once)
  easing: enter (0,0,0,1) · exit (0.3,0,1,1) · move (0.2,0,0,1)
  spring: none (CSS only)
  the one real transition: tap an opening -> the towel block slides along the tape to that gap (transform only), the ticket updates its times.
Signature at scale: the Day Tape: a live, working schedule control; shows 2 groomers' day, hatches booked time, recomputes which starts fit the chosen service's length, and places the towel on tap or arrow keys. First screen of the landing route; >= 25% of 1440x900 and >= 40% of 375x667; data-fgu-signature.
Refuses: no equal-card grid (cardCoverage) · no centred column (singleColumn) · no per-row "..." menu (rowRepeat)
Fingerprint check: pass (tile-aqua canvas is chromatic, towel coral is subject-derived, not terracotta-on-cream; ink-on-paper avoided).
