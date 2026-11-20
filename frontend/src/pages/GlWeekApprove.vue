<template>
  <!-- GrowUp (zadání 2027 E3, návrh d): Týden ke schválení – souhrn, firmy s důvodem, e-mail s kontrolami, schválit vše / označené / jeden.
       Pojistka: schvaluje se vždy s otiskem (fingerprint) z posledního načtení; po změně nebo chybě se načte znovu a tlačítka jsou do té doby zamčená. -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-2">
        <router-link :to="{ name: 'Today' }" class="wk-back" :aria-label="__('Zpět na Dnes')"><GlIcon name="left" :size="16" />{{ __('Dnes') }}</router-link>
        <h1 class="truncate text-[20px] font-bold tracking-[-0.02em] text-ink-gray-9 md:text-[28px]">{{ headline }}</h1>
      </div>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="res.error && !d && isForbidden(res.error)" :message="res.error.messages?.[0]" />
  <div v-else class="flex min-w-0 flex-col gap-4 px-3 pb-6 md:px-2">
    <GlErrorBanner v-if="res.error && !d" :title="__('Týden se nepodařilo načíst')" :text="res.error.messages?.[0] || ''" @retry="load" />
    <GlSkeleton v-else-if="!d" variant="cards" :rows="4" cols="grid-cols-2 md:grid-cols-4" />

    <!-- žádný týden / nic ke schválení -->
    <template v-else-if="!d.campaign || !d.rows.length">
      <GlEmptyState icon="check" :title="__('Žádný týden nečeká na schválení')" :text="emptyText">
        <router-link :to="{ name: 'Today' }" class="wk-btn">{{ __('Zpět na Dnes') }}</router-link>
      </GlEmptyState>
      <div v-if="d.weeks?.length > 1" class="flex justify-center"><label class="wk-select-wrap">{{ __('Jiný týden') }}<select class="wk-select" :value="d.campaign || ''" @change="openWeek($event.target.value)"><option v-for="w in d.weeks" :key="w.name" :value="w.name">{{ w.title }}</option></select></label></div>
    </template>

    <template v-else>
      <!-- podtitul + výběr týdne -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p class="min-w-0 flex-1 text-[14px] leading-relaxed text-ink-gray-6">{{ subtitle }}</p>
        <label v-if="d.weeks.length > 1" class="wk-select-wrap">{{ __('Týden') }}
          <select class="wk-select" :value="d.campaign" :disabled="locked" @change="openWeek($event.target.value)"><option v-for="w in d.weeks" :key="w.name" :value="w.name">{{ w.title }}</option></select>
        </label>
      </div>

      <!-- chyba akce / zastaralé zobrazení -->
      <div v-if="actionError || stale" class="wk-alert" role="alert">
        <GlIcon name="alert" :size="20" class="shrink-0 text-[var(--overdue)]" />
        <div class="min-w-0 flex-1">
          <div class="text-[15px] font-bold text-[var(--overdue)]">{{ actionError ? __('Schválení neproběhlo') : __('Zobrazení se aktualizuje') }}</div>
          <div class="text-[13px] text-ink-gray-7">{{ actionError || __('Tlačítka schválení se odemknou po načtení aktuálních textů.') }}</div>
        </div>
        <button type="button" class="wk-btn" :disabled="res.loading" @click="load"><GlIcon name="refresh" :size="15" />{{ __('Načíst znovu') }}</button>
      </div>

      <!-- souhrn -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="wk-sum">
          <span class="wk-sum-l">{{ __('Firem k oslovení') }}</span>
          <b class="wk-sum-n num">{{ d.rows.length }}</b>
          <span class="wk-sum-s">
            <template v-if="d.volume?.recommended_per_week">{{ __('cíl roku žádá ~{0} týdně', [Math.round(d.volume.recommended_per_week)]) }}</template>
            <span v-if="d.volume?.small_sample" class="wk-tag">{{ __('málo dat') }}</span>
          </span>
        </div>
        <div class="wk-sum">
          <span class="wk-sum-l">{{ __('E-maily') }}</span>
          <b class="wk-sum-n num">{{ d.rows.length }}<template v-if="followupTotal"> + {{ followupTotal }}</template></b>
          <span class="wk-sum-s">{{ followupTotal ? __('první e-maily + rozloučení') : __('první e-maily') }}</span>
        </div>
        <div class="wk-sum">
          <span class="wk-sum-l">{{ __('Kontroly') }}</span>
          <b class="wk-sum-n num">{{ d.clean }} <span class="wk-sum-u">{{ __('v pořádku') }}</span></b>
          <span class="wk-sum-s" :class="warnCount && 'wk-warn-t'">{{ warnCount ? __('{0} s upozorněním', [warnCount]) : __('bez upozornění') }}</span>
        </div>
        <div class="wk-sum">
          <span class="wk-sum-l">{{ __('Odeslané a naplánované') }}</span>
          <b class="wk-sum-n num">{{ d.sent }} <span class="wk-sum-u">/ {{ d.scheduled }}</span></b>
          <span class="wk-sum-s">{{ __('odesláno / naplánováno ({0} firem v týdnu)', [d.companies]) }}</span>
        </div>
      </div>

      <!-- co se stane po schválení -->
      <div class="wk-after">
        <p class="text-[14px] leading-relaxed text-ink-gray-7"><b class="font-semibold text-ink-gray-9">{{ __('Co se stane po schválení') }}</b> · {{ afterText }}</p>
        <p v-if="!d.sender_ok" class="wk-sender-warn"><GlIcon name="alert" :size="16" class="shrink-0" />{{ __('Není připojená schránka pro odesílání. Bez ní schválení neprojde, připojte ji v Nastavení.') }}</p>
      </div>

      <!-- seznam + detail -->
      <div class="wk-two" :class="isWide && 'wk-two-wide'">
        <section v-show="!isPhone || !phoneDetail" class="wk-panel" :aria-label="__('Firmy')">
          <div class="wk-list-head">
            <label class="wk-cb" :title="__('Označit všechny zobrazené')"><input type="checkbox" :checked="allChecked" :indeterminate.prop="someChecked && !allChecked" :disabled="locked" :aria-label="__('Označit všechny zobrazené')" @change="toggleAll($event.target.checked)" /></label>
            <b class="min-w-0 flex-1 truncate text-[15px] font-bold text-ink-gray-9">{{ __('Firma a důvod výběru') }}</b>
            <div class="flex shrink-0 gap-1" role="group" :aria-label="__('Filtr')">
              <button type="button" class="wk-filter" :class="filter === 'all' && 'wk-filter-on'" :aria-pressed="filter === 'all'" @click="filter = 'all'">{{ __('Vše') }} {{ d.rows.length }}</button>
              <button type="button" class="wk-filter" :class="filter === 'warn' && 'wk-filter-on'" :aria-pressed="filter === 'warn'" @click="filter = 'warn'">{{ __('Upozornění') }} {{ warnCount }}</button>
            </div>
          </div>
          <ul class="m-0 list-none p-0">
            <li v-for="r in visible" :key="r.name" class="wk-row" :class="{ 'wk-row-sel': cur && cur.name === r.name, 'wk-row-leave': leaving.has(r.name) }">
              <label class="wk-cb"><input type="checkbox" :checked="checked.includes(r.name)" :disabled="locked" :aria-label="__('Označit {0}', [r.organization?.title || r.email])" @change="toggle(r.name)" /></label>
              <button type="button" class="wk-pick" :aria-current="cur && cur.name === r.name ? 'true' : undefined" @click="pick(r.name)">
                <span class="wk-line1"><b class="wk-name">{{ r.organization?.title || r.email }}</b><span class="wk-meta">{{ meta(r) }}</span></span>
                <span class="wk-line2">{{ r.subject }}</span>
                <span v-if="!r.clean" class="wk-chip-warn"><GlIcon name="alert" :size="14" />{{ __('upozornění') }}</span>
              </button>
              <span class="wk-score" :class="scoreClass(r)" :title="__('Skóre {0}', [r.organization?.score ?? '–'])"><b class="num">{{ r.organization?.score ?? '–' }}</b><i :style="{ width: (r.organization?.score || 0) + '%' }" /></span>
            </li>
          </ul>
          <p v-if="!visible.length" class="px-4 py-6 text-center text-[14px] text-ink-gray-6">{{ __('Žádná firma s upozorněním.') }}</p>
        </section>

        <section v-if="cur && (!isPhone || phoneDetail)" ref="detailEl" class="wk-panel wk-detail" :aria-label="__('E-mail')">
          <button v-if="isPhone" type="button" class="wk-back wk-back-block" @click="phoneDetail = false"><GlIcon name="left" :size="16" />{{ __('Seznam firem') }}</button>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 class="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.01em] text-ink-gray-9">{{ cur.organization?.title || cur.email }}</h2>
            <span class="text-[13px] text-ink-gray-6">{{ meta(cur) }}</span>
          </div>
          <p class="mt-1 text-[13px] text-ink-gray-6">{{ __('Komu') }}: {{ cur.email }}<template v-if="cur.organization?.website"> · {{ cur.organization.website }}</template></p>

          <GlWhy class="mt-4" :reasons="cur.organization?.reasons || []" :score="cur.organization?.score ?? null" :default-open="true" :empty="__('Důvod výběru není zapsaný.')" />

          <h3 class="mt-5 text-[13px] font-semibold uppercase tracking-wide text-ink-gray-5">{{ __('Předmět') }}</h3>
          <p class="mt-1 text-[18px] font-bold leading-snug text-ink-gray-9">{{ cur.subject }}</p>
          <div class="wk-mail" lang="cs" v-html="sanitizeHTML(cur.html)" />

          <h3 class="mt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-gray-5">{{ __('Kontroly před odesláním') }}</h3>
          <ul class="mt-2 flex list-none flex-col gap-1.5 p-0">
            <li v-for="c in cur.checks" :key="c.label" class="flex items-start gap-2 text-[14px]" :class="c.ok ? 'text-ink-gray-8' : 'wk-warn-t font-semibold'">
              <GlIcon :name="c.ok ? 'check' : 'alert'" :size="16" class="mt-0.5 shrink-0" :class="c.ok && 'wk-ok-t'" /><span><span class="sr-only">{{ c.ok ? __('V pořádku') : __('Upozornění') }}: </span>{{ c.label }}</span>
            </li>
          </ul>
          <div v-if="extraWarnings(cur).length" class="wk-warnbox" role="note">
            <b class="flex items-center gap-2"><GlIcon name="alert" :size="16" />{{ __('K posouzení') }}</b>
            <ul class="m-0 mt-1 pl-5"><li v-for="(w, i) in extraWarnings(cur)" :key="i">{{ w }}</li></ul>
          </div>
          <p v-if="cur.note" class="mt-3 text-[13px] text-ink-gray-6">{{ cur.note }}</p>

          <details v-if="cur.followups.length" class="wk-fu">
            <summary><GlIcon name="clock" :size="16" />{{ __('Rozloučení za 3 pracovní dny, pokud neodpoví') }}</summary>
            <div v-for="(f, i) in cur.followups" :key="i" class="wk-fu-item">
              <p v-if="f.subject" class="m-0 mb-1 text-[14px] font-semibold text-ink-gray-8">{{ f.subject }}</p>
              <div class="wk-mail" lang="cs" v-html="sanitizeHTML(f.html)" />
            </div>
          </details>

          <div class="wk-actions">
            <button type="button" class="wk-btn wk-btn-primary" :disabled="locked || !!cur.unresolved.length || !d.sender_ok" :title="oneBlock" @click="approveOne(cur)">
              <GlIcon name="check" :size="16" />{{ __('Schválit tento') }}<kbd v-if="!isPhone" class="wk-kbd">⌘↵</kbd>
            </button>
            <button type="button" class="wk-btn wk-btn-danger" :disabled="locked" @click="askExclude([cur.name])">{{ __('Vyřadit firmu') }}</button>
            <router-link class="wk-btn" :to="{ name: 'OutreachReview', params: { name: cur.name } }"><GlIcon name="edit" :size="15" />{{ __('Upravit v Outreach') }}</router-link>
            <span v-if="!isPhone" class="wk-hint"><kbd class="wk-kbd2">J</kbd> <kbd class="wk-kbd2">K</kbd> {{ __('další / předchozí') }} · <kbd class="wk-kbd2">X</kbd> {{ __('označit') }}</span>
          </div>
          <p v-if="oneBlock && !locked" class="mt-2 text-[13px] text-ink-gray-6">{{ oneBlock }}</p>
        </section>
      </div>

      <GlBulkBar v-show="!isPhone || !phoneDetail" :total="d.rows.length" :clean="d.clean" :checked="checked.length" :disabled="locked || !d.sender_ok" @approve-checked="askApprove('checked')" @exclude-checked="askExclude([...checked])" @approve-clean="askApprove('clean')" />
    </template>

    <!-- potvrzení hromadného schválení -->
    <Dialog :open="!!confirm" :options="{ title: __('Schválit e-maily?'), size: 'md' }" @update:open="(v) => !v && !busy && (confirm = null)">
      <template #default>
        <div v-if="confirm" class="flex flex-col gap-3">
          <p class="text-[15px] leading-relaxed text-ink-gray-8">{{ __('Ke schválení: {0} (e-maily). Odesílání začne {1}, nejvýš {2} denně.', [confirm.names ? confirm.names.length : d.rows.length, startLabel, d.daily_limit]) }}</p>
          <p v-if="confirm.left" class="text-[14px] leading-relaxed text-ink-gray-6">{{ __('Na schválení dál počká: {0} (e-maily).', [confirm.left]) }}</p>
          <div class="mt-1 flex flex-wrap justify-end gap-2">
            <button type="button" class="wk-btn" :disabled="busy" @click="confirm = null">{{ __('Zrušit') }}</button>
            <button type="button" class="wk-btn wk-btn-primary" :disabled="busy || locked" @click="runApprove(confirm.names)"><GlIcon name="check" :size="16" />{{ __('Schválit') }}</button>
          </div>
        </div>
      </template>
    </Dialog>

    <!-- vyřazení firem -->
    <Dialog :open="!!excl" :options="{ title: __('Vyřadit z týdne'), size: 'md' }" @update:open="(v) => !v && !busy && (excl = null)">
      <template #default>
        <div v-if="excl" class="flex flex-col gap-3">
          <p class="text-[15px] leading-relaxed text-ink-gray-8">{{ __('Vyřadit z tohoto týdne: {0} (firmy). Nic jim neodejde a rozloučení nevznikne.', [excl.names.length]) }}</p>
          <label class="flex flex-col gap-1 text-[14px] text-ink-gray-7">{{ __('Důvod (nepovinné)') }}
            <textarea v-model="excl.reason" rows="3" maxlength="300" class="wk-textarea" />
          </label>
          <div class="mt-1 flex flex-wrap justify-end gap-2">
            <button type="button" class="wk-btn" :disabled="busy" @click="excl = null">{{ __('Zrušit') }}</button>
            <button type="button" class="wk-btn wk-btn-danger-solid" :disabled="busy" @click="runExclude">{{ __('Vyřadit') }}</button>
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import GlWhy from '@/components/Agent/GlWhy.vue'
import GlBulkBar from '@/components/Queue/GlBulkBar.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isPhone, isWide } from '@/composables/glBreakpoint'
import { sanitizeHTML } from '@/utils'
import { isForbidden } from '@/utils/glErrors'
import { call, createResource, Dialog, toast, usePageMeta } from 'frappe-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

