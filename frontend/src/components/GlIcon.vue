<template>
  <span class="gl-icon inline-flex shrink-0 items-center justify-center" :style="{ width: px, height: px }" v-html="svg" aria-hidden="true" />
</template>
<script setup>
// GrowUp: ikony z designového balíčku (24 px, tah 1,75, currentColor). Název = soubor v assets/gl-icons.
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
})

const icons = import.meta.glob('@/assets/gl-icons/*.svg', { query: '?raw', import: 'default', eager: true })
const svg = computed(() => {
  const key = Object.keys(icons).find((k) => k.endsWith(`/${props.name}.svg`))
  return key ? icons[key] : ''
})
const px = computed(() => `${props.size}px`)
</script>
<style>
.gl-icon svg {
  width: 100%;
  height: 100%;
}
</style>
