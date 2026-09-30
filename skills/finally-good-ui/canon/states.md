# States

Scope: every screen exists in more than its happy path. This domain covers the empty, loading, error, partial, no-permission and pending states that fill `blueprint.state-matrix`. Design every cell in the matrix. Don't leave any of them to framework defaults.

### states.empty-state-teaches
```yaml
id: states.empty-state-teaches
domain: states
principle: "An empty state says what will appear here, why it is empty now and the one action that fills it (create, import, connect, clear filters). Tell apart first-use empty, no-results and cleared-out (inbox zero), because each needs a different message."
why: "The first empty screen is often the user's first real look at a feature. A bare 'No data' wastes the best teaching moment and can read as broken."
sources: ["Wathan & Schoger, Refactoring UI, 'Finishing Touches' (don't overlook empty states)", "Tidwell et al., Designing Interfaces (3rd ed.), ch.7 Lists of Things", "NN/g, Designing Empty States in Complex Applications"]
applies-when: "Every list, table, dashboard, search result, inbox and feed, in first-use, no-results and cleared variants."
not-when: null
decides: [blueprint.state-matrix, component.empty-state]
tensions: [ia-nav.tension-discoverability-minimalism]
asked-by: [interview.purpose.success, interview.jobs.first-run]
checks:
  measured: "With the collection API forced to return [] via interception, the region renders visible text plus at least one button or link. It does not render a blank container or the raw string 'No data'."
  judged: "Does each empty state say what belongs here and offer the next step, and does no-results offer a way to widen or clear the search?"
```

### states.loading-perceived
```yaml
id: states.loading-perceived
domain: states
principle: "Match the loading signal to the wait. Under about 300 ms show nothing (delay the indicator so it doesn't flash). From 300 ms to 2 s show a skeleton that mirrors the final layout, or an inline spinner for actions. Over 2 s keep the skeleton and show progressive content. Over about 10 s show determinate progress, an estimate and a way to cancel or leave."
why: "Perceived speed depends on predictability and on something happening, more than on raw time. Layout-matched skeletons avoid jumps, and a delayed indicator stops fast responses from flickering."
sources: ["Nielsen, Response Times: The 3 Important Limits (NN/g)", "NN/g, Progress Indicators Make a Slow System Less Insufferable", "Yablonski, Laws of UX, 'Doherty Threshold'", "Vercel, Web Interface Guidelines (loading states)"]
applies-when: "Every data fetch, route transition, submission and long-running job."
not-when: "Local or cached data that resolves under 100 ms. Render directly."
decides: [blueprint.state-matrix, component.skeleton, component.progress, motion.level]
tensions: [motion.frequency-budget, states.optimistic-feedback]
asked-by: [interview.content.volume]
checks:
  measured: "With responses delayed 2 s via interception, a loading indicator (aria-busy='true', role=progressbar, or a skeleton) is present. CLS during load-to-content is under 0.1."
  judged: "Does the loading state look like the page it becomes, and does any content jump when data arrives?"
```

### states.error-recovery
```yaml
id: states.error-recovery
domain: states
principle: "An error state says in plain words what happened, keeps whatever the user already entered or loaded, and offers a concrete next step (retry, fix this field, go back, contact). Scope it to the failed part. A failed widget must not blank the whole page."
why: "The damage from an error comes mostly from lost work and dead ends, not from the failure itself. Local, recoverable errors keep trust and let the rest of the app keep working."
sources: ["Nielsen, 10 Usability Heuristics, #9 Help users recognize, diagnose, and recover from errors", "Norman, The Design of Everyday Things (rev. 2013), ch.5 Human Error? No, Bad Design", "WCAG 2.2, SC 3.3.3 Error Suggestion", "Apple HIG, Alerts"]
applies-when: "Network failures, server errors, validation failures, timeouts and 404s, per component and per route."
not-when: null
decides: [blueprint.state-matrix, component.error-state, component.alert]
tensions: [usability.error-prevention]
asked-by: [interview.risks.failure]
checks:
  measured: "With one API forced to 500 via interception, other regions still render. The failed region shows text plus a retry or next-step control. Form input values survive a failed submit."
  judged: "Does each error say what happened and what to do next without jargon or blame, and is nothing the user typed lost?"
```

### states.partial-and-permission
```yaml
id: states.partial-and-permission
domain: states
principle: "Design the in-between states on purpose. These are partial data (some fields missing, a truncated list, a stale cache), degraded service (offline, rate-limited) and no-permission. For no-permission, show that the thing exists, why it is locked and who can grant access, or hide it entirely if knowing it exists is itself sensitive."
why: "Real data is rarely complete, and real users rarely have every role. Unplanned partial states produce broken layouts, 'undefined' labels and mysterious disabled buttons that generate support tickets."
sources: ["Tidwell et al., Designing Interfaces (3rd ed.), ch.7 Lists of Things", "Nielsen, 10 Usability Heuristics, #1 Visibility of system status", "Material 3, Interaction states (disabled)"]
applies-when: "Any screen fed by optional fields, paginated or streaming data, role-based access or network-dependent features."
not-when: null
decides: [blueprint.state-matrix, component.permission-gate, component.banner]
tensions: [states.empty-state-teaches]
asked-by: [interview.purpose.audience, interview.content.volume, interview.risks.trust]
checks:
  measured: "With optional fields stripped from fixtures, no text node renders 'undefined', 'null' or 'NaN' and no layout overflows. Disabled controls have a visible reason (tooltip or adjacent text) or are omitted."
  judged: "For a user missing a role, is it clear what they can't do, why, and whom to ask?"
```

### states.optimistic-feedback
```yaml
id: states.optimistic-feedback
domain: states
principle: "For frequent, low-risk, usually successful actions (like, toggle, reorder, rename, mark done), update the UI immediately and sync in the background. If the sync fails, roll back visibly and explain. Use pessimistic (wait-then-show) updates for payments, irreversible actions and anything with a real chance of failing."
why: "Optimistic updates make the app feel instant because they skip the network wait. Silent rollbacks or optimism on risky actions show things that are not true, which costs more trust than a spinner."
sources: ["Vercel, Web Interface Guidelines (optimistic updates)", "Yablonski, Laws of UX, 'Doherty Threshold'", "Nielsen, 10 Usability Heuristics, #1 Visibility of system status"]
applies-when: "High-frequency, reversible mutations with failure rates well under 1%."
not-when: "Payments, sending, deleting without undo, and server-validated actions such as uniqueness checks."
decides: [blueprint.state-matrix, component.toast, blueprint.flows]
tensions: [states.loading-perceived, usability.user-control-undo]
asked-by: [interview.risks.trust]
checks:
  measured: "For marked optimistic actions, the DOM reflects the change before the network response (delay the response 1 s and assert). With a forced failure, the prior state is restored and an alert or status message appears."
  judged: "Is optimism used only where failure is rare and harmless, and does a failure clearly say it didn't stick?"
```
