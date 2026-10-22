<template>
  <!-- GrowUp: modul Outreach (design 2. kolo O1, O5): přehled, ke schválení, odpovědi, kampaně, šablony.
       Data: growupcrm.outreach.* (jen správci, jen se zapnutým growupcrm_agency). -->
  <OutreachHeader :active="tab" :connected="!!ov?.connected" :sender="ov?.sender" :counts="ov?.counts || {}" @mailbox="openMailboxSettings" @newCampaign="showNew = true" />

  <GlForbidden v-if="overview.error && isForbidden(overview.error)" :message="overview.error.messages?.[0]" />
  <div v-else-if="overview.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Outreach se nepodařilo načíst')" :text="overview.error.messages?.[0]" @retry="overview.reload()" /></div>
  <div v-else-if="!ov" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else-if="ov" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <!-- upozornění: bez schránky nic neodejde -->
    <div v-if="!ov.connected" class="gl-card flex flex-wrap items-center justify-between gap-3 !rounded-[18px] px-5 py-3.5">
      <div class="text-[14px] text-ink-gray-7">
        <b class="text-ink-gray-9">{{ __('Schránka zatím není připojená.') }}</b>
        {{ __('E-maily odcházejí z vaší adresy a odpovědi chodí zpět do CRM. Bez schránky nic neodešleme.') }}
      </div>
      <Button variant="solid" :label="__('Připojit Gmail')" @click="openMailboxSettings" />
    </div>

    <!-- Přehled -->
    <template v-if="tab === 'overview'">
      <!-- design 3. kolo (11): měsíční čísla – odesláno, odpovědi, schůzky (otevření nesledujeme, Ivan 2026-10-22) -->
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-4">
        <div v-for="(k, i) in kpis" :key="k.label" class="gl-card flex min-w-0 items-start gap-4 p-4 md:p-5" :class="i === kpis.length - 1 && 'col-span-2 xl:col-span-1'">
          <!-- mobil: bez ikony, popisky se zalamují a číslo je menší, aby se nic neořezávalo; od md beze změny -->
          <span class="hidden size-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)] md:flex"><GlIcon :name="k.icon" :size="22" /></span>
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="flex items-start justify-between gap-2 md:items-center">
              <span class="text-[14px] font-semibold text-ink-gray-9 md:truncate md:text-[17px]">{{ k.label }}</span>
              <span v-if="k.badge" class="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent-600)_12%,transparent)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--accent-700)]">{{ k.badge }}</span>
            </div>
            <div class="num text-[26px] font-bold leading-tight tracking-tight text-ink-gray-9 md:truncate md:text-[46px]">{{ k.value }}<span v-if="k.unit" class="text-[18px] font-medium text-ink-gray-7 md:text-[28px]"> {{ k.unit }}</span></div>
            <div class="text-[13px] text-ink-gray-5 md:truncate md:text-[15px]">{{ k.sub }}</div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.9fr_1fr]">
        <CampaignsTable :rows="ov.campaigns" @new="showNew = true" />

        <!-- Dnes ke schválení: e-maily ke schválení i hovory a LinkedIn ke zpracování, s kanálem -->
        <div class="gl-card flex flex-col p-5 md:p-6">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="flex items-center gap-2.5 text-[28px] font-bold tracking-tight text-ink-gray-9">
              {{ __('Dnes ke schválení') }}
              <span v-if="todo.length" class="num rounded-full bg-[color-mix(in_srgb,var(--accent-600)_12%,transparent)] px-2.5 py-0.5 text-[16px] font-semibold text-[var(--accent-700)]">{{ ov.approve_total + ov.process.length }}</span>
            </h2>
            <span class="text-[14px] text-ink-gray-5">{{ __('Nic se neodešle samo.') }}</span>
          </div>
          <GlEmptyState v-if="!todo.length" icon="check" :title="__('Všechno vyřízeno')" :text="__('Další kroky se objeví, jakmile přijde čas podle sekvence kampaní.')" />
          <div class="flex flex-col gap-2.5">
            <component
              :is="t.kind === 'approve' ? 'router-link' : 'button'"
              v-for="t in todo"
              :key="t.name"
              :to="t.kind === 'approve' ? { name: 'OutreachReview', params: { name: t.name } } : undefined"
              class="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white/60 px-4 py-3 text-left hover:bg-white"
              @click="t.kind === 'process' && openProcess(t.raw)"
            >
              <span class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="CHANNEL[t.channel].tile"><GlIcon :name="CHANNEL[t.channel].icon" :size="20" /></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[16px] font-semibold text-ink-gray-9">{{ t.contact_name }}</span>
                <span class="block truncate text-[13.5px] text-ink-gray-5">{{ [t.organization, __('krok {0}', [t.step + 1])].filter(Boolean).join(' · ') }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium" :class="CHANNEL[t.channel].pill"><GlIcon :name="CHANNEL[t.channel].icon" :size="14" />{{ CHANNEL[t.channel].label }}</span>
              <GlIcon name="right" :size="16" class="shrink-0 text-ink-gray-4" />
            </component>
          </div>
          <div v-if="ov.approve_total" class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <router-link :to="{ name: 'OutreachReview', params: { name: ov.approve[0].name } }" class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent-600)] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(91,91,246,.7)]">
              <GlIcon name="check" :size="16" />{{ __('Schválit postupně ({0})', [ov.approve_total]) }}
            </router-link>
            <router-link :to="{ name: 'Outreach', params: { tab: 'approve' } }" class="text-[15px] font-semibold text-[var(--accent-600)] hover:underline">{{ __('Projít jednotlivě') }}</router-link>
          </div>
        </div>
      </div>
    </template>

    <!-- Ke schválení -->
    <div v-else-if="tab === 'approve'" class="gl-card flex flex-col p-5 md:p-6">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Ke schválení') }}</h2>
        <router-link v-if="queue.data?.length" :to="{ name: 'OutreachReview', params: { name: queue.data[0].name } }" class="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent-600)] px-4 text-[14px] font-semibold text-white">
          <GlIcon name="check" :size="15" />{{ __('Schvalovat postupně') }}
        </router-link>
      </div>
      <GlSkeleton v-if="queue.loading && !queue.data" :rows="4" />
      <GlEmptyState v-else-if="!queue.data?.length" icon="check" :title="__('Nic ke schválení')" :text="__('Pracovní fronta je prázdná.')" />
      <router-link v-for="m in queue.data || []" :key="m.name" :to="{ name: 'OutreachReview', params: { name: m.name } }" class="flex items-center gap-3 border-t border-[rgba(110,120,200,.12)] py-3 first:border-0">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :style="avatarTone(m.contact_name)">{{ initials(m.contact_name) }}</span>
        <div class="min-w-0 flex-1">
          <div class="truncate"><b class="text-[15px] text-ink-gray-9">{{ m.contact_name }}</b> <span class="text-[13px] text-ink-gray-5">{{ m.organization }} · {{ m.campaign_name }}</span></div>
          <div class="truncate text-[13px] text-ink-gray-7">{{ m.subject }}</div>
        </div>
        <span v-if="m.status === 'Odloženo'" class="rounded-full bg-[rgba(224,161,0,.2)] px-2.5 py-0.5 text-[12px] font-bold text-[#7a4400]">{{ __('Odloženo') }}</span>
        <GlIcon name="right" :size="16" class="text-ink-gray-4" />
      </router-link>
    </div>

    <!-- Odpovědi -->
    <RepliesTab v-else-if="tab === 'replies'" :selected="route.query.r" @changed="overview.reload()" />

    <!-- Kampaně -->
    <CampaignsTable v-else-if="tab === 'campaigns'" :rows="campaigns.data || []" @new="showNew = true" />

    <!-- Šablony -->
    <div v-else-if="tab === 'templates'" class="gl-card p-5 md:p-6">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Šablony') }}</h2>
        <router-link :to="{ name: 'OutreachTemplate', params: { name: 'new' } }" class="gl-fill">{{ __('Nová šablona') }}</router-link>
      </div>
      <router-link v-for="t in templates.data || []" :key="t.name" :to="{ name: 'OutreachTemplate', params: { name: t.name } }" class="flex items-center gap-3 border-t border-[rgba(110,120,200,.12)] py-3 first:border-0">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(110,120,200,.12)] text-ink-gray-7"><GlIcon :name="STEP_ICON[t.step_type]" :size="18" /></span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[15px] font-bold text-ink-gray-9">{{ t.template_name }}</div>
          <div class="truncate text-[13px] text-ink-gray-5">{{ t.step_type }}<template v-if="t.category"> · {{ t.category }}</template><template v-if="t.subject"> · {{ t.subject }}</template></div>
        </div>
        <GlIcon name="right" :size="16" class="text-ink-gray-4" />
      </router-link>
    </div>
  </div>

  <GlMailboxModal v-if="showMailbox" v-model="showMailbox" @changed="overview.reload()" />
  <GlCampaignModal v-if="showNew" v-model="showNew" @saved="(n) => router.push({ name: 'OutreachCampaign', params: { name: n } })" />
  <GlLinkedInModal v-if="linkedInOpen" v-model="linkedInOpen" :item="currentProcess" @done="finishProcess()" @skip="skipProcess" />
  <GlProcessCallModal v-if="callOpen" v-model="callOpen" :item="currentProcess" @done="finishProcess" />
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import OutreachHeader from '@/components/Outreach/OutreachHeader.vue'
import CampaignsTable from '@/components/Outreach/CampaignsTable.vue'
import RepliesTab from '@/components/Outreach/RepliesTab.vue'
import GlMailboxModal from '@/components/Outreach/GlMailboxModal.vue'
import { openMailboxSettings } from '@/composables/gmail'
import GlCampaignModal from '@/components/Outreach/GlCampaignModal.vue'
import GlLinkedInModal from '@/components/Outreach/GlLinkedInModal.vue'
import GlProcessCallModal from '@/components/Outreach/GlProcessCallModal.vue'
import GlIcon from '@/components/GlIcon.vue'
import { api, avatarTone, initials, plain, REPLY_LABEL } from '@/composables/outreach'
import { createResource, Button, toast, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Outreach') }))
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const STEP_ICON = { 'E-mail': 'mail', Hovor: 'phone', LinkedIn: 'link' }

const tab = computed(() => route.params.tab || 'overview')
const overview = createResource({ url: 'growupcrm.outreach.get_overview', auto: true })
const ov = computed(() => overview.data)
const queue = createResource({ url: 'growupcrm.outreach.get_queue', params: { status: 'Ke schválení' } })
const campaigns = createResource({ url: 'growupcrm.outreach.get_campaigns' })
const templates = createResource({ url: 'growupcrm.outreach.get_templates' })

watch(
  tab,
  (t) => {
    if (t === 'approve') queue.reload()
    if (t === 'campaigns') campaigns.reload()
    if (t === 'templates') templates.reload()
  },
  { immediate: true },
)

const isForbidden = (e) => /Permission|oprávnění|přístup|nejsou na tomto CRM zapnuté/i.test(`${e?.exc_type || ''} ${e?.messages?.[0] || ''} ${e?.message || ''}`)
const showMailbox = ref(false)
const showNew = ref(false)

// první věta z výzkumu webu zatím není, v náhledu ukážeme začátek textu
const preview = (m) => plain(m.body).replace(/^Dobrý den,[^,]*,\s*/, '').slice(0, 110)

// Ke zpracování: hovor otevře „Zapsat hovor“, LinkedIn jen označí hotovo po ruční zprávě
const callOpen = ref(false)
const linkedInOpen = ref(false)
const currentProcess = ref(null)
async function openProcess(m) {
  currentProcess.value = m
  if (m.step_type === 'Hovor') {
    callOpen.value = true
    return
  }
  // LinkedIn: dialog se zprávou ke zkopírování (design O9)
  linkedInOpen.value = true
}
async function skipProcess() {
  const m = currentProcess.value
  if (!m) return
  await api('skip', { name: m.name })
  currentProcess.value = null
  overview.reload()
}
async function finishProcess(extra = {}) {
  const m = currentProcess.value
  if (!m) return
  await api('complete_step', { name: m.name, ...extra })
  currentProcess.value = null
  overview.reload()
}

// design 3. kolo (11): dlaždice za aktuální měsíc
const MONTHS = ['lednu', 'únoru', 'březnu', 'dubnu', 'květnu', 'červnu', 'červenci', 'srpnu', 'září', 'říjnu', 'listopadu', 'prosinci']
const kpis = computed(() => {
  const k = ov.value?.kpis || {}
  return [
    { label: __('Odesláno v {0}', [__(MONTHS[new Date().getMonth()])]), icon: 'send', value: k.sent_month ?? 0, sub: __('tento týden {0} / {1}', [k.sent, k.limit]) },
    { label: __('Odpovědi'), icon: 'reply', value: k.reply_pct_month ?? '—', unit: k.reply_pct_month === null || k.reply_pct_month === undefined ? '' : '%', badge: k.replies_new ? __('{0} nové', [k.replies_new]) : '', sub: __('{0} odpovědí', [k.replies_month ?? 0]) },
    { label: __('Domluvené schůzky'), icon: 'cal', value: k.meetings ?? 0, sub: __('z outreach kampaní') },
  ]
})
const CHANNEL = {
  email: { label: __('E-mail'), icon: 'mail', tile: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)]', pill: 'bg-[color-mix(in_srgb,var(--accent-600)_9%,transparent)] text-[var(--accent-700)]' },
  call: { label: __('Hovor'), icon: 'phone', tile: 'bg-[rgba(249,115,22,.12)] text-[#c2410c]', pill: 'bg-[rgba(249,115,22,.1)] text-[#c2410c]' },
  linkedin: { label: __('LinkedIn'), icon: 'link', tile: 'bg-[rgba(10,102,194,.12)] text-[#0a66c2]', pill: 'bg-[rgba(10,102,194,.1)] text-[#0a66c2]' },
}
const todo = computed(() => [
  ...(ov.value?.approve || []).map((m) => ({ kind: 'approve', name: m.name, contact_name: m.contact_name, organization: m.organization, step: m.step_index, channel: 'email', raw: m })),
  ...(ov.value?.process || []).map((m) => ({ kind: 'process', name: m.name, contact_name: m.contact_name, organization: m.organization, step: m.step_index, channel: m.step_type === 'Hovor' ? 'call' : 'linkedin', raw: m })),
].slice(0, 5))
</script>