usePageMeta(() => ({ title: __('Týden ke schválení') }))

const props = defineProps({ name: { type: String, default: '' } })
const router = useRouter()

const res = createResource({
  url: 'growupcrm.week_review.get',
  params: props.name ? { campaign: props.name } : {},
  auto: true,
  onSuccess() { stale.value = false },
  onError() { stale.value = true },
})
const d = computed(() => res.data)
const stale = ref(false) // zobrazení nemusí odpovídat serveru: schvalovat nejde, dokud se nenačte znovu
const busy = ref(false)
const actionError = ref('')
const locked = computed(() => busy.value || res.loading || stale.value || !d.value?.fingerprint)

const load = () => res.submit(props.name ? { campaign: props.name } : {}).catch(() => {})
watch(() => props.name, () => { checked.value = []; phoneDetail.value = false; actionError.value = ''; load() })

// výběr, označení, filtr
const selName = ref('')
const checked = ref([])
const filter = ref('all')
const phoneDetail = ref(false)
const confirm = ref(null) // { names: [ID] | null (= vše), left }
const excl = ref(null) // { names, reason }
const leaving = ref(new Set())
const detailEl = ref(null)

const rows = computed(() => d.value?.rows || [])
const visible = computed(() => (filter.value === 'warn' ? rows.value.filter((r) => !r.clean) : rows.value))
const cur = computed(() => visible.value.find((r) => r.name === selName.value) || visible.value[0] || null)
const warnCount = computed(() => rows.value.length - (d.value?.clean || 0))
const followupTotal = computed(() => rows.value.reduce((n, r) => n + (r.followups?.length || 0), 0))
const allChecked = computed(() => visible.value.length > 0 && visible.value.every((r) => checked.value.includes(r.name)))
const someChecked = computed(() => visible.value.some((r) => checked.value.includes(r.name)))

