<script module>
  let counter = 0;
</script>

<script>
import { attach, selectTab } from "./tabs.behaviour.js";
import "./tabs.css";

let { tabs = [], label, selected = $bindable(), panel, onselectedchange, ...rest } = $props();
const uid = `fgu-tabs-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node, initial) {
  const detach = attach(node);
  const sync = (value) => { if (value !== undefined) selectTab(node, value); };
  sync(initial);
  return { update: sync, destroy: detach };
}

// tabchange: keep the bound prop in step.
function listenTabchange(node) {
  const handle = (event) => {
    onselectedchange?.(event.detail);
    selected = event.detail;
  };
  node.addEventListener("tabchange", handle);
  return { destroy: () => node.removeEventListener("tabchange", handle) };
}
</script>

<div data-fgu="tabs" data-part="root" use:behaviour={selected} use:listenTabchange {...rest}>
  <div data-part="list" role="tablist" aria-label={label}>
    {#each tabs as tab, i (i)}
      <button
        data-part="tab"
        type="button"
        role="tab"
        id={uid + '-tab-' + i}
        aria-selected={i === (selected ? selected : 0) ? "true" : "false"}
        aria-controls={uid + '-panel-' + i}
        tabindex={i === (selected ? selected : 0) ? 0 : -1}
      >{tab}</button>
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
      hidden={i !== (selected ? selected : 0)}
    >
      {@render panel?.(tab, i)}
    </div>
  {/each}
</div>
