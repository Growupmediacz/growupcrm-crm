<template>
  <!-- GrowUp: Agent (Firecrawl, Anymailfinder) – obohacení firem z webu, dohledání e-mailů, kontakty, hledání firem.
       Data: growupcrm.research.* (jen správci, jen se zapnutým growupcrm_agency). -->
  <LayoutHeader>
    <template #left-header>
      <!-- design 3. kolo (12): ikona agenta, nadpis a podtitulek -->
      <div class="flex min-w-0 items-center gap-4">
        <span class="hidden size-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-600)_80%,white),var(--accent-600))] text-white shadow-[0_8px_20px_-8px_rgba(91,91,246,.6)] md:flex"><GlIcon name="sparkles" :size="26" /></span>
        <div class="min-w-0">
          <span class="gl-page-title text-lg-medium text-ink-gray-9">{{ __('Agent') }}</span>
          <div class="hidden truncate text-[15px] text-ink-gray-5 md:block">{{ __('Obohacuje firmy z webu, hledá rozhodující osoby a nové firmy.') }}</div>
        </div>
      </div>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="overview.error && isForbidden(overview.error)" :message="overview.error.messages?.[0]" />
  <div v-else-if="overview.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Agenta se nepodařilo načíst')" :text="overview.error.messages?.[0]" @retry="overview.reload()" /></div>
  <div v-else-if="!ov" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <div v-if="!ov.configured" class="gl-card !rounded-[18px] px-5 py-3.5 text-[14px] text-ink-gray-7">
      <b class="text-ink-gray-9">{{ __('Firecrawl zatím není nastavený.') }}</b> {{ __('Chybí API klíč, obraťte se na správce.') }}
    </div>

    <!-- design 3. kolo (12): obohacené firmy, návrhy kontaktů, dohledané e-maily, kredity -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
      <div v-for="k in kpis" :key="k.label" class="gl-card flex min-w-0 items-start gap-4 p-4 md:p-5">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-[14px]" :class="k.tone"><GlIcon :name="k.icon" :size="22" /></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="truncate text-[17px] font-semibold text-ink-gray-9">{{ k.label }}</div>
          <div class="num truncate text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[40px]">{{ k.value }}<span v-if="k.of" class="text-[22px] font-medium text-ink-gray-5"> / {{ k.of }}</span></div>
          <div v-if="k.bar !== undefined" class="h-2 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><div class="h-full rounded-full bg-[var(--accent-600)]" :style="{ width: `${Math.min(100, k.bar)}%` }" /></div>
          <div class="truncate text-[14px] text-ink-gray-5">{{ k.sub }}</div>
        </div>
      </div>
    </div>

    <!-- tři akce; nastavení každé akce je v okně -->
    <div class="grid gap-3 lg:grid-cols-3 lg:gap-4">
      <div v-for="a in actions" :key="a.key" class="gl-card flex items-start gap-4 p-5">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-[14px]" :class="a.tone"><GlIcon :name="a.icon" :size="22" /></span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ a.title }}</div>
          <div class="text-[15px] text-ink-gray-6">{{ a.text }}</div>
          <button class="mt-3 inline-flex h-11 w-fit items-center rounded-full border border-[color-mix(in_srgb,var(--accent-600)_40%,transparent)] px-5 text-[15px] font-medium text-[var(--accent-700)] hover:bg-white disabled:opacity-50" :disabled="a.disabled" @click="dialog = a.key">{{ a.button }}</button>
        </div>
      </div>
    </div>

    <!-- Návrhy kontaktů ke schválení -->
    <div class="gl-card flex flex-col p-5 md:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-[26px] font-bold tracking-tight text-ink-gray-9">{{ __('Návrhy kontaktů ke schválení') }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <div class="gl-seg inline-flex">
              <button class="gl-seg-btn !px-5" :class="sgPriority === 'Vysoká' && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="sgPriority = 'Vysoká'">{{ __('Rozhodující') }}<span v-if="sg?.counts?.['Vysoká']" class="num ml-1 opacity-75">{{ sg.counts['Vysoká'] }}</span></button>
              <button class="gl-seg-btn !px-5" :class="sgPriority === '' && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="sgPriority = ''">{{ __('Vše') }}<span v-if="pendingTotal" class="num ml-1 opacity-75">{{ pendingTotal }}</span></button>
            </div>
            <label class="flex items-center gap-2 text-[14px] text-ink-gray-7"><input v-model="sgEmail" type="checkbox" class="rounded" />{{ __('jen s e-mailem') }}</label>
          </div>
        </div>
        <div v-if="sg?.rows?.length" class="flex items-center gap-2">
          <Button variant="solid" iconLeft="check" :label="selected.length ? __('Přijmout vybrané ({0})', [selected.length]) : __('Přijmout vše')" :loading="busy" @click="decideBulk('accept')" />
          <Button iconLeft="x" theme="red" :label="selected.length ? __('Zamítnout vybrané') : __('Zamítnout vše')" :loading="busy" @click="decideBulk('reject')" />
        </div>
      </div>
      <GlEmptyState v-if="sg && !sg.rows.length" class="mt-4" icon="users" :title="sgEmail && sg.without_email ? __('Všechny návrhy s e-mailem jsou vyřízené') : __('Žádné návrhy')"
        :text="sgEmail && sg.without_email ? __('Zbývá {0} lidí bez e-mailu. E-maily jim dohledá Anymailfinder (Dohledat e-maily výše); jako kontakty je přidáte po vypnutí filtru „jen s e-mailem“.', [sg.without_email]) : __('Návrhy vznikají z obohacení firem a z ARES.')" />
      <div v-else-if="sg" class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[860px] text-left text-[15px]">
          <thead class="border-b border-[var(--line)] text-[14px] text-ink-gray-5">
            <tr>
              <th class="w-8 py-2"><input type="checkbox" class="rounded" :checked="selected.length && selected.length === sg.rows.length" :aria-label="__('Vybrat vše')" @change="(e) => (selected = e.target.checked ? sg.rows.map((r) => r.name) : [])" /></th>
              <th class="py-2 font-medium">{{ __('Osoba') }}</th>
              <th class="py-2 font-medium">{{ __('Firma') }}</th>
              <th class="py-2 font-medium">{{ __('Role') }}</th>
              <th class="py-2 font-medium">{{ __('E-mail') }}</th>
              <th class="py-2 font-medium">{{ __('Zdroj') }}</th>
              <th class="py-2 text-right font-medium">{{ __('Akce') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sg.rows" :key="r.name" class="border-b border-[var(--line)] last:border-b-0">
              <td class="py-3"><input v-model="selected" type="checkbox" :value="r.name" class="rounded" /></td>
              <td class="py-3">
                <span class="flex items-center gap-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[13px] font-semibold text-[var(--accent-700)]">{{ initials(r.full_name) }}</span>
                  <span class="truncate text-ink-gray-9">{{ r.full_name }}</span>
                </span>
              </td>
              <td class="max-w-[220px] truncate py-3"><router-link :to="{ name: 'Organization', params: { organizationId: r.organization } }" class="text-ink-gray-8 hover:underline">{{ r.organization }}</router-link></td>
              <td class="max-w-[160px] truncate py-3 text-ink-gray-7">{{ r.role || '—' }}</td>
              <td class="py-3">
                <span v-if="r.email" class="flex items-center gap-2">
                  <span class="truncate text-ink-gray-8">{{ r.email }}</span>
                  <span v-if="r.email_verified" class="flex shrink-0 items-center gap-1 rounded-full bg-[rgba(34,179,94,.12)] px-2.5 py-0.5 text-[12.5px] font-medium text-[#178a4a]"><GlIcon name="check" :size="13" />{{ __('Ověřeno') }}</span>
                </span>
                <span v-else class="text-ink-gray-5">—</span>
                <span v-if="r.action === 'Doplnit kontakt'" class="mt-1 block text-[12px] font-medium text-[#178a4a]">{{ __('doplní e-mail ke kontaktu') }}</span>
              </td>
              <td class="py-3">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-[rgba(110,120,200,.1)] px-2.5 py-1 text-[13px] text-ink-gray-7"><GlIcon :name="SOURCE_ICON[r.source] || 'doc'" :size="14" />{{ r.source || __('Web') }}</span>
              </td>
              <td class="py-3">
                <span class="flex justify-end gap-2">
                  <button class="flex size-9 items-center justify-center rounded-full bg-[rgba(34,179,94,.12)] text-[#178a4a] hover:bg-[rgba(34,179,94,.2)]" :aria-label="__('Přijmout')" :title="__('Přijmout')" @click="decideOne('accept', r.name)"><GlIcon name="check" :size="17" /></button>
                  <button class="flex size-9 items-center justify-center rounded-full bg-[rgba(110,120,200,.1)] text-ink-gray-6 hover:bg-[rgba(229,72,77,.12)] hover:text-[#c8321f]" :aria-label="__('Zamítnout')" :title="__('Zamítnout')" @click="decideOne('reject', r.name)"><GlIcon name="x" :size="16" /></button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="sg.rows.length < sg.total" class="mt-3 flex items-center justify-between text-[13px] text-ink-gray-5">
          {{ __('{0} z {1}', [sg.rows.length, sg.total]) }}
          <Button :label="__('Načíst další')" @click="pageLength += 50" />
        </div>
      </div>
    </div>

    <!-- okna akcí -->
    <Dialog :open="dialog === 'enrich'" :options="{ title: __('Obohatit firmy z webu'), size: '3xl' }" @update:open="(v) => !v && (dialog = '')">
      <template #body-content>
        <div class="flex flex-col gap-4">
          <p class="text-[14px] text-ink-gray-6">{{ __('Agent projde web firmy (úvod, kontakt, o nás) a doplní, čím se zabývá, služby, působnost, marketing a návrh úvodní věty do e-mailu. Nalezené osoby připraví pro dohledání kontaktů.') }}</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormControl type="select" :label="__('Obor')" v-model="filters.industry" :options="opt(industries.data)" />
            <FormControl type="select" :label="__('Kraj')" v-model="filters.territory" :options="opt(territories.data)" />
            <FormControl type="select" :label="__('Kontaktní e-mail')" v-model="filters.contact_coverage" :options="opt(['Konkrétní osoba', 'Jen obecný e-mail', 'Bez e-mailu'])" />
            <FormControl type="select" :label="__('Stav')" v-model="filters.relationship" :options="opt(['Prospekt', 'Klient', 'Bývalý klient'])" />
          </div>
          <label class="flex items-center gap-2 text-[14px] text-ink-gray-7"><input v-model="filters.include_done" type="checkbox" class="rounded" />{{ __('Znovu i už obohacené firmy') }}</label>
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[rgba(110,120,200,.07)] px-4 py-3">
            <div class="text-[14px] text-ink-gray-8">
              <template v-if="est.data">
                <b>{{ est.data.count }}</b> {{ __('firem') }} · ~<b>{{ est.data.credits }}</b> {{ __('kreditů') }}
                <span class="text-ink-gray-5">· {{ __('zbývá {0} kreditů', [est.data.remaining]) }}</span>
                <span v-if="est.data.total > est.data.count" class="text-ink-gray-5">· {{ __('najednou nejvýš {0}', [est.data.count]) }}</span>
              </template>
              <span v-else class="text-ink-gray-5">{{ __('Počítám…') }}</span>
            </div>
            <Button variant="solid" :label="__('Spustit obohacení')" :loading="starting" :disabled="!ov.configured || !est.data?.count" @click="start().then(() => (dialog = ''))" />
          </div>
        </div>
      </template>
    </Dialog>
    <Dialog :open="dialog === 'discover'" :options="{ title: __('Najít nové firmy'), size: '4xl' }" @update:open="(v) => !v && (dialog = '')">
      <template #body-content><GlDiscovery class="!bg-transparent !p-0 !shadow-none" /></template>
    </Dialog>
    <Dialog :open="dialog === 'emails'" :options="{ title: __('Dohledat e-maily'), size: '4xl' }" @update:open="(v) => !v && (dialog = '')">
      <template #body-content><GlEmailFinder class="!bg-transparent !p-0 !shadow-none" :industries="industries.data || []" :territories="territories.data || []" @done="(loadSuggestions(), finder.reload())" /></template>
    </Dialog>

    <!-- Etapa 3: naše firma -->
    <GlOwnCompany />

    <!-- Průběh -->
    <div class="gl-card flex flex-col p-5">
      <h3 class="mb-3 text-[18px] font-bold text-ink-gray-9">{{ __('Poslední úlohy') }}</h3>
      <GlEmptyState v-if="!ov.runs.length" icon="sparkles" :title="__('Agent zatím nic nedělal')" :text="__('Vyberte firmy a spusťte obohacení.')" />
      <div v-for="r in ov.runs" :key="r.name" class="flex items-center gap-3 border-t border-[rgba(110,120,200,.12)] py-2.5 first:border-0">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: STATUS_COLOR[r.status] }" />
        <router-link v-if="r.organization" :to="{ name: 'Organization', params: { organizationId: r.organization } }" class="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-gray-9 hover:underline">{{ r.organization }}</router-link>
        <span v-else class="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-gray-9">{{ r.kind === 'Hledání firem' ? __('Hledání nových firem') : __('GrowUpMedia (náš web)') }}</span>
        <span class="hidden text-[13px] text-ink-gray-5 sm:inline">{{ r.kind }}</span>
        <span class="text-[13px] text-ink-gray-7" :title="r.error">{{ r.status }}<template v-if="r.error"> · {{ r.error.slice(0, 60) }}</template></span>
        <span class="w-16 text-right text-[13px] text-ink-gray-5">{{ r.credits ? `${r.credits} kr.` : '' }}</span>
      </div>
    </div>

    <!-- Další etapy -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <router-link :to="{ name: 'Outreach', params: { tab: 'campaigns' } }" class="gl-card flex flex-col gap-1 p-4 hover:bg-white/60">
        <div class="flex items-center gap-2 text-[15px] font-bold text-ink-gray-9"><GlIcon name="cal" :size="18" />{{ __('Automatické kampaně') }}</div>
        <div class="text-[13px] text-ink-gray-6">{{ __('V Outreach → kampaň → Agent kampaně: texty, schválení, plán v kalendáři, odesílání z Gmailu.') }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlOwnCompany from '@/components/Agent/GlOwnCompany.vue'
import GlDiscovery from '@/components/Agent/GlDiscovery.vue'
import GlEmailFinder from '@/components/Agent/GlEmailFinder.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isForbidden } from '@/utils/glErrors'
import { saveFailed } from '@/composables/glToast'
import { Button, Dialog, FormControl, call, createListResource, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Agent') }))

const STATUS_COLOR = { 'Čeká': '#a3a8c3', 'Probíhá': 'var(--accent-600)', 'Hotovo': '#22b35e', 'Chyba': '#d0362a', 'Přeskočeno': '#d6a01d' }

const overview = createResource({ url: 'growupcrm.research.get_overview', auto: true })
const ov = computed(() => overview.data)
const filters = reactive({ industry: '', territory: '', contact_coverage: '', relationship: '', include_done: false })
const est = createResource({ url: 'growupcrm.research.estimate' })
const industries = createListResource({ doctype: 'CRM Industry', fields: ['name'], pageLength: 100, auto: true, transform: (d) => d.map((x) => x.name) })
const territories = createListResource({ doctype: 'CRM Territory', fields: ['name'], pageLength: 100, auto: true, transform: (d) => d.map((x) => x.name) })
const opt = (list) => [{ label: __('Vše'), value: '' }, ...(list || []).map((v) => ({ label: v, value: v }))]
const starting = ref(false)

// návrhy kontaktů (etapa 2)
const PRIORITIES = [{ label: __('Vše'), value: '' }, { label: __('Vysoká'), value: 'Vysoká' }, { label: __('Střední'), value: 'Střední' }, { label: __('Nízká'), value: 'Nízká' }]
const PRIORITY_COLOR = { 'Vysoká': 'var(--accent-600)', 'Střední': '#0ea5e9', 'Nízká': '#a3a8c3' }
const sgPriority = ref('Vysoká')  // Rozhodující = vysoká priorita
const sgEmail = ref(true)
const pageLength = ref(50)
const selected = ref([])
const busy = ref(false)
const suggestions = createResource({ url: 'growupcrm.prospects.get_suggestions' })
const sg = computed(() => suggestions.data)
function loadSuggestions() {
  suggestions.submit({ priority: sgPriority.value || null, with_email: sgEmail.value ? 1 : 0, page_length: pageLength.value })
}
watch([sgPriority, sgEmail, pageLength], () => { selected.value = []; loadSuggestions() }, { immediate: true })

async function decide(kind) {
  busy.value = true
  try {
    const res = await call(`growupcrm.prospects.${kind}`, { names: JSON.stringify(selected.value) })
    if (kind === 'accept') toast.success(__('Přijato {0} kontaktů', [res.accepted]) + (res.duplicate ? ` · ${__('{0} už v CRM bylo', [res.duplicate])}` : ''))
    selected.value = []
    loadSuggestions()
  } catch (e) {
    saveFailed(e, () => decide(kind))
  } finally {
    busy.value = false
  }
}

async function acceptHigh() {
  busy.value = true
  try {
    const res = await call('growupcrm.prospects.accept_high')
    toast.success(__('Přijato {0} kontaktů s vysokou prioritou', [res.accepted]))
    loadSuggestions()
  } catch (e) {
    saveFailed(e, acceptHigh)
  } finally {
    busy.value = false
  }
}

watch(filters, () => est.submit({ filters: JSON.stringify({ ...filters, include_done: filters.include_done ? 1 : 0 }) }), { immediate: true, deep: true })

// dokud agent pracuje, obnovujeme přehled
const timer = setInterval(() => ov.value?.queued && overview.reload(), 8000)
onBeforeUnmount(() => clearInterval(timer))

async function start() {
  starting.value = true
  try {
    const res = await call('growupcrm.research.enrich', { filters: JSON.stringify({ ...filters, include_done: filters.include_done ? 1 : 0 }) })
    toast.success(__('Agent zpracuje {0} firem', [res.queued]))
    overview.reload()
    est.reload()
  } catch (e) {
    saveFailed(e, start, __('Spuštění se nepovedlo'))
  } finally {
    starting.value = false
  }
}

// design 3. kolo (12): dlaždice, akční karty a schvalování po řádcích
const dialog = ref('')
const finder = createResource({ url: 'growupcrm.email_finder.get_overview', auto: true })
const pendingTotal = computed(() => Object.values(sg.value?.counts || {}).reduce((a, b) => a + b, 0))
const nf = (n) => new Intl.NumberFormat('cs-CZ').format(n || 0)
const kpis = computed(() => {
  const o = ov.value || {}
  const f = finder.data || {}
  return [
    { label: __('Obohacené firmy'), icon: 'building', tone: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)]', value: nf(o.enriched), of: nf(o.with_web), bar: o.with_web ? (o.enriched * 100) / o.with_web : 0, sub: o.with_web ? `${Math.round((o.enriched * 100) / o.with_web)} %` : __('zatím žádná firma s webem') },
    { label: __('Návrhy kontaktů'), icon: 'users', tone: 'bg-[rgba(139,92,246,.12)] text-[#7c3aed]', value: nf(pendingTotal.value), sub: __('čeká na schválení') },
    { label: __('Dohledané e-maily'), icon: 'mail', tone: 'bg-[rgba(59,110,246,.12)] text-[#2a5bd7]', value: nf(f.found), sub: f.searched ? __('z {0} firem', [nf(f.searched)]) : __('zatím nic nehledáno') },
    { label: __('Kredity tento měsíc'), icon: 'server', tone: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)]', value: nf(o.credits_used), of: nf(o.credits_cap), bar: o.credits_cap ? (o.credits_used * 100) / o.credits_cap : 0, sub: o.credits_cap ? `${Math.round((o.credits_used * 100) / o.credits_cap)} %${o.queued ? ' · ' + __('ve frontě {0}', [o.queued]) : ''}` : '' },
  ]
})
const actions = computed(() => [
  { key: 'enrich', icon: 'building', tone: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)]', title: __('Obohatit firmy'), text: __('Web, obor, velikost a popis z webu firmy.'), button: est.data?.count ? __('Spustit pro {0} firem', [est.data.count]) : __('Vybrat firmy'), disabled: !ov.value?.configured },
  { key: 'discover', icon: 'search', tone: 'bg-[rgba(59,110,246,.12)] text-[#2a5bd7]', title: __('Najít nové firmy'), text: __('Podle oboru a kraje, jen firmy s IČO z ARES.'), button: __('Nové hledání') },
  { key: 'emails', icon: 'mail', tone: 'bg-[rgba(34,179,94,.12)] text-[#178a4a]', title: __('Dohledat e-maily'), text: __('Ověřené e-maily jednatelů a rozhodujících osob.'), button: finder.data?.account_credits !== null && finder.data?.account_credits !== undefined ? __('Dohledat (zbývá {0} kreditů)', [nf(finder.data.account_credits)]) : __('Dohledat'), disabled: finder.data && !finder.data.configured },
])
const SOURCE_ICON = { ARES: 'globe', Web: 'doc', Anymailfinder: 'mail' }
const initials = (s) => (s || '?').replace(/^(Ing|Mgr|MUDr|MDDr|JUDr|PhDr|RNDr|Bc|PharmDr|MgA)\.\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
async function decideOne(kind, name) {
  selected.value = [name]
  await decide(kind)
}
async function decideBulk(kind) {
  if (!selected.value.length) {
    if (kind === 'reject' && !window.confirm(__('Zamítnout všech {0} zobrazených návrhů?', [sg.value.rows.length]))) return
    selected.value = sg.value.rows.map((r) => r.name)
  }
  await decide(kind)
}
</script>
