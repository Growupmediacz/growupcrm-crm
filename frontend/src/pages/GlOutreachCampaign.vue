<template>
  <!-- GrowUp (design 2. kolo, O3): detail kampaně – kroky sekvence se statistikami a kontakty ve stavech -->
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="[{ label: __('Outreach'), route: { name: 'Outreach' } }, { label: __('Kampaně'), route: { name: 'Outreach', params: { tab: 'campaigns' } } }, { label: d?.campaign_name || '…' }]" />
    </template>
    <template #right-header>
      <Button iconLeft="edit-2" class="hidden sm:inline-flex" :label="__('Upravit sekvenci')" @click="showEdit = true" />
      <Button v-if="d?.status === 'Běží'" iconLeft="pause" :label="__('Pozastavit')" class="hidden sm:inline-flex" @click="setStatus('Pozastaveno')" />
      <Button v-else-if="d" iconLeft="play" :label="d.status === 'Koncept' ? __('Spustit') : __('Obnovit')" @click="setStatus('Běží')" />
      <Button variant="solid" iconLeft="plus" @click="showAdd = true"><span class="hidden sm:inline">{{ __('Přidat kontakty') }}</span></Button>
    </template>
  </LayoutHeader>

  <div v-if="res.error" class="px-4 py-10 text-center text-ink-gray-5">{{ res.error.messages?.[0] }}</div>
  <div v-else-if="d" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <div class="flex flex-wrap items-center gap-x-2 px-1 text-[14px] text-ink-gray-7">
      <span class="size-2 rounded-full" :style="{ background: STATUS[d.status] }" /><b class="text-ink-gray-9">{{ __(d.status) }}</b>
      <span v-if="d.start_date">· {{ __('od {0}', [formatDateCz(d.start_date)]) }}</span>
      <span>· {{ __('{0} kontaktů', [d.total]) }} · {{ __('odesílá se z vaší schránky po schválení') }}</span>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <div v-for="s in d.steps" :key="s.index" class="gl-card p-4">
        <div class="flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="TONE[s.step_type]"><GlIcon :name="ICON[s.step_type]" :size="18" /></span>
          <div class="min-w-0"><div class="truncate text-[15px] font-bold text-ink-gray-9">{{ s.index + 1 }}. {{ s.title || (s.step_type === 'E-mail' ? (s.index ? __('Follow-up') : __('Úvodní e-mail')) : s.step_type) }}</div>
            <div class="truncate text-[12px] text-ink-gray-5">{{ __('den {0}', [s.day_offset]) }} · {{ s.step_type === 'E-mail' ? (s.template_name ? __('šablona {0}', [s.template_name]) : '') : __('ručně') }}</div></div>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2">
          <template v-if="s.step_type === 'E-mail'">
            <div v-for="k in [[s.sent, __('odesláno')], [s.opened, __('otevřeno')], [s.replies, __('odpovědi')]]" :key="k[1]"><div class="num text-[22px] font-bold text-ink-gray-9">{{ k[0] }}</div><div class="text-[11px] text-ink-gray-5">{{ k[1] }}</div></div>
          </template>
          <template v-else>
            <div v-for="k in [[s.tasks, __('úkolů')], [s.done, __('hotovo')], [s.replies, __('odpovědi')]]" :key="k[1]"><div class="num text-[22px] font-bold text-ink-gray-9">{{ k[0] }}</div><div class="text-[11px] text-ink-gray-5">{{ k[1] }}</div></div>
          </template>
        </div>
      </div>
    </div>

    <div class="gl-card p-5 md:p-6">
      <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Kontakty v kampani') }}</h2>
      <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button class="gl-chip h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium" :class="filter === 'all' && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="filter = 'all'">{{ __('Vše') }} <span class="num ml-1 opacity-80">{{ d.total }}</span></button>
        <button v-for="(c, s) in d.counts" :key="s" class="gl-chip flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium" :class="filter === s && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="filter = s">
          <span class="size-2 rounded-full" :style="{ background: CONTACT_STATUS[s] }" />{{ __(s) }} <span class="num opacity-80">{{ c }}</span>
        </button>
      </div>
      <p v-if="!d.contacts.length" class="py-10 text-center text-[14px] text-ink-gray-5">{{ __('Žádné kontakty. Přidejte je z CRM, ze souboru CSV nebo podle IČO.') }}</p>
      <div v-else class="mt-2 flex flex-col">
        <div class="hidden grid-cols-[1.4fr_70px_130px_1.3fr_1fr] gap-3 pb-1 text-[12px] font-semibold text-ink-gray-5 md:grid"><span>{{ __('Kontakt') }}</span><span>{{ __('Krok') }}</span><span>{{ __('Stav') }}</span><span>{{ __('Poslední událost') }}</span><span>{{ __('Další') }}</span></div>
        <div v-for="c in d.contacts" :key="c.name" class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-t border-[rgba(110,120,200,.12)] py-2.5 first:border-0 md:grid-cols-[1.4fr_70px_130px_1.3fr_1fr]">
          <span class="flex min-w-0 items-center gap-3"><span class="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :style="avatarTone(c.contact_name)">{{ initials(c.contact_name) }}</span>
            <span class="min-w-0"><span class="block truncate text-[15px] font-bold text-ink-gray-9">{{ c.contact_name }}</span><span class="block truncate text-[13px] text-ink-gray-5">{{ c.organization_name }}</span></span></span>
          <span class="num hidden text-[14px] text-ink-gray-7 md:block">{{ c.step }} / {{ d.steps.length }}</span>
          <span class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-9"><span class="size-2 rounded-full" :style="{ background: CONTACT_STATUS[c.status] }" />{{ __(c.status) }}</span>
          <span class="col-span-2 truncate text-[13px] text-ink-gray-5 md:col-span-1">{{ c.last_event || __('čeká na schválení') }}</span>
          <span class="hidden truncate text-[13px] text-ink-gray-7 md:block">{{ c.next }}</span>
        </div>
      </div>
      <GlListFooter v-if="d.contacts.length" class="mt-3" :modelValue="pageLength" :options="{ rowCount: d.contacts.length, totalCount: d.filtered_total }" @update:modelValue="(v) => (pageLength = v)" @loadMore="pageLength += 20" />
    </div>
  </div>

  <GlAddContactsModal v-if="showAdd" v-model="showAdd" :campaign="name" :campaignName="d?.campaign_name" :total="d?.total || 0" @added="res.reload()" />
  <GlCampaignModal v-if="showEdit" v-model="showEdit" :campaign="name" @saved="res.reload()" />
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlListFooter from '@/components/GlListFooter.vue'
import GlAddContactsModal from '@/components/Outreach/GlAddContactsModal.vue'
import GlCampaignModal from '@/components/Outreach/GlCampaignModal.vue'
import { api, avatarTone, CONTACT_STATUS, initials } from '@/composables/outreach'
import { formatDateCz } from '@/utils/glDate'
import { Breadcrumbs, Button, createResource, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({ name: { type: String, required: true } })
const STATUS = { 'Běží': '#22b35e', Pozastaveno: '#e0a100', Koncept: '#9ca3af', 'Dokončeno': '#4338ca' }
const ICON = { 'E-mail': 'mail', Hovor: 'phone', LinkedIn: 'link' }
const TONE = { 'E-mail': 'bg-[rgba(20,160,190,.14)] text-[#0b7488]', Hovor: 'bg-[rgba(249,115,22,.14)] text-[#c2410c]', LinkedIn: 'bg-[rgba(79,70,229,.12)] text-[#4338ca]' }
const filter = ref('all')
const pageLength = ref(20)
const showAdd = ref(false)
const showEdit = ref(false)
const res = createResource({ url: 'growupcrm.outreach.get_campaign', params: { name: props.name, status: 'all', page_length: 20 }, auto: true })
const d = computed(() => res.data)
watch([filter, pageLength], () => res.fetch({ name: props.name, status: filter.value, page_length: pageLength.value }))

async function setStatus(status) {
  try {
    await api('set_campaign_status', { name: props.name, status })
    res.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
</script>
