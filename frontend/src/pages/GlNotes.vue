<template>
  <!-- GrowUp (design 2. kolo, C2): Zápisy – karty s navázáním a autorem. Uložené pohledy zůstávají v CRM (Notes.vue). Data: growupcrm.worklists.get_notes -->
  <CrmNotes v-if="legacy" />
  <template v-else>
    <LayoutHeader>
      <template #left-header><h1 class="gl-page-title text-lg-medium">{{ __('Zápisy') }}</h1></template>
      <template #right-header>
        <div class="gl-seg hidden md:inline-flex">
          <button class="gl-seg-btn" :class="scope === 'mine' && 'gl-seg-on'" @click="scope = 'mine'">{{ __('Moje') }}</button>
          <button class="gl-seg-btn" :class="scope === 'all' && 'gl-seg-on'" @click="scope = 'all'">{{ __('Celý tým') }}</button>
        </div>
        <Button variant="solid" iconLeft="plus" @click="createNote"><span class="hidden sm:inline">{{ __('Nový zápis') }}</span></Button>
      </template>
    </LayoutHeader>
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
      <!-- design 3. kolo (14): hledání · Období · Firma -->
      <div class="flex flex-wrap items-center gap-2 px-1">
        <label class="gl-chip flex h-11 w-full items-center gap-2 rounded-full px-4 md:w-[420px]"><GlIcon name="search" :size="16" class="opacity-60" /><input v-model="q" class="gl-chip-input w-full bg-transparent text-[14px]" :placeholder="__('Hledat v zápisech')" /></label>
        <label class="gl-chip hidden h-11 items-center gap-1.5 rounded-full pl-4 pr-2 text-[14px] md:flex"><span class="text-ink-gray-5">{{ __('Období') }}:</span>
          <select v-model="period" class="!h-auto cursor-pointer appearance-none !border-0 !bg-transparent !py-0 !pl-0 pr-5 font-semibold text-ink-gray-9 !shadow-none outline-none"><option v-for="o in PERIODS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
        </label>
        <div class="hidden h-11 w-[300px] items-center md:flex">
          <Link v-model="organization" class="w-full" doctype="CRM Organization" :placeholder="__('Firma: Vše')" />
        </div>
        <div class="gl-seg md:hidden">
          <button class="gl-seg-btn" :class="scope === 'mine' && 'gl-seg-on'" @click="scope = 'mine'">{{ __('Moje') }}</button>
          <button class="gl-seg-btn" :class="scope === 'all' && 'gl-seg-on'" @click="scope = 'all'">{{ __('Celý tým') }}</button>
        </div>
      </div>
      <GlErrorBanner v-if="res.error" :title="__('Zápisy se nepodařilo načíst')" :text="res.error.messages?.[0]" @retry="res.reload()" />
      <GlSkeleton v-else-if="!res.data" variant="cards" :rows="3" />
      <GlEmptyState v-else-if="!res.data.items.length" icon="doc" :title="q ? __('Nic nenalezeno') : __('Zatím žádné zápisy')" :text="q ? __('Zkuste jiné slovo nebo zrušte filtr.') : __('Zápisy vznikají u zakázek, firem a kontaktů.')" :action="q ? __('Zrušit hledání') : __('Nový zápis')" :primary="!q" @action="q ? (q = '') : createNote()" />
      <!-- design 3. kolo (14): na desktopu seznam vlevo a otevřený zápis vpravo, na mobilu karty -->
      <div v-if="!isMobileView && res.data?.items.length" class="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <div class="gl-card col-span-5 flex min-h-0 flex-col overflow-y-auto p-2">
          <button
            v-for="n in res.data.items"
            :key="n.name"
            class="flex items-start gap-3.5 rounded-[18px] p-3.5 text-left transition"
            :class="selected === n.name ? 'bg-white shadow-[inset_3px_0_0_var(--accent-600),0_6px_18px_-10px_rgba(40,40,120,.3)]' : 'hover:bg-white/60'"
            @click="selected = n.name"
          >
            <span class="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[rgba(139,92,246,.13)] text-[#6d3fd6]"><GlIcon name="doc" :size="20" /></span>
            <span class="min-w-0 flex-1">
              <span lang="cs" class="block truncate text-[16px] font-semibold text-ink-gray-9">{{ n.title }}</span>
              <span lang="cs" class="mt-0.5 line-clamp-2 text-[14px] leading-snug text-ink-gray-7">{{ n.content }}</span>
              <span class="mt-1 block truncate text-[13px] text-ink-gray-5">{{ [whenLabel(n.modified), userName(n.owner), n.ref?.label?.split(' · ')[1]].filter(Boolean).join(' · ') }}</span>
            </span>
          </button>
        </div>
        <div class="gl-card col-span-7 flex min-h-0 flex-col overflow-y-auto p-7">
          <template v-if="current">
            <div class="flex items-start justify-between gap-4">
              <h2 lang="cs" class="text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ current.title }}</h2>
              <div class="flex shrink-0 gap-2">
                <Button iconLeft="edit-2" :label="__('Upravit')" @click="editNote(current.name)" />
                <Dropdown :options="[{ label: __('Smazat'), icon: 'trash-2', theme: 'red', onClick: () => remove(current.name) }]" placement="right">
                  <Button icon="more-horizontal" :aria-label="__('Další akce')" />
                </Dropdown>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <router-link v-if="current.ref" :to="refRoute(current.ref)" class="flex max-w-full items-center gap-1.5 truncate rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[13.5px] font-medium text-[var(--accent-700)] hover:bg-white">
                <GlIcon :name="REF_ICON[current.ref.kind]" :size="15" />{{ current.ref.label }}
              </router-link>
              <router-link v-if="current.org && current.ref?.kind !== 'org' && current.org_id" :to="{ name: 'Organization', params: { organizationId: current.org_id } }" class="flex max-w-full items-center gap-1.5 truncate rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[13.5px] font-medium text-ink-gray-7 hover:bg-white">
                <GlIcon name="building" :size="15" />{{ __('Firma') }} · {{ current.org }}
              </router-link>
              <span class="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[13.5px] font-medium text-ink-gray-7"><GlIcon name="cal" :size="15" />{{ fullDate(current.modified) }}</span>
              <span class="ml-1 flex items-center gap-2 text-[14px] text-ink-gray-8">
                <img v-if="userImage(current.owner)" :src="userImage(current.owner)" class="size-7 rounded-full object-cover" />
                <span v-else class="flex size-7 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]">{{ initials(userName(current.owner)) }}</span>{{ userName(current.owner) }}
              </span>
            </div>
            <div class="mt-5 border-t border-[var(--line)]">
              <template v-if="noteDoc.data">
                <!-- Cíl · Průběh · Závěr jako samostatné bloky, Další krok jako pruh s „Vytvořit úkol“ -->
                <div v-for="(sec, i) in parsed.sections" :key="i" class="border-b border-[var(--line)] py-5 last:border-b-0">
                  <div v-if="sec.label" class="mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-gray-5">{{ sec.label }}</div>
                  <div lang="cs" class="gl3-note" v-html="sec.html" />
                </div>
                <div v-if="parsed.next" class="mt-1 flex items-center gap-3 rounded-[18px] border border-[rgba(224,161,0,.35)] bg-[rgba(224,161,0,.1)] px-4 py-3">
                  <GlIcon name="clock" :size="22" class="shrink-0 text-[#d48a00]" />
                  <span class="min-w-0 flex-1 text-[15px] text-ink-gray-9"><b class="text-[#b06d00]">{{ __('Další krok') }}:</b> {{ parsed.next }}</span>
                  <Button variant="solid" iconLeft="check" :label="__('Vytvořit úkol')" @click="taskFromNote" />
                </div>
              </template>
              <GlSkeleton v-else class="pt-5" :rows="4" />
            </div>
          </template>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="n in res.data?.items || []" :key="n.name" class="gl-card gl-lift flex min-h-[200px] cursor-pointer flex-col gap-2.5 p-5" @click="editNote(n.name)">
          <div class="flex items-start justify-between gap-2">
            <div lang="cs" class="gl-text line-clamp-2 text-[17px] font-bold leading-snug text-ink-gray-9">{{ n.title }}</div>
            <Dropdown :options="[{ label: __('Smazat'), icon: 'trash-2', theme: 'red', onClick: () => remove(n.name) }]" placement="right">
              <button class="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-gray-5 hover:bg-white/70" :aria-label="__('Další akce')" @click.stop><GlIcon name="more" :size="18" /></button>
            </Dropdown>
          </div>
          <div lang="cs" class="gl-text line-clamp-4 flex-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-gray-7">{{ n.content }}</div>
          <div class="flex flex-wrap gap-1.5">
            <span v-if="n.ref" class="max-w-full truncate rounded-full px-2.5 py-0.5 text-[12px] font-bold" :class="REF_TONE[n.ref.kind]">{{ n.ref.label }}</span>
            <span v-if="n.org && n.ref?.kind !== 'org'" class="max-w-full truncate rounded-full bg-[rgba(110,120,200,.14)] px-2.5 py-0.5 text-[12px] font-semibold text-[#4a5173]">{{ n.org }}</span>
          </div>
          <div class="flex items-center gap-2 text-[13px] text-ink-gray-5"><span class="flex size-6 items-center justify-center rounded-full bg-[#dde6ff] text-[9px] font-bold text-[#2440a6]">{{ initials(userName(n.owner)) }}</span>{{ whenLabel(n.modified) }}</div>
        </div>
      </div>
      <GlTaskModal v-if="showTask" v-model="showTask" :defaults="taskDefaults" @saved="toast.success(__('Úkol je v seznamu Úkoly a v kalendáři.'))" />
      <div v-if="res.data && res.data.items.length < res.data.total" class="flex justify-center"><button class="gl-quick !h-11 !px-6 !text-[15px]" @click="limit += 12">{{ __('Načíst další') }}</button></div>
    </div>
  </template>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import Link from '@/components/Controls/Link.vue'
