// Renderers: the markup tree of scaffold-markup.mjs -> files for React, Vue, Svelte and Angular (standalone),
// and the plain HTML demo. Every framework file does the same three things: renders the spec's parts,
// exposes the spec's props, slots and events the way that framework does, and attaches the shared
// <name>.behaviour.js (attach(root) -> detach) from its lifecycle. Behaviour is never written per framework.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { partsOf, EVENTS } from "./scaffold-markup.mjs";

const pascal = (s) => s.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const ind = (lines, n = 1) => lines.map((l) => (l === "" ? l : `${"  ".repeat(n)}${l}`));
const VOID = new Set(["input", "br", "img", "hr"]);
const NONSTANDARD = new Set(["popover", "popovertarget"]); // not in the typings of older React / TS DOM libs: spread, so they type-check everywhere
const REACT_SPREAD_NAME = { popovertarget: "popoverTarget" }; // React 19 only knows the camelCase spelling

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
  const models = new Set();
  const visit = (n, list) => {
    if (n.k === "slot" || n.k === "whenSlot") slots.add(n.name);
    if (n.k === "scoped") { scopedSlots.set(n.name, { args: n.args, list }); slots.add(n.name); }
    if (n.k === "el" && n.rest) restPart = n.part;
    if (n.k === "el" && n.model) models.add(n.model);
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
    slots: spec.slots, scopedSlots, listProp, openProp: markup.openProp ?? null, selectProp: markup.selectProp ?? null,
    syncProp: markup.openProp ?? markup.selectProp ?? null, models, events: (markup.events ?? []).map((k) => ({ key: k, ...EVENTS[k] })),
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

const lit = (p) => (p.type === "array" ? "[]" : p.default === undefined ? "undefined" : p.type === "boolean" ? String(p.default === "true" || p.default === true) : p.type === "number" ? String(p.default) : JSON.stringify(String(p.default)));
const tsType = (p) => p.ts ?? (p.type === "boolean" ? "boolean" : p.type === "string" ? "string" : p.type === "number" ? "number" : "unknown");
const hasDefault = (p) => p.type === "array" || p.default !== undefined;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const handlerName = (e) => `on${cap(e.dom)}`;
const usesEvent = (e, c) => Boolean(e.prevent) || /\bevent\b/.test(c.typescript ? e.payload.ts : e.payload.js);
const payloadOf = (e, c) => (c.typescript ? e.payload.ts : e.payload.js);
const T = (c, ts) => (c.typescript ? ts : "");
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
  // A single expression or entity stays on the opening line: whitespace around {{ error }} would make an empty element never :empty.
  const inline = kids.length === 1 && (/^\{\{[^}]*\}\}$/.test(kids[0]) || /^\{[\w.]+\}$/.test(kids[0]) || /^&\w+;$/.test(kids[0]));
  if (inline || !kids.length) return [...head.slice(0, -1), `${head.at(-1)}${kids[0] ?? ""}${closer}`]; // nothing between the tags, not even whitespace (a <textarea> has a value, not children)
  return [...head, ...ind(kids), closer];
}

/** The attributes shared by all frameworks, in order: data-fgu, data-part, then the tree's. */
const baseAttrs = (view, node) => [
  ...(node.part === "root" ? [["data-fgu", view.name]] : []),
  ...(node.part ? [["data-part", node.part]] : []),
  ...Object.entries(node.attrs),
];

// ===================================================================== React
const REACT_NAME = { for: "htmlFor", tabindex: "tabIndex", novalidate: "noValidate", autocomplete: "autoComplete", checked: "defaultChecked" };

function reactAttrs(view, node) {
  const out = [], spread = [];
  for (const [name, v] of baseAttrs(view, node)) {
    const n = REACT_NAME[name] ?? name;
    // Toggle: `checked` makes the checkbox controlled (pair it with onChange); without it the input is uncontrolled (defaultChecked passes through rest).
    if (name === "checked" && node.model === "checked") { spread.push("...(checked === undefined ? {} : { checked })"); continue; }
    if (NONSTANDARD.has(name)) { spread.push(`${REACT_SPREAD_NAME[name] ?? name}: ${v === true ? '""' : typeof v === "string" ? JSON.stringify(v) : v.js}`); continue; }
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
    case "choose": return [`{${node.js} ? (`, ...ind(reactKids(view, node.a, c)), ") : (", ...ind(reactKids(view, node.b, c)), ")}"];
    case "each": {
      const kids = node.kids.map((k) => ({ ...k, attrs: { ...k.attrs }, key: node.key }));
      return [`{${node.list}.map((${node.as}${indexVar(node)}) => (`, ...ind(reactKids(view, kids, c)), "))}"];
    }
    case "el": return reactEl(view, node, c);
  }
}
const reactKids = (view, kids, c) => {
  const lines = kids.flatMap((k) => reactNode(view, k, c));
  return kids.length > 1 && kids.every((k) => k.k === "el") ? ["<>", ...ind(lines), "</>"] : lines;
};

