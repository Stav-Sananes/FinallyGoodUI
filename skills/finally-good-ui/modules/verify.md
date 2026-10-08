# Module: verify

Verify the **rendered** UI against the rubric, fix at most 2 rounds, report. Always on after build; also the whole of `/finally-good-ui review`.
`SR` = this skill's folder. Scripts print JSON; read it, don't paraphrase it.

Inputs: `.design/brief.md`, `.design/blueprint.md`, `.design/config.json`, `.design/tokens.json`, stack profile (`detect-stack.mjs`), `rubric/rubric.md`, `rubric/ai-default-fingerprints.md`.
Outputs: `.design/flows.json`, `.design/reports/<run>.json` + `shots/<run>/`, `.design/reports/history.json`, `.design/reports/<yyyy-mm-dd>.md`.

If `config.verify` is `"static"`, do Layer 1 + static review only (§7b) and say so.

## 1. Layer 1 — static (hook)

- The plugin's PostToolUse hook runs `check-static` on each edited UI file when `.design/` exists. Fix its high/medium findings as they appear.
- Before Layer 2, run it once across the project: `node SR/scripts/check-static.mjs --root .` Keep the JSON for the scorecard (dimensions 3, 7, 9).

## 2. Dev server

1. Reuse a running server: try `http://localhost:<port>` for the port in the dev script / framework default (Next/Nuxt/Astro/SvelteKit 3000/3000/4321/5173, Vite 5173, Angular 4200). A 2xx/3xx/404 response means it is up.
2. Otherwise start it **in the background**: `<packageManager> run <devScript>` (from the stack profile). Watch its output for the local URL; poll it up to 60 s.
3. **No `devScript` but plain files** (an `index.html` at the root or in `public/`/`dist/`/`build/`, no bundler): serve that folder with a static server in the background and use its URL: `npx --yes serve -l 4173 <dir>` or `python3 -m http.server 4173 --directory <dir>`. Not `file://` (fetch, ES modules and routing break). This is a full browser verify, not §7b.
4. If the server crashes, nothing can serve the app, or it needs secrets/services you do not have: go to §7b and tell the user what blocked it.
5. Stop only servers you started, when verify ends.

## 3. Author `.design/flows.json`

Derive from the blueprint; update it when the blueprint changes. Format (validated by `check-flows.mjs --help`):
```json
{"flows":[{"name":"create-invoice","steps":[
  {"goto":"/invoices"},{"screenshot":"list"},
  {"click":"role=button[name=\"New invoice\"]"},{"fill":["label=Client","Northwind Traders"]},
  {"click":"text=Save"},{"waitFor":"text=Invoice created"},{"screenshot":"saved"}],
 "states":[{"name":"empty","route":"**/api/invoices*","mock":"empty"},
           {"name":"error","route":"**/api/invoices*","mock":"error"},
           {"name":"loading","route":"**/api/invoices*","mock":"slow","delayMs":4000},
           {"name":"denied","route":"**/api/invoices*","mock":"forbidden"}]}]}
```
- **One flow per blueprint key flow** (F1…), in the same order; name it after the task. Add one flow per remaining screen in the inventory (`goto` + `screenshot`) so every screen is seen.
- **Steps:** real user actions from the flow's happy path. `screenshot` after each screen change, named with the blueprint screen id. First step must be `goto`.
- **Selectors:** prefer what the user sees: `role=button[name="…"]`, `label=…`, `text=…`, then `[data-testid]`. Never brittle CSS paths.
- **States from the state matrix:** for each screen's data source, find the request (grep `fetch(`, `axios`, `useQuery`, route handlers, server actions) and add a state per matrix column: empty → `empty` (with a realistic empty `body` shape: `[]`, `{"items":[],"total":0}`), error → `error`, loading → `slow` (captured while the request is still held, so no extra wait is needed), no-permission → `forbidden`, partial → `empty` with a partial `body`.
- **Put states on short flows, or give them a direct entry.** By default a state replays its flow only up to the flow's first screenshot; each replayed action is capped at 2 s and the first failure ends the replay, so the screen is captured as it is (a `notes` entry, not an error). Prefer a direct entry when the app has one: state `"goto": "/list?state=empty"`, state `"steps": [...]`, or flow `"stateSteps"` shared by its states. Seed app state before load with `"init"` (JS) or `"localStorage": {...}`; a state forced only by `goto`, `init` or `localStorage` needs no `route`/`mock`. Add `"waitFor": "<sel>"` on a state to wait for its own UI; `"until": "<shot>"` or `"end"` replays further.
- A state that cannot be forced by interception, URL or init hook (websockets, server-only data) is listed in the report as **unverified**, not skipped silently.
- Prefer readiness over sleeps: `waitFor` a selector, not a number of ms; set flow `"ready": "<sel>"` (or `config.ready`) when the app has a "hydrated" marker.
- Test data: realistic content from the brief. No "Acme", no lorem.

