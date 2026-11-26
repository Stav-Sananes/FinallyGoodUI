#!/usr/bin/env node
// Conformance check for scaffolded components: does the generated code still honour its spec?
import { join, dirname, basename, relative } from "node:path";
import { readdirSync } from "node:fs";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadSpec, rolePartOf } from "./lib/component-spec.mjs";
import { walk, readText, readJson, isDir } from "./lib/fs.mjs";
import { COMPONENTS_ROOT } from "./lib/scaffold.mjs";

const HELP = `
Usage: check-components.mjs --root <dir> [--strict]

Finds components written by scaffold-component.mjs (a .fgu-component.json marker next to the files),
loads components/<name>/spec.json and checks the generated files against it. Prints
{tool, ok, findings:[{file, rule, message}]}.

Rules: role-missing, aria-missing, part-missing, state-unstyled, literal, key-handler-reimplemented,
empty-skeleton (the parts are there but the component renders no content slot, or a shared-behaviour
component never calls attach: markup alone is not a working component),
spec-missing (a marker names a component that has no valid spec).

Scope notes:
  - role-missing checks the element of spec.a11y.rolePart (default root): role="x" or the native tag
    (<button>, <a>, <input type=checkbox|text>, <textarea>).
  - aria-missing checks only aria attributes that are also a state attribute (aria-busy). Other
    spec aria (aria-label) is consumer-supplied and not checked.
  - The plain-html output (<name>.html, with no framework file) is a static demo page: only the root
    part is required, and state aria is not checked. Each such component adds a "notes" entry.
  - empty-skeleton: a framework file must render its content (children, <slot>, <ng-content>, {@render},
    when the spec has slots) and, when the marker source is shared, call attach(...). The plain-html demo
    page only needs the attach call.
  - key-handler-reimplemented applies when the marker source is shared or primitives:<name>;
    <name>.behaviour.js is never scanned.

Options:
  --root <dir>   project to scan (default: cwd); node_modules is skipped
  --strict       exit 1 when there are findings
`;

