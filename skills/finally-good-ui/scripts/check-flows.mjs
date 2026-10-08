#!/usr/bin/env node
// finally-good-ui: walk flows in a real browser across viewports x colour schemes (+1 reduced-motion pass),
// force UI states via request interception / direct navigation / init hooks, run probe.js (+ axe if installed),
// screenshot every step. One browser, bounded parallel contexts, readiness waits instead of fixed sleeps.
// Imports `playwright` from the USER's project (no dependency of this plugin).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PROBE_PATH = join(HERE, 'browser', 'probe.js');
export const MOCKS = ['empty', 'error', 'slow', 'forbidden'];
const STEP_KEYS = ['goto', 'click', 'fill', 'press', 'hover', 'waitFor', 'screenshot'];
const SCHEMES = ['light', 'dark'];
const SOFT_WAIT_MS = 2000; // per-action cap while a forced state replays the happy path (its targets may never appear)
export const DEFAULT_CONCURRENCY = Math.max(1, Math.min(4, (os.availableParallelism ? os.availableParallelism() : os.cpus().length) || 1));

const HELP = `check-flows.mjs --url <base> [--flows .design/flows.json | --pages /,/settings] [options]
  --root <dir>         project root (default cwd); playwright is resolved from here
  --config <file>      default <root>/.design/config.json (viewports: [[375,812],[1440,900]] | [375] | ["375x812"] | [{width,height}];
                       theme: see below)
  --run <id>           run id (default timestamp); shots -> .design/reports/shots/<run>/
  --concurrency <n>    parallel browser contexts in one browser (default min(4, cpus) = ${DEFAULT_CONCURRENCY})
  --only <a,b>         run only these flows (name), state variants (flow.state) or screens (screenshot name;
                       only those shots are captured)
  --changed [report]   re-run only variants that changed or failed since a previous report (run id or path;
                       default newest report): flow definition changed, new, had errors or high/medium findings.
                       The rest are carried over from that report. Combine with --only. Final gate run: full.
  --no-axe             skip @axe-core/playwright even if installed
  --no-focus           skip the probe's focus walk
  --timeout <ms>       per-action timeout (default 5000)
  --nav-timeout <ms>   per-navigation timeout (default 15000)
  --max-sleep <ms>     cap fixed {"waitFor": <ms>} sleeps in flows (default: no cap)
  .design/tokens.json, if present, feeds the probe's off-token check (colour + space groups).
flows.json: {"flows":[{"name":"signup","steps":[{"goto":"/signup"},{"fill":["#email","a@b.co"]},
  {"click":"button[type=submit]"},{"waitFor":"text=Check your inbox"},{"screenshot":"sent"}],
  "states":[{"name":"empty","route":"**/api/items*","mock":"empty","body":[]}]}]}
  selectors: any Playwright selector (role=button[name="Save"], text=Save, css) + label=, placeholder=, testid=, alt=
  steps: goto <path|url> · click <sel> · fill [sel,value] | {selector,value} · press <key> | {selector,key}
         hover <sel> · waitFor <sel> | <ms> | {selector,state} · screenshot <name> (also runs probe + axe)
  flow (optional): ready <sel> (waited after every goto; config.ready = default for all flows) · init <js> (init script) · localStorage {k:v} (seeded once)
         stateSteps [steps] (default path for every state of this flow)
  states (object or array): force with a mock (mock empty|error|slow|forbidden + route glob, optional body, status,
         delayMs) and/or by navigation/setup: goto <url> (jump straight to the screen, e.g. "/list?state=empty"),
         steps [...], init <js>, localStorage {k:v}. Optional waitFor <sel> (before the shot), screenshot <name>.
         Without goto/steps/stateSteps a state replays the flow only up to its first screenshot (until <shot> |
         "end" to go further). Replayed actions are soft: each is capped at ${SOFT_WAIT_MS} ms and the first one that
         fails ends the replay, the next screen is captured as-is and a note is added (not an error).
         Base flow runs the full matrix; each state runs every viewport in the theme's default scheme.
  config.theme: how a scheme is applied. "media" (default) = emulate prefers-color-scheme only; otherwise:
         {"schemes":["dark","light"], "default":"dark", "media":true, "attribute":"data-theme" | "class":"dark",
          "lightClass":"light", "target":"html"|"body", "storage":"<localStorage key>", "query":"<url param>",
          "values":{"light":"light","dark":"dark"}}
Exit: 0 done (see summary) · 1 bad input · 2 playwright/browser missing · 3 URL unreachable.`;

