# Motion

Scope: when to animate, how long, with which curve, on which properties, and how motion stays coherent and safe across the app. Token values come from the `duration` and `easing` groups in `tokens/default.tokens.json` (durations `instant 50 · micro 100 · short 150 · standard 250 · medium 300 · long 400 · hero 500`; easings `enter`, `enter-emphasized`, `exit`, `move`, `snappy`, `linear`).

### motion.purpose-only

```yaml
id: motion.purpose-only
domain: motion
principle: "Every animation must do a job: show where something came from or went, confirm an action, reveal a relationship, or direct attention. If it does none of these, remove it."
why: "Motion is the strongest attention signal on a screen; decorative motion spends that signal on nothing and trains users to ignore the moments that matter."
sources: ["Head, Designing Interface Animation", "Saffer, Microinteractions", "Material 3, Motion overview"]
applies-when: "Every proposed transition, hover effect, loop, or entrance."
not-when: "Loading indicators, whose job is to show that work is ongoing."
decides: [motion.level, blueprint.transitions]
tensions: [motion.tension-delight-speed, motion.one-signature-moment]
asked-by: []
checks:
  measured: "Probe: no animation with iterations=Infinity except elements with role=progressbar/status or aria-busy ancestors."
  judged: "For each animation, can you name its job in one phrase (orient, confirm, relate, focus)? Which ones only exist to look nice?"
```

### motion.frequency-budget

```yaml
id: motion.frequency-budget
domain: motion
principle: "Scale motion inversely with how often an interaction happens: 100+ times a day or keyboard-triggered gets no animation; routine UI stays at 300ms or under; only rare moments may run longer, capped at 500ms (backdrops excepted)."
why: "A delay that delights once becomes friction on the hundredth repetition; frequent actions must feel instant or the product feels slow."
sources: ["Emil Kowalski, emilkowal.ski animation writing", "NN/g, Executing UX Animations: Duration and Motion Characteristics", "Yablonski, Laws of UX, Doherty threshold"]
applies-when: "Setting motion.level per screen from the brief's frequency of use; any command palette, list navigation, tab switch, or shortcut."
not-when: null
decides: [motion.level, tokens.duration]
tensions: [motion.tension-delight-speed, motion.one-signature-moment, personality.playful]
asked-by: [interview.context.frequency]
checks:
  measured: "check-static rule long-duration (>500ms, or >300ms on non-backdrop UI); probe: animations started by keyboard shortcuts or command-palette actions have duration 0."
  judged: "Which interaction will this user repeat most often in a day, and does it wait on any animation?"
```

### motion.duration-by-distance

```yaml
id: motion.duration-by-distance
domain: motion
principle: "Pick duration from the size and travel of the change: micro/short (100-150ms) for toggles and hovers, standard (250ms) for popovers and menus, medium/long (300-400ms) for sheets and page transitions. Exits run at 60-75% of the enter."
why: "Small objects covering long durations feel sluggish and large ones moving fast feel jarring; exits are shorter because the user has already decided and wants the UI out of the way."
sources: ["Material 3, Motion: easing and duration tokens", "Head, Designing Interface Animation", "NN/g, Executing UX Animations: Duration and Motion Characteristics"]
applies-when: "Any transition that changes position, size, or visibility."
not-when: "Instant feedback (press states, 50ms) and progress indicators."
decides: [tokens.duration]
tensions: [motion.frequency-budget]
asked-by: []
checks:
  measured: "Probe: every animation duration is a duration token (50/100/150/250/300/400/500ms); paired exit duration is between 0.6 and 0.75 of its enter."
  judged: "Does anything feel slow for its size (a tooltip taking as long as a modal) or abrupt for its distance?"
```

### motion.easing-roles

```yaml
id: motion.easing-roles
domain: motion
principle: "Assign easing by role: entering elements decelerate (enter, enter-emphasized), exiting ones accelerate (exit), on-screen movement uses move, and snappy is for quick, responsive feedback. Scale entrances from 0.9-0.97, never from 0."
why: "Deceleration reads as arrival and acceleration as departure, the web's version of slow in and slow out; scaling from zero makes objects appear from nowhere and breaks their sense of physical presence."
sources: ["Thomas & Johnston, The Illusion of Life, slow in and slow out", "Material 3, Motion: easing tokens", "Emil Kowalski, emilkowal.ski animation writing"]
applies-when: "Every transition and keyframe animation; springs follow the same split (spatial may bounce, effects never)."
not-when: "Linear is correct only for continuous progress, spinners, and colour/opacity loops."
decides: [tokens.easing]
tensions: [personality.playful, personality.energetic]
asked-by: [interview.personality.calm-energetic]
checks:
  measured: "check-static rules ease-in-entrance and scale-from-zero; probe: entering animations use decelerating curves; no keyframe starts at scale(0)."
  judged: "Does anything enter with an accelerating curve or leave with a lingering one?"
```

### motion.compositor-only

