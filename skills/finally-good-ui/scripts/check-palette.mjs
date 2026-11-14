#!/usr/bin/env node
// Check the categorical chart palette (color.chart-1…N) in both themes.
import { resolve } from "node:path";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadTokens } from "./lib/token-files.mjs";
import { flatten } from "./lib/tokens.mjs";
import { paletteIssues, MIN_CONTRAST, MIN_DISTANCE, CVD_SAFE_COUNT } from "./lib/palette.mjs";

const HELP = `
Usage: check-palette.mjs --in <tokens.json> [--root <dir>]

Checks the chart series colours (color.chart-1, chart-2, …) against color.background, in light
and in dark:
  - every series has at least ${MIN_CONTRAST}:1 contrast with the background (WCAG 1.4.11);
  - every pair of series is at least ${MIN_DISTANCE} apart in OKLab for normal vision, and the first
    ${CVD_SAFE_COUNT} also under simulated protanopia, deuteranopia and tritanopia.
Prints {ok, series, issues}. Problems are findings (exit 0); a token set without chart colours or
a background is a usage error (exit 2).

Options:
  --in <file>   tokens file or *.resolver.json (relative to --root)
  --root <dir>  default: cwd
`;

const seriesIndex = (name) => Number(name.match(/^chart-(\d+)$/)?.[1]);

/** {ok, series, issues} for the chart colours of a token set. */
export function checkPalette(tokens) {
  const colors = flatten(tokens).filter((r) => r.group === "color");
  const background = colors.find((r) => r.name === "background");
  const series = colors.filter((r) => seriesIndex(r.name)).sort((a, b) => seriesIndex(a.name) - seriesIndex(b.name));
  if (!series.length) throw new UsageError("no chart colours (color.chart-1, chart-2, …) in this token set");
  if (!background) throw new UsageError("no color.background to check the chart colours against");
  const issues = [...paletteIssues(series.map((r) => r.light), background.light, "light ")];
  if (series.some((r) => r.dark != null)) {
    issues.push(...paletteIssues(series.map((r) => r.dark ?? r.light), background.dark ?? background.light, "dark "));
  }
  return { tool: "check-palette", ok: issues.length === 0, series: series.length, issues };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["in", "root"] },
    main: ({ flags }) => {
      if (!flags.in) throw new UsageError("--in <tokens.json> is required");
      let tokens;
      try { tokens = loadTokens(resolve(flags.root || ".", flags.in)); } catch (e) { throw new UsageError(e.message); }
      return checkPalette(tokens);
    },
  });
}
