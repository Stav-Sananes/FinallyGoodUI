// Component markup, once, for every framework: a small tree that the renderers in scaffold-render.mjs turn
// into JSX, a Vue template, Svelte markup or an Angular template. The tree says WHICH element carries which
// part, attribute and slot; the element tags come from spec.tags, the parts must be exactly spec.parts
// (scaffold throws when one is missing), and behaviour is never here: it is the shared <name>.behaviour.js.
//
// Nodes
//   el(part, attrs, kids, opts)   an element with data-part="<part>" (part null = anonymous span); the root part also
//                                 gets data-fgu="<name>". opts: { tag, rest, on }
//   slot(name)                    the slot's content ("default" = children)
//   scoped(name, args)            a slot that receives arguments (tabs panel)
//   text(t)                       literal text (entities allowed)
//   expr(js)                      an interpolated expression
//   each(list, as, key, kids)     a loop over a prop; `i` is the index
//   when(js, kids)                renders its children when the expression is truthy
//   whenSlot(name, kids)          renders its children when the slot was given (Angular cannot tell: always)
//   choose(js, a, b)              nodes a when the expression is truthy, else nodes b (a textarea or an input)
// Element opts: ignore (Svelte lint rules to silence on this element, with a reason at the call site); model "value" | "checked" marks the control that Vue (v-model) and Svelte ($bindable) bind.
// Component keys: sync { prop, open, close } (a boolean prop shown/hidden by those behaviour functions) or { prop, set } (a value
// prop applied by that function), the controlled prop the wrapper keeps in step with the DOM;
// events: the custom DOM events a wrapper turns into its framework's callback / emit / output (see EVENTS).
// Attribute values
//   "text"        static                  true      bare attribute
//   js(expr)      bound expression        bool(expr)   boolean attribute
//   aria(expr)    "true" or absent        ariaBool(expr)  "true" / "false"
// Expressions are plain JS over the props, `uid` (a per-instance id), loop variables and `i`; they avoid
// arrow functions, template literals and `?.()` so that an Angular template accepts them too.

export const el = (part, attrs = {}, kids = [], opts = {}) => ({ k: "el", part, attrs, kids, ...opts });
export const slot = (name) => ({ k: "slot", name });
export const scoped = (name, args) => ({ k: "scoped", name, args });
export const text = (t) => ({ k: "text", t });
export const expr = (js) => ({ k: "expr", js });
export const each = (list, as, key, kids) => ({ k: "each", list, as, key, kids });
export const when = (js, kids) => ({ k: "when", js, kids });
export const whenSlot = (name, kids) => ({ k: "whenSlot", name, kids });
export const choose = (js, a, b) => ({ k: "choose", js, a, b, kids: [...a, ...b] }); // a when truthy, else b (each a list of nodes)
export const js = (e) => ({ js: e });
export const bool = (e) => ({ bool: e });
export const aria = (e) => ({ aria: e });
export const ariaBool = (e) => ({ ariaBool: e });

// A DOM event a wrapper surfaces. `sync` names a prop kept in step (Vue update:<prop>, Svelte $bindable, Angular
// <prop>Change); react / vue / svelte / angular are the callback names (null = none beyond the sync).
export const EVENTS = {
  dismiss: { dom: "dismiss", prevent: true, type: "string", payload: { ts: '(event.target as HTMLElement).dataset["id"] ?? ""', js: 'event.target.dataset.id ?? ""' },
    react: "onDismiss", vue: "dismiss", svelte: "ondismiss", angular: "dismissed" },
  tabchange: { dom: "tabchange", type: "number", payload: { ts: "(event as CustomEvent<number>).detail", js: "event.detail" },
    sync: "selected", react: "onSelectedChange", vue: "change", svelte: "onselectedchange", angular: null },
  popoverchange: { dom: "popoverchange", type: "boolean", payload: { ts: "(event as CustomEvent<boolean>).detail", js: "event.detail" },
    sync: "open", react: "onOpenChange", vue: null, svelte: null, angular: null },
  selectchange: { dom: "selectchange", type: "string", payload: { ts: "(event as CustomEvent<string>).detail", js: "event.detail" },
    sync: "value", modelAlso: true, react: "onValueChange", vue: null, svelte: null, angular: null },
  sortchange: { dom: "sortchange", type: "string", payload: { ts: "(event as CustomEvent<string>).detail", js: "event.detail" },
    sync: "sort", react: "onSortChange", vue: null, svelte: null, angular: null },
  selectionchange: { dom: "selectionchange", type: "string[]", payload: { ts: "(event as CustomEvent<string[]>).detail", js: "event.detail" },
    sync: "selected", react: "onSelectedChange", vue: null, svelte: null, angular: null },
  close: { dom: "close", type: "boolean", payload: { ts: "false", js: "false" },
    sync: "open", react: "onOpenChange", vue: null, svelte: null, angular: null },
};

