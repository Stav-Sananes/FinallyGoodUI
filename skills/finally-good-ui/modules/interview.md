# Module: design interview

Goal: turn a vague request into `.design/brief.md` — a confirmed set of facts and decisions that every later step resolves trade-offs against. Work like a senior designer who will not start drawing until they understand the job: draft the brief from evidence, ask only what evidence cannot settle, always with a recommendation and a reason.

In an autonomous run, answer the questions yourself as SKILL.md's "Autonomous runs" says; everything else in this module still applies.

Inputs: stack profile and extracted design from `modules/detect.md`, any existing `.design/*`, the user's request, the codebase. Questions: `interview/question-bank.md`. Output: `.design/brief.md` from `templates/brief.md`.

## 1. Look before you ask

Facts are looked up; decisions are asked. Before question one:
- Read the README, landing copy, routes/pages, data models, i18n config, `package.json`, and `.design/` files.
- Pre-fill every answer you can infer. Mark each as `inferred (source)` in your working notes.
- Never ask a question whose answer is in the code. Instead, state the inference in one line inside a later question ("I see Stripe checkout, so I'm treating payment errors as high-risk") so the user can correct it.

## 2. Pick the depth

Respect `.design/config.json` → `interviewDepth` if it is not `auto`. Otherwise:

| Situation (from detect + `.design/`) | Depth | Asks |
|---|---|---|
| No app structure yet (0–1 routes), no `.design/brand.md`, no extracted tokens | `full` | all areas, ~12–20 questions after skipping |
| New app, but brand exists (`.design/brand.md`, extracted tokens, or user supplies brand) | `brand` | skip personality + `constraints.brand`; ~10–15 |
| Existing app with screens, request names a feature/page/flow | `feature` | the 7 `feature` questions, scoped to the feature; ~4–7 |
| `.design/brief.md` exists and is confirmed | none | ask only what the new request changes; otherwise reuse the brief |

The depth sets which questions are in scope. In `feature` depth, inherit context and personality from the existing brief or brand; if none exists, infer from the code and list those inferences for confirmation in the final brief.

## 3. Draft first, ask the rest in one batch

Unless `mode` is `interactive`, do not walk the bank question by question:
1. Answer every in-scope question from the code and the request (§1).
2. Take the bank's `recommended` option for the rest, marked `decided by agent` with its card ids.
3. Ask only the 2-4 questions where no option is recommended for this product, or where the brief is silent on personality. Batch them into ONE `AskUserQuestion` call (plain-text message if the tool is missing). Never ask a fact that is in the code.
4. Then go to §7: brief and blueprint digest shown together for one approval.

Each question: plain language (no "IA", "affordance", "density token"), lettered concrete options, recommendation first marked **(recommended)** with its condition tailored to this project, and a 1-2 line **why it matters** with card ids. Free text and "you decide" always allowed. Reword bank questions to fit the product; keep intent and ids.

In `interactive` mode, ask in bank order, one question per message (or per call), never the next before the answer arrives, and say the depth and rough count first.

### Tool use
- With `AskUserQuestion`: recommended option first with "(Recommended)" in its label, a one-line consequence per option, the "why" in the question text; rely on its built-in "Other" for free text. Open questions (`purpose.one-liner`, `jobs.top-tasks` from scratch) go as plain text with your draft.
- An unanswered or timed-out question means "you decide": take the recommended option, record it `decided by agent`, continue.
- Without the tool: plain text in the format of §8, under ~10 lines.

## 4. Adapt

- **Skip** when `skip-if` is met or an earlier answer implies it (e.g. experts + daily → dense is implied; confirm it in one line inside the next question instead of asking).
- **Follow up** when an answer is vague ("everyone", "both", "it depends"), when it has two verbs, or when a bank `follow-ups` entry applies. Interactive mode only; maximum 2 follow-ups per question, then take the recommendation and note the uncertainty.
- **Reorder** only when an answer makes a later area urgent (e.g. "it moves money" → ask `risks.failure` next).
- **Update the count** if skips change it materially ("Only 5 left").

## 5. Challenge contradictions

