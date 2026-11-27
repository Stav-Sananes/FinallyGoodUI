<script module>
  let counter = 0;
</script>

<script>
import { attach } from "./field.behaviour.js";
import "./field.css";

let { variant = "stacked", label, hint, error, invalid = false, disabled = false, required = false, type = "text", name, id, placeholder, autocomplete, rows, multiline = false, value = $bindable(), ...rest } = $props();
const uid = `fgu-field-${++counter}`;

// attach wires the keyboard, focus and ARIA that the markup leaves to the shared behaviour; it returns the cleanup.
function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div data-fgu="field" data-part="root" data-variant={variant} use:behaviour>
  <label data-part="label" for={(id ? id : uid + '-control')}>{label}</label>
  {#if hint}
    <p data-part="hint" id={uid + '-hint'}>{hint}</p>
  {/if}
  {#if multiline}
    <textarea
      data-part="control"
      id={(id ? id : uid + '-control')}
      name={name}
      placeholder={placeholder}
      autocomplete={autocomplete}
      required={required}
      disabled={disabled}
      aria-invalid={invalid ? "true" : undefined}
      aria-describedby={(hint ? uid + '-hint ' : '') + uid + '-error'}
      rows={rows}
      value={value}
      oninput={(e) => (value = e.currentTarget.value)}
      {...rest}
    ></textarea>
  {:else}
    <input
      data-part="control"
      id={(id ? id : uid + '-control')}
      name={name}
      placeholder={placeholder}
      autocomplete={autocomplete}
      required={required}
      disabled={disabled}
      aria-invalid={invalid ? "true" : undefined}
      aria-describedby={(hint ? uid + '-hint ' : '') + uid + '-error'}
      type={type}
      value={value}
      oninput={(e) => (value = e.currentTarget.value)}
      {...rest}
    />
  {/if}
  <p data-part="error" id={uid + '-error'} aria-live="polite" data-controlled={error ? '' : undefined}>{error}</p>
</div>
