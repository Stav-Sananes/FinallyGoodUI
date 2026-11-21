<script>
import { attach } from "./toast.behaviour.js";
import "./toast.css";

// `items`: [{ id, message, variant?, action?, timeout? }] owned by the app. The region is always in the DOM
// so announcements work; the behaviour runs the countdown and fires a cancelable `dismiss`, which removes
// the item from app state instead of the node.
let { items = [], ondismiss, label = "Notifications", ...rest } = $props();

function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div use:behaviour data-fgu="toast" data-part="root" role="status" aria-label={label} {...rest}>
  {#each items as t (t.id)}
    <div
      data-part="toast"
      data-variant={t.variant ?? "status"}
      data-timeout={t.timeout}
      ondismiss={(e) => { e.preventDefault(); ondismiss?.(t.id); }}
    >
      <p data-part="message">{t.message}</p>
      {#if t.action}<button type="button" data-part="action" onclick={t.action.run}>{t.action.label}</button>{/if}
      <button type="button" data-part="dismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  {/each}
</div>
