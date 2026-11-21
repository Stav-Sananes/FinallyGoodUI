// Scaffold planner: turns a component spec, the project's stack profile and style profile into the
// files to write. Pure over its inputs: it reads the reference component and checks which targets
// exist, but never writes. Behaviour is never written per framework: it is either the project's own
// primitive (source "primitives:<name>") or the one shared reference script (source "shared").
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { UsageError } from "./cli.mjs";
import { profileCss } from "./style-profile.mjs";
import { exists, readJson, isDir } from "./fs.mjs";
import { rolePartOf } from "./component-spec.mjs";

export const COMPONENTS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components");
const NATIVE = new Set(["expo", "react-native", "flutter", "swiftui", "compose"]);
const FAMILY = { react: "react", next: "react", vue: "vue", nuxt: "vue", svelte: "svelte", sveltekit: "svelte", angular: "angular" };

// Primitive wiring per framework family. `imp(deps)` returns the import line for a package the project
// really has, or null (then the component falls back to shared). `poly` primitives wrap any tag; the
// others are button-only. A pair with no entry (or null) falls back to shared.
const from = (deps, table) => { const hit = table.find(([d]) => d in deps); return hit ? hit[1] : null; };
const PRIMITIVES = {
  radix: { react: { poly: true, imp: (d) => from(d, [["@radix-ui/react-primitive", 'import { Primitive } from "@radix-ui/react-primitive";'], ["radix-ui", 'import { Primitive } from "radix-ui";']]), open: (t) => `<Primitive.${t}`, close: (t) => `</Primitive.${t}>` } },
  ark: { react: { poly: true, imp: (d) => from(d, [["@ark-ui/react", 'import { ark } from "@ark-ui/react/factory";']]), open: (t) => `<ark.${t}`, close: (t) => `</ark.${t}>` } },
  "base-ui": { react: { imp: (d) => from(d, [["@base-ui/react", 'import { Button } from "@base-ui/react/button";'], ["@base-ui-components/react", 'import { Button } from "@base-ui-components/react/button";']]), open: () => "<Button", close: () => "</Button>" } },
  "react-aria": { react: { imp: (d) => from(d, [["react-aria-components", 'import { Button } from "react-aria-components";']]), open: () => "<Button", close: () => "</Button>" } },
  kobalte: { react: null },
  headlessui: { react: { imp: (d) => from(d, [["@headlessui/react", 'import { Button } from "@headlessui/react";']]), open: () => "<Button", close: () => "</Button>" } },
  reka: { vue: { poly: true, imp: (d) => from(d, [["reka-ui", 'import { Primitive } from "reka-ui";'], ["radix-vue", 'import { Primitive } from "radix-vue";']]), open: (t) => `<Primitive as="${t}"`, close: () => "</Primitive>" } },
  bits: { svelte: { imp: (d) => from(d, [["bits-ui", 'import { Button } from "bits-ui";']]), open: () => "<Button.Root", close: () => "</Button.Root>" } },
  "angular-cdk": { angular: null }, // the CDK has no button primitive
};

const pascal = (s) => s.split(/[-_]/).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const tagFor = (spec) => spec.tags?.root ?? ({ button: "button", link: "a" })[spec.a11y.role] ?? "div";

/** The spec as the pieces templates need: attributes, props and the markup of its parts. */
function viewModel(spec) {
  const stateProps = new Map(spec.states.filter((s) => spec.props.some((p) => p.name === s.name)).map((s) => [s.name, s]));
  const attrs = [];
  for (const p of spec.props) {
    const st = stateProps.get(p.name);
    if (st) attrs.push({ name: st.attribute, prop: p.name, kind: st.attribute.startsWith("aria-") ? "aria" : "bool" });
    else attrs.push({ name: p.name === "variant" ? "data-variant" : p.name, prop: p.name, kind: "value" });
  }
  const parts = spec.parts.filter((p) => p !== "root").map((part) => {
    const slot = spec.slots.find((s) => s === part || (part === "label" && s === "default"));
    return slot ? { part, slot, optional: slot !== "default" } : { part };
  });
  if (!spec.parts.includes("label") && spec.slots.includes("default")) parts.push({ slot: "default", bare: true });
  return { name: spec.name, Name: pascal(spec.name), tag: tagFor(spec), props: spec.props, slots: spec.slots, attrs, parts };
}

