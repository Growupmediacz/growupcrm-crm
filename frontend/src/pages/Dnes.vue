<template>
  <LayoutHeader>
    <template #left-header>
      <div class="flex flex-col leading-tight">
        <span class="text-[13px] font-semibold text-ink-gray-5 md:text-[16px] md:font-medium">{{ dateLabel }}</span>
        <h1 class="text-[22px] font-bold tracking-[-0.025em] text-ink-gray-9 md:text-[34px]">{{ greeting }}</h1>
      </div>
    </template>
    <template #right-header>
      <Button variant="solid" iconLeft="plus" @click="showLeadModal = true"
        ><span class="hidden md:inline">{{ __('Nová zakázka') }}</span></Button
      >
    </template>
  </LayoutHeader>

  <!-- GrowUp (zadání 2027 E3, návrh c): hlavní sloupec = fronta k vyřízení (jen moje věci, rozhodnutí Ivana);
       čísla, agent, program a výhry v pravém sloupci (na telefonu pod frontou). -->
  <div class="grid grid-cols-1 gap-6 px-3 pb-6 md:px-2 xl:grid-cols-[minmax(0,1fr)_360px]">
    <GlQueue @count="queueCount = $event" />

    <aside class="flex min-w-0 flex-col gap-4">
      <GlAgentStatus compact />

      <div class="grid grid-cols-2 gap-3">
        <div v-for="k in cards" :key="k.label" class="gl-card flex min-w-0 flex-col gap-1 p-4">
          <div class="text-[14px] text-ink-gray-7">{{ k.label }}</div>
          <div class="num text-[28px] font-medium leading-none tracking-tight text-ink-gray-9">{{ k.value }}</div>
          <div class="text-[13px] text-ink-gray-5">{{ k.sub }}</div>
        </div>
      </div>

      <div class="gl-card flex flex-col p-5">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[20px] font-semibold tracking-tight text-ink-gray-9">{{ __('Dnešní program') }}</h2>
          <router-link :to="{ name: 'Calendar' }" class="inline-flex min-h-[36px] items-center text-[14px] font-semibold text-[var(--accent-700)]">{{ __('Kalendář') }}</router-link>
        </div>
        <p v-if="data && !data.program.length" class="py-2 text-[14px] text-ink-gray-5">{{ __('Dnes nic v programu.') }}</p>
        <component
          :is="programLink(item) ? 'router-link' : 'div'"
          v-for="item in data?.program"
          :key="item.kind + item.name"
          :to="programLink(item)"
          class="flex min-h-[44px] items-center gap-3 rounded-2xl px-1 py-2 transition hover:bg-white/65"
          :class="item.status === 'Done' ? 'opacity-55' : ''"
        >
          <div class="num w-12 shrink-0 text-[14px] font-semibold text-ink-gray-9">{{ item.all_day ? __('Celý den') : hhmm(item.at) }}</div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[15px] font-medium text-ink-gray-9" :class="item.status === 'Done' ? 'line-through' : ''">{{ item.title }}</div>
            <div class="truncate text-[13px] text-ink-gray-5">{{ item.sub }}</div>
          </div>
          <span v-if="soon(item)" class="shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[13px] font-semibold text-[var(--accent-700)]">{{ soon(item) }}</span>
        </component>
      </div>

      <!-- výhry podle měsíců (design 3. kolo, 01) -->
      <div class="gl-card p-5">
        <div class="mb-4 flex items-baseline justify-between gap-3">
          <h2 class="text-[20px] font-semibold tracking-tight text-ink-gray-9">{{ __('Výhry podle měsíců') }}</h2>
          <span v-if="wins.data && !winsByMonth.some((m) => m.value)" class="text-[13px] text-ink-gray-5">{{ __('Zatím žádná výhra') }}</span>
        </div>
        <div class="flex h-[112px] items-end gap-3 border-b border-[var(--line)] px-1">
          <div v-for="m in winsByMonth" :key="m.key" class="relative flex h-full flex-1 flex-col items-center justify-end">
            <div
              class="w-full max-w-[40px] rounded-t-[10px] rounded-b-[4px]"
              :class="m.current ? 'bg-[var(--accent-600)]' : 'bg-[var(--accent-200)]'"
              :style="{ height: `max(${m.pct}%, 6px)` }"
              :title="money(m.value)"
            />
          </div>
        </div>
        <div class="mt-2 flex gap-3 px-1">
          <span v-for="m in winsByMonth" :key="m.key" class="flex-1 text-center text-[13px]" :class="m.current ? 'font-semibold text-ink-gray-9' : 'text-ink-gray-5'">{{ m.label }}</span>
        </div>
      </div>
    </aside>
  </div>

  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
</template>
<script setup>
import GlQueue from '@/components/Queue/GlQueue.vue'
import GlAgentStatus from '@/components/Agent/GlAgentStatus.vue'
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

// zadání 2027 E3: Dnes ukazuje jen moje věci (rozhodnutí Ivana), přepínač Moje / Celý tým se ruší
const scope = ref('mine')
const queueCount = ref(null)
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
  const hello = h < 10 ? __('Dobré ráno.') : h < 18 ? __('Dobrý den.') : __('Dobrý večer.')
  const n = queueCount.value
  if (n === null) return hello
  if (!n) return `${hello} ${__('Všechno je vyřízené.')}`
  return `${hello} ${n === 1 ? __('Čeká na vás 1 věc.') : n < 5 ? __('Čekají na vás {0} věci.', [n]) : __('Čeká na vás {0} věcí.', [n])}`
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
  event: 'bg-[color-mix(in_srgb,var(--c-blue-400)_13%,transparent)] text-[var(--info)]',
  task: 'bg-[color-mix(in_srgb,var(--c-amber-550)_18%,transparent)] text-[var(--warning)]',
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
