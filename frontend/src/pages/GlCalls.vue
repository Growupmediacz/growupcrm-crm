<template>
  <!-- GrowUp (design 2. kolo, C3): Hovory – souhrn týdne, filtry výsledků, tabulka. Uložené pohledy zůstávají v CRM (CallLogs.vue). Data: growupcrm.worklists.get_calls -->
  <CrmCalls v-if="legacy" />
  <template v-else>
    <LayoutHeader>
      <template #left-header><h1 class="text-lg-medium">{{ __('Hovory') }}</h1></template>
      <template #right-header>
        <div v-if="res.data?.is_manager" class="gl-seg">
          <button class="gl-seg-btn" :class="scope === 'mine' && 'gl-seg-on'" @click="scope = 'mine'">{{ __('Moje') }}</button>
          <button class="gl-seg-btn" :class="scope === 'team' && 'gl-seg-on'" @click="scope = 'team'">{{ __('Celý tým') }}</button>
        </div>
        <Button variant="solid" iconLeft="phone" @click="showPick = true"><span class="hidden sm:inline">{{ __('Zapsat hovor') }}</span></Button>
      </template>
    </LayoutHeader>
    <div v-if="k" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div class="gl-card p-4 md:p-5"><div class="text-[14px] text-ink-gray-7">{{ periodTitle }}</div><div class="num text-[34px] font-bold leading-tight text-ink-gray-9 md:text-[42px]">{{ k.total }}</div><div class="text-[13px] text-ink-gray-5">{{ __('{0} odchozích · {1} příchozích', [k.outgoing, k.incoming]) }}</div></div>
        <div class="gl-card p-4 md:p-5"><div class="text-[14px] text-ink-gray-7">{{ __('Dovolal jsem se') }}</div><div class="num text-[34px] font-bold leading-tight text-ink-gray-9 md:text-[42px]">{{ k.reached }}</div><div class="text-[13px] text-ink-gray-5">{{ __('{0} % hovorů', [k.reached_pct]) }}</div></div>
        <div class="gl-card p-4 md:p-5"><div class="text-[14px] text-ink-gray-7">{{ __('Průměrná délka') }}</div><div v-if="k.avg_seconds" class="num text-[34px] font-bold leading-tight text-ink-gray-9 md:text-[42px]">{{ mmss(k.avg_seconds) }}</div><div v-else class="mt-2 text-[20px] font-semibold text-[var(--empty-color)]">{{ __('Bez dat') }}</div><div class="text-[13px] text-ink-gray-5">{{ __('jen dovolané hovory') }}</div></div>
        <div class="gl-card p-4 md:p-5"><div class="text-[14px] text-ink-gray-7">{{ __('Zavolat zpět') }}</div><div class="num text-[34px] font-bold leading-tight text-ink-gray-9 md:text-[42px]">{{ k.callbacks }}</div><div class="text-[13px] text-ink-gray-5">{{ k.next_callback ? __('nejbližší {0}', [whenLabel(k.next_callback)]) : __('nic nečeká') }}</div></div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex flex-wrap gap-2">
          <button v-for="o in OUTCOMES" :key="o.key" class="gl-chip flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium" :class="outcome === o.key && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="outcome = o.key">{{ o.label }}</button>
        </div>
        <label class="flex items-center gap-2 text-[14px]"><span class="text-ink-gray-5">{{ __('Období') }}:</span>
          <select v-model="period" class="gl-chip h-10 rounded-full px-3 text-[14px] font-semibold"><option value="week">{{ __('Tento týden') }}</option><option value="month">{{ __('30 dní') }}</option><option value="quarter">{{ __('90 dní') }}</option></select></label>
      </div>
      <div class="gl-card p-4 md:p-6">
        <p v-if="!res.data.items.length" class="py-12 text-center text-[14px] text-ink-gray-5">{{ __('V tomto období nejsou žádné hovory.') }}</p>
        <div v-else class="flex flex-col">
          <div class="hidden grid-cols-[110px_1.4fr_50px_130px_70px_1.6fr_40px] gap-3 pb-2 text-[12px] font-semibold text-ink-gray-5 md:grid"><span>{{ __('Kdy') }}</span><span>{{ __('Kontakt') }}</span><span>{{ __('Směr') }}</span><span>{{ __('Výsledek') }}</span><span>{{ __('Délka') }}</span><span>{{ __('Poznámka') }}</span><span>{{ __('Kdo') }}</span></div>
          <component :is="c.lead ? 'router-link' : 'div'" v-for="c in res.data.items" :key="c.name" :to="c.lead ? { name: 'Lead', params: { leadId: c.lead } } : undefined" class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-[rgba(110,120,200,.12)] py-3 md:grid-cols-[110px_1.4fr_50px_130px_70px_1.6fr_40px]">
            <span class="num hidden text-[13px] text-ink-gray-5 md:block">{{ whenLabel(c.when) }}</span>
            <span class="flex min-w-0 items-center gap-3"><span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2e4bb8]">{{ initials(c.person || c.org) }}</span><span class="min-w-0"><span class="block truncate text-[15px] font-bold text-ink-gray-9">{{ c.person || c.org }}</span><span class="block truncate text-[13px] text-ink-gray-5">{{ c.org }}</span></span></span>
            <span class="hidden text-ink-gray-5 md:block"><GlIcon :name="c.incoming ? 'down' : 'up'" :size="15" class="[transform:rotate(-45deg)]" /></span>
            <span><span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold" :class="TONE[c.kind]">{{ LABEL[c.kind] }}</span></span>
            <span class="num hidden text-[14px] text-ink-gray-9 md:block">{{ c.duration ? mmss(c.duration) : '' }}</span>
            <span class="gl-text col-span-2 truncate text-[13px] text-ink-gray-7 md:col-span-1">{{ c.note || __('Bez poznámky') }}</span>
            <span class="hidden size-8 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2e4bb8] md:flex" :title="userName(c.caller)">{{ initials(userName(c.caller)) }}</span>
          </component>
        </div>
        <GlListFooter v-if="res.data.items.length" class="mt-3" :modelValue="limit" :options="{ rowCount: res.data.items.length, totalCount: res.data.total }" @update:modelValue="(v) => (limit = v)" @loadMore="limit += 20" />
      </div>
    </div>
  </template>

  <Dialog v-model:open="showPick" :title="__('Zapsat hovor')">
    <template #default><span class="gl-label">{{ __('K jaké zakázce hovor patří?') }}</span><Link :value="pickLead" doctype="CRM Lead" :placeholder="__('Vyberte zakázku')" @change="onPick" /></template>
  </Dialog>
  <GlCallModal v-if="callLead" v-model="showCall" :lead="callLead" @saved="res.reload()" />
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlListFooter from '@/components/GlListFooter.vue'
import GlCallModal from '@/components/Modals/GlCallModal.vue'
import Link from '@/components/Controls/Link.vue'
import { usersStore } from '@/stores/users'
import { shortDateCz, formatTimeCz } from '@/utils/glDate'
import { Button, Dialog, call, createResource } from 'frappe-ui'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const CrmCalls = defineAsyncComponent(() => import('@/pages/CallLogs.vue'))
const route = useRoute()
const legacy = computed(() => (route.params.viewType && route.params.viewType !== 'list') || !!route.query.view)
const { getUser } = usersStore()

