<script module>
  let counter = 0;
</script>

<script>
import { attach, selectValue } from "./select.behaviour.js";
import "./select.css";

let { variant = "listbox", options = [], value = $bindable(), label, hideLabel = false, placeholder, name, searchable = false, emptyText = "No matches", invalid = false, disabled = false, ...rest } = $props();
const uid = `fgu-select-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node, initial) {
  const detach = attach(node);
  const sync = (value) => { if (value !== undefined) selectValue(node, value); };
  sync(initial);
  return { update: sync, destroy: detach };
}

// selectchange: keep the bound prop in step.
function listenSelectchange(node) {
  const handle = (event) => {
    value = event.detail;
  };
  node.addEventListener("selectchange", handle);
  return { destroy: () => node.removeEventListener("selectchange", handle) };
}
</script>

<div
  data-fgu="select"
  data-part="root"
  data-variant={variant}
  use:behaviour={value}
  use:listenSelectchange
  {...rest}
>
  <label data-part="label" id={uid + '-label'} for={uid + '-trigger'} data-hidden={hideLabel ? '' : undefined}>{label}</label>
  {#if variant === 'native'}
    <select
      data-part="control"
      id={uid + '-trigger'}
      name={name}
      value={value}
      disabled={disabled}
      aria-invalid={invalid ? "true" : undefined}
    >
      {#each options as o (o.value)}
        <option data-part="option" value={o.value} disabled={o.disabled}>{o.label}</option>
      {/each}
    </select>
  {:else}
    <button
      data-part="trigger"
      type="button"
      id={uid + '-trigger'}
      role="combobox"
      aria-labelledby={uid + '-label ' + uid + '-trigger'}
      aria-haspopup="listbox"
      aria-expanded="false"
      aria-controls={uid + '-list'}
      popovertarget={uid + '-list'}
      disabled={disabled}
      aria-invalid={invalid ? "true" : undefined}
    >
      <span data-part="display" data-placeholder={placeholder}></span>
    </button>
    <div data-part="listbox" id={uid + '-list'} role="listbox" aria-labelledby={uid + '-trigger'} popover>
      {#if searchable}
        <input data-part="search" type="search" aria-label={label} autocomplete="off" />
      {/if}
      {#each options as o (o.value)}
        <div
          data-part="option"
          role="option"
          tabindex="-1"
          data-value={o.value}
          aria-selected={o.value === value ? "true" : "false"}
          aria-disabled={o.disabled ? "true" : undefined}
        >{o.label}</div>
      {/each}
      <div data-part="empty" role="status" hidden>{emptyText}</div>
    </div>
    <input data-part="value" type="hidden" name={name} value={value} />
  {/if}
</div>
