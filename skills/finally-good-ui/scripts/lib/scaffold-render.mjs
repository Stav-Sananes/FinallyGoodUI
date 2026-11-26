// Renderers: the markup tree of scaffold-markup.mjs -> files for React, Vue, Svelte and Angular (standalone),
// and the plain HTML demo. Every framework file does the same three things: renders the spec's parts,
// exposes the spec's props, slots and events the way that framework does, and attaches the shared
// <name>.behaviour.js (attach(root) -> detach) from its lifecycle. Behaviour is never written per framework.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { partsOf } from "./scaffold-markup.mjs";

const pascal = (s) => s.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const ind = (lines, n = 1) => lines.map((l) => (l === "" ? l : `${"  ".repeat(n)}${l}`));
const VOID = new Set(["input", "br", "img", "hr"]);
const NONSTANDARD = new Set(["popover", "popovertarget"]); // not in the typings of React 18 / older TS DOM libs

export const tagFor = (spec) => spec.tags?.root ?? ({ button: "button", link: "a" })[spec.a11y.role] ?? "div";
const tagOfPart = (spec, part) => (part === "root" ? tagFor(spec) : spec.tags?.[part] ?? "span");

/** Everything the renderers need, derived from the spec and its markup tree. Throws when the tree and spec.parts disagree. */
export function viewOf(spec, markup) {
  const tree = markup.tree;
  const rendered = partsOf(tree);
  const rolePart = spec.a11y.rolePart ?? "root";
  if (!rendered.has(rolePart)) throw new Error(`scaffold: the role part "${rolePart}" of "${spec.name}" has no element in the markup`);
  const missing = spec.parts.filter((p) => !rendered.has(p));
  if (missing.length) throw new Error(`scaffold: markup for "${spec.name}" does not render spec part(s): ${missing.join(", ")}`);
  const extra = [...rendered].filter((p) => !spec.parts.includes(p));
  if (extra.length) throw new Error(`scaffold: markup for "${spec.name}" renders part(s) the spec does not list: ${extra.join(", ")}`);
  const slots = new Set(), scopedSlots = new Map();
  let usesUid = false, restPart = "root";
  const visit = (n, list) => {
    if (n.k === "slot" || n.k === "whenSlot") slots.add(n.name);
    if (n.k === "scoped") { scopedSlots.set(n.name, { args: n.args, list }); slots.add(n.name); }
    if (n.k === "el" && n.rest) restPart = n.part;
    if (n.k === "el") for (const v of Object.values(n.attrs)) if (JSON.stringify(v).includes("uid")) usesUid = true;
    for (const kid of n.kids ?? []) visit(kid, n.k === "each" ? n.list : list);
  };
  visit(tree, null);
  const used = new Set(spec.slots);
  for (const s of slots) if (!used.has(s)) throw new Error(`scaffold: markup for "${spec.name}" uses slot "${s}" that the spec does not list`);
  const props = spec.props.map((p) => ({ ...p, js: camel(p.name) }));
  const listProp = (name) => props.find((p) => p.name === name);
  return {
    name: spec.name, Name: pascal(spec.name), spec, tree, props, usesUid, restPart,
    slots: spec.slots, scopedSlots, listProp, openProp: markup.openProp ?? null, dismissEvent: Boolean(markup.dismissEvent),
    tagOf: (node) => node.tag ?? tagOfPart(spec, node.part ?? "span"),
    restTag: tagOfPart(spec, restPart),
    rootTag: tagFor(spec),
    itemType: (listName) => (listProp(listName)?.ts ?? "unknown[]").replace(/\[\]$/, ""),
  };
}

// The element/tag names of an element: a wired primitive replaces the root's tag.
function names(view, node, c) {
  const tag = view.tagOf(node);
  if (node.part === "root" && c.prim) return { name: c.prim.open(tag).slice(1), close: c.prim.close(tag) };
  return { name: tag, close: `</${tag}>` };
}
const ELEMENT_TYPE = { button: "HTMLButtonElement", dialog: "HTMLDialogElement", div: "HTMLDivElement", label: "HTMLLabelElement", input: "HTMLInputElement" };

