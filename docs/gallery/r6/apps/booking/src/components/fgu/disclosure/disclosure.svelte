<script module>
  let counter = 0;
</script>

<script>
import { attach } from "./disclosure.behaviour.js";
import "./disclosure.css";

let { variant = "multiple", open = false, disabled = false, children, trigger, ...rest } = $props();
const uid = `fgu-disclosure-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div data-fgu="disclosure" data-part="root" data-variant={variant} use:behaviour {...rest}>
  <div data-part="item">
    <h3 data-part="heading">
      <button
        data-part="trigger"
        type="button"
        id={uid + '-trigger'}
        aria-expanded={open ? "true" : "false"}
        aria-controls={uid + '-panel'}
        disabled={disabled}
      >
        <span>
          {@render trigger?.()}
        </span>
        <span data-part="indicator" aria-hidden="true"></span>
      </button>
    </h3>
    <div data-part="panel" id={uid + '-panel'} role="region" aria-labelledby={uid + '-trigger'}>
      <div data-part="content">
        {@render children?.()}
      </div>
    </div>
  </div>
</div>