export function parseArgs(argv) {
  const o = { root: process.cwd(), axe: true, focus: true, timeout: 5000, navTimeout: 15000, concurrency: DEFAULT_CONCURRENCY };
  const KEYS = { 'nav-timeout': 'navTimeout', 'max-sleep': 'maxSleep' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--no-axe') o.axe = false;
    else if (a === '--no-focus') o.focus = false;
    else if (a.startsWith('--')) {
      const name = a.slice(2), key = KEYS[name] || name, next = argv[i + 1];
      o[key] = next === undefined || next.startsWith('--') ? true : argv[++i];
    }
  }
  const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
  if (o.pages) o.pages = list(o.pages);
  if (o.only) o.only = list(o.only);
  o.timeout = Number(o.timeout) || 5000;
  o.navTimeout = Number(o.navTimeout) || 15000;
  o.concurrency = Math.max(1, Math.floor(Number(o.concurrency)) || DEFAULT_CONCURRENCY);
  if (o.maxSleep != null) o.maxSleep = Number(o.maxSleep) >= 0 ? Number(o.maxSleep) : undefined;
  return o;
}

export function normalizeViewport(v) {
  if (typeof v === 'number') return { width: v, height: v < 768 ? 812 : v < 1200 ? 1024 : 900 };
  if (Array.isArray(v) && v.length === 2) return { width: +v[0], height: +v[1] };
  if (typeof v === 'string' && /^\d+x\d+$/.test(v)) { const [w, h] = v.split('x').map(Number); return { width: w, height: h }; }
  if (v && typeof v === 'object' && v.width) return { width: +v.width, height: +(v.height || normalizeViewport(+v.width).height) };
  throw new Error(`bad viewport: ${JSON.stringify(v)}`);
}

// config.theme -> how a colour scheme is put on the page. Default = prefers-color-scheme emulation only.
export function normalizeTheme(t) {
  if (t == null || t === 'media') t = {};
  if (typeof t !== 'object' || Array.isArray(t)) throw new Error('theme: expected an object');
  const schemes = t.schemes ? [].concat(t.schemes) : SCHEMES;
  if (!schemes.length || schemes.some((s) => !SCHEMES.includes(s)) || new Set(schemes).size !== schemes.length) throw new Error('theme.schemes: use "light" and/or "dark"');
  const def = t.default || schemes[0];
  if (!schemes.includes(def)) throw new Error(`theme.default "${def}" is not in theme.schemes`);
  const target = t.target || 'html';
  if (!['html', 'body'].includes(target)) throw new Error('theme.target: "html" or "body"');
  for (const k of ['attribute', 'class', 'lightClass', 'storage', 'query']) if (t[k] != null && (typeof t[k] !== 'string' || !t[k])) throw new Error(`theme.${k}: expected a non-empty string`);
  const values = t.values || {};
  return { media: t.media !== false, schemes: [...schemes], default: def, target, attribute: t.attribute || null, class: t.class || null,
    lightClass: t.lightClass || null, storage: t.storage || null, query: t.query || null,
    values: { light: String(values.light ?? 'light'), dark: String(values.dark ?? 'dark') } };
}

export function buildMatrix(config = {}) {
  const theme = normalizeTheme(config.theme);
  const vps = (config.viewports && config.viewports.length ? config.viewports : [375, 1440]).map(normalizeViewport);
  const m = [];
  for (const vp of vps) for (const scheme of theme.schemes) m.push({ viewport: vp, colorScheme: scheme, reducedMotion: 'no-preference', touch: vp.width < 768 });
  m.push({ viewport: vps[0], colorScheme: theme.default, reducedMotion: 'reduce', touch: vps[0].width < 768 });
  return m.map((c) => ({ ...c, id: `${c.viewport.width}-${c.colorScheme}${c.reducedMotion === 'reduce' ? '-rm' : ''}` }));
}

// Contexts a variant runs in: the base flow gets the whole matrix, a state every viewport in the default scheme.
export function contextsFor(matrix, theme, state) {
  return state ? matrix.filter((c) => c.colorScheme === theme.default && c.reducedMotion !== 'reduce') : matrix;
}

