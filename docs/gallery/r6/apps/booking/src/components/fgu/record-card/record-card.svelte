<script>
import { attach } from "./record-card.behaviour.js";
import "./record-card.css";

let { variant = "default", current = false, lead, children, meta, status, action, ...rest } = $props();

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<article
  data-fgu="record-card"
  data-part="root"
  data-variant={variant}
  aria-current={current ? "true" : undefined}
  use:behaviour
  {...rest}
>
  {#if lead}
    <span data-part="lead">
      {@render lead?.()}
    </span>
  {/if}
  <span data-part="title">
    {@render children?.()}
  </span>
  {#if meta}
    <span data-part="meta">
      {@render meta?.()}
    </span>
  {/if}
  {#if status}
    <span data-part="status">
      {@render status?.()}
    </span>
  {/if}
  {#if action}
    <span data-part="action">
      {@render action?.()}
    </span>
  {/if}
</article>
