<template>
  <!-- GrowUp: modul Plány (design „Plány“). Data: growupcrm.goals.get_plan -->
  <LayoutHeader>
    <template #left-header>
      <span class="gl-page-title text-lg-medium text-ink-gray-9">{{ __('Plány') }}</span>
    </template>
    <template #right-header>
      <div v-if="!isMobileView" class="gl-seg">
        <button v-for="o in plan.data?.periods || []" :key="o.value" class="gl-seg-btn !px-5" :class="period === o.value && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="period = o.value">
          {{ o.label }}
        </button>
      </div>
      <Button v-if="plan.data?.can_edit && isMobileView" icon="lucide-pencil-line" :aria-label="__('Upravit cíle')" @click="showTargets = true" />
      <Button v-else-if="plan.data?.can_edit" iconLeft="lucide-pencil-line" :label="__('Upravit cíle')" class="!border !border-[color-mix(in_srgb,var(--accent-600)_45%,transparent)] !text-[var(--accent-700)]" @click="showTargets = true" />
    </template>
  </LayoutHeader>

  <GlForbidden v-if="plan.error && isForbidden(plan.error)" :message="plan.error.messages?.[0]" />
  <div v-else-if="plan.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Plány se nepodařilo načíst')" :text="plan.error.messages?.[0]" @retry="plan.reload()" /></div>
  <div v-else-if="!plan.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
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
        <!-- design 3. kolo (19): název vlevo, „Zbývá X dní“ jako pilulka s hodinami vpravo -->
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-[24px] font-bold tracking-tight text-ink-gray-9">{{ __('Tým') }} · {{ p.label }}</h2>
          <span class="flex shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent-600)_9%,transparent)] px-3 py-1 text-[14px] font-medium text-[var(--accent-700)]">
            <GlIcon name="clock" :size="15" />{{ p.days_left !== null ? daysLeft(p.days_left) : periodRange }}
          </span>
        </div>
        <div class="mt-5 flex flex-col items-center gap-6 sm:flex-row">
          <div class="relative size-[190px] shrink-0">
          <svg viewBox="0 0 180 180" class="size-full" role="img" :aria-label="__('Plnění cílů týmu')">
            <g v-for="(r, i) in rings" :key="r.key" transform="rotate(-90 90 90)">
              <circle cx="90" cy="90" :r="r.radius" fill="none" style="stroke: color-mix(in srgb, var(--c-tint) 14%, transparent)" stroke-width="14" />
              <circle
                v-if="r.length > 0"
                cx="90" cy="90" :r="r.radius" fill="none" :style="{ stroke: r.color }" stroke-width="14" stroke-linecap="round"
                :stroke-dasharray="`${r.length} ${r.circumference}`" class="transition-all duration-700"
              >
                <title>{{ r.label }}: {{ r.actualLabel }} / {{ r.targetLabel }}</title>
              </circle>
            </g>
          </svg>
          <span v-if="overall !== null" class="num absolute inset-0 flex items-center justify-center text-[20px] font-bold text-ink-gray-9">{{ overall }} %</span>
          </div>
          <div class="flex w-full flex-col">
            <div class="grid grid-cols-[1fr_auto_56px] gap-3 pb-2 text-[13px] text-ink-gray-5">
              <span />
              <span>{{ __('Aktuálně / Cíl') }}</span>
              <span class="text-right">{{ __('Plnění') }}</span>
            </div>
            <div v-for="r in rings" :key="r.key" class="grid grid-cols-[1fr_auto_56px] items-center gap-3 border-t border-[var(--line)] py-3 text-[17px]">
              <span class="flex items-center gap-2.5 text-ink-gray-9"><span class="size-3.5 shrink-0 rounded-full" :style="{ background: r.color }" />{{ r.label }}</span>
              <span class="num text-ink-gray-9">{{ r.actualLabel }} <span class="text-ink-gray-5">/ {{ r.targetLabel }}</span></span>
              <span class="num text-right font-semibold text-ink-gray-9">{{ r.percent === null ? '—' : `${r.percent} %` }}</span>
            </div>
            <div v-if="!hasTargets" class="text-[13px] text-ink-gray-5">{{ __('Cíle zatím nejsou nastavené.') }}</div>
          </div>
        </div>
      </div>

      <!-- obchodníci -->
      <!-- mobil: obchodníci jako karty -->
      <template v-if="isMobileView">
        <div class="-mb-2 px-1 text-[13px] font-semibold text-[var(--text-3,var(--text-3))]">{{ __('Obchodníci') }}</div>
        <div class="gl-card !rounded-[22px] px-4">
          <div v-for="(r, i) in p.people" :key="r.user" class="flex items-center gap-3 py-3" :class="i && 'border-t border-[var(--outline-gray-1)]'">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--c-blue-50)] text-[13px] font-bold text-[var(--c-blue-600)]">{{ initials(r.full_name) }}</span>
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
        <h2 class="mb-3 text-[24px] font-bold tracking-tight text-ink-gray-9">{{ __('Podle obchodníka') }}</h2>
        <table class="w-full min-w-[520px] text-[16px]">
          <thead class="border-b border-[var(--line)] text-left text-[14px] font-medium text-ink-gray-5">
            <tr>
              <th class="py-2">{{ __('Obchodník') }}</th>
              <th class="py-2">{{ __('Zakázky') }}</th>
              <th class="py-2">{{ __('Schůzky') }}</th>
              <th class="py-2">{{ __('Obrat') }}</th>
              <th class="py-2">{{ __('Plnění') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in p.people" :key="r.user" class="border-b border-[var(--line)] last:border-b-0">
              <td class="py-4">
                <span class="flex items-center gap-3">
                  <GlUserAvatar :user="r.user" class="size-11 bg-[var(--c-blue-50)] text-[13px] font-bold text-[var(--c-blue-600)]" />
                  <span class="text-ink-gray-9">{{ r.full_name }}</span>
                </span>
              </td>
              <td class="num py-4">{{ r.actual.won }}<span v-if="r.target.won" class="text-ink-gray-5"> / {{ r.target.won }}</span></td>
              <td class="num py-4">{{ r.actual.meetings }}<span v-if="r.target.meetings" class="text-ink-gray-5"> / {{ r.target.meetings }}</span></td>
              <td class="num py-4">
                {{ thousands(r.actual.revenue) }}
                <span v-if="r.actual.recurring" class="block text-[13px] text-ink-gray-5">{{ __('z toho pravidelné {0}', [thousands(r.actual.recurring)]) }}</span>
              </td>
              <td class="py-4">
                <span v-if="r.progress !== null" class="flex items-center gap-3">
                  <span class="h-2 w-36 overflow-hidden rounded-full bg-[var(--line)]">
                    <span class="block h-full rounded-full" :class="r.progress < 60 ? 'bg-[var(--c-amber-450)]' : 'bg-[var(--accent-600)]'" :style="{ width: `${Math.min(r.progress, 100)}%` }" />
                  </span>
                  <span class="num text-[15px] text-ink-gray-9">{{ r.progress }} %</span>
                </span>
                <span v-else class="text-[13px] text-ink-gray-5">{{ __('bez cíle') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- zadání 2027 E3: obrat se třemi čísly (obchodník vidí jen nasmlouváno) -->
    <div v-if="revenueCards.length" class="gl-card flex flex-col gap-4 p-5 md:p-6">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Obrat') }} · {{ p.label }}</h2>
        <span v-if="sourceLabel" class="text-[14px] text-ink-gray-5">{{ __('Plnění cíle se počítá z čísla „{0}“.', [sourceLabel]) }}</span>
      </div>
      <div class="grid gap-3" :class="revenueCards.length > 1 ? 'sm:grid-cols-3' : ''">
        <div
          v-for="c in revenueCards"
          :key="c.key"
          class="flex min-w-0 flex-col gap-1 rounded-[18px] border px-4 py-3.5"
          :class="c.counted ? 'border-[var(--accent-600)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white/60'"
        >
          <span class="flex items-center gap-2 text-[14px] font-semibold text-ink-gray-7">
            {{ c.label }}
            <span v-if="c.counted && revenueCards.length > 1" class="rounded-full bg-[color-mix(in_srgb,var(--accent-600)_14%,transparent)] px-2 py-0.5 text-[13px] font-semibold text-[var(--accent-700)]">{{ __('počítá se') }}</span>
          </span>
          <span class="truncate text-[30px] font-medium leading-tight tracking-tight tabular-nums text-ink-gray-9" :title="money(c.value)">{{ money(c.value) }}</span>
          <span v-if="c.recurring" class="text-[13px] tabular-nums text-ink-gray-5">{{ __('z toho pravidelné {0}', [money(c.recurring)]) }}</span>
        </div>
      </div>
    </div>

    <!-- kolik firem oslovit (jen vedoucí; obchodník dostane chybu práv a karta se nevykreslí) -->
    <div v-if="vp" class="gl-card flex flex-col gap-4 p-5 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Kolik firem oslovit') }}</h2>
        <span v-if="vp.observed?.small_sample" class="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--stage-nabidka)_16%,transparent)] px-3 py-1 text-[13px] font-semibold text-[var(--warning)]">
          <GlIcon name="alert" :size="14" />{{ __('Málo dat, hrubý odhad') }}
        </span>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="flex flex-col gap-1 rounded-[18px] bg-[var(--fill-tinted)] px-4 py-3.5">
          <span class="text-[14px] text-ink-gray-5">{{ __('Doporučeno týdně') }}</span>
          <span class="text-[30px] font-medium leading-tight tabular-nums text-ink-gray-9">{{ vp.recommended_per_week ?? '—' }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ __('firem k oslovení') }}</span>
        </div>
        <div class="flex flex-col gap-1 rounded-[18px] bg-[var(--fill-tinted)] px-4 py-3.5">
          <span class="text-[14px] text-ink-gray-5">{{ __('Webů ještě potřeba') }}</span>
          <span class="text-[30px] font-medium leading-tight tabular-nums text-ink-gray-9">{{ czNumber(vp.webs_needed ?? 0) }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ __('do konce roku {0}', [vp.year]) }}</span>
        </div>
        <div class="flex flex-col gap-1 rounded-[18px] bg-[var(--fill-tinted)] px-4 py-3.5">
          <span class="text-[14px] text-ink-gray-5">{{ __('Zbývá týdnů') }}</span>
          <span class="text-[30px] font-medium leading-tight tabular-nums text-ink-gray-9">{{ vp.weeks_left ?? '—' }}</span>
          <span v-if="vp.pool_weeks" class="text-[13px] text-ink-gray-5">{{ __('zásoba firem vystačí na {0} týdnů', [czNumber(vp.pool_weeks)]) }}</span>
        </div>
      </div>
      <div v-if="vp.scenarios?.length" class="flex flex-col">
        <div class="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-1.5 text-[13px] text-ink-gray-5">
          <span>{{ __('Scénář') }}</span><span class="text-right">{{ __('Z oslovení na zakázku') }}</span><span class="w-20 text-right">{{ __('Týdně') }}</span>
        </div>
        <div v-for="sc in vp.scenarios" :key="sc.scenario" class="grid min-h-9 grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-[var(--line)] py-1.5 text-[15px]">
          <span class="min-w-0 break-words text-ink-gray-9">{{ __(sc.scenario) }}</span>
          <span class="text-right tabular-nums text-ink-gray-7">{{ czNumber(sc.contact_to_win) }} %</span>
          <span class="w-20 text-right font-semibold tabular-nums text-ink-gray-9">{{ sc.per_week ?? '—' }}</span>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <!-- design 3. kolo (19): velké číslo, stav „na dobré cestě / pod plánem“ dole -->
      <div class="gl-card flex flex-col gap-2 p-6">
        <div class="flex items-center gap-4">
          <span class="gl3-kpi-icon gl3-tone-green !size-14 !rounded-[16px]"><GlIcon name="arrow" :size="26" /></span>
          <span class="text-[18px] font-semibold text-ink-gray-9">{{ __('Předpoklad do konce období') }}</span>
        </div>
        <div class="num mt-3 text-[56px] font-bold leading-none tracking-tight text-ink-gray-9">
          {{ p.projection ?? 0 }}<span v-if="p.team.target.won" class="text-[32px] text-ink-gray-5"> / {{ p.team.target.won }}</span>
        </div>
        <div class="text-[16px] text-ink-gray-5">{{ p.projection !== null ? __('při současném tempu') : __('období už skončilo nebo ještě nezačalo') }}</div>
        <span v-if="p.projection !== null && p.team.target.won" class="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-semibold" :class="p.on_track ? 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_12%,transparent)] text-[var(--c-green-700)]' : 'bg-[color-mix(in_srgb,var(--stage-nabidka)_16%,transparent)] text-[var(--warning)]'">
          <GlIcon name="arrow" :size="15" />{{ p.on_track ? __('na dobré cestě') : __('pod plánem') }}
        </span>
      </div>
      <div class="gl-card flex flex-col gap-2 p-6">
        <span class="gl3-kpi-icon gl3-tone-indigo !size-14 !rounded-[16px]"><GlIcon name="clock" :size="26" /></span>
        <div class="mt-2 text-[18px] font-semibold text-ink-gray-9">{{ __('Potřebné tempo') }}</div>
        <div v-if="p.pace" class="num text-[56px] font-bold leading-none tracking-tight text-ink-gray-9">{{ czNumber(p.pace) }}</div>
        <div v-else class="mt-2 text-[24px] font-semibold text-[var(--empty-color)]">{{ __('Bez dat') }}</div>
        <div class="text-[16px] text-ink-gray-5">{{ p.pace ? __('zakázky týdně navíc') : __('cíl je splněný nebo nenastavený') }}</div>
      </div>
      <div class="gl-card flex flex-col gap-2 p-6">
        <span class="gl3-kpi-icon gl3-tone-indigo !size-14 !rounded-[16px]"><GlIcon name="star" :size="26" /></span>
        <div class="mt-2 text-[18px] font-semibold text-ink-gray-9">{{ __('Nejlepší zdroj') }}</div>
        <div v-if="p.best_source" class="truncate text-[44px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ __(p.best_source.source) }}</div>
        <div v-else class="mt-2 text-[24px] font-semibold text-[var(--empty-color)]">{{ __('Bez dat') }}</div>
        <div class="text-[16px] text-ink-gray-5">
          {{ p.best_source ? __('{0} z {1} vyhraných zakázek', [p.best_source.count, p.best_source.total]) : __('zatím žádná vyhraná zakázka') }}
        </div>
      </div>
    </div>
  </div>

  <GlTargetsModal v-if="showTargets" v-model="showTargets" :months="monthOptions" :initial="editMonth" @saved="plan.reload()" />
</template>
<script setup>
import { usersStore } from '@/stores/users'
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlUserAvatar from '@/components/GlUserAvatar.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { isForbidden } from '@/utils/glErrors'
import GlForbidden from '@/components/GlForbidden.vue'
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

// zadání 2027 E3: tři čísla obratu (nasmlouváno, vystaveno, zaplaceno); obchodník má issued/paid null, tak ukážeme jen nasmlouváno
const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(n || 0))} Kč`
const revenueCards = computed(() => {
  const r = p.value?.revenue
  if (!r) return []
  const counted = r.source === 'invoices' && r.issued !== null && r.issued !== undefined ? 'issued' : 'contracted'
  const cards = [{ key: 'contracted', label: __('Nasmlouváno'), value: r.contracted, recurring: r.contracted_recurring }]
  if (r.issued !== null && r.issued !== undefined) cards.push({ key: 'issued', label: __('Vystaveno'), value: r.issued, recurring: r.issued_recurring })
  if (r.paid !== null && r.paid !== undefined) cards.push({ key: 'paid', label: __('Zaplaceno'), value: r.paid, recurring: r.paid_recurring })
  return cards.map((c) => ({ ...c, counted: c.key === counted }))
})
const sourceLabel = computed(() => (revenueCards.value.length > 1 ? (revenueCards.value.find((c) => c.counted)?.label || '') : ''))

// kolik firem oslovit: volání smí jen vedoucí, při chybě práv se karta skryje
// zadání 2027 E3: „Kolik firem oslovit“ jen vedoucímu (obsahuje cíl obratu a při zdroji „faktury“ i vystavené částky)
const showVolume = usersStore().isManager()
const volume = createResource({ url: 'growupcrm.goals.volume_plan', auto: showVolume })
const vp = computed(() => (!showVolume || volume.error ? null : volume.data || null))

// barvy řad ověřené validátorem palety (CVD, kontrast); u kruhů je vždy legenda s hodnotami
const SERIES = [
// growup: obrat = vyhrané zakázky + pravidelné tržby z klientů (retainery); pravidelné mají vlastní cíl (Ivan 2026-11-20)
  { key: 'won', label: __('Zakázky'), color: 'var(--accent-600)', radius: 78 },
  { key: 'meetings', label: __('Schůzky'), color: 'var(--c-sky-400)', radius: 63 },
  { key: 'revenue', label: __('Obrat (tis.)'), color: 'var(--stage-kontaktovano)', radius: 48 },
  { key: 'recurring', label: __('Pravidelné (tis.)'), color: 'var(--stage-vyhrano)', radius: 33 },
]
const MONEY = ['revenue', 'recurring']
const rings = computed(() =>
  SERIES.map((s) => {
    const actual = p.value.team.actual[s.key] || 0
    const target = p.value.team.target[s.key] || 0
    const percent = p.value.team.percent[s.key]
    const circumference = 2 * Math.PI * s.radius
    const fmt = (v) => (MONEY.includes(s.key) ? new Intl.NumberFormat('cs-CZ').format(Math.round(v / 1000)) : v)
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
// střed prstenců: průměrné plnění cílů, které jsou nastavené
const overall = computed(() => {
  const vals = rings.value.map((r) => r.percent).filter((v) => v !== null && v !== undefined)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
})
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