function reactEl(view, node, c) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  const attrs = reactAttrs(view, node);
  if (node.key) attrs.unshift(`key={${node.key}}`);
  if (root && c.shared) attrs.push("ref={ref}");
  if (root && c.prim) { const g = reactGuard(view); if (g) attrs.push(g); }
  // rest is typed for the <input>; a textarea sibling takes the same native props, so the spread is widened.
  if (node.rest || (root && view.restPart === "root")) attrs.push(name === "textarea" && c.typescript ? "{...(rest as object)}" : "{...rest}");
  const kids = (node.kids ?? []).flatMap((k) => reactNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, close);
}

const busyState = (view) => view.spec.states.find((s) => s.attribute === "aria-busy" && view.props.some((p) => p.name === s.name));
const reactGuard = (view) => {
  const busy = busyState(view);
  return busy ? `onClickCapture={(e) => { if (${camel(busy.name)}) { e.preventDefault(); e.stopPropagation(); } }}` : "";
};

export function react(view, c) {
  const { name, Name } = view;
  const propNames = view.props.map((p) => p.js);
  const slotProps = view.slots.map(slotName);
  const callbacks = view.events.filter((e) => e.react).map((e) => e.react);
  const destructure = [...view.props.map((p) => `${p.js}${hasDefault(p) && !(view.models.has("checked") && p.js === "checked") ? ` = ${lit(p)}` : ""}`), ...slotProps, ...callbacks, "...rest"];
  const omit = [...propNames, ...slotProps, ...callbacks, ...(view.slots.includes("default") ? [] : ["children"])].map((n) => `"${n}"`).join(" | ");
  const types = c.typescript
    ? `\nexport type ${Name}Props = {\n${[
      ...view.props.map((p) => `  ${p.js}?: ${tsType(p)};`),
      ...view.slots.map((s) => (view.scopedSlots.has(s) ? `  ${slotName(s)}?: (${view.scopedSlots.get(s).args[0]}: ${view.itemType(view.scopedSlots.get(s).list)}, index: number) => ReactNode;` : `  ${slotName(s)}?: ReactNode;`)),
      ...view.events.filter((e) => e.react).map((e) => `  ${e.react}?: (value: ${e.type}) => void;`),
    ].join("\n")}\n} & Omit<ComponentPropsWithoutRef<"${view.restTag}">, ${omit}>;\n`
    : "";
  const hooks = [...(c.shared ? ["useEffect", "useRef"] : []), ...(view.usesUid ? ["useId"] : [])];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : []), ...(view.selectProp ? ["selectTab"] : [])];
  const typeImports = ["ComponentPropsWithoutRef", ...(view.slots.length ? ["ReactNode"] : [])];
  const imports = [
    ...(c.typescript ? [`import type { ${typeImports.join(", ")} } from "react";`] : []),
    ...(hooks.length ? [`import { ${hooks.join(", ")} } from "react";`] : []),
    ...(c.prim ? [c.prim.imp] : []),
    `import "./${name}.css";`,
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
  ];
  const el = ELEMENT_TYPE[view.rootTag] ?? "HTMLElement";
  const eventEffects = c.shared ? view.events.filter((e) => e.react).flatMap((e) => [
    `// ${e.dom}: handed to ${e.react}${e.prevent ? "; the component keeps the node so React stays the owner of the list" : ""}.`,
    "useEffect(() => {",
    "  const target = ref.current;",
    "  if (!target) return;",
    `  const handle = (${usesEvent(e, c) ? `event${T(c, ": Event")}` : ""}) => {`,
    ...(e.prevent ? ["    event.preventDefault();"] : []),
    `    ${e.react}?.(${payloadOf(e, c)});`,
    "  };",
    `  target.addEventListener("${e.dom}", handle);`,
    `  return () => target.removeEventListener("${e.dom}", handle);`,
    `}, [${e.react}]);`,
  ]) : [];
  const body = [
    ...(c.shared ? [`const ref = useRef${T(c, `<${el}>`)}(null);`] : []),
    ...(view.usesUid ? ["const uid = useId();"] : []),
    ...(c.shared ? ["useEffect(() => (ref.current ? attach(ref.current) : undefined), []);"] : []),
    ...(c.shared && view.openProp ? [
      "useEffect(() => {", "  const dialog = ref.current;", "  if (!dialog) return;",
      `  if (${view.openProp}) openDialog(dialog); else closeDialog(dialog);`, `}, [${view.openProp}]);`,
    ] : []),
    ...(c.shared && view.selectProp ? [
      "useEffect(() => {", `  if (ref.current && ${view.selectProp} !== undefined) selectTab(ref.current, ${view.selectProp});`, `}, [${view.selectProp}]);`,
    ] : []),
    ...eventEffects,
  ];
  const jsx = reactNode(view, view.tree, c);
  const sig = c.typescript ? `}: ${Name}Props` : "}";
  const content = `${imports.join("\n")}\n${types}\nexport function ${Name}({ ${destructure.join(", ")} ${sig}) {\n${ind(body).join("\n")}${body.length ? "\n" : ""}  return (\n${ind(jsx, 2).join("\n")}\n  );\n}\n`;
  return [{ ext: c.typescript ? ".tsx" : ".jsx", content }];
}

