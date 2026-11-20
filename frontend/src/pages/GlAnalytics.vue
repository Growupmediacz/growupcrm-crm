<template>
  <!-- GrowUp: modul Analytika (design „Analytika“), jen pro správce. Data: growupcrm.insights.get_analytics -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-3">
        <span class="gl-page-title text-lg-medium shrink-0 text-ink-gray-9">{{ __('Analytika') }}</span>
        <!-- design 3. kolo (20): Období a Obchodník vedle nadpisu -->
        <div v-if="!isMobileView" class="flex items-center gap-2">
          <Dropdown :options="periodMenu">
            <button class="gl-chip flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px]">
              <span class="opacity-75">{{ __('Období') }}:</span><b class="font-semibold">{{ periodLabel }}</b>
              <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
            </button>
          </Dropdown>
          <Dropdown :options="userMenu">
            <button class="gl-chip flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px]" :class="user && 'gl-chip-on'">
              <span class="opacity-75">{{ __('Obchodník') }}:</span><b class="font-semibold">{{ user ? userName(user) : __('Celý tým') }}</b>
              <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
            </button>
          </Dropdown>
        </div>
      </div>
    </template>
    <template #right-header>
      <div v-if="!isMobileView" class="gl-seg inline-flex">
        <button v-for="o in GRAINS" :key="o.value" class="gl-seg-btn !px-5" :class="grain === o.value && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="setGrain(o.value)">{{ o.label }}</button>
      </div>
      <Button iconLeft="lucide-download" class="max-md:!h-11 max-md:!min-w-11" :disabled="!data?.won_rows?.length" @click="exportCsv">
        <span class="hidden sm:inline">{{ __('Export') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="res.error && isForbidden(res.error)" :message="res.error.messages?.[0]" />
  <div v-else-if="res.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Analytiku se nepodařilo načíst')" :text="res.error.messages?.[0]" @retry="res.reload()" /></div>
  <div v-else-if="!res.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex flex-col gap-4 px-3 pb-6 md:px-2">
    <!-- oprava 26: na mobilu přepínač Měsíc / Čtvrtletí / Rok na celou šířku pod nadpisem -->
    <div v-if="isMobileView" class="gl-seg flex w-full flex-wrap">
      <button v-for="o in GRAINS" :key="o.value" class="gl-seg-btn min-h-11 flex-1 justify-center" :class="grain === o.value && 'gl-seg-on'" @click="setGrain(o.value)">{{ o.label }}</button>
    </div>
    <!-- filtry v jedné řadě nad grafy -->
    <div v-if="isMobileView || custom" class="flex flex-wrap items-center gap-2">
      <template v-if="isMobileView">
      <Dropdown :options="periodMenu">
        <button class="gl-chip flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3.5 text-[14px] md:h-9 md:min-h-0">
          <span class="opacity-75">{{ __('Období') }}:</span><b class="font-semibold">{{ periodLabel }}</b>
          <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
        </button>
      </Dropdown>
      <Dropdown :options="userMenu">
        <button class="gl-chip flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3.5 text-[14px] md:h-9 md:min-h-0" :class="user && 'gl-chip-on'">
          <span class="opacity-75">{{ __('Obchodník') }}:</span><b class="font-semibold">{{ user ? userName(user) : __('Celý tým') }}</b>
          <span class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
        </button>
      </Dropdown>
      </template>
      <span v-if="custom" class="flex flex-wrap items-center gap-2 text-[14px]">
        <input v-model="customStart" type="date" class="h-11 min-w-0 px-3 md:h-9" />–<input v-model="customEnd" type="date" class="h-11 min-w-0 px-3 md:h-9" />
        <Button variant="solid" class="max-md:!h-11" :label="__('Použít')" @click="applyCustom" />
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <!-- design 3. kolo (20): tučný název, velké číslo, popisek; trend jako štítek vpravo -->
      <div v-for="k in kpis" :key="k.label" class="gl-card flex min-w-0 flex-col gap-1.5 p-5">
        <div class="flex items-center justify-between gap-2">
          <span class="line-clamp-2 min-w-0 text-[15px] font-semibold leading-snug text-ink-gray-9 md:text-[17px]">{{ k.label }}</span>
          <span v-if="k.badge" class="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-semibold" :class="k.badgeUp ? 'bg-[color-mix(in_srgb,var(--accent-600)_12%,transparent)] text-[var(--accent-700)]' : 'bg-[color-mix(in_srgb,var(--c-red-400)_12%,transparent)] text-[var(--overdue)]'">{{ k.badge }}</span>
        </div>
        <!-- telefon: zkrácená čísla (66 tis.), celá hodnota v title; číslice stejně široké -->
        <div class="num break-words text-[32px] font-medium leading-tight tracking-tight text-ink-gray-9 tabular-nums md:truncate md:text-[40px]" :title="k.full" :aria-label="k.full"><GlNumber :value="k.raw" :format="k.format" :suffix="k.suffix" :fallback="String(k.value)" /></div>
        <div class="line-clamp-2 text-[14px] leading-snug text-ink-gray-5 md:truncate md:text-[15px]">{{ k.sub }}</div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <!-- tržby po měsících: jedna řada, aktuální měsíc zvýrazněný -->
      <div class="gl-card min-w-0 p-5">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Tržby po měsících') }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ __('tis. Kč · zvýrazněn poslední měsíc období') }}</div>
        <!-- oprava 26: prázdný stav místo prázdného grafu -->
        <GlEmptyState v-if="!hasRevenue" class="mt-4" icon="chart" :title="__('Zatím žádné vyhrané zakázky')" :text="__('Graf tržeb se ukáže po první výhře v tomto období. Zkuste jiné období.')" :action="__('Celý rok')" @action="setGrain('year')" />
        <div v-else class="relative mt-4 flex h-[230px] items-end gap-1.5 border-b md:gap-3 border-[color-mix(in_srgb,var(--c-tint)_18%,transparent)] px-2">
          <div
            v-for="(m, i) in data?.by_month || []"
            :key="m.month"
            class="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            @mouseenter="hoverBar = i"
            @mouseleave="hoverBar = null"
          >
            <span class="num mb-1 max-w-full truncate text-[13px] font-bold text-ink-gray-9"><GlNumber :value="Math.round((m.value || 0) / 1000)" /></span>
            <div
              class="w-full max-w-[46px] rounded-t-[4px] transition-all duration-500"
              :class="i === lastIndex ? 'bg-[var(--accent-600)]' : 'bg-[var(--c-indigo-150)] group-hover:bg-[var(--c-indigo-200)]'"
              :style="{ height: `${barHeight(m.value)}%`, minHeight: m.value ? '4px' : '0' }"
            />
            <div v-if="hoverBar === i" class="gl-sheet pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px]">
              <b>{{ monthLong(m.month) }}</b><br />{{ money(m.value) }}
            </div>
          </div>
        </div>
        <div v-if="hasRevenue" class="mt-2 flex gap-1.5 px-2 md:gap-3">
          <span v-for="m in data?.by_month || []" :key="m.month" class="min-w-0 flex-1 truncate text-center text-[13px] text-ink-gray-5">{{ m.label }}</span>
        </div>
      </div>

      <!-- trychtýř -->
      <div class="gl-card min-w-0 p-5">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Trychtýř') }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ __('kolik zakázek z období dosáhlo aspoň dané fáze') }}</div>
        <div v-gl-animate class="mt-4 flex flex-col gap-2.5">
          <div v-for="(f, i) in data?.funnel || []" :key="f.stage" class="flex items-center gap-3" :title="`${__(f.stage)}: ${f.count}`">
            <span class="w-24 shrink-0 text-[14px] leading-tight text-ink-gray-9 md:w-36 md:truncate">{{ __(f.stage) }}</span>
            <span class="h-3.5 flex-1 rounded-full bg-[color-mix(in_srgb,var(--c-tint)_10%,transparent)]">
              <span class="block h-full rounded-full" :style="{ width: `${funnelWidth(f.count)}%`, background: FUNNEL[i] || FUNNEL[FUNNEL.length - 1], minWidth: f.count ? '4px' : '0' }" />
            </span>
            <span class="num w-8 text-right text-[14px] font-bold text-ink-gray-9"><GlNumber :value="f.count" /></span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1.15fr_1fr_1.2fr]">
      <!-- design 3. kolo (20): zdroje jako sloupce, nejčastější zvýrazněný -->
      <div class="gl-card min-w-0 p-5">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Zdroje zakázek') }}</h2>
        <div class="text-[13px] text-ink-gray-5">{{ __('vyhrané a otevřené v období') }}</div>
        <GlEmptyState v-if="!data?.sources?.length" class="mt-4" icon="brief" :title="__('Žádné zakázky v období')" :text="__('Zkuste delší období.')" />
        <template v-else>
          <div class="mt-4 flex h-[150px] items-end gap-1.5 border-b md:gap-3 border-[color-mix(in_srgb,var(--c-tint)_18%,transparent)] px-1">
            <div v-for="(s, i) in data.sources.slice(0, 5)" :key="s.source" class="flex h-full flex-1 flex-col items-center justify-end" :title="`${__(s.source)}: ${s.count}`">
              <span class="num mb-1 text-[14px] font-semibold text-ink-gray-9"><GlNumber :value="s.count" /></span>
              <div class="w-full max-w-[64px] rounded-t-[6px]" :class="i === 0 ? 'bg-[var(--accent-600)]' : 'bg-[var(--c-indigo-150)]'" :style="{ height: `${(s.count * 100) / maxSource}%`, minHeight: '4px' }" />
            </div>
          </div>
          <div class="mt-2 flex gap-1.5 px-1 md:gap-3">
            <span v-for="s in data.sources.slice(0, 5)" :key="s.source" class="min-w-0 flex-1 truncate text-center text-[13px] text-ink-gray-6">{{ __(s.source) }}</span>
          </div>
        </template>
      </div>
      <!-- reakční doba: průměr, lhůta a podíl v limitu; podrobnosti níž -->
      <div class="gl-card flex min-w-0 flex-col p-5">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Reakční doba') }}</h2>
        <template v-if="data?.response?.count">
          <div class="num mt-3 text-[40px] font-medium leading-none tracking-tight text-ink-gray-9"><GlNumber :value="avgParts.value" :format="avgParts.format" :suffix="avgParts.suffix" /></div>
          <div class="mt-2 text-[16px] text-ink-gray-5">{{ __('cíl {0} pracovní hodiny', [String(data.response.hours ?? 4).replace('.', ',')]) }}</div>
          <span v-if="data.response.on_time_pct !== null" class="mt-4 inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full px-3.5 py-1.5 text-[15px] font-semibold" :class="data.response.on_time_pct >= 80 ? 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_12%,transparent)] text-[var(--c-green-700)]' : 'bg-[color-mix(in_srgb,var(--stage-nabidka)_16%,transparent)] text-[var(--warning)]'">
            <GlIcon :name="data.response.on_time_pct >= 80 ? 'check' : 'alert'" :size="16" />{{ __('V limitu') }} <GlNumber :value="data.response.on_time_pct" suffix=" %" />
          </span>
        </template>
        <GlEmptyState v-else class="mt-2" icon="clock" :title="__('Zatím bez dat')" :text="__('Měří se příchozí zakázky z webu, formulářů a Facebooku.')" />
      </div>
      <div v-gl-animate class="gl-card min-w-0 p-5">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Nejlepší klienti') }}</h2>
        <GlEmptyState v-if="!data?.clients?.length" icon="star" :title="__('Zatím žádná výhra')" :text="__('Nejlepší klienti se ukážou po první vyhrané zakázce v období.')" />
        <component
          :is="c.organization ? 'router-link' : 'div'"
          v-for="c in data?.clients || []"
          :key="c.name"
          :to="c.organization ? { name: 'Organization', params: { organizationId: c.organization } } : undefined"
          class="flex min-h-14 items-center gap-3 rounded-2xl py-2"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--c-violet-50)] text-[13px] font-bold text-[var(--c-violet-450)]">{{ initials(c.name) }}</span>
          <span class="min-w-0 flex-1">
            <span class="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-ink-gray-9">{{ c.name }}</span>
            <span class="block text-[13px] text-ink-gray-5">{{ clientSub(c) }}</span>
          </span>
          <span class="num shrink-0 whitespace-nowrap text-[16px] font-bold text-ink-gray-9 tabular-nums" :title="money(c.value)"><GlNumber :value="Math.round(c.value || 0)" :format="isPhone ? FMT_COMPACT : FMT_CZK" :suffix="isPhone ? ' Kč' : undefined" /></span>
        </component>
      </div>
    </div>

    <!-- podrobnosti reakční doby (podle obchodníka a zdroje) -->
    <GlResponseStats v-if="data?.response?.count" :data="data?.response" />
  </div>