const lit = (p) => (p.default === undefined ? "undefined" : p.type === "boolean" ? String(p.default === "true" || p.default === true) : JSON.stringify(String(p.default)));
const ts = (p) => (p.type === "boolean" ? "boolean" : p.type === "string" ? "string" : "unknown");
const slotName = (s) => (s === "default" ? "children" : camel(s));
const busyProp = (v) => v.attrs.find((a) => a.name === "aria-busy")?.prop ?? null;
const SPAN = (part, inner = "") => `<span data-part="${part}" aria-hidden="true">${inner}</span>`;

// Inline busy guard for primitive sources (no behaviour script): a busy control stays focusable but swallows clicks.
const react_guard = (v, c) => (c.prim && busyProp(v) ? `onClickCapture={(e) => { if (${camel(busyProp(v))}) { e.preventDefault(); e.stopPropagation(); } }} ` : "");
const vue_guard = (v, c) => (c.prim && busyProp(v) ? ` @click.capture="(e: Event) => { if (${busyProp(v)}) { e.preventDefault(); e.stopImmediatePropagation(); } }"` : "");
const svelte_guard = (v, c) => (c.prim && busyProp(v) ? `onclickcapture={(e) => { if (${camel(busyProp(v))}) { e.preventDefault(); e.stopImmediatePropagation(); } }} ` : "");

// ---- templates: (view, ctx) -> [{ ext, content }]. ctx: { shared, prim, typescript, base, framework }
function react(v, c) {
  const open = c.prim ? c.prim.open(v.tag) : `<${v.tag}`, close = c.prim ? c.prim.close(v.tag) : `</${v.tag}>`;
  const props = v.props.map((p) => `${camel(p.name)}${p.default === undefined ? "" : ` = ${lit(p)}`}`);
  const slots = v.slots.map(slotName);
  const attrs = v.attrs.map((a) => {
    const val = camel(a.prop);
    return a.kind === "aria" ? `${a.name}={${val} ? "true" : undefined}` : `${a.name}={${val}}`;
  });
  const kids = v.parts.map((p) => {
    if (p.bare) return `{${slotName(p.slot)}}`;
    if (p.slot) {
      const inner = `<span data-part="${p.part}">{${slotName(p.slot)}}</span>`;
      return p.optional ? `{${slotName(p.slot)} ? ${SPAN(p.part, `{${slotName(p.slot)}}`)} : null}` : inner;
    }
    return SPAN(p.part);
  });
  const types = c.typescript
    ? `\nexport type ${v.Name}Props = {\n${[...v.props.map((p) => `  ${camel(p.name)}?: ${ts(p)};`), ...v.slots.map((s) => `  ${slotName(s)}?: ReactNode;`)].join("\n")}\n} & Omit<ComponentPropsWithoutRef<"${v.tag}">, ${[...v.props.map((p) => p.name), "children"].map((n) => `"${n}"`).join(" | ")}>;\n`
    : "";
  const imports = [
    ...(c.typescript ? ['import type { ComponentPropsWithoutRef, ReactNode } from "react";'] : []),
    ...(c.shared ? ['import { useEffect, useRef } from "react";'] : []),
    ...(c.prim ? [c.prim.imp] : []),
    `import "./${v.name}.css";`,
    ...(c.shared ? [`import { attach } from "./${v.name}.behaviour.js";`] : []),
  ];
  const sig = c.typescript ? `}: ${v.Name}Props` : "}";
  const body = c.shared
    ? `  const ref = useRef${c.typescript ? `<HTMLElement>` : ""}(null);\n  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);\n`
    : "";
  const content = `${imports.join("\n")}\n${types}\nexport function ${v.Name}({ ${[...props, ...slots, "...rest"].join(", ")} ${sig}) {\n${body}  return (\n    ${open}${c.shared ? " ref={ref}" : ""} data-part="root" ${attrs.join(" ")} ${react_guard(v, c)}{...rest}>\n${kids.map((k) => `      ${k}`).join("\n")}\n    ${close}\n  );\n}\n`;
  return [{ ext: c.typescript ? ".tsx" : ".jsx", content }];
}

