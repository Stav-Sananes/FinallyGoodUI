// Menu button behaviour. The keyboard contract is recipes/patterns/menu-select-combobox.md (menu column).
// The list is a native `popover`, so showing, hiding, the top layer and outside-click dismissal are the
// platform's. attach adds: roles and ids where the markup left them out, real focus moving into the list
// with a roving tabindex, ArrowUp/Down/Home/End, typeahead, Escape returning focus to the trigger,
// and aria-disabled items that stay focusable but cannot be activated.
// The trigger is the popover's invoker (popovertarget): the platform toggles on click and exempts the trigger
// from light dismiss, so there is no click handler for it (a click handler would reopen a menu that light
// dismiss had just closed). Enter and Space are that native click: no key listener for them here.
// Every selector is scoped to data-fgu="menu": attach may be given a whole page, or the menu root itself.
// openMenu / closeMenu are the programmatic API: they take the list, the trigger or the menu root.
const ROOT = '[data-fgu="menu"][data-part="root"]';
const TRIGGER = '[data-fgu="menu"] [data-part="trigger"]';
const LIST = '[data-fgu="menu"] [data-part="list"]';
const ITEM = '[data-fgu="menu"] [data-part="item"]';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
const TYPEAHEAD_RESET_MS = 500; // input timing, not animation: not a motion token
let counter = 0;
const triggerOf = new WeakMap(); // list -> trigger
const typed = new WeakMap(); // list -> { text, at }

const within = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const focusTarget = (el) => (el.matches?.(FOCUSABLE) ? el : el.querySelector?.(FOCUSABLE) ?? el);
const itemsOf = (list) => [...list.querySelectorAll(ITEM)];
const isOpen = (list) => list.matches(":popover-open");

function prepareItems(list) {
  for (const item of itemsOf(list)) {
    if (!item.hasAttribute("role")) item.setAttribute("role", "menuitem");
    if (!item.hasAttribute("tabindex")) item.setAttribute("tabindex", "-1");
  }
}

const setExpanded = (list, open) => triggerOf.get(list)?.setAttribute("aria-expanded", String(open));
function focusItem(list, item) {
  if (!item) return;
  for (const other of itemsOf(list)) other.setAttribute("tabindex", "-1");
  item.setAttribute("tabindex", "0");
  item.focus();
}
const focusAt = (list, index) => { const items = itemsOf(list); focusItem(list, items.at(index % items.length)); };

// The list a scope stands for: the list itself, a trigger's list, or the first list inside a root.
function listOf(scope) {
  if (scope.matches?.(LIST)) return scope;
  const trigger = scope.matches?.(TRIGGER) ? scope : null;
  if (trigger) return trigger.ownerDocument.getElementById(trigger.getAttribute("aria-controls"));
  return scope.querySelector(LIST);
}

/** Opens the menu and moves focus to item `start` (0 = first, -1 = last). */
export function openMenu(scope, start = 0) {
  const list = listOf(scope);
  if (!list || !triggerOf.has(list)) return;
  if (!isOpen(list)) list.showPopover();
  setExpanded(list, true);
  focusAt(list, start);
}

/** Closes the menu; focus goes back to the trigger unless `restoreFocus` is false. */
export function closeMenu(scope, { restoreFocus = true } = {}) {
  const list = listOf(scope);
  if (!list || !triggerOf.has(list)) return;
  if (isOpen(list)) list.hidePopover();
  setExpanded(list, false);
  if (restoreFocus) { const trigger = triggerOf.get(list); if (trigger) focusTarget(trigger).focus(); }
}

