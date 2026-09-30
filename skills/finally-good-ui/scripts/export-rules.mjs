#!/usr/bin/env node
// Export the canon index, interview checklist, motion tokens and rubric as rules for
// Cursor, Windsurf, GitHub Copilot and AGENTS.md (spec §8).
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { runCli, isMain } from "./lib/cli.mjs";
import { readText, readJson, isDir } from "./lib/fs.mjs";
import { parseMdBlocks } from "./lib/md.mjs";
import { groupTokens, cssValue } from "./lib/tokens.mjs";

const HELP = `
Usage: export-rules.mjs [--out <dir>] [--root <dir>] [--skill <dir>] [--dry-run]

Writes, under --out (default: --root, default cwd):
  .cursor/rules/finally-good-ui.mdc                     (description, globs, alwaysApply: false)
  .windsurf/rules/finally-good-ui.md                    (trigger: glob)
  .github/instructions/finally-good-ui.instructions.md  (applyTo)
  AGENTS.md                                             ("## finally-good-ui" section, replaced in place)
Built from canon/INDEX.md, interview/question-bank.md, tokens/default.tokens.json (motion) and
rubric/rubric.md. Missing inputs produce warnings, not errors. If <out>/.design exists the rules
point at the project's brief, brand and tokens.

Options:
  --out <dir>    target project directory
  --root <dir>   project root (default: cwd); used when --out is omitted
  --skill <dir>  skill root to read from (default: this script's skill)
  --dry-run      print what would be written; write nothing
  --help
`;

const GLOBS = ["tsx", "jsx", "vue", "svelte", "html", "css"];
const START = "<!-- finally-good-ui:start -->";
const END = "<!-- finally-good-ui:end -->";
const DIMENSIONS = ["Accessibility (hard gate)", "Layout integrity", "Design-system adherence", "Visual hierarchy",
  "Spacing and grouping", "Typography", "Colour and theming", "States and feedback", "Motion quality", "Craft and brand fit"];

/** First sentence, clipped to max chars (0 = drop the text entirely). */
function brief(text, max) {
  if (max === 0) return "";
  const first = text.split(/(?<=[.!?])\s+(?=[A-Z])/)[0].trim();
  return first.length > max ? first.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : first;
}

// compaction levels: first sentence clipped to N chars; 0 = ids only
const CANON_MAX = [200, 110, 80, 60, 0];
const WINDSURF_MAX = 12000;