```yaml
id: motion.compositor-only
domain: motion
principle: "Anything that moves, grows or shrinks animates transform and opacity only; never width, height, top, left, margin or padding, and never `transition: all`. Colour crossfades are allowed for small state changes."
why: "Transform and opacity can run on the compositor without re-layout, so they hold 60fps on weak devices; layout properties trigger reflow every frame and stutter."
sources: ["Paul Lewis, web.dev, Stick to compositor-only properties and manage layer count", "Josh Comeau, An Interactive Guide to CSS Transitions", "Emil Kowalski, emilkowal.ski animation writing"]
applies-when: "All CSS transitions, keyframes, and JS animation libraries."
not-when: "Height auto reveals may use grid-template-rows or a library FLIP technique, which still resolves to transform."
decides: [component.accordion, component.drawer, tokens.duration]
tensions: [motion.spatial-continuity]
asked-by: [interview.constraints.platform-stack]
checks:
  measured: "check-static rules no-transition-all and animate-layout-prop; probe: animation properties are a subset of {transform, opacity, color, background-color, border-color, filter}."
  judged: "Record a performance trace on a mid-range phone profile: does any transition drop frames or shift layout?"
```

### motion.spatial-continuity

```yaml
id: motion.spatial-continuity
domain: motion
principle: "Give the app one spatial model and keep it: drilling in moves forward, going back reverses the same path, overlays rise from their trigger, and parents animate before children (30-80ms stagger on first load only)."
why: "A consistent direction of travel lets users build a mental map of where screens live; contradictory directions make navigation feel random."
sources: ["Material 3, Motion: transition patterns", "Head, Designing Interface Animation", "Rauno Freiberg, Invisible Details of Interaction Design (rauno.me)"]
applies-when: "Navigation transitions, drill-down lists, sheets, popovers, shared-element transitions."
not-when: "Apps with flat navigation and no hierarchy may use crossfades only."
decides: [blueprint.nav-model, blueprint.transitions, component.popover]
tensions: [motion.reduced-motion, motion.frequency-budget]
asked-by: [interview.constraints.locales]
checks:
  measured: "Probe: forward and back navigations between the same pair of screens translate on the same axis with opposite sign; popover transform-origin lies on the side of its trigger; stagger delays appear only on first render."
  judged: "Could a user close their eyes, press back three times, and predict which way each screen will slide?"
```

### motion.reduced-motion

```yaml
id: motion.reduced-motion
domain: motion
principle: "Under prefers-reduced-motion, drop spatial movement (translate, scale, parallax, auto-play) but keep opacity and colour changes so state changes are still visible. Reduced means fewer, not zero."
why: "Large or vestibular-triggering motion can cause nausea and dizziness; removing all feedback instead leaves those users with abrupt, confusing jumps."
sources: ["WCAG 2.2 SC 2.3.3 Animation from Interactions (AAA, advisory)", "WCAG 2.2 SC 2.2.2 Pause, Stop, Hide", "Josh Comeau, Accessible Animations in React"]
applies-when: "Every project with any animation."
not-when: null
decides: [motion.level, tokens.duration]
tensions: [motion.spatial-continuity, motion.one-signature-moment]
asked-by: [interview.constraints.a11y]
checks:
  measured: "check-static rule no-reduced-motion; probe with emulated reduced motion: no animation changes transform; opacity/colour animations remain and are 150ms or less."
  judged: "With reduced motion on, is every state change (open, close, success) still perceivable?"
```

### motion.one-signature-moment

```yaml
id: motion.one-signature-moment
domain: motion
principle: "Spend the expressive motion budget on one moment per app, chosen from the brief (a rare, emotionally significant event such as completion, first success, or onboarding), and keep all other motion quiet."
why: "People remember experiences by their peak and their end; one crafted peak lands harder than expressive motion spread thin, and it stays rare enough never to annoy."
sources: ["Yablonski, Laws of UX, Peak-end rule", "Saffer, Microinteractions", "Thomas & Johnston, The Illusion of Life, staging"]
applies-when: "Directions and System stages, when locking the motion language."
not-when: "Utility tools used in short, frequent bursts, where the signature may be only a subtle confirmation."
decides: [motion.signature, motion.level]
tensions: [motion.frequency-budget, motion.purpose-only, motion.tension-delight-speed]
asked-by: []
checks:
  measured: "Probe across the flow walk: at most one distinct animation over 300ms (backdrops excepted) or using spatial spring bounce; it is triggered at most once per session."
  judged: "Is the signature moment tied to something this user actually cares about, and would they see it rarely enough to still enjoy it on day 30?"
```

### motion.tension-delight-speed

```yaml
id: motion.tension-delight-speed
domain: motion
principle: "Delight (expressive, longer, springy motion) and speed (instant, minimal motion) pull against each other. Speed wins on frequent, task-driven, expert paths; delight wins on rare, emotional, or first-run moments."
why: "Both sides are real: motion builds affinity and explains change, but every millisecond on a repeated path taxes productivity; the answer depends on frequency and audience, not on taste."
sources: ["IBM Carbon, Motion: productive and expressive", "Yablonski, Laws of UX, Doherty threshold", "Emil Kowalski, emilkowal.ski animation writing"]
applies-when: "Setting motion.level, choosing the signature moment, or reviewing any animation on a frequent path."
not-when: null
resolve-by: ["frequency of use (interview.context.frequency)", "user expertise (interview.purpose.expertise)", "session length (interview.context.session)", "calm-energetic and serious-playful positions (interview.personality.*)", "first-run job (interview.jobs.first-run)"]
decides: [motion.level, tokens.duration, tokens.easing, motion.signature]
tensions: [motion.frequency-budget, motion.one-signature-moment, personality.playful, personality.dense-expert]
asked-by: [interview.context.frequency]
checks:
  measured: null
  judged: "Is the resolution logged in decisions.md against the brief's frequency and expertise facts, and does the built motion match it on both the most frequent and the rarest screen?"
```
