<template>
  <!-- GrowUp: mobilní kalendář (design „Mobil – Kalendář“): týden nahoře, program vybraného dne pod ním. -->
  <div class="flex min-h-0 flex-1 flex-col px-1" @touchstart.passive="touchStart" @touchend.passive="touchEnd">
    <div class="flex items-end justify-between px-1">
      <div class="flex flex-col leading-tight">
        <span class="text-[13px] font-bold text-ink-gray-5">{{ selected.getFullYear() }}</span>
        <span class="text-[30px] font-bold tracking-tight text-ink-gray-9">{{ monthName }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="gl-round flex size-10 items-center justify-center rounded-full" :aria-label="__('Předchozí týden')" @click="$emit('move', -1)">
          <GlIcon name="left" :size="16" />
        </button>
        <button class="gl-round flex size-10 items-center justify-center rounded-full" :aria-label="__('Další týden')" @click="$emit('move', 1)">
          <GlIcon name="right" :size="16" />
        </button>
        <button class="gl-round flex size-11 items-center justify-center rounded-full" :aria-label="__('Nová událost')" @click="$emit('new', selected)">
          <GlIcon name="plus" :size="20" />
        </button>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-7 gap-1">
      <button v-for="d in days" :key="d.getTime()" class="flex flex-col items-center gap-1 py-1" @click="$emit('select', d)">
        <span class="text-[12px] font-semibold text-ink-gray-5">{{ dayShort(d) }}</span>
        <span
          class="flex size-10 items-center justify-center rounded-full text-[17px] font-bold"
          :class="same(d, selected) ? 'bg-[#4f46e5] text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,.8)]' : isToday(d) ? 'text-[#4f46e5]' : 'text-ink-gray-9'"
        >
          {{ d.getDate() }}
        </span>
        <span class="size-1.5 rounded-full" :class="countOn(d) ? 'bg-[#4f46e5]' : 'bg-transparent'" />
      </button>
    </div>

    <div class="mt-3 flex items-center justify-between px-1">
      <span class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ dayTitle }}</span>
      <span class="text-[13px] text-ink-gray-5">{{ countLabel }}</span>
    </div>

    <div class="mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-28">
      <div v-if="isToday(selected)" class="flex items-center gap-2 px-1">
        <span class="num w-12 text-right text-[12px] font-bold text-[#e5484d]">{{ hhmm(now) }}</span>
        <span class="size-2 rounded-full bg-[#e5484d]" />
        <span class="h-px flex-1 bg-[#e5484d]" />
      </div>
      <div v-if="!dayItems.length" class="gl-card px-4 py-8 text-center text-[14px] text-ink-gray-5">
        {{ __('Na tento den nic naplánovaného.') }}
      </div>
      <button v-for="it in dayItems" :key="it.key" class="flex items-stretch gap-3 text-left" @click="$emit('itemClick', it)">
        <span class="num flex w-12 shrink-0 flex-col items-end pt-2.5 leading-tight">
          <span class="text-[15px] font-bold text-ink-gray-9">{{ it.allDay ? __('Den') : hhmm(it.start) }}</span>
          <span v-if="it.kind === 'event' && !it.allDay" class="text-[12px] text-ink-gray-5">{{ hhmm(it.end) }}</span>
        </span>
        <span class="flex min-w-0 flex-1 flex-col rounded-2xl px-4 py-3" :class="tone(it)">
          <span class="truncate text-[16px] font-bold" :class="it.done && 'line-through'">{{ it.title }}</span>
          <span v-if="it.leadTitle || it.organization" class="truncate text-[13px] opacity-80">{{ it.leadTitle || it.organization }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { itemsOnDay } from '@/composables/calendar'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  selected: { type: Date, required: true },
})
const emit = defineEmits(['select', 'move', 'new', 'itemClick'])

const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 60000)
onBeforeUnmount(() => clearInterval(timer))

const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const isToday = (d) => same(d, now.value)
const hhmm = (d) => d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
const dayShort = (d) => {
  const s = d.toLocaleDateString('cs-CZ', { weekday: 'short' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const monthName = computed(() => {
  const s = props.selected.toLocaleDateString('cs-CZ', { month: 'long' })
  // „října“ → „Říjen“: genitiv z toLocaleDateString nechceme, vezmeme samostatný tvar
  const standalone = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).formatToParts(props.selected)
  const m = standalone.find((p) => p.type === 'month')?.value || s
  return m.charAt(0).toUpperCase() + m.slice(1)
})
const dayTitle = computed(() => {
  const s = props.selected.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const countOn = (d) => itemsOnDay(props.items, d).length
const dayItems = computed(() => itemsOnDay(props.items, props.selected))
const countLabel = computed(() => {
  const n = dayItems.value.length
  return n === 1 ? __('1 položka') : n >= 2 && n <= 4 ? __('{0} položky', [n]) : __('{0} položek', [n])
})

function tone(it) {
  if (it.done) return 'bg-[rgba(110,120,200,.10)] text-ink-gray-5'
  if (it.kind === 'event') return 'bg-[rgba(59,110,246,.14)] text-[#2e5bd8]'
  if (it.priority === 'High') return 'bg-[rgba(229,72,77,.13)] text-[#c8321f]'
  return 'bg-[rgba(224,161,0,.16)] text-[#915200]'
}

// přejetí prstem doleva/doprava = další/předchozí týden
let x0 = null
const touchStart = (e) => (x0 = e.touches[0].clientX)
function touchEnd(e) {
  if (x0 === null) return
  const dx = e.changedTouches[0].clientX - x0
  x0 = null
  if (Math.abs(dx) > 60) emit('move', dx < 0 ? 1 : -1)
}
</script>