function canonSection(skill, warnings, level = 0) {
  const t = readText(join(skill, "canon", "INDEX.md"));
  if (t == null) { warnings.push("canon/INDEX.md missing: canon section omitted (run lint-skill.mjs --write)"); return ""; }
  const max = CANON_MAX[level];
  const body = t.replace(/\r\n?/g, "\n").replace(/^# .*\n/, "").replace(/<!--[\s\S]*?-->\n?/g, "").trim()
    .replace(/^## /gm, "### ")
    .replace(/^- (\S+) — (.+)$/gm, (_, id, p) => (max ? `- ${id} — ${brief(p, max)}` : `- ${id}`))
    .replace(/^\| ([a-z0-9-]+\.tension-[a-z0-9-]+) \| (.+?) \| (.*) \|$/gm, (_, id, p, rel) =>
      `| ${id} | ${max ? brief(p.replace(/\\\|/g, "|"), max).replace(/\|/g, "\\|") : "see card"} | ${rel} |`);
  return `## Canon (principles to reason from; cite ids in decisions; full cards: canon/<domain>.md in the skill)\n\n${body}\n`;
}

function interviewSection(skill, warnings) {
  const t = readText(join(skill, "interview", "question-bank.md"));
  if (t == null) { warnings.push("interview/question-bank.md missing: interview section omitted"); return ""; }
  const qs = parseMdBlocks(t).filter((b) => b.heading.startsWith("interview.") && b.data?.question);
  if (!qs.length) { warnings.push("question bank has no parseable questions"); return ""; }
  const lines = qs.map((q) => `- ${String(q.data.question).replace(/\s+/g, " ").trim()} (\`${q.heading.replace(/^interview\./, "")}\`)`);
  return "## Before designing: settle these (ask one at a time, recommend an answer, skip what is known)\n\n" + lines.join("\n") + "\n";
}

function motionSection(skill, warnings) {
  const t = readJson(join(skill, "tokens", "default.tokens.json"));
  if (!t) { warnings.push("tokens/default.tokens.json missing: motion token section omitted"); return ""; }
  const d = [...groupTokens(t.duration)].map(([n, v]) => `${n} ${cssValue("duration", v.$value)}`);
  const e = [...groupTokens(t.easing)].map(([n, v]) => `- \`${n}\`: ${cssValue("easing", v.$value)}${v.$description ? ` (${v.$description})` : ""}`);
  return "## Motion tokens\n\n" +
    (d.length ? `Durations: ${d.join(" · ")}. Exits run at 60–75% of the enter. Routine UI ≤ 300ms; nothing over 500ms except backdrops.\n\n` : "") +
    (e.length ? `Easing roles:\n${e.join("\n")}\n\n` : "") +
    "Animate only transform and opacity. Reduced motion: keep opacity/colour, drop movement. One signature motion moment per app.\n";
}

function rubricSection(skill, warnings) {
  const t = readText(join(skill, "rubric", "rubric.md"));
  let dims = [];
  if (t == null) warnings.push("rubric/rubric.md missing: using the built-in dimension list");
  else {
    dims = [...t.matchAll(/^#{2,3}\s+(\d+)\s*[·.):-]?\s*(.+)$/gm)].map((m) => `${m[1]}. ${m[2].trim()}`);
    if (dims.length < 3) warnings.push("could not read rubric dimensions: using the built-in list");
  }
  if (dims.length < 3) dims = DIMENSIONS.map((x, i) => `${i + 1}. ${x}`);
  return "## Quality bar (score each 1–5; pass = accessibility gate passes and every dimension ≥ 4)\n\n" + dims.join("\n") + "\n";
}

function buildBody(skill, out, warnings, level = 0) {
  const project = isDir(join(out, ".design"));
  const parts = [
    "# finally-good-ui: design reasoning rules",
    "Design and build complete apps the way a senior product designer would: reason from the principles below, resolve tensions against the brief, and record every major decision with its reason and card id.",
    [
      "## Process",
      "1. Understand the stack and any existing design system before proposing anything.",
      "2. Settle the brief (questions below).",
      "3. Blueprint: IA, navigation, flows, screen inventory, and a state matrix (empty/loading/error/partial/full/no-permission) per screen.",
      "4. Lock tokens (colour roles, type scale, 4-based spacing, radius, shadow, motion); components use only tokens.",
      "5. Build shell, then shared components, then screens, then every state, then transitions.",
      "6. Verify at 375 and 1440px, light and dark, and with reduced motion.",
    ].join("\n"),
    project
      ? "This project has `.design/`: follow `.design/brief.md`, `.design/brand.md`, `.design/blueprint.md`, `.design/tokens.json` and `.design/decisions.md`. They override the general canon."
      : null,
    canonSection(skill, warnings, level),
    interviewSection(skill, warnings),
    motionSection(skill, warnings),
    rubricSection(skill, warnings),
    "## Tool support\n\nHooks, subagents (parallel direction builders, the independent ui-reviewer) and automatic browser verification are Claude Code only. Elsewhere, run the static checker by hand: `node <skill>/scripts/check-static.mjs --root .`",
  ];
  return parts.filter(Boolean).map((p) => p.trim()).join("\n\n") + "\n";
}

function mergeAgents(existing, body) {
  const section = `${START}\n## finally-good-ui\n\n${body.replace(/^# .*\n+/, "").replace(/^## /gm, "### ").replace(/^#### /gm, "#### ")}\n${END}\n`;
  if (!existing) return section;
  const s = existing.indexOf(START), e = existing.indexOf(END);
  if (s >= 0 && e > s) return existing.slice(0, s) + section + existing.slice(e + END.length).replace(/^\n/, "");
  return existing.replace(/\s*$/, "\n\n") + section;
}

export function exportRules({ out, skill, dryRun = false }) {
  const warnings = [];
  const body = buildBody(skill, out, warnings);
  const globs = GLOBS.map((g) => `**/*.${g}`);
  const desc = "finally-good-ui design canon, brief checklist, motion tokens and quality rubric for building UI";
  // Windsurf truncates rule files over 12000 chars: compact the canon until it fits.
  const windsurf = (b) => `---\ntrigger: glob\nglobs: ${globs.join(",")}\ndescription: ${desc}\n---\n\n${b}`;
  let wsContent = windsurf(body);
  for (let level = 1; wsContent.length > WINDSURF_MAX && level < CANON_MAX.length; level++)
    wsContent = windsurf(buildBody(skill, out, [], level));
  if (wsContent.length > WINDSURF_MAX) warnings.push(`windsurf rule is ${wsContent.length} chars; Windsurf truncates rule files over ${WINDSURF_MAX}`);
  const files = [
    { path: ".cursor/rules/finally-good-ui.mdc",
      content: `---\ndescription: ${desc}\nglobs: ${globs.join(",")}\nalwaysApply: false\n---\n\n${body}` },
    { path: ".windsurf/rules/finally-good-ui.md", content: wsContent },
    { path: ".github/instructions/finally-good-ui.instructions.md",
      content: `---\napplyTo: "**/*.{${GLOBS.join(",")}}"\n---\n\n${body}` },
    { path: "AGENTS.md", content: mergeAgents(readText(join(out, "AGENTS.md")), body) },
  ];
  const written = [];
  if (!dryRun) {
    for (const f of files) {
      const target = join(out, f.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, f.content);
      written.push(f.path);
    }
  }
  return { tool: "export-rules", out, written, files: files.map((f) => ({ path: f.path, bytes: Buffer.byteLength(f.content), ...(dryRun ? { content: f.content } : {}) })), warnings };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root", "out", "skill"], boolean: ["dry-run"] },
    main: ({ flags }) => {
      const out = resolve(flags.out || flags.root || ".");
      const skill = resolve(flags.skill || join(dirname(fileURLToPath(import.meta.url)), ".."));
      return exportRules({ out, skill, dryRun: !!flags["dry-run"] });
    },
  });
}
