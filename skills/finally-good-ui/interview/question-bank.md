# Design interview — question bank

Used by `modules/interview.md`. Ask in area order: purpose → context → jobs → content → personality → constraints → risks. Within an area, ask in the order listed. Reword freely for the project, but keep the options concrete and the recommendation first.

Depth values: `full` = new app, no brand · `brand` = new app with an existing brand (skip personality and visual questions) · `feature` = feature inside an existing app (jobs, flows, states only).

## Answer → downstream decision (most consequential)

| Question | If the answer is… | …then downstream |
|---|---|---|
| interview.context.frequency | many times a day | Persistent visible nav, keyboard shortcuts, motion budget near zero on repeated actions (≤150ms, no entrance choreography). `motion.frequency-budget` |
| interview.context.frequency | a few times a year | Guided flows, one-thing-per-page, more explanation, room for one signature moment. `flows-forms.one-thing-per-page` |
| interview.context.device | phone first | Bottom tabs (≤5 destinations), 44px targets, single-column layouts; desktop is the adaptation. `a11y.target-size` |
| interview.purpose.expertise | experts / daily pros | Density over air, tables over cards, shortcuts, fewer confirmations; resolve `usability.tension-guidance-expertise` toward efficiency. |
| interview.jobs.top-tasks | 1 dominant task | That task owns the home screen and the primary action; nav may be minimal. `flows-forms.primary-action-clarity` |
| interview.jobs.top-tasks | 6+ equal destinations | Sidebar or grouped nav, search. `ia-nav.nav-model-by-count` |
| interview.content.volume | thousands of items | Search + filters first, dense tables, pagination/virtualisation, partial states matter. `ia-nav.search-vs-browse` |
| interview.personality.calm-energetic | calm | Low contrast steps, generous spacing, slow standard easing, one accent. `personality.calm` |
| interview.personality.dense-airy | dense | Tight spacing scale, smaller text steps, tabular numbers. `data.tension-density-clarity` |
| interview.risks.failure | money / data loss | Undo over confirm where possible, explicit confirmations where not, error states designed first. `usability.user-control-undo` |
| interview.constraints.a11y | legal requirement | WCAG 2.2 AA as a hard gate from day one, not a later pass. `a11y.contrast-minimums` |

---

## purpose

### interview.purpose.one-liner
```yaml
area: purpose
question: "In one sentence, what does this app let someone do? (Who does what, to get what.)"
options:
  - "Let me draft it from the code/README and you correct it (recommended when a README, landing copy or routes exist)"
  - "I'll write it myself"
  - "It's not clear yet — help me sharpen it with two or three candidate sentences"
why: "The one-liner is the tiebreaker for every later trade-off: if a screen or element doesn't serve it, it gets demoted or cut. It also becomes the home screen's headline job."
cards: [usability.self-evident, layout.hierarchy-by-weight]
skip-if: "brief.md already states the purpose, or the user's request contains a clear who/what/outcome sentence"
depth: [full, brand, feature]
follow-ups:
  - "If the sentence has two verbs joined by 'and': which one matters more on day one?"
```

### interview.purpose.audience
```yaml
area: purpose
question: "Who is the main person using this?"
options:
  - "One clear type of user, e.g. 'freelance designers' (recommended when the product is early — design for one person first)"
  - "Two distinct groups with different jobs, e.g. 'shoppers and store owners'"
  - "Internal team members / staff"
  - "The general public, anyone"
why: "A single primary user lets every screen make sharp choices; two groups usually means two navigation spaces or role-based views. 'Anyone' forces lowest-common-denominator clarity and stricter accessibility."
cards: [writing.user-language, usability.self-evident, states.partial-and-permission]
skip-if: "audience is explicit in the brief, README or request"
depth: [full, brand]
follow-ups:
  - "If two groups: do they ever share a screen, or are their worlds separate?"
  - "What words do they use for the main thing they work with? (Use their words in the UI.)"
```

### interview.purpose.expertise
```yaml
area: purpose
question: "How familiar will users be with this kind of tool?"
options:
  - "Mixed — beginners at first, many become regulars (recommended when unsure; design for learnable-then-fast)"
  - "Beginners — they may use it once or rarely"
  - "Experts — they use tools like this all day and want speed"
why: "Expertise decides the guidance↔efficiency trade-off: beginners need visible labels, defaults and hand-holding; experts need density, shortcuts and fewer interruptions. Mixed audiences get progressive disclosure."
cards: [usability.tension-guidance-expertise, ia-nav.progressive-disclosure, usability.recognition-over-recall]
skip-if: "audience answer already implies it (e.g. 'traders', 'first-time home buyers')"
depth: [full, brand]
follow-ups:
  - "Experts: which tool do they currently use? Its conventions become expectations we shouldn't break without reason."
```

