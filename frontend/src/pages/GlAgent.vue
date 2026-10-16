<template>
  <!-- GrowUp: Agent (Firecrawl) – obohacení firem z webu. Další etapy: kontakty, kampaně, hledání podobných firem.
       Data: growupcrm.research.* (jen správci, jen se zapnutým growupcrm_agency). -->
  <LayoutHeader>
    <template #left-header>
      <span class="text-lg-medium text-ink-gray-9">{{ __('Agent') }}</span>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="overview.error && isForbidden(overview.error)" :message="overview.error.messages?.[0]" />
  <div v-else-if="overview.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Agenta se nepodařilo načíst')" :text="overview.error.messages?.[0]" @retry="overview.reload()" /></div>
  <div v-else-if="!ov" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <div v-if="!ov.configured" class="gl-card !rounded-[18px] px-5 py-3.5 text-[14px] text-ink-gray-7">
      <b class="text-ink-gray-9">{{ __('Firecrawl zatím není nastavený.') }}</b> {{ __('Chybí API klíč, obraťte se na správce.') }}
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
        <div class="flex items-baseline justify-between text-[14px] text-ink-gray-7">{{ __('Kredity tento měsíc') }}<span class="text-[12px] text-ink-gray-5">{{ __('strop') }} {{ ov.credits_cap }}</span></div>
        <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ ov.credits_used }}<span class="text-[20px] font-medium text-ink-gray-5"> / {{ ov.credits_cap }}</span></div>
        <div class="h-1.5 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><div class="h-full rounded-full bg-[#4F46E5]" :style="{ width: `${Math.min(100, (ov.credits_used * 100) / (ov.credits_cap || 1))}%` }" /></div>
      </div>
      <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
        <div class="text-[14px] text-ink-gray-7">{{ __('Obohacené firmy') }}</div>
        <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ ov.enriched }}<span class="text-[20px] font-medium text-ink-gray-5"> / {{ ov.with_web }}</span></div>
        <div class="text-[13px] text-ink-gray-5">{{ __('firem s webem z {0}', [ov.organizations]) }}</div>
      </div>
      <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
        <div class="text-[14px] text-ink-gray-7">{{ __('Ve frontě') }}</div>
        <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ ov.queued }}</div>
        <div class="text-[13px] text-ink-gray-5">{{ ov.queued ? __('agent pracuje, stránka se obnovuje') : __('nic neběží') }}</div>
      </div>
      <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
        <div class="text-[14px] text-ink-gray-7">{{ __('Cena jedné firmy') }}</div>
        <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9">~{{ ov.credits_per_org }}</div>
        <div class="text-[13px] text-ink-gray-5">{{ __('kreditů (mapa webu + 3 stránky)') }}</div>
      </div>
    </div>

    <!-- Obohacení firem -->
    <div class="gl-card flex flex-col gap-4 p-5">
      <div>
        <h3 class="text-[18px] font-bold text-ink-gray-9">{{ __('Obohacení firem z webu') }}</h3>
        <p class="mt-1 text-[14px] text-ink-gray-6">{{ __('Agent projde web firmy (úvod, kontakt, o nás) a doplní, čím se zabývá, služby, působnost, marketing a návrh úvodní věty do e-mailu. Nalezené osoby připraví pro dohledání kontaktů.') }}</p>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Button variant="solid" :label="__('Spustit obohacení')" :loading="starting" :disabled="!ov.configured || !est.data?.count" @click="start" />
      </div>
    </div>

    <!-- Etapa 2: návrhy kontaktů -->
    <div class="gl-card flex flex-col gap-3 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-[18px] font-bold text-ink-gray-9">{{ __('Návrhy kontaktů') }}</h3>
          <p class="mt-1 text-[14px] text-ink-gray-6">{{ __('Lidé nalezení na webech firem. Po přijetí se z nich stanou kontakty u firmy, u jednatelů z ARES se jen doplní e-mail.') }}</p>
        </div>
        <Button v-if="sg?.counts?.['Vysoká']" variant="solid" :label="__('Přijmout všechny s vysokou prioritou')" :loading="busy" @click="acceptHigh" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="gl-seg">
          <button v-for="o in PRIORITIES" :key="o.value" class="gl-seg-btn" :class="sgPriority === o.value && 'gl-seg-on'" @click="sgPriority = o.value">
            {{ o.label }}<span v-if="o.value && sg?.counts?.[o.value]" class="ml-1 text-ink-gray-5">{{ sg.counts[o.value] }}</span>
          </button>
        </div>
        <label class="flex items-center gap-2 text-[14px] text-ink-gray-7"><input v-model="sgEmail" type="checkbox" class="rounded" />{{ __('jen s e-mailem') }}</label>
        <span class="ml-auto text-[13px] text-ink-gray-5">{{ __('přijato celkem {0}', [sg?.accepted || 0]) }}</span>
      </div>
      <GlEmptyState v-if="sg && !sg.rows.length" icon="users" :title="__('Žádné návrhy')" :text="__('Návrhy vznikají z obohacení firem.')" />
      <div v-for="r in sg?.rows || []" :key="r.name" class="flex items-center gap-3 border-t border-[rgba(110,120,200,.12)] py-2 first:border-0">
        <input v-model="selected" type="checkbox" :value="r.name" class="rounded" />
        <span class="size-2 shrink-0 rounded-full" :style="{ background: PRIORITY_COLOR[r.priority] }" :title="r.priority" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-[14px] text-ink-gray-9"><b>{{ r.full_name }}</b><span v-if="r.role" class="text-ink-gray-6"> · {{ r.role }}</span></div>
          <div class="truncate text-[12px] text-ink-gray-5">
            <router-link :to="{ name: 'Organization', params: { organizationId: r.organization } }" class="hover:underline">{{ r.organization }}</router-link>
            <template v-if="r.email"> · {{ r.email }}</template><template v-if="r.phone"> · {{ r.phone }}</template>
          </div>
        </div>
        <span v-if="r.action === 'Doplnit kontakt'" class="rounded-full bg-[rgba(34,179,94,.12)] px-2 py-0.5 text-[11px] font-bold text-[#178a4a]">{{ __('doplní e-mail') }}</span>
      </div>
      <div v-if="sg?.rows?.length" class="flex flex-wrap items-center gap-2 border-t border-[rgba(110,120,200,.12)] pt-3">
        <Button :label="__('Vybrat vše')" @click="selected = sg.rows.map((r) => r.name)" />
        <Button variant="solid" :label="__('Přijmout vybrané ({0})', [selected.length])" :disabled="!selected.length" :loading="busy" @click="decide('accept')" />
        <Button :label="__('Zamítnout vybrané')" :disabled="!selected.length" :loading="busy" @click="decide('reject')" />
        <span class="ml-auto text-[13px] text-ink-gray-5">{{ __('{0} z {1}', [sg.rows.length, sg.total]) }}</span>
        <Button v-if="sg.rows.length < sg.total" :label="__('Načíst další')" @click="pageLength += 50" />
      </div>
    </div>

    <!-- Průběh -->
    <div class="gl-card flex flex-col p-5">
      <h3 class="mb-3 text-[18px] font-bold text-ink-gray-9">{{ __('Poslední úlohy') }}</h3>
      <GlEmptyState v-if="!ov.runs.length" icon="sparkles" :title="__('Agent zatím nic nedělal')" :text="__('Vyberte firmy a spusťte obohacení.')" />
      <div v-for="r in ov.runs" :key="r.name" class="flex items-center gap-3 border-t border-[rgba(110,120,200,.12)] py-2.5 first:border-0">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: STATUS_COLOR[r.status] }" />
        <router-link :to="{ name: 'Organization', params: { organizationId: r.organization } }" class="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-gray-9 hover:underline">{{ r.organization }}</router-link>
        <span class="hidden text-[13px] text-ink-gray-5 sm:inline">{{ r.kind }}</span>
        <span class="text-[13px] text-ink-gray-7" :title="r.error">{{ r.status }}<template v-if="r.error"> · {{ r.error.slice(0, 60) }}</template></span>
        <span class="w-16 text-right text-[13px] text-ink-gray-5">{{ r.credits ? `${r.credits} kr.` : '' }}</span>
      </div>
    </div>

    <!-- Další etapy -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div v-for="s in NEXT" :key="s.title" class="gl-card flex flex-col gap-1 p-4 opacity-70">
        <div class="flex items-center gap-2 text-[15px] font-bold text-ink-gray-9"><GlIcon :name="s.icon" :size="18" />{{ s.title }}<span class="rounded-full bg-[rgba(79,70,229,.1)] px-2 py-0.5 text-[11px] font-bold text-[#3b30b8]">{{ __('brzy') }}</span></div>
        <div class="text-[13px] text-ink-gray-6">{{ s.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isForbidden } from '@/utils/glErrors'
import { saveFailed } from '@/composables/glToast'
import { Button, FormControl, call, createListResource, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Agent') }))

const STATUS_COLOR = { 'Čeká': '#a3a8c3', 'Probíhá': '#4F46E5', 'Hotovo': '#22b35e', 'Chyba': '#d0362a', 'Přeskočeno': '#d6a01d' }
const NEXT = [
  { icon: 'star', title: __('Naše firma'), text: __('Obory, služby a ukázky z našeho webu jako podklad pro oslovování.') },
  { icon: 'cal', title: __('Automatické kampaně'), text: __('Oslovení naplánované v kalendáři, personalizované e-maily odchází samy.') },
  { icon: 'search', title: __('Hledání podobných firem'), text: __('Podle vzorku vašich klientů najde nové firmy na webu.') },
]

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
const PRIORITY_COLOR = { 'Vysoká': '#4F46E5', 'Střední': '#0ea5e9', 'Nízká': '#a3a8c3' }
const sgPriority = ref('Vysoká')
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
</script>
