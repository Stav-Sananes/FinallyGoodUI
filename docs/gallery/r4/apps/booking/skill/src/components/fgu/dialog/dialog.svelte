<script>
import { attach } from "./dialog.behaviour.js";
import "./dialog.css";

// A native <dialog>. Open it with showModal() through `el`, or with a [data-dialog-open="<id>"] trigger
// when the app attaches the dialog behaviour above it (see App.svelte).
let { variant = "modal", id, title, description, el = $bindable(null), children, actions, onclose, ...rest } = $props();

function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<dialog use:behaviour bind:this={el} {id} data-fgu="dialog" aria-labelledby="{id}-title" aria-describedby={description ? `${id}-desc` : undefined} data-part="root" data-variant={variant} {onclose} {...rest}>
  <h2 data-part="title" id="{id}-title">{title}</h2>
  {#if description}<p data-part="description" id="{id}-desc">{description}</p>{/if}
  {#if variant !== "confirm"}<button type="button" data-part="close" aria-label="Close">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>{/if}
  {@render children?.()}
  <div data-part="actions">{@render actions?.()}</div>
</dialog>
