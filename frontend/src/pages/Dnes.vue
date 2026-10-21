<template>
  <LayoutHeader>
    <template #left-header>
      <div class="flex flex-col leading-tight">
        <span class="text-[13px] font-semibold text-ink-gray-5 md:text-[16px] md:font-medium">{{ dateLabel }}</span>
        <h1 class="text-[22px] font-bold tracking-[-0.025em] text-ink-gray-9 md:text-[44px]">{{ greeting }}</h1>
      </div>
    </template>
    <template #right-header>
      <div v-if="data?.is_manager" class="mr-2 hidden rounded-full sm:inline-flex bg-[rgba(110,120,200,.11)] p-[3px]">
        <button
          v-for="o in scopes"
          :key="o.value"
          class="h-8 whitespace-nowrap rounded-full px-3 text-[13px] md:px-4 md:text-[14px] font-semibold transition"
          :class="scope === o.value ? 'bg-white text-ink-gray-9 shadow-[0_2px_10px_-2px_rgba(64,72,160,.28)]' : 'text-ink-gray-5'"
          @click="scope = o.value"
        >
          {{ o.label }}
        </button>
      </div>
      <Button variant="solid" iconLeft="plus" @click="showLeadModal = true"
        ><span class="hidden md:inline">{{ __('Nová zakázka') }}</span></Button
      >
    </template>
  </LayoutHeader>

  <div class="flex flex-col gap-4 px-3 pb-6 md:px-2">
    <!-- karty -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <div v-for="k in cards" :key="k.label" class="gl-card gl-lift flex flex-col gap-1.5 p-4 md:p-5">
        <div class="flex items-center gap-2 text-[14px] text-ink-gray-7">
          {{ k.label }}
          <span v-if="k.delta" class="rounded-full bg-[rgba(91,91,246,.12)] px-2 py-0.5 text-[12px] font-semibold text-[#4644d9]">{{ k.delta }}</span>
        </div>
        <div class="num text-[40px] font-bold leading-none tracking-tight text-ink-gray-9 md:text-[52px]">{{ k.value }}</div>
        <div class="text-[13px] text-ink-gray-5">{{ k.sub }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- program -->
      <!-- design 3. kolo (01): panel programu je vysoký jako pravý sloupec, seznam roluje uvnitř -->
      <div class="gl-card flex flex-col p-4 lg:col-span-7 lg:min-h-[520px] lg:p-6 lg:[contain:size]">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Dnešní program') }}</h2>
          <router-link :to="{ name: 'Calendar' }" class="text-[14px] font-semibold text-[#4644d9]">{{ __('Kalendář') }}</router-link>
        </div>
        <GlEmptyState v-if="!data?.program.length" icon="cal" :title="__('Dnes nic v programu')" :text="__('Naplánujte schůzku nebo úkol, ať se tu ukáže.')" />
        <div class="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
        <component
          :is="programLink(item) ? 'router-link' : 'div'"
          v-for="item in data?.program"
          :key="item.kind + item.name"
          :to="programLink(item)"
          class="flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-white/65"
          :class="item.status === 'Done' ? 'opacity-55' : ''"
        >
          <div class="num w-14 text-[15px] font-bold text-ink-gray-9">{{ item.all_day ? __('Celý den') : hhmm(item.at) }}</div>
          <div class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="tone[item.kind]">
            <GlIcon :name="item.kind === 'event' ? 'cal' : 'check'" :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[16px] font-semibold text-ink-gray-9" :class="item.status === 'Done' ? 'line-through' : ''">{{ item.title }}</div>
            <div class="truncate text-[13px] text-ink-gray-5">{{ item.sub }}</div>
          </div>
          <span v-if="soon(item)" class="rounded-full bg-[rgba(91,91,246,.12)] px-3 py-1 text-[13px] font-semibold text-[#4644d9]">{{ soon(item) }}</span>
          <span class="w-14 text-right text-[13px] text-ink-gray-5">{{ item.kind === 'event' ? __('Schůzka') : __('Úkol') }}</span>
        </component>
        </div>
      </div>

      <div class="flex flex-col gap-4 lg:col-span-5">
        <!-- k vyřízení -->
        <div class="gl-card p-6">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('K vyřízení') }}</h2>
            <span v-if="overdueCount" class="text-[13px] font-semibold text-[#a82614]">{{ __('{0} po termínu', [overdueCount]) }}</span>
          </div>
          <GlEmptyState v-if="!data?.todo.length" icon="check" :title="__('Všechno hotovo')" :text="__('Na dnešek nemáte žádné úkoly. Pěkná práce.')" />
          <div v-for="t in (data?.todo || []).slice(0, TODO_LIMIT)" :key="t.name" class="flex items-center gap-3 rounded-2xl px-1 py-2.5">
            <button
              class="gl-check flex size-6 shrink-0 items-center justify-center rounded-full border-[1.75px] transition"
              :class="doneIds.has(t.name) ? 'gl-check-done border-[#5b5bf6] bg-[#5b5bf6] text-white' : 'border-[#8a90ae] bg-white/60'"
              :aria-label="__('Označit jako hotové')"
              @click="markDone(t)"
            >
              <svg v-if="doneIds.has(t.name)" class="gl-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10" /></svg>
            </button>
            <router-link
              :to="t.reference_docname ? { name: 'Lead', params: { leadId: t.reference_docname }, hash: '#tasks' } : { name: 'Tasks' }"
              class="min-w-0 flex-1 truncate text-[15px] font-medium"
              :class="doneIds.has(t.name) ? 'text-ink-gray-5 line-through' : 'text-ink-gray-9'"
            >
              {{ t.title }}
            </router-link>
            <span class="text-[13px] font-semibold" :class="t.overdue ? 'text-[#a82614]' : 'text-ink-gray-5'">{{ dueShort(t) }}</span>
          </div>
          <router-link v-if="(data?.todo?.length || 0) > TODO_LIMIT" :to="{ name: 'Tasks' }" class="mt-1 inline-block px-1 text-[14px] font-semibold text-[var(--accent-700)]">
            {{ __('Všechny úkoly ({0})', [data.todo.length]) }}
          </router-link>
        </div>

        <!-- nové zakázky -->
        <div class="gl-card p-6">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Nové zakázky') }}</h2>
            <router-link :to="{ name: 'Leads', params: { viewType: 'kanban' } }" class="text-[14px] font-semibold text-[#4644d9]">{{ __('Kanban') }}</router-link>
          </div>
          <router-link
            v-for="l in data?.newest"
            :key="l.name"
            :to="{ name: 'Lead', params: { leadId: l.name } }"
            class="flex items-center gap-3 rounded-2xl px-1 py-2.5 transition hover:bg-white/65"
          >
            <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2440a6]">{{ initials(l.organization || l.lead_name) }}</div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[15px] font-semibold text-ink-gray-9">{{ l.order_title || l.lead_name }}</div>
              <div class="truncate text-[13px] text-ink-gray-5">{{ [l.organization, l.territory].filter(Boolean).join(' · ') }}</div>
            </div>
            <div class="num text-[15px] font-bold text-ink-gray-9">{{ money(l.order_value) }}</div>
          </router-link>
        </div>

        <!-- výhry podle měsíců (design 3. kolo, 01) -->
        <div class="gl-card p-6">
          <div class="mb-4 flex items-baseline justify-between gap-3">
            <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Výhry podle měsíců') }}</h2>
            <span v-if="wins.data && !winsByMonth.some((m) => m.value)" class="text-[13px] text-ink-gray-5">{{ __('Zatím žádná výhra') }}</span>
          </div>
          <div class="flex h-[132px] items-end gap-4 border-b border-[rgba(110,120,200,.18)] px-1">
            <div v-for="m in winsByMonth" :key="m.key" class="relative flex h-full flex-1 flex-col items-center justify-end">
              <span
                v-if="m.current && m.value"
                class="num absolute z-[1] -translate-y-full whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink-gray-9 shadow-[0_4px_14px_-6px_rgba(40,50,120,.35)]"
                :style="{ bottom: `calc(${m.pct}% + 6px)` }"
              >{{ money(m.value) }}</span>
              <div
                class="w-full max-w-[44px] rounded-t-[10px] rounded-b-[4px]"
                :class="m.current ? 'bg-[var(--accent-600)]' : 'bg-[var(--accent-200)]'"
                :style="{ height: `max(${m.pct}%, 6px)` }"
                :title="money(m.value)"
              />
            </div>
          </div>
          <div class="mt-2 flex gap-4 px-1">
            <span v-for="m in winsByMonth" :key="m.key" class="flex-1 text-center text-[13px]" :class="m.current ? 'font-semibold text-ink-gray-9' : 'text-ink-gray-5'">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
