import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYaml } from "../lib/yaml.mjs";
import { parseMdBlocks } from "../lib/md.mjs";

test("scalars, quotes, null, comments", () => {
  const y = parseYaml(`id: motion.x   # comment
principle: "Say \\"hi\\": now # not a comment"
single: 'it''s'
not-when: null
n: 3
flag: true`);
  assert.equal(y.id, "motion.x");
  assert.equal(y.principle, 'Say "hi": now # not a comment');
  assert.equal(y.single, "it's");
  assert.equal(y["not-when"], null);
  assert.equal(y.n, 3);
  assert.equal(y.flag, true);
});

test("inline and block lists", () => {
  const y = parseYaml(`sources: ["Krug, ch.6", "Nielsen #6", plain]
empty: []
options:
  - "A (recommended when x)"
  - B plain
decides: [a.b, c.d]`);
  assert.deepEqual(y.sources, ["Krug, ch.6", "Nielsen #6", "plain"]);
  assert.deepEqual(y.empty, []);
  assert.deepEqual(y.options, ["A (recommended when x)", "B plain"]);
  assert.deepEqual(y.decides, ["a.b", "c.d"]);
});

test("nested map one level and block scalars", () => {
  const y = parseYaml(`checks:
  measured: "probe: x"
  judged: null
text: |
  line one
  line two
folded: >
  a
  b
after: ok`);
  assert.deepEqual(y.checks, { measured: "probe: x", judged: null });
  assert.equal(y.text, "line one\nline two");
  assert.equal(y.folded, "a b");
  assert.equal(y.after, "ok");
});

test("parseMdBlocks finds ### headings with yaml fences and line numbers", () => {
  const md = "# T\n\n### a.one\n\n```yaml\nid: a.one\n```\n\n### a.two\n```yaml\nid: a.two\nx: [1]\n```\n";
  const blocks = parseMdBlocks(md);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].heading, "a.one");
  assert.equal(blocks[0].line, 3);
  assert.equal(blocks[1].data.id, "a.two");
  assert.equal(blocks[1].yamlStart, 11);
});
