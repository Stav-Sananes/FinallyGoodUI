<script module lang="ts">
  let counter = 0;
</script>

<script lang="ts">
import { attach } from "./tabs.behaviour.js";
import "./tabs.css";

let { tabs = [], label, panel, ...rest } = $props();
const uid = `fgu-tabs-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node: HTMLElement) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div data-fgu="tabs" data-part="root" use:behaviour {...rest}>
  <div data-part="list" role="tablist" aria-label={label}>
    {#each tabs as tab, i (i)}
      <button
        data-part="tab"
        type="button"
        role="tab"
        id={uid + '-tab-' + i}
        aria-selected={i === 0 ? "true" : "false"}
        aria-controls={uid + '-panel-' + i}
        tabindex={i === 0 ? 0 : -1}
      >
        {tab}
      </button>
    {/each}
    <span data-part="indicator" aria-hidden="true"></span>
  </div>
  {#each tabs as tab, i (i)}
    <div
      data-part="panel"
      id={uid + '-panel-' + i}
      role="tabpanel"
      aria-labelledby={uid + '-tab-' + i}
      tabindex="0"
      hidden={i !== 0}
    >
      {@render panel?.(tab, i)}
    </div>
  {/each}
</div>
