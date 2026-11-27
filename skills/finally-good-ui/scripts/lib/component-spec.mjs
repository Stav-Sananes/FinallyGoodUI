// Framework-neutral component spec (components/<name>/spec.json): validation and loading.
// Hand-written checks; every error string starts with the dotted path of the offending field.
import { readdirSync, readFileSync, statSync } from "node:fs";
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

  if (spec.tags !== undefined) {
    if (!isObj(spec.tags)) errors.push("tags: must be an object (part name to element tag)");
    else for (const [part, tag] of Object.entries(spec.tags)) {
      if (Array.isArray(spec.parts) && !spec.parts.includes(part)) errors.push(`tags.${part}: "${part}" is not one of parts`);
      if (typeof tag !== "string" || !/^[a-z][a-z0-9]*$/.test(tag)) errors.push(`tags.${part}: must be a plain lowercase tag name`);
    }
  }
  if (spec.profile !== undefined) {
    if (!isObj(spec.profile)) errors.push("profile: must be an object (surface, density, interactive: a part or null; radius: boolean)");
    else for (const [k, v] of Object.entries(spec.profile)) {
      if (k === "radius") { if (typeof v !== "boolean") errors.push("profile.radius: must be a boolean"); }
      else if (k === "touch") { if (!Array.isArray(v) || v.some((x) => !(Array.isArray(spec.parts) && spec.parts.includes(x)))) errors.push("profile.touch: must be an array of parts (raised to 44px under pointer: coarse)"); }
      else if (k === "also") { if (!Array.isArray(v) || v.some((x) => !(Array.isArray(spec.parts) && spec.parts.includes(x)))) errors.push("profile.also: must be an array of parts (they also take the radius)"); }
      else if (k === "role") { if (!["record", "panel", "control"].includes(v)) errors.push("profile.role: must be record, panel or control (which style-profile surface the component takes)"); }
      else if (k === "lead") { if (!(isText(v) && Array.isArray(spec.parts) && spec.parts.includes(v))) errors.push("profile.lead: must be one of parts (the part a perforated edge tears off)"); }
      else if (["surface", "density", "interactive"].includes(k)) {
        if (v !== null && !(isText(v) && Array.isArray(spec.parts) && spec.parts.includes(v))) errors.push(`profile.${k}: must be null or one of parts`);
      } else errors.push(`profile.${k}: unknown key`);
    }
  }
  if (spec.api !== undefined) textList(errors, "api", spec.api);
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
    if (p.ts !== undefined && !isText(p.ts)) errors.push(`${at}.ts: must be a non-empty string (the TypeScript type)`);
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

/** The component folders under `base` (components/): every directory but adapters/ (docs, not a component), sorted. */
export const componentDirs = (base) => readdirSync(base).filter((d) => d !== "adapters" && statSync(join(base, d)).isDirectory()).sort();