function vue(v, c) {
  const open = c.prim ? c.prim.open(v.tag) : `<${v.tag}`, close = c.prim ? c.prim.close(v.tag) : `</${v.tag}>`;
  const attrs = v.attrs.map((a) => (a.kind === "aria" ? `:${a.name}="${a.prop} ? 'true' : undefined"` : `:${a.name}="${a.prop}"`));
  const kids = v.parts.map((p) => {
    if (p.bare) return "<slot />";
    const slot = p.slot === "default" ? "<slot />" : `<slot name="${p.slot}" />`;
    if (p.slot) return p.optional ? `<span v-if="$slots.${p.slot}" data-part="${p.part}" aria-hidden="true">${slot}</span>` : `<span data-part="${p.part}">${slot}</span>`;
    return SPAN(p.part);
  });
  const defaults = v.props.filter((p) => p.default !== undefined).map((p) => `${camel(p.name)}: ${lit(p)}`);
  const script = [
    ...(c.shared ? ['import { onBeforeUnmount, onMounted, ref } from "vue";'] : []),
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { attach } from "./${v.name}.behaviour.js";`] : []),
    "",
    `const props = withDefaults(defineProps<{ ${v.props.map((p) => `${camel(p.name)}?: ${ts(p)}`).join("; ")} }>(), { ${defaults.join(", ")} });`,
    ...(c.shared ? ["const el = ref<HTMLElement | null>(null);", "let detach: (() => void) | undefined;", "onMounted(() => { if (el.value) detach = attach(el.value); });", "onBeforeUnmount(() => detach?.());"] : []),
  ];
  const content = `<script setup lang="ts">\n${script.join("\n")}\n</script>\n\n<template>\n  ${open}${c.shared ? ' ref="el"' : ""} data-part="root" ${attrs.join(" ")}${vue_guard(v, c)}>\n${kids.map((k) => `    ${k}`).join("\n")}\n  ${close}\n</template>\n\n<style src="./${v.name}.css"></style>\n`;
  return [{ ext: ".vue", content }];
}

function svelte(v, c) {
  const open = c.prim ? c.prim.open(v.tag) : `<${v.tag}`, close = c.prim ? c.prim.close(v.tag) : `</${v.tag}>`;
  const attrs = v.attrs.map((a) => (a.kind === "aria" ? `${a.name}={${camel(a.prop)} ? "true" : undefined}` : `${a.name}={${camel(a.prop)}}`));
  const kids = v.parts.map((p) => {
    if (p.bare) return `{@render ${slotName(p.slot)}?.()}`;
    if (p.slot) {
      const inner = `{@render ${slotName(p.slot)}?.()}`;
      return p.optional ? `{#if ${slotName(p.slot)}}${SPAN(p.part, inner)}{/if}` : `<span data-part="${p.part}">${inner}</span>`;
    }
    return SPAN(p.part);
  });
  const props = [...v.props.map((p) => `${camel(p.name)}${p.default === undefined ? "" : ` = ${lit(p)}`}`), ...v.slots.map(slotName), "...rest"];
  const script = [
    ...(c.prim ? [c.prim.imp] : []),
    ...(c.shared ? [`import { attach } from "./${v.name}.behaviour.js";`] : []),
    `import "./${v.name}.css";`,
    "",
    `let { ${props.join(", ")} } = $props();`,
    ...(c.shared ? ["", "function behaviour(node: HTMLElement) {", "  const detach = attach(node);", "  return { destroy: detach };", "}"] : []),
  ];
  const content = `<script lang="ts">\n${script.join("\n")}\n</script>\n\n${open}${c.shared ? " use:behaviour" : ""} data-part="root" ${attrs.join(" ")} ${svelte_guard(v, c)}{...rest}>\n${kids.map((k) => `  ${k}`).join("\n")}\n${close}\n`;
  return [{ ext: ".svelte", content }];
}