### interview.purpose.success
```yaml
area: purpose
question: "How will you know the design is working, three months after launch?"
options:
  - "Users finish the main task quickly without help (recommended for tools and utilities)"
  - "Users come back often / habit forms"
  - "Users trust it with something important (money, data, health)"
  - "Users sign up / convert"
why: "The success measure picks what gets optimised: task speed favours short flows and clear primary actions; retention favours a strong home screen and state continuity; trust favours clarity and error prevention over flair; conversion favours first-run and empty states."
cards: [flows-forms.primary-action-clarity, states.empty-state-teaches, personality.serious-trustworthy]
skip-if: "brief.md lists success metrics"
depth: [full, brand]
```

## context

### interview.context.device
```yaml
area: context
question: "Where will people mostly use it?"
options:
  - "Desktop/laptop mainly, phone must still work (recommended for work tools and dashboards)"
  - "Phone mainly, desktop must still work (recommended for consumer, on-the-go, or field use)"
  - "Both equally"
  - "Tablet or a fixed screen (kiosk, TV, in-store)"
why: "Primary device sets the navigation model (sidebar vs bottom tabs), target sizes, and which layout is designed first. Designing the secondary device as an adaptation, not a squeeze, avoids broken layouts at 375px."
cards: [ia-nav.nav-model-by-count, a11y.target-size, layout.intrinsic-responsive]
skip-if: "stack is mobile-native, or the request names the device"
depth: [full, brand]
```

### interview.context.frequency
```yaml
area: context
question: "How often will a typical user open it?"
options:
  - "Several times a day (recommended to assume for work tools — err toward speed)"
  - "A few times a week"
  - "Once a month or less"
  - "Once, or a handful of times ever (onboarding, a form, a checkout)"
why: "Frequency sets the motion budget and nav visibility: daily-use screens get near-instant feedback and persistent nav because every extra 200ms is paid hundreds of times; rare-use screens can afford guidance and one expressive moment."
cards: [motion.frequency-budget, motion.tension-delight-speed, ia-nav.visible-destinations]
skip-if: "never — ask it even when you think you know; it drives motion"
depth: [full, brand, feature]
follow-ups:
  - "Is there one screen they open far more than others? (That screen gets the tightest motion budget.)"
```

### interview.context.environment
```yaml
area: context
question: "What's the situation around them when they use it?"
options:
  - "At a desk, focused (recommended default for work tools)"
  - "On the move, distracted, one hand"
  - "Bright light or outdoors / shared screen / presentation"
  - "Under stress or time pressure (support, ops, emergencies)"
why: "Distraction and stress shrink attention: they call for bigger targets, fewer choices per screen, higher contrast and forgiving errors. Focused desk use allows more density."
cards: [a11y.target-size, a11y.contrast-minimums, flows-forms.one-thing-per-page, usability.error-prevention]
skip-if: "device + audience already make it obvious (e.g. warehouse scanner app)"
depth: [full, brand]
```

### interview.context.session
```yaml
area: context
question: "How long is a typical visit?"
options:
  - "Quick check, under a minute — glance and go (recommended to probe for dashboards and trackers)"
  - "A focused task of a few minutes"
  - "Long sessions — hours of working inside it"
  - "Interrupted — they start, leave, and come back later"
why: "Glance sessions need summary-first screens and instant status; long sessions need comfortable reading measure, low visual fatigue and dark mode; interrupted sessions need saved drafts and a clear 'where was I'."
cards: [data.dashboard-summary-first, usability.system-status, ia-nav.wayfinding-location, typography.measure]
skip-if: "frequency answer is 'once' (session is the whole relationship)"
depth: [full, brand]
```

## jobs

### interview.jobs.top-tasks
```yaml
area: jobs
question: "List the 3–7 things people come here to do, most important first. I've drafted a list from the code — correct it."
options:
  - "Your draft list is right, order as shown (recommended when routes/models exist — confirm, don't retype)"
  - "Mostly right — I'll reorder or rename"
  - "There's really one main thing; the rest is secondary"
  - "I'll write the list from scratch"
why: "Task count and ranking decide the navigation model (tabs for ≤5, sidebar for more, a single hub when one task dominates) and which task owns the primary button on each screen."
cards: [ia-nav.nav-model-by-count, ia-nav.visible-destinations, flows-forms.primary-action-clarity]
skip-if: "never skip; in feature depth ask only about the feature's tasks"
depth: [full, brand, feature]
follow-ups:
  - "For the top task: what's the very first thing they need to see to start it?"
  - "Which of these must be reachable from anywhere in one click?"
```

