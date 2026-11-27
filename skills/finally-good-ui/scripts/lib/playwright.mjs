// Playwright is the USER's dependency: resolve it from their project (--root), never from this plugin.
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** import() of `name` as the project at `root` resolves it. Rejects when it does not. */
export async function importFromProject(root, name) {
  const req = createRequire(join(resolve(root), "package.json"));
  return import(pathToFileURL(req.resolve(name)).href);
}

/** The project's playwright (the full package or @playwright/test; playwright-core alone does not count), or null. */
export async function loadPlaywright(root) {
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      const m = await importFromProject(root, name);
      const pw = m.chromium ? m : m.default;
      if (pw?.chromium) return pw;
    } catch { /* try the next one */ }
  }
  return null;
}
