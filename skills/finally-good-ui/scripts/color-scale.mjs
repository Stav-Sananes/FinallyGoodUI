#!/usr/bin/env node
// Print a tonal colour scale built from one seed colour.
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { colorScale, PRESETS } from "./lib/ramp.mjs";

const HELP = `
Usage: color-scale.mjs <colour> [--preset tailwind|mantine|radix|fluent] [--name <role>] [--format json|css]

Builds a tonal scale in OKLCH from one seed colour (any CSS colour), for component kits that
want a scale per colour instead of semantic pairs:
  tailwind  50 100 … 900 950   (also Prime, Chakra/Panda, Skeleton, Nuxt UI, Flowbite)
  mantine   0 … 9
  radix     1 … 12, the seed always on 9 (Radix Themes custom colours)
  fluent    10 … 160, dark to light (Fluent UI BrandVariants)
The seed sits exactly on its nearest step (radix: on 9); every other step is clamped to sRGB.

Options:
  --preset <name>   default tailwind
  --name <role>     css only: variable prefix, --color-<role>-<step> (default primary)
  --format <fmt>    json (default) or css
`;

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["preset", "name", "format"] },
    main: ({ flags, positionals }) => {
      if (positionals.length !== 1) throw new UsageError("give exactly one seed colour");
      const preset = flags.preset || "tailwind";
      if (!PRESETS[preset]) throw new UsageError(`unknown --preset ${preset} (use ${Object.keys(PRESETS).join("|")})`);
      let scale;
      try { scale = colorScale(positionals[0], preset); } catch (e) { throw new UsageError(e.message); }
      if ((flags.format || "json") === "json") return scale;
      if (flags.format !== "css") throw new UsageError(`unknown --format ${flags.format} (use json|css)`);
      const role = flags.name || "primary";
      return `:root {\n${Object.entries(scale.steps).map(([k, v]) => `  --color-${role}-${k}: ${v};`).join("\n")}\n}`;
    },
  });
}