// po načtení: označení jen existujících řádků
watch(rows, (list) => {
  const names = new Set(list.map((r) => r.name))
  checked.value = checked.value.filter((n) => names.has(n))
})
watch(filter, () => (phoneDetail.value = false))
watch(cur, (c) => { if (!c) phoneDetail.value = false })

// formáty (cs-CZ)
const parse = (v) => { const t = new Date(String(v || '').replace(' ', 'T')); return isNaN(t) ? null : t }
const fDay = (v) => { const t = parse(v); return t ? new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' }).format(t) : '' }
const fDT = (v) => {
  const t = parse(v)
  if (!t) return ''
  const hasTime = /[T ]\d\d:\d\d/.test(String(v))
  return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric', ...(hasTime ? { hour: 'numeric', minute: '2-digit' } : {}) }).format(t)
}
const fTime = (v) => { const t = parse(v); return t ? new Intl.DateTimeFormat('cs-CZ', { hour: 'numeric', minute: '2-digit' }).format(t) : '' }

const headline = computed(() => (d.value?.title ? `${d.value.title} ${__('ke schválení')}` : __('Týden ke schválení')))
const startLabel = computed(() => fDT(d.value?.plan?.first) || __('co nejdříve'))
const subtitle = computed(() => {
  const x = d.value
  const parts = []
  if (x.start_date) parts.push(__('začátek {0}', [fDay(x.start_date)]))
  if (x.plan?.first) parts.push(__('odesílání od {0}', [fDT(x.plan.first)]))
  if (x.daily_limit) parts.push(__('nejvýš {0} denně', [x.daily_limit]))
  return parts.join(', ')
})
const afterText = computed(() => {
  const x = d.value
  const range = x.plan?.first ? (x.plan.last && fDay(x.plan.last) !== fDay(x.plan.first) ? __('od {0} do {1}', [fDT(x.plan.first), fDay(x.plan.last) + (fTime(x.plan.last) ? ' ' + fTime(x.plan.last) : '')]) : __('od {0}', [fDT(x.plan.first)])) : ''
  return __('e-maily se rozplánují {0}, nejvýš {1} denně v čase {2}–{3} h. Rozloučení odejde za 3 pracovní dny, jen když firma neodpoví. Odesílá CRM z připojené schránky{4}.', [range, x.daily_limit, x.window?.[0], x.window?.[1], x.sender ? ` (${x.sender})` : ''])
})
const emptyText = computed(() => {
  const x = d.value
  if (x?.campaign && x.auto_send && x.scheduled > 0) {
    return __('Schváleno {0}, naplánované e-maily: {1}.', [fDT(x.approved_at) || '–', x.scheduled])
  }
  return __('Až agent připraví další týden, objeví se tady.')
})
const oneBlock = computed(() => {
  const r = cur.value
  if (!r) return ''
  if (!d.value.sender_ok) return __('Bez připojené schránky se schválení neprojde.')
  if (r.unresolved.length) return __('Nejdřív doplňte: {0}', [r.unresolved.map((v) => '{' + v + '}').join(', ')])
  return ''
})

const meta = (r) => [r.organization?.industry, r.organization?.territory].filter(Boolean).join(' · ')
const scoreClass = (r) => { const s = r.organization?.score; return s == null ? 'wk-s-na' : s >= 70 ? 'wk-s-hi' : s >= 50 ? 'wk-s-mid' : 'wk-s-lo' }
// varování, která nejsou mezi kontrolami (pravidla textu, nevyplněné proměnné)
const extraWarnings = (r) => r.warnings.filter((w) => !r.checks.some((c) => !c.ok && c.label === w))

function pick(name) {
  selName.value = name
  if (isPhone.value) { phoneDetail.value = true; window.scrollTo?.(0, 0) } else if (!isWide.value) nextTick(() => detailEl.value?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }))
}
function toggle(name) {
  checked.value = checked.value.includes(name) ? checked.value.filter((n) => n !== name) : [...checked.value, name]
}
function toggleAll(on) {
  const vis = visible.value.map((r) => r.name)
  checked.value = on ? [...new Set([...checked.value, ...vis])] : checked.value.filter((n) => !vis.includes(n))
}
function openWeek(name) {
  if (name && name !== d.value?.campaign) router.push({ name: 'WeekApprove', params: { name } })
}

