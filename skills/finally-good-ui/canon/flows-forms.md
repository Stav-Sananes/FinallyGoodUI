# Flows & Forms

Scope: multi-step tasks and data entry. Covers how a flow is split into steps, how fields are labelled, validated and prefilled, and how the next action is made obvious. These cards feed `blueprint.flows` and form components.

### flows-forms.one-thing-per-page
```yaml
id: flows-forms.one-thing-per-page
domain: flows-forms
principle: "Split long or high-stakes tasks into short steps that each ask one question or a tight group of related ones (such as an address). Show progress ('Step 2 of 4'), keep entered data when going back, and end with a check-your-answers summary."
why: "Small steps lower the cognitive load, make errors local to one screen, work on small viewports and let the flow branch on earlier answers. Each step also acts as a save point."
sources: ["GOV.UK Design System, Question pages pattern (one thing per page)", "Silver, Form Design Patterns (on splitting long forms)", "Tidwell et al., Designing Interfaces (3rd ed.), ch.3 (Step by Step / wizard)"]
applies-when: "Onboarding, checkout, applications, setup and any form over about 7 fields or with branching logic."
not-when: "Short forms (login, search, a few settings fields) or expert users editing many fields at once. A single editable page is faster there."
decides: [blueprint.flows, component.stepper, component.form-layout]
tensions: [usability.tension-guidance-expertise]
asked-by: [interview.context.environment]
checks:
  measured: "Multi-step flows expose a step indicator with the current step marked (aria-current='step'). Back navigation keeps field values (walk forward, back, and compare values)."
  judged: "Does each step have one clear question, and could any two steps merge without making the screen harder to read?"
```

### flows-forms.labels-above
```yaml
id: flows-forms.labels-above
domain: flows-forms
principle: "Put a visible, persistent label above each field, left-aligned, with hint text between the label and the input. Never use placeholder text as the only label. Mark optional fields, not required ones, when most fields are required."
why: "Top labels give the fastest completion and one vertical scan path, survive narrow screens and long translations, and stay visible while typing. Placeholder-only labels disappear, fail contrast and look like pre-filled values."
sources: ["Wroblewski, Web Form Design: Filling in the Blanks (label placement)", "Silver, Form Design Patterns (labels and hints)", "WCAG 2.2, SC 3.3.2 Labels or Instructions", "NN/g, Placeholders in Form Fields Are Harmful"]
applies-when: "Every form input, select, textarea and control group."
not-when: "Dense expert tables or inline-edit grids where column headers act as labels and an aria-label names each cell."
decides: [component.input, component.form-layout, tokens.text]
tensions: [data.tension-density-clarity]
asked-by: []
checks:
  measured: "Every input, select and textarea has a programmatic label (label[for], wrapping label, or aria-labelledby) whose text is visible. The label's bounding box sits above or beside the field, not inside it."
  judged: "With all fields filled in, can you still tell what every field is?"
```

### flows-forms.inline-validation-timing
```yaml
id: flows-forms.inline-validation-timing
domain: flows-forms
principle: "Validate a field when the user leaves it (on blur), never while they are still typing. Once a field shows an error, re-check it as they type so the error clears the moment it is fixed. On submit, summarise all errors at the top and move focus there, and link each one to its field."
why: "Errors shown mid-typing punish people for unfinished input, while late-only validation makes them hunt. In Wroblewski's tests, checking after the field was left gave fewer errors and faster completion than checking while typing or only on submit."
sources: ["Wroblewski, Inline Validation in Web Forms (A List Apart, 2009)", "Silver, Form Design Patterns (validation)", "WCAG 2.2, SC 3.3.1 Error Identification, SC 3.3.3 Error Suggestion", "GOV.UK Design System, Error summary component"]
applies-when: "Any form with rules beyond 'required', such as formats, uniqueness or password rules."
not-when: "Password strength or character counters, where live per-keystroke feedback is the point and must be neutral, not red."
decides: [component.input, component.error-summary, blueprint.state-matrix]
tensions: [writing.error-messages]
asked-by: []
checks:
  measured: "Typing an invalid partial value without blurring shows no aria-invalid='true'. After blur it does. Error text is linked via aria-describedby. On a failed submit, focus moves to the error summary or the first invalid field."
  judged: "Does each error say what is wrong and how to fix it, next to the field, without shouting at a half-typed value?"
```

### flows-forms.sensible-defaults
```yaml
id: flows-forms.sensible-defaults
domain: flows-forms
principle: "Pre-fill what you know or can safely infer, such as locale, country, the previous choice, the most common option and data from the account. Make the default the safe, reversible choice, and never pre-tick consent, upsells or payment options."
why: "Most people keep defaults, so a good default removes a decision for most users. A self-serving default turns that same inertia against them and destroys trust."
sources: ["Tidwell et al., Designing Interfaces (3rd ed.), ch.10 (good defaults and smart prefills)", "Cooper et al., About Face (4th ed.), on reducing excise", "WCAG 2.2, SC 3.3.7 Redundant Entry"]
applies-when: "Forms, settings, creation dialogs, and filters with an obvious common case."
not-when: "Choices where no answer is safe for everyone (gender, plan tier, legal consent). Leave these unselected and require an explicit choice."
decides: [component.input, component.select, blueprint.flows]
tensions: [usability.error-prevention]
asked-by: [interview.jobs.first-run]
checks:
  measured: "Consent and marketing checkboxes are unchecked on load. Fields for known account data (email, name) are pre-populated or carry autocomplete tokens."
  judged: "For each field, would most users leave the default unchanged, and if they do, is that outcome in their interest?"
```

### flows-forms.primary-action-clarity
```yaml
id: flows-forms.primary-action-clarity
domain: flows-forms
principle: "Each screen or step has at most one primary action. Give it the strongest visual weight and a label naming the outcome ('Create project', not 'Submit'), and place it where the eye ends, after the last field. Secondary actions are visibly quieter, and destructive ones are styled apart."
why: "One dominant action removes the 'which button?' pause and cuts wrong-button errors. Several equal-weight buttons make every choice look equally recommended."
sources: ["Wathan & Schoger, Refactoring UI, 'Hierarchy is Everything' (button hierarchy)", "Material 3, Buttons (emphasis levels)", "Apple HIG, Buttons", "Krug, Don't Make Me Think (3rd ed.), ch.3 Billboard Design 101"]
applies-when: "Forms, dialogs, empty states, cards with actions, and page headers."
not-when: "Peer choices of equal weight (two plan options) should share one style and be told apart by content."
decides: [component.button, component.dialog, component.form-layout]
tensions: [layout.tension-consistency-emphasis]
asked-by: [interview.purpose.success, interview.jobs.top-tasks]
checks:
  measured: "Per view (or per open dialog), count buttons using the primary style. Flag more than 1. Flag generic labels (Submit, OK, Yes, Click here) on primary buttons."
  judged: "Squinting at the screenshot, is there exactly one obvious next action, and does its label say what will happen?"
```
