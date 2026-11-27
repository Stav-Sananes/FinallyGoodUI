// The scaffolded component CSS keys every rule on a bare [data-part] / [data-part="root"], which is only
// correct when one component owns the page. In a real app all eight stylesheets are global and collide,
// so this adds [data-c="<name>"] next to each data-part selector (idempotent). Components put
// data-c="<name>" on every part they render.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const dir = new URL("../src/components/fgu/", import.meta.url).pathname;
for (const name of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const file = join(dir, name, `${name}.css`);
  const css = readFileSync(file, "utf8");
  if (css.includes("/* scoped:")) continue;
  const scoped = css.replace(/\[data-part(="[^"]*")?\](?!\[data-c)/g, (_, v = "") => `[data-part${v}][data-c="${name}"]`);
  writeFileSync(file, `/* scoped: [data-c="${name}"] added by scripts/scope-fgu-css.mjs */\n${scoped}`);
  console.log("scoped", name);
}
