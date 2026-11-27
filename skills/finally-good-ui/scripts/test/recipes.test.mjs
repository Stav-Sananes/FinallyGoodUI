import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SR, run } from "./_h.mjs";

// Recipes are what the build step copies from, so a broken one ships into every app built with it.
// These checks hold every recipe to the rules recipes/INDEX.md states: indexed, the standard sections,
// cards that exist, and timing only through the motion tokens.
const RECIPES = join(SR, "recipes");
const read = (p) => readFileSync(join(RECIPES, p), "utf8");
const index = read("INDEX.md");
const files = (dir) => readdirSync(join(RECIPES, dir)).filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f}`);
const recipes = [...files("motion"), ...files("patterns")];

const cardIds = new Set(readdirSync(join(SR, "canon")).filter((f) => f.endsWith(".md") && f !== "INDEX.md")
  .flatMap((f) => [...readFileSync(join(SR, "canon", f), "utf8").matchAll(/^### ([a-z0-9.-]+)$/gm)].map((m) => m[1])));
const tokens = JSON.parse(readFileSync(join(SR, "tokens", "default.tokens.json"), "utf8"));
const names = (group) => new Set(Object.keys(tokens[group]).filter((k) => !k.startsWith("$")));
const DURATIONS = names("duration");
const EASINGS = names("easing");

const cssBlocks = (md) => [...md.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]);
// A timing literal in a transition/animation shorthand or its -duration/-delay/-timing-function longhand.
const TIMING_DECL = /(?:transition|animation)(?:-duration|-delay|-timing-function)?\s*:([^;{}]*)/g;
const literalTimings = (css) => [...css.matchAll(TIMING_DECL)].flatMap(([, value]) =>
  [...value.replace(/var\([^)]*\)/g, "").matchAll(/\b(?!0m?s\b)\d*\.?\d+m?s\b|cubic-bezier\(/g)].map((m) => m[0]));

test("every recipe file is in the index, and every index link opens a recipe", () => {
  const linked = [...index.matchAll(/\]\(((?:motion|patterns)\/[a-z0-9-]+\.md)\)/g)].map((m) => m[1]);
  for (const r of recipes) assert.ok(linked.includes(r), `${r} is missing from recipes/INDEX.md`);
  for (const l of linked) assert.ok(recipes.includes(l), `INDEX links ${l}, which does not exist`);
});

test("each motion recipe states intent, cards, when not to use, tokens, a11y and its upgrade trigger", () => {
  for (const r of files("motion")) {
    const md = read(r);
    for (const part of ["**Intent:**", "**Cards:**", "**When NOT to use:**", "**Tokens:**", "## A11y", "## Upgrade trigger"]) {
      assert.ok(md.includes(part), `${r} lacks ${part}`);
    }
  }
});

test("recipes cite only canon cards that exist", () => {
  for (const r of recipes) {
    const line = read(r).match(/^\*\*Cards:\*\*(.*)$/m);
    assert.ok(line, `${r} has no **Cards:** line`);
    const cited = line[1].split("·").map((s) => s.trim().replace(/[`*]/g, "")).filter(Boolean);
    assert.ok(cited.length > 0, `${r} cites no cards`);
    for (const id of cited) assert.ok(cardIds.has(id), `${r} cites unknown card ${id}`);
  }
});

test("recipe CSS times motion only through tokens that exist", () => {
  for (const r of recipes) {
    for (const css of cssBlocks(read(r))) {
      assert.deepEqual(literalTimings(css), [], `${r} has a timing literal in its CSS`);
      for (const [, name] of css.matchAll(/var\(--duration-([a-z-]+)/g)) assert.ok(DURATIONS.has(name), `${r}: --duration-${name} is not a token`);
      for (const [, name] of css.matchAll(/var\(--ease-([a-z-]+)/g)) assert.ok(EASINGS.has(name), `${r}: --ease-${name} is not a token`);
    }
  }
});

// A var() with a fallback is an optional hook (var(--color-primary-hover, var(--color-primary))), not a dependency.
test("every design-token variable a recipe's CSS needs is one the default tokens emit", () => {
  const r = run("emit-tokens.mjs", ["--in", join(SR, "tokens", "default.tokens.resolver.json"), "--format", "css"]);
  assert.equal(r.code, 0, r.stderr);
  const emitted = new Set([...r.stdout.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const families = new Set([...emitted].map((v) => v.split("-")[2]));          // color, space, radius, …
  for (const f of recipes) {
    for (const css of cssBlocks(read(f))) {
      for (const [, v] of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        if (families.has(v.split("-")[2])) assert.ok(emitted.has(v), `${f} uses ${v}, which the tokens don't define`);
      }
    }
  }
});

test("the timing-literal finder catches literals and lets tokens and zero through", () => {
  assert.deepEqual(literalTimings("a { transition: opacity 200ms ease; }"), ["200ms"]);
  assert.deepEqual(literalTimings("a { animation-timing-function: cubic-bezier(0.2, 0, 0, 1); }"), ["cubic-bezier("]);
  assert.deepEqual(literalTimings("a { transition: opacity var(--duration-short) var(--ease-exit), transform 0s; }"), []);
  assert.deepEqual(literalTimings("a { animation-delay: calc(var(--i) * var(--duration-instant)); }"), []);
});
