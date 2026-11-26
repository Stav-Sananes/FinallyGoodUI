<script module lang="ts">
  let counter = 0;
</script>

<script lang="ts">
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";
import "./dialog.css";

let { variant = "modal", open = false, title, description, children, actions, ...rest } = $props();
const uid = `fgu-dialog-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node: HTMLElement, isOpen: boolean) {
  const detach = attach(node);
  const sync = (open: boolean) => (open ? openDialog(node) : closeDialog(node));
  sync(isOpen);
  return { update: sync, destroy: detach };
}
</script>

<dialog
  data-fgu="dialog"
  data-part="root"
  data-variant={variant}
  aria-labelledby={uid + '-title'}
  use:behaviour={open}
  {...rest}
>
  <h2 data-part="title" id={uid + '-title'}>
    {@render title?.()}
  </h2>
  {#if description}
    <p data-part="description">
      {@render description?.()}
    </p>
  {/if}
  <button data-part="close" type="button" aria-label="Close">
    &times;
  </button>
  {@render children?.()}
  {#if actions}
    <div data-part="actions">
      {@render actions?.()}
    </div>
  {/if}
</dialog>
