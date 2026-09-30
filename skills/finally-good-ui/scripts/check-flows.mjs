#!/usr/bin/env node
// finally-good-ui: walk flows in a real browser across viewports x colour schemes (+1 reduced-motion pass),
// force UI states via request interception, run probe.js (+ axe if installed), screenshot every step.
// Imports `playwright` from the USER's project (no dependency of this plugin).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PROBE_PATH = join(HERE, 'browser', 'probe.js');
export const MOCKS = ['empty', 'error', 'slow', 'forbidden'];
const STEP_KEYS = ['goto', 'click', 'fill', 'press', 'hover', 'waitFor', 'screenshot'];

const HELP = `check-flows.mjs --url <base> [--flows .design/flows.json | --pages /,/settings] [options]
  --root <dir>       project root (default cwd); playwright is resolved from here
  --config <file>    default <root>/.design/config.json (viewports: [[375,812],[1440,900]] | [375] | ["375x812"] | [{width,height}])
  --run <id>         run id (default timestamp); shots -> .design/reports/shots/<run>/
  --no-axe           skip @axe-core/playwright even if installed
  --no-focus         skip the probe's focus walk
  --timeout <ms>     per-step timeout (default 15000)
  .design/tokens.json, if present, feeds the probe's off-token check (colour + space groups).
flows.json: {"flows":[{"name":"signup","steps":[{"goto":"/signup"},{"fill":["#email","a@b.co"]},
  {"click":"button[type=submit]"},{"waitFor":"text=Check your inbox"},{"screenshot":"sent"}],
  "states":[{"name":"empty","route":"**/api/items*","mock":"empty","body":[]}]}]}
  selectors: any Playwright selector (role=button[name="Save"], text=Save, css) + label=, placeholder=, testid=, alt=
  steps: goto <path|url> · click <sel> · fill [sel,value] | {selector,value} · press <key> | {selector,key}
         hover <sel> · waitFor <sel> | <ms> | {selector,state} · screenshot <name> (also runs probe + axe)
  states (object or array): mock empty|error|slow|forbidden, route = glob/URL pattern, optional body,
         status, delayMs. Base flow runs the full matrix; each state runs every viewport in light.
Exit: 0 done (see summary) · 1 bad input · 2 playwright/browser missing · 3 URL unreachable.`;

