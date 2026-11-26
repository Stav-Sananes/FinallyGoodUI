<script lang="ts">
import { attach } from "./button.behaviour.js";
import "./button.css";

let { variant = "primary", disabled = false, loading = false, type = "button", children, icon, ...rest } = $props();

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node: HTMLElement) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<button
  data-fgu="button"
  data-part="root"
  type={type}
  data-variant={variant}
  disabled={disabled}
  aria-busy={loading ? "true" : undefined}
  use:behaviour
  {...rest}
>
  <span data-part="spinner" aria-hidden="true"></span>
  {#if icon}
    <span data-part="icon" aria-hidden="true">
      {@render icon?.()}
    </span>
  {/if}
  <span data-part="label">
    {@render children?.()}
  </span>
</button>
