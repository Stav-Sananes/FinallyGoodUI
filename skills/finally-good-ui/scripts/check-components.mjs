#!/usr/bin/env node
// Conformance check for scaffolded components: does the generated code still honour its spec?
import { join, dirname, basename, relative } from "node:path";
import { readdirSync } from "node:fs";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadSpec, rolePartOf } from "./lib/component-spec.mjs";
import { walk, readText, readJson, isDir, toPosix } from "./lib/fs.mjs";
import { COMPONENTS_ROOT } from "./lib/scaffold.mjs";
import { mapSelectors } from "./lib/css-scope.mjs";
import { usedVars, definedVars } from "./lib/token-vars.mjs";

const HELP = `
Usage: check-components.mjs --root <dir> [--strict]

Finds components written by scaffold-component.mjs (a .fgu-component.json marker next to the files),
loads components/<name>/spec.json and checks the generated files against it. Prints
{tool, ok, findings:[{file, rule, message}]}.

Rules: role-missing, aria-missing, part-missing, state-unstyled, literal, key-handler-reimplemented,
token-undefined (the component's css uses a var(--x) that the project's own tokens or stylesheets never define; only checked
when the project defines some custom properties at all),
css-unparseable (the component could not be read, usually a stylesheet with unbalanced braces),
css-selector-unmatched (a selector in the component CSS that the generated markup can never match: an unknown
part, a variant the spec does not list, or a descendant [data-variant] when the variant sits on the root),
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
// A literal in a declaration VALUE: a hex colour, a colour function, or a length/time (px rem em ms s). Selectors,
// comments and url(...) are not values. Zero (0, 0s, 0ms) and percentages are fine.
const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|(?<![\w.#-])(?:\d*\.\d+|[1-9]\d*|0\d+)\s*(?:px|rem|em|ms|s)\b/gi;

/** [{ prop, value }] of every declaration, with comments and url(...) removed; selectors never appear. */
export function declarationsOf(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/gi, "url()");
  const out = [];
  for (const [, body] of clean.matchAll(/\{([^{}]*)\}/g)) {
    for (const decl of body.split(";")) {
      const at = decl.indexOf(":");
      if (at > 0) out.push({ prop: decl.slice(0, at).trim().toLowerCase(), value: decl.slice(at + 1).trim() });
    }
  }
  return out;
}

/** The token-only violations of a stylesheet: literal values the project's tokens should carry.
 *  Allowed on purpose: `opacity` (state dimming; there is no opacity token group), 1rem (the user's base size, for the iOS
 *  zoom guard), and rem/em measures on width/height properties (a dialog's 32rem reading width). */
export function literalsIn(css) {
  const found = new Set();
  for (const { prop, value } of declarationsOf(css)) {
    if (prop === "opacity") continue;
    for (const m of value.matchAll(LITERAL)) {
      const lit = m[0].replace(/\s+/g, "");
      if (lit.toLowerCase() === "1rem") continue;
      if (/(rem|em)$/i.test(lit) && /(^|-)(inline-size|block-size|width|height)$/.test(prop)) continue;
      found.add(lit);
    }
  }
  return [...found];
}
// Key listeners in every framework syntax; modifier suffixes (@keydown.enter, (keydown.enter), onKeyDownCapture)
// are part of the match. onClick and friends never match.
const KEY_HANDLER = /\bonkey(?:down|up|press)\w*|@key(?:down|up|press)[.\w-]*|\bon:key(?:down|up|press)[.\w:|-]*|\(key(?:down|up|press)[.\w-]*\)|addEventListener\(\s*["']key(?:down|up|press)["']/i;
// Spellings of a spec key in handler code, lower-cased ("Space" is also written " "; Escape is also "esc").
const KEY_ALIASES = { space: ["space"], escape: ["escape", "esc"], arrowdown: ["arrowdown", "down"], arrowup: ["arrowup", "up"], arrowleft: ["arrowleft", "left"], arrowright: ["arrowright", "right"] };
const keyPatterns = new Map();
const keyPattern = (key) => {
  if (!keyPatterns.has(key)) keyPatterns.set(key, buildKeyPattern(key));
  return keyPatterns.get(key);
};
const buildKeyPattern = (key) => {
  const k = key.toLowerCase();
  const names = (KEY_ALIASES[k] ?? [k]).map((n) => `(?<![a-z])${n}(?![a-z])`);
  if (k === "space") names.push(`["'] ["']`);
  return new RegExp(names.join("|"));
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The role is carried by the element: an explicit role attribute or the native/primitive element of that name. */
const roleRegexes = new Map();
const hasRole = (role, text) => {
  if (!roleRegexes.has(role)) { const r = escape(role); roleRegexes.set(role, new RegExp(`role=["']${r}["']|<${r}\\b|as=["']${r}["']|\\.${r}\\b|\\b${r}\\.Root\\b`, "i")); }
  return roleRegexes.get(role).test(text);
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

// Compounds of a selector, split at combinators outside brackets and parentheses.
function compoundsOf(selector) {
  const out = []; let depth = 0, at = 0;
  for (let i = 0; i <= selector.length; i++) {
    const ch = selector[i];
    if (ch === "[" || ch === "(") depth++; else if (ch === "]" || ch === ")") depth--;
    if (i === selector.length || (depth === 0 && /[\s>+~]/.test(ch))) { if (i > at) out.push(selector.slice(at, i)); at = i + 1; }
  }
  return out;
}

/** Selectors in `css` that can never match markup built from `spec`: [{ selector, why }]. */
export function selectorProblems(spec, css) {
  const problems = [];
  mapSelectors(css, (selector) => {
    const compounds = compoundsOf(selector.trim());
    compounds.forEach((compound, i) => {
      for (const [, part] of compound.matchAll(/\[data-part="([\w-]+)"\]/g)) {
        if (!spec.parts.includes(part)) problems.push({ selector: selector.trim(), why: `part "${part}" is not a part of ${spec.name}` });
      }
      for (const [, v] of compound.matchAll(/\[data-variant="([\w-]+)"\]/g)) {
        if (!spec.shapes.includes(v)) problems.push({ selector: selector.trim(), why: `variant "${v}" is not a shape of ${spec.name} (${spec.shapes.join(", ")})` });
      }
      // The variant is an attribute of the root element, which is also the scope: below the scope it can only match on a nested part.
      if (i > 0 && /\[data-variant/.test(compound) && !/\[data-part=/.test(compound)) {
        problems.push({ selector: selector.trim(), why: "a descendant [data-variant] never matches: data-variant is on the root, so write it in the root's compound ([data-fgu][data-variant])" });
      }
    });
    return selector;
  });
  return problems;
}

const isFrameworkFile = (name, spec) => !name.endsWith(".css") && name !== MARKER && name !== `${spec.name}.behaviour.js` && name !== `${spec.name}.behaviour.d.ts` && !/^toast-store\./.test(name);
// The plain-html output is a static demo page: it renders only the root, with no state attributes.
const isDemoPage = (files) => files.length > 0 && files.every((f) => /\.html$/.test(f) && !/\.component\.html$/.test(f));

function checkComponent(markerPath, root, notes, defined, specs) {
  const dir = dirname(markerPath);
  const rel = (name) => toPosix(join(relativeDir(root, dir), name));
  const marker = readJson(markerPath);
  const name = marker?.name;
  let spec;
  try { spec = specs.get(name) ?? (specs.set(name, loadSpec(join(COMPONENTS_ROOT, String(name)))), specs.get(name)); }
  catch (e) { return [{ file: rel(MARKER), rule: "spec-missing", message: `no spec for component "${name}": ${e.message}` }]; }

  const names = readdirSync(dir).sort(); // the same reported file on every OS
  const frameworkFiles = names.filter((n) => isFrameworkFile(n, spec));
  const cssFiles = names.filter((n) => n.endsWith(".css"));
  const texts = new Map(); // each file is read once
  const textOf = (n) => { if (!texts.has(n)) texts.set(n, readText(join(dir, n)) ?? ""); return texts.get(n); };
  const code = frameworkFiles.map(textOf).join("\n");
  const css = cssFiles.map(textOf).join("\n");
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
    const sheet = textOf(css_);
    for (const { selector, why } of selectorProblems(spec, sheet)) add(css_, "css-selector-unmatched", `${selector}: ${why}`);
    if (defined) {
      const missing = usedVars(sheet).filter((v) => !defined.has(v));
      if (missing.length) add(css_, "token-undefined", `the project's tokens do not define ${missing.join(", ")}: those declarations are dropped. Add them (emit-tokens.mjs --format css writes the skill's set) or regenerate .design/tokens.json`);
    }
    for (const lit of literalsIn(sheet)) add(css_, "literal", `literal "${lit}" in CSS: use a token`);
  }
  const shared = marker.source === "shared";
  if (shared && !/\battach\(/.test(code)) add(where, "empty-skeleton", `${spec.name} uses the shared behaviour but never calls attach(): no keyboard, focus or ARIA wiring runs`);
  if (!demo && spec.slots.length && !CONTENT_SLOT.test(code)) add(where, "empty-skeleton", `${spec.name} renders its parts but no content slot (${spec.slots.join(", ")}): the caller's content has nowhere to go`);
  if (marker.source === "shared" || String(marker.source).startsWith("primitives:")) {
    for (const file of frameworkFiles) {
      const text = textOf(file);
      if (!KEY_HANDLER.test(text)) continue;
      const lower = text.toLowerCase();
      for (const key of Object.keys(spec.a11y.keys)) {
        if (keyPattern(key).test(lower)) add(file, "key-handler-reimplemented", `key "${key}" is handled in ${file}: the ${marker.source} behaviour already does it`);
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
  const defined = markers.length ? definedVars(root) : null; // null: the project has no token set to compare with
  const specs = new Map();
  const findings = markers.flatMap((m) => {
    try { return checkComponent(join(root, m), root, notes, defined, specs); }
    catch (e) { return [{ file: toPosix(relative(root, join(root, m))), rule: "css-unparseable", message: `could not check this component: ${e.message}` }]; }
  });
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
