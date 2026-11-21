# Adapter: Vue (also Nuxt)

The scaffold writes `<Name>.vue`: `<script setup lang="ts">`, the template, and `<style src="./<name>.css">`.

## Props and events
- Props: `withDefaults(defineProps<{ variant?: string; busy?: boolean }>(), { variant: "primary" })`, camelCase names, spec defaults.
- Events stay native. Fallthrough attrs and listeners land on the root element, so `@click` from the parent needs no `emit`. Add `defineEmits` only for a spec'd custom event.

## State attributes
- Bind the attribute from the spec: `:aria-busy="busy ? 'true' : undefined"`; booleans bind directly. Value props go to `:data-variant="variant"`.
- With a primitive wired, the scaffold adds `@click.capture` that stops the click while busy.

## Slots and children
- Default slot is `<slot />`; named slots are `<slot name="icon" />`. Optional parts: `<span v-if="$slots.icon" data-part="icon" aria-hidden="true"><slot name="icon" /></span>`. Keep each `data-part`.

## Behaviour source
1. Project has a primitive library: wire the parts, states and tokens onto it. The scaffold knows Reka (`Primitive` from `reka-ui`, or `radix-vue`), used as `<Primitive as="button">`. Ark and Headless UI have Vue builds: wire them by hand the same way when installed.
2. Nothing installed: import `attach` from `./<name>.behaviour.js` and call it once mounted, on a template ref:
   `onMounted(() => { if (el.value) detach = attach(el.value); }); onBeforeUnmount(() => detach?.());`
3. Never write a composable that re-implements the keyboard or focus model.

Checker: no `@keydown`, `@keyup` or `@keypress` (with or without modifiers such as `.enter`, `.space`) for a spec'd key; the primitive or `attach` owns them.

## Motion
Rules: `recipes/INDEX.md`; Reka state hooks (`data-state`) in `recipes/motion/headless-primitive-motion.md`. Start from the CSS baseline (transform/opacity, tokens, reduced-motion). For elements that mount and unmount use the built-in `<Transition>` or `<TransitionGroup>` with CSS classes; pass durations from the generated motion-tokens, never literals. Add a library only at the recipe's upgrade trigger, after asking.
