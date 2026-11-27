// Presenters for check-static results: plain text for people, GitHub workflow
// commands for CI annotations. Pure functions; the CLI decides where output goes.
import { posix } from "node:path";

export const SEVERITIES = ["high", "medium", "low"];
export const FAIL_LEVELS = [...SEVERITIES, "none"];

/** Does the summary contain a finding at or above `threshold`? */
export function failsAt(summary, threshold) {
  if (threshold === "none") return false;
  const cutoff = SEVERITIES.indexOf(threshold);
  return SEVERITIES.slice(0, cutoff + 1).some((s) => summary[s] > 0);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function formatText({ findings, summary, files }) {
  if (!findings.length) return `No findings in ${plural(files, "file")}.\n`;
  const lineWidth = Math.max(...findings.map((f) => String(f.line ?? "").length));
  const ruleWidth = Math.max(...findings.map((f) => f.rule.length));
  const out = [];
  let current = null;
  for (const f of findings) {
    if (f.file !== current) {
      if (current !== null) out.push("");
      out.push(f.file);
      current = f.file;
    }
    const line = String(f.line ?? "").padStart(lineWidth);
    out.push(`  ${line}  ${f.severity.padEnd(6)}  ${f.rule.padEnd(ruleWidth)}  ${f.message} (${f.card})`);
  }
  const counts = SEVERITIES.map((s) => `${summary[s]} ${s}`).join(", ");
  out.push("", `${plural(findings.length, "finding")} (${counts}) in ${plural(files, "file")}.`);
  return out.join("\n") + "\n";
}

const COMMAND = { high: "error", medium: "warning", low: "notice" };
// https://docs.github.com/actions/reference/workflow-commands-for-github-actions
const escapeData = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (s) => escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** `root` is the scanned directory as given on the command line, so paths resolve from the repo root. */
export function formatGithub({ findings }, root = ".") {
  return findings.map((f) => {
    const file = posix.normalize(posix.join(root.replace(/\\/g, "/"), f.file));
    const props = [`file=${escapeProperty(file)}`];
    if (f.line != null) props.push(`line=${f.line}`);
    props.push(`title=${escapeProperty(`${f.rule} (${f.card})`)}`);
    return `::${COMMAND[f.severity]} ${props.join(",")}::${escapeData(f.message)}`;
  }).join("\n") + (findings.length ? "\n" : "");
}
