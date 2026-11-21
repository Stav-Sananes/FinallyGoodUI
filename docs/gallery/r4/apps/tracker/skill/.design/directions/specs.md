# Directions (autonomous, directions=one: all specs written, only the pick built)

Rolls (node random, raw): B: density 1, layout 3, motion forced by rule; C: density 2 (moved to 3: brief hard constraint expert/daily/dense), contrast 2, layout 2, material 3 (source), type 3 (source). Re-rolls: none. Layouts A1 column / C2 rail+work / B3 stage; materials A1 flat / B2 soft / C3 tonal.

| Axis | A Quiet | B Bold | C Strip Bay |
|---|---|---|---|
| density | 3 dense | 1 airy | 3 dense |
| contrast | 2 standard | 3 stark | 2 standard |
| type | 1 neutral | 3 display | 3 display+utility |
| layout | 1 column | 3 stage | 2 rail+work |
| material | 1 flat | 2 soft | 3 tonal |
| motion | 1 productive | 3 expressive (<=150ms for repeats) | 2 balanced (repeats <=150ms) |

## A: Ledger Column (not built)
Thesis: one reading column of rows, the quietest possible list, because the team knows the work. Near-neutral page, ink buttons: matches the ink-on-paper house style; the brief does not demand restraint (it demands speed), so rejected.

## B: Spotlight (not built)
Thesis: one giant focused issue as a stage, the list shrinks to a ribbon. Saturated magenta accent, expressive spring. Rejected: a stage makes the list (the work) secondary; scanning 12 strips needs the whole rack visible.

## C: Strip Bay (CHOSEN, chosen by agent)
Name: Strip Bay (the air-traffic controller's rack of paper flight strips).
Thesis: triage is the controller's job: a rack of strips, each with a coloured tab, one lit strip at a time, hands on keys. The tracker should feel like that rack: ordered, tactile, instantly legible, quiet until something is urgent.
Axes: density=dense · contrast=standard · type=display+utility · layout=rail+work · material=tonal · motion=balanced (rolls: see above)
Personality recipe: calm 60% + dense-expert 40%; ranges from personality.calm and personality.dense-expert `produces`.
Tension resolutions:
- data.tension-density-clarity: density wins (expert daily keyboard use, brief §context); clarity via strip tab colour, tabular mono ids, 36px rows.
- motion.tension-delight-speed: speed wins (very high frequency); delight confined to cursor lift and the one Bay-clear moment.
- craft.tension-restraint-liveliness: restrained surfaces, lively only at the cursor strip (amber ring) and priority tabs.
Palette: see .design/tokens.json. base hue 200 (radar-room sage-teal canvas, not near-neutral paper) · accent hues 225 signal blue (actions) + 65-88 amber (cursor, selection) · contrast standard.
  background oklch(0.935 0.018 200) / foreground oklch(0.24 0.03 230) / card (strip paper) oklch(0.985 0.012 95) / primary oklch(0.40 0.09 225) / accent oklch(0.91 0.07 88) / destructive oklch(0.50 0.19 27)
  dark ("console at night"): re-derived, background oklch(0.21 0.03 215), strips lighter than canvas (oklch 0.265), primary lifts to oklch(0.78 0.11 215).
  check: 34 text/surface pairs in both themes >= 4.5:1 (scratch run of scripts/lib/contrast.mjs), ring >= 3:1.
Type: Barlow Condensed (display: callsigns, headings, counts) + Barlow (text) + IBM Plex Mono (ids, key caps), Google Fonts link, system fallbacks listed.
  why: aviation and signage lettering is condensed and legible at a glance (typography.voice-from-subject); not Inter/Roboto.
Layout concept: top bar (name, sync state, new issue) / left rail 200px: queue tabs as a vertical tablist with counts and a "by priority" summary / work area: the rack of strips / footer key hints. Primary action (new issue, `n`) top right. Eye hits: the lit strip, then the untriaged count in the rail.
  composition: "lit strip -> rack of strips -> rail counts", unlike a single column (A) or a stage (B).
  focal point: the cursor strip (amber ring, lifted).
Material: tonal. The rack is a recessed channel one step darker than the canvas; strips are lighter paper with a hairline and a 4px leading priority tab. shadows: one soft tinted (hue 230, alpha .06-.12) only on the lifted cursor strip; dark: lighter surface rises. radius 2/3/6 nested. hairlines: border token at hairline.
Craft values: tracking display 0.01em / headings 0 / caps labels 0.06em; line-height display 1.05; numbers: tabular mono ids, true minus not needed, units muted.
Icons: hand-written inline SVG, 1.75 stroke, 20px grid (no icon library, no install).
Identity motif: the strip tab. Repeats in: every issue row (leading tab), rail tab indicators (leading bar), toast leading edge, dialog priority header edge, focus/cursor ring.
Accent moment: amber cursor ring + `kbd` caps in the footer; "Bay clear" empty state.
Motion personality: balanced; durations micro 100 / standard 150 (repeat) / hero 600 (Bay clear once). easing enter (tokens), exit, snappy. Budget: repeated actions <=150ms.
  the one real transition: pressing a priority key re-tints the strip's tab with a short slide (transform/opacity) and the cursor advances.
Signature detail: the strip tab column, which reads as a priority histogram down the whole rack.
Fingerprint check: pass. Not near-neutral paper (tinted sage canvas), primary is a colour not near-black, no gradient/glass/glow, no Inter, rail not a card grid.
