# Pawprint: salon booking for dog grooming (round 6, booking)

Brief: "Salon booking: dog owners pick a time for a groom, on their phone." Stack: Svelte 5 + Vite, no CDN (fonts self-hosted via fontsource). Run: `npm install && npm run build` (or `npm run dev`). Hash routes: `#/book`, `#/details`, `#/ticket`, `#/services`, `#/visits`; add `?state=loading|error|empty|saveerror` to force any state.

## Direction (one built, agent-chosen): C "Bathhouse"
A bath-tile wall you read the salon's day on: you drop a coral towel the exact length of your dog's groom into a gap, and it fits or it doesn't. Rolls: density 2, contrast 2, type 1, material 2, motion 3, layout 1 (column; kept because the brief says phone). Palette: tile aqua canvas (oklch 0.9 0.055 190), deep-sea primary, towel coral, pine ink; dark re-derived. Type: Bricolage Grotesque (display) + Hanken Grotesk. Specs: `.design/directions/c.spec.md` (A and B written as paragraphs, not built).

## Concept mapping
- groomer's day on the salon wall -> vertical time tape, a lane per groomer, booked blocks hatched
- placing a towel over the dog -> the towel block (length = service minutes for the dog's size) slides into a gap; no gap that long, no tile
- dog's hang-tag -> every visit/service record is a tag with a bitten corner (record surface: notch, sharp radius)

## Skeleton
Phone: day tabs -> tape fills the rest of the first viewport (towel in it) -> docked ticket bar with the one primary action -> tab bar. Desktop: left-aligned 840px tape column with a sticky groom-ticket margin (72px time figure, Book button). Not "top bar + centred column": the column is left-aligned, the tape is edge-to-edge with no border or radius, and the answer lives in the margin.

## Signature (data-fgu-signature = `.tape-frame`)
Day Tape: working control with arrow keys and tap; recomputes valid starts when dog or service changes. Promised >= 30% at 1440 / >= 40% at 375. Measured (check-genericness, final): **37.3% at 1440x900, 52.3% at 375x667**.

## Genericness (final run, G10)
`check-genericness.mjs --url ... --promise-1440 0.3 --promise-375 0.4`: **0 triggers, pass, no fidelity findings**. Earlier run: 1 trigger (scaleFlat, 60/30 = 2.0), fixed by enlarging the ticket time to 72px.

## Components (scaffold-component.mjs, `.design/component-style.json`)
button, field, toggle, dialog, tabs, toast, select, record-row, record-card, disclosure. Roles differ: record = notch edge, sharp, flat; panel = layered, soft; control = round (textarea overridden to panel radius).

## Checks
- `npm run build`: passes (no warnings after one justified svelte-ignore on the key-delegating tape group).
- `check-components --strict`: ok, 0 findings.
- `check-static`: 0 high, 0 medium, 0 low.
- Browser walk (own Playwright script, 80 assertions, all pass): 390 and 1440, light and dark. Flow: tap tile moves towel and ticket, ArrowUp/Enter keyboard pick, service change resizes towel, Sunday closed empty state, Mon 30 "no gap long enough" state with jump to next opening, validation error, booking, ticket, visits, cancel dialog + Undo toast, services. Forced states: book loading/error/empty, visits empty/error, services loading, save error keeps typed input. 0 console errors in every run; no horizontal overflow at 320, 390, 1440, 2880; reduced motion drops the towel transition.
- Not done: independent ui-reviewer pass, pairwise rounds, stock-baseline comparison, check-flows run with flows.json (no subagents allowed; used own walk script instead). Verification is therefore self-assessed.

## Friction with the skill
1. Layout is rolled from four positions, but with a one-line "on their phone" brief the roll `column` conflicts with the rule that the signature must be >= 25% at 1440: a <=760px column cannot reach it without becoming rail+work. I kept the roll and widened the column to 840px with a sticky ticket; the spec says nothing on how a rolled `column` should satisfy the signature promise.
2. `check-palette.mjs` is a hard usage error (exit 2) when a token set has no chart colours; apps without charts must delete the default chart tokens by hand, and `emit-tokens` still ships them.
3. Drafting tokens: system.md says to write CSS strings with `$extensions.fgu.dark`, but the default file is in DTCG object form, so copying defaults and overriding needs a custom script; shadow tokens are a single object for `sm` and an array for `md`/`lg` (my script crashed on that).
4. `check-static` long-duration needs the word "signature"/"expressive" in the selector, discoverable only from the finding message; not in verify.md or craft rules.
5. Router gotcha not covered by the build/adapter docs: a screen's own effect can overwrite the URL before the router reads it (renders first, onMount later); had to read the hash at module load.
6. `check-genericness` wants a stable first-viewport signature, but loading states replace content; I had to tag a constant frame, and pass `--wait`. The doc does not say what to do for async first screens.
7. Scaffolded `tabs` always renders one tabpanel per tab with tabindex 0, awkward when the tab content is one shared live view (I put it inside the active panel).
8. Dark mode of an object-style signature (tiles on a wall) needed its own hand-tuned block; tokens give roles but no "raised tile vs wall" pair.
