#!/usr/bin/env node
// Write a component (CSS from the style profile, a framework file, behaviour) into the project.
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { runCli, isMain, UsageError } from "./lib/cli.mjs";
import { detectStack } from "./detect-stack.mjs";
import { loadSpec } from "./lib/component-spec.mjs";
import { validateProfile } from "./lib/style-profile.mjs";
import { planScaffold, COMPONENTS_ROOT } from "./lib/scaffold.mjs";
import { readJson, exists } from "./lib/fs.mjs";
import { buildGallery, galleryComponents } from "./lib/gallery.mjs";
import { loadTokens } from "./lib/token-files.mjs";
import { emitCss } from "./emit-tokens.mjs";

const HELP = `
Usage: scaffold-component.mjs --name <component> [--root <dir>] [--framework <name>] [--force] [--dry-run]
       scaffold-component.mjs --gallery [--root <dir>] [--dry-run]

Writes <components dir>/<name>/ into the project: <name>.css (the style profile applied to the
component), one framework file (.tsx/.jsx, .vue, .svelte, .component.ts + .html, or plain .html),
<name>.behaviour.js (only when no installed primitive supplies the behaviour) and
.fgu-component.json. Reads .design/component-style.json. Components dir: src/components/fgu, or fgu
under the shadcn components alias. <name>.css is the reference CSS followed by the profile layer;
the profile layer comes last and overrides border, border-radius, min-height, padding-inline and
transition on purpose. A re-run refreshes the files the scaffold wrote and nobody edited (the marker keeps their
hashes) and skips the edited ones; --force overwrites everything it plans.

--gallery writes .design/components.html: every reference component on one static page, styled with
the style profile and the project's tokens (.design/tokens.json, else the skill defaults). Open it
as a file; component-smoke.mjs and the probe can drive it.

Options:
  --gallery            write the component gallery instead of one component
  --name <component>   a component under components/ (e.g. button)
  --root <dir>         project root (default: cwd)
  --framework <name>   override the detected framework (react, vue, svelte, angular, html ...)
  --force              overwrite every planned file, edited ones included
  --dry-run            print the plan, write nothing
`;

const PROFILE = ".design/component-style.json";
const GALLERY = ".design/components.html";
const DEFAULT_TOKENS = join(COMPONENTS_ROOT, "..", "tokens", "default.tokens.json");

function readProfile(root) {
  const file = join(root, PROFILE);
  if (!exists(file)) throw new UsageError(`missing ${PROFILE} in ${root}: the style profile is chosen in the design interview`);
  const profile = readJson(file);
  if (profile === null) throw new UsageError(`${PROFILE}: not valid JSON`);
  const { ok, errors } = validateProfile(profile);
  if (!ok) throw new UsageError(`${PROFILE}: invalid\n${errors.join("\n")}`);
  return profile;
}

function writeGallery(root, dryRun) {
  const profile = readProfile(root);
  const own = join(root, ".design/tokens.json");
  let tokens;
  try { tokens = loadTokens(exists(own) ? own : DEFAULT_TOKENS); } catch (e) { throw new UsageError(`tokens: ${e.message}`); }
  const components = galleryComponents();
  if (!dryRun) {
    mkdirSync(join(root, ".design"), { recursive: true });
    writeFileSync(join(root, GALLERY), buildGallery({ profile, tokensCss: emitCss(tokens), components }));
  }
  return { tool: "scaffold-component", gallery: GALLERY, tokens: exists(own) ? ".design/tokens.json" : "skill defaults", components };
}

if (isMain(import.meta.url)) {
  runCli({
    help: HELP,
    spec: { string: ["name", "root", "framework"], boolean: ["force", "dry-run", "gallery"] },
    main: ({ flags }) => {
      if (flags.gallery) return writeGallery(flags.root || ".", Boolean(flags["dry-run"]));
      if (!flags.name) throw new UsageError("--name is required");
      const root = flags.root || ".";
      let spec;
      try { spec = loadSpec(join(COMPONENTS_ROOT, flags.name)); } catch (e) { throw new UsageError(`unknown or invalid component "${flags.name}": ${e.message}`); }
      const profile = readProfile(root);
      const stack = detectStack(root);
      if (flags.framework) stack.framework = flags.framework;
      const plan = planScaffold({ spec, stack, profile, root, force: Boolean(flags.force) });
      if (!flags["dry-run"]) {
        for (const f of plan.files) {
          if (f.skipped) continue;
          mkdirSync(join(root, f.path, ".."), { recursive: true });
          writeFileSync(join(root, f.path), f.content);
        }
      }
      return { tool: "scaffold-component", source: plan.source, files: plan.files.map(({ path, skipped }) => (skipped ? { path, skipped } : { path })), notes: plan.notes };
    },
  });
}
