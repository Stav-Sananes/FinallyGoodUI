// Tiny CLI helpers shared by every script: flag parsing, --help, JSON output,
// usage errors (exit 2). Findings are never errors.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export class UsageError extends Error {}

/**
 * spec: { string: ["root", ...], boolean: ["write", ...] }
 * Returns { flags, positionals }. Throws UsageError on unknown flags / missing values.
 */
export function parseArgs(argv, spec = {}) {
  const strings = new Set(spec.string || []);
  const bools = new Set(["help", ...(spec.boolean || [])]);
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h") { flags.help = true; continue; }
    if (!a.startsWith("--") || a === "--") { positionals.push(a); continue; }
    let [name, value] = a.slice(2).split(/=(.*)/s, 2);
    if (bools.has(name)) {
      flags[name] = value === undefined ? true : !/^(false|0|no)$/i.test(value);
    } else if (strings.has(name)) {
      if (value === undefined) {
        value = argv[++i];
        if (value === undefined) throw new UsageError(`missing value for --${name}`);
      }
      flags[name] = value;
    } else {
      throw new UsageError(`unknown flag --${name}`);
    }
  }
  return { flags, positionals };
}

export const printJson = (obj) => process.stdout.write(JSON.stringify(obj, null, 2) + "\n");

/** True when the module at `url` is the process entry point. */
export function isMain(url) {
  if (!process.argv[1]) return false;
  try { return url === pathToFileURL(resolve(process.argv[1])).href; } catch { return false; }
}

/**
 * Run a CLI: parse args, print help, map UsageError to exit 2.
 * main({flags, positionals}) may return an object (printed as JSON) or a string (printed raw).
 */
export async function runCli({ help, spec, main }) {
  try {
    const args = parseArgs(process.argv.slice(2), spec);
    if (args.flags.help) { process.stdout.write(help.trim() + "\n"); return; }
    const out = await main(args);
    if (typeof out === "string") process.stdout.write(out.endsWith("\n") ? out : out + "\n");
    else if (out !== undefined) printJson(out);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`error: ${e.message}\n\n${help.trim()}\n`);
      process.exitCode = 2;
      return;
    }
    throw e;
  }
}
