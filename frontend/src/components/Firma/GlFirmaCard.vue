<template>
  <!-- GrowUp (zadání 2027 E2): firma jako karta na telefonu, celá karta je odkaz na detail (cíl ≥ 64 px).
       Město ani fáze poslední zakázky seznam firem nevrací, proto IČO a vztah (stejná data jako v tabulce). -->
  <router-link
    :to="{ name: 'Organization', params: { organizationId: row.name }, query: { view: route.query.view, viewType: route.params.viewType } }"
    class="gl-card flex min-h-16 min-w-0 items-center gap-3 px-3 py-2.5 active:opacity-80"
  >
    <img v-if="logo" :src="logo" alt="" class="size-11 shrink-0 rounded-[12px] bg-white object-contain p-1" />
    <span v-else class="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-bold" :class="tone(label)">{{ initials(label) }}</span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <!-- název se zalamuje na max. 2 řádky po slovech, nikdy neutíná uprostřed slova -->
      <span class="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-gray-9" style="overflow-wrap: break-word; word-break: normal">{{ label }}</span>
      <span class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-gray-5">
        <span v-if="row.ico" class="tabular-nums">{{ __('IČO') }} {{ row.ico }}</span>
        <span v-if="relationship" class="gl3-stage" :style="{ '--stage': REL_COLORS[relationship] || 'var(--text-2)' }">{{ __(relationship) }}</span>
      </span>
    </span>
    <span class="lucide-chevron-right size-5 shrink-0 text-ink-gray-4" aria-hidden="true" />
  </router-link>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({ row: { type: Object, required: true } })
const route = useRoute()

const REL_COLORS = { Klient: 'var(--stage-vyhrano)', Prospekt: 'var(--stage-nova)', 'Bývalý klient': 'var(--stage-prohrano)' }
const TONES = [
  'bg-[var(--c-blue-50)] text-[var(--c-blue-600)]',
  'bg-[var(--c-violet-50)] text-[var(--c-violet-450)]',
  'bg-[var(--c-orange-100)] text-[var(--c-orange-600)]',
  'bg-[var(--c-green-100)] text-[var(--success)]',
]
const tone = (s) => TONES[[...(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]
const initials = (s) =>
  (s || '?')
    .replace(/[,.]|s\.r\.o|a\.s/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const name = computed(() => props.row.organization_name)
const label = computed(() => (typeof name.value === 'object' ? name.value?.label : name.value) || props.row.name)
const logo = computed(() => (typeof name.value === 'object' ? name.value?.logo : ''))
const relationship = computed(() => {
  const r = props.row.relationship
  return typeof r === 'object' ? r?.label : r
})
</script>