export function parseArgs(argv) {
  const o = { root: process.cwd(), axe: true, focus: true, timeout: 15000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = () => argv[++i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--no-axe') o.axe = false;
    else if (a === '--no-focus') o.focus = false;
    else if (a.startsWith('--')) o[a.slice(2)] = v();
  }
  if (o.pages) o.pages = String(o.pages).split(',').map((s) => s.trim()).filter(Boolean);
  o.timeout = Number(o.timeout) || 15000;
  return o;
}

export function normalizeViewport(v) {
  if (typeof v === 'number') return { width: v, height: v < 768 ? 812 : v < 1200 ? 1024 : 900 };
  if (Array.isArray(v) && v.length === 2) return { width: +v[0], height: +v[1] };
  if (typeof v === 'string' && /^\d+x\d+$/.test(v)) { const [w, h] = v.split('x').map(Number); return { width: w, height: h }; }
  if (v && typeof v === 'object' && v.width) return { width: +v.width, height: +(v.height || normalizeViewport(+v.width).height) };
  throw new Error(`bad viewport: ${JSON.stringify(v)}`);
}

export function buildMatrix(config = {}) {
  const vps = (config.viewports && config.viewports.length ? config.viewports : [375, 1440]).map(normalizeViewport);
  const m = [];
  for (const vp of vps) for (const scheme of ['light', 'dark']) m.push({ viewport: vp, colorScheme: scheme, reducedMotion: 'no-preference', touch: vp.width < 768 });
  m.push({ viewport: vps[0], colorScheme: 'light', reducedMotion: 'reduce', touch: vps[0].width < 768 });
  return m.map((c) => ({ ...c, id: `${c.viewport.width}-${c.colorScheme}${c.reducedMotion === 'reduce' ? '-rm' : ''}` }));
}

function normStep(s, where) {
  if (!s || typeof s !== 'object') throw new Error(`${where}: step must be an object`);
  const keys = Object.keys(s).filter((k) => STEP_KEYS.includes(k));
  if (keys.length !== 1) throw new Error(`${where}: step needs exactly one of ${STEP_KEYS.join('|')}`);
  const k = keys[0]; let v = s[k];
  if (k === 'fill') {
    v = Array.isArray(v) ? { selector: v[0], value: v[1] } : v;
    if (!v || !v.selector || v.value == null) throw new Error(`${where}: fill needs selector + value`);
  }
  if (k === 'press' && typeof v === 'string') v = { key: v };
  if (k === 'waitFor' && typeof v === 'string') v = { selector: v };
  if (k === 'waitFor' && typeof v === 'number') v = { ms: v };
  if (k === 'screenshot') v = safeName(String(v));
  return { type: k, arg: v };
}

export function parseFlows(input) {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  const list = Array.isArray(raw) ? raw : raw && raw.flows;
  if (!Array.isArray(list) || !list.length) throw new Error('flows: expected a non-empty array (or {flows:[...]})');
  const names = new Set();
  return list.map((f, i) => {
    if (!f || !f.name) throw new Error(`flows[${i}]: name required`);
    const name = safeName(f.name);
    if (names.has(name)) throw new Error(`flows[${i}]: duplicate name ${name}`);
    names.add(name);
    if (!Array.isArray(f.steps) || !f.steps.length) throw new Error(`${name}: steps required`);
    const steps = f.steps.map((s, j) => normStep(s, `${name}.steps[${j}]`));
    if (steps[0].type !== 'goto') throw new Error(`${name}: first step must be goto`);
    if (!steps.some((s) => s.type === 'screenshot')) steps.push({ type: 'screenshot', arg: 'end' });
    const states = (f.states ? [].concat(f.states) : []).map((st, j) => {
      if (!st.route || !MOCKS.includes(st.mock)) throw new Error(`${name}.states[${j}]: needs route + mock (${MOCKS.join('|')})`);
      return { name: safeName(st.name || st.mock), ...st };
    });
    return { name, steps, states };
  });
}

export function pagesToFlows(pages) {
  return parseFlows(pages.map((p) => ({ name: p === '/' ? 'home' : p.replace(/^\/+|\/+$/g, '').replace(/\//g, '_'), steps: [{ goto: p }, { screenshot: 'page' }] })));
}

export function safeName(s) { return String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'x'; }

export function shotFile(run, flow, state, step, ctx) {
  const f = state ? `${flow}.${state}` : flow;
  return join('.design', 'reports', 'shots', run, `${f}-${step}-${ctx.viewport.width}-${ctx.colorScheme}${ctx.reducedMotion === 'reduce' ? '-rm' : ''}.png`);
}

export function mockFor(state) {
  switch (state.mock) {
    case 'empty': return { status: state.status || 200, body: state.body ?? [], delayMs: 0 };
    case 'error': return { status: state.status || 500, body: state.body ?? { error: 'Internal Server Error' }, delayMs: 0 };
    case 'forbidden': return { status: state.status || 403, body: state.body ?? { error: 'Forbidden' }, delayMs: 0 };
    case 'slow': return { status: null, body: null, delayMs: state.delayMs || 4000 };
    default: throw new Error(`unknown mock ${state.mock}`);
  }
}

// .design/tokens.json (DTCG subset, spec 5.5) -> {colors:[css], spacing:[px]} for the probe's off-token check.
export function tokensForProbe(json, remPx = 16) {
  const colors = [], spacing = [0];
  const px = (v) => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'value' in v) return v.unit === 'rem' ? v.value * remPx : +v.value;
    const m = /^(-?[\d.]+)(px|rem)?$/.exec(String(v).trim());
    return m ? (m[2] === 'rem' ? +m[1] * remPx : +m[1]) : null;
  };
  const walk = (node, group) => {
    if (!node || typeof node !== 'object') return;
    if ('$value' in node) {
      if (group === 'color') {
        colors.push(node.$value);
        const dark = node.$extensions && node.$extensions.fgu && node.$extensions.fgu.dark;
        if (dark) colors.push(dark);
      } else if (group === 'space') { const n = px(node.$value); if (n != null) spacing.push(n); }
      return;
    }
    for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v, group || k);
  };
  walk(json, null);
  return { colors: [...new Set(colors.filter((c) => typeof c === 'string' && !c.startsWith('{')))], spacing: [...new Set(spacing)].sort((a, b) => a - b) };
}

export function resolveUrl(base, target) { return /^https?:\/\//.test(target) ? target : new URL(target, base.endsWith('/') ? base : base + '/').href; }

const AXE_SEV = { critical: 'high', serious: 'high', moderate: 'medium', minor: 'low' };
const AXE_CARD = { 'color-contrast': 'a11y.contrast-minimums', 'target-size': 'a11y.target-size', 'scrollable-region-focusable': 'a11y.keyboard-complete' };
export function axeToFindings(violations = []) {
  return violations.map((v) => ({ rule: `axe/${v.id}`, severity: AXE_SEV[v.impact] || 'medium', file: null, line: null,
    selector: v.nodes && v.nodes[0] ? [].concat(v.nodes[0].target).join(' ') : null,
    message: `${v.help} (${(v.nodes || []).length} nodes)`, card: AXE_CARD[v.id] || 'a11y.semantic-first' }));
}

export function aggregate(results) {
  const map = new Map(), summary = { high: 0, medium: 0, low: 0 };
  for (const r of results) for (const f of r.findings || []) {
    const k = `${f.rule}|${f.selector}`;
    if (!map.has(k)) { map.set(k, { ...f, contexts: [] }); summary[f.severity] = (summary[f.severity] || 0) + 1; }
    const c = `${r.flow}${r.state ? '.' + r.state : ''}/${r.step}@${r.context}`;
    if (!map.get(k).contexts.includes(c)) map.get(k).contexts.push(c);
  }
  const order = { high: 0, medium: 1, low: 2 };
  return { findings: [...map.values()].sort((a, b) => order[a.severity] - order[b.severity]), summary };
}

async function importFromProject(root, name) {
  const req = createRequire(join(resolve(root), 'package.json'));
  return import(pathToFileURL(req.resolve(name)).href);
}

async function loadPlaywright(root) {
  for (const n of ['playwright', '@playwright/test']) {
    try { const m = await importFromProject(root, n); const pw = m.chromium ? m : m.default; if (pw && pw.chromium) return pw; } catch { /* try next */ }
  }
  return null;
}

// Sugar on top of Playwright selectors: label=, placeholder=, testid=, alt= map to getBy* locators.
export function selectorPlan(sel) {
  const m = /^(label|placeholder|testid|alt)=(.+)$/.exec(sel);
  if (!m) return ['locator', sel];
  const arg = m[2].replace(/^"(.*)"$/, '$1');
  return [{ label: 'getByLabel', placeholder: 'getByPlaceholder', testid: 'getByTestId', alt: 'getByAltText' }[m[1]], arg];
}
const loc = (page, sel) => { const [fn, arg] = selectorPlan(sel); return page[fn](arg).first(); };

async function runStep(page, step, o, base) {
  const t = { timeout: o.timeout };
  switch (step.type) {
    case 'goto':
      await page.goto(resolveUrl(base, step.arg), { waitUntil: 'load', ...t });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      break;
    case 'click': await loc(page, step.arg).click(t); break;
    case 'hover': await loc(page, step.arg).hover(t); break;
    case 'fill': await loc(page, step.arg.selector).fill(String(step.arg.value), t); break;
    case 'press': step.arg.selector ? await loc(page, step.arg.selector).press(step.arg.key, t) : await page.keyboard.press(step.arg.key); break;
    case 'waitFor':
      if (step.arg.ms) await page.waitForTimeout(step.arg.ms);
      else await loc(page, step.arg.selector).waitFor({ state: step.arg.state || 'visible', ...t });
      break;
  }
}

async function capture(page, ctx, o, AxeBuilder) {
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(350);
  const probe = await page.evaluate((opts) => window.__fguProbe(opts), { touch: ctx.touch, focus: o.focus, tokens: o.tokens, reducedMotion: ctx.reducedMotion === 'reduce' });
  let axe = null;
  if (AxeBuilder) {
    try { const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze(); axe = r.violations; } catch (e) { axe = { error: e.message }; }
  }
  return { probe, axe };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) { console.log(HELP); return 0; }
  const out = (obj, code) => { console.log(JSON.stringify(obj, null, 2)); return code; };
  if (!o.url || (!o.flows && !o.pages)) return out({ tool: 'check-flows', error: 'bad-input', message: 'need --url and --flows or --pages', help: HELP }, 1);
  const root = resolve(o.root);
  const cfgPath = o.config ? resolve(root, o.config) : join(root, '.design', 'config.json');
  const config = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
  let flows;
  try { flows = o.pages ? pagesToFlows(o.pages) : parseFlows(readFileSync(resolve(root, o.flows), 'utf8')); }
  catch (e) { return out({ tool: 'check-flows', error: 'bad-flows', message: e.message }, 1); }
  const tokPath = join(root, '.design', 'tokens.json');
  if (existsSync(tokPath)) { try { o.tokens = tokensForProbe(JSON.parse(readFileSync(tokPath, 'utf8'))); } catch { /* ignore bad tokens */ } }

  const pw = await loadPlaywright(root);
  if (!pw) return out({ tool: 'check-flows', error: 'playwright-missing', fix: 'npm i -D playwright @axe-core/playwright && npx playwright install chromium' }, 2);
  let AxeBuilder = null;
  if (o.axe) { try { const m = await importFromProject(root, '@axe-core/playwright'); AxeBuilder = m.AxeBuilder || m.default; } catch { /* optional */ } }
  let browser;
  try { browser = await pw.chromium.launch(); }
  catch (e) { return out({ tool: 'check-flows', error: 'browser-missing', message: e.message.split('\n')[0], fix: 'npx playwright install chromium' }, 2); }

  const run = o.run || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const matrix = buildMatrix(config);
  const results = [], errors = [];
  try {
    const probe = await fetch(o.url).then((r) => r.status).catch(() => 0);
    if (!probe) return out({ tool: 'check-flows', error: 'url-unreachable', url: o.url, fix: 'start the dev server (stack profile devScript) and pass its URL' }, 3);
    for (const flow of flows) {
      const variants = [{ state: null, ctxs: matrix }, ...flow.states.map((s) => ({ state: s, ctxs: matrix.filter((c) => c.colorScheme === 'light' && c.reducedMotion !== 'reduce') }))];
      for (const { state, ctxs } of variants) for (const ctx of ctxs) {
        const context = await browser.newContext({ viewport: ctx.viewport, colorScheme: ctx.colorScheme, reducedMotion: ctx.reducedMotion, hasTouch: ctx.touch }); // isMobile off: a mobile layout viewport widens to fit overflow and hides it
        await context.addInitScript({ path: PROBE_PATH });
        const page = await context.newPage();
        const logs = [];
        page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
        page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`.slice(0, 300)));
        if (state) {
          const mk = mockFor(state);
          await page.route(state.route, async (route) => {
            if (mk.delayMs) { await new Promise((r) => setTimeout(r, mk.delayMs)); return route.continue().catch(() => {}); }
            return route.fulfill({ status: mk.status, contentType: 'application/json', body: typeof mk.body === 'string' ? mk.body : JSON.stringify(mk.body) });
          });
        }
        let si = 0;
        try {
          for (const step of flow.steps) {
            si++;
            if (step.type !== 'screenshot') { await runStep(page, step, o, o.url); continue; }
            const file = shotFile(run, flow.name, state && state.name, step.arg, ctx);
            mkdirSync(dirname(join(root, file)), { recursive: true });
            const { probe: p, axe } = await capture(page, ctx, o, AxeBuilder);
            await page.screenshot({ path: join(root, file), fullPage: true, animations: 'disabled' });
            const axeF = Array.isArray(axe) ? axeToFindings(axe) : [];
            results.push({ flow: flow.name, state: state && state.name, step: step.arg, context: ctx.id, screenshot: file.replace(/\\/g, '/'),
              findings: [...p.findings, ...axeF], summary: p.summary, animations: p.animations, metrics: p.metrics,
              axe: Array.isArray(axe) ? { violations: axe.length } : axe, console: logs.splice(0), probeErrors: p.errors });
          }
        } catch (e) {
          const st = flow.steps[si - 1], file = shotFile(run, flow.name, state && state.name, `fail${si}`, ctx);
          mkdirSync(dirname(join(root, file)), { recursive: true });
          await page.screenshot({ path: join(root, file) }).catch(() => {});
          errors.push({ flow: flow.name, state: state && state.name, context: ctx.id, step: si, action: `${st.type} ${JSON.stringify(st.arg)}`,
            error: e.message.split('\n')[0], screenshot: file.replace(/\\/g, '/'), console: logs });
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }

  const agg = aggregate(results);
  const consoleErrors = [...new Set(results.flatMap((r) => r.console))];
  const report = { tool: 'check-flows', run, url: o.url, matrix: matrix.map((c) => c.id), axe: !!AxeBuilder,
    summary: agg.summary, findings: agg.findings, consoleErrors, errors, results };
  const reportPath = join('.design', 'reports', `${run}.json`);
  mkdirSync(join(root, '.design', 'reports'), { recursive: true });
  writeFileSync(join(root, reportPath), JSON.stringify(report, null, 2));
  return out({ tool: 'check-flows', run, report: reportPath.replace(/\\/g, '/'), shots: `.design/reports/shots/${run}/`, axe: !!AxeBuilder,
    summary: agg.summary, findings: agg.findings.slice(0, 40).map(({ contexts, ...f }) => ({ ...f, seenIn: contexts.length, example: contexts[0] })), consoleErrors: consoleErrors.slice(0, 20), errors }, 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((c) => { process.exitCode = c; }, (e) => { console.log(JSON.stringify({ tool: 'check-flows', error: 'crash', message: e.message })); process.exitCode = 1; });
}
