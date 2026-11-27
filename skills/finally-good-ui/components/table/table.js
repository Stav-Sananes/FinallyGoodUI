// Table behaviour (recipes/patterns/data-table.md). The markup is a real <table>; attach adds what HTML does not:
//  - sorting is reported, not performed: a click or Enter/Space on a [data-part="sort"] button inside a <th data-key> fires
//    a bubbling `sortchange` event (detail "key:ascending|descending") and moves aria-sort to that column; the owner of the
//    rows sorts them. Cycle: none -> ascending -> descending -> ascending;
//  - row selection: [data-part="select"] checkboxes in the rows set aria-selected on their row, a checkbox in the head selects
//    or clears all rows (and shows the mixed state); a bubbling `selectionchange` event (detail: the checked rows'
//    data-row-id values) reports each user change;
//  - syncSelection(scope, ids?) is the programmatic and controlled-prop API (no event): with ids it checks exactly those rows.
// Keyboard is native (Tab to the sort buttons and checkboxes, Space toggles a checkbox, Enter/Space activates a button);
// a roving grid focus is not part of the reference. Every selector is scoped to data-fgu="table".
const ROOT = '[data-fgu="table"][data-part="root"]';
const part = (name) => `[data-fgu="table"] [data-part="${name}"]`;

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const rootOf = (el) => el.closest?.(ROOT) ?? null;
const rowBoxes = (root) => [...root.querySelectorAll(`${part("body")} ${part("select")}`)];
const allBox = (root) => root.querySelector(`${part("head")} ${part("select")}`);
const idOf = (box) => box.closest("tr")?.getAttribute("data-row-id") ?? "";

function refresh(root) {
  const boxes = rowBoxes(root);
  for (const box of boxes) box.closest("tr")?.setAttribute("aria-selected", String(box.checked));
  const all = allBox(root);
  if (!all) return;
  const checked = boxes.filter((b) => b.checked).length;
  all.checked = boxes.length > 0 && checked === boxes.length;
  all.indeterminate = checked > 0 && checked < boxes.length;
}

/** Re-reads the row checkboxes (and, with `ids`, checks exactly those rows): aria-selected and the head's mixed state follow. No event. */
export function syncSelection(scope, ids) {
  const root = rootOf(scope) ?? scope;
  if (Array.isArray(ids)) for (const box of rowBoxes(root)) box.checked = ids.includes(idOf(box));
  refresh(root);
}

const selectedIds = (root) => rowBoxes(root).filter((b) => b.checked).map(idOf);

export function attach(root) {
  for (const el of within(root, ROOT)) refresh(el);

  const onClick = (event) => {
    const button = event.target.closest?.(part("sort"));
    const th = button?.closest("th");
    const owner = button && rootOf(button);
    if (!th || !owner) return;
    const next = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
    for (const other of owner.querySelectorAll(`${part("head")} [aria-sort]`)) if (other !== th) other.setAttribute("aria-sort", "none");
    th.setAttribute("aria-sort", next);
    owner.dispatchEvent(new CustomEvent("sortchange", { bubbles: true, detail: `${th.getAttribute("data-key")}:${next}` }));
  };
  const onChange = (event) => {
    const box = event.target.closest?.(part("select"));
    const owner = box && rootOf(box);
    if (!owner) return;
    if (box === allBox(owner)) for (const row of rowBoxes(owner)) row.checked = box.checked;
    refresh(owner);
    owner.dispatchEvent(new CustomEvent("selectionchange", { bubbles: true, detail: selectedIds(owner) }));
  };
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
  };
}
