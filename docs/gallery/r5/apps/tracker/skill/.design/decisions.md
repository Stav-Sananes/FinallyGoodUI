# Decisions: Sorting Office
## D1 Direction pick (directions: one)
- Step: directions · 2026-11-26 · active. Self-approved (autonomous), "chosen by agent: distinctiveness".
- Options: A Ledger (ink on paper, quiet) · B Console (dark dev-tool) · C Sorting Office (subject-led postal room).
- Chosen C. Why: the brief's "six-person team" maps to a six-cell pigeonhole case and "triage" to sorting incoming mail; palette (manila, postal blue ink, stamp red/orange), type (slab display like a postal form, mono for ids as postal codes) and motif (postmark ring) come from that world, unlike a generic tracker or the ink-on-paper house style. [personality.dense-expert, craft.identity-motif]
## D2 Navigation model
- Peer tabs Intake/Mine/All, state in URL. One screen suffices for a daily keyboard task. [ia-nav.url-as-state, usability.frequency-drives-visibility]
## D3 Keys
- Digits sort to people (1-6), letters set priority (u h m l, - clears), z undo. Letters chosen as initials of the priority words so they are memorable; digits map to the pigeonhole labels shown on screen. Typing in a field disables them. [usability.recognition-over-recall, flows-forms.undo-over-confirm]
## D4 Material and radius
- Layered paper (sm tinted shadow), 2-6px sharp radii, hairline edges in manila-brown. Dark = night sorting room, lighter surfaces as they rise. [craft.material-restraint, craft.tinted-shadows, color.dark-mode-not-inverted]
## D5 Colour
- Priority is a stamp ink: urgent=destructive red, high=orange, medium=postal blue, low=teal, none=dashed outline. Never colour only: label letter always shown. [data.status-encoding]
## D6 Type
- Roboto Slab (display, wordmark, issue titles in letter), Public Sans (UI), JetBrains Mono (ids, keys). Self-hosted via Fontsource, no CDN. [typography.limited-families-weights]
## D7 Motion (productive)
- Repeated row moves/stamps <=150ms, transform+opacity. One hero: "Intake clear" postmark stamps down (hero 600ms, once per clear). Reduced motion drops translation/scale. [motion.frequency-budget, motion.one-signature-moment]
## D8 Identity motif placements
- Postmark ring: on a sorted row's priority stamp; in the Intake-clear hero; behind the wordmark; on empty states. Perforated edge: tray header and letter top. Pigeonhole grid: six cells = team.
## D9 Components
- Scaffolded from spec (component-style.json): button, field, menu, dialog, tabs, toast, toggle, disclosure. See README.
