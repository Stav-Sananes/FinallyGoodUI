#!/usr/bin/env node
// `npx finally-good-ui check [dir]`: the plugin's static UI checks (accessibility, motion,
// tokens, AI-slop tells) as a standalone command for people and CI.
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, UsageError } from "../skills/finally-good-ui/scripts/lib/cli.mjs";
import { checkStatic } from "../skills/finally-good-ui/scripts/check-static.mjs";
import { formatText, formatGithub, failsAt, FAIL_LEVELS } from "../skills/finally-good-ui/scripts/lib/report.mjs";

const HELP = `
Usage: finally-good-ui check [dir] [options]

Scans a project's UI source (css, scss, js, ts/tsx, jsx, vue, svelte, html, astro) for
accessibility, motion and design-token problems and for the tells of AI-generated UI
(dead links, placeholder content, buzzword copy, gradient text, glass and glow overuse...).
Skips node_modules, build output, tests and configs.

Options:
  --format text|json|github   output (default: text). github prints workflow commands,
                              so findings appear as annotations on the pull request
  --fail-on high|medium|low|none
                              exit 1 when a finding at or above this severity exists
                              (default: high)
  --files a,b                 check only these files (relative to dir)
  --tokens <tokens.json>      use this file's space scale for spacing checks
  --version, --help

Exit codes: 0 passed, 1 findings at or above --fail-on, 2 usage error.
The full design pipeline lives in the Claude Code plugin: https://github.com/Stav-Sananes/FinallyGoodUI
`;

const FORMATS = ["text", "json", "github"];

function version() {
  const pkg = new URL("../package.json", import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(pkg), "utf8")).version;
}

function oneOf(name, value, allowed) {
  if (!allowed.includes(value)) throw new UsageError(`--${name} must be one of ${allowed.join(", ")} (got "${value}")`);
  return value;
}

function check({ flags, positionals }) {
  if (positionals.length > 1) throw new UsageError(`check takes one directory (got ${positionals.join(" ")})`);
  const dir = positionals[0] || ".";
  const format = oneOf("format", flags.format || "text", FORMATS);
  const failOn = oneOf("fail-on", flags["fail-on"] || "high", FAIL_LEVELS);
  const files = flags.files ? flags.files.split(",").map((s) => s.trim()).filter(Boolean) : null;
  const result = checkStatic(dir, { files, tokens: flags.tokens });
  const rootFromCwd = relative(process.cwd(), resolve(dir)) || ".";
  const output = format === "json" ? JSON.stringify(result, null, 2) + "\n"
    : format === "github" ? formatGithub(result, rootFromCwd)
    : formatText(result);
  return { output, failed: failsAt(result.summary, failOn) };
}

function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h" || command === "help") return { output: HELP.trimStart(), failed: false };
  if (command === "--version" || command === "-v") return { output: version() + "\n", failed: false };
  if (command !== "check") throw new UsageError(`unknown command "${command}"`);
  const args = parseArgs(rest, { string: ["format", "fail-on", "files", "tokens"] });
  if (args.flags.help) return { output: HELP.trimStart(), failed: false };
  return check(args);
}

try {
  const { output, failed } = main(process.argv.slice(2));
  process.stdout.write(output);
  process.exitCode = failed ? 1 : 0;
} catch (e) {
  if (!(e instanceof UsageError)) throw e;
  process.stderr.write(`error: ${e.message}\n\n${HELP.trim()}\n`);
  process.exitCode = 2;
}