// ===================================================================== Vue
function vueAttrs(view, node) {
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
    case "whenSlot": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-if="$slots['${node.name}']"`]));
    case "when": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-if="${node.js}"`]));
    case "choose": return [...node.a.flatMap((k) => vueNode(view, k, c, [`v-if="${node.js}"`])), ...node.b.flatMap((k) => vueNode(view, k, c, ["v-else"]))];
    case "each": return node.kids.flatMap((k) => vueNode(view, k, c, [`v-for="(${node.as}${indexVar(node)}) in ${node.list}"`, `:key="${node.key}"`]));
    case "el": return vueEl(view, node, c, extra);
  }
}

function vueEl(view, node, c, extra) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  let attrs = vueAttrs(view, node);
  if (node.model === "checked") attrs = attrs.filter((a) => !a.startsWith(":checked="));
  attrs = [...extra, ...(root && c.shared ? ['ref="el"'] : []), ...attrs];
  for (const [event, handler] of Object.entries(node.on ?? {})) if (event === "click") attrs.push(`@click="${handler}"`);
  if (node.model === "value") attrs.push(':value="modelValue"', `@input="emit('update:modelValue', ($event.target as HTMLInputElement | HTMLTextAreaElement).value)"`);
  if (node.model === "checked") attrs.push(':checked="modelValue ?? checked"', `@change="onChecked($event)"`);
  if (root) for (const e of view.events) attrs.push(`@${e.dom}="${handlerName(e)}"`);
  if (root && c.prim) { const g = vueGuard(view); if (g) attrs.push(g); }
  if (node.rest && !root) attrs.push('v-bind="$attrs"');
  const kids = (node.kids ?? []).flatMap((k) => vueNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, close);
}

const vueGuard = (view) => {
  const busy = busyState(view);
  return busy ? `@click.capture="(e: Event) => { if (${busy.name}) { e.preventDefault(); e.stopImmediatePropagation(); } }"` : "";
};