import GlTaskModal from '@/components/Modals/GlTaskModal.vue'
import { parseNote } from '@/utils/glNote'
import { useDoctypeModal } from '@/composables/doctypeModal'
import { usersStore } from '@/stores/users'
import { shortDateCz, formatTimeCz } from '@/utils/glDate'
import { Button, Dropdown, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Zápisy') }))
import { useRoute } from 'vue-router'
import { isMobileView } from '@/composables/settings'

const CrmNotes = defineAsyncComponent(() => import('@/pages/Notes.vue'))
const route = useRoute()
const legacy = computed(() => (route.params.viewType && route.params.viewType !== 'list') || !!route.query.view)
const { getUser } = usersStore()
const { showModal } = useDoctypeModal()

const PERIODS = [
  { value: 'week', label: __('Tento týden') },
  { value: 'month', label: __('Tento měsíc') },
  { value: 'quarter', label: __('Toto čtvrtletí') },
  { value: '', label: __('Vše') },
]
const scope = ref('mine')
const period = ref('')
const organization = ref('')
const q = ref('')
const limit = ref(12)
const params = () => ({ scope: scope.value, period: period.value || undefined, organization: organization.value || undefined, q: q.value, limit: limit.value })
const res = createResource({ url: 'growupcrm.worklists.get_notes', params: params(), auto: true })
let timer
watch([scope, period, organization, q, limit], () => { clearTimeout(timer); timer = setTimeout(() => res.fetch(params()), 200) })

const REF_TONE = {
  lead: 'bg-[rgba(139,92,246,.14)] text-[#5a2fc0]', project: 'bg-[rgba(59,110,246,.13)] text-[#1f48b8]',
  org: 'bg-[rgba(110,120,200,.14)] text-[#4a5173]', contact: 'bg-[rgba(110,120,200,.14)] text-[#4a5173]',
}
const userName = (u) => getUser(u)?.full_name || u
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
function whenLabel(v) {
  const d = new Date(String(v).replace(' ', 'T'))
  return d.toDateString() === new Date().toDateString() ? `${__('dnes')} ${formatTimeCz(d)}` : shortDateCz(d)
}
// otevřený zápis vpravo (desktop): první v seznamu, celý text (HTML) z FCRM Note
const selected = ref('')
const current = computed(() => res.data?.items.find((n) => n.name === selected.value) || null)
const noteDoc = createResource({ url: 'frappe.client.get' })
watch(
  () => res.data?.items,
  (items) => {
    if (items?.length && !items.some((n) => n.name === selected.value)) selected.value = items[0].name
  },
)
watch(selected, (name) => name && noteDoc.fetch({ doctype: 'FCRM Note', name }))
const callbacks = { afterInsert: () => res.reload(), afterUpdate: () => (res.reload(), selected.value && noteDoc.fetch({ doctype: 'FCRM Note', name: selected.value })) }
const createNote = () => showModal({ doctype: 'FCRM Note', title: 'Note', callbacks })
const editNote = (name) => showModal({ name, doctype: 'FCRM Note', title: 'Note', callbacks })
async function remove(name) {
  if (!window.confirm(__('Smazat zápis?'))) return
  await call('frappe.client.delete', { doctype: 'FCRM Note', name })
  res.reload()
}

const REF_ICON = { lead: 'brief', project: 'folder', org: 'building', contact: 'user' }
const refRoute = (ref) =>
  ({
    lead: { name: 'Lead', params: { leadId: ref.to } },
    org: { name: 'Organization', params: { organizationId: ref.to } },
    project: { name: 'Project', params: { projectId: ref.to } },
    contact: { name: 'ContactsCards', query: { contact: ref.to } },
  })[ref.kind] || {}
const userImage = (u) => getUser(u)?.user_image || ''
const fullDate = (v) => new Date(String(v).replace(' ', 'T')).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
const parsed = computed(() => parseNote(noteDoc.data?.content || ''))
// Další krok → nový úkol navázaný na zakázku / firmu zápisu (design 14: „Vytvořit úkol“)
const showTask = ref(false)
const taskDefaults = computed(() => {
  const ref = current.value?.ref
  const dt = { lead: 'CRM Lead', org: 'CRM Organization' }[ref?.kind]
  const next = parsed.value.next.slice(0, 140)
  return { title: next.charAt(0).toUpperCase() + next.slice(1), ...(dt ? { reference_doctype: dt, reference_docname: ref.to, ref } : {}) }
})
const taskFromNote = () => (showTask.value = true)
</script>