// schvalování (vždy jen to, co je zobrazené: otisk z posledního načtení)
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const errText = (e) => e?.messages?.[0] || e?.message || __('Něco se nepovedlo.')

function askApprove(kind) {
  if (locked.value) return
  let names = null
  if (kind === 'checked') names = [...checked.value]
  else if (kind === 'clean') names = d.value.clean === rows.value.length ? null : rows.value.filter((r) => r.clean).map((r) => r.name)
  if (names && !names.length) return
  if (names && names.length === rows.value.length) names = null
  confirm.value = { names, left: names ? rows.value.length - names.length : 0 }
}
async function approveOne(r) {
  if (locked.value || r.unresolved.length || !d.value.sender_ok) return
  await runApprove([r.name])
}
async function runApprove(names) {
  if (locked.value) return
  const x = d.value
  busy.value = true
  actionError.value = ''
  try {
    const args = { campaign: x.campaign, fingerprint: x.fingerprint }
    if (names) args.names = JSON.stringify(names)
    const out = await call('growupcrm.week_review.approve', args)
    const n = out?.approved ?? (names ? names.length : x.rows.length)
    leaving.value = new Set(names || rows.value.map((r) => r.name))
    confirm.value = null
    toast.success(__('Schválené e-maily: {0}, první odejde {1}', [n, fDT(out?.first) || startLabel.value]))
    if (!reduced()) await sleep(160)
    checked.value = checked.value.filter((c) => !(names || []).includes(c))
    stale.value = true
    await load()
  } catch (e) {
    confirm.value = null
    actionError.value = errText(e)
    stale.value = true
  } finally {
    leaving.value = new Set()
    busy.value = false
  }
}