### interview.jobs.first-run
```yaml
area: jobs
question: "What should a brand-new user see the first time, before they have any data?"
options:
  - "An empty state that shows what goes here and one button to create the first item (recommended for most apps)"
  - "Sample/demo data they can explore, then clear"
  - "A short setup flow (2–4 steps) before the main app"
  - "Nothing special — they arrive with data already (imported, invited to a team)"
why: "First-run is the most-seen empty state and decides whether people reach the first success. It shapes the empty-state design for every list and whether an onboarding flow exists in the blueprint."
cards: [states.empty-state-teaches, flows-forms.sensible-defaults, usability.self-evident]
skip-if: "feature depth and the feature adds no new empty collection"
depth: [full, brand, feature]
```

## content

### interview.content.type
```yaml
area: content
question: "What will the screens mostly be filled with?"
options:
  - "Lists/records of things (tasks, orders, contacts) (recommended guess for CRUD apps — confirm)"
  - "Numbers and charts"
  - "Long text to read or write"
  - "Images, video or media"
  - "Forms and input"
why: "Content type chooses the core layout pattern (table vs card grid vs reading column vs canvas) and which canon domains dominate — data-heavy apps lean on data.* and typography.tabular-numbers; reading apps on typography.measure."
cards: [data.chart-choice, data.dense-tables, typography.measure, layout.grid-alignment]
skip-if: "data models or existing screens make it unambiguous"
depth: [full, brand]
```

### interview.content.volume
```yaml
area: content
question: "How much of it will a heavy user have after a year?"
options:
  - "Dozens of items (recommended guess for personal tools)"
  - "Hundreds"
  - "Thousands or more"
  - "Varies wildly between users"
why: "Volume decides browse vs search: dozens fit a simple list; hundreds need sorting and filters; thousands need search first, dense rows, pagination and designed partial/slow-loading states."
cards: [ia-nav.search-vs-browse, data.dense-tables, states.loading-perceived, states.partial-and-permission]
skip-if: "content.type is long text or one-off forms"
depth: [full, brand, feature]
```

## personality

### interview.personality.calm-energetic
```yaml
area: personality
question: "Should it feel calm or energetic?"
options:
  - "Calm — quiet, steady, gets out of the way (recommended when used often or for serious work)"
  - "Balanced — calm by default, a little lift on key moments"
  - "Energetic — lively, punchy, motivating"
why: "This sets contrast steps, accent quantity and the motion curve: calm means soft contrast, generous space, one accent and gentle easing; energetic means stronger contrast, more colour and snappier springs. It also places tokens on the productive↔expressive motion axis."
cards: [personality.calm, personality.energetic, color.accent-restraint, motion.easing-roles]
skip-if: "brand exists (brand.md defines it) or references answer already implies it"
depth: [full]
```

### interview.personality.serious-playful
```yaml
area: personality
question: "Serious or playful?"
options:
  - "Serious and trustworthy (recommended when money, health, data or business decisions are involved)"
  - "Friendly — warm but still professional"
  - "Playful — personality, humour, surprise"
why: "This sets type voice, corner radius, copy tone and whether motion may bounce. Playful touches on a high-stakes screen erode trust; a stiff tone on a consumer hobby app feels cold."
cards: [personality.serious-trustworthy, personality.playful, writing.user-language]
skip-if: "brand exists; or risks.trust already established high stakes (default to serious and confirm in one line)"
depth: [full]
```

### interview.personality.dense-airy
```yaml
area: personality
question: "How much should fit on a screen?"
options:
  - "Airy — fewer things, lots of breathing room (recommended for beginners and rare use)"
  - "Balanced"
  - "Dense — see as much as possible at once (recommended for experts and daily data work)"
why: "Density sets the spacing scale, text sizes and whether rows or cards are the default. Dense wins for scanning and comparing; airy wins for focus and first impressions — the resolution is logged against expertise and frequency."
cards: [personality.dense-expert, data.tension-density-clarity, layout.spacing-scale]
skip-if: "expertise=experts and frequency=daily (default dense, confirm in one line)"
depth: [full]
```

### interview.personality.references
```yaml
area: personality
question: "Name 1–3 apps or sites whose feel you like (any category), and one you don't want to look like."
options:
  - "Skip — derive the feel from the answers so far (recommended when earlier answers are clear)"
  - "I'll name some"
why: "References are used to extract qualities (density, contrast, motion, type voice), never to copy a look. The anti-reference is often more useful: it names the generic look to steer away from."
cards: [personality.calm, personality.energetic, layout.hierarchy-by-weight]
skip-if: "brand exists"
depth: [full]
follow-ups:
  - "What specifically do you like about it — the speed, the calm, the typography, how it moves?"
```

