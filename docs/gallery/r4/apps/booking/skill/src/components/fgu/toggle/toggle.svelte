<script>
import { attach } from "./toggle.behaviour.js";
import "./toggle.css";

let { variant = "checkbox", checked = $bindable(false), disabled = false, invalid = false, name, value, children, ...rest } = $props();

function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<label use:behaviour data-fgu="toggle" data-part="root" data-variant={variant}>
  <input data-part="control" type="checkbox" role={variant === "switch" ? "switch" : undefined} bind:checked {disabled} {name} {value} aria-invalid={invalid ? "true" : undefined} {...rest} />
  <span data-part="label">{@render children?.()}</span>
</label>
