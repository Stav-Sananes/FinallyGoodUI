// Static check rule ids -> canon card (docs/build-brief.md). Single source of truth,
// used by check-static.mjs and validated by lint-skill.mjs.
export const RULE_CARDS = {
  "no-transition-all": "motion.compositor-only",
  "animate-layout-prop": "motion.compositor-only",
  "no-reduced-motion": "motion.reduced-motion",
  "hardcoded-color": "color.role-scale",
  "off-scale-spacing": "layout.spacing-scale",
  "long-duration": "motion.frequency-budget",
  "ease-in-entrance": "motion.easing-roles",
  "scale-from-zero": "motion.easing-roles",
  "outline-none-no-focus": "a11y.focus-visible",
  "img-no-alt": "a11y.semantic-first",
  "div-onclick": "a11y.semantic-first",
  "user-scalable-no": "a11y.target-size",
  "small-input-font": "a11y.target-size",
};

export const DEFAULT_SPACE_SCALE = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128];
