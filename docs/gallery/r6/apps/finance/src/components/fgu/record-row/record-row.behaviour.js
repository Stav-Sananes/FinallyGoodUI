// record-row behaviour. A record names itself: attach gives each record root aria-labelledby (its title) and aria-describedby
// (its meta and status), generating ids where the markup has none, so a screen reader reads "Roast squash, 40 min, Maya" for the
// record and not a heap of separate text. Attributes the author already set are left alone. The visible action is a real
// button or link the caller supplies: there is no key handling and no menu here. detach removes only what attach added.
// Every selector is scoped to data-fgu="record-row": attach may be given a whole page.
const ROOT = '[data-fgu="record-row"][data-part="root"]';
let counter = 0;
const PART = (name) => `[data-fgu="record-row"] [data-part="${name}"]`;
// Copied into every behaviour file: keep in sync with dialog, field, menu, popover, select, table, tabs, tooltip, record-row, record-card.
const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const idOf = (el, added) => {
  if (!el.id) { el.id = `fgu-record-row-${++counter}`; added.push([el, "id"]); }
  return el.id;
};

export function attach(root) {
  const added = []; // [element, attribute] pairs to undo
  for (const record of within(root, ROOT)) {
    const title = record.querySelector(PART("title"));
    if (title && !record.hasAttribute("aria-labelledby")) { record.setAttribute("aria-labelledby", idOf(title, added)); added.push([record, "aria-labelledby"]); }
    if (record.hasAttribute("aria-describedby")) continue;
    const ids = ["meta", "status"].map((name) => record.querySelector(PART(name))).filter(Boolean).map((el) => idOf(el, added));
    if (ids.length) { record.setAttribute("aria-describedby", ids.join(" ")); added.push([record, "aria-describedby"]); }
  }
  return () => { for (const [el, attr] of added) el.removeAttribute(attr); };
}