function angular(v, c) {
  const attrs = v.attrs.map((a) => (a.kind === "value" ? `[attr.${a.name}]="${camel(a.prop)}"` : a.kind === "aria" ? `[attr.${a.name}]="${camel(a.prop)} ? 'true' : null"` : `[attr.${a.name}]="${camel(a.prop)} ? '' : null"`));
  const kids = v.parts.map((p) => {
    if (p.bare) return "<ng-content />";
    if (p.slot) {
      const slot = p.slot === "default" ? "<ng-content />" : `<ng-content select="[${p.slot}]" />`;
      return p.optional ? SPAN(p.part, slot) : `<span data-part="${p.part}">${slot}</span>`;
    }
    return SPAN(p.part);
  });
  const inputs = v.props.map((p) => `  @Input() ${camel(p.name)}: ${ts(p)}${p.default === undefined ? " | undefined" : ""}${p.default === undefined ? "" : ` = ${lit(p)}`};`);
  const core = ["Component", "Input", ...(c.shared ? ["ElementRef", "AfterViewInit", "OnDestroy", "inject"] : [])];
  const cls = c.shared
    ? `export class ${v.Name}Component implements AfterViewInit, OnDestroy {\n${inputs.join("\n")}\n  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);\n  private detach?: () => void;\n\n  ngAfterViewInit() { this.detach = attach(this.host.nativeElement); }\n  ngOnDestroy() { this.detach?.(); }\n}`
    : `export class ${v.Name}Component {\n${inputs.join("\n")}\n}`;
  const ts_ = `import { ${core.join(", ")} } from "@angular/core";\n${c.shared ? `import { attach } from "./${v.name}.behaviour.js";\n` : ""}\n@Component({\n  selector: "fgu-${v.name}",\n  standalone: true,\n  templateUrl: "./${v.name}.component.html",\n  styleUrl: "./${v.name}.css",\n})\n${cls}\n`;
  const html = `<${v.tag} data-part="root" ${attrs.join(" ")}>\n  ${kids.join("\n  ")}\n</${v.tag}>\n`;
  return [{ ext: ".component.ts", content: ts_ }, { ext: ".component.html", content: html }];
}

