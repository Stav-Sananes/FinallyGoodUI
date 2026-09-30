# Decision log — <App name>

<!-- Append-only. Written by blueprint, directions, system, build and verify steps. Number sequentially (D1, D2…) across the whole project.
Record a decision when a reasonable designer could have chosen otherwise. Cite canon card ids in "Why" and name the brief fact (with question id) that decided it.
Never delete a record: when a decision changes, set the old one's Status to "Superseded by D<n>" and write a new one. -->

## D<n> — <short title>
- **Step:** <blueprint | directions | system | build | verify>
- **Date:** <yyyy-mm-dd>
- **Status:** <active | superseded by D<n>>
- **Decision:** <the question being decided, one line>
- **Options considered:**
  1. <option> — <main upside / downside>
  2. <option> — <main upside / downside>
  3. <option, if any>
- **Chosen:** <option n>
- **Why:** <1–3 sentences linking brief facts to the choice> [<card ids>] (brief: <interview question ids>)
- **Tension resolved:** <tension card id → which side won and why, or "none">
- **Revisit if:** <the brief fact that, if it changed, would flip this decision>

<!-- Example:
## D3 — Primary navigation model
- **Step:** blueprint
- **Date:** 2026-09-26
- **Status:** active
- **Decision:** How users move between the 6 primary destinations.
- **Options considered:**
  1. Grouped sidebar — all destinations visible, scales to 12 / uses horizontal space
  2. Top bar — compact / 6 items crowd at 1024px, no room for grouping
  3. Hub page — minimal / adds a click to every daily task
- **Chosen:** 1
- **Why:** Desktop-first, used several times a day, 6 destinations: they must stay visible and one click away. [ia-nav.nav-model-by-count, ia-nav.visible-destinations] (brief: interview.context.device, interview.context.frequency, interview.jobs.top-tasks)
- **Tension resolved:** ia-nav.tension-discoverability-minimalism → discoverability wins; sidebar collapses to icons for experts.
- **Revisit if:** usage shifts to phone-first.
-->
