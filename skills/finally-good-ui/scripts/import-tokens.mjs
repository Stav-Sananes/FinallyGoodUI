#!/usr/bin/env node
// Import an existing design system's tokens as our standard token set.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { loadTokens, dtcgFiles, formatJson } from "./lib/token-files.mjs";
import { placeTokens, fillMissingGroups, deepMerge, studioSets, isStudioMultiSet } from "./lib/token-import.mjs";

const SR = join(dirname(fileURLToPath(import.meta.url)), "..");

const HELP = `
Usage: import-tokens.mjs --in <file> [--in <file>…] [--dark <file>…] [--out-dir .design] [--name tokens] [--force]
                         [--set a,b] [--dark-set c] [--no-defaults] [--root <dir>]

Reads design tokens from:
  - Figma's native variable export: one DTCG file per mode (--in light.json --dark dark.json)
  - Tokens Studio, legacy {value, type} or DTCG mode; a multi-set file's sets come from
    $metadata.tokenSetOrder (sets named *dark* become the dark theme; override with --set / --dark-set)
  - any DTCG file or *.resolver.json (Terrazzo, Style Dictionary sources, finally-good-ui)
and writes <name>.json, <name>.dark.json and <name>.resolver.json (DTCG 2025.10) into --out-dir.

Each token goes to one of our groups by its $type and the words in its path (colors, spacing, radii,
fontSizes, motion…); references and simple math ("{spacing.sm} * 2") are resolved, seconds become
ms, single font names become lists. Prints a report: unmapped tokens (with the reason), the colour
roles still missing (background, foreground, primary…: add them as aliases of imported colours),
and the groups copied from the defaults because the import had none (colours never are).

Options:
  --in <file>       a token file; repeat to merge several (later files win)
  --dark <file>     dark-mode values (a second Figma mode file); repeatable
  --set <a,b>       Tokens Studio: the sets that make the light/base theme
  --dark-set <a,b>  Tokens Studio: the sets layered on top for dark
  --out-dir <dir>   default .design
  --name <stem>     default tokens
  --force           overwrite an existing token set
  --no-defaults     don't fill missing groups from the defaults
`;

const list = (v) => (v == null ? [] : (Array.isArray(v) ? v : [v]).flatMap((x) => String(x).split(",")).map((x) => x.trim()).filter(Boolean));

function readJson(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch (e) { throw new UsageError(`cannot read ${file}: ${e.message}`); }
}

/** The base and dark trees from the --in / --dark files (resolvers and Tokens Studio sets unpacked). */
function sources(files, darkFiles, flags) {
  let base = {}, dark = null, sets;
  for (const f of files) {
    if (f.endsWith(".resolver.json")) {
      try { base = deepMerge(base, loadTokens(f)); } catch (e) { throw new UsageError(e.message); }
      continue;
    }
    const doc = readJson(f);
    if (isStudioMultiSet(doc)) {
      sets = studioSets(doc, { base: flags.set ? list(flags.set) : undefined, dark: flags["dark-set"] ? list(flags["dark-set"]) : undefined });
      const missing = [...sets.base, ...sets.dark].filter((s) => !(s in doc));
      if (missing.length) throw new UsageError(`no token set named ${missing.join(", ")} in ${f}`);
      base = sets.base.reduce((t, s) => deepMerge(t, doc[s]), base);
      if (sets.dark.length) dark = sets.dark.reduce((t, s) => deepMerge(t, doc[s]), dark ?? {});
    } else base = deepMerge(base, doc);
  }
  for (const f of darkFiles) dark = deepMerge(dark ?? {}, readJson(f));
  return { base, dark, sets };
}

export function importTokens({ files, darkFiles = [], outDir, name = "tokens", force = false, defaults = true, flags = {} }) {
  const { base, dark, sets } = sources(files, darkFiles, flags);
  let placed;
  try { placed = placeTokens(base, dark); } catch (e) { throw new UsageError(e.message); }
  const filledFromDefaults = defaults ? fillMissingGroups(placed.tokens, loadTokens(join(SR, "tokens", "default.tokens.resolver.json"))) : [];
  const out = dtcgFiles(placed.tokens, name);
  const taken = Object.keys(out).filter((f) => existsSync(join(outDir, f)));
  if (taken.length && !force) throw new UsageError(`${taken.join(", ")} already exist in ${outDir}; pass --force to overwrite`);
  mkdirSync(outDir, { recursive: true });
  for (const [file, content] of Object.entries(out)) writeFileSync(join(outDir, file), formatJson(content));
  const counts = Object.fromEntries(Object.entries(placed.tokens).map(([g, toks]) => [g, Object.keys(toks).filter((k) => !k.startsWith("$")).length]));
  return { tool: "import-tokens", outDir, written: Object.keys(out), ...(sets ? { sets } : {}), counts,
    unmapped: placed.unmapped, missingRoles: placed.missingRoles, filledFromDefaults };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["in", "dark", "out-dir", "name", "set", "dark-set", "root"], boolean: ["force", "no-defaults"], multiple: ["in", "dark"] },
    main: ({ flags }) => {
      const root = flags.root || ".";
      const files = list(flags.in).map((f) => resolve(root, f));
      if (!files.length) throw new UsageError("--in <file> is required");
      return importTokens({ files, darkFiles: list(flags.dark).map((f) => resolve(root, f)), outDir: resolve(root, flags["out-dir"] || ".design"),
        name: flags.name || "tokens", force: flags.force, defaults: !flags["no-defaults"], flags });
    },
  });
}