const MARKER = ".fgu-component.json";
const LITERAL = /#[0-9a-f]{3,8}\b|\d*\.?\d+\s*(?:px|ms)\b/gi;
// Key listeners in every framework syntax; modifier suffixes (@keydown.enter, (keydown.enter), onKeyDownCapture)
// are part of the match. onClick and friends never match.
const KEY_HANDLER = /\bonkey(?:down|up|press)\w*|@key(?:down|up|press)[.\w-]*|\bon:key(?:down|up|press)[.\w:|-]*|\(key(?:down|up|press)[.\w-]*\)|addEventListener\(\s*["']key(?:down|up|press)["']/i;
// Spellings of a spec key in handler code, lower-cased ("Space" is also written " "; Escape is also "esc").
const KEY_ALIASES = { space: ["space"], escape: ["escape", "esc"], arrowdown: ["arrowdown", "down"], arrowup: ["arrowup", "up"], arrowleft: ["arrowleft", "left"], arrowright: ["arrowright", "right"] };
const keyPattern = (key) => {
  const k = key.toLowerCase();
  const names = (KEY_ALIASES[k] ?? [k]).map((n) => `(?<![a-z])${n}(?![a-z])`);
  if (k === "space") names.push(`["'] ["']`);
  return new RegExp(names.join("|"));
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The role is carried by the element: an explicit role attribute or the native/primitive element of that name. */
const hasRole = (role, text) => {
  const r = escape(role);
  return new RegExp(`role=["']${r}["']|<${r}\\b|as=["']${r}["']|\\.${r}\\b|\\b${r}\\.Root\\b`, "i").test(text);
};

// Does the opening tag of the role part carry the role, as role="x" or through its native tag?
const partHasRole = (role, part, text) => {
  const r = escape(role);
  for (const [, tag, attrs] of text.matchAll(new RegExp(`<([A-Za-z][\\w.]*)\\b([^<>]*data-part="${escape(part)}"[^<>]*)>`, "g"))) {
    if (new RegExp(`role=["']${r}["']`, "i").test(attrs)) return true;
    const t = tag.toLowerCase();
    if (t === "input") {
      const type = /(?<![:\w-])type=["']([\w-]+)["']/i.exec(attrs)?.[1]?.toLowerCase() ?? "text"; // a bound type (:type="type") is a text field by default
      if (role === "checkbox" ? type === "checkbox" : role === "textbox" && ["text", "email", "search", "tel", "url", "password"].includes(type)) return true;
    }
    if ((role === "button" && t === "button") || (role === "link" && t === "a") || (role === "textbox" && t === "textarea")) return true;
  }
  return false;
};

// Any way a framework renders the content the caller passes in.
const CONTENT_SLOT = /\bchildren\b|<slot\b|<ng-content\b|@render\b|\$slots\b|ngTemplateOutlet|<Slot\b/;

const isFrameworkFile = (name, spec) => !name.endsWith(".css") && name !== MARKER && name !== `${spec.name}.behaviour.js` && name !== `${spec.name}.behaviour.d.ts`;
// The plain-html output is a static demo page: it renders only the root, with no state attributes.
const isDemoPage = (files) => files.every((f) => /\.html$/.test(f) && !/\.component\.html$/.test(f));

function checkComponent(markerPath, root, notes) {
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

  const rolePart = rolePartOf(spec);
  const roleOk = rolePart === "root" ? hasRole(spec.a11y.role, code) : partHasRole(spec.a11y.role, rolePart, code);
  if (!roleOk) add(where, "role-missing", `role "${spec.a11y.role}" is not carried by the ${rolePart} element`);
  // aria listed in the spec but not tied to a state (aria-label) is supplied by the consumer.
  const stateAttrs = new Set(spec.states.map((s) => s.attribute));
  const demo = isDemoPage(frameworkFiles);
  if (demo) notes.push({ file: rel(where), note: "plain-html demo page: only the root part is required and state aria is not checked" });
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
  const shared = marker.source === "shared";
  if (shared && !/\battach\(/.test(code)) add(where, "empty-skeleton", `${spec.name} uses the shared behaviour but never calls attach(): no keyboard, focus or ARIA wiring runs`);
  if (!demo && spec.slots.length && !CONTENT_SLOT.test(code)) add(where, "empty-skeleton", `${spec.name} renders its parts but no content slot (${spec.slots.join(", ")}): the caller's content has nowhere to go`);
  if (marker.source === "shared" || String(marker.source).startsWith("primitives:")) {
    for (const file of frameworkFiles) {
      const text = readText(join(dir, file)) ?? "";
      if (!KEY_HANDLER.test(text)) continue;
      for (const key of Object.keys(spec.a11y.keys)) {
        if (keyPattern(key).test(text.toLowerCase())) add(file, "key-handler-reimplemented", `key "${key}" is handled in ${file}: the ${marker.source} behaviour already does it`);
      }
    }
  }
  return findings;
}

// Full path from the scanned root ("src/components/fgu/button"), whatever spelling --root had ("." or "./app/").
const relativeDir = (root, dir) => relative(root, dir);

export function checkComponents(root) {
  const notes = [];
  const markers = walk(root, root).filter((f) => basename(f) === MARKER);
  const findings = markers.flatMap((m) => checkComponent(join(root, m), root, notes));
  return { findings, notes };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["root"], boolean: ["strict"] },
    main: ({ flags }) => {
      const root = (flags.root || ".").replace(/[\\/]+$/, "") || ".";
      if (!isDir(root)) throw new UsageError(`--root ${root}: not a directory`);
      const { findings, notes } = checkComponents(root);
      if (flags.strict && findings.length) process.exitCode = 1;
      return { tool: "check-components", ok: findings.length === 0, findings, notes };
    },
  });
}