## constraints

### interview.constraints.brand
```yaml
area: constraints
question: "Is there an existing brand to follow?"
options:
  - "Use what's in the codebase — I found colours/fonts and will extract them (recommended when detect found tokens)"
  - "Yes — logo, colours and fonts exist outside the code; I'll share them"
  - "Just a logo/colour, nothing else"
  - "No brand — create one from this brief"
why: "An existing brand fixes palette and type, so directions vary only layout, density and motion; no brand means directions may explore colour and type too. It also decides whether personality questions are needed."
cards: [color.role-scale, typography.limited-families-weights, usability.consistency-standards]
skip-if: ".design/brand.md exists and the user has not asked to change it"
depth: [full]
follow-ups:
  - "Is the brand accent accessible as text on white? If not, we'll use it for fills and a darker step for text."
```

### interview.constraints.a11y
```yaml
area: constraints
question: "What level of accessibility do you need?"
options:
  - "WCAG 2.2 AA (recommended — the default; covers contrast, keyboard, focus, target size)"
  - "AA is a legal/contract requirement (public sector, enterprise, EU)"
  - "AAA or specific needs (low vision, screen-reader-first users, motor impairments)"
why: "AA is the floor this skill enforces anyway; a legal requirement makes it a release gate and adds audit notes to reports; AAA or specific needs raise contrast, text size and target sizes, which reshapes the palette and density."
cards: [a11y.contrast-minimums, a11y.keyboard-complete, a11y.target-size, motion.reduced-motion]
skip-if: "never lower than AA; skip only if the user already stated a level"
depth: [full, brand]
```

### interview.constraints.locales
```yaml
area: constraints
question: "Which languages will it ship in?"
options:
  - "English only for now, but don't block translation later (recommended default)"
  - "Several left-to-right languages (e.g. German, French — expect ~30% longer text)"
  - "Includes right-to-left (Arabic, Hebrew)"
  - "Includes CJK or other scripts"
why: "Text expansion breaks fixed-width buttons and tabs; RTL mirrors layout and directional motion; CJK needs different fonts and line-height. Knowing now keeps layouts intrinsic and motion direction-aware."
cards: [layout.intrinsic-responsive, typography.line-height, motion.spatial-continuity]
skip-if: "i18n config found in the codebase"
depth: [full, brand]
```

### interview.constraints.platform-stack
```yaml
area: constraints
question: "I detected <stack>. Any constraints on what we can add?"
options:
  - "Use what's there; ask before adding any library (recommended)"
  - "Free to add small, well-known libraries (e.g. an animation library)"
  - "Locked down — no new dependencies at all"
  - "Starting fresh — pick a stack for me"
why: "This decides whether motion and components are built from CSS and existing primitives, or whether an upgrade can be proposed when a recipe needs it. It keeps suggestions honest about size cost."
cards: [usability.consistency-standards, motion.compositor-only]
skip-if: "config.json or the request already states dependency policy"
depth: [full, brand]
```

## risks

### interview.risks.failure
```yaml
area: risks
question: "What's the worst thing a user could do by accident here?"
options:
  - "Lose or delete their work/data (recommended to assume for anything with user content)"
  - "Send, pay or publish something they didn't mean to"
  - "Change something that affects other people (team settings, permissions)"
  - "Nothing serious — every action is easy to undo"
why: "The worst mistake decides where to spend friction: undo for reversible actions, confirmation with specific consequences for irreversible ones, and error states designed before happy paths on those flows."
cards: [usability.user-control-undo, usability.error-prevention, states.error-recovery, writing.error-messages]
skip-if: "app is read-only"
depth: [full, brand, feature]
follow-ups:
  - "Can that action be undone technically (soft delete, draft, cancel window)? Undo beats 'Are you sure?'."
```

### interview.risks.trust
```yaml
area: risks
question: "What would make a user stop trusting it?"
options:
  - "Wrong or stale numbers/data (recommended to probe for dashboards and finance)"
  - "Unclear what happened after an action (did it save? did it send?)"
  - "Looking unprofessional or unfinished"
  - "Privacy — not knowing who can see what"
why: "Trust failures map to specific states: stale data needs visible freshness and loading states; unclear outcomes need system-status feedback; privacy needs permission and sharing states made explicit."
cards: [usability.system-status, states.optimistic-feedback, states.partial-and-permission, personality.serious-trustworthy]
skip-if: "never skip in full depth"
depth: [full, brand, feature]
```
