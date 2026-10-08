#!/usr/bin/env node
// Structure lint for the skill: SKILL.md length, canon card schema (§5.2), question schema (§5.3),
// id references. With --write: regenerate canon/INDEX.md and backfill each card's asked-by.
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, writeFileSync } from "node:fs";
import { runCli, isMain } from "./lib/cli.mjs";
import { readText, isFile, isDir } from "./lib/fs.mjs";
import { parseMdBlocks } from "./lib/md.mjs";
import { RULE_CARDS } from "./lib/rules.mjs";

const HELP = `
Usage: lint-skill.mjs [--root <skill dir>] [--write] [--strict]

Validates the finally-good-ui skill folder:
  - SKILL.md exists and is under 500 lines
  - every canon card (canon/<domain>.md, "### <id>" + yaml) has the §5.2 fields
  - every interview question (interview/question-bank.md) follows §5.3
  - every referenced id resolves: card tensions/asked-by, question cards, static-rule cards
Prints {"tool":"lint-skill","ok","errors":[{file,line,message}],"warnings","stats","written"}.

Options:
  --root <dir>  skill root (default: cwd if it has SKILL.md or canon/, else this script's skill)
  --write       regenerate canon/INDEX.md and backfill asked-by in every card from the question bank
  --strict      exit 1 when there are errors (for CI)
  --help
`;

export const DOMAINS = ["usability", "ia-nav", "flows-forms", "states", "layout", "typography", "color", "motion", "data", "a11y", "writing", "personality", "craft"];
const AREAS = ["purpose", "context", "jobs", "content", "personality", "constraints", "risks"];
const DEPTHS = new Set(["full", "brand", "feature"]);
const CARD_FIELDS = ["id", "domain", "principle", "why", "sources", "applies-when", "not-when", "decides", "tensions", "asked-by", "checks"];
const LIST_FIELDS = ["sources", "decides", "tensions", "asked-by"];

