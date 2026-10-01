<template>
  <!-- GrowUp: modul Plány (design „Plány“). Data: growupcrm.goals.get_plan -->
  <LayoutHeader>
    <template #left-header>
      <span class="text-lg-medium text-ink-gray-9">{{ __('Plány') }}</span>
    </template>
    <template #right-header>
      <div v-if="!isMobileView" class="gl-seg">
        <button v-for="o in plan.data?.periods || []" :key="o.value" class="gl-seg-btn" :class="period === o.value && 'gl-seg-on'" @click="period = o.value">
          {{ o.label }}
        </button>
      </div>
      <Button v-if="plan.data?.can_edit" :icon="isMobileView ? 'edit-2' : undefined" iconLeft="edit-2" :aria-label="__('Upravit cíle')" @click="showTargets = true">
        <span class="hidden sm:inline">{{ __('Upravit cíle') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <div v-if="plan.error" class="px-4 py-10 text-center text-ink-gray-5">{{ plan.error.messages?.[0] || __('Plány se nepodařilo načíst.') }}</div>
  <div v-else-if="p" class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <!-- oprava 25: na mobilu přepínač období pod nadpisem na celou šířku -->
    <div v-if="isMobileView" class="gl-seg flex w-full">
      <button v-for="o in plan.data?.periods || []" :key="o.value" class="gl-seg-btn flex-1 justify-center" :class="period === o.value && 'gl-seg-on'" @click="period = o.value">
        {{ o.label }}
      </button>
    </div>
    <div class="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
      <!-- tým -->
      <div class="gl-card p-6">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Tým') }} · {{ p.label }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ p.days_left !== null ? daysLeft(p.days_left) : periodRange }}</div>
        <div class="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <svg viewBox="0 0 180 180" class="size-[170px] shrink-0" role="img" :aria-label="__('Plnění cílů týmu')">
            <g v-for="(r, i) in rings" :key="r.key" transform="rotate(-90 90 90)">
              <circle cx="90" cy="90" :r="r.radius" fill="none" stroke="rgba(110,120,200,.14)" stroke-width="13" />
              <circle
                v-if="r.length > 0"
                cx="90" cy="90" :r="r.radius" fill="none" :stroke="r.color" stroke-width="13" stroke-linecap="round"
                :stroke-dasharray="`${r.length} ${r.circumference}`" class="transition-all duration-700"
              >
                <title>{{ r.label }}: {{ r.actualLabel }} / {{ r.targetLabel }}</title>
              </circle>
            </g>
          </svg>
          <div class="flex w-full flex-col gap-3">
            <div v-for="r in rings" :key="r.key" class="flex items-center gap-3 text-[15px]">
              <span class="size-3 shrink-0 rounded-[4px]" :style="{ background: r.color }" />
              <span class="flex-1 text-ink-gray-9">{{ r.label }}</span>
              <span class="num font-bold text-ink-gray-9">{{ r.actualLabel }} / {{ r.targetLabel }}</span>
              <span class="num w-12 text-right text-[13px] text-ink-gray-5">{{ r.percent === null ? '' : `${r.percent} %` }}</span>
            </div>
            <div v-if="!hasTargets" class="text-[13px] text-ink-gray-5">{{ __('Cíle zatím nejsou nastavené.') }}</div>
          </div>
        </div>
      </div>

      <!-- obchodníci -->
      <!-- mobil: obchodníci jako karty -->
      <template v-if="isMobileView">
        <div class="-mb-2 px-1 text-[13px] font-semibold text-[var(--text-3,#5B6285)]">{{ __('Obchodníci') }}</div>
        <div class="gl-card !rounded-[22px] px-4">
          <div v-for="(r, i) in p.people" :key="r.user" class="flex items-center gap-3 py-3" :class="i && 'border-t border-[rgba(110,120,200,.12)]'">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[13px] font-bold text-[#2e4bb8]">{{ initials(r.full_name) }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[17px] font-bold text-ink-gray-9">{{ r.full_name }}</span>
              <span class="num block text-[13px] text-ink-gray-5">
                {{ __('zakázky') }} {{ r.actual.won }}<template v-if="r.target.won">/{{ r.target.won }}</template>
                · {{ __('schůzky') }} {{ r.actual.meetings }}<template v-if="r.target.meetings">/{{ r.target.meetings }}</template>
              </span>
            </span>
            <span class="num text-[19px] font-bold text-ink-gray-9">
              <template v-if="r.progress !== null">{{ r.progress }} %</template>
              <span v-else class="text-[13px] font-normal text-ink-gray-5">{{ __('bez cíle') }}</span>
            </span>
          </div>
        </div>
      </template>
      <div v-else class="gl-card overflow-x-auto p-6">
        <h2 class="mb-2 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Podle obchodníka') }}</h2>
        <table class="w-full min-w-[520px] text-[14px]">
          <thead class="text-left text-[12px] font-bold text-ink-gray-5">
            <tr>
              <th class="py-2">{{ __('Obchodník') }}</th>
              <th class="py-2">{{ __('Zakázky') }}</th>
              <th class="py-2">{{ __('Schůzky') }}</th>
              <th class="py-2">{{ __('Tržby') }}</th>
              <th class="py-2">{{ __('Plnění') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in p.people" :key="r.user">
              <td class="py-2.5">
                <span class="flex items-center gap-2.5">
                  <span class="flex size-8 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2e4bb8]">{{ initials(r.full_name) }}</span>
                  <span class="font-semibold text-ink-gray-9">{{ r.full_name }}</span>
                </span>
              </td>
              <td class="num py-2.5">{{ r.actual.won }} / {{ r.target.won || '' }}</td>
              <td class="num py-2.5">{{ r.actual.meetings }} / {{ r.target.meetings || '' }}</td>
              <td class="num py-2.5">{{ thousands(r.actual.revenue) }}</td>
              <td class="py-2.5">
                <span v-if="r.progress !== null" class="flex items-center gap-2">
                  <span class="h-1.5 w-24 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]">
                    <span class="block h-full rounded-full bg-[#4f46e5]" :style="{ width: `${Math.min(r.progress, 100)}%` }" />
                  </span>
                  <span class="num text-[13px] font-bold text-ink-gray-9">{{ r.progress }} %</span>
                </span>
                <span v-else class="text-[13px] text-ink-gray-5">{{ __('bez cíle') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="gl-card p-5">
        <div class="flex items-center justify-between gap-2 text-[14px] text-ink-gray-7">
          {{ __('Předpoklad do konce období') }}
          <span v-if="p.projection !== null && p.team.target.won" class="rounded-full px-2 py-0.5 text-[12px] font-bold" :class="p.on_track ? 'bg-[rgba(79,70,229,.12)] text-[#4338ca]' : 'bg-[rgba(224,161,0,.16)] text-[#915200]'">
            {{ p.on_track ? __('na dobré cestě') : __('pod plánem') }}
          </span>
        </div>
        <div class="num mt-1 text-[38px] font-bold tracking-tight text-ink-gray-9">
          {{ p.projection ?? 0 }}<span v-if="p.team.target.won" class="text-[20px] text-ink-gray-5"> / {{ p.team.target.won }}</span>
        </div>
        <div class="text-[13px] text-ink-gray-5">{{ p.projection !== null ? __('zakázek při současném tempu') : __('období už skončilo nebo ještě nezačalo') }}</div>
      </div>
      <div class="gl-card p-5">
        <div class="text-[14px] text-ink-gray-7">{{ __('Potřebné tempo') }}</div>
        <div v-if="p.pace" class="num mt-1 text-[38px] font-bold tracking-tight text-ink-gray-9">{{ czNumber(p.pace) }}</div>
        <div v-else class="mt-3 text-[20px] font-semibold text-[var(--empty-color)]">{{ __('Bez dat') }}</div>
        <div class="text-[13px] text-ink-gray-5">{{ p.pace ? __('zakázky týdně navíc') : __('cíl je splněný nebo nenastavený') }}</div>
      </div>
      <div class="gl-card p-5">
        <div class="text-[14px] text-ink-gray-7">{{ __('Nejlepší zdroj') }}</div>
        <div v-if="p.best_source" class="mt-1 truncate text-[34px] font-bold tracking-tight text-ink-gray-9">{{ __(p.best_source.source) }}</div>
        <div v-else class="mt-3 text-[20px] font-semibold text-[var(--empty-color)]">{{ __('Bez dat') }}</div>
        <div class="text-[13px] text-ink-gray-5">
          {{ p.best_source ? __('{0} z {1} vyhraných zakázek', [p.best_source.count, p.best_source.total]) : __('zatím žádná vyhraná zakázka') }}
        </div>
      </div>
    </div>
  </div>

  <GlTargetsModal v-if="showTargets" v-model="showTargets" :months="monthOptions" :initial="editMonth" @saved="plan.reload()" />
</template>
<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isMobileView } from '@/composables/settings'
import GlTargetsModal from '@/components/Modals/GlTargetsModal.vue'
import { Button, createResource, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Plány') }))

const today = new Date()
const period = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
const showTargets = ref(false)

const plan = createResource({ url: 'growupcrm.goals.get_plan', makeParams: () => ({ period: period.value }), auto: true })
watch(period, () => plan.reload())
const p = computed(() => plan.data)

// barvy řad ověřené validátorem palety (CVD, kontrast); u kruhů je vždy legenda s hodnotami
const SERIES = [
  { key: 'won', label: __('Zakázky'), color: '#4f46e5', radius: 76 },
  { key: 'meetings', label: __('Schůzky'), color: '#0ea5e9', radius: 59 },
  { key: 'revenue', label: __('Tržby (tis.)'), color: '#c026d3', radius: 42 },
]
const rings = computed(() =>
  SERIES.map((s) => {
    const actual = p.value.team.actual[s.key]
    const target = p.value.team.target[s.key]
    const percent = p.value.team.percent[s.key]
    const circumference = 2 * Math.PI * s.radius
    const fmt = (v) => (s.key === 'revenue' ? new Intl.NumberFormat('cs-CZ').format(Math.round(v / 1000)) : v)
    return {
      ...s,
      circumference,
      length: target ? Math.min(actual / target, 1) * circumference : 0,
      percent,
      actualLabel: fmt(actual),
      targetLabel: target ? fmt(target) : __('bez cíle'),
    }
  }),
)
const hasTargets = computed(() => Object.values(p.value?.team.target || {}).some(Boolean))

const monthOptions = computed(() => (p.value?.periods || []).filter((o) => !o.value.includes('Q')).concat(nextMonth()))
const editMonth = computed(() => (period.value.includes('Q') ? monthOptions.value[1]?.value : period.value))
function nextMonth() {
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const label = d.toLocaleDateString('cs-CZ', { month: 'long' })
  return [{ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: label.charAt(0).toUpperCase() + label.slice(1) }]
}

const periodRange = computed(() => {
  const f = (s) => new Date(s + 'T00:00').toLocaleDateString('cs-CZ')
  return `${f(p.value.start)} – ${f(p.value.end)}`
})
const daysLeft = (n) => (n === 0 ? __('Poslední den') : n === 1 ? __('Zbývá 1 den') : n <= 4 ? __('Zbývají {0} dny', [n]) : __('Zbývá {0} dní', [n]))
const thousands = (n) => (n ? `${new Intl.NumberFormat('cs-CZ').format(Math.round(n / 1000))} tis.` : '0')
const czNumber = (n) => new Intl.NumberFormat('cs-CZ').format(n)
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
</script>
