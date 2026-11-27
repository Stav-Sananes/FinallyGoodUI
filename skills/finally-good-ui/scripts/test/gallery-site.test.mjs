import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { SR } from "./_h.mjs";

// The gallery site builder lives at the repo root (scripts/build-gallery-site.mjs); these are its guards.
const site = await import(join(SR, "../../scripts/build-gallery-site.mjs"));

test("--out: an empty value, the repo, its parents and the working directory are refused before anything is deleted", () => {
  const root = "/work/repo", cwd = "/work/repo/sub";
  for (const bad of ["", "  ", "/work/repo", "/work", "/", "/work/repo/sub", "/work/repo/"]) {
    assert.throws(() => site.outDir(bad, root, cwd), /--out/, JSON.stringify(bad));
  }
  assert.equal(site.outDir("/tmp/site", root, cwd), "/tmp/site", "positive control: a separate directory is fine");
  assert.equal(site.outDir("/work/repo/_site", root, cwd), "/work/repo/_site", "a folder inside the repo is fine");
  assert.equal(site.outDir(undefined, root, "/elsewhere"), "/work/repo/_site", "the default");
});

test("buildAll lets every build finish and reports all failures in one error", async () => {
  const done = [];
  const build = async (app) => {
    await new Promise((r) => setTimeout(r, app.ms));
    done.push(app.id);
    if (app.fail) throw new Error(`${app.id} broke`);
  };
  await assert.rejects(
    site.buildAll([{ id: "a", ms: 5, fail: true }, { id: "b", ms: 40 }, { id: "c", ms: 10, fail: true }], build),
    (e) => /2 app build\(s\) failed/.test(e.message) && /a broke/.test(e.message) && /c broke/.test(e.message),
  );
  assert.deepEqual(done.sort(), ["a", "b", "c"], "the slow build finished instead of being abandoned");
  await site.buildAll([{ id: "d", ms: 1 }], build); // positive control: no failure, no error
});