function typeahead(list, event) {
  const items = itemsOf(list);
  const i = items.indexOf(list.ownerDocument.activeElement);
  const prev = typed.get(list);
  const text = prev && event.timeStamp - prev.at <= TYPEAHEAD_RESET_MS ? prev.text + event.key : event.key;
  typed.set(list, { text, at: event.timeStamp });
  const repeat = [...text].every((c) => c === text[0]); // "dd" cycles through items starting with "d"
  const search = (repeat ? text[0] : text).toLowerCase();
  const from = repeat ? i + 1 : Math.max(i, 0);
  const label = (el) => el.textContent.trim().toLowerCase();
  focusItem(list, [...items.slice(from), ...items.slice(0, from)].find((el) => label(el).startsWith(search)));
}

export function attach(root) {
  for (const trigger of within(root, TRIGGER)) {
    const controlled = trigger.getAttribute("aria-controls");
    const list = (controlled && trigger.ownerDocument.getElementById(controlled)) || trigger.closest(ROOT)?.querySelector(LIST);
    if (!list) continue;
    const n = ++counter;
    trigger.id ||= `fgu-menu-${n}-trigger`;
    list.id ||= `fgu-menu-${n}-list`;
    trigger.setAttribute("aria-controls", list.id);
    trigger.setAttribute("aria-haspopup", "menu");
    if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", String(isOpen(list)));
    if (!list.hasAttribute("aria-labelledby")) list.setAttribute("aria-labelledby", trigger.id);
    if (!list.hasAttribute("popover")) list.setAttribute("popover", "");
    trigger.setAttribute("popovertarget", list.id);
    prepareItems(list);
    triggerOf.set(list, trigger);
  }

  const onKeydown = (event) => {
    const trigger = event.target.closest?.(TRIGGER);
    if (trigger) {
      const list = trigger.ownerDocument.getElementById(trigger.getAttribute("aria-controls"));
      if (!list) return;
      if (event.key === "ArrowDown") { event.preventDefault(); openMenu(list, 0); }
      if (event.key === "ArrowUp") { event.preventDefault(); openMenu(list, -1); }
      return;
    }
    const list = event.target.closest?.(LIST);
    if (!list || !triggerOf.has(list)) return;
    const items = itemsOf(list);
    const i = items.indexOf(list.ownerDocument.activeElement);
    const moves = { ArrowDown: i + 1, ArrowUp: i - 1 + items.length, Home: 0, End: items.length - 1 };
    if (event.key in moves) { event.preventDefault(); focusAt(list, moves[event.key]); return; }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeMenu(list); return; }
    if (event.key === "Tab") { closeMenu(list, { restoreFocus: false }); return; }
    if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) typeahead(list, event);
  };

  // Capture phase, so a disabled item is stopped before any handler on or inside it.
  const onClick = (event) => {
    const item = event.target.closest?.(ITEM);
    const list = item?.closest(LIST);
    if (!item || !list || !triggerOf.has(list)) return;
    if (item.getAttribute("aria-disabled") === "true") { event.preventDefault(); event.stopPropagation(); return; }
    closeMenu(list);
  };

  // `beforetoggle` and `toggle` do not bubble; they also fire for the invoker, light dismiss and Escape.
  const onBeforeToggle = (event) => {
    const list = event.target;
    const trigger = triggerOf.get(list);
    if (event.newState !== "open" || !trigger) return;
    prepareItems(list);
    const box = trigger.getBoundingClientRect();
    list.style.setProperty("--menu-x", `${box.left}px`);
    list.style.setProperty("--menu-y", `${box.bottom}px`);
  };
  const onToggle = (event) => {
    const list = event.target;
    setExpanded(list, event.newState === "open");
    if (event.newState === "open" && triggerOf.has(list) && !list.contains(list.ownerDocument.activeElement)) focusAt(list, 0);
  };

  root.addEventListener("keydown", onKeydown);
  root.addEventListener("click", onClick, true);
  root.addEventListener("beforetoggle", onBeforeToggle, true);
  root.addEventListener("toggle", onToggle, true);
  return () => {
    root.removeEventListener("keydown", onKeydown);
    root.removeEventListener("click", onClick, true);
    root.removeEventListener("beforetoggle", onBeforeToggle, true);
    root.removeEventListener("toggle", onToggle, true);
  };
}