export function vue(view, c) {
  const { name } = view;
  const modelType = view.models.has("checked") ? "boolean" : "string";
  // vue-tsc cannot represent the DOM AutoFill union inside defineProps (TS2590): a plain string there
  const propTypes = [...view.props.map((p) => `${p.js}?: ${tsType(p) === "AutoFill" ? "string" : tsType(p)}`), ...(view.models.size ? [`modelValue?: ${modelType}`] : [])];
  const defaults = view.props.filter(hasDefault).map((p) => `${p.js}: ${p.type === "array" ? "() => []" : lit(p)}`);
  const usesProps = Boolean(view.syncProp);
  const vueImports = [
    ...(c.shared ? ["onBeforeUnmount", "onMounted", "ref"] : []),
    ...(view.usesUid ? ["getCurrentInstance"] : []),
    ...(c.shared && view.syncProp ? ["watch"] : []),
  ];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : []), ...(view.selectProp ? ["selectTab"] : [])];
  const emits = [
    ...view.events.flatMap((e) => [...(e.vue ? [`${e.vue}: [value: ${e.type}]`] : []), ...(e.sync ? [`"update:${e.sync}": [value: ${e.type}]`] : [])]),
    ...(view.models.size ? [`"update:modelValue": [value: ${modelType}]`] : []),
    ...(view.models.has("checked") ? ['"update:checked": [value: boolean]'] : []), // v-model:checked, parity with Svelte bind:checked
  ];
  const handlers = view.events.flatMap((e) => [
    `function ${handlerName(e)}(${usesEvent(e, c) ? "event: Event" : ""}) {`,
    ...(e.prevent ? ["  event.preventDefault();"] : []),
    ...(e.vue ? [`  emit("${e.vue}", ${e.payload.ts});`] : []),
    ...(e.sync ? [`  emit("update:${e.sync}", ${e.payload.ts});`] : []),
    "}",
  ]);
  const modelHandler = view.models.has("checked") ? [
    "function onChecked(event: Event) {",
    "  const value = (event.target as HTMLInputElement).checked;",
    '  emit("update:modelValue", value);',
    '  emit("update:checked", value);',
    "}",
  ] : [];
  const script = [
    ...(vueImports.length ? [`import { ${vueImports.join(", ")} } from "vue";`] : []),
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
    "",
    // inheritAttrs is off when the native attributes belong to an inner control; v-model is wired through modelValue instead.
    ...(view.restPart !== "root" ? ["defineOptions({ inheritAttrs: false });"] : []),
    `${usesProps ? "const props = " : ""}withDefaults(defineProps<{ ${propTypes.join("; ")} }>(), { ${defaults.join(", ")} });`,
    ...(emits.length ? [`const emit = defineEmits<{ ${emits.join("; ")} }>();`] : []),
    ...(view.usesUid ? [`const uid = \`fgu-${name}-\${getCurrentInstance()?.uid ?? 0}\`;`] : []),
    ...handlers,
    ...modelHandler,
    ...(c.shared ? [
      `const el = ref<${ELEMENT_TYPE[view.rootTag] ?? "HTMLElement"} | null>(null);`,
      "let detach: (() => void) | undefined;",
      `onMounted(() => {\n  if (!el.value) return;\n  detach = attach(el.value);${view.openProp ? `\n  if (props.${view.openProp}) openDialog(el.value);` : ""}${view.selectProp ? `\n  if (props.${view.selectProp} !== undefined) selectTab(el.value, props.${view.selectProp});` : ""}\n});`,
      "onBeforeUnmount(() => detach?.());",
      ...(view.openProp ? [`watch(() => props.${view.openProp}, (value) => {\n  if (!el.value) return;\n  if (value) openDialog(el.value); else closeDialog(el.value);\n});`] : []),
      ...(view.selectProp ? [`watch(() => props.${view.selectProp}, (value) => {\n  if (el.value && value !== undefined) selectTab(el.value, value);\n});`] : []),
    ] : []),
  ];
  const tpl = vueNode(view, view.tree, c);
  const content = `<script setup lang="ts">\n${script.join("\n")}\n</script>\n\n<template>\n${ind(tpl).join("\n")}\n</template>\n\n<style src="./${name}.css"></style>\n`;
  return [{ ext: ".vue", content }];
}

// ===================================================================== Svelte
function svelteAttrs(view, node) {
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
  if (node.model === "value") out.push("value={value}", "oninput={(e) => (value = e.currentTarget.value)}");
  if (node.model === "checked") out.push("onchange={(e) => (checked = e.currentTarget.checked)}");
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
    case "choose": return [`{#if ${node.js}}`, ...ind(node.a.flatMap((k) => svelteNode(view, k, c))), "{:else}", ...ind(node.b.flatMap((k) => svelteNode(view, k, c))), "{/if}"];
    case "each": return [`{#each ${node.list} as ${node.as}${indexVar(node)} (${node.key})}`, ...ind(node.kids.flatMap((k) => svelteNode(view, k, c))), "{/each}"];
    case "el": return svelteEl(view, node, c);
  }
}

function svelteEl(view, node, c) {
  const root = node.part === "root";
  const { name, close } = names(view, node, c);
  const attrs = svelteAttrs(view, node);
  if (root && c.shared) attrs.push(view.syncProp ? `use:behaviour={${view.syncProp}}` : "use:behaviour");
  if (root) for (const e of view.events) attrs.push(`use:listen${cap(e.dom)}`);
  if (root && c.prim) { const g = svelteGuard(view); if (g) attrs.push(g); }
  if (node.rest || (root && view.restPart === "root")) attrs.push("{...rest}");
  const kids = (node.kids ?? []).flatMap((k) => svelteNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true); // Svelte rejects a self-closing <textarea />
  return wrap(openTag(name, attrs), kids, close);
}

