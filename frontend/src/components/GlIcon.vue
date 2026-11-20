<template>
  <span class="gl-icon inline-flex shrink-0 items-center justify-center" :style="{ width: px, height: px }" aria-hidden="true">
    <component :is="icon" v-if="icon" width="100%" height="100%" :stroke-width="stroke" focusable="false" />
  </span>
</template>
<script setup>
// GrowUp (zadání 2027, kolo 2 – V1): kresby jsou Lucide (ISC), rozhraní zůstává: <GlIcon name="…" :size="18" />.
// `name` = původní krátký název (alert, cal, brief…) nebo přímo název Lucide (circle-check, wand-sparkles…), viz glIcons.js.
// Tah 1,8 (v mřížce 24 px), velikosti 18 px v textu a 22 px v lištách.
import { computed } from 'vue'
import { glIconComponent } from './glIcons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 1.8 },
})

const icon = computed(() => {
  const c = glIconComponent(props.name)
  if (!c && import.meta.env.DEV && props.name) console.warn(`[GlIcon] neznámá ikona "${props.name}" – doplň ji do glIcons.js`)
  return c
})
const stroke = computed(() => props.strokeWidth)
const px = computed(() => `${props.size}px`)
</script>
<style>
.gl-icon svg {
  width: 100%;
  height: 100%;
}
</style>
