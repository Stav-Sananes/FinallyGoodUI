<script>
import { attach } from "./tabs.behaviour.js";
import "./tabs.css";

// tabs: [{ id, label, count? }]; `panel` is a snippet called once per tab id. The behaviour owns selection,
// roving focus and the indicator; every panel is rendered and only the selected one is visible.
let { tabs, label, panel, ...rest } = $props();

function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div use:behaviour data-fgu="tabs" data-part="root" {...rest}>
  <div data-part="list" role="tablist" aria-label={label}>
    {#each tabs as t, i (t.id)}
      <button type="button" data-part="tab" role="tab" id={`tab-${t.id}`} aria-selected={i === 0 ? "true" : "false"} aria-controls={`panel-${t.id}`} tabindex={i === 0 ? 0 : -1}>
        {t.label}{#if t.count !== undefined}<span class="count">{t.count}</span>{/if}
      </button>
    {/each}
    <span data-part="indicator" aria-hidden="true"></span>
  </div>
  {#each tabs as t, i (t.id)}
    <div data-part="panel" role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} tabindex="0" hidden={i !== 0}>
      {@render panel(t.id)}
    </div>
  {/each}
</div>
