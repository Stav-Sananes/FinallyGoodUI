// Genericness gate (G10): turns the probe's raw first-viewport measurements (metrics.generic) into triggers.
// Three or more triggers cap rubric dimension 10 at 3 and fail the gate. Thresholds are justified in modules/verify.md.
export const TRIGGER_LIMIT = 3;
export const DEFAULT_PROMISE = { desktop: 0.25, mobile: 0.4 };
const DEFAULT_FAMILIES = new Set([
  "inter", "inter variable", "figtree", "figtree variable", "public sans", "dm sans", "instrument sans", "plus jakarta sans", "geist", "geist sans",
  "system-ui", "-apple-system", "blinkmacsystemfont", "ui-sans-serif", "segoe ui", "roboto", "helvetica", "helvetica neue", "arial", "sans-serif",
]);
const isDefaultFamily = (f) => DEFAULT_FAMILIES.has(String(f).toLowerCase().replace(/\s+variable$/, "")) || DEFAULT_FAMILIES.has(String(f).toLowerCase());

/** @returns {{id:string,value:any,threshold:string}|null} */
const TESTS = {
  cardCoverage: (g) => g.cardCoverage > 0.3 && { value: g.cardCoverage, threshold: "> 0.30 of the first viewport in bordered rounded cards sharing one radius and border width" },
  rowRepeat: (g) => g.rows.groups >= 1 && { value: g.rows.max, threshold: ">= 5 identical sibling rows, each ending in a more/options button" },
  singleColumn: (g) => {
    const c = g.column;
    return c && g.viewport.width >= 1000 && c.width <= 1000 && Math.abs(c.left - c.right) <= 0.04 * g.viewport.width && c.left + c.right >= 0.25 * g.viewport.width
      && { value: c.width, threshold: "content <= 1000px, centred within 4%, >= 25% of the width empty" };
  },
  defaultType: (g) => {
    const t = g.type, fams = Object.entries(t.families);
    const def = fams.filter(([f]) => isDefaultFamily(f)).reduce((a, [, n]) => a + n, 0);
    const other = t.textElements - def;
    return t.textElements > 0 && def / t.textElements >= 0.7 && other <= 2 && { value: +(def / t.textElements).toFixed(2), threshold: ">= 70% of text in stock UI families, other families on <= 2 nodes" };
  },
  canvasNeutral: (g) => g.canvas.c < 0.05 && g.canvas.l > 0.9 && { value: g.canvas.c, threshold: "page background OKLCH chroma < 0.05 and lightness > 0.9" },
  scaleFlat: (g) => {
    const s = g.type.sizes;
    return s.length > 0 && (s.length === 1 || s[0] / s[1] < 2.2) && { value: s.length > 1 ? +(s[0] / s[1]).toFixed(2) : 1, threshold: "largest / second-largest text size < 2.2" };
  },
  radiusUniform: (g, o) => g.surfaces.containers >= 6 && g.surfaces.radii.length <= 2 && o.roles >= 3 && { value: g.surfaces.radii, threshold: "<= 2 distinct container radii while the spec has >= 3 surface roles" },
};

/**
 * @param {{desktop: object|null, mobile?: object|null}} raw  metrics.generic at 1440 (required) and 375
 * @param {{promise?: {desktop:number,mobile:number}, roles?: number}} [opts]
 */
export function evaluateGenericness(raw, opts = {}) {
  const d = raw?.desktop;
  if (!d) return { pass: null, error: "no first-viewport measurement at 1440: run the probe on the first screen at 1440x900", triggers: [], count: 0, capDim10: null, fidelity: [] };
  const promise = { ...DEFAULT_PROMISE, ...(opts.promise ?? {}) };
  const o = { roles: opts.roles ?? 3 };
  const triggers = [];
  for (const [id, test] of Object.entries(TESTS)) {
    const hit = test(d, o);
    if (hit) triggers.push({ id, ...hit });
  }
  const fidelity = [];
  for (const [g, key] of [[d, "desktop"], [raw.mobile, "mobile"]]) {
    if (!g) continue;
    const share = g.signature.count ? g.signature.share : 0;
    if (share < promise[key]) fidelity.push({ severity: "high", rule: "signature-below-promise", viewport: g.viewport.width, share, promise: promise[key], card: "craft.identity-motif" });
  }
  if (!d.signature.count || d.signature.share < promise.desktop) triggers.push({ id: "signatureAbsent", value: d.signature.share, threshold: `no [data-fgu-signature] in the first viewport, or below ${promise.desktop}` });
  const count = triggers.length;
  return { pass: count < TRIGGER_LIMIT, count, capDim10: count >= TRIGGER_LIMIT ? 3 : null, triggers, fidelity };
}
