<template>
  <!-- GrowUp (design 2. kolo, C2): Zápisy – karty s navázáním a autorem. Uložené pohledy zůstávají v CRM (Notes.vue). Data: growupcrm.worklists.get_notes -->
  <CrmNotes v-if="legacy" />
  <template v-else>
    <LayoutHeader>
      <template #left-header><h1 class="gl-page-title text-lg-medium">{{ __('Zápisy') }}</h1></template>
      <template #right-header>
        <label class="gl-chip hidden h-11 w-[300px] items-center gap-2 rounded-full px-4 md:flex"><GlIcon name="search" :size="16" class="opacity-60" /><input v-model="q" class="gl-chip-input w-full bg-transparent text-[14px]" :placeholder="__('Hledat v zápisech')" /></label>
        <Button variant="solid" iconLeft="plus" @click="createNote"><span class="hidden sm:inline">{{ __('Nový zápis') }}</span></Button>
      </template>
    </LayoutHeader>
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
      <div class="flex flex-wrap items-center gap-2 px-1">
        <label class="gl-chip flex h-10 flex-1 items-center gap-2 rounded-full px-4 md:hidden"><GlIcon name="search" :size="15" class="opacity-60" /><input v-model="q" class="gl-chip-input w-full bg-transparent text-[14px]" :placeholder="__('Hledat v zápisech')" /></label>
        <button v-for="f in FILTERS" :key="f.key" class="gl-chip hidden h-10 rounded-full px-4 text-[14px] font-medium md:inline-flex md:items-center" :class="filter === f.key && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="filter = f.key">{{ f.label }}</button>
        <label class="hidden items-center gap-2 text-[14px] md:flex"><span class="text-ink-gray-5">{{ __('Navázáno na') }}:</span>
          <select v-model="linked" class="gl-chip h-10 rounded-full px-3 text-[14px] font-semibold"><option value="">{{ __('Vše') }}</option><option value="lead">{{ __('Zakázka') }}</option><option value="org">{{ __('Firma') }}</option><option value="project">{{ __('Projekt') }}</option><option value="contact">{{ __('Kontakt') }}</option></select>
        </label>
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
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span v-if="current.ref" class="max-w-full truncate rounded-full px-3 py-1 text-[13px] font-semibold" :class="REF_TONE[current.ref.kind]">{{ current.ref.label }}</span>
              <span v-if="current.org && current.ref?.kind !== 'org'" class="max-w-full truncate rounded-full bg-[rgba(110,120,200,.12)] px-3 py-1 text-[13px] font-semibold text-[#4a5173]">{{ __('Firma') }} · {{ current.org }}</span>
              <span class="rounded-full bg-[rgba(110,120,200,.12)] px-3 py-1 text-[13px] font-semibold text-[#4a5173]">{{ whenLabel(current.modified) }}</span>
              <span class="flex items-center gap-1.5 text-[13px] text-ink-gray-7"><span class="flex size-6 items-center justify-center rounded-full bg-[#dde6ff] text-[9px] font-bold text-[#2440a6]">{{ initials(userName(current.owner)) }}</span>{{ userName(current.owner) }}</span>
            </div>
            <div class="mt-5 border-t border-[var(--line)] pt-5">
              <div v-if="noteDoc.data" lang="cs" class="gl3-note" v-html="noteDoc.data.content" />
              <GlSkeleton v-else :rows="4" />
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
import { useDoctypeModal } from '@/composables/doctypeModal'
import { usersStore } from '@/stores/users'
import { shortDateCz, formatTimeCz } from '@/utils/glDate'
import { Button, Dropdown, call, createResource } from 'frappe-ui'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { isMobileView } from '@/composables/settings'

const CrmNotes = defineAsyncComponent(() => import('@/pages/Notes.vue'))
const route = useRoute()
const legacy = computed(() => (route.params.viewType && route.params.viewType !== 'list') || !!route.query.view)
const { getUser } = usersStore()
const { showModal } = useDoctypeModal()

const FILTERS = [{ key: 'all', label: __('Vše') }, { key: 'mine', label: __('Moje') }, { key: 'meeting', label: __('Schůzky') }, { key: 'call', label: __('Hovory') }]
const filter = ref('all')
const linked = ref('')
const q = ref('')
const limit = ref(12)
const params = () => ({ scope: filter.value === 'mine' ? 'mine' : 'all', kind: ['meeting', 'call'].includes(filter.value) ? filter.value : undefined, linked: linked.value || undefined, q: q.value, limit: limit.value })
const res = createResource({ url: 'growupcrm.worklists.get_notes', params: params(), auto: true })
let timer
watch([filter, linked, q, limit], () => { clearTimeout(timer); timer = setTimeout(() => res.fetch(params()), 200) })

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
</script>
