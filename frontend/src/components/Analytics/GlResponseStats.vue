<template>
  <!-- GrowUp: Analytika → Rychlost reakce na příchozí zakázky (growupcrm.response_time.stats) -->
  <div class="gl-card p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Rychlost reakce na poptávky') }}</h2>
      <span class="text-[13px] text-ink-gray-5">{{ __('příchozí zakázky v období · lhůta {0} pracovních hodin', [hoursLabel]) }}</span>
    </div>
    <GlEmptyState
      v-if="!data?.count"
      class="my-4"
      icon="clock"
      :title="__('Zatím bez dat')"
      :text="__('Měří se příchozí zakázky (web, formuláře, Facebook, API, Outreach) založené po zapnutí hlídání.')"
    />
    <template v-else>
      <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div v-for="t in tiles" :key="t.label" class="rounded-2xl bg-[rgba(110,120,200,.075)] px-4 py-3">
          <div class="text-[13px] text-ink-gray-6">{{ t.label }}</div>
          <div class="num text-[26px] font-bold leading-tight text-ink-gray-9" :class="t.tone">{{ t.value }}</div>
          <div class="text-[12px] text-ink-gray-5">{{ t.sub }}</div>
        </div>
      </div>
      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <div v-for="g in groups" :key="g.title">
          <div class="mb-2 text-[14px] font-semibold text-ink-gray-8">{{ g.title }}</div>
          <table class="w-full text-left text-[13.5px]">
            <thead class="text-[12px] text-ink-gray-5">
              <tr>
                <th class="py-1 font-medium">{{ g.col }}</th>
                <th class="py-1 text-right font-medium">{{ __('Zakázek') }}</th>
                <th class="py-1 text-right font-medium">{{ __('Medián') }}</th>
                <th class="py-1 text-right font-medium">{{ __('V termínu') }}</th>
                <th class="py-1 text-right font-medium">{{ __('Čeká') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in g.rows" :key="r.key" class="border-t border-[rgba(110,120,200,.12)]">
                <td class="max-w-[160px] truncate py-1.5 text-ink-gray-9">{{ __(r.label) }}</td>
                <td class="num py-1.5 text-right">{{ r.count }}</td>
                <td class="num py-1.5 text-right">{{ formatMinutes(r.median) }}</td>
                <td class="num py-1.5 text-right" :class="pctTone(r.on_time_pct)">{{ r.on_time_pct === null ? '—' : `${r.on_time_pct} %` }}</td>
                <td class="num py-1.5 text-right" :class="r.overdue && 'font-bold text-[#a82614]'">{{ r.waiting }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import { formatMinutes } from '@/composables/responseTime'
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, default: null } })

const hoursLabel = computed(() => String(props.data?.hours ?? 4).replace('.', ','))
const pctTone = (p) => (p === null ? '' : p >= 80 ? 'text-[#178a4a]' : p >= 50 ? 'text-[#7a4400]' : 'text-[#a82614]')
const tiles = computed(() => {
  const d = props.data || {}
  return [
    { label: __('Medián odpovědi'), value: formatMinutes(d.median), sub: __('polovina odpovědí byla rychlejší') },
    { label: __('Průměr odpovědi'), value: formatMinutes(d.avg), sub: __('pracovní čas') },
    { label: __('V termínu'), value: d.on_time_pct === null ? '—' : `${d.on_time_pct} %`, sub: __('z {0} zodpovězených', [d.answered]), tone: pctTone(d.on_time_pct) },
    { label: __('Čeká na odpověď'), value: d.waiting, sub: d.overdue ? __('{0} po termínu', [d.overdue]) : __('nic po termínu'), tone: d.overdue ? 'text-[#a82614]' : '' },
  ]
})
const groups = computed(() => [
  { title: __('Podle obchodníka'), col: __('Obchodník'), rows: props.data?.by_user || [] },
  { title: __('Podle zdroje'), col: __('Zdroj'), rows: props.data?.by_source || [] },
])
</script>
