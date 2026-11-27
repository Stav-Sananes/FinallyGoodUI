<script lang="ts">
import { attach } from "./button.behaviour.js";
import "./button.css";

let { variant = "primary", disabled = false, loading = false, type = "button", children, icon, ...rest } = $props();

function behaviour(node: HTMLElement) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<button use:behaviour data-fgu="button" data-part="root" data-variant={variant} disabled={disabled} aria-busy={loading ? "true" : undefined} type={type} {...rest}>
  {#if icon}<span data-part="icon" aria-hidden="true">{@render icon?.()}</span>{/if}
  <span data-part="label">{@render children?.()}</span>
  <span data-part="spinner" aria-hidden="true"></span>
</button>