const lit = (p) => (p.type === "array" ? "[]" : p.default === undefined ? "undefined" : p.type === "boolean" ? String(p.default === "true" || p.default === true) : JSON.stringify(String(p.default)));
const tsType = (p) => p.ts ?? (p.type === "boolean" ? "boolean" : p.type === "string" ? "string" : "unknown");
const slotName = (s) => (s === "default" ? "children" : camel(s));

// Whether the loop body refers to its index `i` (the key counts): unused loop variables are lint errors in strict projects.
const usesIndex = (node) => node.key === "i" || /(^|[^\w.$])i([^\w$]|$)/.test(JSON.stringify(node.kids));
const indexVar = (node) => (usesIndex(node) ? ", i" : "");

// A long opening tag goes one attribute per line.
function openTag(tag, attrs, selfClose = false) {
  const one = `<${tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}${selfClose ? " />" : ">"}`;
  if (one.length <= 110 || attrs.length < 2) return [one];
  return [`<${tag}`, ...ind(attrs), selfClose ? "/>" : ">"];
}

// Joins "<tag attrs>" , kids, "</tag>" for the element; `head` is the opening-tag lines.
function wrap(head, kids, closer) {
  if (!kids.length) return head.length === 1 ? [`${head[0]}${closer}`] : [...head, closer];
  return [...head, ...ind(kids), closer];
}

/** The attributes shared by all frameworks, in order: data-fgu, data-part, then the tree's. */
const baseAttrs = (view, node) => [
  ...(node.part === "root" ? [["data-fgu", view.name]] : []),
  ...(node.part ? [["data-part", node.part]] : []),
  ...Object.entries(node.attrs),
];

// ===================================================================== React
const REACT_NAME = { for: "htmlFor", tabindex: "tabIndex", autocomplete: "autoComplete", checked: "defaultChecked" };

function reactAttrs(view, node, c) {
  const out = [], spread = [];
  for (const [name, v] of baseAttrs(view, node)) {
    const n = REACT_NAME[name] ?? name;
    if (NONSTANDARD.has(name)) { spread.push(`${name}: ${v === true ? '""' : typeof v === "string" ? JSON.stringify(v) : v.js}`); continue; }
    if (typeof v === "string") out.push(name === "tabindex" ? `${n}={${v}}` : `${n}="${v}"`);
    else if (v === true) out.push(n);
    else if (v.js !== undefined) out.push(`${n}={${v.js}}`);
    else if (v.bool !== undefined) out.push(`${n}={${v.bool}}`);
    else if (v.aria !== undefined) out.push(`${n}={${v.aria} ? "true" : undefined}`);
    else if (v.ariaBool !== undefined) out.push(`${n}={${v.ariaBool} ? "true" : "false"}`);
  }
  if (spread.length) out.push(`{...{ ${spread.join(", ")} }}`);
  for (const [event, handler] of Object.entries(node.on ?? {})) if (event === "click") out.push(`onClick={() => ${handler}}`);
  return out;
}

function reactNode(view, node, c) {
  switch (node.k) {
    case "text": return [node.t];
    case "expr": return [`{${node.js}}`];
    case "slot": return [`{${slotName(node.name)}}`];
    case "scoped": return [`{${slotName(node.name)}?.(${node.args.join(", ")})}`];
    case "whenSlot": return [`{${slotName(node.name)} ? (`, ...ind(reactKids(view, node.kids, c)), ") : null}"];
    case "when": return [`{${node.js} ? (`, ...ind(reactKids(view, node.kids, c)), ") : null}"];
    case "each": {
      const kids = node.kids.map((k) => ({ ...k, attrs: { ...k.attrs }, key: node.key }));
      return [`{${node.list}.map((${node.as}${indexVar(node)}) => (`, ...ind(reactKids(view, kids, c)), "))}"];
    }
    case "el": return reactEl(view, node, c);
  }
}
const reactKids = (view, kids, c) => {
  const lines = kids.flatMap((k) => reactNode(view, k, c));
  const roots = kids.filter((k) => k.k === "el").length;
  return kids.length > 1 && roots === kids.length ? ["<>", ...ind(lines), "</>"] : lines;
};

function reactEl(view, node, c) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  const attrs = reactAttrs(view, node, c);
  if (node.key) attrs.unshift(`key={${node.key}}`);
  if (root && c.shared) attrs.push("ref={ref}");
  if (root && c.prim) { const g = reactGuard(view, c); if (g) attrs.push(g); }
  if (node.rest || (root && view.restPart === "root")) attrs.push("{...rest}");
  const kids = (node.kids ?? []).flatMap((k) => reactNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, close);
}

