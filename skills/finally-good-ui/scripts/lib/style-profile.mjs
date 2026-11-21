// Style profile: the only place a component's look is decided. Maps radius/material/density/motion to
// token references (never literals) and emits a CSS layer over [data-part] and the spec's state attributes.
// A declaration is emitted only when the spec lists a token that can satisfy it, so the layer never
// references a variable the component did not declare.

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

export function profileCss(profile, spec) {
  const have = new Set(spec.tokens);
  const ref = (prefs) => { const t = prefs.find((x) => have.has(x)); return t ? `var(${t})` : null; };
  const decls = (pairs) => pairs.filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const rule = (sel, pairs) => { const body = decls(pairs); return body ? `${sel} {\n${body}\n}` : ""; };

  const { radius, material, density, motion } = profile;
  const hasBorder = material === "outlined" || (material === "layered" && ref(BORDER_W.layered));
  const motif = String(profile.motif).replace(/\*\//g, "* /").replace(/\/\*/g, "/ *").replace(/\s+/g, " ").trim();

  const blocks = [
    `/* ${spec.name}: radius=${radius} material=${material} density=${density} motion=${motion} motif="${motif}" */`,
    rule("[data-part]", [
      ["box-sizing", "border-box"],
      ["border-radius", ref(RADIUS[radius])],
      ["border-style", material === "outlined" ? "solid" : "none"],
      ["border-width", hasBorder ? ref(BORDER_W[material]) : null],
      ["border-color", hasBorder ? ref(BORDER_COLOR) : null],
      ["box-shadow", ref(SHADOW[material]) ?? "none"],
      ["transition-property", ref(DURATION[motion]) ? "background-color, border-color, box-shadow, color, transform" : null],
      ["transition-duration", ref(DURATION[motion])],
      ["transition-timing-function", ref(EASE[motion])],
    ]),
    rule(`[data-part="${spec.parts?.[0] ?? "root"}"]`, [
      ["min-height", ref(CONTROL[density])],
      ["padding-inline", ref(PAD[density])],
      ["gap", ref(GAP[density])],
    ]),
    rule("[data-part]:focus-visible", [
      ["outline-style", ref(["--ring-width"]) ? "solid" : null],
      ["outline-width", ref(["--ring-width"])],
      ["outline-color", ref(RING_COLOR)],
      ["outline-offset", ref(["--ring-offset"])],
    ]),
  ];

  const root = `[data-part="${spec.parts?.[0] ?? "root"}"]`;
  for (const s of spec.states ?? []) {
    if (!ATTR.test(s.attribute)) continue;
    const on = `${root}[${s.attribute}]:not([${s.attribute}="false"])`;
    const feel = /disabled/i.test(s.name) ? [["cursor", "not-allowed"], ["pointer-events", "none"]] : /busy|loading/i.test(s.name) ? [["cursor", "progress"]] : [];
    blocks.push(`/* state: ${String(s.name).replace(/\*\//g, "")} */\n${rule(on, feel) || `${on} {\n  cursor: default;\n}`}`);
  }

  blocks.push(`@media (prefers-reduced-motion: reduce) {\n  [data-part] {\n    transition-duration: 0s;\n    animation-duration: 0s;\n  }\n}`);
  return blocks.filter(Boolean).join("\n\n") + "\n";
}
