import { untrack } from 'svelte';
// Hash router: #/book?day=2026-11-30&svc=full-groom&dog=biscuit&at=mara-1030&state=error
const NAMES = ['book', 'details', 'ticket', 'services', 'visits'];
export const route = $state({ name: 'book', q: {} });

export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const name = NAMES.includes(path) ? path : 'book';
  const q = Object.fromEntries(new URLSearchParams(query));
  return { name, q };
}

function sync() {
  const next = parseHash();
  route.name = next.name;
  route.q = next.q;
}

export function startRouter() {
  window.addEventListener('hashchange', sync);
}

export function href(name, q = {}) {
  const clean = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const qs = new URLSearchParams(clean).toString();
  return `#/${name}${qs ? '?' + qs : ''}`;
}

export function go(name, q = {}) {
  // A forced state (?state=...) follows the user from screen to screen, so every state is reachable in a flow.
  location.hash = href(name, { state: route.q.state, ...q });
}

/** Update the query of the current route without adding history entries. */
export function replaceQuery(patch) {
  const q = { ...$state.snapshot(untrack(() => route.q)), ...patch };
  for (const k of Object.keys(q)) if (q[k] === undefined || q[k] === null || q[k] === '') delete q[k];
  route.q = q;
  history.replaceState(null, '', href(route.name, q));
}

// Read the hash before any screen renders, so a screen's own effects never overwrite the link.
sync();
