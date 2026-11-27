// Type-system tightening (rubric dim 3: at most 6 sizes, 3 weights).
// Sizes 12 · 13 · 14 · 16 · 24 · 40; weights 400 · 600 · 800.
const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "index.src.html");
let s = fs.readFileSync(p, "utf8");
const swap = (a, b) => {
  if (!s.includes(a)) throw new Error("missing: " + a);
  s = s.split(a).join(b);
};
swap("--text-xs: 11px;", "--text-xs: 12px;");
swap("--text-sm: 12px;", "--text-sm: 12px; /* same step as xs: one size for meta and micro text */");
swap("--text-xl: 20px;", "--text-xl: 24px; /* merged with 2xl: section and dialog titles share the title step */");
swap("font-weight: 500", "font-weight: 400");
swap("font-weight: 700", "font-weight: 800");
swap("font-size: 9px; font-weight: 800;", "font-size: var(--text-xs); font-weight: 600;");
swap("inline-size: 20px; block-size: 20px; border-radius: 50%;", "inline-size: 24px; block-size: 24px; border-radius: 50%;");
swap("minmax(0, 1fr) auto 20px 48px;", "minmax(0, 1fr) auto 24px 48px;");
swap("minmax(0, 1fr) auto 20px 56px;", "minmax(0, 1fr) auto 24px 56px;");
swap("minmax(0, 1fr) 20px 48px; }", "minmax(0, 1fr) 24px 48px; }");
swap(".app .row { grid-template-columns: var(--tag-w) minmax(0, 1fr) 20px;", ".app .row { grid-template-columns: var(--tag-w) minmax(0, 1fr) 24px;");
swap(".activity .cm { display: grid; grid-template-columns: 20px minmax(0, 1fr);", ".activity .cm { display: grid; grid-template-columns: 24px minmax(0, 1fr);");
swap(".skeleton li { display: grid; grid-template-columns: var(--tag-w) 64px minmax(0, 1fr) 20px;", ".skeleton li { display: grid; grid-template-columns: var(--tag-w) 64px minmax(0, 1fr) 24px;");
swap("JetBrains+Mono:wght@400;500", "JetBrains+Mono:wght@400");
fs.writeFileSync(p, s);
console.log("type patched");
