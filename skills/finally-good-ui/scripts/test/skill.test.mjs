import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";

const card = (id, extra = {}) => {
  const f = {
    id, domain: id.split(".")[0], principle: `"Principle of ${id}."`, why: '"Because."',
    sources: '["WCAG 2.2, 2.3.3"]', "applies-when": '"Always."', "not-when": "null", decides: "[motion.level]",
    tensions: "[]", "asked-by": "[]", ...extra,
  };
  const lines = Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`);
  return `### ${id}\n\n\`\`\`yaml\n${lines.join("\n")}\nchecks:\n  measured: null\n  judged: "Is it ok?"\n\`\`\`\n`;
};

const question = (id, { area, first = '"Yes (recommended when unsure)"', cards, depth = "[full, brand]" }) =>
  `### ${id}\n\`\`\`yaml\narea: ${area}\nquestion: "Q for ${id}?"\noptions:\n  - ${first}\n  - "No"\n` +
  `why: "Matters."\ncards: ${cards}\nskip-if: "known"\ndepth: ${depth}\n\`\`\`\n`;

function miniSkill() {
  const d = tmp();
  mkdirSync(join(d, "canon"));
  mkdirSync(join(d, "interview"));
  writeFileSync(join(d, "SKILL.md"), "line\n".repeat(600));
  writeFileSync(join(d, "canon", "motion.md"), "# Motion\n\nIntro.\n\n" +
    card("motion.reduced-motion", { tensions: "[motion.tension-delight-speed]" }) + "\n" +
    card("motion.tension-delight-speed", { principle: '"Delight versus speed."', tensions: "[motion.reduced-motion]" }) + "\n" +
    card("motion.bad", { why: undefined, tensions: "[motion.nope]" }));
  writeFileSync(join(d, "interview", "question-bank.md"), "# Bank\n\n## context\n\n" +
    question("interview.context.frequency", { area: "context", cards: "[motion.reduced-motion, motion.tension-delight-speed]" }) + "\n" +
    question("interview.context.bad", { area: "jobs", first: '"No rec"', cards: "[color.missing]", depth: "[full, weird]" }));
  return d;
}

test("lint-skill reports schema, length and reference errors", () => {
  const d = miniSkill();
  const r = run("lint-skill.mjs", ["--root", d]);
  assert.equal(r.code, 0, r.stderr);
  const o = r.json;
  assert.equal(o.tool, "lint-skill");
  assert.equal(o.ok, false);
  const msgs = o.errors.map((e) => `${e.file}: ${e.message}`).join("\n");
  assert.match(msgs, /SKILL\.md.*600 lines/);
  assert.match(msgs, /motion\.bad.*missing.*why/);
  assert.match(msgs, /motion\.bad.*motion\.nope/);
  assert.match(msgs, /interview\.context\.bad.*area/);
  assert.match(msgs, /interview\.context\.bad.*recommended/);
  assert.match(msgs, /interview\.context\.bad.*color\.missing/);
  assert.match(msgs, /interview\.context\.bad.*depth.*weird/);
  assert.match(msgs, /hardcoded-color.*color\.role-scale/);
  assert.doesNotMatch(msgs, /motion\.reduced-motion.*missing/);
  assert.equal(o.stats.cards, 3);
  assert.equal(o.stats.questions, 2);
});

test("lint-skill --strict exits 1 on errors", () => {
  assert.equal(run("lint-skill.mjs", ["--root", miniSkill(), "--strict"]).code, 1);
});

