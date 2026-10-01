<template>
  <!-- GrowUp (design 2. kolo, oprava 22): karta zakázky na mobilu. Dlouhý stisk (500 ms) = Posunout fázi. -->
  <router-link
    :to="{ name: 'Lead', params: { leadId: lead.name } }"
    class="gl-card gl-lift block !rounded-[20px] px-4 py-3.5 select-none"
    @pointerdown="start"
    @pointerup="cancel"
    @pointerleave="cancel"
    @pointermove="cancel"
    @contextmenu.prevent
    @click="onClick"
  >
    <div class="flex items-baseline justify-between gap-3">
      <div lang="cs" class="gl-text min-w-0 flex-1 text-[19px] font-bold leading-snug text-ink-gray-9">{{ title }}</div>
      <div v-if="lead.order_value" class="num shrink-0 text-[17px] font-bold text-ink-gray-9">{{ money }}</div>
    </div>
    <div class="mt-0.5 flex items-center justify-between gap-3">
      <div class="min-w-0 truncate text-[14px] text-ink-gray-5">{{ lead.organization }}</div>
      <div v-if="showStatus && lead.status" class="flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-ink-gray-9">
        <span class="size-2 rounded-full" :style="{ background: color }" />{{ __(lead.status) }}
      </div>
    </div>
    <div v-if="nextText" class="mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold" :class="nextClass">
      <GlIcon name="clock" :size="15" /><span class="truncate">{{ nextText }}</span>
    </div>
  </router-link>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { computed } from 'vue'

const props = defineProps({
  lead: { type: Object, required: true },
  showStatus: { type: Boolean, default: false },
})
const emit = defineEmits(['press'])

const COLORS = { 'Nová': '#3b82f6', 'Kontaktováno': '#8b5cf6', 'Nabídka odeslána': '#e0a100', 'Jednání': '#f97316', 'Vyhráno': '#22b35e', 'Prohráno': '#9ca3af' }
const color = computed(() => COLORS[props.lead.status] || '#9ca3af')
const title = computed(() => props.lead.order_title || props.lead.lead_name || props.lead.name)
const money = computed(() => `${new Intl.NumberFormat('cs-CZ').format(props.lead.order_value)} Kč`)

function dayLabel(iso) {
  const d = new Date(String(iso).replace(' ', 'T'))
  const s = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((s(d) - s(new Date())) / 86400000)
  if (diff === 0) return 'dnes'
  if (diff === -1) return 'včera'
  if (diff === 1) return 'zítra'
  if (diff < 0) return `před ${-diff} dny`
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
// z Kanbanu dodává server `next_action`, v seznamu pole `next_step` + `next_step_at`
const next = computed(() => {
  const a = props.lead.next_action
  if (a) return { text: a.kind === 'event' ? `Schůzka ${dayLabel(a.at)}` : `${a.label} – ${dayLabel(a.at)}`, overdue: a.overdue, event: a.kind === 'event' }
  if (props.lead.next_step && props.lead.next_step_at) {
    return { text: `${props.lead.next_step} – ${dayLabel(props.lead.next_step_at)}`, overdue: new Date(String(props.lead.next_step_at).replace(' ', 'T')) < new Date(), event: false }
  }
  return null
})
const nextText = computed(() => next.value?.text)
const nextClass = computed(() => (next.value?.overdue ? 'text-[#c8321f]' : next.value?.event ? 'text-[#2e5bd8]' : 'text-[#915200]'))

let timer = null
let fired = false
function start() {
  fired = false
  timer = setTimeout(() => ((fired = true), emit('press')), 500)
}
function cancel() {
  clearTimeout(timer)
}
function onClick(e) {
  if (fired) {
    e.preventDefault()
    e.stopPropagation()
    fired = false
  }
}
</script>