## 4. Layer 2 — flow walk

```
node SR/scripts/check-flows.mjs --root . --url <devURL> --flows .design/flows.json --run r0
```
Matrix: every `config.viewports` entry × the theme's schemes (default light and dark), plus one reduced-motion pass; state variants run every viewport in the theme's default scheme. Runs use parallel browser contexts (`--concurrency`, default min(4, cpus)); each action times out after 5 s (`--timeout`), each navigation after 15 s (`--nav-timeout`). Each screenshot step runs `probe.js` (+ axe if `@axe-core/playwright` is installed) and records console errors.
- Exit 2 `playwright-missing` / `browser-missing` → §7a. Exit 3 `url-unreachable` → §2. Exit 1 → fix `flows.json` (message says where).
- `errors[]` (a step timed out) usually means a wrong selector or a real bug. Look at the last screenshot before deciding which.
- Console errors are findings for dimension 8 (states and feedback).
- Quick mode for small changes: `--pages /route1,/route2`.
- **Theme:** if the app does not follow `prefers-color-scheme` (dark by default, or themed by a `data-theme` attribute, a class or a localStorage key), set `config.theme` first, or the "light" pass may really be dark. Examples: `{"schemes":["dark","light"],"default":"dark","storage":"app-theme"}`, `{"attribute":"data-theme"}`, `{"class":"dark"}`. Other fields: `lightClass`, `target` (`html`|`body`), `query` (URL param), `values` (`{"light":…,"dark":…}`), `media:false`, `schemes:["dark"]` (dark-only app).
- **Re-runs between rounds:** `--changed` (or `--changed r0`) re-runs only variants whose flow changed, that are new, or that had errors or high/medium findings; the rest are carried from that report and marked `carried`. `--only <flow|flow.state|screen>` narrows further. **The final gate run (G-checks) is always a full run without these flags.**
- Results can carry `notes` (a forced state left its replayed path). Read them before judging that state's screenshot.

## 5. Layer 3 — independent review

Spawn the `ui-reviewer` subagent (`agents/ui-reviewer.md`; may be listed as `finally-good-ui:ui-reviewer`). Give it **paths, not your opinions**:
- screenshots: per screen, `375-light` and `1440-dark` of the base flow + every forced-state shot at 375. At most ~12 images per call; split by flow if more (see **Merging** below).
- `.design/reports/<run>.json` (it reads findings, `animations`, `metrics`), the static-check JSON.
- `brief.md`, `blueprint.md`, `decisions.md`, `rubric/rubric.md`, `rubric/ai-default-fingerprints.md`, and the canon files for cards it cites.
- the **caps** for dimensions 6, 7, 9 that you computed from measured data (rubric).
- the chosen direction spec (`.design/directions/<x>.spec.md`) and its prototype file, if directions ran, so it can judge **direction fidelity**: does the build still read as that direction, or did it regress to the mean? (dimension 10)
- `canon/craft.md` (dimension 10 craft checks).
Do not tell it what you changed or what you think is wrong. It scores dimensions 4–10 only.

**Merging** reviewer outputs into one score per dimension:
- **Across batches** (different flows/screens): take the per-dimension **minimum** of the non-`null` scores. Pass means every screen is ≥ 4, and an average would hide one broken flow. Record each batch's scores under `regions` so the low one is traceable. `null` = not seen in that batch, never 0.
- **Repeated calls on the same images** (a re-ask to check variance): take the per-dimension **median**, so one noisy call decides nothing. With two calls, use the lower one.
- Merge findings by element; keep the highest severity and list every context.

## 6. Score, fix, compare (max 2 rounds)

1. **Scorecard.** Score 1–3 from measured data per the rubric; take 4–10 from the reviewer (apply caps). Pass = gate passes and all ≥ 4.
2. **History.** Append the round to `.design/reports/history.json`:
   ```json
   {"rounds":[{"round":0,"run":"r0","date":"2026-09-26","gate":false,
     "scores":{"1":3,"2":4,"3":5,"4":4,"5":4,"6":4,"7":3,"8":3,"9":4,"10":4},
     "regions":{"home/hero":{"4":5,"10":4},"invoices.empty/list":{"8":2}},
     "findings":["r0-01","r0-02"],"fixed":[],"changed":["src/app/page.tsx"],"verdict":"baseline"}]}
   ```
   `regions` = `<flow[.state]>/<screen or region>` → dimension scores from findings/reviewer.
