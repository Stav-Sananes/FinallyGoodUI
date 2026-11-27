<script module>
  let counter = 0;
</script>

<script>
import { attach, openDialog, closeDialog } from "./dialog.behaviour.js";
import "./dialog.css";

let { variant = "modal", open = $bindable(false), initialFocus, nativeValidation = false, title, description, children, actions, ...rest } = $props();
const uid = `fgu-dialog-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node, initial) {
  const detach = attach(node);
  const sync = (open) => { if (open) openDialog(node); else closeDialog(node); };
  sync(initial);
  return { update: sync, destroy: detach };
}

// close: keep the bound prop in step.
function listenClose(node) {
  const handle = () => {
    open = false;
  };
  node.addEventListener("close", handle);
  return { destroy: () => node.removeEventListener("close", handle) };
}
</script>

<dialog
  data-fgu="dialog"
  data-part="root"
  data-variant={variant}
  aria-labelledby={uid + '-title'}
  data-initial-focus={initialFocus}
  use:behaviour={open}
  use:listenClose
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
  <button data-part="close" type="button" aria-label="Close">&times;</button>
  <form data-part="form" method="dialog" novalidate={!nativeValidation}>
    {@render children?.()}
    {#if actions}
      <div data-part="actions">
        {@render actions?.()}
      </div>
    {/if}
  </form>
</dialog>