const OUTCOMES = [{ key: '', label: __('Vše') }, { key: 'reached', label: __('Dovolal') }, { key: 'no_answer', label: __('Nebral') }, { key: 'callback', label: __('Zavolat zpět') }]
const TONE = { reached: 'bg-[rgba(34,179,94,.16)] text-[#15803d]', no_answer: 'bg-[rgba(249,115,22,.15)] text-[#c2410c]', callback: 'bg-[rgba(224,161,0,.2)] text-[#915200]', other: 'bg-[rgba(110,120,200,.14)] text-[#4a5173]' }
const LABEL = { reached: __('Dovolal'), no_answer: __('Nebral'), callback: __('Zavolat zpět'), other: __('Jiné') }
const scope = ref('mine')
const outcome = ref('')
const period = ref('week')
const limit = ref(20)
const res = createResource({ url: 'growupcrm.worklists.get_calls', params: { scope: 'mine', period: 'week', limit: 20 }, auto: true })
watch([scope, outcome, period, limit], () => res.fetch({ scope: scope.value, outcome: outcome.value || undefined, period: period.value, limit: limit.value }))
const k = computed(() => res.data?.kpis)
const periodTitle = computed(() => ({ week: __('Hovory tento týden'), month: __('Hovory za 30 dní'), quarter: __('Hovory za 90 dní') })[period.value])

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const userName = (u) => getUser(u)?.full_name || u
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
function whenLabel(v) {
  const d = new Date(String(v).replace(' ', 'T'))
  return d.toDateString() === new Date().toDateString() ? `${__('dnes')} ${formatTimeCz(d)}` : `${shortDateCz(d)} ${formatTimeCz(d)}`
}

// Zapsat hovor: vybrat zakázku, pak dialog „Zapsat hovor“
const showPick = ref(false)
const showCall = ref(false)
const pickLead = ref('')
const callLead = ref(null)
async function onPick(name) {
  if (!name) return
  callLead.value = await call('frappe.client.get', { doctype: 'CRM Lead', name })
  showPick.value = false
  showCall.value = true
}
</script>