// Argument for themeInit(): only the parts the page needs.
export function themeInitArg(theme, scheme) {
  if (!theme.attribute && !theme.class && !theme.lightClass && !theme.storage) return null;
  return { target: theme.target, attribute: theme.attribute, cls: theme.class, lightCls: theme.lightClass, storage: theme.storage,
    value: theme.values[scheme], dark: scheme === 'dark' };
}

// Runs in the page before any app script, on every navigation. Storage is seeded once per tab so an
// in-flow theme toggle survives later navigations.
function themeInit(t) {
  try {
    if (t.storage && !sessionStorage.getItem('__fgu_theme_seeded')) { localStorage.setItem(t.storage, t.value); sessionStorage.setItem('__fgu_theme_seeded', '1'); }
  } catch (_) { /* storage blocked */ }
  const apply = () => {
    const el = t.target === 'body' ? document.body : document.documentElement;
    if (!el) return;
    if (t.attribute) el.setAttribute(t.attribute, t.value);
    if (t.cls) el.classList.toggle(t.cls, t.dark);
    if (t.lightCls) el.classList.toggle(t.lightCls, !t.dark);
  };
  apply();
  document.addEventListener('DOMContentLoaded', apply, { once: true });
}
function storageInit(s) {
  try {
    if (sessionStorage.getItem(s.flag)) return;
    for (const [k, v] of Object.entries(s.items)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    sessionStorage.setItem(s.flag, '1');
  } catch (_) { /* storage blocked */ }
}

export function applyThemeQuery(url, theme, scheme) {
  if (!theme || !theme.query) return url;
  const u = new URL(url);
  u.searchParams.set(theme.query, theme.values[scheme]);
  return u.href;
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

function normSteps(list, where, { shot } = {}) {
  if (!Array.isArray(list) || !list.length) throw new Error(`${where}: steps required`);
  const steps = list.map((s, j) => normStep(s, `${where}[${j}]`));
  if (steps[0].type !== 'goto') throw new Error(`${where}: first step must be goto`);
  if (!steps.some((s) => s.type === 'screenshot')) steps.push({ type: 'screenshot', arg: shot || 'end' });
  return steps;
}

function normStorage(v, where) {
  if (v == null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw new Error(`${where}: localStorage must be an object`);
  return v;
}

// The steps a forced state runs. `soft` = replayed from the happy path (its selector waits may never match).
export function statePlan(flow, st, where) {
  const firstShot = flow.steps.find((s) => s.type === 'screenshot').arg;
  const shot = st.screenshot ? safeName(st.screenshot) : firstShot;
  let plan, soft = false;
  if (st.steps) plan = normSteps(st.steps, `${where}.steps`, { shot });
  else if (st.goto) plan = [normStep({ goto: st.goto }, `${where}.goto`), { type: 'screenshot', arg: shot }];
  else if (flow.stateSteps) plan = flow.stateSteps;
  else {
    const until = st.until == null ? firstShot : st.until === 'end' ? 'end' : safeName(st.until);
    if (until === 'end') plan = flow.steps;
    else {
      const idx = flow.steps.findIndex((s) => s.type === 'screenshot' && s.arg === until);
      if (idx < 0) throw new Error(`${where}.until: no screenshot step named "${until}" in ${flow.name}`);
      plan = flow.steps.slice(0, idx + 1);
    }
    soft = true;
  }
  if (st.waitFor) {
    const i = plan.findIndex((s) => s.type === 'screenshot');
    plan = [...plan.slice(0, i), normStep({ waitFor: st.waitFor }, `${where}.waitFor`), ...plan.slice(i)];
  }
  return { plan, soft };
}

export function flowHash(raw) { return createHash('sha1').update(JSON.stringify(raw)).digest('hex').slice(0, 12); }

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
    const steps = normSteps(f.steps, `${name}.steps`);
    if (f.ready != null && typeof f.ready !== 'string') throw new Error(`${name}.ready: expected a selector string`);
    if (f.init != null && typeof f.init !== 'string') throw new Error(`${name}.init: expected a JS string`);
    const flow = { name, steps, states: [], hash: flowHash(f), ready: f.ready || null, init: f.init || null,
      localStorage: normStorage(f.localStorage, `${name}.localStorage`), stateSteps: f.stateSteps ? normSteps(f.stateSteps, `${name}.stateSteps`) : null };
    const stNames = new Set();
    flow.states = (f.states ? [].concat(f.states) : []).map((st, j) => {
      const where = `${name}.states[${j}]`;
      if (!st || typeof st !== 'object') throw new Error(`${where}: state must be an object`);
      if (st.mock != null && (!MOCKS.includes(st.mock) || !st.route)) throw new Error(`${where}: needs route + mock (${MOCKS.join('|')})`);
      if (st.mock == null && st.route) throw new Error(`${where}: route without mock (${MOCKS.join('|')})`);
      if (st.mock == null && !st.goto && !st.steps && !st.init && !st.localStorage) throw new Error(`${where}: needs route + mock (${MOCKS.join('|')}) or goto/steps/init/localStorage`);
      if (st.init != null && typeof st.init !== 'string') throw new Error(`${where}.init: expected a JS string`);
      const sName = safeName(st.name || st.mock || `state${j + 1}`);
      if (stNames.has(sName)) throw new Error(`${where}: duplicate state name ${sName}`);
      stNames.add(sName);
      const { plan, soft } = statePlan(flow, st, where);
      return { ...st, name: sName, localStorage: normStorage(st.localStorage, `${where}.localStorage`), plan, soft };
    });
    return flow;
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

export const variantId = (flow, state) => (state ? `${flow}.${state}` : flow);
const sameVariant = (r, flow, state) => r.flow === flow && (r.state || null) === (state || null);

// Should this variant run again, given a previous report? (--changed)
export function needsRerun(prev, flow, state) {
  if (!prev) return true;
  if (prev.flowHashes && prev.flowHashes[flow.name] !== flow.hash) return true;
  const sn = state ? state.name : null;
  if ((prev.errors || []).some((e) => sameVariant(e, flow.name, sn))) return true;
  const rs = (prev.results || []).filter((r) => sameVariant(r, flow.name, sn));
  if (!rs.length) return true;
  return rs.some((r) => (r.findings || []).some((f) => f.severity === 'high' || f.severity === 'medium'));
}

// Pick the variants to run. only: flow names, flow.state ids or screenshot names. prev: report for --changed.
export function selectVariants(flows, { only, prev } = {}) {
  const want = only && only.length ? new Set(only.map((s) => s.trim()).filter(Boolean)) : null;
  const matched = new Set(), run = [], carried = [];
  for (const flow of flows) for (const state of [null, ...flow.states]) {
    const id = variantId(flow.name, state && state.name);
    let shots = null;
    if (want) {
      const hits = [flow.name, id].filter((n) => want.has(n));
      if (hits.length) hits.forEach((n) => matched.add(n));
      else {
        const s = (state ? state.plan : flow.steps).filter((st) => st.type === 'screenshot' && want.has(st.arg)).map((st) => st.arg);
        if (!s.length) continue;
        s.forEach((n) => matched.add(n));
        shots = new Set(s);
      }
    }
    if (prev && !needsRerun(prev, flow, state)) { carried.push({ flow, state, id }); continue; }
    run.push({ flow, state, shots, id });
  }
  const unknown = want ? [...want].filter((n) => !matched.has(n)) : [];
  return { run, carried, unknown };
}

// Bounded-concurrency map that keeps input order in the output.
export async function runPool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const k = next++; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, worker));
  return out;
}