const reactGuard = (view, c) => {
  const busy = view.spec.states.find((s) => s.attribute === "aria-busy" && view.props.some((p) => p.name === s.name));
  return busy ? `onClickCapture={(e) => { if (${camel(busy.name)}) { e.preventDefault(); e.stopPropagation(); } }}` : "";
};

export function react(view, c) {
  const { name, Name } = view;
  const propNames = view.props.map((p) => p.js);
  const slotProps = [...view.slots.map(slotName)];
  const extra = view.dismissEvent ? ["onDismiss"] : [];
  const destructure = [...view.props.map((p) => `${p.js}${p.type === "array" || p.default !== undefined ? ` = ${lit(p)}` : ""}`), ...slotProps, ...extra, "...rest"];
  const restTag = view.restTag;
  const omit = [...propNames, ...slotProps, ...extra, ...(view.slots.includes("default") ? [] : ["children"])].map((n) => `"${n}"`).join(" | ");
  const types = c.typescript
    ? `\nexport type ${Name}Props = {\n${[
      ...view.props.map((p) => `  ${p.js}?: ${tsType(p)};`),
      ...view.slots.map((s) => (view.scopedSlots.has(s) ? `  ${slotName(s)}?: (${view.scopedSlots.get(s).args[0]}: ${view.itemType(view.scopedSlots.get(s).list)}, index: number) => ReactNode;` : `  ${slotName(s)}?: ReactNode;`)),
      ...(view.dismissEvent ? ["  /** Called with the toast id when one leaves: remove it from `toasts`. */\n  onDismiss?: (id: string) => void;"] : []),
    ].join("\n")}\n} & Omit<ComponentPropsWithoutRef<"${restTag}">, ${omit}>;\n`
    : "";
  const hooks = [...(c.shared ? ["useEffect", "useRef"] : []), ...(view.usesUid ? ["useId"] : [])];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : [])];
  const imports = [
    ...(c.typescript ? [`import type { ComponentPropsWithoutRef, ReactNode } from "react";`] : []),
    ...(hooks.length ? [`import { ${hooks.join(", ")} } from "react";`] : []),
    ...(c.prim ? [c.prim.imp] : []),
    `import "./${name}.css";`,
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
  ];
  const el = ELEMENT_TYPE[view.rootTag] ?? "HTMLElement";
  const body = [
    ...(c.shared ? [`const ref = useRef${c.typescript ? `<${el}>` : ""}(null);`] : []),
    ...(view.usesUid ? ["const uid = useId();"] : []),
    ...(c.shared ? ["useEffect(() => (ref.current ? attach(ref.current) : undefined), []);"] : []),
    ...(c.shared && view.openProp ? [
      `useEffect(() => {`,
      `  const dialog = ref.current;`,
      `  if (!dialog) return;`,
      `  if (${view.openProp}) openDialog(dialog); else closeDialog(dialog);`,
      `}, [${view.openProp}]);`,
    ] : []),
    ...(c.shared && view.dismissEvent ? [
      "// A leaving toast fires a cancelable `dismiss`; the component keeps the node and hands the id to you, so React stays the owner of the list.",
      "useEffect(() => {",
      "  const region = ref.current;",
      "  if (!region) return;",
      `  const handle = (event${c.typescript ? ": Event" : ""}) => {`,
      "    event.preventDefault();",
      `    onDismiss?.(${c.typescript ? "(event.target as HTMLElement)" : "event.target"}.dataset.id ?? "");`,
      "  };",
      '  region.addEventListener("dismiss", handle);',
      '  return () => region.removeEventListener("dismiss", handle);',
      "}, [onDismiss]);",
    ] : []),
  ];
  const jsx = reactNode(view, view.tree, c);
  const sig = c.typescript ? `}: ${Name}Props` : "}";
  const content = `${imports.join("\n")}\n${types}\nexport function ${Name}({ ${destructure.join(", ")} ${sig}) {\n${ind(body).join("\n")}${body.length ? "\n" : ""}  return (\n${ind(jsx, 2).join("\n")}\n  );\n}\n`;
  return [{ ext: c.typescript ? ".tsx" : ".jsx", content }];
}

