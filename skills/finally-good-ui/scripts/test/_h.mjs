import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const SCRIPTS = join(HERE, "..");
export const SR = join(HERE, "..", "..");
export const fx = (name) => join(HERE, "fx", name);
export const tmp = () => mkdtempSync(join(tmpdir(), "fgu-"));

export function run(script, args = [], opts = {}) {
  const r = spawnSync(process.execPath, [join(SCRIPTS, script), ...args], { encoding: "utf8", ...opts });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* not json */ }
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, json };
}