export function findPrevReport(root, ref) {
  const dir = join(root, '.design', 'reports');
  const isReport = (p) => { try { const j = JSON.parse(readFileSync(p, 'utf8')); return j.tool === 'check-flows' && Array.isArray(j.results) ? j : null; } catch { return null; } };
  if (typeof ref === 'string') {
    for (const p of [resolve(root, ref), join(dir, `${ref}.json`)]) if (existsSync(p) && statSync(p).isFile()) { const j = isReport(p); if (j) return { path: p, report: j }; }
    return null;
  }
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  for (const p of files) { const j = isReport(p); if (j) return { path: p, report: j }; }
  return null;
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
const sleep = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t.unref) t.unref(); });

// In-flight request tracker: "quiet" = nothing pending (except deliberately delayed mocks) for `windowMs`.
function trackNetwork(page) {
  const pending = new Set(), ignore = new WeakSet();
  let last = Date.now();
  page.on('request', (r) => { const t = r.resourceType(); if (t !== 'websocket' && t !== 'eventsource') { pending.add(r); last = Date.now(); } });
  const done = (r) => { if (pending.delete(r)) last = Date.now(); };
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  return {
    ignore: (r) => ignore.add(r),
    async quiet(windowMs = 200, capMs = 3000) {
      const t0 = Date.now();
      while (Date.now() - t0 < capMs) {
        let live = 0;
        for (const r of pending) if (!ignore.has(r)) live++;
        if (!live && Date.now() - last >= windowMs) return true;
        await sleep(40);
      }
      return false;
    },
  };
}