const svelteGuard = (view) => {
  const busy = busyState(view);
  return busy ? `onclickcapture={(e) => { if (${camel(busy.name)}) { e.preventDefault(); e.stopImmediatePropagation(); } }}` : "";
};

export function svelte(view, c) {
  const { name } = view;
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : []), ...(view.selectProp ? ["selectTab"] : [])];
  const bindable = new Set([...view.events.map((e) => e.sync).filter(Boolean), ...(view.models.has("checked") ? ["checked"] : [])]);
  const props = [
    ...view.props.map((p) => (bindable.has(p.js) ? `${p.js} = $bindable(${hasDefault(p) ? lit(p) : ""})` : `${p.js}${hasDefault(p) ? ` = ${lit(p)}` : ""}`)),
    ...(view.models.has("value") ? ["value = $bindable()"] : []),
    ...view.slots.map(slotName),
    ...view.events.filter((e) => e.svelte).map((e) => e.svelte),
    "...rest",
  ];
  const ts = c.typescript;
  const lang = ts ? ' lang="ts"' : "";
  // Typed props, so `type` is the button/submit/reset union and not a string; the index signature keeps the rest open.
  const propsType = `{ ${[
    ...view.props.map((p) => `${p.js}?: ${tsType(p)}`),
    ...(view.models.has("value") ? ["value?: string"] : []),
    ...view.slots.map((sl) => `${slotName(sl)}?: ${view.scopedSlots.has(sl) ? `Snippet<[${view.itemType(view.scopedSlots.get(sl).list)}, number]>` : "Snippet"}`),
    ...view.events.filter((e) => e.svelte).map((e) => `${e.svelte}?: (value: ${e.type}) => void`),
    "[key: string]: any",
  ].join("; ")} }`;
  const moduleScript = view.usesUid ? `<script module${lang}>\n  let counter = 0;\n</script>\n\n` : "";
  const syncType = view.openProp ? T(c, ": boolean") : T(c, ": number | undefined");
  const syncCall = view.openProp
    ? "open ? openDialog(node) : closeDialog(node)"
    : "if (value !== undefined) selectTab(node, value)";
  const behaviourFn = !c.shared ? [] : view.syncProp ? [
    "",
    "// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.",
    `function behaviour(node${T(c, ": HTMLElement")}, initial${syncType}) {`,
    "  const detach = attach(node);",
    ...(view.openProp ? [`  const sync = (open${T(c, ": boolean")}) => { if (open) openDialog(node); else closeDialog(node); };`] : [`  const sync = (value${T(c, ": number | undefined")}) => { ${syncCall}; };`]),
    "  sync(initial);",
    "  return { update: sync, destroy: detach };",
    "}",
  ] : [
    "",
    "// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.",
    `function behaviour(node${T(c, ": HTMLElement")}) {`,
    "  const detach = attach(node);",
    "  return { destroy: detach };",
    "}",
  ];
  const listeners = view.events.flatMap((e) => [
    "",
    `// ${e.dom}: ${e.prevent ? "keep the node and hand the value to the parent, which owns the list" : "keep the bound prop in step"}.`,
    `function listen${cap(e.dom)}(node${T(c, ": HTMLElement")}) {`,
    `  const handle = (${usesEvent(e, c) ? `event${T(c, ": Event")}` : ""}) => {`,
    ...(e.prevent ? ["    event.preventDefault();"] : []),
    ...(e.svelte ? [`    ${e.svelte}?.(${payloadOf(e, c)});`] : []),
    ...(e.sync ? [`    ${e.sync} = ${payloadOf(e, c)};`] : []),
    "  };",
    `  node.addEventListener("${e.dom}", handle);`,
    `  return { destroy: () => node.removeEventListener("${e.dom}", handle) };`,
    "}",
  ]);
  const script = [
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : []),
    ...(ts && view.slots.length ? ['import type { Snippet } from "svelte";'] : []),
    `import "./${name}.css";`,
    "",
    `let { ${props.join(", ")} }${ts ? `: ${propsType}` : ""} = $props();`,
    ...(view.usesUid ? [`const uid = \`fgu-${name}-\${++counter}\`;`] : []),
    ...behaviourFn,
    ...listeners,
  ];
  const tpl = svelteNode(view, view.tree, c);
  const content = `${moduleScript}<script${lang}>\n${script.join("\n")}\n</script>\n\n${tpl.join("\n")}\n`;
  return [{ ext: ".svelte", content }];
}