function defaultRoot() {
  const cwd = process.cwd();
  if (isFile(join(cwd, "SKILL.md")) || isDir(join(cwd, "canon"))) return cwd;
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

function loadCards(root, errors, warnings) {
  const cards = [];
  const dir = join(root, "canon");
  const present = isDir(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "INDEX.md") : [];
  for (const d of DOMAINS) if (!present.includes(`${d}.md`)) warnings.push({ file: `canon/${d}.md`, line: null, message: `missing canon domain file ${d}.md` });
  for (const f of present) {
    const domain = f.replace(/\.md$/, "");
    const rel = `canon/${f}`;
    if (!DOMAINS.includes(domain)) warnings.push({ file: rel, line: null, message: `unknown domain file ${f}` });
    const text = readText(join(dir, f));
    for (const b of parseMdBlocks(text)) {
      if (!b.data) { errors.push({ file: rel, line: b.line, message: `${b.heading}: heading without a yaml block${b.error ? ` (${b.error})` : ""}` }); continue; }
      cards.push({ ...b, file: rel, domainFile: domain, text });
    }
  }
  return cards;
}

function validateCard(c, errors) {
  const e = (message) => errors.push({ file: c.file, line: c.line, message: `${c.heading}: ${message}` });
  const d = c.data;
  for (const k of CARD_FIELDS) if (!(k in d)) e(`missing field '${k}'`);
  if (d.id && d.id !== c.heading) e(`id '${d.id}' does not match heading`);
  if (!/^[a-z0-9-]+\.[a-z0-9-]+$/.test(c.heading)) e("id must be <domain>.<slug>");
  if (c.heading.split(".")[0] !== c.domainFile) e(`id prefix does not match file domain '${c.domainFile}'`);
  if ("domain" in d && d.domain !== c.domainFile) e(`domain '${d.domain}' does not match file '${c.domainFile}'`);
  for (const k of ["principle", "why", "applies-when"]) if (k in d && (typeof d[k] !== "string" || !d[k].trim())) e(`'${k}' must be non-empty text`);
  for (const k of LIST_FIELDS) if (k in d && !Array.isArray(d[k])) e(`'${k}' must be a list`);
  if (Array.isArray(d.sources) && d.sources.length === 0) e("'sources' must not be empty");
  if ("checks" in d && (typeof d.checks !== "object" || d.checks === null || Array.isArray(d.checks) || !("measured" in d.checks) || !("judged" in d.checks)))
    e("'checks' must have 'measured' and 'judged'");
}

function loadQuestions(root, errors) {
  const rel = "interview/question-bank.md";
  const text = readText(join(root, rel));
  if (text == null) { errors.push({ file: rel, line: null, message: "question bank missing" }); return { questions: [], text: null }; }
  const questions = [];
  for (const b of parseMdBlocks(text)) {
    if (!b.heading.startsWith("interview.")) continue;
    if (!b.data) { errors.push({ file: rel, line: b.line, message: `${b.heading}: heading without a yaml block` }); continue; }
    questions.push({ ...b, file: rel });
  }
  return { questions, text };
}

function validateQuestion(q, cardIds, errors, lastAreaIdx) {
  const e = (message) => errors.push({ file: q.file, line: q.line, message: `${q.heading}: ${message}` });
  const d = q.data;
  const m = q.heading.match(/^interview\.([a-z-]+)\.([a-z0-9-]+)$/);
  if (!m) e("id must be interview.<area>.<slug>");
  const area = m?.[1];
  if (!AREAS.includes(area)) e(`unknown area '${area}'`);
  if (d.area !== area) e(`area '${d.area}' does not match id area '${area}'`);
  for (const k of ["area", "question", "options", "why", "cards", "skip-if", "depth"]) if (!(k in d)) e(`missing field '${k}'`);
  if ("question" in d && (typeof d.question !== "string" || !d.question.trim())) e("'question' must be non-empty text");
  if (!Array.isArray(d.options) || d.options.length < 2) e("'options' must be a list of at least 2");
  else if (!/\(recommended/i.test(String(d.options[0]))) e("first option must be the recommended default, marked '(recommended when …)'");
  if (!Array.isArray(d.cards) || !d.cards.length) e("'cards' must be a non-empty list");
  else for (const id of d.cards) if (!cardIds.has(id)) e(`unknown card '${id}'`);
  if (!Array.isArray(d.depth) || !d.depth.length) e("'depth' must be a non-empty list");
  else for (const x of d.depth) if (!DEPTHS.has(x)) e(`invalid depth '${x}' (use full|brand|feature)`);
  if ("follow-ups" in d && d["follow-ups"] !== null && !Array.isArray(d["follow-ups"])) e("'follow-ups' must be a list");
  const idx = AREAS.indexOf(area);
  if (idx >= 0 && idx < lastAreaIdx) e(`area '${area}' appears after a later area (order: ${AREAS.join(" → ")})`);
  return Math.max(idx, lastAreaIdx);
}

const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const cell = (s) => oneLine(s).replace(/\|/g, "\\|");

export function buildIndex(cards) {
  const out = ["# Canon index", "", "<!-- Generated by scripts/lint-skill.mjs --write from canon/<domain>.md. Do not edit by hand. -->", ""];
  for (const d of DOMAINS) {
    const list = cards.filter((c) => c.domainFile === d);
    if (!list.length) continue;
    out.push(`## ${d}`);
    for (const c of list) out.push(`- ${c.heading} — ${oneLine(c.data.principle)}`);
    out.push("");
  }
  const tensions = cards.filter((c) => c.heading.includes(".tension-"));
  if (tensions.length) {
    out.push("## Tensions", "", "Resolve each against the brief and log the resolution in `.design/decisions.md`.", "",
      "| Tension | Trade-off | Related cards |", "|---|---|---|");
    for (const c of tensions) out.push(`| ${c.heading} | ${cell(c.data.principle)} | ${(c.data.tensions || []).join(", ")} |`);
    out.push("");
  }
  return out.join("\n");
}

/** Rewrite the asked-by line of each card yaml block; returns new text. */
function backfill(text, blocks, askedBy) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (const b of [...blocks].reverse()) {
    if (!b.yamlStart) continue;
    const want = `asked-by: [${(askedBy.get(b.heading) || []).join(", ")}]`;
    const s = b.yamlStart - 1, e = b.yamlEnd - 1; // 0-based inclusive start, exclusive end
    const i = lines.slice(s, e).findIndex((l) => /^asked-by\s*:/.test(l));
    if (i < 0) { lines.splice(e, 0, want); continue; }
    let j = s + i + 1;
    while (j < e && /^\s+-\s/.test(lines[j])) j++; // block-list form
    lines.splice(s + i, j - (s + i), want);
  }
  return lines.join("\n");
}

export function lintSkill(rootArg, { write = false } = {}) {
  const root = resolve(rootArg);
  const errors = [], warnings = [], written = [];

  let skillLines = null;
  const skill = readText(join(root, "SKILL.md"));
  if (skill == null) errors.push({ file: "SKILL.md", line: null, message: "SKILL.md missing" });
  else {
    skillLines = skill.replace(/\n$/, "").split("\n").length;
    if (skillLines >= 500) errors.push({ file: "SKILL.md", line: skillLines, message: `SKILL.md has ${skillLines} lines (must be < 500)` });
  }

  const cards = loadCards(root, errors, warnings);
  const cardIds = new Set();
  for (const c of cards) {
    if (cardIds.has(c.heading)) errors.push({ file: c.file, line: c.line, message: `${c.heading}: duplicate card id` });
    cardIds.add(c.heading);
  }
  for (const c of cards) validateCard(c, errors);

  const { questions } = loadQuestions(root, errors);
  const qIds = new Set();
  let lastArea = -1;
  for (const q of questions) {
    if (qIds.has(q.heading)) errors.push({ file: q.file, line: q.line, message: `${q.heading}: duplicate question id` });
    qIds.add(q.heading);
    lastArea = validateQuestion(q, cardIds, errors, lastArea);
  }

  for (const c of cards) {
    for (const t of Array.isArray(c.data.tensions) ? c.data.tensions : []) {
      if (!cardIds.has(t)) errors.push({ file: c.file, line: c.line, message: `${c.heading}: tension reference '${t}' does not exist` });
      if (t === c.heading) errors.push({ file: c.file, line: c.line, message: `${c.heading}: references itself in tensions` });
    }
    if (!write) for (const a of Array.isArray(c.data["asked-by"]) ? c.data["asked-by"] : [])
      if (!qIds.has(a)) errors.push({ file: c.file, line: c.line, message: `${c.heading}: asked-by '${a}' is not a question id` });
  }
  for (const [rule, card] of Object.entries(RULE_CARDS))
    if (!cardIds.has(card)) errors.push({ file: "scripts/lib/rules.mjs", line: null, message: `static rule ${rule} maps to missing card ${card}` });
  for (const d of DOMAINS) {
    const n = cards.filter((c) => c.domainFile === d).length;
    if (n > 0 && n < 4) warnings.push({ file: `canon/${d}.md`, line: null, message: `${d} has ${n} cards (v0.1 target: at least 4)` });
  }

  if (write) {
    const askedBy = new Map();
    for (const q of questions) for (const id of Array.isArray(q.data.cards) ? q.data.cards : []) {
      if (!askedBy.has(id)) askedBy.set(id, []);
      if (!askedBy.get(id).includes(q.heading)) askedBy.get(id).push(q.heading);
    }
    const byFile = new Map();
    for (const c of cards) { if (!byFile.has(c.file)) byFile.set(c.file, []); byFile.get(c.file).push(c); }
    for (const [file, list] of byFile) {
      const before = list[0].text;
      const after = backfill(before, list, askedBy);
      if (after !== before.replace(/\r\n?/g, "\n")) { writeFileSync(join(root, file), after); written.push(file); }
    }
    const idx = buildIndex(cards);
    const prev = readText(join(root, "canon", "INDEX.md"));
    if (isDir(join(root, "canon")) && prev?.replace(/\r\n?/g, "\n") !== idx) { writeFileSync(join(root, "canon", "INDEX.md"), idx); written.push("canon/INDEX.md"); }
  }

  return {
    tool: "lint-skill", root: rootArg, ok: errors.length === 0, errors, warnings,
    stats: { skillLines, cards: cards.length, questions: questions.length, tensions: cards.filter((c) => c.heading.includes(".tension-")).length },
    written,
  };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root"], boolean: ["write", "strict"] },
    main: ({ flags }) => {
      const out = lintSkill(flags.root || defaultRoot(), { write: !!flags.write });
      if (flags.strict && !out.ok) process.exitCode = 1;
      return out;
    },
  });
}
