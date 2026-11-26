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
export const js = (e) => ({ js: e });
export const bool = (e) => ({ bool: e });
export const aria = (e) => ({ aria: e });
export const ariaBool = (e) => ({ ariaBool: e });

const CONTROL_ID = "(id ? id : uid + '-control')";

export const MARKUP = {
  button: {
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
      el("label", { for: js(CONTROL_ID) }, [expr("label")]),
      when("hint", [el("hint", { id: js("uid + '-hint'") }, [expr("hint")])]),
      el("control", {
        id: js(CONTROL_ID), type: js("type"), name: js("name"), placeholder: js("placeholder"), autocomplete: js("autocomplete"),
        required: bool("required"), disabled: bool("disabled"), "aria-invalid": aria("invalid"),
        "aria-describedby": js("(hint ? uid + '-hint ' : '') + uid + '-error'"),
      }, [], { rest: true }),
      el("error", { id: js("uid + '-error'"), "aria-live": "polite" }, [expr("error")]),
    ]),
  },

  toggle: {
    tree: el("root", { "data-variant": js("variant") }, [
      el("control", {
        type: "checkbox", name: js("name"), value: js("value"), checked: bool("checked"), disabled: bool("disabled"),
        "aria-invalid": aria("invalid"), role: js("variant === 'switch' ? 'switch' : null"),
      }, [], { rest: true }),
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
    openProp: "open",
    tree: el("root", { "data-variant": js("variant"), "aria-labelledby": js("uid + '-title'") }, [
      el("title", { id: js("uid + '-title'") }, [slot("title")]),
      whenSlot("description", [el("description", {}, [slot("description")])]),
      el("close", { type: "button", "aria-label": "Close" }, [text("&times;")]),
      slot("default"),
      whenSlot("actions", [el("actions", {}, [slot("actions")])]),
    ], { on: { close: "closed" } }),
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
    tree: el("root", {}, [
      el("list", { role: "tablist", "aria-label": js("label") }, [
        each("tabs", "tab", "i", [
          el("tab", {
            type: "button", role: "tab", id: js("uid + '-tab-' + i"), "aria-selected": ariaBool("i === 0"),
            "aria-controls": js("uid + '-panel-' + i"), tabindex: js("i === 0 ? 0 : -1"),
          }, [expr("tab")]),
        ]),
        el("indicator", { "aria-hidden": "true" }),
      ]),
      each("tabs", "tab", "i", [
        el("panel", { id: js("uid + '-panel-' + i"), role: "tabpanel", "aria-labelledby": js("uid + '-tab-' + i"), tabindex: "0", hidden: bool("i !== 0") }, [scoped("panel", ["tab", "i"])]),
      ]),
    ]),
  },

  toast: {
    dismissEvent: true,
    tree: el("root", { role: "status", "aria-label": js("label") }, [
      each("toasts", "t", "t.id", [
        el("toast", { "data-variant": js("t.variant ? t.variant : 'status'"), "data-id": js("t.id"), "data-timeout": js("t.timeout") }, [
          el("message", {}, [expr("t.message")]),
          when("t.action", [el("action", { type: "button" }, [expr("t.action")], { on: { click: "t.onAction && t.onAction(t)" } })]),
          el("dismiss", { type: "button", "aria-label": "Dismiss" }, [text("&times;")]),
        ]),
      ]),
      slot("default"),
    ], { rest: true }),
  },
};

/** Every node of the tree, depth first. */
export function walk(node, visit) {
  visit(node);
  for (const kid of node.kids ?? []) walk(kid, visit);
}

/** The part names the tree renders. */
export const partsOf = (tree) => { const out = new Set(); walk(tree, (n) => { if (n.k === "el" && n.part) out.add(n.part); }); return out; };
