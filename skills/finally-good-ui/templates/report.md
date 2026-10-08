# UI verification report — <App or feature>

<!-- Written by modules/verify.md to .design/reports/<yyyy-mm-dd>.md. Delete guidance comments when filling. Every finding cites a canon card id. -->

date: <yyyy-mm-dd>
mode: <full | browser-tools | static> <!-- static = not rendered; say why -->
scope: <flows / screens covered>
runs: <r0, r1, r2> → `.design/reports/<run>.json`, screenshots in `.design/reports/shots/<run>/`
matrix: <375-light · 375-dark · 1440-light · 1440-dark · 375-light-rm> · states: <empty, error, loading, denied>
axe: <yes | not installed>

## Result

**<PASS | FAIL>** — gate <passed | failed>, lowest dimension <n> (<score>).
<!-- 2–3 lines: what the user must decide or fix first. -->

## Scorecard

| # | Dimension | Type | r0 | r1 | r2 | Final | Cap / note |
|---|---|---|---|---|---|---|---|
| 1 | Accessibility (gate) | D | | | | | |
| 2 | Layout integrity | D+J | | | | | |
| 3 | Design-system adherence | D | | | | | coverage <ratio> |
| 4 | Visual hierarchy | J | | | | | |
| 5 | Spacing and grouping | J | | | | | |
| 6 | Typography | D+J | | | | | |
| 7 | Colour and theming | D+J | | | | | |
| 8 | States and feedback | J | | | | | |
| 9 | Motion quality | D+J | | | | | |
| 10 | Craft and brand fit | J | | | | | |
<!-- n/a = not verifiable here; give the reason in the note column. Pass = gate passes and all ≥ 4. -->

## Delivery gate

<!-- modules/verify.md §7c. Evidence required for every PASS. Any FAIL = not done. -->
| # | Item | Result | Evidence |
|---|---|---|---|
| G1 | Rubric gate | | |
| G2 | No dead controls / placeholders | | |
| G3 | Claims sourced | | |
| G4 | Click ledger (key screen) | | |
| G5 | Low static findings fixed or justified | | |
| G6 | No unjustified fingerprint, cluster or sterile default | | |
| G7 | Focal point + accent moment per screen | | |
| G8 | Motif in ≥ 3 places | | |
| G9 | Direction fidelity | | |
| G10 | Light, dark, 375 px render | | |

## Fix rounds

| Round | Fixed (finding ids) | Files changed | Pairwise (both orders) | Verdict |
|---|---|---|---|---|
| r1 | | | <X/Y/tie per screen> | <kept \| reverted: why> |

## Remaining issues

<!-- Ranked: gate → lowest dimension → severity → contexts. Max 10. -->
| Sev | Dim | Where (element · contexts) | Card | Evidence | Suggested fix | Shot |
|---|---|---|---|---|---|---|
| high | | | | | | |

## Fingerprint check

| Fingerprint | Where | Justified? (decisions.md ref) |
|---|---|---|
| | | |

## Motion

<!-- From animations[]: count per screen, longest duration, non-compositor properties, behaviour under reduced motion, signature moment present? -->

## Not verified

<!-- States that could not be forced, contexts skipped, tools missing. Write "none" if nothing; never leave it silently empty. -->

## Console errors

<!-- Unique messages with the flow/step where first seen, or "none". -->
