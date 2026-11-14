import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run, tmp } from "./_h.mjs";

// Detectors for Web Interface Guidelines rules that were missing: typography of copy, input
// ergonomics, image layout shift and locale formatting. Each gets a positive and a negative case.
function scan(files) {
  const d = tmp();
  for (const [f, text] of Object.entries(files)) { mkdirSync(join(d, f, ".."), { recursive: true }); writeFileSync(join(d, f), text); }
  const r = run("check-static.mjs", ["--root", d]);
  assert.equal(r.code, 0, r.stderr);
  return r.json.findings;
}
const rules = (findings, rule) => findings.filter((f) => f.rule === rule);

test("ellipsis-dots: three periods in interface copy, not in code or real ellipses", () => {
  const f = scan({ "src/A.tsx": `export const A = () => (<div>
  <button>Saving...</button>
  <p>Loading…</p>
  <span>{items.map((x) => [...x])}</span>
</div>);
const msg = "Rename...";
` });
  const hits = rules(f, "ellipsis-dots");
  assert.deepEqual(hits.map((h) => h.line), [2, 6]);
  assert.equal(hits[0].card, "writing.typographic-punctuation");
});

test("paste-blocked: preventDefault or return false on paste", () => {
  const f = scan({
    "src/A.tsx": `export const A = () => <input onPaste={(e) => e.preventDefault()} />;\nexport const B = () => <input onPaste={trimPaste} />;\n`,
    "index.html": `<input type="password" onpaste="return false">\n<script>code.addEventListener("paste", (e) => { e.preventDefault(); });</script>\n`,
  });
  const hits = rules(f, "paste-blocked");
  assert.deepEqual(hits.map((h) => `${h.file}:${h.line}`).sort(), ["index.html:1", "index.html:2", "src/A.tsx:1"]);
  assert.equal(hits[0].severity, "high");
  assert.equal(hits[0].card, "flows-forms.input-ergonomics");
});

test("autofocus: flagged on page fields, not inside a dialog or popover, nor on an editor shown after a click", () => {
  const f = scan({ "src/A.tsx": `export const A = () => (<form>
  <input autoFocus name="q" />
  <dialog open><input autoFocus name="title" /></dialog>
  <div popover="auto"><input type="checkbox" autoFocus /></div>
  {renaming ? (<input autoFocus value={name} />) : <span>{name}</span>}
  {editing && <input autoFocus />}
</form>);
export function Login() {
  const label = error ? "Try again" : "Sign in";
  return (<form><input type="password" autoFocus /></form>);
}
` });
  assert.deepEqual(rules(f, "autofocus").map((h) => h.line), [2, 10], "a conditional elsewhere in the component doesn't exempt a page field");
});

test("spellcheck-on-codes: username, one-time-code and code fields without spellcheck off", () => {
  const f = scan({ "src/A.tsx": `export const A = () => (<form>
  <input name="username" autoComplete="username" />
  <input autoComplete="one-time-code" inputMode="numeric" spellCheck={false} />
  <input name="otp" />
  <input type="email" name="email" />
  <input name="title" />
</form>);
` });
  assert.deepEqual(rules(f, "spellcheck-on-codes").map((h) => h.line), [2, 4]);
});

test("img-no-dimensions: native <img> without width and height, unless sized by aspect or fill", () => {
  const f = scan({ "src/A.tsx": `export const A = () => (<div>
  <img src="/a.jpg" alt="Team at the offsite" />
  <img src="/b.jpg" alt="" width={640} height={360} />
  <img src="/c.jpg" alt="" className="aspect-video w-full object-cover" />
  <Image src="/d.jpg" alt="" fill />
</div>);
` });
  const hits = rules(f, "img-no-dimensions");
  assert.deepEqual(hits.map((h) => h.line), [2]);
  assert.equal(hits[0].card, "states.loading-perceived");
});

test("locale-format: dates formatted with no locale, and hard-coded day/month patterns (numbers in the browser locale are fine)", () => {
  const f = scan({ "src/dates.ts": `export const a = (d: Date) => d.toLocaleDateString();
export const b = (d: Date) => d.toLocaleDateString(locale, { dateStyle: "medium" });
export const c = (d: Date) => format(d, "MM/dd/yyyy");
export const e = (d: Date) => dayjs(d).format("DD.MM.YYYY");
export const g = (n: number) => n.toLocaleString();
export const h = (d: Date) => d.toISOString();
` });
  const hits = rules(f, "locale-format");
  assert.deepEqual(hits.map((h) => h.line), [1, 3, 4]);
  assert.equal(hits[0].card, "i18n.locale-formats");
});
