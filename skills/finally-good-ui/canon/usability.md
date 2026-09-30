# Usability

Scope: the baseline contract between the interface and the person using it. Covers memory load, feedback, reversibility, convention and error avoidance. Apply these cards to every screen before any visual decision.

### usability.recognition-over-recall
```yaml
id: usability.recognition-over-recall
domain: usability
principle: "Put options, recent items and needed context on screen instead of making people remember them. Examples are recents, suggestions, visible filters, and field hints that stay visible after typing starts."
why: "Recognising a cue is much cheaper than retrieving it from memory. Every value a user must carry between screens is a chance to fail and a source of fatigue."
sources: ["Nielsen, 10 Usability Heuristics, #6 Recognition rather than recall", "Norman, The Design of Everyday Things (rev. 2013), ch.3 Knowledge in the Head and in the World", "Lidwell et al., Universal Principles of Design, 'Recognition Over Recall'"]
applies-when: "Any choice, command or value the user has seen before or must copy from elsewhere."
not-when: "Memorised power paths (shortcuts, command syntax) for experts. Offer them as accelerators and keep the visible path."
decides: [component.command-menu, component.recents, component.search, blueprint.flows]
tensions: [ia-nav.tension-discoverability-minimalism, usability.tension-guidance-expertise]
asked-by: [interview.purpose.expertise]
checks:
  measured: "Inputs whose only hint is a placeholder (no label or persistent description) are flagged. So are multi-step flows that ask for a value already entered in an earlier step (WCAG 3.3.7)."
  judged: "Does any step need the user to remember something from a previous screen, or recall a name or ID they cannot see?"
```

### usability.system-status
```yaml
id: usability.system-status
domain: usability
principle: "Acknowledge every action within 100 ms and say what the system is doing, where things stand and what just changed. Scale the signal to the wait (see states.loading-perceived)."
why: "Without feedback people repeat the action, abandon it or lose trust. Nielsen's limits hold. At 0.1 s a response feels instant, at 1 s flow survives, and after 10 s attention is lost."
sources: ["Nielsen, 10 Usability Heuristics, #1 Visibility of system status", "Nielsen, Response Times: The 3 Important Limits (NN/g)", "Norman, The Design of Everyday Things (rev. 2013), ch.1 (feedback)", "WCAG 2.2, SC 4.1.3 Status Messages"]
applies-when: "Every user-initiated action, background sync, save, upload and long-running job."
not-when: null
decides: [blueprint.state-matrix, component.toast, component.button, component.progress]
tensions: [motion.frequency-budget]
asked-by: [interview.context.session, interview.risks.trust]
checks:
  measured: "After clicking each primary action, some DOM or ARIA change (pressed, disabled, aria-busy, or a live-region update) happens within 100 ms. Async results are announced via role=status or aria-live."
  judged: "After each action in the flow, can a user tell from a screenshot whether it worked, is still working or failed?"
```

### usability.user-control-undo
```yaml
id: usability.user-control-undo
domain: usability
principle: "Make actions reversible and give every mode, modal and flow a visible exit. Prefer undo (a toast that stays 5–10 s, or trash/archive) over an 'Are you sure?' dialog. Keep confirmations for actions that truly cannot be undone."
why: "Undo lets people explore safely and costs the careful majority nothing. Routine confirmations get clicked through by habit, so they protect no one."
sources: ["Nielsen, 10 Usability Heuristics, #3 User control and freedom", "Lidwell et al., Universal Principles of Design, 'Forgiveness'", "Cooper et al., About Face (4th ed.), on undo and eliminating confirmation dialogs", "Apple HIG, Undo and redo"]
applies-when: "Destructive, bulk or state-changing actions, and anything that opens a modal, wizard or special mode."
not-when: "Actions that cannot really be undone (sending money, sending to external people, permanent purge). Use explicit confirmation that names the consequence instead."
decides: [component.toast, component.dialog, blueprint.flows]
tensions: [usability.error-prevention]
asked-by: [interview.risks.failure]
checks:
  measured: "Every open dialog and drawer closes on Escape and has a visible close or cancel control. Destructive buttons are followed by an undo affordance or a confirmation step."
  judged: "For each destructive action, is recovery possible without contacting support, and is there always a way out of the current mode?"
```

