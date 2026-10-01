<template>
  <!-- GrowUp: modul Outreach (design 2. kolo O1, O5): přehled, ke schválení, odpovědi, kampaně, šablony.
       Data: growupcrm.outreach.* (jen správci, jen se zapnutým growupcrm_agency). -->
  <OutreachHeader :active="tab" :connected="!!ov?.connected" :counts="ov?.counts || {}" @mailbox="showMailbox = true" @newCampaign="showNew = true" />

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
      <Button variant="solid" :label="__('Připojit schránku')" @click="showMailbox = true" />
    </div>

    <!-- Přehled -->
    <template v-if="tab === 'overview'">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
          <div class="flex items-baseline justify-between text-[14px] text-ink-gray-7">{{ __('Odesláno tento týden') }}<span class="text-[12px] text-ink-gray-5">{{ __('limit') }} {{ ov.kpis.limit }}</span></div>
          <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[42px]">{{ ov.kpis.sent }}<span class="text-[20px] font-medium text-ink-gray-5"> / {{ ov.kpis.limit }}</span></div>
          <div class="h-1.5 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><div class="h-full rounded-full bg-[#4F46E5]" :style="{ width: `${Math.min(100, (ov.kpis.sent * 100) / (ov.kpis.limit || 1))}%` }" /></div>
          <div class="text-[13px] text-ink-gray-5">{{ __('zbývá {0} e-mailů do neděle', [ov.kpis.remaining]) }}</div>
        </div>
        <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
          <div class="flex items-center justify-between text-[14px] text-ink-gray-7">{{ __('Odpovědi') }}
            <span v-if="ov.kpis.replies_new" class="rounded-full bg-[rgba(79,70,229,.12)] px-2 py-0.5 text-[12px] font-bold text-[#4338ca]">{{ ov.kpis.replies_new }} {{ __('nové') }}</span>
          </div>
          <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[42px]">{{ ov.kpis.replies_week }}</div>
          <div class="text-[13px] text-ink-gray-5">{{ __('tento týden') }}<template v-if="ov.kpis.sent"> · {{ ov.kpis.reply_pct }} % {{ __('z odeslaných') }}</template></div>
        </div>
        <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
          <div class="text-[14px] text-ink-gray-7">{{ __('Domluvené schůzky') }}</div>
          <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[42px]">{{ ov.kpis.meetings }}</div>
          <div class="text-[13px] text-ink-gray-5">{{ __('z odpovědí tento měsíc') }}</div>
        </div>
        <div class="gl-card flex flex-col gap-1 p-4 md:p-5">
          <div class="text-[14px] text-ink-gray-7">{{ __('Odhlášení') }}</div>
          <div class="num text-[34px] font-bold leading-tight tracking-tight text-ink-gray-9 md:text-[42px]">{{ ov.kpis.unsubs }}</div>
          <div class="text-[13px] text-ink-gray-5">{{ __('celkem {0} · už je neoslovíme', [ov.kpis.unsubs_total]) }}</div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <!-- Ke schválení -->
        <div class="gl-card flex flex-col gap-1 p-5 md:p-6">
          <div class="mb-1 flex items-baseline justify-between">
            <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Ke schválení') }}</h2>
            <span class="text-[13px] text-ink-gray-5">{{ ov.approve_total ? __('{0} čeká', [ov.approve_total]) : '' }}</span>
          </div>
          <GlEmptyState v-if="!ov.approve.length" icon="check" :title="__('Všechno schváleno')" :text="__('Další e-maily se objeví, jakmile přijde čas na další krok kampaní.')" />
          <div v-for="m in ov.approve" :key="m.name" class="flex items-center gap-3 py-2">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :style="avatarTone(m.contact_name)">{{ initials(m.contact_name) }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate"><b class="text-[15px] text-ink-gray-9">{{ m.contact_name }}</b> <span class="text-[13px] text-ink-gray-5">{{ m.organization }} · {{ __('krok {0}', [m.step_index + 1]) }} · {{ __('e-mail') }}</span></div>
              <div class="flex items-center gap-1.5 truncate text-[13px] text-ink-gray-5"><GlIcon name="sparkles" :size="13" class="shrink-0 text-[#6d3fd6]" /><span class="truncate">{{ preview(m) }}</span></div>
            </div>
            <router-link :to="{ name: 'OutreachReview', params: { name: m.name } }" class="gl-quick shrink-0">{{ __('Zkontrolovat') }}</router-link>
          </div>
          <div v-if="ov.approve_total" class="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span class="text-[13px] text-ink-gray-5">{{ ov.approve_total > ov.approve.length ? __('+ {0} další · ', [ov.approve_total - ov.approve.length]) : '' }}{{ __('každý e-mail schvalujete ručně') }}</span>
            <router-link :to="{ name: 'OutreachReview', params: { name: ov.approve[0].name } }" class="inline-flex h-11 items-center gap-2 rounded-full bg-[#4F46E5] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)]">
              <GlIcon name="check" :size="16" />{{ __('Schvalovat postupně') }}
            </router-link>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <!-- Ke zpracování -->
          <div class="gl-card p-5 md:p-6">
            <div class="mb-1 flex items-baseline justify-between">
              <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Ke zpracování') }}</h2>
              <span class="num text-[13px] text-ink-gray-5">{{ ov.process.length || '' }}</span>
            </div>
            <GlEmptyState v-if="!ov.process.length" icon="phone" :title="__('Nic ke zpracování')" :text="__('Hovory a zprávy na LinkedIn se objeví podle sekvence kampaně.')" />
            <div v-for="m in ov.process" :key="m.name" class="flex items-center gap-3 py-2">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="m.step_type === 'Hovor' ? 'bg-[rgba(249,115,22,.14)] text-[#c2410c]' : 'bg-[rgba(79,70,229,.12)] text-[#4338ca]'">
                <GlIcon :name="m.step_type === 'Hovor' ? 'phone' : 'link'" :size="18" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-[15px] font-bold text-ink-gray-9">{{ m.contact_name }}</div>
                <div class="truncate text-[13px] text-ink-gray-5">{{ m.organization }} · {{ __('krok {0}', [m.step_index + 1]) }} · {{ m.step_type }}</div>
              </div>
              <button class="gl-quick shrink-0" @click="openProcess(m)">{{ m.step_type === 'Hovor' ? __('Zapsat hovor') : __('Zpráva') }}</button>
            </div>
            <p v-if="ov.process.length" class="mt-2 text-[13px] text-ink-gray-5">{{ __('Hovory a LinkedIn se neodesílají samy – uděláte je ručně a odškrtnete.') }}</p>
          </div>

          <!-- Nové odpovědi -->
          <div class="gl-card p-5 md:p-6">
            <div class="mb-1 flex items-baseline justify-between">
              <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Nové odpovědi') }}</h2>
              <router-link :to="{ name: 'Outreach', params: { tab: 'replies' } }" class="gl-fill">{{ __('Všechny') }} ({{ ov.kpis.replies_new }})</router-link>
            </div>
            <GlEmptyState v-if="!ov.replies.length" icon="inbox" :title="__('Zatím žádné nové odpovědi')" :text="__('Odpovědi kontaktů se načítají každých 15 minut.')" />
            <router-link v-for="r in ov.replies" :key="r.name" :to="{ name: 'Outreach', params: { tab: 'replies' }, query: { r: r.name } }" class="flex items-center gap-3 py-2">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :style="avatarTone(r.contact_name)">{{ initials(r.contact_name) }}</span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-[15px] font-bold text-ink-gray-9">{{ r.contact_name }}</div>
                <div class="truncate text-[13px] text-ink-gray-5">„{{ plain(r.body) }}“</div>
              </div>
              <span v-if="r.reply_label" class="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold" :class="REPLY_LABEL[r.reply_label]">{{ r.reply_label === 'Automatická odpověď' ? __('Auto') : __(r.reply_label) }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <CampaignsTable :rows="ov.campaigns" @new="showNew = true" />
    </template>

    <!-- Ke schválení -->
    <div v-else-if="tab === 'approve'" class="gl-card flex flex-col p-5 md:p-6">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Ke schválení') }}</h2>
        <router-link v-if="queue.data?.length" :to="{ name: 'OutreachReview', params: { name: queue.data[0].name } }" class="inline-flex h-10 items-center gap-2 rounded-full bg-[#4F46E5] px-4 text-[14px] font-semibold text-white">
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
        <span v-if="m.status === 'Odloženo'" class="rounded-full bg-[rgba(224,161,0,.2)] px-2.5 py-0.5 text-[12px] font-bold text-[#915200]">{{ __('Odloženo') }}</span>
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
import GlCampaignModal from '@/components/Outreach/GlCampaignModal.vue'
import GlProcessCallModal from '@/components/Outreach/GlProcessCallModal.vue'
import GlIcon from '@/components/GlIcon.vue'
import { api, avatarTone, initials, plain, REPLY_LABEL } from '@/composables/outreach'
import { createResource, Button, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
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
const currentProcess = ref(null)
async function openProcess(m) {
  currentProcess.value = m
  if (m.step_type === 'Hovor') {
    callOpen.value = true
    return
  }
  // LinkedIn: zpráva ke zkopírování, pak potvrdit
  try {
    await navigator.clipboard?.writeText(plain(m.body))
    toast.success(__('Zpráva je zkopírovaná. Odešlete ji na LinkedInu a pak potvrďte.'))
  } catch {}
  if (window.confirm(__('Odeslali jste zprávu na LinkedInu?'))) finishProcess()
}
async function finishProcess(extra = {}) {
  const m = currentProcess.value
  if (!m) return
  await api('complete_step', { name: m.name, ...extra })
  currentProcess.value = null
  overview.reload()
}
</script>
