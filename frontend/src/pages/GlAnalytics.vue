<template>
  <!-- GrowUp: modul Analytika (design „Analytika“), jen pro správce. Data: growupcrm.insights.get_analytics -->
  <LayoutHeader>
    <template #left-header>
      <span class="text-lg-medium text-ink-gray-9">{{ __('Analytika') }}</span>
    </template>
    <template #right-header>
      <div v-if="!isMobileView" class="gl-seg inline-flex">
        <button v-for="o in GRAINS" :key="o.value" class="gl-seg-btn" :class="grain === o.value && 'gl-seg-on'" @click="setGrain(o.value)">{{ o.label }}</button>
      </div>
      <Button iconLeft="download" :disabled="!data?.won_rows?.length" @click="exportCsv">
        <span class="hidden sm:inline">{{ __('Export') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="res.error && isForbidden(res.error)" :message="res.error.messages?.[0]" />
  <div v-else-if="res.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Analytiku se nepodařilo načíst')" :text="res.error.messages?.[0]" @retry="res.reload()" /></div>
  <div v-else-if="!res.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <!-- oprava 26: na mobilu přepínač Měsíc / Čtvrtletí / Rok na celou šířku pod nadpisem -->
    <div v-if="isMobileView" class="gl-seg flex w-full">
      <button v-for="o in GRAINS" :key="o.value" class="gl-seg-btn flex-1 justify-center" :class="grain === o.value && 'gl-seg-on'" @click="setGrain(o.value)">{{ o.label }}</button>
    </div>
    <!-- filtry v jedné řadě nad grafy -->
    <div class="flex flex-wrap items-center gap-2">
      <Dropdown :options="periodMenu">
        <button class="gl-chip flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px]">
          <span class="opacity-75">{{ __('Období') }}:</span><b class="font-semibold">{{ periodLabel }}</b>
          <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
        </button>
      </Dropdown>
      <Dropdown :options="userMenu">
        <button class="gl-chip flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px]" :class="user && 'gl-chip-on'">
          <span class="opacity-75">{{ __('Obchodník') }}:</span><b class="font-semibold">{{ user ? userName(user) : __('Celý tým') }}</b>
          <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
        </button>
      </Dropdown>
      <span v-if="custom" class="flex items-center gap-2 text-[14px]">
        <input v-model="customStart" type="date" class="h-9 px-3" />–<input v-model="customEnd" type="date" class="h-9 px-3" />
        <Button variant="solid" :label="__('Použít')" @click="applyCustom" />
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <div v-for="k in kpis" :key="k.label" class="gl-card flex flex-col gap-1.5 p-4 md:p-5">
        <div class="flex items-center gap-2 text-[14px] text-ink-gray-7">
          {{ k.label }}
          <span v-if="k.badge" class="rounded-full px-2 py-0.5 text-[12px] font-bold" :class="k.badgeUp ? 'bg-[rgba(79,70,229,.12)] text-[#4338ca]' : 'bg-[rgba(229,72,77,.12)] text-[#c8321f]'">{{ k.badge }}</span>
        </div>
        <div class="num text-[30px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[40px]">{{ k.value }}</div>
        <div class="truncate text-[13px] text-ink-gray-5">{{ k.sub }}</div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <!-- tržby po měsících: jedna řada, aktuální měsíc zvýrazněný -->
      <div class="gl-card p-6">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Tržby po měsících') }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ __('tis. Kč · zvýrazněn poslední měsíc období') }}</div>
        <!-- oprava 26: prázdný stav místo prázdného grafu -->
        <div v-if="!hasRevenue" class="mt-4 flex flex-col items-center gap-3 py-8 text-center">
          <span class="flex size-14 items-center justify-center rounded-2xl bg-[rgba(110,120,200,.12)] text-ink-gray-7"><GlIcon name="chart" :size="26" /></span>
          <div class="text-[18px] font-bold text-ink-gray-9">{{ __('Zatím žádné vyhrané zakázky') }}</div>
          <p class="max-w-[300px] text-[14px] text-ink-gray-5">{{ __('Graf tržeb se ukáže po první výhře v tomto období. Zkuste jiné období.') }}</p>
          <div class="flex gap-2">
            <button class="gl-quick" @click="setGrain('year')">{{ __('Celý rok') }}</button>
            <router-link :to="{ name: 'Leads' }" class="inline-flex h-9 items-center rounded-full bg-[#4F46E5] px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)]">{{ __('Zakázky') }}</router-link>
          </div>
        </div>
        <div v-else class="relative mt-4 flex h-[230px] items-end gap-3 border-b border-[rgba(110,120,200,.18)] px-2">
          <div
            v-for="(m, i) in data?.by_month || []"
            :key="m.month"
            class="group relative flex h-full flex-1 flex-col items-center justify-end"
            @mouseenter="hoverBar = i"
            @mouseleave="hoverBar = null"
          >
            <span class="num mb-1 text-[13px] font-bold text-ink-gray-9">{{ k(m.value) }}</span>
            <div
              class="w-full max-w-[46px] rounded-t-[4px] transition-all duration-500"
              :class="i === lastIndex ? 'bg-[#4f46e5]' : 'bg-[#c7c9f6] group-hover:bg-[#a5a8f0]'"
              :style="{ height: `${barHeight(m.value)}%`, minHeight: m.value ? '4px' : '0' }"
            />
            <div v-if="hoverBar === i" class="gl-sheet pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px]">
              <b>{{ monthLong(m.month) }}</b><br />{{ money(m.value) }}
            </div>
          </div>
        </div>
        <div v-if="hasRevenue" class="mt-2 flex gap-3 px-2">
          <span v-for="m in data?.by_month || []" :key="m.month" class="flex-1 text-center text-[12px] text-ink-gray-5">{{ m.label }}</span>
        </div>
      </div>

      <!-- trychtýř -->
      <div class="gl-card p-6">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Trychtýř') }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ __('kolik zakázek z období dosáhlo aspoň dané fáze') }}</div>
        <div class="mt-4 flex flex-col gap-2.5">
          <div v-for="(f, i) in data?.funnel || []" :key="f.stage" class="flex items-center gap-3" :title="`${__(f.stage)}: ${f.count}`">
            <span class="w-36 shrink-0 truncate text-[14px] text-ink-gray-9">{{ __(f.stage) }}</span>
            <span class="h-6 flex-1">
              <span class="block h-full rounded-[4px]" :style="{ width: `${funnelWidth(f.count)}%`, background: FUNNEL[i] || FUNNEL[FUNNEL.length - 1], minWidth: f.count ? '4px' : '0' }" />
            </span>
            <span class="num w-8 text-right text-[14px] font-bold text-ink-gray-9">{{ f.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="gl-card p-6">
        <h2 class="mb-4 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Zdroje vyhraných a otevřených zakázek') }}</h2>
        <GlEmptyState v-if="!data?.sources?.length" icon="brief" :title="__('Žádné zakázky v období')" :text="__('Zkuste delší období.')" />
        <div v-for="s in data?.sources || []" :key="s.source" class="flex items-center gap-3 py-1.5" :title="`${__(s.source)}: ${s.count}`">
          <span class="w-32 shrink-0 truncate text-[14px] text-ink-gray-9">{{ __(s.source) }}</span>
          <span class="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.14)]">
            <span class="block h-full rounded-full bg-[#4f46e5]" :style="{ width: `${(s.count * 100) / maxSource}%` }" />
          </span>
          <span class="num w-8 text-right text-[14px] font-bold text-ink-gray-9">{{ s.count }}</span>
        </div>
      </div>
      <div class="gl-card p-6">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Nejlepší klienti') }}</h2>
        <GlEmptyState v-if="!data?.clients?.length" icon="star" :title="__('Zatím žádná výhra')" :text="__('Nejlepší klienti se ukážou po první vyhrané zakázce v období.')" />
        <component
          :is="c.organization ? 'router-link' : 'div'"
          v-for="c in data?.clients || []"
          :key="c.name"
          :to="c.organization ? { name: 'Organization', params: { organizationId: c.organization } } : undefined"
          class="flex items-center gap-3 rounded-2xl py-2"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#efe7ff] text-[12px] font-bold text-[#6d3fd0]">{{ initials(c.name) }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-semibold text-ink-gray-9">{{ c.name }}</span>
            <span class="block text-[12.5px] text-ink-gray-5">{{ clientSub(c) }}</span>
          </span>
          <span class="num text-[16px] font-bold text-ink-gray-9">{{ money(c.value) }}</span>
        </component>
      </div>
    </div>
  </div>
</template>
<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { isForbidden } from '@/utils/glErrors'
import GlForbidden from '@/components/GlForbidden.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import { isMobileView } from '@/composables/settings'
import { usersStore } from '@/stores/users'
import { Button, Dropdown, createResource, usePageMeta } from 'frappe-ui'
import { computed, ref } from 'vue'

usePageMeta(() => ({ title: __('Analytika') }))
const { getUser } = usersStore()

const GRAINS = [
  { value: 'month', label: __('Měsíc') },
  { value: 'quarter', label: __('Čtvrtletí') },
  { value: 'year', label: __('Rok') },
]
// trychtýř: jedna řada, odstíny indiga od plného po světlý (fáze = pořadí)
const FUNNEL = ['#4f46e5', '#5b55e8', '#6f6aec', '#8580f0', '#a09cf4', '#b9b6f7']

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today = new Date()
function rangeFor(grain, offset = 0) {
  const y = today.getFullYear()
  if (grain === 'month') {
    const s = new Date(y, today.getMonth() + offset, 1)
    return [s, new Date(s.getFullYear(), s.getMonth() + 1, 0)]
  }
  if (grain === 'quarter') {
    const q = Math.floor(today.getMonth() / 3) + offset
    const s = new Date(y, q * 3, 1)
    return [s, new Date(s.getFullYear(), s.getMonth() + 3, 0)]
  }
  return [new Date(y + offset, 0, 1), new Date(y + offset, 11, 31)]
}

const grain = ref('quarter')
const range = ref(rangeFor('quarter'))
const user = ref('')
const custom = ref(false)
const customStart = ref('')
const customEnd = ref('')

const res = createResource({
  url: 'growupcrm.insights.get_analytics',
  makeParams: () => ({ start: iso(range.value[0]), end: iso(range.value[1]), user: user.value || null }),
  auto: true,
})
const data = computed(() => res.data)

function setRange(r, g = null) {
  range.value = r
  if (g) grain.value = g
  custom.value = false
  res.reload()
}
function setGrain(g) {
  setRange(rangeFor(g), g)
}
function applyCustom() {
  if (!customStart.value || !customEnd.value) return
  range.value = [new Date(customStart.value + 'T00:00'), new Date(customEnd.value + 'T00:00')]
  grain.value = ''
  res.reload()
}

const quarterLabel = (d) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
const periodLabel = computed(() => {
  const [s, e] = range.value
  if (grain.value === 'quarter') return quarterLabel(s)
  if (grain.value === 'year') return String(s.getFullYear())
  if (grain.value === 'month') {
    const m = s.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
    return m.charAt(0).toUpperCase() + m.slice(1)
  }
  return `${s.toLocaleDateString('cs-CZ')} – ${e.toLocaleDateString('cs-CZ')}`
})
const periodMenu = computed(() => [
  { label: __('Tento měsíc'), onClick: () => setRange(rangeFor('month'), 'month') },
  { label: __('Minulý měsíc'), onClick: () => setRange(rangeFor('month', -1), 'month') },
  { label: __('Toto čtvrtletí'), onClick: () => setRange(rangeFor('quarter'), 'quarter') },
  { label: quarterLabel(rangeFor('quarter', -1)[0]), onClick: () => setRange(rangeFor('quarter', -1), 'quarter') },
  { label: __('Letos'), onClick: () => setRange(rangeFor('year'), 'year') },
  { label: __('Vlastní…'), onClick: () => ((custom.value = true), (customStart.value = iso(range.value[0])), (customEnd.value = iso(range.value[1]))) },
])

const users = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const userMenu = computed(() => [
  { label: __('Celý tým'), onClick: () => ((user.value = ''), res.reload()) },
  ...(users.data || []).map((u) => ({ label: u.full_name || u.name, onClick: () => ((user.value = u.name), res.reload()) })),
])
const userName = (u) => getUser(u)?.full_name || u

const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(n || 0))} Kč`
const k = (n) => new Intl.NumberFormat('cs-CZ').format(Math.round((n || 0) / 1000))
const thousandsLabel = (n) => (n >= 1000 ? `${k(n)} tis.` : String(Math.round(n || 0)))
const kpis = computed(() => {
  const x = data.value?.kpis
  if (!x) return []
  const [s, e] = range.value
  const months = (d) => d.toLocaleDateString('cs-CZ', { month: 'long' })
  return [
    {
      label: __('Tržby'),
      value: thousandsLabel(x.revenue),
      badge: x.revenue_delta === null ? '' : `${x.revenue_delta >= 0 ? '↗' : '↘'} ${Math.abs(x.revenue_delta)} %`,
      badgeUp: x.revenue_delta >= 0,
      sub: `Kč · ${months(s)} – ${months(e)}`,
    },
    { label: __('Úspěšnost'), value: x.success === null ? __('Bez dat') : `${x.success} %`, sub: __('vyhráno {0} z {1} založených', [x.won, x.created]) },
    { label: __('Průměrná zakázka'), value: thousandsLabel(x.avg_value), sub: __('Kč · vyhrané zakázky') },
    { label: __('Délka obchodu'), value: x.cycle_days === null ? __('Bez dat') : __('{0} dní', [x.cycle_days]), sub: __('od založení po výhru') },
  ]
})

const hoverBar = ref(null)
const hasRevenue = computed(() => (data.value?.by_month || []).some((m) => m.value))
const lastIndex = computed(() => (data.value?.by_month?.length || 1) - 1)
const maxMonth = computed(() => Math.max(1, ...(data.value?.by_month || []).map((m) => m.value)))
const barHeight = (v) => Math.round((v / maxMonth.value) * 82)
const maxFunnel = computed(() => Math.max(1, ...(data.value?.funnel || []).map((f) => f.count)))
const funnelWidth = (n) => (n / maxFunnel.value) * 100
const maxSource = computed(() => Math.max(1, ...(data.value?.sources || []).map((s) => s.count)))
const monthLong = (ym) => {
  const t = new Date(`${ym}-01T00:00`).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const clientSub = (c) => {
  const word = c.count === 1 ? __('zakázka') : c.count <= 4 ? __('zakázky') : __('zakázek')
  return `${c.count} ${word}${c.retainer ? ' · retainer' : ''}`
}
const initials = (s) =>
  (s || '?')
    .replace(/[,.]|s\.r\.o|a\.s/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// Export vyhraných zakázek období do CSV (středník + BOM, aby ho Excel otevřel česky)
function exportCsv() {
  const rows = data.value.won_rows
  const head = ['Zakázka', 'Firma', 'Obchodník', 'Zdroj', 'Hodnota (Kč)', 'Vyhráno']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [head.map(esc).join(';')].concat(
    rows.map((r) => [r.title, r.organization, userName(r.owner), r.source, r.value, r.won_date].map(esc).join(';')),
  )
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `growupcrm-analytika-${iso(range.value[0])}-${iso(range.value[1])}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>