### usability.consistency-standards
```yaml
id: usability.consistency-standards
domain: usability
principle: "The same thing should look, sit and behave the same everywhere. Follow platform and web conventions unless you can name the gain from breaking them. Keep one component per role, one term per concept and stable placement for navigation and help."
why: "Users spend most of their time in other products (Jakob's Law), so convention is free knowledge. Internal inconsistency makes people doubt whether two things are the same."
sources: ["Nielsen, 10 Usability Heuristics, #4 Consistency and standards", "Yablonski, Laws of UX, 'Jakob's Law'", "Lidwell et al., Universal Principles of Design, 'Consistency'", "WCAG 2.2, SC 3.2.3 Consistent Navigation, 3.2.4 Consistent Identification"]
applies-when: "Always, and especially across screens built by different people or subagents."
not-when: "A deliberate emphasis break for the single most important element. See layout.tension-consistency-emphasis."
decides: [component.button, component.nav, tokens.space, tokens.text]
tensions: [layout.tension-consistency-emphasis]
asked-by: [interview.constraints.brand, interview.constraints.platform-stack]
checks:
  measured: "Across all screens, elements with the same accessible name and role share computed styles (font, radius, height, colour role). Navigation landmarks appear in the same DOM order on every page."
  judged: "Are there two different-looking controls that do the same job, or one label used for two different actions?"
```

### usability.error-prevention
```yaml
id: usability.error-prevention
domain: usability
principle: "Design errors out before handling them. Constrain inputs (pickers, masks, disabled-until-valid only with an explanation), accept any sensible format, warn before a costly slip and add a review step before commitments that are legal, financial or can't be undone."
why: "Every prevented error saves an error message, a recovery path and some lost trust. Slips come from the design, not from careless users."
sources: ["Nielsen, 10 Usability Heuristics, #5 Error prevention", "Norman, The Design of Everyday Things (rev. 2013), ch.5 Human Error? No, Bad Design", "WCAG 2.2, SC 3.3.4 Error Prevention (Legal, Financial, Data)"]
applies-when: "Data entry, destructive actions, and commitments involving money, legal terms or publishing."
not-when: "Constraints that block valid edge cases (names, addresses, international phone formats). Being liberal in what you accept wins there."
decides: [component.input, component.date-picker, blueprint.flows]
tensions: [usability.user-control-undo, flows-forms.sensible-defaults]
asked-by: [interview.context.environment, interview.risks.failure]
checks:
  measured: "Inputs use the right type, inputmode and autocomplete attributes for their data (email, tel, one-time-code, postal-code). Paste is not blocked (no preventDefault on paste)."
  judged: "Where could a reasonable user make a costly mistake in this flow, and does the design stop it or only report it afterwards?"
```

### usability.self-evident
```yaml
id: usability.self-evident
domain: usability
principle: "A first-time user should know what each screen is for, what they can click and what to do next without reading instructions. Clickable things must look clickable, and labels must name outcomes, not internal concepts."
why: "Every moment spent working out the interface is attention taken from the task. People scan and settle for the first plausible option, so ambiguity costs them."
sources: ["Krug, Don't Make Me Think (3rd ed.), ch.1 and ch.3 Billboard Design 101", "Norman, The Design of Everyday Things (rev. 2013), ch.1 (affordances and signifiers)", "Nielsen, 10 Usability Heuristics, #2 Match between system and the real world"]
applies-when: "First-run screens, landing screens, and any screen reached from outside the app (links, notifications)."
not-when: null
decides: [component.button, component.link, blueprint.screens]
tensions: [ia-nav.tension-discoverability-minimalism]
asked-by: [interview.purpose.one-liner, interview.purpose.audience, interview.jobs.first-run]
checks:
  measured: "Elements with click handlers have cursor:pointer and an interactive role. Links are distinguishable from body text by more than colour (underline or weight)."
  judged: "In a 5-second look at the screenshot, can you say what the screen is for and what the single next action is?"
```

### usability.tension-guidance-expertise
```yaml
id: usability.tension-guidance-expertise
domain: usability
principle: "Guidance (onboarding, labels, confirmations, step-by-step flows) helps newcomers but slows experts. Speed (shortcuts, dense views, bulk actions, fewer confirmations) helps experts but can lose newcomers. Design for the perpetual intermediate and layer the rest."
why: "Guidance wins when use is rare, stakes are high or the audience is new, as with tax filing or setup. Expert efficiency wins for daily, repeated work by trained users, as with admin consoles or editors. Most users stay intermediate, so a clear default path plus optional accelerators usually beats either extreme."
sources: ["Cooper et al., About Face (4th ed.), perpetual intermediates", "Nielsen, 10 Usability Heuristics, #7 Flexibility and efficiency of use", "Tidwell et al., Designing Interfaces (3rd ed.), ch.1 Designing for People"]
applies-when: "Choosing onboarding, density, confirmation policy, shortcut coverage and wizard vs single-page flows."
not-when: null
decides: [blueprint.flows, component.onboarding, component.command-menu, layout.density]
tensions: [usability.self-evident, data.tension-density-clarity]
resolve-by: [purpose.expertise, context.frequency, risks.failure]
asked-by: [interview.purpose.expertise]
checks:
  measured: "If the brief marks users as expert or daily users, frequent actions have keyboard shortcuts exposed in tooltips or menus."
  judged: "Is the chosen balance logged in decisions.md against expertise and frequency, and does the UI hold to it on every screen?"
```
