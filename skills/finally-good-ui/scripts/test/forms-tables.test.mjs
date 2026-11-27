import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { run, tmp, SR } from "./_h.mjs";
import { detectStack } from "../detect-stack.mjs";

// Forms and tables: which library renders them decides where the recipes' markup and the tokens go.
const DEF = join(SR, "tokens", "default.tokens.json");
const profile = (deps) => { const d = tmp(); writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps })); return detectStack(d); };

test("forms: the form library and the schema library, each or neither", () => {
  assert.deepEqual(profile({ "react-hook-form": "7.92.0", "@hookform/resolvers": "5.0.0", zod: "4.6.7" }).forms, { lib: "react-hook-form", schema: "zod" });
  assert.deepEqual(profile({ "@tanstack/react-form": "1.33.5", valibot: "1.5.0" }).forms, { lib: "tanstack-form", schema: "valibot" });
  assert.deepEqual(profile({ "@conform-to/react": "1.21.3", "@conform-to/zod": "1.21.3", zod: "4.6.7" }).forms, { lib: "conform", schema: "zod" });
  assert.deepEqual(profile({ "vee-validate": "4.15.1", yup: "1.6.0" }).forms, { lib: "vee-validate", schema: "yup" });
  assert.deepEqual(profile({ "sveltekit-superforms": "3.1.0", arktype: "2.2.9" }).forms, { lib: "superforms", schema: "arktype" });
  assert.deepEqual(profile({ formik: "2.4.9" }).forms, { lib: "formik", schema: null });
  assert.deepEqual(profile({ zod: "4.6.7" }).forms, { lib: null, schema: "zod" });
  assert.equal(profile({}).forms, null);
});

test("tables: the grid or table library", () => {
  assert.equal(profile({ "@tanstack/react-table": "9.3.1" }).tables, "tanstack-table");
  assert.equal(profile({ "ag-grid-react": "36.3.0", "ag-grid-community": "36.3.0" }).tables, "ag-grid");
  assert.equal(profile({ "@mui/x-data-grid": "9.18.0" }).tables, "mui-x-data-grid");
  assert.equal(profile({}).tables, null);
});

test("emit --format ag-grid: a Quartz theme whose params point at our variables, so dark mode follows", () => {
  const r = run("emit-tokens.mjs", ["--in", DEF, "--format", "ag-grid"]);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /import \{ themeQuartz \} from "ag-grid-community";/);
  assert.match(r.stdout, /export const gridTheme = themeQuartz\.withParams\(\{/);
  for (const [param, value] of [["accentColor", "var(--color-primary)"], ["backgroundColor", "var(--color-background)"],
    ["foregroundColor", "var(--color-foreground)"], ["borderColor", "var(--color-border)"], ["headerTextColor", "var(--color-muted-foreground)"],
    ["fontFamily", "var(--font-sans)"], ["fontSize", "var(--text-sm)"], ["spacing", "var(--space-2)"], ["borderRadius", "var(--radius-md)"],
    ["browserColorScheme", "inherit"]]) {
    assert.match(r.stdout, new RegExp(`${param}: "${value.replace(/[()]/g, "\\$&")}"`), param);
  }
});
