#!/usr/bin/env node
// Conformance check for scaffolded components: does the generated code still honour its spec?
import { join, dirname, basename } from "node:path";
import { readdirSync } from "node:fs";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadSpec } from "./lib/component-spec.mjs";
import { walk, readText, readJson, isDir } from "./lib/fs.mjs";
import { COMPONENTS_ROOT } from "./lib/scaffold.mjs";

const HELP = `
Usage: check-components.mjs --root <dir> [--strict]

Finds components written by scaffold-component.mjs (a .fgu-component.json marker next to the files),
loads components/<name>/spec.json and checks the generated files against it. Prints
{tool, ok, findings:[{file, rule, message}]}.

Rules: role-missing, aria-missing, part-missing, state-unstyled, literal, key-handler-reimplemented.

Options:
  --root <dir>   project to scan (default: cwd); node_modules is skipped
  --strict       exit 1 when there are findings
`;

const MARKER = ".fgu-component.json";
const LITERAL = /#[0-9a-f]{3,8}\b|\d*\.?\d+\s*(?:px|ms)\b/gi;
const KEY_HANDLER = /\bon(?:key(?:down|up|press))\b|@key(?:down|up|press)\b|on:key(?:down|up|press)\b|\(key(?:down|up|press)\)|addEventListener\(\s*["']key(?:down|up|press)["']/i;
// How each key name shows up in handler code ("Space" is also written as " ").
const KEY_PATTERN = { Space: /\bSpace\b|["'] ["']/ };
const keyPattern = (key) => KEY_PATTERN[key] ?? new RegExp(`\\b${key}\\b`);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The role is carried by the element: an explicit role attribute or the native/primitive element of that name. */
const hasRole = (role, text) => {
  const r = escape(role);
  return new RegExp(`role=["']${r}["']|<${r}\\b|as=["']${r}["']|\\.${r}\\b|\\b${r}\\.Root\\b`, "i").test(text);
};

const isFrameworkFile = (name, spec) => !name.endsWith(".css") && name !== MARKER && name !== `${spec.name}.behaviour.js`;
// The plain-html output is a static demo page: it renders only the root, with no state attributes.
const isDemoPage = (files) => files.every((f) => /\.html$/.test(f) && !/\.component\.html$/.test(f));

function checkComponent(markerPath, root) {
  const dir = dirname(markerPath);
  const rel = (name) => join(relativeDir(root, dir), name).split("\\").join("/");
  const marker = readJson(markerPath);
  const name = marker?.name;
  let spec;
  try { spec = loadSpec(join(COMPONENTS_ROOT, String(name))); }
  catch (e) { return [{ file: rel(MARKER), rule: "spec-missing", message: `no spec for component "${name}": ${e.message}` }]; }

  const names = readdirSync(dir);
  const frameworkFiles = names.filter((n) => isFrameworkFile(n, spec));
  const cssFiles = names.filter((n) => n.endsWith(".css"));
  const code = frameworkFiles.map((n) => readText(join(dir, n)) ?? "").join("\n");
  const css = cssFiles.map((n) => readText(join(dir, n)) ?? "").join("\n");
  const where = frameworkFiles[0] ?? MARKER;
  const findings = [];
  const add = (file, rule, message) => findings.push({ file: rel(file), rule, message });

  if (!hasRole(spec.a11y.role, code)) add(where, "role-missing", `role "${spec.a11y.role}" is not carried by the root element`);
  // aria listed in the spec but not tied to a state (aria-label) is supplied by the consumer.
  const stateAttrs = new Set(spec.states.map((s) => s.attribute));
  const demo = isDemoPage(frameworkFiles);
  for (const aria of demo ? [] : spec.a11y.aria.filter((a) => stateAttrs.has(a))) {
    if (!code.includes(aria)) add(where, "aria-missing", `${aria} is never set on the ${spec.name}`);
  }
  for (const part of demo ? ["root"] : spec.parts) {
    if (!code.includes(`data-part="${part}"`)) add(where, "part-missing", `part "${part}" has no data-part="${part}" element`);
  }
  for (const { name: state, attribute } of spec.states) {
    if (!new RegExp(`(?<![\\w-])${escape(attribute)}(?![\\w-])`).test(css)) add(cssFiles[0] ?? where, "state-unstyled", `state "${state}" (${attribute}) has no CSS rule`);
  }
  for (const css_ of cssFiles) {
    const seen = new Set((readText(join(dir, css_)) ?? "").match(LITERAL)?.map((l) => l.replace(/\s+/g, "")));
    for (const lit of seen) add(css_, "literal", `literal "${lit}" in CSS: use a token`);
  }
  if (marker.source === "shared" || String(marker.source).startsWith("primitives:")) {
    for (const file of frameworkFiles) {
      const text = readText(join(dir, file)) ?? "";
      if (!KEY_HANDLER.test(text)) continue;
      for (const key of Object.keys(spec.a11y.keys)) {
        if (keyPattern(key).test(text)) add(file, "key-handler-reimplemented", `key "${key}" is handled in ${file}: the ${marker.source} behaviour already does it`);
      }
    }
  }
  return findings;
}

const relativeDir = (root, dir) => dir.slice(root.length).replace(/^[\\/]+/, "");

export function checkComponents(root) {
  const markers = walk(root, root).filter((f) => basename(f) === MARKER);
  return markers.flatMap((m) => checkComponent(join(root, m), root));
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root"], boolean: ["strict"] },
    main: ({ flags }) => {
      const root = (flags.root || ".").replace(/[\\/]+$/, "") || ".";
      if (!isDir(root)) throw new UsageError(`--root ${root}: not a directory`);
      const findings = checkComponents(root);
      if (flags.strict && findings.length) process.exitCode = 1;
      return { tool: "check-components", ok: findings.length === 0, findings };
    },
  });
}
