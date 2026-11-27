<script setup lang="ts">
// The identity motif: a greengrocer's punched hang-tag (notched corner, punch hole, string loop).
withDefaults(defineProps<{ tone?: "paper" | "beet" | "leaf" | "carrot"; swing?: boolean; as?: string }>(), { tone: "paper", swing: false, as: "span" });
</script>

<template>
  <component :is="as" class="tag" :class="{ 'signature-swing': swing }" :data-tone="tone">
    <span class="hole" aria-hidden="true"></span>
    <span class="body"><slot /></span>
  </component>
</template>

<style scoped>
.tag {
  --tag-bg: var(--color-card);
  --tag-fg: var(--color-card-foreground);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding-block: var(--space-1);
  padding-inline: var(--space-2) var(--space-3);
  background: var(--tag-bg);
  color: var(--tag-fg);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  clip-path: polygon(var(--space-2) 0, 100% 0, 100% 100%, var(--space-2) 100%, 0 50%);
  font-weight: 700;
  letter-spacing: var(--tracking-caps, 0.06em);
  text-transform: uppercase;
  font-size: var(--text-xs);
  line-height: 1.2;
  white-space: nowrap;
  transform-origin: 0.6rem 50%;
}
.tag[data-tone="beet"] { --tag-bg: var(--color-primary); --tag-fg: var(--color-primary-foreground); border-color: transparent; }
.tag[data-tone="leaf"] { --tag-bg: var(--color-success); --tag-fg: var(--color-success-foreground); border-color: transparent; }
.tag[data-tone="carrot"] { --tag-bg: var(--color-warning); --tag-fg: var(--color-warning-foreground); border-color: transparent; }
.tag { padding-inline-start: var(--space-6); } /* hole spans space-2..space-4; leaves a space-2 gap before the label */
.hole {
  position: absolute;
  inset-inline-start: var(--space-2);
  inset-block-start: 50%;
  inline-size: var(--space-2);
  block-size: var(--space-2);
  margin-block-start: calc(var(--space-1) * -1);
  border-radius: var(--radius-full);
  background: var(--color-background);
  box-shadow: inset 0 0 0 var(--border-width-hairline) var(--color-border);
}
.tag.signature-swing { animation: tag-swing var(--duration-hero) var(--ease-enter-emphasized) 1; }
@keyframes tag-swing {
  0% { transform: rotate(-14deg); }
  40% { transform: rotate(7deg); }
  70% { transform: rotate(-3deg); }
  100% { transform: rotate(0); }
}
@media (prefers-reduced-motion: reduce) { .tag.signature-swing { animation: none; } }
</style>