const CONTROL_ID = "(id ? id : uid + '-control')";

const FIELD_CONTROL = {
  id: js(CONTROL_ID), name: js("name"), placeholder: js("placeholder"), autocomplete: js("autocomplete"),
  required: bool("required"), disabled: bool("disabled"), "aria-invalid": aria("invalid"),
  "aria-describedby": js("(hint ? uid + '-hint ' : '') + uid + '-error'"),
};

export const MARKUP = {
  button: {
    primitive: true, // an installed primitive library may supply the root element (see chooseSource)
    tree: el("root", { type: js("type"), "data-variant": js("variant"), disabled: bool("disabled"), "aria-busy": aria("loading") }, [
      el("spinner", { "aria-hidden": "true" }),
      whenSlot("icon", [el("icon", { "aria-hidden": "true" }, [slot("icon")])]),
      el("label", {}, [slot("default")]),
    ]),
  },

  field: {
    // hint and error are always the ids the control describes itself with; the error line always renders so
    // showing a message moves nothing.
    tree: el("root", { "data-variant": js("variant") }, [
      el("label", { for: js(CONTROL_ID), "data-hidden": js("hideLabel ? '' : undefined") }, [expr("label")]),
      when("hint", [el("hint", { id: js("uid + '-hint'") }, [expr("hint")])]),
      choose("multiline", [
        el("control", { ...FIELD_CONTROL, rows: js("rows") }, [], { rest: true, model: "value", tag: "textarea" }),
      ], [
        el("control", { ...FIELD_CONTROL, type: js("type") }, [], { rest: true, model: "value" }),
      ]),
      el("error", { id: js("uid + '-error'"), "aria-live": "polite", "data-controlled": js("error ? '' : undefined") }, [expr("error")]),
    ]),
  },

  toggle: {
    tree: el("root", { "data-variant": js("variant") }, [
      el("control", {
        type: "checkbox", name: js("name"), value: js("value"), checked: bool("checked"), disabled: bool("disabled"),
        "aria-invalid": aria("invalid"), role: js("variant === 'switch' ? 'switch' : undefined"),
      }, [], { rest: true, model: "checked" }),
      el("label", {}, [slot("default")]),
    ]),
  },

  disclosure: {
    tree: el("root", { "data-variant": js("variant") }, [
      el("item", {}, [
        el("heading", {}, [
          el("trigger", { type: "button", id: js("uid + '-trigger'"), "aria-expanded": ariaBool("open"), "aria-controls": js("uid + '-panel'"), disabled: bool("disabled") }, [
            el(null, {}, [slot("trigger")]),
            el("indicator", { "aria-hidden": "true" }),
          ]),
        ]),
        el("panel", { id: js("uid + '-panel'"), role: "region", "aria-labelledby": js("uid + '-trigger'") }, [
          el("content", {}, [slot("default")]),
        ]),
      ]),
    ]),
  },

  dialog: {
    sync: { prop: "open", open: "openDialog", close: "closeDialog" },
    events: ["close"],
    tree: el("root", { "data-variant": js("variant"), "aria-labelledby": js("uid + '-title'"), "data-initial-focus": js("initialFocus") }, [
      el("title", { id: js("uid + '-title'") }, [slot("title")]),
      whenSlot("description", [el("description", {}, [slot("description")])]),
      el("close", { type: "button", "aria-label": "Close" }, [text("&times;")]),
      // method="dialog": a submit button in the actions closes the dialog, and Enter in a field of the body submits.
      el("form", { method: "dialog", novalidate: bool("!nativeValidation") }, [
        slot("default"),
        whenSlot("actions", [el("actions", {}, [slot("actions")])]),
      ]),
    ]),
  },

  menu: {
    tree: el("root", {}, [
      el("trigger", {
        type: "button", id: js("uid + '-trigger'"), "aria-haspopup": "menu", "aria-expanded": "false",
        "aria-controls": js("uid + '-list'"), popovertarget: js("uid + '-list'"),
      }, [slot("default")]),
      el("list", { id: js("uid + '-list'"), role: "menu", "aria-labelledby": js("uid + '-trigger'"), popover: true }, [
        each("items", "item", "i", [
          el("item", { type: "button", role: "menuitem", tabindex: "-1", "aria-disabled": aria("item.disabled") }, [expr("item.label")], { on: { click: "item.onSelect && item.onSelect(item)" } }),
        ]),
      ]),
    ]),
  },

  tabs: {
    sync: { prop: "selected", set: "selectTab" },
    events: ["tabchange"],
    tree: el("root", {}, [
      el("list", { role: "tablist", "aria-label": js("label") }, [
        each("tabs", "tab", "i", [
          el("tab", {
            type: "button", role: "tab", id: js("uid + '-tab-' + i"), "aria-selected": ariaBool("i === (selected ? selected : 0)"),
            "aria-controls": js("uid + '-panel-' + i"), tabindex: js("i === (selected ? selected : 0) ? 0 : -1"),
          }, [expr("tab")]),
        ]),
        el("indicator", { "aria-hidden": "true" }),
      ]),
      each("tabs", "tab", "i", [
        el("panel", { id: js("uid + '-panel-' + i"), role: "tabpanel", "aria-labelledby": js("uid + '-tab-' + i"), tabindex: "0", hidden: bool("i !== (selected ? selected : 0)") }, [scoped("panel", ["tab", "i"])]),
      ]),
    ]),
  },

  toast: {
    companions: ["toast-store"], // a second file: where the list lives (provider and hook, composable, store, service)
    events: ["dismiss"],
    tree: el("root", { role: "status", "aria-label": js("label") }, [
      each("toasts", "t", "t.id", [
        el("toast", { "data-variant": js("t.variant ? t.variant : 'status'"), "data-id": js("t.id"), "data-timeout": js("t.timeout") }, [
          el("message", {}, [expr("t.message")]),
          when("t.action", [el("action", { type: "button" }, [expr("t.action")], { on: { click: "t.onAction && t.onAction(t.id)" } })]),
          el("dismiss", { type: "button", "aria-label": "Dismiss" }, [text("&times;")]),
        ]),
      ]),
      slot("default"),
    ], { rest: true }),
  },
};

