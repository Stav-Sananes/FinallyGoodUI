// Framework-neutral component spec (components/<name>/spec.json): validation and loading.
// Hand-written checks; every error string starts with the dotted path of the offending field.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";

function textList(errors, path, v, { required = true, each = () => null } = {}) {
  if (v === undefined && !required) return;
  if (!Array.isArray(v)) { errors.push(`${path}: must be an array`); return; }
  v.forEach((x, i) => {
    if (!isText(x)) errors.push(`${path}[${i}]: must be a non-empty string`);
    else { const m = each(x); if (m) errors.push(`${path}[${i}]: ${m}`); }
  });
}

function objectList(errors, path, v, check) {
  if (!Array.isArray(v)) { errors.push(`${path}: must be an array`); return; }
  v.forEach((x, i) => {
    if (!isObj(x)) errors.push(`${path}[${i}]: must be an object`);
    else check(x, `${path}[${i}]`);
  });
}

function duplicates(errors, path, names) {
  const seen = new Set();
  for (const n of names) {
    if (seen.has(n)) errors.push(`${path}: duplicate name "${n}"`);
    seen.add(n);
  }
}

export function validateSpec(spec) {
  const errors = [];
  if (!isObj(spec)) return { ok: false, errors: ["spec: must be an object"] };

  if (!isText(spec.name)) errors.push("name: must be a non-empty string");
  textList(errors, "shapes", spec.shapes);
  textList(errors, "events", spec.events);
  textList(errors, "slots", spec.slots);
  textList(errors, "tokens", spec.tokens, { each: (t) => (t.startsWith("--") ? null : 'must start with "--"') });
  textList(errors, "parts", spec.parts);
  if (Array.isArray(spec.parts)) duplicates(errors, "parts", spec.parts.filter(isText));
  if (spec.pattern !== undefined && !isText(spec.pattern)) errors.push("pattern: must be a non-empty string");

  objectList(errors, "props", spec.props, (p, at) => {
    if (!isText(p.name)) errors.push(`${at}.name: must be a non-empty string`);
    if (!isText(p.type)) errors.push(`${at}.type: must be a non-empty string`);
  });
  objectList(errors, "states", spec.states, (s, at) => {
    if (!isText(s.name)) errors.push(`${at}.name: must be a non-empty string`);
    if (!isText(s.attribute)) errors.push(`${at}.attribute: must be a non-empty string`);
  });

  if (!isObj(spec.a11y)) errors.push("a11y: must be an object");
  else {
    if (!isText(spec.a11y.role)) errors.push("a11y.role: must be a non-empty string");
    textList(errors, "a11y.aria", spec.a11y.aria);
    if (spec.a11y.rolePart !== undefined) {
      if (!isText(spec.a11y.rolePart)) errors.push("a11y.rolePart: must be a non-empty string");
      else if (Array.isArray(spec.parts) && !spec.parts.includes(spec.a11y.rolePart)) errors.push(`a11y.rolePart: "${spec.a11y.rolePart}" is not one of parts`);
    }
    const keys = spec.a11y.keys;
    if (!isObj(keys)) errors.push("a11y.keys: must be an object");
    else for (const [k, v] of Object.entries(keys)) if (!isText(v)) errors.push(`a11y.keys.${k}: must be a non-empty string`);
  }
  return { ok: errors.length === 0, errors };
}

export function loadSpec(componentDir) {
  const file = join(componentDir, "spec.json");
  let spec;
  try { spec = JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { throw new Error(`${file}: cannot read spec (${e.message})`); }
  const { ok, errors } = validateSpec(spec);
  if (!ok) throw new Error(`${file}: invalid spec\n${errors.join("\n")}`);
  return spec;
}

/** The part that carries the component's role (`a11y.rolePart`, default "root"). */
export const rolePartOf = (spec) => spec.a11y.rolePart ?? "root";
