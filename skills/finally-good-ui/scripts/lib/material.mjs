// Material 3 mapping shared by the Flutter and Jetpack Compose emitters: which of our roles fills each
// ColorScheme slot, which roles stay outside it, and which text step each typography role uses.
import { parseDimension, textMetrics } from "./tokens.mjs";

// ColorScheme slot -> our role. surfaceTint is set transparent by each emitter, so Material doesn't wash
// surfaces in primary.
export const SCHEME = [
  ["primary", "primary"], ["onPrimary", "primary-foreground"],
  ["secondary", "accent"], ["onSecondary", "accent-foreground"],
  ["secondaryContainer", "accent"], ["onSecondaryContainer", "accent-foreground"],
  ["error", "destructive"], ["onError", "destructive-foreground"],
  ["surface", "background"], ["onSurface", "foreground"],
  ["surfaceContainerLowest", "card"], ["surfaceContainerLow", "card"], ["surfaceContainer", "card"],
  ["surfaceContainerHigh", "card"], ["surfaceContainerHighest", "muted"],
  ["onSurfaceVariant", "muted-foreground"], ["outline", "input"], ["outlineVariant", "border"], ["scrim", "overlay"],
];
const REQUIRED_SLOTS = ["primary", "onPrimary", "secondary", "onSecondary", "error", "onError", "surface", "onSurface"];
// Kept outside the scheme too: component themes read card and border directly, and muted is a fill.
const ALSO_EXTENDED = new Set(["muted", "card", "border"]);

// Material text role -> our text step.
export const TEXT_ROLES = [
  ["displayLarge", "6xl"], ["displayMedium", "5xl"], ["displaySmall", "4xl"],
  ["headlineLarge", "3xl"], ["headlineMedium", "2xl"], ["headlineSmall", "xl"],
  ["titleLarge", "lg"], ["titleMedium", "base"], ["titleSmall", "sm"],
  ["bodyLarge", "lg"], ["bodyMedium", "base"], ["bodySmall", "sm"],
  ["labelLarge", "sm"], ["labelMedium", "xs"], ["labelSmall", "xs"],
];

/**
 * Split the colour rows for Material: slots [[slot, row]] filled from our roles, and extended rows
 * (roles without a slot, plus card/border/muted). Throws naming any role a required slot needs.
 */
export function materialColors(rows) {
  const colors = rows.filter((r) => r.group === "color");
  const byName = new Map(colors.map((r) => [r.name, r]));
  const roleOf = (slot) => SCHEME.find(([s]) => s === slot)[1];
  const missing = REQUIRED_SLOTS.map(roleOf).filter((role) => !byName.has(role));
  if (missing.length) throw new Error(`Material's ColorScheme needs the roles ${[...new Set(missing)].join(", ")}`);
  const slots = SCHEME.filter(([, role]) => byName.has(role)).map(([slot, role]) => [slot, byName.get(role)]);
  const inScheme = new Set(slots.map(([, r]) => r.name));
  const extended = colors.filter((r) => !inScheme.has(r.name) || ALSO_EXTENDED.has(r.name));
  return { slots, extended };
}

/** Per text step: size (px), line-height (px, or null) and letter-spacing (px) for that size. */
export function textStepMetrics(rows) {
  return new Map(rows.filter((r) => r.group === "text").map((r) => {
    const size = parseDimension(r.light)?.value;
    const m = Object.fromEntries(textMetrics(r.token).map((x) => [x.suffix, x.value]));
    const ls = parseDimension(m["letter-spacing"] ?? "");
    const ratio = m["line-height"] != null ? Number(m["line-height"]) : null;
    return [r.name, {
      size, lineHeightRatio: ratio, lineHeight: ratio == null ? null : Math.round(ratio * size * 10) / 10,
      letterSpacing: ls ? Math.round((ls.unit === "em" ? ls.value * size : ls.value) * 100) / 100 : 0,
    }];
  }));
}