test("lint-skill --write regenerates INDEX.md and backfills asked-by idempotently", () => {
  const d = miniSkill();
  const r = run("lint-skill.mjs", ["--root", d, "--write"]);
  assert.equal(r.code, 0, r.stderr);
  const idx = readFileSync(join(d, "canon", "INDEX.md"), "utf8");
  assert.match(idx, /## motion/);
  assert.match(idx, /- motion\.reduced-motion — Principle of motion\.reduced-motion\./);
  assert.match(idx, /## Tensions/);
  assert.match(idx, /\| motion\.tension-delight-speed \| Delight versus speed\. \|/);
  const m = readFileSync(join(d, "canon", "motion.md"), "utf8");
  assert.match(m, /id: motion\.reduced-motion[\s\S]*?asked-by: \[interview\.context\.frequency\]/);
  assert.match(m, /id: motion\.tension-delight-speed[\s\S]*?asked-by: \[interview\.context\.frequency\]/);
  assert.match(m, /id: motion\.bad[\s\S]*?asked-by: \[\]/);
  assert.ok(r.json.written.length >= 2);
  const again = run("lint-skill.mjs", ["--root", d, "--write"]);
  assert.deepEqual(again.json.written, []);
  assert.equal(readFileSync(join(d, "canon", "motion.md"), "utf8"), m);
});

// ---------- export-rules ----------
function exportSkill() {
  const d = tmp();
  for (const s of ["canon", "interview", "tokens", "rubric"]) mkdirSync(join(d, s));
  writeFileSync(join(d, "canon", "INDEX.md"),
    "# Canon index\n\n## motion\n- motion.reduced-motion — Keep opacity, drop movement.\n\n## Tensions\n| Tension | Trade-off | Related |\n|---|---|---|\n| motion.tension-delight-speed | Delight vs speed | |\n");
  writeFileSync(join(d, "interview", "question-bank.md"), "# Bank\n\n" +
    question("interview.context.frequency", { area: "context", cards: "[motion.reduced-motion]" }));
  copyFileSync(join(SR, "tokens", "default.tokens.json"), join(d, "tokens", "default.tokens.json"));
  writeFileSync(join(d, "rubric", "rubric.md"), "# Rubric\n\n## 1. Accessibility (gate)\nx\n## 2. Layout integrity\ny\n");
  return d;
}

test("export-rules writes the 4 targets per §8", () => {
  const skill = exportSkill();
  const out = tmp();
  writeFileSync(join(out, "AGENTS.md"), "# Project\n\nKeep me.\n");
  const r = run("export-rules.mjs", ["--out", out, "--skill", skill]);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.written.length, 4);
  const mdc = readFileSync(join(out, ".cursor", "rules", "finally-good-ui.mdc"), "utf8");
  assert.match(mdc, /^---\ndescription: .+\nglobs: .*\*\*\/\*\.tsx.*\*\*\/\*\.css.*\nalwaysApply: false\n---\n/);
  for (const e of ["jsx", "vue", "svelte", "html"]) assert.ok(mdc.split("---")[1].includes(`*.${e}`), e);
  assert.match(mdc, /motion\.reduced-motion — Keep opacity/);
  assert.match(mdc, /Q for interview\.context\.frequency\?/);
  assert.match(mdc, /standard.*250ms/);
  assert.match(mdc, /cubic-bezier\(0\.23, 1, 0\.32, 1\)/);
  assert.match(mdc, /Layout integrity/);
  assert.match(mdc, /Claude Code only/i);
  const ws = readFileSync(join(out, ".windsurf", "rules", "finally-good-ui.md"), "utf8");
  assert.match(ws, /motion\.reduced-motion/);
  const gh = readFileSync(join(out, ".github", "instructions", "finally-good-ui.instructions.md"), "utf8");
  assert.match(gh, /^---\napplyTo: "\*\*\/\*\.\{tsx,jsx,vue,svelte,html,css\}"\n---\n/);
  const ag = readFileSync(join(out, "AGENTS.md"), "utf8");
  assert.match(ag, /Keep me\./);
  assert.match(ag, /## finally-good-ui/);
  run("export-rules.mjs", ["--out", out, "--skill", skill]);
  const ag2 = readFileSync(join(out, "AGENTS.md"), "utf8");
  assert.equal(ag2.match(/## finally-good-ui/g).length, 1, "section replaced, not duplicated");
});

test("export-rules references .design files when present; missing inputs are warnings", () => {
  const skill = tmp();
  const out = tmp();
  mkdirSync(join(out, ".design"));
  const r = run("export-rules.mjs", ["--out", out, "--skill", skill]);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(r.json.warnings.length >= 3);
  const mdc = readFileSync(join(out, ".cursor", "rules", "finally-good-ui.mdc"), "utf8");
  assert.match(mdc, /\.design\/brief\.md/);
});

test("export-rules --dry-run writes nothing", () => {
  const out = tmp();
  const r = run("export-rules.mjs", ["--out", out, "--skill", exportSkill(), "--dry-run"]);
  assert.equal(r.code, 0);
  assert.equal(r.json.written.length, 0);
  assert.equal(r.json.files.length, 4);
  assert.ok(!existsSync(join(out, ".cursor")));
});