// Plain demo: the first shape with every part (the always-rendered ones such as the spinner and icon
// included), plus one element per state a control root can show on its own (busy, disabled).
const DEMO_STATES = [["aria-busy", 'aria-busy="true"'], ["disabled", "disabled"]];
function plain(v, spec) {
  const kids = v.parts.map((p) => (p.bare ? "Label" : p.slot === "default" ? `<span data-part="${p.part}">${spec.name}</span>` : SPAN(p.part))).join("");
  const element = (extra = "") => `<${v.tag} data-part="root" data-variant="${spec.shapes[0]}"${v.tag === "button" ? ' type="button"' : ""}${extra}>${kids}</${v.tag}>`;
  const states = rolePartOf(spec) === "root" ? DEMO_STATES.filter(([attr]) => spec.states.some((s) => s.attribute === attr)) : [];
  const demo = [element(), ...states.map(([, attr]) => element(` ${attr}`))].map((e) => `  ${e}`).join("\n");
  const content = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<link rel="stylesheet" href="./${v.name}.css">\n</head>\n<body>\n<div id="demo">\n${demo}\n</div>\n<script type="module">\n  import { attach } from "./${v.name}.behaviour.js";\n  attach(document.getElementById("demo"));\n</script>\n</body>\n</html>\n`;
  return [{ ext: ".html", content }];
}

// Roles an element has natively: emitted as the native tag, never as a redundant role attribute.
const NATIVE_ROOT_ROLE = { button: "button", a: "link", dialog: "dialog" };
const NATIVE_INPUT = { textbox: 'type="text"', checkbox: 'type="checkbox"' };

/** Replaces `pattern` in the generated files, or throws: a silent no-op would ship markup without the role or tag. */
function rewrite(files, pattern, replacement, what) {
  let hit = false;
  const out = files.map((f) => {
    const content = f.content.replace(pattern, (...m) => { hit = true; return typeof replacement === "function" ? replacement(...m) : replacement; });
    return { ...f, content };
  });
  if (!hit) throw new Error(`scaffold: could not ${what}: no matching element in the generated markup`);
  return out;
}

/** Puts the spec's role on the element of a.rolePart: the native tag where one exists, else role="<role>". */
function applyRole(files, spec) {
  const role = spec.a11y.role, part = rolePartOf(spec);
  if (part === "root") {
    if (role in { button: 1, link: 1 } || NATIVE_ROOT_ROLE[tagFor(spec)] === role) return files;
    return rewrite(files, / data-part="root"/g, ` data-part="root" role="${role}"`, `put role "${role}" on the root`);
  }
  const span = new RegExp(`<span data-part="${part}"(?: aria-hidden="true")?>[\\s\\S]*?</span>`);
  const el = role in NATIVE_INPUT ? `<input data-part="${part}" ${NATIVE_INPUT[role]} />` : `<span data-part="${part}" role="${role}"></span>`;
  return rewrite(files, span, el, `put role "${role}" on part "${part}"`);
}

/** spec.tags: part -> element. The root is handled by tagFor; other parts are rewritten from their default span.
 *  A tagged part is content, not decoration, so it loses the default aria-hidden. */
function applyTags(files, spec) {
  let out = files;
  for (const [part, tag] of Object.entries(spec.tags ?? {})) {
    if (part === "root" || part === rolePartOf(spec)) continue;
    const el = new RegExp(`<span data-part="${part}"(?: aria-hidden="true")?([^>]*)>([\\s\\S]*?)</span>`);
    out = rewrite(out, el, (_, attrs, inner) => `<${tag} data-part="${part}"${attrs}>${inner}</${tag}>`, `render part "${part}" as <${tag}>`);
  }
  return out;
}

const TEMPLATES = { react, vue, svelte, angular };

/** Where the components go: src/components/fgu, or fgu under the shadcn components alias. */
function componentsDir(root, stack) {
  if (!stack.shadcn) return "src/components/fgu";
  const alias = readJson(join(root, "components.json"))?.aliases?.components;
  if (typeof alias !== "string") return "src/components/fgu";
  const rest = alias.replace(/^(@|~)\//, "").replace(/^\.?\//, "");
  const base = /^(@|~)\//.test(alias) && isDir(join(root, "src")) ? `src/${rest}` : rest;
  return `${base}/fgu`;
}

const projectDeps = (root) => { const p = readJson(join(root, "package.json")); return { ...p?.peerDependencies, ...p?.devDependencies, ...p?.dependencies }; };

/** The primitive the project already has: its own, else the kit's base. Null when none can be wired. */
function chooseSource(stack, family, tag, deps) {
  const name = stack.primitives?.[0] ?? stack.shadcn?.base ?? null;
  if (!name) return { source: "shared", prim: null, note: null };
  const entry = PRIMITIVES[name]?.[family];
  if (!entry || (!entry.poly && tag !== "button")) {
    return { source: "shared", prim: null, note: `primitive "${name}" has no wiring for ${family ?? "this framework"}: using the shared behaviour script` };
  }
  const imp = entry.imp(deps);
  if (!imp) return { source: "shared", prim: null, note: `primitive "${name}": no package to import it from in package.json: using the shared behaviour script` };
  return { source: `primitives:${name}`, prim: { ...entry, imp }, note: null };
}

export function planScaffold({ spec, stack, profile, root, force = false }) {
  const framework = stack.framework;
  if (NATIVE.has(framework)) throw new UsageError(`${framework} is a native stack: component scaffolds are web only (no DOM, no CSS)`);
  const family = FAMILY[framework] ?? null;
  const notes = [];
  if (!family) notes.push(`no ${framework === "unknown" ? "framework" : framework} template: emitted plain HTML, CSS and the shared behaviour script`);

  const v = viewModel(spec);
  const { source, prim, note } = family ? chooseSource(stack, family, v.tag, projectDeps(root)) : { source: "shared", prim: null, note: null };
  if (note) notes.push(note);
  const shared = source === "shared";
  const dir = `${componentsDir(root, stack)}/${spec.name}`;
  const typescript = Boolean(stack.typescript);

  const refDir = join(COMPONENTS_ROOT, spec.name);
  const css = `${readFileSync(join(refDir, `${spec.name}.css`), "utf8").trimEnd()}\n\n${profileCss(profile, spec).trimEnd()}\n`;
  const rendered = applyTags(applyRole(family ? TEMPLATES[family](v, { shared, prim, typescript }) : plain(v, spec), spec), spec);

  const out = [
    { path: `${dir}/${spec.name}.css`, content: css },
    ...rendered.map((r) => ({ path: `${dir}/${spec.name}${r.ext}`, content: r.content })),
    ...(shared ? [{ path: `${dir}/${spec.name}.behaviour.js`, content: readFileSync(join(refDir, `${spec.name}.js`), "utf8") }] : []),
    { path: `${dir}/.fgu-component.json`, content: `${JSON.stringify({ name: spec.name, source, framework }, null, 2)}\n` },
  ];
  const files = out.map((f) => (!force && exists(join(root, f.path)) ? { ...f, skipped: "exists" } : f));
  return { files, source, notes };
}
