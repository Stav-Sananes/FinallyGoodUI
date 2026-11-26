<script lang="ts">
import { attach } from "./toast.behaviour.js";
import "./toast.css";

let { toasts = [], label = "Notifications", children, ondismiss, ...rest } = $props();

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node: HTMLElement) {
  const detach = attach(node);
  return { destroy: detach };
}

// A leaving toast fires a cancelable `dismiss`; keep the node and hand the id to the parent, which owns the list.
function dismissListener(node: HTMLElement) {
  const handle = (event: Event) => {
    event.preventDefault();
    ondismiss?.((event.target as HTMLElement).dataset.id ?? "");
  };
  node.addEventListener("dismiss", handle);
  return { destroy: () => node.removeEventListener("dismiss", handle) };
}
</script>

<div
  data-fgu="toast"
  data-part="root"
  role="status"
  aria-label={label}
  use:behaviour
  use:dismissListener
  {...rest}
>
  {#each toasts as t (t.id)}
    <div
      data-part="toast"
      data-variant={t.variant ? t.variant : 'status'}
      data-id={t.id}
      data-timeout={t.timeout}
    >
      <p data-part="message">
        {t.message}
      </p>
      {#if t.action}
        <button data-part="action" type="button" onclick={() => t.onAction && t.onAction(t)}>
          {t.action}
        </button>
      {/if}
      <button data-part="dismiss" type="button" aria-label="Dismiss">
        &times;
      </button>
    </div>
  {/each}
  {@render children?.()}
</div>