/** Every node of the tree, depth first. */
export function walkTree(node, visit) {
  visit(node);
  for (const kid of node.kids ?? []) walkTree(kid, visit);
}

/** The part names the tree renders. */
export const partsOf = (tree) => { const out = new Set(); walkTree(tree, (n) => { if (n.k === "el" && n.part) out.add(n.part); }); return out; };

// ---- select, table, tooltip, popover
const SELECT_ID = "uid + '-trigger'";

MARKUP.select = {
  sync: { prop: "value", set: "selectValue" }, events: ["selectchange"],
  tree: el("root", { "data-variant": js("variant") }, [
    el("label", { id: js("uid + '-label'"), for: js(SELECT_ID), "data-hidden": js("hideLabel ? '' : undefined") }, [expr("label")]),
    choose("variant === 'native'", [
      el("control", { id: js(SELECT_ID), name: js("name"), value: js("value"), disabled: bool("disabled"), "aria-invalid": aria("invalid") }, [
        each("options", "o", "o.value", [el("option", { value: js("o.value"), disabled: bool("o.disabled") }, [expr("o.label")], { tag: "option" })]),
      ]),
    ], [
      el("trigger", {
        type: "button", id: js(SELECT_ID), role: "combobox", "aria-labelledby": js("uid + '-label ' + uid + '-trigger'"), "aria-haspopup": "listbox", "aria-expanded": "false",
        "aria-controls": js("uid + '-list'"), popovertarget: js("uid + '-list'"), disabled: bool("disabled"), "aria-invalid": aria("invalid"),
      }, [el("display", { "data-placeholder": js("placeholder") })]),
      el("listbox", { id: js("uid + '-list'"), role: "listbox", "aria-labelledby": js(SELECT_ID), popover: true }, [
        when("searchable", [el("search", { type: "search", "aria-label": js("label"), autocomplete: "off" })]),
        each("options", "o", "o.value", [
          el("option", { role: "option", tabindex: "-1", "data-value": js("o.value"), "aria-selected": ariaBool("o.value === value"), "aria-disabled": aria("o.disabled") }, [expr("o.label")]),
        ]),
        el("empty", { role: "status", hidden: true }, [expr("emptyText")]),
      ]),
      el("value", { type: "hidden", name: js("name"), value: js("value") }),
    ]),
  ]),
};

