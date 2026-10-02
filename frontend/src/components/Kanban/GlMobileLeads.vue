<template>
  <!-- GrowUp (design 2. kolo, opravy 22, 23, 28): mobilní Zakázky.
       Přepínač Pipeline / Seznam, v pipeline čipy fází a vodorovné stránkování s náhledem dalšího sloupce,
       v seznamu karty. Dlouhý stisk karty = Posunout fázi. -->
  <div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
    <div class="flex shrink-0 items-center gap-2">
      <div class="gl-seg flex min-w-0 flex-1">
        <button class="gl-seg-btn flex-1 justify-center" :class="mode === 'kanban' && 'gl-seg-on'" @click="go('kanban')">{{ __('Pipeline') }}</button>
        <button class="gl-seg-btn flex-1 justify-center" :class="mode === 'list' && 'gl-seg-on'" @click="go('list')">{{ __('Seznam') }}</button>
      </div>
      <button class="gl-round relative flex size-11 shrink-0 items-center justify-center rounded-full" :aria-label="__('Filtr')" @click="openFilter">
        <GlIcon name="filter" :size="18" />
        <span v-if="activeCount" class="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[#4F46E5] text-[11px] font-bold text-white">{{ activeCount }}</span>
      </button>
    </div>

    <!-- Pipeline -->
    <template v-if="mode === 'kanban'">
      <div class="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <button
          v-for="(c, i) in columns"
          :key="c.column.name"
          class="gl-chip flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold"
          :class="i === stage && '!border-[#0e1330] !bg-[#0e1330] !text-white'"
          @click="scrollTo(i)"
        >
          <span class="size-2 rounded-full" :style="{ background: dot(c.column) }" />
          {{ __(c.column.name) }} <span class="num opacity-70">{{ c.column.all_count }}</span>
        </button>
      </div>
      <div class="flex shrink-0 items-baseline justify-between px-1" v-if="columns[stage]">
        <h2 class="text-[18px] font-bold text-ink-gray-9">{{ __(columns[stage].column.name) }}</h2>
        <span class="num text-[13px] text-ink-gray-5">{{ columns[stage].column.all_count }} · {{ money(columns[stage].column.sum) }}</span>
      </div>
      <div
        ref="pager"
        class="-mx-4 flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none]"
        @scroll.passive="onScroll"
      >
        <div v-for="c in columns" :key="c.column.name" class="flex w-[calc(100%-36px)] shrink-0 snap-center flex-col gap-2.5 overflow-y-auto pb-2">
          <GlMobileCard v-for="d in c.data" :key="d.name" :lead="d" showStatus @press="openMove(d)" />
          <p v-if="!c.data?.length" class="py-8 text-center text-[14px] text-ink-gray-5">{{ __('V této fázi zatím nic není.') }}</p>
        </div>
      </div>
      <div class="flex shrink-0 justify-center gap-1.5" aria-hidden="true">
        <span v-for="(c, i) in columns" :key="c.column.name" class="h-1.5 rounded-full transition-all" :class="i === stage ? 'w-4 bg-[#4F46E5]' : 'w-1.5 bg-[rgba(110,120,200,.3)]'" />
      </div>
      <p class="shrink-0 px-1 text-[13px] text-ink-gray-5">{{ __('Přejetím do strany na další fázi. Dlouhý stisk karty → Posunout fázi.') }}</p>
    </template>

    <!-- Seznam -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
      <GlMobileCard v-for="d in rows" :key="d.name" :lead="d" showStatus showOrg @press="openMove(d)" />
      <GlListFooter
        :modelValue="pageLength"
        :options="{ rowCount: data?.row_count, totalCount: data?.total_count }"
        @update:modelValue="(v) => (leads.data.page_length_count = v)"
        @loadMore="emit('loadMore')"
      />
    </div>

    <!-- Filtr (spodní panel, design MFiltr) -->
    <Teleport to="body">
      <div v-if="showFilter" class="fixed inset-0 z-[90]">
        <div class="absolute inset-0 bg-[rgba(30,34,80,.35)]" @click="showFilter = false" />
        <div class="gl-sheet absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[26px] p-5 pb-6">
          <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[rgba(110,120,200,.3)]" />
          <div class="mb-3 flex items-center justify-between"><h2 class="text-[22px] font-bold text-ink-gray-9">{{ __('Filtr') }}</h2><button class="text-[15px] font-semibold text-[#4F46E5]" @click="clearDraft">{{ __('Vymazat') }}</button></div>
          <div class="flex-1 overflow-y-auto">
            <div class="mb-1.5 text-[13px] font-semibold text-ink-gray-7">{{ __('Vlastník') }}</div>
            <div class="mb-4 flex flex-wrap gap-2">
              <button v-for="u in owners" :key="u.name" class="gl-chip flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[14px]" :class="draft.owners.includes(u.name) && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="toggle(draft.owners, u.name)">
                <span class="flex size-7 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]">{{ (u.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('') }}</span>{{ (u.full_name || '').split(' ')[0] }}
              </button>
            </div>
            <div class="mb-1.5 text-[13px] font-semibold text-ink-gray-7">{{ __('Fáze') }}</div>
            <div class="mb-4 flex flex-wrap gap-2">
              <button v-for="s in statusList" :key="s.name" class="gl-chip flex h-10 items-center gap-2 rounded-full px-3.5 text-[14px]" :class="draft.stages.includes(s.name) && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="toggle(draft.stages, s.name)">
                <span class="size-2 rounded-full" :style="{ background: STAGE_COLORS[s.name] || '#9ca3af' }" />{{ __(s.name) }}
              </button>
            </div>
            <div class="gl-card !rounded-[18px] px-4">
              <label class="flex min-h-[56px] items-center gap-3"><span class="flex size-9 items-center justify-center rounded-[11px] bg-[rgba(110,120,200,.12)]"><GlIcon name="pin" :size="17" /></span><span class="flex-1 text-[16px] text-ink-gray-9">{{ __('Kraj') }}</span>
                <select v-model="draft.territory" class="max-w-[170px] appearance-none border-0 bg-transparent text-right text-[15px] text-ink-gray-7 shadow-none outline-none"><option value="">{{ __('Vše') }}</option><option v-for="t in territories" :key="t" :value="t">{{ t }}</option></select></label>
              <div class="flex min-h-[56px] items-center gap-3 border-t border-[rgba(110,120,200,.14)]"><span class="flex size-9 items-center justify-center rounded-[11px] bg-[rgba(224,161,0,.16)] text-[#7a4400]"><GlIcon name="clock" :size="17" /></span><span class="flex-1 text-[16px] text-ink-gray-9">{{ __('Jen po termínu') }}</span><Switch v-model="draft.overdue" /></div>
            </div>
          </div>
          <button class="mt-4 h-14 w-full rounded-full bg-[#4F46E5] text-[17px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,.7)]" @click="applyFilter">{{ __('Zobrazit {0}', [zakazkyWord(draftCount)]) }}</button>
        </div>
      </div>
    </Teleport>

    <!-- Posunout fázi (spodní panel) -->
    <Teleport to="body">
      <div v-if="moving" class="fixed inset-0 z-[90]" @click.self="moving = null">
        <div class="absolute inset-0 bg-[rgba(30,34,80,.35)]" @click="moving = null" />
        <div class="gl-sheet absolute inset-x-0 bottom-0 rounded-t-[26px] p-5 pb-8">
          <div class="mb-1 text-[18px] font-bold text-ink-gray-9">{{ __('Posunout fázi') }}</div>
          <div class="mb-3 truncate text-[14px] text-ink-gray-5">{{ moving.order_title || moving.lead_name || moving.name }}</div>
          <button
            v-for="s in statusList"
            :key="s.name"
            class="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[16px] font-medium text-ink-gray-9 active:bg-white/70"
            :class="s.name === moving.status && 'bg-white/60 font-bold'"
            @click="move(s)"
          >
            <span class="size-2.5 rounded-full" :style="{ background: STAGE_COLORS[s.name] || '#9ca3af' }" />{{ __(s.name) }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import GlListFooter from '@/components/GlListFooter.vue'
import GlMobileCard from '@/components/Kanban/GlMobileCard.vue'
import GlIcon from '@/components/GlIcon.vue'
import { statusesStore } from '@/stores/statuses'
import { usersStore } from '@/stores/users'
import { Switch, call, toast } from 'frappe-ui'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  leads: { type: Object, required: true },
  mode: { type: String, default: 'list' },
})
const emit = defineEmits(['loadMore', 'loadAll', 'won'])

