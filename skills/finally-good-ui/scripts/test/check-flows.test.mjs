import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, cpSync, symlinkSync, utimesSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, extname } from 'node:path';
import { inflateSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import {
  parseArgs, normalizeViewport, buildMatrix, parseFlows, pagesToFlows, shotFile, mockFor,
  resolveUrl, axeToFindings, aggregate, safeName, tokensForProbe, selectorPlan, PROBE_PATH,
  normalizeTheme, contextsFor, themeInitArg, applyThemeQuery, flowHash, selectVariants,
  needsRerun, runPool, findPrevReport, DEFAULT_CONCURRENCY,
} from '../check-flows.mjs';
import { fx, tmp, SCRIPTS } from './_h.mjs';

test('parseArgs reads flags and splits pages', () => {
  const o = parseArgs(['--url', 'http://localhost:3000', '--pages', '/, /settings', '--no-axe', '--timeout', '5000']);
  assert.equal(o.url, 'http://localhost:3000');
  assert.deepEqual(o.pages, ['/', '/settings']);
  assert.equal(o.axe, false);
  assert.equal(o.focus, true);
  assert.equal(o.timeout, 5000);
});

test('parseArgs: speed + selection flags, 5 s action default, valueless --changed', () => {
  const d = parseArgs([]);
  assert.equal(d.timeout, 5000);
  assert.equal(d.navTimeout, 15000);
  assert.equal(d.concurrency, DEFAULT_CONCURRENCY);
  assert.ok(DEFAULT_CONCURRENCY >= 1 && DEFAULT_CONCURRENCY <= 4);
  const o = parseArgs(['--concurrency', '2', '--only', 'board, board.empty,home', '--changed', '--no-axe', '--nav-timeout', '30000', '--max-sleep', '100']);
  assert.equal(o.concurrency, 2);
  assert.deepEqual(o.only, ['board', 'board.empty', 'home']);
  assert.equal(o.changed, true); // did not swallow --no-axe
  assert.equal(o.axe, false);
  assert.equal(o.navTimeout, 30000);
  assert.equal(o.maxSleep, 100);
  assert.equal(parseArgs(['--changed', 'r0']).changed, 'r0');
  assert.equal(parseArgs(['--concurrency', '0']).concurrency, DEFAULT_CONCURRENCY);
});

test('normalizeViewport accepts number, WxH string and object', () => {
  assert.deepEqual(normalizeViewport(375), { width: 375, height: 812 });
  assert.deepEqual(normalizeViewport(1440), { width: 1440, height: 900 });
  assert.deepEqual(normalizeViewport([1440, 900]), { width: 1440, height: 900 });
  assert.deepEqual(normalizeViewport('768x1024'), { width: 768, height: 1024 });
  assert.deepEqual(normalizeViewport({ width: 390 }), { width: 390, height: 812 });
  assert.throws(() => normalizeViewport('wide'));
});

test('buildMatrix: viewports x schemes + one reduced-motion pass', () => {
  const m = buildMatrix({});
  assert.equal(m.length, 5);
  assert.deepEqual(m.map((c) => c.id), ['375-light', '375-dark', '1440-light', '1440-dark', '375-light-rm']);
  assert.equal(m[0].touch, true);
  assert.equal(m[2].touch, false);
  assert.equal(m.filter((c) => c.reducedMotion === 'reduce').length, 1);
  assert.equal(buildMatrix({ viewports: [320, 768, 1280] }).length, 7);
  assert.equal(buildMatrix({ viewports: [[375, 812], [1440, 900]] })[4].id, '375-light-rm');
});

test('parseFlows normalises steps, appends end screenshot, validates', () => {
  const [f] = parseFlows({ flows: [{ name: 'Sign Up', steps: [{ goto: '/signup' }, { fill: ['#email', 'a@b.co'] }, { press: 'Enter' }, { waitFor: 300 }],
    states: { route: '**/api/x', mock: 'empty' } }] });
  assert.equal(f.name, 'sign-up');
  assert.deepEqual(f.steps[1], { type: 'fill', arg: { selector: '#email', value: 'a@b.co' } });
  assert.deepEqual(f.steps[2].arg, { key: 'Enter' });
  assert.deepEqual(f.steps[3].arg, { ms: 300 });
  assert.deepEqual(f.steps.at(-1), { type: 'screenshot', arg: 'end' });
  assert.equal(f.states[0].name, 'empty');
  assert.throws(() => parseFlows([]), /non-empty/);
  assert.throws(() => parseFlows([{ name: 'a', steps: [{ click: 'b' }] }]), /first step must be goto/);
  assert.throws(() => parseFlows([{ name: 'a', steps: [{ goto: '/', click: 'x' }] }]), /exactly one/);
  assert.throws(() => parseFlows([{ name: 'a', steps: [{ goto: '/' }], states: [{ route: '*', mock: 'weird' }] }]), /mock/);
  assert.throws(() => parseFlows([{ name: 'a', steps: [{ goto: '/' }] }, { name: 'A', steps: [{ goto: '/' }] }]), /duplicate/);
});

test('pagesToFlows makes one goto+screenshot flow per page', () => {
  const fl = pagesToFlows(['/', '/settings/profile']);
  assert.deepEqual(fl.map((f) => f.name), ['home', 'settings_profile']);
  assert.equal(fl[0].steps.length, 2);
});

test('shotFile and safeName build the documented path', () => {
  const ctx = buildMatrix({})[4];
  assert.equal(shotFile('r1', 'signup', 'empty', 'sent', ctx).replace(/\\/g, '/'), '.design/reports/shots/r1/signup.empty-sent-375-light-rm.png');
  assert.equal(safeName('  Hello World!! '), 'hello-world');
});

test('mockFor maps states to responses', () => {
  assert.deepEqual(mockFor({ mock: 'empty' }), { status: 200, body: [], delayMs: 0 });
  assert.equal(mockFor({ mock: 'error' }).status, 500);
  assert.equal(mockFor({ mock: 'forbidden' }).status, 403);
  assert.equal(mockFor({ mock: 'slow', delayMs: 100 }).delayMs, 100);
  assert.deepEqual(mockFor({ mock: 'empty', body: { items: [] } }).body, { items: [] });
});

test('resolveUrl joins relative paths and keeps absolute ones', () => {
  assert.equal(resolveUrl('http://localhost:3000', '/a'), 'http://localhost:3000/a');
  assert.equal(resolveUrl('http://localhost:3000/app/', 'b'), 'http://localhost:3000/app/b');
  assert.equal(resolveUrl('http://x', 'https://y/z'), 'https://y/z');
});

test('axeToFindings and aggregate dedupe across contexts', () => {
  const ax = axeToFindings([{ id: 'color-contrast', impact: 'serious', help: 'Contrast', nodes: [{ target: ['.btn'] }] }]);
  assert.equal(ax[0].severity, 'high');
  assert.equal(ax[0].card, 'a11y.contrast-minimums');
  const agg = aggregate([
    { flow: 'f', step: 's', context: '375-light', findings: ax },
    { flow: 'f', step: 's', context: '375-dark', findings: [...ax, { rule: 'small-target', severity: 'low', selector: 'a' }] },
  ]);
  assert.equal(agg.findings.length, 2);
  assert.deepEqual(agg.findings[0].contexts, ['f/s@375-light', 'f/s@375-dark']);
  assert.deepEqual(agg.summary, { high: 1, medium: 0, low: 1 });
});

test('tokensForProbe pulls colours (incl. dark) and spacing in px', () => {
  const t = tokensForProbe({
    color: { background: { $type: 'color', $value: 'oklch(0.99 0 0)', $extensions: { fgu: { dark: 'oklch(0.15 0 0)' } } }, ring: { $value: '{color.primary}' } },
    space: { '2': { $type: 'dimension', $value: '8px' }, '4': { $value: '1rem' }, '6': { $value: { value: 24, unit: 'px' } } },
    radius: { md: { $value: '6px' } },
  });
  assert.deepEqual(t.colors, ['oklch(0.99 0 0)', 'oklch(0.15 0 0)']);
  assert.deepEqual(t.spacing, [0, 8, 16, 24]);
});

test('selectorPlan maps sugar prefixes to getBy* and passes others through', () => {
  assert.deepEqual(selectorPlan('label=Client'), ['getByLabel', 'Client']);
  assert.deepEqual(selectorPlan('placeholder="Search"'), ['getByPlaceholder', 'Search']);
  assert.deepEqual(selectorPlan('role=button[name="Save"]'), ['locator', 'role=button[name="Save"]']);
  assert.deepEqual(selectorPlan('#email'), ['locator', '#email']);
});

test('probe.js is self-contained and defines __fguProbe', () => {
  const src = readFileSync(PROBE_PATH, 'utf8');
  assert.doesNotMatch(src, /\bimport\s|require\(/);
  assert.match(src, /window\.__fguProbe\s*=/);
  new Function(src); // parses
});

test('normalizeTheme: media-only default, validated attribute/class/storage/query config', () => {
  const d = normalizeTheme(undefined);
  assert.deepEqual([d.media, d.schemes, d.default, d.target], [true, ['light', 'dark'], 'light', 'html']);
  assert.deepEqual(normalizeTheme('media'), d);
  const t = normalizeTheme({ schemes: ['dark', 'light'], attribute: 'data-mode', values: { dark: 'night' }, storage: 'k', media: false });
  assert.equal(t.default, 'dark');
  assert.equal(t.media, false);
  assert.deepEqual(t.values, { light: 'light', dark: 'night' });
  assert.throws(() => normalizeTheme({ schemes: ['sepia'] }), /schemes/);
  assert.throws(() => normalizeTheme({ schemes: ['dark'], default: 'light' }), /default/);
  assert.throws(() => normalizeTheme({ target: 'main' }), /target/);
  assert.throws(() => normalizeTheme({ class: 3 }), /class/);
  assert.throws(() => normalizeTheme([]), /object/);
});

test('buildMatrix/contextsFor follow theme schemes and default (dark-first, dark-only)', () => {
  const dark = { viewports: [375, 1440], theme: { schemes: ['dark', 'light'] } };
  const m = buildMatrix(dark);
  assert.deepEqual(m.map((c) => c.id), ['375-dark', '375-light', '1440-dark', '1440-light', '375-dark-rm']);
  const th = normalizeTheme(dark.theme);
  assert.deepEqual(contextsFor(m, th, { name: 'empty' }).map((c) => c.id), ['375-dark', '1440-dark']);
  assert.equal(contextsFor(m, th, null).length, 5);
  assert.deepEqual(buildMatrix({ viewports: [375], theme: { schemes: ['dark'] } }).map((c) => c.id), ['375-dark', '375-dark-rm']);
  // default config unchanged: states stay in light
  const m0 = buildMatrix({});
  assert.deepEqual(contextsFor(m0, normalizeTheme(), {}).map((c) => c.id), ['375-light', '1440-light']);
});

test('themeInitArg and applyThemeQuery map a scheme onto the page', () => {
  assert.equal(themeInitArg(normalizeTheme(), 'dark'), null); // media only: nothing injected
  const t = normalizeTheme({ class: 'dark', lightClass: 'light', storage: 'theme', values: { dark: 'midnight' }, target: 'body' });
  assert.deepEqual(themeInitArg(t, 'dark'), { target: 'body', attribute: null, cls: 'dark', lightCls: 'light', storage: 'theme', value: 'midnight', dark: true });
  assert.equal(themeInitArg(t, 'light').dark, false);
  const q = normalizeTheme({ query: 'theme' });
  assert.equal(applyThemeQuery('http://x/?theme=system#/rota', q, 'dark'), 'http://x/?theme=dark#/rota');
  assert.equal(applyThemeQuery('http://x/a?b=1', q, 'light'), 'http://x/a?b=1&theme=light');
  assert.equal(applyThemeQuery('http://x/a', normalizeTheme(), 'dark'), 'http://x/a');
});

const LONG = { name: 'buy', steps: [{ goto: '/' }, { waitFor: 'text=Items' }, { screenshot: 'list' }, { click: 'text=A' }, { screenshot: 'detail' }, { click: 'text=Pay' }, { screenshot: 'paid' }] };

test('statePlan: states replay only up to the first screen by default (soft waits); goto/steps/stateSteps jump straight there', () => {
  const [f] = parseFlows([{ ...LONG, states: [
    { name: 'err', route: '**/api', mock: 'error' },
    { name: 'deep', route: '**/api', mock: 'empty', until: 'detail' },
    { name: 'all', route: '**/api', mock: 'empty', until: 'end' },
    { name: 'jump', goto: '/?state=empty', waitFor: 'text=Nothing yet' },
    { name: 'own', mock: 'slow', route: '**/api', steps: [{ goto: '/detail' }, { screenshot: 'Detail' }] },
    { name: 'seeded', localStorage: { cart: [] } },
  ] }]);
  const by = Object.fromEntries(f.states.map((s) => [s.name, s]));
  assert.deepEqual(by.err.plan.map((s) => s.type), ['goto', 'waitFor', 'screenshot']);
  assert.equal(by.err.soft, true);
  assert.equal(by.deep.plan.at(-1).arg, 'detail');
  assert.equal(by.all.plan.length, LONG.steps.length);
  assert.deepEqual(by.jump.plan, [{ type: 'goto', arg: '/?state=empty' }, { type: 'waitFor', arg: { selector: 'text=Nothing yet' } }, { type: 'screenshot', arg: 'list' }]);
  assert.equal(by.jump.soft, false);
  assert.deepEqual(by.own.plan.map((s) => s.arg), ['/detail', 'detail']);
  assert.equal(by.seeded.plan.length, 3); // init/localStorage-only state replays to the first screen
  assert.throws(() => parseFlows([{ ...LONG, states: [{ route: '*', mock: 'empty', until: 'nope' }] }]), /until: no screenshot step named "nope"/);
  const [g] = parseFlows([{ ...LONG, stateSteps: [{ goto: '/list?fast=1' }], states: [{ route: '*', mock: 'error' }] }]);
  assert.deepEqual(g.states[0].plan.map((s) => s.arg), ['/list?fast=1', 'end']);
  assert.equal(g.states[0].soft, false);
});

test('parseFlows: state forcing rules, safe state names, flow hooks validated, hash tracks the definition', () => {
  assert.throws(() => parseFlows([{ ...LONG, states: [{ name: 'x' }] }]), /route \+ mock .* or goto/);
  assert.throws(() => parseFlows([{ ...LONG, states: [{ route: '**/a' }] }]), /route without mock/);
  assert.throws(() => parseFlows([{ ...LONG, states: [{ mock: 'error' }] }]), /needs route \+ mock/);
  assert.throws(() => parseFlows([{ ...LONG, states: [{ mock: 'error', route: '*' }, { mock: 'error', route: '*/b' }] }]), /duplicate state name error/);
  assert.throws(() => parseFlows([{ ...LONG, localStorage: [1] }]), /localStorage must be an object/);
  assert.throws(() => parseFlows([{ ...LONG, init: 42 }]), /init: expected a JS string/);
  const [f] = parseFlows([{ ...LONG, ready: '#app[data-ready]', states: [{ name: 'Empty Board!', mock: 'empty', route: '*' }] }]);
  assert.equal(f.states[0].name, 'empty-board');
  assert.equal(f.ready, '#app[data-ready]');
  assert.equal(f.hash, flowHash({ ...LONG, ready: '#app[data-ready]', states: [{ name: 'Empty Board!', mock: 'empty', route: '*' }] }));
  assert.notEqual(flowHash(LONG), flowHash({ ...LONG, steps: LONG.steps.slice(0, 3) }));
});

test('selectVariants: --only by flow, flow.state or screen; unknown names reported', () => {
  const flows = parseFlows([{ ...LONG, states: [{ name: 'empty', route: '*', mock: 'empty' }] }, { name: 'about', steps: [{ goto: '/about' }, { screenshot: 'about' }] }]);
  assert.deepEqual(selectVariants(flows).run.map((v) => v.id), ['buy', 'buy.empty', 'about']);
  assert.deepEqual(selectVariants(flows, { only: ['buy'] }).run.map((v) => v.id), ['buy', 'buy.empty']);
  assert.deepEqual(selectVariants(flows, { only: ['buy.empty'] }).run.map((v) => [v.id, v.shots]), [['buy.empty', null]]);
  const byShot = selectVariants(flows, { only: ['detail', 'about'] });
  assert.deepEqual(byShot.run.map((v) => v.id), ['buy', 'about']); // the empty state stops at "list"
  assert.deepEqual([...byShot.run[0].shots], ['detail']);
  assert.equal(byShot.run[1].shots, null);
  assert.deepEqual(selectVariants(flows, { only: ['nope', 'about'] }).unknown, ['nope']);
});

test('needsRerun/selectVariants with a previous report: changed, new, failing and high/medium variants re-run; clean ones carry', () => {
  const flows = parseFlows([
    { ...LONG, states: [{ name: 'empty', route: '*', mock: 'empty' }, { name: 'error', route: '*', mock: 'error' }] },
    { name: 'about', steps: [{ goto: '/about' }, { screenshot: 'about' }] },
    { name: 'help', steps: [{ goto: '/help' }, { screenshot: 'help' }] },
  ]);
  const [buy, about, help] = flows;
  const prev = { run: 'r0', flowHashes: { buy: buy.hash, about: 'stale', help: help.hash },
    results: [
      { flow: 'buy', state: null, findings: [{ severity: 'low' }] },
      { flow: 'buy', state: 'empty', findings: [{ severity: 'medium' }] },
      { flow: 'about', state: null, findings: [] },
      { flow: 'help', state: null, findings: [] },
    ],
    errors: [{ flow: 'buy', state: 'error' }] };
  assert.equal(needsRerun(prev, buy, null), false);       // low only
  assert.equal(needsRerun(prev, buy, buy.states[0]), true); // medium finding
  assert.equal(needsRerun(prev, buy, buy.states[1]), true); // errored
  assert.equal(needsRerun(prev, about, null), true);      // definition changed
  assert.equal(needsRerun(prev, help, null), false);
  assert.equal(needsRerun({ ...prev, results: [], errors: [] }, help, null), true); // never ran
  assert.equal(needsRerun({ results: [{ flow: 'help', state: null, findings: [] }] }, help, null), false); // old report, no hashes
  const sel = selectVariants(flows, { prev });
  assert.deepEqual(sel.run.map((v) => v.id), ['buy.empty', 'buy.error', 'about']);
  assert.deepEqual(sel.carried.map((v) => v.id), ['buy', 'help']);
});

test('runPool keeps input order and never exceeds the concurrency bound', async () => {
  let live = 0, peak = 0;
  const out = await runPool([30, 5, 20, 1, 10, 2], 3, async (ms, i) => {
    live++; peak = Math.max(peak, live);
    await new Promise((r) => setTimeout(r, ms));
    live--; return i;
  });
  assert.deepEqual(out, [0, 1, 2, 3, 4, 5]);
  assert.equal(peak, 3);
  assert.deepEqual(await runPool([], 4, async () => 1), []);
});

test('findPrevReport: by run id, by path, or newest check-flows report (ignoring other json)', () => {
  const root = tmp(), dir = join(root, '.design', 'reports');
  mkdirSync(dir, { recursive: true });
  const rep = (run) => JSON.stringify({ tool: 'check-flows', run, results: [] });
  writeFileSync(join(dir, 'r0.json'), rep('r0'));
  writeFileSync(join(dir, 'r1.json'), rep('r1'));
  writeFileSync(join(dir, 'history.json'), '{"rounds":[]}');
  writeFileSync(join(dir, 'r1.stdout.json'), '{"tool":"check-flows","run":"r1"}');
  const t = Date.now() / 1000;
  utimesSync(join(dir, 'r0.json'), t - 30, t - 30);
  utimesSync(join(dir, 'r1.json'), t - 20, t - 20);
  utimesSync(join(dir, 'r1.stdout.json'), t, t);
  utimesSync(join(dir, 'history.json'), t, t);
  assert.equal(findPrevReport(root, null).report.run, 'r1');
  assert.equal(findPrevReport(root, 'r0').report.run, 'r0');
  assert.equal(findPrevReport(root, '.design/reports/r0.json').report.run, 'r0');
  assert.equal(findPrevReport(root, 'history'), null);
  assert.equal(findPrevReport(tmp(), null), null);
});

// ---- end to end in chromium (skipped unless playwright resolves; set FGU_PLAYWRIGHT_ROOT) ----
function playwrightRoot() {
  for (const r of [process.env.FGU_PLAYWRIGHT_ROOT, process.cwd()].filter(Boolean)) {
    try { createRequire(join(r, 'noop.js')).resolve('playwright'); return r; } catch { /* next */ }
  }
  return null;
}

// Top-left pixel of a PNG. The first pixel of the first scanline is raw under every PNG filter type.
function firstPixel(file) {
  const b = readFileSync(file);
  const idat = [];
  for (let o = 8; o < b.length;) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8);
    if (type === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  return [raw[1], raw[2], raw[3]];
}

function serve(dir) {
  const TYPES = { '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.js': 'text/javascript' };
  const srv = createServer((req, res) => {
    const p = new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html');
    try { const body = readFileSync(join(dir, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'text/plain' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

function runCf(args) {
  return new Promise((r) => {
    const c = spawn(process.execPath, [join(SCRIPTS, 'check-flows.mjs'), ...args]);
    let out = '';
    c.stdout.on('data', (d) => { out += d; });
    c.on('close', (code) => { let json = null; try { json = JSON.parse(out); } catch { /* not json */ } r({ code, json, out }); });
  });
}

test('check-flows in chromium: theme via storage (dark-first), state jumps, soft replay, --only, parallel order', async (t) => {
  const pwRoot = playwrightRoot();
  if (!pwRoot) return t.skip('playwright not resolvable (set FGU_PLAYWRIGHT_ROOT)');
  const root = tmp();
  cpSync(fx('flows'), root, { recursive: true });
  symlinkSync(join(pwRoot, 'node_modules'), join(root, 'node_modules'));
  const srv = await serve(root);
  const url = `http://127.0.0.1:${srv.address().port}`;
  try {
    const a = await runCf(['--root', root, '--url', url, '--flows', '.design/flows.json', '--run', 'r1', '--no-axe', '--no-focus', '--concurrency', '3']);
    if (a.json && a.json.error === 'browser-missing') return t.skip('chromium not installed');
    assert.equal(a.code, 0, a.out);
    const rep = JSON.parse(readFileSync(join(root, '.design/reports/r1.json'), 'utf8'));
    assert.deepEqual(rep.matrix, ['375-dark', '375-light', '375-dark-rm']);
    assert.deepEqual(rep.errors, []);
    // canonical order despite 3 parallel contexts: base flow per context x step, then each state
    assert.deepEqual(rep.results.map((r) => `${r.state || '-'}/${r.step}@${r.context}`), [
      '-/list@375-dark', '-/detail@375-dark', '-/list@375-light', '-/detail@375-light', '-/list@375-dark-rm', '-/detail@375-dark-rm',
      'error/list@375-dark', 'empty/list@375-dark']);
    const err = rep.results.find((r) => r.state === 'error');
    assert.match(err.notes[0], /state error left the replayed path at step 2 \(waitFor \{"selector":"text=Apple"\}\)/);
    const shot = (r) => firstPixel(join(root, r.screenshot));
    const px = Object.fromEntries(rep.results.filter((r) => !r.state && r.step === 'list').map((r) => [r.context, shot(r)]));
    assert.ok(px['375-dark'].every((v) => v < 40), `dark canvas, got ${px['375-dark']}`);
    assert.ok(px['375-light'].every((v) => v > 215), `light canvas, got ${px['375-light']}`);
    assert.equal(rep.flowHashes.browse.length, 12);

    // negative control: media emulation alone cannot light up a dark-by-default app
    const b = await runCf(['--root', root, '--url', url, '--flows', '.design/flows.json', '--run', 'r2', '--no-axe', '--no-focus',
      '--config', '.design/config-media.json', '--only', 'list']);
    assert.equal(b.code, 0, b.out);
    const rep2 = JSON.parse(readFileSync(join(root, '.design/reports/r2.json'), 'utf8'));
    assert.ok(rep2.results.every((r) => r.step === 'list'), '--only by screen captures only that screen');
    assert.deepEqual(rep2.selection.ran, ['browse', 'browse.error', 'browse.empty']);
    const light = rep2.results.find((r) => !r.state && r.context === '375-light');
    assert.ok(shot(light).every((v) => v < 40), 'without theme config the "light" pass is still dark');

    // --changed: nothing changed, so only variants with errors or high/medium findings re-run; the rest carry over
    const c = await runCf(['--root', root, '--url', url, '--flows', '.design/flows.json', '--run', 'r3', '--no-axe', '--no-focus', '--changed', 'r1']);
    assert.equal(c.code, 0, c.out);
    const rep3 = JSON.parse(readFileSync(join(root, '.design/reports/r3.json'), 'utf8'));
    assert.equal(rep3.results.length, rep.results.length);
    const hm = new Set(rep.results.filter((r) => r.findings.some((f) => f.severity !== 'low')).map((r) => r.state ? `browse.${r.state}` : 'browse'));
    assert.deepEqual(new Set(rep3.selection.ran), hm);
    assert.ok(rep3.results.filter((r) => r.carried).every((r) => r.carried === 'r1'));
  } finally { srv.close(); }
});
