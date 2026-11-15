// Flutter theme from a token set: Material 3 ThemeData for light and dark, whose ColorScheme takes our
// roles, a ThemeExtension (AppColors) for the theme-dependent colours Material has no slot for, and
// constants for what doesn't change with the theme (AppSpace, AppRadius, AppMotion). Colours are sRGB
// (Flutter's Color), sizes logical pixels, line-height a multiplier, letter-spacing in pixels.
import { flatten, groupTokens, parseDimension, parseDuration, parseEasing, textMetrics, fontLoad } from "./tokens.mjs";
import { parseColor } from "./contrast.mjs";

/** Flutter Color literal: Color(0xAARRGGBB). */
export function dartColor(css) {
  const c = parseColor(css);
  if (!c) throw new Error(`cannot convert colour ${css} to sRGB`);
  const hex = (x) => Math.round(x * 255).toString(16).padStart(2, "0").toUpperCase();
  return `Color(0x${hex(c.a)}${hex(c.r)}${hex(c.g)}${hex(c.b)})`;
}

/** Dart identifier for a token name: "primary-foreground" -> primaryForeground, "4" -> s4, "1.5" -> s1_5. */
export function dartName(name, numericPrefix = "s") {
  const id = name.replace(/\./g, "_").replace(/-(\w)/g, (_, c) => c.toUpperCase());
  return /^\d/.test(id) ? `${numericPrefix}${id}` : id;
}
const dbl = (n) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// ColorScheme slot -> our role. surfaceTint is transparent so Material doesn't wash surfaces in primary.
const SCHEME = [
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

// Material text role -> our text step (sizes, line-height and letter-spacing come from the step).
const TEXT_ROLES = [
  ["displayLarge", "6xl"], ["displayMedium", "5xl"], ["displaySmall", "4xl"],
  ["headlineLarge", "3xl"], ["headlineMedium", "2xl"], ["headlineSmall", "xl"],
  ["titleLarge", "lg"], ["titleMedium", "base"], ["titleSmall", "sm"],
  ["bodyLarge", "lg"], ["bodyMedium", "base"], ["bodySmall", "sm"],
  ["labelLarge", "sm"], ["labelMedium", "xs"], ["labelSmall", "xs"],
];

function textStyles(rows) {
  const steps = new Map(rows.filter((r) => r.group === "text").map((r) => {
    const size = parseDimension(r.light)?.value;
    const m = Object.fromEntries(textMetrics(r.token).map((x) => [x.suffix, x.value]));
    const ls = parseDimension(m["letter-spacing"] ?? "");
    const args = [`fontSize: ${dbl(size)}`];
    if (m["line-height"] != null) args.push(`height: ${dbl(Number(m["line-height"]))}`);
    if (ls) args.push(`letterSpacing: ${dbl(Math.round((ls.unit === "em" ? ls.value * size : ls.value) * 100) / 100)}`);
    return [r.name, `TextStyle(${args.join(", ")})`];
  }));
  return TEXT_ROLES.filter(([, step]) => steps.has(step)).map(([role, step]) => `  ${role}: ${steps.get(step)},`);
}

export function emitFlutter(tokens) {
  const rows = flatten(tokens);
  const colors = rows.filter((r) => r.group === "color");
  const byName = new Map(colors.map((r) => [r.name, r]));
  const missing = REQUIRED_SLOTS.filter((slot) => !byName.has(SCHEME.find(([s]) => s === slot)[1]));
  if (missing.length) throw new Error(`Flutter's ColorScheme needs the roles ${missing.map((s) => SCHEME.find(([x]) => x === s)[1]).join(", ")}`);
  const schemeSlots = SCHEME.filter(([, role]) => byName.has(role));
  const inScheme = new Set(schemeSlots.map(([, role]) => role));
  // Also kept here: the roles the component themes below read directly (card, border) and muted fills.
  const extra = colors.filter((r) => !inScheme.has(r.name) || ["muted", "card", "border"].includes(r.name));
  const scheme = (pick, brightness) => [`ColorScheme(`, `  brightness: Brightness.${brightness},`,
    ...schemeSlots.map(([slot, role]) => `  ${slot}: ${dartColor(pick(byName.get(role)))},`),
    "  surfaceTint: Color(0x00000000),", ")"].join("\n");
  const ext = (pick) => `AppColors(\n${extra.map((r) => `  ${dartName(r.name)}: ${dartColor(pick(r))},`).join("\n")}\n)`;
  const fields = extra.map((r) => dartName(r.name));
  const font = rows.find((r) => r.group === "font" && r.name === "sans" && fontLoad(r.token));
  const family = font ? [].concat(font.token.$value)[0] : null;
  const consts = (group, cls, doc) => {
    const items = rows.filter((r) => r.group === group && parseDimension(r.light));
    return `/// ${doc}\nabstract final class ${cls} {\n${items.map((r) => `  static const double ${dartName(r.name)} = ${dbl(parseDimension(r.light).value)};`).join("\n")}\n}`;
  };
  const radiusMd = parseDimension(rows.find((r) => r.group === "radius" && r.name === "md")?.light ?? "")?.value ?? 8;
  const durations = [...groupTokens(tokens?.duration)].map(([n, t]) => [dartName(n), parseDuration(t.$value)?.value]).filter(([, v]) => v != null);
  const curves = [...groupTokens(tokens?.easing)].map(([n, t]) => [dartName(n), parseEasing(t.$value)]).filter(([, v]) => v);

  return `// generated by finally-good-ui emit-tokens.mjs (--format flutter); edit the tokens, not this file.
// lib/theme/app_theme.dart. Use:
//   MaterialApp(theme: AppTheme.light, darkTheme: AppTheme.dark, themeMode: ThemeMode.system, ...)
//   Theme.of(context).colorScheme.primary      roles Material has a slot for
//   Theme.of(context).extension<AppColors>()!  the rest (success, warning, chart1..., overlay...)
//   AppSpace.s4, AppRadius.md, AppMotion.duration(context, AppMotion.standard), AppMotion.move
${family ? `// Font: register "${family}" (pubspec.yaml fonts, or google_fonts) under that family name.\n` : ""}// Flutter 3.47+ also ships Material as package:material_ui; this import works on every version.
// ignore: deprecated_member_use
import 'package:flutter/material.dart';

/// Theme-dependent colours Material's ColorScheme has no slot for. Read with \`Theme.of(context).extension<AppColors>()!\`.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
${fields.map((f) => `    required this.${f},`).join("\n")}
  });