const router = useRouter()
const { users } = usersStore()
const { leadStatuses, getLeadStatus } = statusesStore()
const data = computed(() => props.leads.data)
// filtr (design MFiltr): vlastník, fáze, kraj, jen po termínu – nad načtenými zakázkami
const filter = reactive({ owners: [], stages: [], territory: '', overdue: false })
const draft = reactive({ owners: [], stages: [], territory: '', overdue: false })
const showFilter = ref(false)
const isOverdue = (d) => !!(d.next_action?.overdue || (d.next_step_at && new Date(String(d.next_step_at).replace(' ', 'T')) < new Date()))
const passes = (d, f) =>
  (!f.owners.length || f.owners.includes(d.lead_owner)) &&
  (!f.stages.length || f.stages.includes(d.status)) &&
  (!f.territory || d.territory === f.territory) &&
  (!f.overdue || isOverdue(d))
const activeCount = computed(() => (filter.owners.length ? 1 : 0) + (filter.stages.length ? 1 : 0) + (filter.territory ? 1 : 0) + (filter.overdue ? 1 : 0))
const columns = computed(() =>
  props.mode === 'kanban'
    ? (data.value?.data || [])
        .filter((c) => !filter.stages.length || filter.stages.includes(c.column.name))
        .map((c) => ({ ...c, data: (c.data || []).filter((d) => passes({ ...d, status: d.status || c.column.name }, { ...filter, stages: [] })) }))
    : [],
)
const rows = computed(() => (props.mode === 'list' ? (data.value?.data || []).filter((d) => passes(d, filter)) : []))
const draftCount = computed(() => {
  const all = props.mode === 'kanban' ? (data.value?.data || []).flatMap((c) => (c.data || []).map((d) => ({ ...d, status: d.status || c.column.name }))) : data.value?.data || []
  return all.filter((d) => passes(d, draft)).length
})
// vlastníci = uživatelé CRM, kteří mají načtené zakázky (tým je malý, Administrator se ukáže, jen když něco vlastní)
const owners = computed(() => {
  const all = props.mode === 'kanban' ? (data.value?.data || []).flatMap((c) => c.data || []) : data.value?.data || []
  const used = new Set(all.map((d) => d.lead_owner).filter(Boolean))
  return (users.data?.crmUsers || []).filter((u) => used.has(u.name) || u.name !== 'Administrator')
})
const territories = computed(() => {
  const all = props.mode === 'kanban' ? (data.value?.data || []).flatMap((c) => c.data || []) : data.value?.data || []
  return [...new Set(all.map((d) => d.territory).filter(Boolean))].sort()
})
const toggle = (arr, v) => (arr.includes(v) ? arr.splice(arr.indexOf(v), 1) : arr.push(v))
function openFilter() {
  Object.assign(draft, { owners: [...filter.owners], stages: [...filter.stages], territory: filter.territory, overdue: filter.overdue })
  showFilter.value = true
}
function clearDraft() {
  Object.assign(draft, { owners: [], stages: [], territory: '', overdue: false })
}
function applyFilter() {
  Object.assign(filter, { owners: [...draft.owners], stages: [...draft.stages], territory: draft.territory, overdue: draft.overdue })
  showFilter.value = false
  if (activeCount.value) emit('loadAll')
}
const pageLength = computed(() => data.value?.page_length_count || 20)
const statusList = computed(() => leadStatuses.data || [])