// ===================================================================== Vue
function vueAttrs(view, node, c) {
  const out = [];
  for (const [name, v] of baseAttrs(view, node)) {
    if (typeof v === "string") out.push(`${name}="${v}"`);
    else if (v === true) out.push(name);
    else if (v.js !== undefined) out.push(`:${name}="${v.js}"`);
    else if (v.bool !== undefined) out.push(`:${name}="${v.bool}"`);
    else if (v.aria !== undefined) out.push(`:${name}="${v.aria} ? 'true' : undefined"`);
    else if (v.ariaBool !== undefined) out.push(`:${name}="${v.ariaBool} ? 'true' : 'false'"`);
  }
  return out;
}

function vueNode(view, node, c, extra = []) {
  switch (node.k) {
    case "text": return [node.t];
    case "expr": return [`{{ ${node.js} }}`];
    case "slot": return [node.name === "default" ? "<slot />" : `<slot name="${node.name}" />`];
    case "scoped": return [`<slot name="${node.name}" :${node.args[0]}="${node.args[0]}" :index="${node.args[1]}" />`];
    case "whenSlot": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-if="$slots.${node.name}"`]));
    case "when": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-if="${node.js}"`]));
    case "each": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-for="(${node.as}${indexVar(node)}) in ${node.list}"`, `:key="${node.key}"`]));
    case "el": return vueEl(view, node, c, extra);
  }
}

function vueEl(view, node, c, extra) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  const attrs = [...extra, ...(root && c.shared ? ['ref="el"'] : []), ...vueAttrs(view, node, c)];
  for (const [event, handler] of Object.entries(node.on ?? {})) if (event === "click") attrs.push(`@click="${handler}"`);
  if (view.dismissEvent && root) attrs.push('@dismiss="onDismiss"');
  if (root && c.prim) { const g = vueGuard(view); if (g) attrs.push(g); }
  if (node.rest && !root) attrs.push('v-bind="$attrs"');
  const kids = (node.kids ?? []).flatMap((k) => vueNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, close);
}

const vueGuard = (view) => {
  const busy = view.spec.states.find((s) => s.attribute === "aria-busy" && view.props.some((p) => p.name === s.name));
  return busy ? `@click.capture="(e: Event) => { if (${busy.name}) { e.preventDefault(); e.stopImmediatePropagation(); } }"` : "";
};

export function vue(view, c) {
  const { name } = view;
  const defaults = view.props.filter((p) => p.default !== undefined || p.type === "array").map((p) => `${p.js}: ${p.type === "array" ? "() => []" : lit(p)}`);
  const vueImports = [
    ...(c.shared ? ["onBeforeUnmount", "onMounted", "ref"] : []),
    ...(view.usesUid ? ["getCurrentInstance"] : []),
    ...(c.shared && view.openProp ? ["watch"] : []),
  ];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : [])];
  // `close` needs no emit: a parent's @close falls through to the native <dialog>.
  const emits = view.dismissEvent ? ["dismiss: [id: string]"] : [];
  const script = [
    ...(vueImports.length ? [`import { ${vueImports.join(", ")} } from "vue";`] : []),
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
    "",
    ...(view.restPart !== "root" ? ["defineOptions({ inheritAttrs: false });"] : []),
    `${c.shared && view.openProp ? "const props = " : ""}withDefaults(defineProps<{ ${view.props.map((p) => `${p.js}?: ${tsType(p)}`).join("; ")} }>(), { ${defaults.join(", ")} });`,
    ...(emits.length ? [`const emit = defineEmits<{ ${emits.join("; ")} }>();`] : []),
    ...(view.usesUid ? [`const uid = \`fgu-${name}-\${getCurrentInstance()?.uid ?? 0}\`;`] : []),
    ...(view.dismissEvent ? [
      "// A leaving toast fires a cancelable `dismiss`; keep the node and hand the id to the parent, which owns the list.",
      "function onDismiss(event: Event) {",
      "  event.preventDefault();",
      '  emit("dismiss", (event.target as HTMLElement).dataset.id ?? "");',
      "}",
    ] : []),
    ...(c.shared ? [
      `const el = ref<${ELEMENT_TYPE[view.rootTag] ?? "HTMLElement"} | null>(null);`,
      "let detach: (() => void) | undefined;",
      `onMounted(() => {\n  if (!el.value) return;\n  detach = attach(el.value);${view.openProp ? `\n  if (props.${view.openProp}) openDialog(el.value);` : ""}\n});`,
      "onBeforeUnmount(() => detach?.());",
      ...(view.openProp ? [`watch(() => props.${view.openProp}, (value) => {\n  if (!el.value) return;\n  if (value) openDialog(el.value); else closeDialog(el.value);\n});`] : []),
    ] : []),
  ];
  const tpl = vueNode(view, view.tree, c);
  const content = `<script setup lang="ts">\n${script.join("\n")}\n</script>\n\n<template>\n${ind(tpl).join("\n")}\n</template>\n\n<style src="./${name}.css"></style>\n`;
  return [{ ext: ".vue", content }];
}

