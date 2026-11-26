// Style profile: the only place a component's look is decided. Maps radius/material/density/motion to
// token references (never literals) and emits a CSS layer scoped to the component (data-fgu="<name>").
// The layer touches only the parts the spec names in `spec.profile` (default: root for all four):
//   surface     carries radius and material (border, shadow); null = none, `radius: false` = material only
//   density     carries min-height, padding-inline, gap; null = none
//   interactive carries the motion transition; null = none
// It only ever sets values from var(--token); it never resets a border, shadow or padding to none on a
// part the reference CSS styled (flat material removes a shadow only from non-control surfaces).
// A declaration is emitted only when the spec lists a token that can satisfy it, so the layer never
// references a variable the component did not declare.
import { partSelector, scopeOf } from "./css-scope.mjs";

const VALUES = {
  radius: ["sharp", "soft", "round"],
  material: ["flat", "layered", "outlined"],
  density: ["airy", "balanced", "dense"],
  motion: ["productive", "balanced", "expressive"],
};

export function validateProfile(p) {
  if (p === null || typeof p !== "object" || Array.isArray(p)) return { ok: false, errors: ["profile: must be an object"] };
  const errors = [];
  for (const [key, allowed] of Object.entries(VALUES)) {
    if (!allowed.includes(p[key])) errors.push(`${key}: must be one of ${allowed.join(", ")}`);
  }
  if (typeof p.motif !== "string" || p.motif.trim() === "") errors.push("motif: must be a non-empty string");
  return { ok: errors.length === 0, errors };
}

// Ordered token preferences per axis value; the first one the spec declares wins.
const RADIUS = { sharp: ["--radius-none", "--radius-sm"], soft: ["--radius-md", "--radius-lg"], round: ["--radius-full", "--radius-xl"] };
const CONTROL = { airy: ["--size-control-lg"], balanced: ["--size-control-md"], dense: ["--size-control-sm"] };
const PAD = { airy: ["--space-4", "--space-3"], balanced: ["--space-3", "--space-2"], dense: ["--space-2", "--space-1"] };
const GAP = { airy: ["--space-3", "--space-2"], balanced: ["--space-2", "--space-1"], dense: ["--space-1", "--space-2"] };
const SHADOW = { flat: [], layered: ["--shadow-md", "--shadow-sm"], outlined: [] };
const BORDER_W = { flat: [], layered: ["--border-width-hairline"], outlined: ["--border-width-strong", "--border-width-hairline"] };
const DURATION = { productive: ["--duration-micro", "--duration-short"], balanced: ["--duration-short", "--duration-micro"], expressive: ["--duration-standard", "--duration-short"] };
const EASE = { productive: ["--ease-snappy"], balanced: ["--ease-enter"], expressive: ["--ease-enter-emphasized", "--ease-enter"] };
const BORDER_COLOR = ["--color-border", "--color-input"];
const RING_COLOR = ["--color-ring"];

const ATTR = /^[A-Za-z_:][\w:.-]*$/;
const DEFAULT_PARTS = { surface: "root", density: "root", interactive: "root", radius: true };
const FORM_BORDER_COLOR = ["--color-input", "--color-border"];

/** Which parts the profile layer touches for this spec. */
export function profileParts(spec) {
  const p = spec.profile ?? {};
  const pick = (key) => (key in p ? p[key] : DEFAULT_PARTS[key]);
  return { surface: pick("surface"), density: pick("density"), interactive: pick("interactive"), radius: p.radius ?? true };
}

export function profileCss(profile, spec) {
  const have = new Set(spec.tokens);
  const ref = (prefs) => { const t = prefs.find((x) => have.has(x)); return t ? `var(${t})` : null; };
  const decls = (pairs) => pairs.filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const rule = (sel, pairs) => { const body = decls(pairs); return body ? `${sel} {\n${body}\n}` : ""; };
  const at = (part) => partSelector(spec.name, part);

  const { radius, material, density, motion } = profile;
  const parts = profileParts(spec);
  const motif = String(profile.motif).replace(/\*\//g, "* /").replace(/\/\*/g, "/ *").replace(/\s+/g, " ").trim();
  const blocks = [`/* ${spec.name}: radius=${radius} material=${material} density=${density} motion=${motion} motif="${motif}" */`];

  if (parts.surface) {
    const control = parts.surface === "control";
    const width = material === "flat" ? null : ref(BORDER_W[material]);
    const outlined = material === "outlined" && width;
    blocks.push(rule(at(parts.surface), [
      ["border-radius", parts.radius ? ref(RADIUS[radius]) : null],
      ["border-style", outlined ? "solid" : null],
      ["border-width", width],
      ["border-color", width ? ref(control ? FORM_BORDER_COLOR : BORDER_COLOR) : null],
      ["box-shadow", material === "layered" ? ref(SHADOW.layered) : material === "flat" && !control ? "none" : null],
    ]));
  }
  if (parts.density) {
    blocks.push(rule(at(parts.density), [
      ["min-height", ref(CONTROL[density])],
      ["padding-inline", ref(PAD[density])],
      ["gap", ref(GAP[density])],
    ]));
  }
  if (parts.interactive) {
    blocks.push(rule(at(parts.interactive), [
      ["transition-property", ref(DURATION[motion]) ? "background-color, border-color, box-shadow, color, opacity, transform" : null],
      ["transition-duration", ref(DURATION[motion])],
      ["transition-timing-function", ref(EASE[motion])],
    ]));
  }

  // State feel: only disabled and busy get a rule. The attribute can sit on any part, so both the root and its descendants match.
  const scope = scopeOf(spec.name);
  for (const s of spec.states ?? []) {
    if (!ATTR.test(s.attribute)) continue;
    const on = `[${s.attribute}]:not([${s.attribute}="false"])`;
    const feel = /disabled/i.test(s.name) ? [["cursor", "not-allowed"], ["pointer-events", "none"]] : /busy|loading/i.test(s.name) ? [["cursor", "progress"]] : [];
    const r = rule(`${scope}${on},\n${scope} ${on}`, feel);
    if (r) blocks.push(`/* state: ${String(s.name).replace(/\*\//g, "")} */\n${r}`);
  }

  const touched = [...new Set([parts.surface, parts.density, parts.interactive].filter(Boolean))];
  if (!touched.length) touched.push("root");
  blocks.push(`@media (prefers-reduced-motion: reduce) {\n  ${touched.map(at).join(",\n  ")} {\n    transition-duration: 0s;\n    animation-duration: 0s;\n  }\n}`);
  return blocks.filter(Boolean).join("\n\n") + "\n";
}
