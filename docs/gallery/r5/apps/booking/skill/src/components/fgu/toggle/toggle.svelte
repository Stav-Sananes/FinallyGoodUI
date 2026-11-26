<script lang="ts">
import { attach } from "./toggle.behaviour.js";
import "./toggle.css";

let { variant = "checkbox", checked = false, disabled = false, invalid = false, name, value, children, ...rest } = $props();

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node: HTMLElement) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<label data-fgu="toggle" data-part="root" data-variant={variant} use:behaviour>
  <input
    data-part="control"
    type="checkbox"
    name={name}
    value={value}
    checked={checked}
    disabled={disabled}
    aria-invalid={invalid ? "true" : undefined}
    role={variant === 'switch' ? 'switch' : null}
    {...rest}
  />
  <span data-part="label">
    {@render children?.()}
  </span>
</label>