// ===================================================================== Svelte
function svelteAttrs(view, node, c) {
  const out = [];
  for (const [name, v] of baseAttrs(view, node)) {
    if (typeof v === "string") out.push(`${name}="${v}"`);
    else if (v === true) out.push(name);
    else if (v.js !== undefined) out.push(`${name}={${v.js}}`);
    else if (v.bool !== undefined) out.push(`${name}={${v.bool}}`);
    else if (v.aria !== undefined) out.push(`${name}={${v.aria} ? "true" : undefined}`);
    else if (v.ariaBool !== undefined) out.push(`${name}={${v.ariaBool} ? "true" : "false"}`);
  }
  for (const [event, handler] of Object.entries(node.on ?? {})) if (event === "click") out.push(`onclick={() => ${handler}}`);
  return out;
}

function svelteNode(view, node, c) {
  switch (node.k) {
    case "text": return [node.t];
    case "expr": return [`{${node.js}}`];
    case "slot": return [`{@render ${slotName(node.name)}?.()}`];
    case "scoped": return [`{@render ${slotName(node.name)}?.(${node.args.join(", ")})}`];
    case "whenSlot": return [`{#if ${slotName(node.name)}}`, ...ind(node.kids.flatMap((k) => svelteNode(view, k, c))), "{/if}"];
    case "when": return [`{#if ${node.js}}`, ...ind(node.kids.flatMap((k) => svelteNode(view, k, c))), "{/if}"];
    case "each": return [`{#each ${node.list} as ${node.as}${indexVar(node)} (${node.key})}`, ...ind(node.kids.flatMap((k) => svelteNode(view, k, c))), "{/each}"];
    case "el": return svelteEl(view, node, c);
  }
}

function svelteEl(view, node, c) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  const attrs = svelteAttrs(view, node, c);
  if (root && c.shared) attrs.push(view.openProp ? `use:behaviour={${view.openProp}}` : "use:behaviour");
  if (root && view.dismissEvent) attrs.push("use:dismissListener");
  if (root && c.prim) { const g = svelteGuard(view); if (g) attrs.push(g); }
  if (node.rest || (root && view.restPart === "root")) attrs.push("{...rest}");
  const kids = (node.kids ?? []).flatMap((k) => svelteNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, close);
}

const svelteGuard = (view) => {
  const busy = view.spec.states.find((s) => s.attribute === "aria-busy" && view.props.some((p) => p.name === s.name));
  return busy ? `onclickcapture={(e) => { if (${camel(busy.name)}) { e.preventDefault(); e.stopImmediatePropagation(); } }}` : "";
};

