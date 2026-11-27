import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, tmp } from "./_h.mjs";

// Static twins of the genericness probe: same-card-everywhere and row-menu-button.
function project(files) {
  const dir = tmp();
  for (const [name, text] of Object.entries(files)) { mkdirSync(join(dir, name, ".."), { recursive: true }); writeFileSync(join(dir, name), text); }
  const r = run("check-static.mjs", ["--root", dir]);
  assert.equal(r.code, 0, r.stderr);
  return r.json.findings.filter((f) => f.rule === "same-card-everywhere" || f.rule === "row-menu-button");
}
const cardRule = (name, radius = "12px") => `.${name} { border: 1px solid var(--color-border); border-radius: ${radius}; padding: 16px; }\n`;

test("same-card-everywhere: bordered rounded surfaces sharing one radius, low at 3, medium at 5, none below", () => {
  const css = (n) => Array.from({ length: n }, (_, i) => cardRule("c" + i)).join("");
  assert.deepEqual(project({ "src/a.css": css(2) }), [], "two cards are a pattern, not a template");
  const three = project({ "src/a.css": css(3) });
  assert.deepEqual(three.map((f) => [f.rule, f.severity, f.card]), [["same-card-everywhere", "low", "craft.composition-rhythm"]]);
  assert.match(three[0].message, /3 /);
  assert.equal(project({ "src/a.css": css(5) })[0].severity, "medium");
});

test("same-card-everywhere: different radii or square corners are not the same card; Tailwind class strings count too", () => {
  const varied = [cardRule("a", "2px"), cardRule("b", "6px"), cardRule("c", "12px"), cardRule("d", "0"), cardRule("e", "4px")].join("");
  assert.deepEqual(project({ "src/a.css": varied }), []);
  const noBorder = Array.from({ length: 6 }, (_, i) => `.n${i} { border-radius: 12px; background: #fff; }`).join("\n");
  assert.deepEqual(project({ "src/a.css": noBorder }), [], "a rounded box without an edge is not a bordered card");
  const tw = Array.from({ length: 5 }, (_, i) => `<div class="rounded-xl border p-4">card ${i}</div>`).join("\n");
  assert.equal(project({ "src/A.html": `<main>${tw}</main>` })[0].severity, "medium");
});

test("row-menu-button: a repeated row ending in a more button; a loop is many rows", () => {
  const vue = `<ul><li v-for="d in dishes" :key="d.id"><span>{{ d.name }}</span><button aria-label="More options" aria-haspopup="menu">...</button></li></ul>`;
  const loop = project({ "src/Meals.vue": `<template>${vue}</template>` });
  assert.deepEqual(loop.map((f) => [f.rule, f.severity, f.card]), [["row-menu-button", "medium", "craft.composition-rhythm"]]);
  const jsx = `export const L = () => <ul>{rows.map((r) => <li key={r.id}>{r.name}<button aria-label="Actions">⋯</button></li>)}</ul>;`;
  assert.equal(project({ "src/L.tsx": jsx })[0].severity, "medium");
  const one = project({ "src/P.html": `<ul><li>One <button aria-label="More options">...</button></li></ul>` });
  assert.deepEqual(one.map((f) => f.severity), ["low"], "a single literal trigger stays low");
});

test("row-menu-button: not flagged for a visible action, or a row menu with three or more items", () => {
  const visible = `<template><li v-for="d in dishes"><span>{{ d.name }}</span><button>Swap dish</button></li></template>`;
  assert.deepEqual(project({ "src/V.vue": visible }), []);
  const many = `<template><li v-for="d in dishes"><span>{{ d.name }}</span><button aria-label="More options" aria-haspopup="menu">...</button>` +
    `<div role="menu"><button role="menuitem">Swap</button><button role="menuitem">Skip</button><button role="menuitem">Move</button></div></li></template>`;
  assert.deepEqual(project({ "src/M.vue": many }), [], "three secondary actions earn a menu");
  const twoItems = many.replace('<button role="menuitem">Move</button>', "");
  assert.equal(project({ "src/M2.vue": twoItems }).length, 1, "positive control: two items still flagged");
});
