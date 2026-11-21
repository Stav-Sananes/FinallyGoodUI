<script>
import { attach } from "./field.behaviour.js";
import "./field.css";

// One labelled native control. `hint` sits under the label; the error part is filled by the behaviour on blur
// (messages come from the data-msg-* attributes passed through `rest`) or by the parent through `error`.
const uid = $props.id();
let {
  variant = "stacked",
  label,
  hint,
  error = "",
  multiline = false,
  value = $bindable(""),
  type = "text",
  required = false,
  disabled = false,
  ...rest
} = $props();

const described = $derived(hint ? `${uid}-hint ${uid}-error` : `${uid}-error`);

function behaviour(node) {
  const detach = attach(node);
  return { destroy: detach };
}
</script>

<div use:behaviour data-fgu="field" data-part="root" data-variant={variant}>
  <label data-part="label" for={uid}>{label}</label>
  {#if hint}<p data-part="hint" id="{uid}-hint">{hint}</p>{/if}
  {#if multiline}
    <textarea data-part="control" id={uid} aria-describedby={described} aria-required={required ? "true" : undefined} bind:value {required} {disabled} aria-invalid={error ? "true" : undefined} {...rest}></textarea>
  {:else}
    <input data-part="control" id={uid} aria-describedby={described} aria-required={required ? "true" : undefined} {type} bind:value {required} {disabled} aria-invalid={error ? "true" : undefined} {...rest} />
  {/if}
  <p data-part="error" id="{uid}-error" aria-live="polite">{error}</p>
</div>