export function svelte(view, c) {
  const { name } = view;
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : [])];
  const props = [
    ...view.props.map((p) => `${p.js}${p.type === "array" || p.default !== undefined ? ` = ${lit(p)}` : ""}`),
    ...view.slots.map(slotName),
    ...(view.dismissEvent ? ["ondismiss"] : []),
    "...rest",
  ];
  const moduleScript = view.usesUid ? `<script module lang="ts">\n  let counter = 0;\n</script>\n\n` : "";
  const script = [
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
    `import "./${name}.css";`,
    "",
    `let { ${props.join(", ")} } = $props();`,
    ...(view.usesUid ? [`const uid = \`fgu-${name}-\${++counter}\`;`] : []),
    ...(c.shared ? [
      "",
      "// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.",
      ...(view.openProp ? [
        `function behaviour(node: HTMLElement, isOpen: boolean) {`,
        `  const detach = attach(node);`,
        `  const sync = (open: boolean) => (open ? openDialog(node) : closeDialog(node));`,
        `  sync(isOpen);`,
        `  return { update: sync, destroy: detach };`,
        `}`,
      ] : [
        `function behaviour(node: HTMLElement) {`,
        `  const detach = attach(node);`,
        `  return { destroy: detach };`,
        `}`,
      ]),
    ] : []),
    ...(view.dismissEvent ? [
      "",
      "// A leaving toast fires a cancelable `dismiss`; keep the node and hand the id to the parent, which owns the list.",
      "function dismissListener(node: HTMLElement) {",
      "  const handle = (event: Event) => {",
      "    event.preventDefault();",
      '    ondismiss?.((event.target as HTMLElement).dataset.id ?? "");',
      "  };",
      '  node.addEventListener("dismiss", handle);',
      '  return { destroy: () => node.removeEventListener("dismiss", handle) };',
      "}",
    ] : []),
  ];
  const tpl = svelteNode(view, view.tree, c);
  // `onclose` needs no prop: a parent's onclose lands in `rest`, which is spread on the <dialog>.
  const content = `${moduleScript}<script lang="ts">\n${script.join("\n")}\n</script>\n\n${tpl.join("\n")}\n`;
  return [{ ext: ".svelte", content }];
}

// ===================================================================== Angular
function angularAttrs(view, node, c) {
  const out = [];
  for (const [name, v] of baseAttrs(view, node)) {
    const prop = name === "checked";
    if (typeof v === "string") out.push(`${name}="${v}"`);
    else if (v === true) out.push(name);
    else if (v.js !== undefined) out.push(`[attr.${name}]="${v.js}"`);
    else if (v.bool !== undefined) out.push(prop ? `[checked]="${v.bool}"` : `[attr.${name}]="${v.bool} ? '' : null"`);
    else if (v.aria !== undefined) out.push(`[attr.${name}]="${v.aria} ? 'true' : null"`);
    else if (v.ariaBool !== undefined) out.push(`[attr.${name}]="${v.ariaBool} ? 'true' : 'false'"`);
  }
  for (const [event, handler] of Object.entries(node.on ?? {})) out.push(event === "close" ? `(close)="${handler}.emit($event)"` : `(${event})="${handler}"`);
  return out;
}

function angularNode(view, node, c) {
  switch (node.k) {
    case "text": return [node.t];
    case "expr": return [`{{ ${node.js} }}`];
    case "slot": return [node.name === "default" ? "<ng-content />" : `<ng-content select="[slot=${node.name}]" />`];
    case "scoped": return [`<ng-container [ngTemplateOutlet]="${node.name}" [ngTemplateOutletContext]="{ $implicit: ${node.args[0]}, index: ${node.args[1]} }" />`];
    case "whenSlot": return node.kids.flatMap((k) => angularNode(view, k, c)); // content projection cannot be tested for: the part always renders
    case "when": return [`@if (${node.js}) {`, ...ind(node.kids.flatMap((k) => angularNode(view, k, c))), "}"];
    case "each": return [`@for (${node.as} of ${node.list}; track ${node.key === "i" ? "$index" : node.key}${usesIndex(node) ? "; let i = $index" : ""}) {`, ...ind(node.kids.flatMap((k) => angularNode(view, k, c))), "}"];
    case "el": return angularEl(view, node, c);
  }
}

function angularEl(view, node, c) {
  const { name } = names(view, node, { prim: null });
  const attrs = angularAttrs(view, node, c);
  if (node.part === "root" && view.dismissEvent) attrs.push('(dismiss)="onDismiss($event)"');
  const kids = (node.kids ?? []).flatMap((k) => angularNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, `</${name}>`);
}