${fields.map((f) => `  final Color ${f};`).join("\n")}

  @override
  AppColors copyWith({
${fields.map((f) => `    Color? ${f},`).join("\n")}
  }) {
    return AppColors(
${fields.map((f) => `      ${f}: ${f} ?? this.${f},`).join("\n")}
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
${fields.map((f) => `      ${f}: Color.lerp(${f}, other.${f}, t)!,`).join("\n")}
    );
  }
}

${consts("space", "AppSpace", "Spacing in logical pixels (the 4-based scale).")}

${consts("radius", "AppRadius", "Corner radii in logical pixels.")}

/// Durations and easing curves. Movement goes to zero when the platform asks for reduced motion.
abstract final class AppMotion {
${durations.map(([n, v]) => `  static const Duration ${n} = Duration(milliseconds: ${Math.round(v)});`).join("\n")}
${curves.map(([n, p]) => `  static const Curve ${n} = Cubic(${p.map(dbl).join(", ")});`).join("\n")}

  /// The duration for a movement (slide, scale, size): Duration.zero under reduced motion. Fades may keep theirs.
  static Duration duration(BuildContext context, Duration movement) =>
      MediaQuery.disableAnimationsOf(context) ? Duration.zero : movement;
}

const TextTheme _textTheme = TextTheme(
${textStyles(rows).join("\n")}
);

ThemeData _theme(ColorScheme scheme, AppColors colors) {
  final radius = BorderRadius.circular(${dbl(radiusMd)}); // radius.md: controls and cards
  final shape = RoundedRectangleBorder(borderRadius: radius);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,${family ? `\n    fontFamily: ${JSON.stringify(family)},` : ""}
    scaffoldBackgroundColor: scheme.surface,
    textTheme: _textTheme.apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface),
    cardTheme: CardThemeData(color: colors.card, elevation: 0, shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: colors.border))),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(shape: shape)),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(shape: shape)),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(shape: shape)),
    inputDecorationTheme: InputDecorationTheme(border: OutlineInputBorder(borderRadius: radius)),
    dividerTheme: DividerThemeData(color: colors.border, space: 1, thickness: 1),
    extensions: <ThemeExtension<dynamic>>[colors],
  );
}

/// Light and dark themes from the design tokens.
abstract final class AppTheme {
  static final ThemeData light = _theme(
${indent(scheme((r) => r.light, "light"), 4)},
${indent(ext((r) => r.light), 4)},
  );

  static final ThemeData dark = _theme(
${indent(scheme((r) => r.dark ?? r.light, "dark"), 4)},
${indent(ext((r) => r.dark ?? r.light), 4)},
  );
}
`;
}

const indent = (text, n) => text.split("\n").map((l) => " ".repeat(n) + l).join("\n");