3. **If pass → report (§8).** Else pick the **top 3–5 findings** (rubric ranking: gate → lowest dimension → severity → contexts). Fix each with the smallest diff; cite the finding id in your note. No redesigns inside the fix loop.
4. **Re-run** Layer 2 with `--run r1` (same flows; use `--changed r0` for intermediate rounds, the last round runs in full) and Layer 3 on the same screens.
5. **Pairwise compare** each changed screen, previous vs current, same context: call `ui-reviewer` in pairwise mode **twice with the image order swapped** (fresh call each time; label images X/Y, never "before/after").
   - Same winner in both orders → accept that verdict. Disagreement → tie (the judge is unsure).
   - Judged preferences are only trusted when the gap is described as large; small-gap wins are ties.
6. **Revert rule.** Judged scores move ±1 between calls on identical pixels, so a judged drop alone is not proof. The round is **worse** if any of:
   - **Measured:** a new high finding, the gate newly fails, or a measured dimension (1–3) drops.
   - **Judged, confirmed:** a dimension or region that was ≥ 4 in any earlier round (history) drops below 4 **and** either it fell by ≥ 2 points, or the pairwise compare (step 5, with that dimension added to the targeted ones) picks the previous version for it in both orders. An unconfirmed 1-point drop is reviewer variance: log it as `"noise"` in history, do not revert.
   - **Pairwise:** the previous version wins overall in both orders with a `large` gap.
   Measured evidence outranks pairwise. If worse: revert that round's diffs for the affected screen (keep unrelated improvements), record `"verdict":"reverted"` and why.
7. **Stop** after round 2, or earlier on pass. Gains plateau after about two cycles, and more rounds tend to degrade code. Remaining issues go to the report.

## 7. Fallbacks — always tell the user which one applied

**a) Playwright missing.** Ask first: "Verification needs Playwright (dev dependency, ~10 MB + ~150 MB browser download). Install with `<pm> add -D playwright @axe-core/playwright && npx playwright install chromium`?" Do not install without a yes. If they decline, or while waiting, use any available browser tool (Claude Browser pane, Playwright MCP, Chrome extension):
- For each screen × viewport (resize) × scheme (the tool's colour-scheme emulation, or toggle the app's theme class): navigate, then run via the JS-exec tool the full text of `SR/scripts/browser/probe.js` followed by `window.__fguProbe({touch: <width < 768>, focus: true})`. Take a screenshot.
- Late injection misses animations that already finished: reload after injecting if the tool supports init scripts, or trigger the transition again (open the dialog, navigate) before probing.
- States: force only what the tool can (Playwright MCP code execution can use `page.route`). List the rest as unverified.
- Save results in the `check-flows` report shape to `.design/reports/<run>.json`, then continue at §5.

**b) No browser, or nothing can serve the app (§2.4).** Run Layer 1, then a **static review**: `ui-reviewer` in static mode reads the components, tokens and styles and scores what code can show (3, 6, 7, 9 partially); dimensions needing pixels are `n/a`. Tell the user plainly, in the chat, not only in the report: *"I could not render the app (<reason>), so layout, hierarchy, states and motion were not verified in a browser."* Mark the report `mode: static`.

## 7c. Delivery gate (before any "done")

Scores say how good it is; the gate says whether it can be handed over. Write one line per item into the report as `PASS|FAIL|N/A — evidence` (a file:line, a screenshot path, a count). Evidence is required for PASS. Any FAIL blocks calling the work done: fix it, or report it to the user as an open blocker in the first line of your summary.

| # | Item | Evidence |
|---|---|---|
| G1 | Rubric gate (dimension 1) passes | scorecard |
| G2 | Zero `dead-control`, `placeholder-code`, `placeholder-content` findings | check-static JSON |
| G3 | Every `unsourced-claim` is removed or sourced in `decisions.md` | quote the entry |
| G4 | Click ledger: every interactive element on the key screen clicked once; each did what its label says | list `element → result` |
| G5 | Every `low` static finding fixed or justified in `decisions.md` | counts before/after |
| G6 | No unjustified fingerprint; no material cluster (fingerprints rule 5); not the sterile default (rule 6) | reviewer JSON |
| G7 | Each screen has one focal point and at least one deliberate accent moment | screenshot paths |
| G8 | The identity motif appears in ≥ 3 places | decisions.md + shots |
| G9 | Direction fidelity ≥ 4 (if directions ran) | reviewer JSON |
| G10 | Light, dark and 375 px all render without overflow or broken surfaces | flow-walk run |

## 8. Report

Fill `SR/templates/report.md` → `.design/reports/<yyyy-mm-dd>.md` (add `-2`, `-3` if it exists). Include: mode, scorecard with the round-by-round history, gate result, top remaining findings with card ids and screenshot paths, reverted changes, unverified states/contexts, console errors. Lead the chat summary with what the user must decide or fix.