MARKUP.tooltip = {
  tree: el("root", { "data-placement": js("variant"), "data-delay": js("delay") }, [
    el("trigger", {}, [slot("default")]),
    el("content", { role: "tooltip", popover: "manual" }, [slot("content")]),
  ]),
};

MARKUP.popover = {
  sync: { prop: "open", open: "openPopover", close: "closePopover" }, events: ["popoverchange"],
  tree: el("root", {}, [
    el("trigger", { type: "button", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-controls": js("uid + '-panel'"), popovertarget: js("uid + '-panel'") }, [slot("trigger")]),
    el("panel", { id: js("uid + '-panel'"), role: "dialog", "aria-label": js("label"), popover: true, tabindex: "-1" }, [slot("default")]),
  ]),
};

const ROW_ID = "row.id";
MARKUP.table = {
  sync: { prop: "selected", set: "syncSelection" }, events: ["sortchange", "selectionchange"],
  // the scroll region takes focus so the keyboard can scroll it (the data-table recipe); Svelte's lint calls that a noninteractive tabindex
  tree: el("root", { role: "region", "aria-labelledby": js("uid + '-caption'"), tabindex: "0", "data-sticky": js("sticky ? '' : undefined"), "aria-busy": aria("loading") }, [
    el("table", {}, [
      el("caption", { id: js("uid + '-caption'") }, [expr("caption")]),
      el("head", {}, [
        el("row", {}, [
          when("selectable", [el("header", { scope: "col" }, [el("select", { type: "checkbox", "aria-label": "Select all rows" })])]),
          each("columns", "col", "col.key", [
            el("header", {
              scope: "col", "data-key": js("col.key"), "data-align": js("col.align === 'end' ? 'end' : undefined"),
              "aria-sort": js("col.sortable ? (sort === col.key + ':ascending' ? 'ascending' : sort === col.key + ':descending' ? 'descending' : 'none') : undefined"),
            }, [choose("col.sortable", [el("sort", { type: "button" }, [expr("col.label")])], [el(null, {}, [expr("col.label")])])]),
          ]),
        ]),
      ]),
      el("body", {}, [
        when("loading || rows.length === 0", [
          el("row", {}, [el("status", { colspan: js("columns.length + (selectable ? 1 : 0)"), role: "status" }, [expr("loading ? loadingText : emptyText")], { ignore: ["a11y_no_interactive_element_to_noninteractive_role"] })]),
        ]),
        each("rows", "row", ROW_ID, [
          el("row", { "data-row-id": js(ROW_ID), "aria-selected": js("selectable ? (selected.indexOf(row.id) >= 0 ? 'true' : 'false') : undefined") }, [
            when("selectable", [el("cell", {}, [el("select", { type: "checkbox", "aria-label": js("'Select row ' + row.id"), checked: bool("selected.indexOf(row.id) >= 0") })])]),
            each("columns", "col", "col.key", [el("cell", { "data-align": js("col.align === 'end' ? 'end' : undefined") }, [expr("row[col.key]")])]),
          ]),
        ]),
      ]),
    ]),
  ], { ignore: ["a11y_no_noninteractive_tabindex"] }),
};