async function runStep(page, step, env, net) {
  const { o } = env, t = { timeout: env.soft ? Math.min(o.timeout, SOFT_WAIT_MS) : o.timeout };
  switch (step.type) {
    case 'goto':
      await page.goto(applyThemeQuery(resolveUrl(o.url, step.arg), env.theme, env.scheme), { waitUntil: 'load', timeout: o.navTimeout });
      await net.quiet(200, 3000);
      if (env.ready) await loc(page, env.ready).waitFor({ state: 'visible', ...t });
      break;
    case 'click': await loc(page, step.arg).click(t); break;
    case 'hover': await loc(page, step.arg).hover(t); break;
    case 'fill': await loc(page, step.arg.selector).fill(String(step.arg.value), t); break;
    case 'press': step.arg.selector ? await loc(page, step.arg.selector).press(step.arg.key, t) : await page.keyboard.press(step.arg.key); break;
    case 'waitFor':
      if (step.arg.ms) await page.waitForTimeout(o.maxSleep != null ? Math.min(step.arg.ms, o.maxSleep) : step.arg.ms);
      else await loc(page, step.arg.selector).waitFor({ state: step.arg.state || 'visible', ...t });
      break;
  }
}

// Readiness before a capture: network quiet, web fonts loaded, finite animations/transitions finished
// (the probe's init hooks have already recorded them), then two frames.
async function settle(page, net) {
  await net.quiet(150, 2000);
  await page.evaluate(async () => {
    const until = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    if (document.fonts) await until(document.fonts.ready, 3000);
    const running = () => (document.getAnimations ? document.getAnimations() : []).filter((a) => {
      const end = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().endTime : Infinity;
      return a.playState === 'running' && Number.isFinite(end);
    });
    const t0 = performance.now();
    while (running().length && performance.now() - t0 < 1500) await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }).catch(() => {});
}

async function capture(page, ctx, env, net) {
  await settle(page, net);
  const { o } = env;
  const probe = await page.evaluate((opts) => window.__fguProbe(opts), { touch: ctx.touch, focus: o.focus, tokens: o.tokens, reducedMotion: ctx.reducedMotion === 'reduce' });
  let axe = null;
  if (env.AxeBuilder) {
    try { const r = await new env.AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze(); axe = r.violations; } catch (e) { axe = { error: e.message }; }
  }
  return { probe, axe };
}

