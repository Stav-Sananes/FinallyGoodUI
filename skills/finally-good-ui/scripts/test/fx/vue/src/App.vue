<template>
  <div class="box" @click="go">Go</div>
  <img :src="logo" />
  <input class="field" />
</template>

<script setup>
const go = () => {};
</script>

<style scoped>
.box {
  transition: all 800ms ease-in;
  margin: 13px;
}
.box:focus {
  outline: none;
}
.field {
  outline: 0;
}
.field:focus-visible {
  box-shadow: 0 0 0 2px var(--color-text);
}
input {
  font-size: 14px;
}
</style>
