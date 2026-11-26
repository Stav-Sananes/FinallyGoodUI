<script>
let { dog, size = "md" } = $props();
</script>

<span class="monogram monogram-{size}" data-tone={dog.tone} aria-hidden="true">{dog.name[0]}</span>
