<script>
// A native radio dressed as a card, chip or day: the browser supplies arrow keys, one tab stop and the
// checked state. The input covers the label so the whole card is the tap target.
let { name, checked = false, onpick, label, class: cls = "", children, ...rest } = $props();
</script>

<label class="choice {cls}" {...rest}>
  <input type="radio" {name} {checked} aria-label={label} onchange={onpick} />
  {@render children()}
</label>