export function angular(view, c) {
  const { name, Name } = view;
  const inputs = view.props.map((p) => `  @Input() ${p.js}: ${tsType(p)}${p.default === undefined && p.type !== "array" ? " | undefined" : ""}${p.default === undefined && p.type !== "array" ? "" : ` = ${lit(p)}`};`);
  const slotInputs = [...view.scopedSlots.entries()].map(([s, { list }]) => `  /** Template for each ${s}: <ng-template let-item let-index="index">. */\n  @Input() ${slotName(s)}: TemplateRef<{ $implicit: ${view.itemType(list)}; index: number }> | undefined;`);
  const closeEvent = view.tree.on?.close;
  const outputs = [
    ...(closeEvent ? ["  @Output() closed = new EventEmitter<Event>();"] : []),
    ...(view.dismissEvent ? ["  /** Emits the toast id when one leaves: remove it from `toasts`. */\n  @Output() dismissed = new EventEmitter<string>();"] : []),
  ];
  const core = ["Component", "Input", "ViewEncapsulation", ...(outputs.length ? ["Output", "EventEmitter"] : []), ...(slotInputs.length ? ["TemplateRef"] : []),
    ...(c.shared ? ["ElementRef", "AfterViewInit", "OnDestroy", "inject"] : []), ...(c.shared && view.openProp ? ["OnChanges"] : [])];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : [])];
  const impls = [...(c.shared ? ["AfterViewInit", "OnDestroy"] : []), ...(c.shared && view.openProp ? ["OnChanges"] : [])];
  const members = [
    ...(view.usesUid ? [`  readonly uid = \`fgu-${name}-\${++nextId}\`;`] : []),
    ...inputs, ...slotInputs, ...outputs,
    ...(c.shared ? [
      "  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);",
      "  private detach?: () => void;",
      "",
      `  ngAfterViewInit() {\n    this.detach = attach(this.host.nativeElement);${view.openProp ? "\n    this.syncOpen();" : ""}\n  }`,
      "  ngOnDestroy() { this.detach?.(); }",
      ...(view.openProp ? [
        "  ngOnChanges() { this.syncOpen(); }",
        "  private syncOpen() {",
        '    const dialog = this.host.nativeElement.querySelector<HTMLDialogElement>(\'[data-part="root"]\');',
        "    if (!dialog || !this.detach) return;",
        `    if (this.${view.openProp}) openDialog(dialog); else closeDialog(dialog);`,
        "  }",
      ] : []),
    ] : []),
    ...(view.dismissEvent ? [
      "",
      "  // A leaving toast fires a cancelable `dismiss`; keep the node and hand the id to the parent, which owns the list.",
      "  onDismiss(event: Event) {",
      "    event.preventDefault();",
      '    this.dismissed.emit((event.target as HTMLElement).dataset["id"] ?? "");',
      "  }",
    ] : []),
  ];
  const imports = [`import { ${core.join(", ")} } from "@angular/core";`, ...(slotInputs.length ? ['import { NgTemplateOutlet } from "@angular/common";'] : []), ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : [])];
  const ts = `${imports.join("\n")}\n${view.usesUid ? "\nlet nextId = 0;\n" : ""}\n@Component({\n  selector: "fgu-${name}",\n  standalone: true,\n  ${slotInputs.length ? "imports: [NgTemplateOutlet],\n  " : ""}templateUrl: "./${name}.component.html",\n  styleUrl: "./${name}.css",\n  // The css is already scoped by data-fgu, and projected content has to be styled too.\n  encapsulation: ViewEncapsulation.None,\n  host: { style: "display: contents" },\n})\nexport class ${Name}Component${impls.length ? ` implements ${impls.join(", ")}` : ""} {\n${members.join("\n")}\n}\n`;
  const html = `${angularNode(view, view.tree, c).join("\n")}\n`;
  return [{ ext: ".component.ts", content: ts }, { ext: ".component.html", content: html }];
}

// ===================================================================== plain
/** The reference page for the component, re-pointed at the files the scaffold writes next to it. */
export function plain(spec, componentsRoot) {
  const ref = readFileSync(join(componentsRoot, spec.name, "reference/index.html"), "utf8");
  const content = ref
    .replace(/<title>[^<]*<\/title>/, `<title>${pascal(spec.name)}</title>`)
    .replace(/<!-- tokens\.css:[^\n]*-->\n?/, "<!-- load your tokens.css (emit-tokens.mjs --format css) before this stylesheet -->\n")
    .replace(/<link rel="stylesheet" href="tokens\.css">\n?/, "")
    .replace(`href="../${spec.name}.css"`, `href="./${spec.name}.css"`)
    .replace(`from "../${spec.name}.js"`, `from "./${spec.name}.behaviour.js"`);
  return [{ ext: ".html", content }];
}