After each answer, check it against every earlier answer and the code. When two conflict, stop and name the conflict before continuing: quote both answers, state the trade-off with the tension card, offer 2–3 resolutions with a recommendation. Watch especially for:
1. **Daily use + energetic/expressive motion.** Rich entrances repeated 50× a day become friction. Resolve: calm routine screens, energy spent on a few expressive moments (first success, completion, the first view of the key figure). `[motion.frequency-budget, motion.tension-delight-speed, motion.one-signature-moment]`
2. **Beginners + dense.** Novices can't parse dense tables on day one. Resolve: airy defaults with a density toggle, or progressive disclosure of columns. `[usability.tension-guidance-expertise, data.tension-density-clarity, ia-nav.progressive-disclosure]`
3. **Phone-first + 8 top-level tasks.** Bottom tabs hold ~5. Resolve: merge tasks, demote rare ones under "More", or rethink which tasks are top-level. `[ia-nav.nav-model-by-count, ia-nav.tension-discoverability-minimalism]`

Others: "playful" + high-stakes money/health; "minimal UI" + beginners who need visible labels; "thousands of items" + "no search"; brand accent that fails contrast + AA requirement. Log every resolved contradiction in the brief's Tensions section.

## 6. "You decide"

When the user says "you decide", "whatever you think", or skips: take the recommended option (or the one the earlier answers point to), confirm in one line — "Going with calm: daily-use tool, motion stays out of the way. [personality.calm]" — and record it in the brief as `decided by agent` with the rationale and card ids. Never re-ask a delegated question. If the user delegates 3+ in a row, offer once: "Want me to fill the rest with recommendations and show you the brief to correct?"

## 7. Stop, write, confirm

Stop when every in-depth question is answered, inferred, skipped with reason, or delegated; if the user says "enough", fill the rest with recommendations marked `decided by agent`.

Then:
1. Write `.design/brief.md` from `templates/brief.md`. Every field carries its source: `user`, `inferred (file)`, or `decided by agent`. Record the question id next to each answer.
2. Draft the blueprint (`modules/blueprint.md`) from the brief without waiting.
3. Show ONE message (checkpoint 1): a compact brief summary (≤15 lines: one-liner, primary user, top tasks, device + frequency, personality in three words, tensions and how resolved, every inferred or agent-decided answer, so the user can overrule it) followed by the blueprint digest (blueprint.md §8). Ask: "Approve the brief and blueprint, or tell me what to change." Do not start directions or build until approved.
4. On corrections, update the brief, re-check contradictions, and follow the revision loop in blueprint.md §8. On approval set `status: confirmed` (brief) and `status: approved` (blueprint) with the date.

## 8. Example exchange (ideal format, plain text)

> **Q3 of ~15 · Context**
> How often will a typical user open it?
> **A. Several times a day (recommended — you described it as the team's daily tracker)**
> B. A few times a week
> C. A few times a month
> D. A few times a year
> E. Once or a handful of times ever
> *Why it matters:* daily use means every animation is paid hundreds of times, so screens stay near-instant and navigation is always visible; rare use can afford guidance and one expressive moment. [motion.frequency-budget, ia-nav.visible-destinations]
> Or say "you decide".

User: *A, and they keep it open all day on a second monitor.*

> Noted — always-open, so I'll treat status freshness as critical.
> **Q4 of ~13 · Personality** *(skipped "environment" and "session length": always-open at a desk answers both; jobs and content were confirmed from your routes)*
> Should it feel calm or energetic?
> **A. Calm — quiet, steady, gets out of the way (recommended — it's on screen all day)**
> B. Balanced — calm by default, a little lift on key moments
> C. Energetic — lively, punchy, motivating
> *Why it matters:* this sets contrast, how much colour you see, and how things move. Calm = soft contrast, one accent, gentle easing — right for something that sits in peripheral vision all day. [personality.calm, color.accent-restraint]

User: *Energetic! I want the team hyped.*

> That pulls against the always-open, daily use: constant lively motion becomes noise within a week. [motion.tension-delight-speed]
> **A. Calm everyday screens, energy saved for wins — a real celebration when a task is completed (recommended)** [motion.one-signature-moment]
> B. Energetic throughout, with motion kept short (≤150ms)
> C. Energetic colour and type, calm motion
> Which way?
