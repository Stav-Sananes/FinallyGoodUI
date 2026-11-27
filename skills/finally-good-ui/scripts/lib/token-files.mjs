// Reading and writing token files. A token set is either one tokens file (dark values in
// $extensions.fgu.dark, the older finally-good-ui shape) or DTCG 2025.10 files tied together by a
// resolver (https://www.designtokens.org/tr/2025.10/resolver/). Callers always get one in-memory
// tree with {alias} references resolved and dark values attached as $extensions.fgu.dark.
import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { GROUPS, tokenPaths, toDtcg } from "./tokens.mjs";

const RESOLVER_SUFFIX = ".resolver.json";

function readJsonFile(path) {
  let text;
  try { text = readFileSync(path, "utf8"); } catch { throw new Error(`cannot read ${path}`); }
  try { return JSON.parse(text); } catch (e) { throw new Error(`invalid JSON in ${path}: ${e.message}`); }
}

/** Load a token set from a tokens file or a resolver file. */
export function loadTokens(file) {
  const path = resolve(file);
  const resolverPath = path.endsWith(RESOLVER_SUFFIX) ? path : siblingResolver(path);
  if (!resolverPath) return resolveAliases(readJsonFile(path));
  const { light, dark } = readResolver(resolverPath);
  return withDark(light, dark);
}

/** <name>.json -> <name>.resolver.json, used only when that resolver actually reads <name>.json. */
function siblingResolver(path) {
  const candidate = path.replace(/\.json$/, RESOLVER_SUFFIX);
  if (candidate === path || !existsSync(candidate)) return null;
  return JSON.stringify(readJsonFile(candidate)).includes(`"${basename(path)}"`) ? candidate : null;
}

/** Apply the resolver's resolution order; returns the light tree and the dark context's overrides. */
function readResolver(resolverPath) {
  const doc = readJsonFile(resolverPath);
  const dir = dirname(resolverPath);
  const loadSources = (sources = []) => sources.reduce((tree, src) =>
    deepMerge(tree, src.$ref ? readJsonFile(join(dir, src.$ref)) : src), {});
  const pointer = (ref) => ref.replace(/^#\//, "").split("/").reduce((node, key) => node?.[key], doc);
  let light = {}, dark = {};
  for (const step of doc.resolutionOrder || []) {
    const node = step.$ref ? pointer(step.$ref) : step;
    if (!node) throw new Error(`${resolverPath}: unknown reference ${step.$ref}`);
    if (node.sources) { light = deepMerge(light, loadSources(node.sources)); continue; }
    if (!node.contexts) continue;
    const darkName = Object.keys(node.contexts).find((n) => /dark/i.test(n));
    const defaultName = node.default || Object.keys(node.contexts).find((n) => n !== darkName);
    if (defaultName) light = deepMerge(light, loadSources(node.contexts[defaultName]));
    if (darkName) dark = deepMerge(dark, loadSources(node.contexts[darkName]));
  }
  return { light, dark };
}

/** Attach the dark overrides to the light tree as $extensions.fgu.dark, aliases resolved per theme. */
function withDark(light, darkOverrides) {
  const darkTree = resolveAliases(deepMerge(structuredClone(light), darkOverrides));
  const tree = resolveAliases(light);
  for (const group of GROUPS) {
    for (const [path] of tokenPaths(darkOverrides[group], [group])) {
      const target = at(tree, path), themed = at(darkTree, path);
      if (!target || !themed) continue;
      ((target.$extensions ||= {}).fgu ||= {}).dark = themed.$value;
    }
  }
  return tree;
}

const ALIAS = /^\{([^}]+)\}$/;
const at = (tree, path) => path.reduce((node, key) => node?.[key], tree);

/** Replace every "{group.token}" value (and legacy dark value) with the value it points to. */
export function resolveAliases(tree) {
  const out = structuredClone(tree);
  const valueOf = (ref, seen) => {
    if (seen.has(ref)) throw new Error(`circular alias: ${[...seen, ref].join(" -> ")}`);
    const tok = at(out, ref.split("."));
    if (!tok || !("$value" in tok)) throw new Error(`alias {${ref}} points to no token`);
    const m = typeof tok.$value === "string" && tok.$value.match(ALIAS);
    return m ? valueOf(m[1], new Set([...seen, ref])) : tok.$value;
  };
  const follow = (v, self) => {
    const m = typeof v === "string" && v.match(ALIAS);
    return m ? valueOf(m[1], new Set([self])) : v;
  };
  for (const group of Object.keys(out)) {
    for (const [path, tok] of tokenPaths(out[group], [group])) {
      const self = path.join(".");
      tok.$value = follow(tok.$value, self);
      if (tok.$extensions?.fgu?.dark != null) tok.$extensions.fgu.dark = follow(tok.$extensions.fgu.dark, self);
    }
  }
  return out;
}

function deepMerge(a, b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && !("$value" in v) ? deepMerge(out[k] || {}, v) : v;
  }
  return out;
}

/** JSON with 2-space indent, but short arrays of plain values (colour components, bezier points) on one line. */
export function formatJson(value) {
  return JSON.stringify(value, null, 2).replace(/\[\s+([^\[\]{}]*?)\s+\]/g, (_, inner) => `[${inner.split(/,\s*/).join(", ")}]`) + "\n";
}

/** The three files of a standard token set, as {fileName: object}. */
export function dtcgFiles(tokens, name = "tokens") {
  const { base, dark } = toDtcg(tokens);
  const files = { [`${name}.json`]: base, [`${name}.dark.json`]: dark };
  files[`${name}${RESOLVER_SUFFIX}`] = {
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    version: "2025.10",
    sets: { base: { sources: [{ $ref: `${name}.json` }] } },
    modifiers: { theme: { contexts: { light: [], dark: [{ $ref: `${name}.dark.json` }] }, default: "light" } },
    resolutionOrder: [{ $ref: "#/sets/base" }, { $ref: "#/modifiers/theme" }],
  };
  return files;
}