function askExclude(names) {
  if (locked.value || !names.length) return
  excl.value = { names, reason: '' }
}
async function runExclude() {
  if (!excl.value || busy.value) return
  const { names, reason } = excl.value
  busy.value = true
  actionError.value = ''
  stale.value = true // vyřazením se mění otisk: do dalšího načtení nelze schvalovat
  try {
    await call('growupcrm.week_review.exclude', { campaign: d.value.campaign, names: JSON.stringify(names), reason: reason.trim() })
    leaving.value = new Set(names)
    excl.value = null
    toast.success(__('Vyřazené firmy: {0}', [names.length]))
    if (!reduced()) await sleep(160)
    checked.value = checked.value.filter((c) => !names.includes(c))
    await load()
  } catch (e) {
    excl.value = null
    actionError.value = errText(e)
    await load()
  } finally {
    leaving.value = new Set()
    busy.value = false
  }
}

// klávesy: J / K, X, ⌘↵ (ne v polích a při otevřeném dialogu)
function onKey(e) {
  if (confirm.value || excl.value || !d.value?.rows?.length) return
  const t = e.target
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    // na telefonu jen z otevřeného detailu: schválit smí jen e-mail, který je vidět
    if (cur.value && (!isPhone.value || phoneDetail.value)) { e.preventDefault(); approveOne(cur.value) }
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key.toLowerCase()
  const list = visible.value
  const i = list.findIndex((r) => r.name === cur.value?.name)
  if (k === 'j' && list.length) { e.preventDefault(); selName.value = list[Math.min(i + 1, list.length - 1)].name }
  else if (k === 'k' && list.length) { e.preventDefault(); selName.value = list[Math.max(i - 1, 0)].name }
  else if (k === 'x' && cur.value && !locked.value) { e.preventDefault(); toggle(cur.value.name) }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.wk-back { display: inline-flex; align-items: center; gap: 4px; min-height: var(--hit-sm, 36px); padding: 0 12px 0 8px; border-radius: 12px; font-size: 14px; font-weight: 600; color: var(--text-2); text-decoration: none; white-space: nowrap; flex: none; }
.wk-back:hover { background: var(--fill-tinted); color: var(--text-1); }
.wk-back:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.wk-back-block { margin: -4px 0 8px -8px; min-height: 44px; border: 0; background: transparent; cursor: pointer; }

.wk-btn { min-height: var(--hit-sm, 36px); padding: 0 16px; border-radius: 14px; border: 1px solid var(--field-border); background: #fff; font: inherit; font-size: 14px; font-weight: 600; color: var(--text-1); display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; text-decoration: none; transition: transform var(--t-press, 90ms), background-color var(--t-fast, 120ms), border-color var(--t-fast, 120ms); }
.wk-btn:hover:not(:disabled) { border-color: var(--accent-200); }
.wk-btn:active:not(:disabled) { transform: scale(0.97); }
.wk-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.wk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wk-btn-primary { background: var(--accent-600); border-color: transparent; color: #fff; box-shadow: 0 6px 18px color-mix(in srgb, var(--accent-600) 28%, transparent); }
.wk-btn-primary:hover:not(:disabled) { background: var(--accent-700); border-color: transparent; }
.wk-btn-danger { color: var(--overdue); }
.wk-btn-danger-solid { background: var(--overdue); border-color: transparent; color: #fff; }
.wk-kbd { font: 500 12px/1 ui-monospace, Menlo, monospace; padding: 3px 6px; border-radius: 6px; border: 1px solid currentColor; opacity: 0.75; }
.wk-kbd2 { font: 500 12px/1 ui-monospace, Menlo, monospace; padding: 2px 5px; border-radius: 6px; background: var(--fill-tinted); }
.wk-hint { margin-left: auto; font-size: 13px; color: var(--text-2); }

.wk-select-wrap { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }
.wk-select { min-height: var(--hit-sm, 36px); border: 1px solid var(--field-border); border-radius: 12px; background: #fff; padding: 0 12px; font: inherit; font-size: 14px; color: var(--text-1); max-width: 60vw; }
.wk-select:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.wk-alert { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 18px; background: color-mix(in srgb, var(--overdue) 9%, transparent); }

.wk-sum { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 14px 16px; border-radius: 18px; background: #fff; border: 1px solid var(--line); }
.wk-sum-l { font-size: 13px; color: var(--text-2); }
.wk-sum-n { font-size: 24px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.2; color: var(--text-1); }
.wk-sum-u { font-size: 15px; color: var(--text-2); font-weight: 400; }
.wk-sum-s { font-size: 13px; color: var(--text-2); display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.wk-tag { display: inline-flex; align-items: center; min-height: 22px; padding: 0 8px; border-radius: 999px; font-size: 13px; font-weight: 600; background: var(--fill-tinted); color: var(--text-2); }
.wk-warn-t { color: var(--warning); }
.wk-ok-t { color: var(--success); }

.wk-after { padding: 12px 16px; border-radius: 18px; background: var(--accent-50, rgba(91, 91, 246, 0.07)); }
.wk-sender-warn { margin: 8px 0 0; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--warning); }

.wk-two { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
.wk-two-wide { grid-template-columns: minmax(340px, 460px) minmax(0, 1fr); gap: 24px; }
.wk-panel { min-width: 0; background: var(--mat-panel); border: var(--mat-card-border); box-shadow: var(--mat-card-shadow); border-radius: var(--r-panel, 24px); -webkit-backdrop-filter: var(--mat-blur); backdrop-filter: var(--mat-blur); padding: 8px; }
.wk-detail { padding: 20px 20px 24px; }
@media (min-width: 768px) { .wk-detail { padding: 24px 28px; } }
.wk-two-wide .wk-detail { position: sticky; top: 8px; }

.wk-list-head { display: flex; align-items: center; gap: 8px; padding: 4px 8px 4px 0; flex-wrap: wrap; }
.wk-filter { min-height: var(--hit-sm, 36px); padding: 0 12px; border-radius: 999px; border: 0; background: var(--fill-tinted); font: inherit; font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; white-space: nowrap; }
.wk-filter-on { background: var(--accent-soft); color: var(--accent-700); }
.wk-filter:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.wk-cb { width: 44px; min-height: 44px; display: grid; place-items: center; cursor: pointer; flex: none; }
.wk-cb input { width: 22px; height: 22px; margin: 0; cursor: pointer; accent-color: var(--accent-600); }
.wk-cb input:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: 6px; }

.wk-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 52px; align-items: center; gap: 4px 6px; padding: 4px 8px 4px 0; min-height: 64px; border-radius: 16px; transition: background-color var(--t-fast, 120ms), opacity 160ms ease-in, transform 160ms ease-in; }
.wk-row:hover { background: var(--fill-tinted); }
.wk-row-sel { background: var(--accent-soft); }
.wk-row-leave { opacity: 0; transform: translateX(14px); }
.wk-pick { min-width: 0; text-align: left; border: 0; background: transparent; padding: 6px 4px; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; font: inherit; color: var(--text-1); min-height: 44px; }
.wk-pick:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.wk-line1 { display: flex; gap: 8px; align-items: baseline; min-width: 0; }
.wk-name { font-size: 15px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.wk-meta { font-size: 13px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.wk-line2 { font-size: 13px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wk-chip-warn { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; min-height: 24px; padding: 0 8px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--warning); background: color-mix(in srgb, var(--warning) 12%, transparent); }
.wk-score { display: flex; flex-direction: column; align-items: stretch; gap: 3px; font-size: 14px; text-align: right; }
.wk-score b { font-weight: 650; color: var(--text-1); }
.wk-score i { display: block; height: 4px; border-radius: 2px; background: var(--text-3); }
.wk-s-hi i { background: var(--success); }
.wk-s-mid i { background: var(--accent-600); }
.wk-s-lo i { background: var(--warning); }
.wk-s-na i { background: var(--line); }

.wk-mail { margin-top: 8px; max-width: var(--read-w, 720px); font-size: var(--read-size, 16px); line-height: var(--read-lh, 1.6); color: var(--text-1); overflow-wrap: anywhere; }
.wk-mail :deep(p) { margin: 0 0 0.8em; }
.wk-mail :deep(a) { color: var(--accent-700); text-decoration: underline; }
.wk-mail :deep(img) { max-width: 100%; height: auto; }
.wk-warnbox { margin-top: 12px; padding: 10px 14px; border-radius: 14px; font-size: 14px; color: var(--warning); background: color-mix(in srgb, var(--warning) 11%, transparent); }
.wk-fu { margin-top: 16px; border-top: 1px solid var(--line); }
.wk-fu summary { min-height: 44px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-1); }
.wk-fu summary:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: 8px; }
.wk-fu-item { margin: 4px 0 12px; padding-left: 12px; border-left: 3px solid var(--line); color: var(--text-2); }
.wk-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 20px; }
@media (max-width: 767px) {
  .wk-btn { min-height: 44px; }
  .wk-actions .wk-btn { flex: 1 1 100%; }
  .wk-filter { min-height: 44px; }
  .wk-select { min-height: 44px; }
  .wk-sum-n { font-size: 22px; }
}
.wk-textarea { width: 100%; border: 1px solid var(--field-border); border-radius: 14px; padding: 10px 12px; font: inherit; font-size: 15px; color: var(--text-1); resize: vertical; }
.wk-textarea:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (prefers-reduced-motion: reduce) {
  .wk-row, .wk-btn { transition: none !important; }
}
</style>
