import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseArgs, normalizeViewport, buildMatrix, parseFlows, pagesToFlows, shotFile, mockFor,
  resolveUrl, axeToFindings, aggregate, safeName, tokensForProbe, selectorPlan, PROBE_PATH,
} from '../check-flows.mjs';

test('parseArgs reads flags and splits pages', () => {
  const o = parseArgs(['--url', 'http://localhost:3000', '--pages', '/, /settings', '--no-axe', '--timeout', '5000']);
  assert.equal(o.url, 'http://localhost:3000');
  assert.deepEqual(o.pages, ['/', '/settings']);
  assert.equal(o.axe, false);
  assert.equal(o.focus, true);
  assert.equal(o.timeout, 5000);
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