</template>
<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
function programLink(item) {
  if (item.lead) return { name: 'Lead', params: { leadId: item.lead }, hash: item.kind === 'task' ? '#tasks' : '#activity' }
  if (item.org) return { name: 'Organization', params: { organizationId: item.org } }
  if (item.kind === 'event') return { name: 'Calendar' }
  return undefined
}
// GrowUp: úvodní stránka „Dnes“ (design Liquid Glass). Data: growupcrm.today.get_today.
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import LeadModal from '@/components/Modals/GlNewLeadModal.vue'
import { statusesStore } from '@/stores/statuses'
import { usersStore } from '@/stores/users'
import { Button, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, reactive, ref } from 'vue'

const { getUser } = usersStore()
const { leadStatuses } = statusesStore()

const scope = ref('mine')
const TODO_LIMIT = 5

// Výhry podle měsíců: vyhrané zakázky za posledních 5 měsíců (datum podpisu, jinak poslední změna)
const MONTHS = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const winsStart = (() => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - 4, 1)
})()
const wins = createResource({
  url: 'frappe.client.get_list',
  makeParams: () => ({
    doctype: 'CRM Lead',
    fields: ['signed_date', 'modified', 'order_value'],
    filters: {
      status: 'Vyhráno',
      modified: ['>=', `${winsStart.getFullYear()}-${String(winsStart.getMonth() + 1).padStart(2, '0')}-01`],
      ...(scope.value === 'mine' ? { lead_owner: sessionUser() } : {}),
    },
    limit_page_length: 1000,
  }),
  auto: true,
})
function sessionUser() {
  return getUser()?.name || ''
}
const winsByMonth = computed(() => {
  const now = new Date()
  const months = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], value: 0, current: i === 4 }
  })
  for (const r of wins.data || []) {
    const d = new Date(String(r.signed_date || r.modified).replace(' ', 'T'))
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.value += Number(r.order_value) || 0
  }
  const max = Math.max(...months.map((m) => m.value), 1)
  return months.map((m) => ({ ...m, pct: Math.round((m.value / max) * 100) }))
})
const scopes = [
  { value: 'mine', label: __('Moje') },
  { value: 'team', label: __('Celý tým') },
]
const res = createResource({
  url: 'growupcrm.today.get_today',
  makeParams: () => ({ scope: scope.value }),
  auto: true,
})
const data = computed(() => res.data)
import { watch } from 'vue'
watch(scope, () => (res.reload(), wins.reload()))

