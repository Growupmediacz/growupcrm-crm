<template>
  <!-- GrowUp (design 2. kolo, opravy 22, 23, 28): mobilní Zakázky.
       Přepínač Pipeline / Seznam, v pipeline čipy fází a vodorovné stránkování s náhledem dalšího sloupce,
       v seznamu karty. Dlouhý stisk karty = Posunout fázi. -->
  <div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
    <div class="gl-seg flex w-full shrink-0">
      <button class="gl-seg-btn flex-1 justify-center" :class="mode === 'kanban' && 'gl-seg-on'" @click="go('kanban')">{{ __('Pipeline') }}</button>
      <button class="gl-seg-btn flex-1 justify-center" :class="mode === 'list' && 'gl-seg-on'" @click="go('list')">{{ __('Seznam') }}</button>
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
import { statusesStore } from '@/stores/statuses'
import { call, toast } from 'frappe-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  leads: { type: Object, required: true },
  mode: { type: String, default: 'list' },
})
const emit = defineEmits(['loadMore', 'won'])

const router = useRouter()
const { leadStatuses, getLeadStatus } = statusesStore()
const data = computed(() => props.leads.data)
const columns = computed(() => (props.mode === 'kanban' ? data.value?.data || [] : []))
const rows = computed(() => (props.mode === 'list' ? data.value?.data || [] : []))
const pageLength = computed(() => data.value?.page_length_count || 20)
const statusList = computed(() => leadStatuses.data || [])

const STAGE_COLORS = {
  'Nová': '#3b82f6', 'Kontaktováno': '#8b5cf6', 'Nabídka odeslána': '#e0a100',
  'Jednání': '#f97316', 'Vyhráno': '#22b35e', 'Prohráno': '#9ca3af',
}
const dot = (col) => STAGE_COLORS[col.name] || '#9ca3af'
const money = (v) => `${new Intl.NumberFormat('cs-CZ').format(v || 0)} Kč`

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