// One (flow, state, context) walk in its own browser context.
async function runTask(browser, task, base) {
  const { flow, state, shots, ctx } = task, { root, run, theme } = base;
  const results = [], errors = [];
  const context = await browser.newContext({ viewport: ctx.viewport, colorScheme: theme.media ? ctx.colorScheme : 'no-preference',
    reducedMotion: ctx.reducedMotion, hasTouch: ctx.touch }); // isMobile off: a mobile layout viewport widens to fit overflow and hides it
  const env = { ...base, scheme: ctx.colorScheme, soft: !!(state && state.soft), ready: flow.ready || base.ready };
  try {
    await context.addInitScript({ path: PROBE_PATH });
    const th = themeInitArg(theme, ctx.colorScheme);
    if (th) await context.addInitScript(themeInit, th);
    const items = { ...(flow.localStorage || {}), ...((state && state.localStorage) || {}) };
    if (Object.keys(items).length) await context.addInitScript(storageInit, { items, flag: '__fgu_storage_seeded' });
    for (const js of [flow.init, state && state.init]) if (js) await context.addInitScript(js);
    const page = await context.newPage();
    const net = trackNetwork(page);
    const logs = [], notes = [];
    page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`.slice(0, 300)));
    if (state && state.mock) {
      const mk = mockFor(state);
      await page.route(state.route, async (route) => {
        if (mk.delayMs) { net.ignore(route.request()); await sleep(mk.delayMs); return route.continue().catch(() => {}); }
        return route.fulfill({ status: mk.status, contentType: 'application/json', body: typeof mk.body === 'string' ? mk.body : JSON.stringify(mk.body) });
      });
    }
    const steps = state ? state.plan : flow.steps;
    let si = 0, derailed = false;
    try {
      for (const step of steps) {
        si++;
        if (step.type !== 'screenshot') {
          if (derailed) continue;
          try { await runStep(page, step, env, net); }
          catch (e) {
            if (!env.soft || step.type === 'goto') throw e;
            derailed = true; // the forced state took the happy path away: capture the next screen as it is
            notes.push(`state ${state.name} left the replayed path at step ${si} (${step.type} ${JSON.stringify(step.arg)}): ${e.message.split('\n')[0]}`);
          }
          continue;
        }
        if (shots && !shots.has(step.arg)) { if (derailed) break; continue; }
        const file = shotFile(run, flow.name, state && state.name, step.arg, ctx);
        mkdirSync(dirname(join(root, file)), { recursive: true });
        const { probe: p, axe } = await capture(page, ctx, env, net);
        await page.screenshot({ path: join(root, file), fullPage: true, animations: 'disabled' });
        const axeF = Array.isArray(axe) ? axeToFindings(axe) : [];
        const r = { flow: flow.name, state: state && state.name, step: step.arg, context: ctx.id, screenshot: file.replace(/\\/g, '/'),
          findings: [...p.findings, ...axeF], summary: p.summary, animations: p.animations, metrics: p.metrics,
          axe: Array.isArray(axe) ? { violations: axe.length } : axe, console: logs.splice(0), probeErrors: p.errors };
        if (notes.length) r.notes = notes.splice(0);
        results.push(r);
        if (derailed) break;
      }
    } catch (e) {
      const st = steps[si - 1], file = shotFile(run, flow.name, state && state.name, `fail${si}`, ctx);
      mkdirSync(dirname(join(root, file)), { recursive: true });
      await page.screenshot({ path: join(root, file) }).catch(() => {});
      errors.push({ flow: flow.name, state: state && state.name, context: ctx.id, step: si, action: st ? `${st.type} ${JSON.stringify(st.arg)}` : 'setup',
        error: e.message.split('\n')[0], screenshot: file.replace(/\\/g, '/'), console: logs, ...(notes.length ? { notes } : {}) });
    }
  } catch (e) {
    errors.push({ flow: flow.name, state: state && state.name, context: ctx.id, step: 0, action: 'setup', error: e.message.split('\n')[0], console: [] });
  } finally { await context.close().catch(() => {}); }
  return { results, errors };
}

async function main() {
  const t0 = Date.now();
  const o = parseArgs(process.argv.slice(2));
  if (o.help) { console.log(HELP); return 0; }
  const out = (obj, code) => { console.log(JSON.stringify(obj, null, 2)); return code; };
  if (typeof o.url !== 'string' || (!o.flows && !o.pages)) return out({ tool: 'check-flows', error: 'bad-input', message: 'need --url and --flows or --pages', help: HELP }, 1);
  const root = resolve(o.root);
  const cfgPath = o.config ? resolve(root, o.config) : join(root, '.design', 'config.json');
  const config = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
  let flows, theme, matrix;
  try {
    theme = normalizeTheme(config.theme);
    matrix = buildMatrix(config);
    flows = o.pages ? pagesToFlows(o.pages) : parseFlows(readFileSync(resolve(root, o.flows), 'utf8'));
  } catch (e) { return out({ tool: 'check-flows', error: 'bad-flows', message: e.message }, 1); }
  if (config.ready != null && typeof config.ready !== 'string') return out({ tool: 'check-flows', error: 'bad-input', message: 'config.ready: expected a selector string' }, 1);

  let prev = null;
  if (o.changed) {
    prev = findPrevReport(root, o.changed === true ? null : o.changed);
    if (!prev) return out({ tool: 'check-flows', error: 'bad-input', message: `--changed: no previous check-flows report found${o.changed === true ? ' in .design/reports' : ` for ${o.changed}`}` }, 1);
    const same = JSON.stringify(prev.report.matrix || []) === JSON.stringify(matrix.map((c) => c.id)) && JSON.stringify(prev.report.theme || normalizeTheme()) === JSON.stringify(theme);
    if (!same) prev.report = { ...prev.report, flowHashes: {} }; // matrix/theme changed: everything re-runs
  }
  const sel = selectVariants(flows, { only: o.only, prev: prev && prev.report });
  if (sel.unknown.length) return out({ tool: 'check-flows', error: 'bad-input', message: `--only: nothing matches ${sel.unknown.join(', ')}`,
    available: flows.flatMap((f) => [f.name, ...f.states.map((s) => variantId(f.name, s.name))]) }, 1);
  const tokPath = join(root, '.design', 'tokens.json');
  if (existsSync(tokPath)) { try { o.tokens = tokensForProbe(JSON.parse(readFileSync(tokPath, 'utf8'))); } catch { /* ignore bad tokens */ } }

  const pw = await loadPlaywright(root);
  if (!pw) return out({ tool: 'check-flows', error: 'playwright-missing', fix: 'npm i -D playwright @axe-core/playwright && npx playwright install chromium' }, 2);
  let AxeBuilder = null;
  if (o.axe) { try { const m = await importFromProject(root, '@axe-core/playwright'); AxeBuilder = m.AxeBuilder || m.default; } catch { /* optional */ } }
  const reachable = await fetch(o.url).then((r) => r.status).catch(() => 0);
  if (!reachable) return out({ tool: 'check-flows', error: 'url-unreachable', url: o.url, fix: 'start the dev server (stack profile devScript) and pass its URL' }, 3);
  let browser;
  try { browser = await pw.chromium.launch(); }
  catch (e) { return out({ tool: 'check-flows', error: 'browser-missing', message: e.message.split('\n')[0], fix: 'npx playwright install chromium' }, 2); }

  const run = o.run && o.run !== true ? String(o.run) : new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = { o, root, run, theme, AxeBuilder, ready: config.ready || null };
  const tasks = sel.run.flatMap((v) => contextsFor(matrix, theme, v.state).map((ctx) => ({ ...v, ctx })));
  let done;
  try { done = await runPool(tasks, o.concurrency, (task) => runTask(browser, task, base)); }
  finally { await browser.close().catch(() => {}); }

  // Assemble in flow order: fresh results for variants that ran, previous ones for carried variants.
  const fresh = new Map();
  tasks.forEach((t, i) => { const e = fresh.get(t.id) || { results: [], errors: [] }; e.results.push(...done[i].results); e.errors.push(...done[i].errors); fresh.set(t.id, e); });
  const carriedIds = new Set(sel.carried.map((c) => c.id));
  const results = [], errors = [];
  for (const flow of flows) for (const state of [null, ...flow.states]) {
    const id = variantId(flow.name, state && state.name);
    if (fresh.has(id)) { results.push(...fresh.get(id).results); errors.push(...fresh.get(id).errors); }
    else if (carriedIds.has(id)) {
      const sn = state ? state.name : null;
      results.push(...prev.report.results.filter((r) => sameVariant(r, flow.name, sn)).map((r) => ({ ...r, carried: r.carried || prev.report.run })));
    }
  }

  const agg = aggregate(results);
  const consoleErrors = [...new Set(results.flatMap((r) => r.console || []))];
  const durationMs = Date.now() - t0;
  const selection = o.only || prev ? { only: o.only || null, changedFrom: prev ? prev.path.replace(/\\/g, '/') : null, ran: sel.run.map((v) => v.id), carried: [...carriedIds] } : undefined;
  const report = { tool: 'check-flows', run, url: o.url, matrix: matrix.map((c) => c.id), theme, axe: !!AxeBuilder, concurrency: o.concurrency, durationMs,
    ...(selection ? { selection } : {}), flowHashes: Object.fromEntries(flows.map((f) => [f.name, f.hash])),
    summary: agg.summary, findings: agg.findings, consoleErrors, errors, results };
  const reportPath = join('.design', 'reports', `${run}.json`);
  mkdirSync(join(root, '.design', 'reports'), { recursive: true });
  writeFileSync(join(root, reportPath), JSON.stringify(report, null, 2));
  return out({ tool: 'check-flows', run, report: reportPath.replace(/\\/g, '/'), shots: `.design/reports/shots/${run}/`, axe: !!AxeBuilder, durationMs,
    ...(selection ? { selection: { ...selection, ran: selection.ran.length, carried: selection.carried.length } } : {}),
    summary: agg.summary, findings: agg.findings.slice(0, 40).map(({ contexts, ...f }) => ({ ...f, seenIn: contexts.length, example: contexts[0] })), consoleErrors: consoleErrors.slice(0, 20), errors }, 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then((c) => { process.exitCode = c; }, (e) => { console.log(JSON.stringify({ tool: 'check-flows', error: 'crash', message: e.message })); process.exitCode = 1; });
}
