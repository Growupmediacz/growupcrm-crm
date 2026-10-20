<template>
  <!-- GrowUp: Zdroje zakázek – přehled napojených zdrojů (growupcrm.lead_sources) + Formuláře a Facebook z CRM v jedné sekci -->
  <div class="flex h-full flex-col">
    <div class="flex flex-col gap-4 px-6 pt-6">
      <div>
        <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Zdroje zakázek') }}</h2>
        <p class="mt-1 text-p-base text-ink-gray-6">{{ __('Odkud do CRM přicházejí nové zakázky a co je kde napojené.') }}</p>
      </div>
      <div class="flex gap-1.5">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          class="gl-chip h-9 rounded-full px-3.5 text-[14px]"
          :class="tab === t.key && 'gl-chip-on'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div v-if="tab === 'overview'" class="flex flex-col gap-3 overflow-y-auto p-6">
      <GlSkeleton v-if="overview.loading && !overview.data" :rows="4" />
      <GlErrorBanner v-else-if="overview.error" :title="__('Přehled se nepodařilo načíst')" @retry="overview.reload()" />
      <div
        v-for="c in overview.data?.channels || []"
        v-else
        :key="c.key"
        class="gl-card flex flex-wrap items-center gap-4 !rounded-[20px] p-4"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(110,120,200,.12)] text-[#2440a6]">
          <GlIcon :name="ICONS[c.key] || 'link'" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[15px] font-bold text-ink-gray-9">{{ c.title }}</span>
            <span
              class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-semibold"
              :class="c.connected ? 'bg-[rgba(34,179,94,.12)] text-[#178a4a]' : 'bg-[rgba(110,120,200,.1)] text-ink-gray-6'"
            >
              <span class="size-1.5 rounded-full" :class="c.connected ? 'bg-[#22b35e]' : 'bg-ink-gray-4'" />
              {{ c.connected ? __('Napojeno') : __('Nenapojeno') }}
            </span>
          </div>
          <div class="mt-0.5 truncate text-[13px] text-ink-gray-7">{{ c.detail }}</div>
          <div class="mt-0.5 text-[12px] text-ink-gray-5">{{ c.how }}</div>
        </div>
        <div v-if="c.total !== null" class="text-right">
          <div class="text-[15px] font-bold text-ink-gray-9">{{ __('{0} za 30 dní', [c.last_30]) }}</div>
          <div class="text-[12px] text-ink-gray-5">
            {{ __('celkem {0}', [c.total]) }}<template v-if="c.last"> · {{ __('poslední {0}', [shortDate(c.last)]) }}</template>
          </div>
        </div>
        <Button v-if="c.key === 'forms'" :label="__('Formuláře')" @click="tab = 'forms'" />
        <Button v-else-if="c.key === 'facebook'" :label="c.connected ? __('Spravovat') : __('Napojit')" @click="tab = 'sync'" />
        <Button v-else-if="c.key === 'api' && isAdmin()" :label="c.connected ? __('Vydat nový klíč') : __('Vydat klíč')" :loading="issuing" @click="issueKey(c.connected)" />
      </div>
    </div>

    <div v-else-if="tab === 'forms'" class="min-h-0 flex-1">
      <FormsSettings />
    </div>
    <div v-else class="min-h-0 flex-1 overflow-y-auto">
      <!-- návod: co je potřeba k napojení Facebook / Instagram Lead Ads -->
      <details class="mx-6 mt-4 rounded-[18px] bg-[rgba(110,120,200,.08)] px-4 py-3 text-[13.5px] text-ink-gray-7" :open="!fbConnected">
        <summary class="cursor-pointer font-semibold text-ink-gray-9">{{ __('Jak napojit formuláře z reklam na Facebooku a Instagramu') }}</summary>
        <ol class="mt-2 list-decimal space-y-1 pl-5">
          <li>{{ __('Ve Facebook Business Manageru (Nastavení firmy → Uživatelé → Systémoví uživatelé) vytvořte systémového uživatele a přidělte mu Facebook stránku.') }}</li>
          <li>{{ __('Vygenerujte pro něj token s oprávněními leads_retrieval, pages_show_list, pages_read_engagement, pages_manage_metadata a ads_management (platnost: nikdy nevyprší).') }}</li>
          <li>{{ __('Tady klikněte na „Nový“, vložte token, vyberte stránku a formulář a namapujte otázky formuláře na pole zakázky (jméno, e-mail, telefon, firma…).') }}</li>
          <li>{{ __('Nastavte, jak často se mají kontakty stahovat (doporučeno každých 5 minut). Nové kontakty vzniknou jako zakázky se zdrojem „Facebook“, teplotou Horká a lhůtou na odpověď.') }}</li>
        </ol>
        <p class="mt-2 text-[12.5px] text-ink-gray-5">{{ __('Instagram Lead Ads používají formuláře Facebook stránky, napojují se stejně. Vlastníka zakázky určí Pravidla přiřazení.') }}</p>
      </details>
      <LeadSyncSourcePage />
    </div>
    <Dialog v-model:open="showKey" :options="{ size: 'lg', title: __('API klíč') }">
      <template #body-content>
        <div v-if="keys" class="flex flex-col gap-3 text-[13.5px]">
          <p class="rounded-xl bg-[rgba(224,161,0,.14)] px-3 py-2 text-[#7a4400]">{{ __('Tajemství se ukáže jen teď. Uložte ho do systému, který bude zakázky posílat. Předchozí klíč přestal platit.') }}</p>
          <div v-for="r in keyRows" :key="r.label">
            <div class="mb-1 text-xs text-ink-gray-5">{{ r.label }}</div>
            <div class="flex items-center gap-2">
              <code class="min-w-0 flex-1 truncate rounded-lg bg-white/80 px-2 py-1.5">{{ r.value }}</code>
              <Button icon="copy" variant="ghost" :aria-label="__('Kopírovat')" @click="copy(r.value)" />
            </div>
          </div>
          <p class="text-ink-gray-6">{{ __('Hlavička požadavku: Authorization: token <klíč>:<tajemství>, tělo JSON s poli first_name, last_name, email, mobile_no, organization, website, order_value, source.') }}</p>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import FormsSettings from '@/components/Settings/Forms/FormsSettings.vue'
import LeadSyncSourcePage from '@/components/Settings/LeadSyncing/LeadSyncSourcePage.vue'
import { usersStore } from '@/stores/users'
import { Button, Dialog, call, createResource, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const TABS = [
  { key: 'overview', label: __('Přehled') },
  { key: 'forms', label: __('Formuláře') },
  { key: 'sync', label: __('Facebook a Instagram') },
]
const ICONS = { web: 'globe', booking: 'cal', forms: 'doc', facebook: 'users', api: 'key' }

const tab = ref('overview')
const overview = createResource({ url: 'growupcrm.lead_sources.get_overview', auto: true })
watch(tab, (t) => t === 'overview' && overview.reload())

const { isAdmin } = usersStore()
const fbConnected = computed(() => overview.data?.channels?.find((c) => c.key === 'facebook')?.connected)

// API: vydání klíče integračního uživatele (growupcrm.api.issue_api_key)
const issuing = ref(false)
const showKey = ref(false)
const keys = ref(null)
const keyRows = computed(() =>
  keys.value
    ? [
        { label: __('Adresa (POST)'), value: keys.value.endpoint },
        { label: __('Klíč'), value: keys.value.api_key },
        { label: __('Tajemství'), value: keys.value.api_secret },
      ]
    : [],
)
async function issueKey(existing) {
  if (existing && !window.confirm(__('Vydat nový klíč? Systémy, které používají ten současný, přestanou fungovat, dokud nedostanou nový.'))) return
  issuing.value = true
  try {
    keys.value = await call('growupcrm.api.issue_api_key')
    showKey.value = true
    overview.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    issuing.value = false
  }
}
function copy(v) {
  navigator.clipboard?.writeText(v)
  toast.success(__('Zkopírováno'))
}

const shortDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'))
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
</script>
