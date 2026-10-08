---
name: slop-check
description: Use when UI was just generated or edited and must be checked before hand-off, when a user says a screen "looks AI-made", generic, template-like, sterile or unfinished, or asks to audit a page, component or diff for AI slop (gradient text, glass and glow, fake stats, buzzword copy, dead links, placeholder content). Works in any web project, with or without a .design/ folder.
argument-hint: "[path | url | diff ref] [--fix]"
---

# slop-check

A fast pass/fail audit of interface work for the patterns that make UI read as machine-made, in **both** directions: the noisy template (glass, glow, gradients, fake proof, buzzwords) and the sterile default (clean, correct, nothing to remember). It does not redesign. It produces a ledger, and with `--fix` it fixes only what the ledger proves.

Shared knowledge lives in the main skill. `FGU` = `${CLAUDE_SKILL_DIR}/../finally-good-ui`.
- Detector catalogue: `FGU/rubric/ai-default-fingerprints.md`
- Craft cards: `FGU/canon/craft.md`; copy card: `writing.plain-claims` in `FGU/canon/writing.md`

## Target

`$ARGUMENTS` names the target. A URL: render it. A path: those files. No argument:
- **In a git repo** (`git rev-parse --is-inside-work-tree` succeeds): the files changed since `HEAD` (`git diff --name-only HEAD` plus untracked UI files). Nothing changed, or no commits yet: fall through to the next rule.
- **Not a repo, or nothing changed:** the project's UI files (`check-static.mjs --root .` with no `--files` scans them all). If that finds no UI files, or the folder is not a project (home dir, many unrelated apps), ask which path or URL to check. Say in the ledger which rule picked the target.

## Steps

1. **Static detectors.** Run `node "FGU/scripts/check-static.mjs" --root <project> [--files a,b]`. Keep every finding, including `low`. Low findings are taste fingerprints; they are allowed only with a written reason. Zero findings is only evidence if the scan demonstrably ran on the target: confirm `files` > 0 in the JSON, and if in doubt run it once on `FGU/scripts/test/fx/slop` (it must report findings).
2. **Look at it.** Static checks see code, not pixels. Render the target if any browser tool is available (Playwright, a browser MCP, a dev server you can reach) at 375 and 1440, light and dark. Read each screenshot. With no renderer, say so in the ledger and mark the visual items `N/A — not rendered`.
3. **Fingerprints.** Walk every section of the fingerprints file against the screenshots and code: colour and surface, type, layout, motion, content, app and dashboard templates, surface and material, imagery and icons, landing templates, copy, and the sterile default. For each match, look for a reason that passes the file's three tests in `.design/decisions.md`, or, for a direction prototype, in its spec (`.design/directions/<x>.spec.md`) or its header comment. No reason means unjustified.
4. **Copy.** Read every visible string on the target. Count `writing.plain-claims` tells per screen (buzzwords, generic CTAs, em-dash cadence, "not just X, it's Y", fragment runs, lists of three, mind-verbs on software). One tell is noise; three or more on a screen is a FAIL.
5. **Click ledger.** For the main screen, activate every link, button, tab, toggle and menu once (browser tool, or by reading the handlers if not rendered). Record `element → what happened`. Nothing may do nothing. "Did something" means visible change or navigation: a link to the current page counts only for the active nav item and for the wordmark/logo home link (a standard pattern: on the home page it links to itself; never a FAIL); a URL-hash change with nothing on screen changing does not count.
6. **Brief conformance.** If `.design/brief.md` or `blueprint.md` exist, check what they promise for this screen: the signature moment, flows out of it, totals that must update after an action, the theme behaviour. A promised thing that is missing, or data left stale after an action, is a blocker.
7. **Write the ledger** (format below). Lead with the verdict.
8. **`--fix` only:** fix FAIL items with the smallest diff, re-run steps 1 and 5, update the ledger. Do not restyle beyond what a FAIL names; a bigger upgrade is the `polish` skill's job.

## Ledger format

```
SLOP CHECK — <target> — <PASS | FAIL (n blockers)>
rendered: <yes: widths/themes | no: why>

BLOCKERS
FAIL dead-control      src/Nav.tsx:14  href="#" on "Pricing"            → route to /pricing or remove
FAIL unsourced-claim   Hero.tsx:22     "Trusted by 10,000+ teams"       → remove; no source in brief
FAIL sterile-default   home 1440-light no accent, no motif, no focal point → see craft.tension-restraint-liveliness

TASTE (fix or justify in decisions.md)
FAIL glass-overuse     4 surfaces (nav, card, modal, sidebar)           → keep blur on the sticky nav only
PASS gradient-text     none
...

COPY   tells per screen: home 4 (FAIL), settings 1
CLICKS 14 of 14 controls did something | 2 did nothing: …
```

Every PASS names what was checked; every FAIL names where (file:line or screen, context, element), the card id, and the smallest fix.

## Blockers vs taste

- **Blockers** (always FAIL, no justification accepted): `dead-control`, `placeholder-code`, `placeholder-content`, unsourced claims, a control that does nothing, a broken theme (a theme that renders wrong, or ignores the OS setting when no toggle exists), 375 px overflow, a brief-conformance miss (step 6).
- **Direction prototypes** (`.design/directions/*.html`) are previews, not hand-offs: their auto-play demo and the compare-page theme messages are by design (`agents/direction-builder.md`); judge them as product screens otherwise.
- **Taste** (FAIL unless justified): every other fingerprint and `low` static finding, the sterile default, a material cluster, copy-tell clusters.

## Common mistakes

| Mistake | Instead |
|---|---|
| Reporting only high/medium static findings | The low ones are the taste fingerprints; list them all |
| Passing a clean, empty-feeling page | The sterile default is a FAIL, not the absence of slop |
| "Fixing" slop by deleting it and adding nothing | Replace with a decision from the brief: a real accent moment, a motif, a real image |
| Judging the code only | Render it; most fingerprints are visual |
| Restyling during `--fix` | Fix what the ledger names; use `polish` for upgrades |
