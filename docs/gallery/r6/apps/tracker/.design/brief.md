# Brief: Pigeonhole (issue tracker triage)
Request (verbatim): "Issue tracker: a six-person team triages its issue list from the keyboard."
Stack: Angular 22 (CLI 22.3), standalone components, signals, router. Autonomous run; every answer below is `brief`, `inferred` or `default`.

| Question | Answer | Source |
|---|---|---|
| Product | A triage desk for one team's issue list. Name: Pigeonhole (project key HRB). | inferred (brief: "triages") |
| Audience | Six engineers who triage together every morning and several times a day. Experts, keyboard-first, on laptops; glance on phone. | brief + inferred |
| Core job | Take the unassigned issue in front of you and give it an owner and a priority in one or two keystrokes. | brief ("from the keyboard") |
| Mental model (rule 10) | "Each new issue is a slip of paper; I sort it into one of six people's pigeonholes." Not "rows in a table with an assignee column". | inferred |
| Frequency | Several times a day, 10-40 issues per session: repeated actions <=150ms, no entrance choreography. | inferred, motion.frequency-budget |
| Personality | Dense, quick, tactile; a workshop, not a dashboard. Calm under load. | inferred (personality.dense-expert) |
| Constraints | Keyboard complete (j/k, 1-6, p, x, s, z, c, ?, g then t/i); reduced motion; light + dark; phone usable by tap. No backend: seeded data in the app, persisted to localStorage. | brief + default |
| Tension | data.tension-density-clarity -> density (daily experts); craft.tension-restraint-liveliness -> restraint everywhere except the case. | decided in decisions.md |
| Content | 13 real issues for a billing-and-mobile SaaS ("Harbor"), six named teammates each owning an area. | inferred |