const STAGE_COLORS = {
  'Nová': '#3b82f6', 'Kontaktováno': '#8b5cf6', 'Nabídka odeslána': '#e0a100',
  'Jednání': '#f97316', 'Vyhráno': '#22b35e', 'Prohráno': '#9ca3af',
}
const dot = (col) => STAGE_COLORS[col.name] || '#9ca3af'
const money = (v) => `${new Intl.NumberFormat('cs-CZ').format(v || 0)} Kč`

const zakazkyWord = (n) => `${n} ${n === 1 ? 'zakázku' : n >= 2 && n <= 4 ? 'zakázky' : 'zakázek'}`

function go(type) {
  if (type !== props.mode) router.push({ name: 'Leads', params: { viewType: type } })
}

// vodorovné stránkování
const pager = ref(null)
const stage = ref(0)
function onScroll() {
  const el = pager.value
  if (!el || !el.firstElementChild) return
  const w = el.firstElementChild.getBoundingClientRect().width + 12
  stage.value = Math.max(0, Math.min(columns.value.length - 1, Math.round(el.scrollLeft / w)))
}
function scrollTo(i) {
  const el = pager.value
  if (!el?.firstElementChild) return
  el.scrollTo({ left: i * (el.firstElementChild.getBoundingClientRect().width + 12), behavior: 'smooth' })
}

// dlouhý stisk → Posunout fázi
const moving = ref(null)
function openMove(d) {
  moving.value = d
}
async function move(s) {
  const d = moving.value
  moving.value = null
  if (!d || s.name === d.status) return
  if (getLeadStatus(s.name)?.type === 'Won') return emit('won', d, s.name)
  try {
    await call('frappe.client.set_value', { doctype: 'CRM Lead', name: d.name, fieldname: 'status', value: s.name })
    props.leads.reload()
    toast.success(__('Zakázka je ve fázi {0}', [__(s.name)]))
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
</script>