// ===================================================================== Angular
// An input called `id` would also set the id of the <fgu-…> host element: the Angular class names it controlId.
const NG_RENAME = { id: "controlId" };
const ngx = (js) => js.replace(/(?<![\w.$'"-])id(?![\w'"-])/g, NG_RENAME.id);
const ngName = (p) => NG_RENAME[p.js] ?? p.js;

function angularAttrs(view, node) {
  const out = [];
  for (let [name, v] of baseAttrs(view, node)) {
    if (v && typeof v === "object") v = Object.fromEntries(Object.entries(v).map(([k, e]) => [k, ngx(e)]));
    const prop = name === "checked";
    if (typeof v === "string") out.push(`${name}="${v}"`);
    else if (v === true) out.push(name);
    else if (v.js !== undefined) out.push(`[attr.${name}]="${v.js}"`);
    else if (v.bool !== undefined) out.push(prop ? `[checked]="${v.bool}"` : `[attr.${name}]="${v.bool} ? '' : null"`);
    else if (v.aria !== undefined) out.push(`[attr.${name}]="${v.aria} ? 'true' : null"`);
    else if (v.ariaBool !== undefined) out.push(`[attr.${name}]="${v.ariaBool} ? 'true' : 'false'"`);
  }
  for (const [event, handler] of Object.entries(node.on ?? {})) out.push(`(${event})="${handler}"`);
  if (node.model === "value") out.push("[value]=\"value\"", '(input)="onValueInput($event)"');
  if (node.model === "checked") out.push('(change)="onCheckedChange($event)"');
  return out;
}

function angularNode(view, node, c) {
  switch (node.k) {
    case "text": return [node.t];
    case "expr": return [`{{ ${node.js} }}`];
    case "slot": return [node.name === "default" ? "<ng-content />" : `<ng-content select="[slot=${node.name}]" />`];
    case "scoped": return [`<ng-container [ngTemplateOutlet]="${node.name}" [ngTemplateOutletContext]="{ $implicit: ${node.args[0]}, index: ${node.args[1]} }" />`];
    case "whenSlot": return node.kids.flatMap((k) => angularNode(view, k, c)); // content projection cannot be tested for: the part always renders
    case "when": return [`@if (${ngx(node.js)}) {`, ...ind(node.kids.flatMap((k) => angularNode(view, k, c))), "}"];
    case "choose": return [`@if (${ngx(node.js)}) {`, ...ind(node.a.flatMap((k) => angularNode(view, k, c))), "} @else {", ...ind(node.b.flatMap((k) => angularNode(view, k, c))), "}"];
    case "each": return [`@for (${node.as} of ${node.list}; track ${node.key === "i" ? "$index" : node.key}${usesIndex(node) ? "; let i = $index" : ""}) {`, ...ind(node.kids.flatMap((k) => angularNode(view, k, c))), "}"];
    case "el": return angularEl(view, node, c);
  }
}

function angularEl(view, node, c) {
  const { name } = names(view, node, { prim: null });
  const attrs = angularAttrs(view, node);
  if (node.part === "root") for (const e of view.events) attrs.push(`(${e.dom})="${handlerName(e)}(${usesEvent(e, c) ? "$event" : ""})"`);
  const kids = (node.kids ?? []).flatMap((k) => angularNode(view, k, c));
  if (!kids.length && VOID.has(name)) return openTag(name, attrs, true);
  return wrap(openTag(name, attrs), kids, `</${name}>`);
}

const outputName = (e) => (e.sync ? `${e.sync}Change` : e.angular);

export function angular(view, c) {
  const { name, Name } = view;
  // Strict templates: a bare attribute (<fgu-field required>) is the string "", so boolean and number inputs carry a transform; arrays may be readonly.
  const transform = (p) => (p.type === "boolean" ? "{ transform: booleanAttribute }" : p.type === "number" ? "{ transform: numberAttribute }" : "");
  const inputType = (p) => (p.type === "array" ? `readonly ${tsType(p)}` : tsType(p));
  const inputs = view.props.map((p) => `  @Input(${p.js === "id" ? `{ alias: "controlId"${transform(p) ? `, ${transform(p).slice(2, -2)}` : ""} }` : transform(p)}) ${ngName(p)}: ${inputType(p)}${hasDefault(p) ? ` = ${lit(p)}` : " | undefined"};`);
  const models = [
    ...(view.models.has("value") ? ["  @Input() value: string | undefined;", "  @Output() valueChange = new EventEmitter<string>();"] : []),
    ...(view.models.has("checked") ? ["  @Output() checkedChange = new EventEmitter<boolean>();"] : []),
  ];
  const modelHandlers = [
    ...(view.models.has("value") ? ["", "  onValueInput(event: Event) {", "    this.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;", "    this.valueChange.emit(this.value);", "  }"] : []),
    ...(view.models.has("checked") ? ["", "  onCheckedChange(event: Event) {", "    this.checked = (event.target as HTMLInputElement).checked;", "    this.checkedChange.emit(this.checked);", "  }"] : []),
  ];
  const slotInputs = [...view.scopedSlots.entries()].map(([s, { list }]) => `  /** Template for each ${s}: <ng-template let-item let-index="index">. */\n  @Input() ${slotName(s)}: TemplateRef<{ $implicit: ${view.itemType(list)}; index: number }> | null = null;`);
  const outputs = view.events.map((e) => `  @Output() ${outputName(e)} = new EventEmitter<${e.type}>();`);
  const syncs = c.shared ? [view.openProp, view.selectProp].filter(Boolean) : [];
  const attrFns = [...(view.props.some((p) => p.type === "boolean") ? ["booleanAttribute"] : []), ...(view.props.some((p) => p.type === "number") ? ["numberAttribute"] : [])];
  const core = ["Component", "Input", "ViewEncapsulation", ...attrFns, ...(outputs.length || models.length ? ["Output", "EventEmitter"] : []), ...(slotInputs.length ? ["TemplateRef"] : []),
    ...(c.shared ? ["ElementRef", "AfterViewInit", "OnDestroy", "inject"] : []), ...(syncs.length ? ["OnChanges"] : [])];
  const behaviourImports = ["attach", ...(view.openProp ? ["openDialog", "closeDialog"] : []), ...(view.selectProp ? ["selectTab"] : [])];
  const impls = [...(c.shared ? ["AfterViewInit", "OnDestroy"] : []), ...(syncs.length ? ["OnChanges"] : [])];
  const syncBody = [
    ...(view.openProp ? [
      '    const dialog = this.host.nativeElement.querySelector<HTMLDialogElement>(\'[data-part="root"]\');',
      "    if (dialog) { if (this.open) openDialog(dialog); else closeDialog(dialog); }",
    ] : []),
    ...(view.selectProp ? [
      "    const root = this.host.nativeElement.querySelector<HTMLElement>('[data-part=\"root\"]');",
      "    if (root && this.selected !== undefined) selectTab(root, this.selected);",
    ] : []),
  ];
  const handlers = view.events.flatMap((e) => [
    "",
    `  ${handlerName(e)}(${usesEvent(e, c) ? "event: Event" : ""}) {`,
    ...(e.prevent ? ["    event.preventDefault();"] : []),
    `    this.${outputName(e)}.emit(${e.payload.ts});`,
    "  }",
  ]);
  const members = [
    ...(view.usesUid ? [`  readonly uid = \`fgu-${name}-\${++nextId}\`;`] : []),
    ...inputs, ...models, ...slotInputs, ...outputs,
    ...(c.shared ? [
      "  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);",
      "  private detach?: () => void;",
      "",
      `  ngAfterViewInit() {\n    this.detach = attach(this.host.nativeElement);${syncs.length ? "\n    this.syncControlled();" : ""}\n  }`,
      "  ngOnDestroy() { this.detach?.(); }",
      ...(syncs.length ? [
        "  ngOnChanges() { this.syncControlled(); }",
        "  private syncControlled() {",
        "    if (!this.detach) return;",
        ...syncBody,
        "  }",
      ] : []),
    ] : []),
    ...handlers, ...modelHandlers,
  ];
  const imports = [`import { ${core.join(", ")} } from "@angular/core";`, ...(slotInputs.length ? ['import { NgTemplateOutlet } from "@angular/common";'] : []), ...(c.shared ? [`import { ${behaviourImports.join(", ")} } from "./${name}.behaviour.js";`] : [])];
  const ts = `${imports.join("\n")}\n${view.usesUid ? "\nlet nextId = 0;\n" : ""}\n@Component({\n  selector: "fgu-${name}",\n  standalone: true,\n  ${slotInputs.length ? "imports: [NgTemplateOutlet],\n  " : ""}templateUrl: "./${name}.component.html",\n  styleUrl: "./${name}.css",\n  // The css is already scoped by data-fgu, and projected content has to be styled too.\n  encapsulation: ViewEncapsulation.None,\n  host: { style: "display: contents" },\n})\nexport class ${Name}Component${impls.length ? ` implements ${impls.join(", ")}` : ""} {\n${members.join("\n")}\n}\n`;
  const html = `${angularNode(view, view.tree, c).join("\n")}\n`;
  return [{ ext: ".component.ts", content: ts }, { ext: ".component.html", content: html }];
}

// ===================================================================== toast store
/** The optional second file of the toast: where the list lives, per framework. null for plain HTML. */
export function toastStore(family, c) {
  const ts = c.typescript;
  const item = `{ id: string; message: string; variant?: "status" | "error"; timeout?: number; action?: string; onAction?: (id: string) => void }`;
  const types = ts ? `export type ToastItem = ${item};\nexport type ToastInput = Omit<ToastItem, "id">;\n\n` : "";
  const head = "// Where the toast list lives. The component keeps the node and hands you the id (onDismiss / dismiss / ondismiss / dismissed): remove it here.\n";
  const T_ = (t) => (ts ? t : "");
  if (family === "react") {
    const content = `${head}import { createContext, useCallback, useContext, useMemo, useState } from "react";
${ts ? 'import type { ReactNode } from "react";\n' : ""}import { Toast } from "./toast";

${types}${ts ? "type ToastApi = { toasts: ToastItem[]; push: (toast: ToastInput) => string; dismiss: (id: string) => void };\n" : ""}const ToastContext = createContext${T_("<ToastApi | null>")}(null);
let counter = 0;

/** Put it once near the root: it renders the live region and owns the list. */
export function ToastProvider({ children }${T_(": { children?: ReactNode }")}) {
  const [toasts, setToasts] = useState${T_("<ToastItem[]>")}([]);
  const dismiss = useCallback((id${T_(": string")}) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback((toast${T_(": ToastInput")}) => {
    const id = \`toast-\${++counter}\`;
    setToasts((all) => [...all, { ...toast, id }]);
    return id;
  }, []);
  const api = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** const { push } = useToast(); push({ message: "Saved" }) */
export function useToast()${T_(": ToastApi")} {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a <ToastProvider> above it");
  return api;
}
`;
    return { file: `toast-store.${ts ? "tsx" : "jsx"}`, content };
  }
  if (family === "vue") {
    return { file: "toast-store.ts", content: `${head}import { reactive } from "vue";

export type ToastItem = ${item};
export type ToastInput = Omit<ToastItem, "id">;

// One list for the app: <Toast :toasts="toasts" @dismiss="dismiss" /> once, near the root; useToast() anywhere.
const toasts = reactive<ToastItem[]>([]);
let counter = 0;

export function useToast() {
  function push(toast: ToastInput): string {
    const id = \`toast-\${++counter}\`;
    toasts.push({ ...toast, id });
    return id;
  }
  function dismiss(id: string) {
    const at = toasts.findIndex((t) => t.id === id);
    if (at >= 0) toasts.splice(at, 1);
  }
  return { toasts, push, dismiss };
}
` };
  }
  if (family === "svelte") {
    return { file: `toast-store.${ts ? "ts" : "js"}`, content: `${head}import { writable } from "svelte/store";

${types}// <Toast toasts={$toasts} ondismiss={dismissToast} /> once, near the root; pushToast() anywhere.
export const toasts = writable${T_("<ToastItem[]>")}([]);
let counter = 0;

export function pushToast(toast${T_(": ToastInput")})${T_(": string")} {
  const id = \`toast-\${++counter}\`;
  toasts.update((all) => [...all, { ...toast, id }]);
  return id;
}

export function dismissToast(id${T_(": string")}) {
  toasts.update((all) => all.filter((t) => t.id !== id));
}
` };
  }
  if (family === "angular") {
    return { file: "toast-store.service.ts", content: `${head}import { Injectable, signal } from "@angular/core";

export type ToastItem = ${item};
export type ToastInput = Omit<ToastItem, "id">;

// <fgu-toast [toasts]="store.toasts()" (dismissed)="store.dismiss($event)" /> once, near the root; inject(ToastStore).push(...) anywhere.
@Injectable({ providedIn: "root" })
export class ToastStore {
  readonly toasts = signal<ToastItem[]>([]);
  private counter = 0;

  push(toast: ToastInput): string {
    const id = \`toast-\${++this.counter}\`;
    this.toasts.update((all) => [...all, { ...toast, id }]);
    return id;
  }

  dismiss(id: string) {
    this.toasts.update((all) => all.filter((t) => t.id !== id));
  }
}
` };
  }
  return null;
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

