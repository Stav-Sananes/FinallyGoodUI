# Writing

Scope: interface copy (labels, buttons, headings, errors, empty and status text). Words are UI: they are designed with the same care as layout and are part of every screen and state.

### writing.user-language

```yaml
id: writing.user-language
domain: writing
principle: "Name things the way users name them in their own work, not the way the database, API or team does; use plain words, short sentences, and the same term for the same thing everywhere."
why: "Users navigate by recognising words they already have in mind; internal jargon and synonyms force translation and make them doubt they are in the right place."
sources: ["Nielsen heuristic #2, Match between system and the real world", "GOV.UK content design guidance, Writing for GOV.UK (plain English)", "Mailchimp Content Style Guide"]
applies-when: "Navigation labels, headings, field labels, settings, empty states, and any user-facing string."
not-when: "Expert tools whose users share a professional vocabulary; use their terms of art, still consistently."
decides: [copy.labels, blueprint.nav-labels]
tensions: [usability.consistency-standards, personality.dense-expert]
asked-by: [interview.purpose.audience, interview.personality.serious-playful]
checks:
  measured: "Script over rendered text: no leaked implementation strings (null, undefined, NaN, [object Object], raw enum keys like SNAKE_CASE, HTTP codes shown alone); a glossary term maps to one label across screens."
  judged: "Would the user in the brief say this word out loud when describing their task to a colleague?"
```

### writing.action-labels

```yaml
id: writing.action-labels
domain: writing
principle: "Label buttons and links with a specific verb plus object that says what will happen (Save changes, Send invoice, Delete project), in sentence case; avoid OK, Submit, Yes/No and Click here. Destructive confirmations repeat the consequence."
why: "A specific label lets users predict the outcome without reading surrounding text, and it stays meaningful when screen reader users list links and buttons out of context."
sources: ["GOV.UK Design System, Button component guidance", "Mailchimp Content Style Guide", "WCAG 2.2 SC 2.4.6 Headings and Labels"]
applies-when: "Every button, link, menu item and dialog action."
not-when: "Universally understood icon-only controls (close, search) with an accessible name."
decides: [copy.labels, component.button, component.dialog]
tensions: [flows-forms.primary-action-clarity, writing.front-load]
asked-by: []
checks:
  measured: "Script/probe: no button or link whose accessible name is in {OK, Submit, Yes, No, Click here, Here, Read more} without further words (Continue is acceptable in step-by-step flows); confirm-dialog primary button text differs from Yes/OK."
  judged: "Cover the rest of the dialog: from the buttons alone, can you tell what each one will do?"
```

### writing.error-messages

```yaml
id: writing.error-messages
domain: writing
principle: "Say what went wrong in plain words, why if known, and exactly how to fix it; place the message next to the problem, keep the user's input, and never blame the user or show raw codes as the only text."
why: "An error is the moment users are most likely to give up; a message that points to the fix turns a dead end into a one-step detour."
sources: ["Nielsen heuristic #9, Help users recognize, diagnose, and recover from errors", "NN/g, Error-Message Guidelines", "GOV.UK Design System, Error message component", "WCAG 2.2 SC 3.3.1 and 3.3.3"]
applies-when: "Form validation, failed requests, permission denials, empty search results caused by filters."
not-when: null
decides: [copy.errors, component.input, component.alert]
tensions: [flows-forms.inline-validation-timing, states.error-recovery]
asked-by: [interview.risks.failure]
checks:
  measured: "Probe with forced error states: each aria-invalid field has aria-describedby text longer than one word and not equal to Invalid/Error/Required alone; error region uses role=alert or live region; field values persist after the error."
  judged: "Does the message tell the user their next action, in words they would use, without making them feel at fault?"
```

### writing.front-load

```yaml
id: writing.front-load
domain: writing
principle: "Put the information-carrying words first in headings, labels, list items and messages; cut openers like 'Welcome to', 'In order to', 'Click here to' and keep headings and button text short."
why: "People scan the left edge and the first couple of words of a line and decide from that whether to read on; buried keywords are never seen."
sources: ["NN/g, First 2 Words: A Signal for the Scanning Eye", "NN/g, F-Shaped Pattern of reading on the web", "GOV.UK content design guidance, Writing for GOV.UK"]
applies-when: "Headings, nav items, list rows, notifications, email subjects, table headers."
not-when: "Long-form body content with a narrative structure."
decides: [copy.labels, copy.headings]
tensions: [writing.action-labels, writing.user-language]
asked-by: []
checks:
  measured: "Script over headings, buttons and nav items: none begins with filler phrases (Welcome to, In order to, Click here, Please, Here you can); headings 8 words or fewer; buttons 4 words or fewer."
  judged: "Read only the first two words of every item in this list: can you still tell the items apart?"
```
