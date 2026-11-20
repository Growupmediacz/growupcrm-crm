<template>
  <!-- GrowUp (zadání 2027 E3): „Celý záznam“ agenta. Jen vedoucí. Data: growupcrm.audit.get_log / get_entry. -->
  <LayoutHeader>
    <template #left-header>
      <div class="min-w-0">
        <span class="gl-page-title text-lg-medium text-ink-gray-9">{{ __('Záznam agenta') }}</span>
        <div class="hidden truncate text-[15px] text-ink-gray-6 md:block">{{ __('Co agent v CRM udělal, kdy a proč. Technické názvy najdete v detailu záznamu.') }}</div>
      </div>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="!allowed" :message="__('Záznam agenta vidí jen vedoucí obchodu.')" />
  <div v-else class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <GlAgentStatus :show-link="false" @changed="reload" />

    <!-- filtry -->
    <!-- GrowUp (zadání 2027 kolo 2 V2): filtry v jedné zalamující se řadě -->
    <div class="gl-card flex flex-wrap items-end gap-3 p-4">
      <FormControl v-model="filters.tool" class="min-w-[170px] flex-1" type="select" :label="__('Nástroj')" :options="toolOptions" />
      <FormControl v-model="filters.status" class="min-w-[150px] flex-1" type="select" :label="__('Výsledek')" :options="statusOptions" />
      <FormControl v-model="filters.kind" class="min-w-[150px] flex-1" type="select" :label="__('Druh')" :options="kindOptions" />
      <FormControl v-model="filters.from_date" class="min-w-[150px] flex-1" type="date" :label="__('Od')" />
      <FormControl v-model="filters.to_date" class="min-w-[150px] flex-1" type="date" :label="__('Do')" />
      <button v-if="hasFilters" type="button" class="gl-quick !h-11 md:!h-9" @click="clearFilters">{{ __('Zrušit filtry') }}</button>
    </div>

    <GlErrorBanner v-if="error" :title="__('Záznam se nepodařilo načíst')" :text="error" @retry="reload" />
    <GlSkeleton v-else-if="loading && !rows.length" :rows="5" />
    <GlEmptyState
      v-else-if="!rows.length"
      icon="inbox"
      :title="hasFilters ? __('Filtru nic neodpovídá') : __('Agent zatím nic neudělal')"
      :text="hasFilters ? __('Zkuste změnit nebo zrušit filtry.') : __('Každá akce agenta se zapíše sem.')"
    />

    <template v-else>
      <!-- telefon: karty -->
      <div v-if="isPhone" class="flex flex-col gap-3">
        <button v-for="r in rows" :key="r.name" type="button" class="gl-card flex min-h-11 flex-col gap-1.5 p-4 text-left" @click="openEntry(r)">
          <div class="flex items-baseline justify-between gap-3">
            <span class="min-w-0 break-words text-[15px] font-bold text-ink-gray-9" :title="r.tool">{{ agentActionLabel(r.tool) }}</span>
            <span class="shrink-0 text-[13px] tabular-nums text-ink-gray-5">{{ when(r.at) }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-[13px] text-ink-gray-5">
            <span class="inline-flex rounded-full px-2.5 py-0.5 font-semibold" :class="badge(r.status)">{{ statusLabel(r.status) }}</span>
            <span>{{ r.kind }}</span>
            <span>{{ r.user_name || r.user }}</span>
          </div>
          <div v-if="r.reference_name" class="break-words text-[14px] text-ink-gray-7">{{ r.reference_title || r.reference_name }}</div>
          <div v-if="r.reason" class="line-clamp-2 break-words text-[13px] text-ink-gray-5">{{ r.reason }}</div>
        </button>
      </div>

      <!-- desktop: tabulka -->
      <div v-else class="gl-card overflow-x-auto p-2">
        <table class="w-full min-w-[860px] text-left text-[14.5px]">
          <thead class="text-[13px] font-semibold text-ink-gray-5">
            <tr>
              <th class="px-3 py-2">{{ __('Čas') }}</th>
              <th class="px-3 py-2">{{ __('Kdo') }}</th>
              <th class="px-3 py-2">{{ __('Akce') }}</th>
              <th class="px-3 py-2">{{ __('Druh') }}</th>
              <th class="px-3 py-2">{{ __('Výsledek') }}</th>
              <th class="px-3 py-2">{{ __('U čeho') }}</th>
              <th class="px-3 py-2">{{ __('Důvod') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.name"
              tabindex="0"
              class="h-14 cursor-pointer border-t border-[var(--outline-gray-1)] align-top hover:bg-white/60 focus-visible:bg-white/60"
              @click="openEntry(r)"
              @keydown.enter="openEntry(r)"
            >
              <td class="whitespace-nowrap px-3 py-3 tabular-nums text-ink-gray-7">{{ when(r.at) }}</td>
              <td class="px-3 py-3 text-ink-gray-7">{{ r.user_name || r.user }}</td>
              <td class="px-3 py-3 font-medium text-ink-gray-9" :title="r.tool">{{ agentActionLabel(r.tool) }}</td>
              <td class="px-3 py-3 text-ink-gray-7">{{ r.kind }}</td>
              <td class="px-3 py-3"><span class="inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold" :class="badge(r.status)">{{ statusLabel(r.status) }}</span></td>
              <td class="px-3 py-3">
                <router-link v-if="refRoute(r)" :to="refRoute(r)" class="font-medium text-ink-gray-9 hover:text-[var(--accent-600)]" @click.stop>{{ r.reference_title || r.reference_name }}</router-link>
                <span v-else-if="r.reference_name" class="text-ink-gray-7">{{ r.reference_name }}</span>
                <span v-else class="text-ink-gray-5">—</span>
              </td>
              <td class="max-w-[320px] px-3 py-3 text-ink-gray-7"><span class="line-clamp-2 break-words">{{ r.reason || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-center gap-3 text-[14px] text-ink-gray-5">
        <span class="tabular-nums">{{ __('Zobrazeno {0} z {1}', [rows.length, total]) }}</span>
        <Button v-if="rows.length < total" :loading="loading" class="max-md:!h-11" :label="__('Načíst další')" @click="loadMore" />
      </div>
    </template>
  </div>

  <!-- detail záznamu -->
  <Dialog v-model:open="showEntry" :options="{ title: __('Detail záznamu'), size: 'lg' }">
    <template #default>
      <GlSkeleton v-if="entryLoading" :rows="3" />
      <div v-else-if="entryError" class="text-[14px] text-[var(--overdue)]" role="alert">{{ entryError }}</div>
      <dl v-else-if="entry" class="grid grid-cols-1 gap-x-4 gap-y-3 text-[14.5px] sm:grid-cols-[150px_1fr]">
        <template v-for="f in entryFields" :key="f.label">
          <dt class="text-[13px] font-semibold text-ink-gray-5">{{ f.label }}</dt>
          <dd class="min-w-0 break-words text-ink-gray-9" :class="f.pre && 'whitespace-pre-wrap font-mono text-[13px]'">{{ f.value }}</dd>
        </template>
        <template v-if="entry.reference_name && refRoute(entry)">
          <dt class="text-[13px] font-semibold text-ink-gray-5">{{ __('Otevřít') }}</dt>
          <dd><router-link :to="refRoute(entry)" class="gl-quick !h-11 md:!h-9" @click="showEntry = false">{{ entry.reference_title || entry.reference_name }}</router-link></dd>
        </template>
      </dl>
    </template>
    <template #actions>
      <div class="flex justify-end"><Button variant="solid" class="max-md:!h-11" :label="__('Zavřít')" @click="showEntry = false" /></div>
    </template>
  </Dialog>
</template>
<script setup>
import GlAgentStatus from '@/components/Agent/GlAgentStatus.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isPhone } from '@/composables/glBreakpoint'
import { usersStore } from '@/stores/users'
import { agentActionLabel } from '@/utils/glAgentActions'
import { Button, Dialog, FormControl, call, usePageMeta } from 'frappe-ui'
import { computed, onMounted, reactive, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Záznam agenta') }))

const PAGE = 50
const allowed = !!usersStore().isManager() // obchodník nic nevolá
const filters = reactive({ tool: '', status: '', kind: '', from_date: '', to_date: '' })
const rows = ref([])
const total = ref(0)
const tools = ref([])
const loading = ref(false)
const error = ref('')

const opts = (label, values) => [{ label, value: '' }, ...values.map((v) => ({ label: v, value: v }))]
// filtr ukazuje české popisky, hodnota zůstává technický název
const toolOptions = computed(() => [
  { label: __('Všechny'), value: '' },
  ...tools.value.map((t) => ({ label: agentActionLabel(t), value: t })).sort((a, b) => a.label.localeCompare(b.label, 'cs')),
])
const statusOptions = computed(() => opts(__('Všechny'), ['OK', 'Odmítnuto', 'Chyba']))
const kindOptions = computed(() => opts(__('Všechny'), ['Čtení', 'Zápis', 'Mimo nástroje']))
const hasFilters = computed(() => Object.values(filters).some(Boolean))

async function load(append = false) {
  loading.value = true
  error.value = ''
  try {
    const out = await call('growupcrm.audit.get_log', {
      tool: filters.tool || undefined,
      status: filters.status || undefined,
      kind: filters.kind || undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
      start: append ? rows.value.length : 0,
      limit: PAGE,
    })
    rows.value = append ? rows.value.concat(out.rows) : out.rows
    total.value = out.total
    tools.value = out.tools || tools.value
  } catch (e) {
    error.value = e.messages?.[0] || e.message || __('Neznámá chyba.')
  } finally {
    loading.value = false
  }
}
const reload = () => load(false)
const loadMore = () => load(true)
const clearFilters = () => Object.keys(filters).forEach((k) => (filters[k] = ''))
watch(filters, reload)
onMounted(() => {
  if (allowed) load()
})

const when = (s) =>
  s
    ? new Date(String(s).replace(' ', 'T')).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : ''
// výsledek je vždy i slovem
const statusLabel = (s) => (s === 'OK' ? `✓ ${__('OK')}` : s === 'Odmítnuto' ? `! ${__(s)}` : s === 'Chyba' ? `! ${__(s)}` : s)
const badge = (s) =>
  s === 'OK'
    ? 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_14%,transparent)] text-[var(--c-green-700-2)]'
    : s === 'Odmítnuto'
      ? 'bg-[color-mix(in_srgb,var(--stage-nabidka)_16%,transparent)] text-[var(--warning)]'
      : 'bg-[color-mix(in_srgb,var(--c-red-550)_12%,transparent)] text-[var(--overdue)]'
function refRoute(r) {
  if (!r.reference_name) return null
  if (r.reference_doctype === 'CRM Lead') return { name: 'Lead', params: { leadId: r.reference_name } }
  if (r.reference_doctype === 'CRM Organization') return { name: 'Organization', params: { organizationId: r.reference_name } }
  return null
}

// --- detail ---
const showEntry = ref(false)
const entry = ref(null)
const entryLoading = ref(false)
const entryError = ref('')
async function openEntry(r) {
  entry.value = null
  entryError.value = ''
  entryLoading.value = true
  showEntry.value = true
  try {
    entry.value = await call('growupcrm.audit.get_entry', { name: r.name })
  } catch (e) {
    entryError.value = e.messages?.[0] || e.message
  } finally {
    entryLoading.value = false
  }
}
const pretty = (v) => {
  if (!v) return ''
  try {
    return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2)
  } catch {
    return String(v)
  }
}
const entryFields = computed(() => {
  const e = entry.value
  if (!e) return []
  const out = [
    { label: __('Čas'), value: when(e.at) },
    { label: __('Kdo'), value: e.user_name || e.user },
    { label: __('Nástroj'), value: e.tool },
    { label: __('Druh'), value: e.kind },
    { label: __('Výsledek'), value: statusLabel(e.status) },
  ]
  if (e.reference_name) out.push({ label: __('U čeho'), value: `${e.reference_title || e.reference_name} (${e.reference_doctype})` })
  if (e.reason) out.push({ label: __('Důvod'), value: e.reason })
  if (e.args) out.push({ label: __('Vstup'), value: pretty(e.args), pre: true })
  if (e.result) out.push({ label: __('Výsledek volání'), value: e.result })
  if (e.error) out.push({ label: __('Chyba'), value: e.error })
  if (e.duration_ms !== null && e.duration_ms !== undefined) out.push({ label: __('Trvalo'), value: `${e.duration_ms} ms` })
  if (e.path) out.push({ label: __('Adresa'), value: e.path })
  return out
})
</script>
