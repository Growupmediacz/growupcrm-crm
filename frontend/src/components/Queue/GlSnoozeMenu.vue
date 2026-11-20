<template>
  <!-- GrowUp (zadání 2027 E3): odložení položky fronty s vypočtenými časy (vzor Linear Inbox, jen chování). -->
  <div class="relative inline-flex">
    <button type="button" class="gl-q-btn" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
      <GlIcon name="clock" :size="16" />{{ __('Odložit') }}<kbd v-if="kbd" class="gl-q-kbd">H</kbd>
    </button>
    <div v-if="open" class="gl-snz" role="menu" @keydown.esc.stop="open = false">
      <button v-for="o in options" :key="o.label" type="button" role="menuitem" class="gl-snz-item" @click="pick(o)">
        <span>{{ o.label }}</span><span class="text-[13px] text-[color:var(--text-2)]">{{ o.hint }}</span>
      </button>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { computed, ref } from 'vue'

defineProps({ kbd: { type: Boolean, default: false } })
const emit = defineEmits(['snooze'])
const open = ref(false)

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
const time = (d) => `${d.getHours()}:${pad(d.getMinutes())}`
const DAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']

const options = computed(() => {
  const now = new Date()
  const later = new Date(now.getTime() + 3 * 3600 * 1000)
  later.setMinutes(Math.ceil(later.getMinutes() / 15) * 15, 0, 0)
  // další pracovní den 9:00 (v pátek a o víkendu pondělí)
  const next = new Date(now)
  do next.setDate(next.getDate() + 1)
  while (next.getDay() === 0 || next.getDay() === 6)
  next.setHours(9, 0, 0, 0)
  const week = new Date(now)
  week.setDate(week.getDate() + 7)
  week.setHours(9, 0, 0, 0)
  const nextLabel = next.getDay() === 1 && now.getDay() !== 0 ? __('Pondělí 9:00') : __('Zítra 9:00')
  return [
    { label: __('Za 3 hodiny'), hint: time(later), at: later },
    { label: nextLabel, hint: DAYS[next.getDay()], at: next },
    { label: __('Za týden'), hint: `${week.getDate()}. ${week.getMonth() + 1}.`, at: week },
  ]
})
function pick(o) {
  open.value = false
  emit('snooze', { until: fmt(o.at), label: o.label })
}
defineExpose({ toggle: () => (open.value = !open.value) })
</script>
<style scoped>
.gl-snz {
  position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; min-width: 230px; padding: 6px;
  border-radius: 16px; background: var(--mat-dialog, #fff); border: 1px solid var(--line); box-shadow: var(--mat-sheet-shadow);
  animation: gl-snz-in var(--t-base) var(--ease-out);
}
@keyframes gl-snz-in { from { opacity: 0; transform: translateY(6px); } }
.gl-snz-item {
  display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; min-height: var(--hit-sm);
  padding: 0 12px; border-radius: 10px; font-size: 15px; color: var(--text-1); text-align: left;
}
.gl-snz-item:hover, .gl-snz-item:focus-visible { background: var(--fill-tinted); outline: none; }
@media (pointer: coarse) { .gl-snz-item { min-height: var(--hit); } }
@media (prefers-reduced-motion: reduce) { .gl-snz { animation: none; } }
</style>