</template>
<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlResponseStats from '@/components/Analytics/GlResponseStats.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { isForbidden } from '@/utils/glErrors'
import GlForbidden from '@/components/GlForbidden.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlNumber from '@/components/GlNumber.vue'
import { vGlAnimate } from '@/composables/glMotion'
import { isMobileView } from '@/composables/settings'
import { isPhone } from '@/composables/glBreakpoint'
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
// design 3. kolo (20): barvy fází podle tokenů (Nová, Kontaktováno, Nabídka, Jednání, Vyhráno)
const FUNNEL = ['var(--stage-nova)', 'var(--stage-kontaktovano)', 'var(--stage-nabidka)', 'var(--stage-jednani)', 'var(--stage-vyhrano)']

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

// formáty GlNumber: stejný výstup jako money() a moneyCompact() níž
const FMT_CZK = { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }
const FMT_COMPACT = { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }
const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(n || 0))} Kč`
const k = (n) => new Intl.NumberFormat('cs-CZ').format(Math.round((n || 0) / 1000))
// telefon: zkrácený zápis velkých částek („66 tis.“, „1,2 mil.“), jinak celé tisíce jako dřív
const compact = new Intl.NumberFormat('cs-CZ', { notation: 'compact', maximumFractionDigits: 1 })
const moneyCompact = (n) => `${compact.format(Math.round(n || 0))} Kč`
const thousandsLabel = (n) => (isPhone.value ? compact.format(Math.round(n || 0)) : thousandsFull(n))
const thousandsFull = (n) => (n >= 1000 ? `${k(n)} tis.` : String(Math.round(n || 0)))
// surová hodnota + formát pro GlNumber; výstup shodný s thousandsLabel()
const thousandsParts = (n) => {
  if (isPhone.value) return { raw: Math.round(n || 0), format: FMT_COMPACT }
  return n >= 1000 ? { raw: Math.round(n / 1000), suffix: ' tis.' } : { raw: Math.round(n || 0) }
}
const kpis = computed(() => {
  const x = data.value?.kpis
  if (!x) return []
  const [s, e] = range.value
  const months = (d) => d.toLocaleDateString('cs-CZ', { month: 'long' })
  return [
    {
      label: __('Tržby'),
      value: thousandsLabel(x.revenue),
      ...thousandsParts(x.revenue),
      full: money(x.revenue),
      badge: x.revenue_delta === null ? '' : `${x.revenue_delta >= 0 ? '↗' : '↘'} ${Math.abs(x.revenue_delta)} %`,
      badgeUp: x.revenue_delta >= 0,
      sub: `Kč · ${months(s)} – ${months(e)}`,
    },
    { label: __('Úspěšnost'), value: x.success === null ? __('Bez dat') : `${x.success} %`, raw: x.success, suffix: ' %', sub: __('vyhráno {0} z {1} založených', [x.won, x.created]) },
    { label: __('Průměrná zakázka'), value: thousandsLabel(x.avg_value), ...thousandsParts(x.avg_value), full: money(x.avg_value), sub: __('Kč · vyhrané zakázky') },
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

// průměrná odpověď v hodinách („2,4 h“); pod hodinu v minutách
const avgParts = computed(() => {
  const min = data.value?.response?.avg
  if (min === null || min === undefined) return {}
  return min < 60 ? { value: Math.round(min), suffix: ' min' } : { value: min / 60, format: { maximumFractionDigits: 1 }, suffix: ' h' }
})
</script>