usePageMeta(() => ({ title: __('Dnes') }))

const now = new Date()
const dateLabel = computed(() => {
  const s = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const greeting = computed(() => {
  const h = now.getHours()
  const hello = h < 10 ? 'Dobré ráno' : h < 18 ? 'Dobrý den' : 'Dobrý večer'
  const first = (getUser()?.first_name || getUser()?.full_name || '').split(' ')[0]
  return first ? `${hello}, ${first}` : hello
})

const nf = new Intl.NumberFormat('cs-CZ')
const money = (v) => (v ? `${nf.format(v)} Kč` : '')
const cards = computed(() => {
  const k = data.value?.kpis
  if (!k) return []
  const diff = k.new_leads - k.new_leads_prev
  return [
    { label: __('Nové zakázky'), value: k.new_leads, delta: diff ? `${diff > 0 ? '+' : ''}${diff} ${__('oproti min.')}` : '', sub: __('tento týden') },
    { label: __('Schůzky v týdnu'), value: k.meetings_week, sub: __('z toho {0} dnes', [k.meetings_today]) },
    { label: __('Nabídky odeslané'), value: k.offers, sub: __('v hodnotě {0}', [money(k.offers_value)]) },
    { label: __('V jednání'), value: k.negotiation, sub: __('v hodnotě {0}', [money(k.negotiation_value)]) },
  ]
})

const tone = {
  event: 'bg-[rgba(59,110,246,.13)] text-[#1f48b8]',
  task: 'bg-[rgba(234,170,8,.18)] text-[#7a4400]',
}
const d = (iso) => new Date(String(iso).replace(' ', 'T'))
const hhmm = (iso) => `${d(iso).getHours()}:${String(d(iso).getMinutes()).padStart(2, '0')}`
const soon = (item) => {
  if (item.all_day) return ''
  const mins = Math.round((d(item.at) - new Date()) / 60000)
  return mins > 0 && mins <= 90 ? __('Za {0} min', [mins]) : ''
}
const overdueCount = computed(() => data.value?.todo.filter((t) => t.overdue).length || 0)
const dueShort = (t) => {
  const diff = Math.round((new Date(d(t.at).getFullYear(), d(t.at).getMonth(), d(t.at).getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
  if (diff === 0) return __('dnes')
  if (diff === -1) return __('včera')
  return __('před {0} dny', [-diff])
}
const initials = (s) => (s || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const doneIds = reactive(new Set())
async function markDone(t) {
  try {
    doneIds.add(t.name)
    let first = true
    await completeTaskWithUndo(t.name, t.title, () => {
      // po dokončení nechat chvíli dobíhat animaci zaškrtnutí, po „Zpět“ obnovit hned
      if (first) {
        first = false
        setTimeout(() => res.reload(), 900)
      } else {
        doneIds.delete(t.name)
        res.reload()
      }
    })
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

const showLeadModal = ref(false)
const leadDefaults = computed(() => ({ status: leadStatuses.data?.[0]?.name || 'Nová' }))
</script>
<style>
.gl-check-done {
  animation: gl-pop 0.5s var(--spring);
}
.gl-tick path {
  stroke-dasharray: 24;
  animation: gl-draw 0.35s ease-out 0.1s both;
}
@keyframes gl-pop {
  0% { transform: scale(1); }
  35% { transform: scale(0.8); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes gl-draw {
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
}
</style>
