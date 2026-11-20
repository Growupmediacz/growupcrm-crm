<template>
  <NumberFlow
    v-if="isNum"
    class="gl-num"
    :value="num"
    :format="format"
    locales="cs-CZ"
    :prefix="prefix"
    :suffix="suffix"
    :transform-timing="timing"
    :spin-timing="timing"
    :opacity-timing="fade"
  />
  <span v-else class="gl-num">{{ fallback }}</span>
</template>
<script setup>
// GrowUp (zadání 2027 kolo 2 V1): plynulá čísla (KPI, počítadla) přes @number-flow/vue (MIT).
// Číslice se při změně otočí (700 ms, --ease-out); s prefers-reduced-motion se jen přepnou (NumberFlow to hlídá sám).
// Formát jako Intl.NumberFormat v češtině: :format="{ style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }".
import NumberFlow from '@number-flow/vue'
import { computed } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: null },
  format: { type: Object, default: () => ({ maximumFractionDigits: 0 }) },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  fallback: { type: String, default: '—' },
})
const num = computed(() => Number(props.value))
const isNum = computed(() => props.value !== null && props.value !== '' && Number.isFinite(num.value))
const timing = { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
const fade = { duration: 350, easing: 'ease-out' }
</script>
<style>
.gl-num {
  font-variant-numeric: tabular-nums;
  /* NumberFlow přidává nad a pod číslice prostor pro prolnutí (0,25 em); bez něj má číslo stejnou výšku řádku jako text dřív */
  --number-flow-mask-height: 0px;
}
</style>
